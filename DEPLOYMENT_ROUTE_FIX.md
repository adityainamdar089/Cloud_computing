# Route Not Found Fix - Deployment Guide

## Issue
Endpoint `/api/generate` returns "Endpoint not found" error.

## Root Cause Analysis

The route configuration is correct:
- ✅ `app.js` line 48: `app.use("/api", GeminiRoutes);`
- ✅ `routes/Gemini.js` line 6: `router.post("/generate", generateContent);`
- ✅ Full path: `/api/generate`

The `serverless.yml` has `/{proxy+}` which should catch all routes.

## Solution

### Step 1: Verify Route Configuration

The route is correctly configured. The issue is likely:
1. **Deployment not completed** - Changes need to be deployed
2. **API Gateway caching** - May need to wait a few minutes after deployment
3. **Path mismatch** - API Gateway might be adding a stage prefix

### Step 2: Deploy the Changes

```powershell
# Navigate to server directory
cd server

# Install dependencies (if needed)
npm install

# Deploy to AWS
serverless deploy

# Or deploy to specific stage
serverless deploy --stage dev
```

### Step 3: Verify Deployment

After deployment, check:

1. **Get the API endpoint URL:**
   ```powershell
   serverless info
   ```
   
   Look for the `endpoints` section. The URL should be something like:
   ```
   https://[api-id].execute-api.us-east-1.amazonaws.com
   ```

2. **Test the endpoint:**
   ```powershell
   $body = @{
       prompt = "Test prompt"
       model = "gemini-1.5-flash"
   } | ConvertTo-Json

   Invoke-RestMethod -Uri "https://eiupslxog9.execute-api.us-east-1.amazonaws.com/api/generate" `
       -Method POST `
       -Headers @{"Content-Type"="application/json"} `
       -Body $body
   ```

### Step 4: Check CloudWatch Logs

If still not working, check CloudWatch logs:
1. Go to AWS Console → CloudWatch → Log Groups
2. Find: `/aws/lambda/fittrack-backend-dev-api`
3. Look for:
   - `Handler called: POST /api/generate`
   - `Registering routes...`
   - `404 - Route not found: POST /api/generate`

## Changes Made

### 1. Added 404 Handler (`server/app.js`)
- Now returns proper JSON error with available routes
- Includes CORS headers

### 2. Added Logging (`server/handler.mjs`)
- Logs incoming requests (method, path)
- Logs event details for debugging

### 3. Added Route Registration Logging (`server/app.js`)
- Logs when routes are registered
- Helps verify routes are loaded

## Troubleshooting

### If route still not found after deployment:

1. **Check API Gateway Stage:**
   - The URL might need a stage prefix: `/dev/api/generate` or `/api/generate`
   - Check your `serverless.yml` stage setting

2. **Verify Lambda Function:**
   - AWS Console → Lambda → Functions
   - Find: `fittrack-backend-dev-api`
   - Check "Last modified" timestamp
   - Should be recent (within last few minutes)

3. **Check API Gateway Routes:**
   - AWS Console → API Gateway → HTTP APIs
   - Find your API
   - Check "Routes" section
   - Should show `/{proxy+}` route

4. **Test with curl/Postman:**
   ```bash
   curl -X POST https://eiupslxog9.execute-api.us-east-1.amazonaws.com/api/generate \
     -H "Content-Type: application/json" \
     -d '{"prompt":"test","model":"gemini-1.5-flash"}'
   ```

5. **Check for Stage Prefix:**
   If your API Gateway has a stage, try:
   - `/dev/api/generate` (if stage is "dev")
   - `/api/generate` (if no stage prefix)

## Expected Behavior After Fix

1. **Successful Request:**
   - Returns 200 with `{success: true, text: "...", model: "..."}`

2. **404 Error (if route truly not found):**
   - Returns 404 with:
     ```json
     {
       "success": false,
       "status": 404,
       "message": "Route not found: POST /api/generate",
       "availableRoutes": ["/api/generate", "/api/user/*", "/", "/test"]
     }
     ```

3. **CloudWatch Logs:**
   - Should show: `Handler called: POST /api/generate`
   - Should show: `Registering routes...`
   - Should show route registration messages

## Next Steps

1. **Deploy immediately:**
   ```powershell
   cd server
   serverless deploy
   ```

2. **Wait 1-2 minutes** for API Gateway to propagate changes

3. **Test the endpoint** using the PowerShell command above

4. **Check CloudWatch logs** if still not working

## Notes

- The route `/api/generate` is correctly configured
- The `/{proxy+}` catch-all in serverless.yml should handle it
- The issue is likely deployment-related, not code-related
- Added logging will help diagnose if the route is being hit

