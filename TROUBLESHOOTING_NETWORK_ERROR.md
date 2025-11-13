# Troubleshooting "Network error: Unable to connect to the server"

## Quick Checks

### 1. Check Browser Console (F12)
Open DevTools → Console tab and look for:
- CORS errors (red text about "Access-Control-Allow-Origin")
- Network errors
- 404 errors
- Any error messages

### 2. Check Network Tab
Open DevTools → Network tab:
- Look for the request to `/api/generate`
- Check the status code:
  - **200** = Success (but might have CORS issue)
  - **404** = Endpoint not found
  - **500** = Server error
  - **CORS error** = No response headers

### 3. Test the Endpoint Directly

**Test if endpoint exists:**
```powershell
curl https://eiupslxog9.execute-api.us-east-1.amazonaws.com/api/generate -X POST -H "Content-Type: application/json" -d '{"prompt":"test"}'
```

**Test CORS:**
```powershell
curl -X OPTIONS https://eiupslxog9.execute-api.us-east-1.amazonaws.com/api/generate -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: POST" -v
```

Look for `Access-Control-Allow-Origin` in the response headers.

## Common Issues & Solutions

### Issue 1: CORS Not Working
**Symptoms:** "Failed to fetch" or CORS error in console

**Solution:**
1. Make sure you've redeployed after CORS fixes:
   ```powershell
   cd server
   npm run deploy:dev
   ```

2. Verify CORS headers in handler.mjs are being returned

3. Check AWS Lambda function logs in CloudWatch

### Issue 2: Endpoint Not Found (404)
**Symptoms:** 404 error in Network tab

**Solution:**
- Verify the route is deployed: `/api/generate`
- Check serverless.yml has the correct path configuration
- Redeploy the function

### Issue 3: Server Not Responding
**Symptoms:** Request times out or no response

**Solution:**
- Check if Lambda function is deployed and active
- Check CloudWatch logs for errors
- Verify the API Gateway is configured correctly

### Issue 4: Function Error
**Symptoms:** 500 error or error in response

**Solution:**
- Check CloudWatch logs for Lambda execution errors
- Verify all dependencies are included in deployment
- Check if Gemini API key is configured

## Debug Steps

1. **Check if server is deployed:**
   ```powershell
   cd server
   serverless info
   ```

2. **Check CloudWatch logs:**
   - Go to AWS Console → CloudWatch → Log Groups
   - Find your Lambda function logs
   - Look for errors or CORS-related issues

3. **Test locally first:**
   ```powershell
   cd server
   serverless offline
   ```
   Then test with: `http://localhost:3000/api/generate`

4. **Verify environment variables:**
   - Make sure `GEMINI_API_KEY` is set in serverless.yml or Lambda environment

## Most Likely Issue: CORS

If you're getting "Failed to fetch", it's most likely a CORS issue. The handler.mjs should be handling this, but make sure:

1. ✅ Handler returns CORS headers for all responses
2. ✅ Handler handles OPTIONS requests
3. ✅ Serverless function is redeployed with latest code

## Next Steps

1. **Redeploy the serverless function:**
   ```powershell
   cd server
   npm run deploy:dev
   ```

2. **Check browser console** for specific error messages

3. **Test the endpoint** using curl to see if it's a CORS or server issue

4. **Check CloudWatch logs** for server-side errors

