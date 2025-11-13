import serverless from "serverless-http";

let cachedHandler;

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://fittrack-frontend.vercel.app'
];

// Function to get CORS headers based on request origin
// HTTP API Gateway v2 requires lowercase header names
const getCorsHeaders = (origin) => {
  // Check if origin is allowed, or allow all in development
  const allowOrigin = origin && allowedOrigins.includes(origin) 
    ? origin 
    : '*'; // Allow all origins for now (can restrict in production)
  
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'Content-Type,Authorization,X-Requested-With,Accept',
    'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
    'access-control-allow-credentials': 'true',
    'access-control-max-age': '86400',
    'content-type': 'application/json'
  };
};

export const handler = async (event, context) => {
  // Extract origin from request headers
  const origin = event.headers?.origin || event.headers?.Origin || '*';
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle OPTIONS preflight requests directly for HTTP API Gateway v2
  const httpMethod = event.requestContext?.http?.method || event.httpMethod;
  const path = event.requestContext?.http?.path || event.path || event.rawPath || '/';
  
  console.log('Handler called:', httpMethod, path);
  console.log('Event path:', event.path);
  console.log('Event rawPath:', event.rawPath);
  console.log('Event requestContext:', JSON.stringify(event.requestContext));
  
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({})
    };
  }

  if (!cachedHandler) {
    try {
      console.log('Initializing Express app...');
      const { default: app } = await import("./app.js");
      cachedHandler = serverless(app);
      console.log('Express app initialized successfully');
    } catch (initError) {
      console.error('Failed to initialize Express app:', initError);
      console.error('Init error stack:', initError.stack);
      return {
        statusCode: 503,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'Service initialization failed',
          message: initError.message || 'Failed to initialize application',
          type: 'InitializationError'
        })
      };
    }
  }

  try {
    // Set a timeout to prevent hanging requests
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 28000); // 28s timeout (Lambda is 30s)
    });

    const handlerPromise = cachedHandler(event, context);
    
    const result = await Promise.race([handlerPromise, timeoutPromise]);
    
    // serverless-http returns response in API Gateway format
    // Ensure CORS headers are present in the response
    if (!result) {
      console.error('No result from cachedHandler');
      return {
        statusCode: 503,
        headers: corsHeaders,
        body: JSON.stringify({ 
          success: false,
          error: 'No response from server',
          message: 'The server did not return a response'
        })
      };
    }
    
    // Normalize and merge headers
    const responseHeaders = result.headers || {};
    const normalizedHeaders = {};
    
    // Convert existing headers to lowercase (HTTP API Gateway v2 requirement)
    Object.keys(responseHeaders).forEach(key => {
      normalizedHeaders[key.toLowerCase()] = responseHeaders[key];
    });
    
    // Force add CORS headers (override to ensure they're present)
    Object.assign(normalizedHeaders, corsHeaders);
    
    // Ensure body is a string
    const body = typeof result.body === 'string' ? result.body : JSON.stringify(result.body || {});
    
    // Return response with normalized headers
    return {
      statusCode: result.statusCode || 200,
      headers: normalizedHeaders,
      body: body
    };
  } catch (error) {
    console.error('Handler error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    // Determine status code based on error type
    let statusCode = 500;
    if (error.message && error.message.includes('timeout')) {
      statusCode = 503;
    } else if (error.message && error.message.includes('initialization')) {
      statusCode = 503;
    }
    
    // Return error with CORS headers
    return {
      statusCode: statusCode,
      headers: corsHeaders,
      body: JSON.stringify({ 
        success: false,
        error: error.message || 'Internal server error',
        message: error.message || 'An error occurred processing your request',
        type: error.name || 'Error'
      })
    };
  }
};


