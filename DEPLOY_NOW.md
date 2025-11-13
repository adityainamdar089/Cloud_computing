# Deploy Now - Quick Guide

## ✅ Yes, you should deploy!

All the fixes have been made to the code. You need to deploy to AWS Lambda to apply them.

## Quick Deployment Steps

### 1. Navigate to Server Directory
```powershell
cd server
```

### 2. Install Dependencies (if needed)
```powershell
npm install
```

### 3. Deploy to AWS
```powershell
serverless deploy
```

Or if you want to specify the stage:
```powershell
serverless deploy --stage dev
```

## What Will Be Deployed

✅ **Gemini 2.5 Models Only**
- Using `gemini-2.5-flash` and `gemini-2.5-pro` only
- Removed `gemini-2.0-flash-exp`

✅ **Improved Error Handling**
- Better quota error detection (429)
- Automatic fallback to next model on quota errors
- Clear error messages

✅ **CORS Fixes**
- Proper CORS headers on all responses
- Fixed duplicate CORS configuration

✅ **Route Configuration**
- Added 404 handler with helpful messages
- Added logging for debugging

✅ **API Key Configuration**
- GEMINI_API_KEY in environment variables

## After Deployment

1. **Wait 1-2 minutes** for API Gateway to propagate changes

2. **Test the endpoint:**
   ```powershell
   $body = @{
       prompt = "Generate a simple workout plan"
       model = "gemini-2.5-flash"
   } | ConvertTo-Json

   Invoke-RestMethod -Uri "https://eiupslxog9.execute-api.us-east-1.amazonaws.com/api/generate" `
       -Method POST `
       -Headers @{"Content-Type"="application/json"} `
       -Body $body
   ```

3. **Check CloudWatch Logs** if there are any issues:
   - AWS Console → CloudWatch → Log Groups
   - Find: `/aws/lambda/fittrack-backend-dev-api`

## Expected Result

- ✅ Route `/api/generate` should work
- ✅ Only Gemini 2.5 models will be used
- ✅ Better error messages for quota issues
- ✅ Automatic fallback between 2.5 models

## Troubleshooting

If deployment fails:
- Check AWS credentials are configured
- Verify you have permissions to deploy Lambda functions
- Check `serverless.yml` syntax is correct

If endpoint still doesn't work after deployment:
- Wait a few more minutes for propagation
- Check CloudWatch logs for errors
- Verify the API Gateway URL is correct
