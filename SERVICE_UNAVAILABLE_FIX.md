# Service Unavailable (503) Error - Troubleshooting Guide

## Possible Causes

"Service Unavailable" (503) can occur due to:

1. **Lambda Function Not Initialized**
   - App failed to load/import
   - Missing dependencies
   - Syntax errors in code

2. **Lambda Timeout**
   - Request taking longer than 30 seconds
   - Gemini API taking too long to respond

3. **All Gemini Models Failed**
   - Quota exceeded on all models
   - All models overloaded
   - Network issues reaching Gemini API

4. **Deployment Issues**
   - Code not properly deployed
   - Missing environment variables
   - Lambda function not updated

## Fixes Applied

### 1. Improved Handler Error Handling
- Added try-catch around app initialization
- Better error messages for initialization failures
- Timeout protection (28s timeout before Lambda 30s limit)

### 2. Better Error Responses
- All errors now return proper JSON with CORS headers
- Clear error messages indicating the issue
- Status codes: 503 for service issues, 500 for other errors

## How to Diagnose

### Step 1: Check CloudWatch Logs

1. Go to AWS Console → CloudWatch → Log Groups
2. Find: `/aws/lambda/fittrack-backend-dev-api`
3. Look for recent logs and check for:
   - `Handler called: POST /api/generate`
   - `Initializing Express app...`
   - `Express app initialized successfully`
   - Any error messages

### Step 2: Check for Initialization Errors

Look for these in CloudWatch:
- `Failed to initialize Express app:`
- `Init error stack:`
- `Module not found`
- `SyntaxError`

### Step 3: Check for Timeout Errors

Look for:
- `Request timeout`
- `Task timed out`
- Lambda execution time > 30 seconds

### Step 4: Check Gemini API Errors

Look for:
- `Quota exceeded`
- `429 Too Many Requests`
- `503 Service Unavailable` (from Gemini)
- `All models were tried`

## Solutions

### If Initialization Failed:

1. **Check Dependencies:**
   ```powershell
   cd server
   npm install
   ```

2. **Verify Code Syntax:**
   - Check for any syntax errors
   - Ensure all imports are correct

3. **Redeploy:**
   ```powershell
   serverless deploy
   ```

### If Timeout:

1. **Check Gemini API Response Time:**
   - Gemini API might be slow
   - Check CloudWatch logs for response times

2. **Reduce Request Complexity:**
   - Shorter prompts
   - Lower maxOutputTokens

3. **Increase Lambda Timeout** (if needed):
   - Edit `serverless.yml`
   - Change `timeout: 30` to `timeout: 60`

### If All Models Failed:

1. **Check API Quota:**
   - Go to https://ai.dev/usage?tab=rate-limit
   - Check if quota is exceeded

2. **Wait and Retry:**
   - Quota resets periodically
   - Wait 15-30 minutes and try again

3. **Upgrade API Plan:**
   - If on free tier, consider upgrading
   - Check billing and quota limits

## Test After Fix

```powershell
$body = @{
    prompt = "Test prompt"
    model = "gemini-2.5-flash"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://eiupslxog9.execute-api.us-east-1.amazonaws.com/api/generate" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body
```

## Expected Behavior

### Success:
```json
{
  "success": true,
  "text": "...",
  "model": "gemini-2.5-flash"
}
```

### Quota Exceeded:
```json
{
  "success": false,
  "status": 503,
  "message": "Gemini API quota exceeded. Please check your API quota and billing. Tried models: gemini-2.5-flash, gemini-2.5-pro. Please wait before retrying or upgrade your plan."
}
```

### Service Unavailable:
```json
{
  "success": false,
  "status": 503,
  "message": "Gemini API models are currently overloaded. Please try again in a few moments. All models were tried: gemini-2.5-flash, gemini-2.5-pro"
}
```

## Next Steps

1. **Check CloudWatch Logs** - This will tell you exactly what's happening
2. **Verify Deployment** - Make sure latest code is deployed
3. **Test with Simple Request** - Use a short prompt to test
4. **Check API Quota** - Verify Gemini API quota status

The improved error handling will now provide clearer error messages to help diagnose the issue.

