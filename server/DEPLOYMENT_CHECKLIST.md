# Deployment Checklist - Fix CORS Issues

## ✅ Pre-Deployment Checklist

1. **Verify all files are saved**
   - ✅ `server/handler.mjs` - Has CORS headers with lowercase names
   - ✅ `server/app.js` - Error middleware has CORS headers
   - ✅ `server/controllers/Gemini.js` - All error responses have CORS headers
   - ✅ `server/serverless.yml` - Has `httpApi.cors: true` configuration

2. **Check API Key**
   - Verify `GEMINI_API_KEY` is set in environment or hardcoded in Gemini.js

## 🚀 Deployment Steps

### Step 1: Navigate to Server Directory
```powershell
cd server
```

### Step 2: Deploy to AWS
```powershell
npm run deploy:dev
```

**OR:**
```powershell
serverless deploy --stage dev
```

### Step 3: Wait for Completion
- Look for: `✔ Service deployed to stack`
- Note the endpoint URL (should be the same)
- Wait 1-2 minutes for propagation

### Step 4: Verify Deployment
Check that deployment completed successfully:
- ✅ No errors in deployment output
- ✅ Function name: `fittrack-backend-dev-api`
- ✅ Endpoint: `https://eiupslxog9.execute-api.us-east-1.amazonaws.com/{proxy+}`

## 🧪 Testing After Deployment

### Test 1: OPTIONS Request (Preflight)
```powershell
curl -X OPTIONS https://eiupslxog9.execute-api.us-east-1.amazonaws.com/api/generate -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: POST" -v
```

**Expected:** 
- Status: 200
- Headers include: `access-control-allow-origin: *`

### Test 2: POST Request
```powershell
curl -X POST https://eiupslxog9.execute-api.us-east-1.amazonaws.com/api/generate -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{\"prompt\":\"test\"}'
```

**Expected:**
- Status: 200 or 500 (but with CORS headers)
- Response includes CORS headers

### Test 3: Browser Test
1. Hard refresh browser (Ctrl+Shift+R)
2. Open DevTools (F12) → Network tab
3. Try the request
4. Check response headers for `access-control-allow-origin`

## 🔍 Troubleshooting

### If CORS Still Fails:

1. **Check CloudWatch Logs:**
   - AWS Console → CloudWatch → Log Groups
   - Find: `/aws/lambda/fittrack-backend-dev-api`
   - Look for errors or CORS-related logs

2. **Verify Function is Updated:**
   - AWS Console → Lambda → Functions
   - Find: `fittrack-backend-dev-api`
   - Check "Last modified" timestamp
   - Should be recent (within last few minutes)

3. **Check API Gateway:**
   - AWS Console → API Gateway
   - Find your HTTP API
   - Check CORS configuration
   - Verify routes are configured

4. **Test Endpoint Directly:**
   - Use curl or Postman
   - Check if endpoint responds at all
   - Look for CORS headers in response

### Common Issues:

**Issue:** "Function not found"
- **Solution:** Redeploy the function

**Issue:** "Timeout"
- **Solution:** Check Lambda timeout settings (should be at least 30s)

**Issue:** "Module not found"
- **Solution:** Run `npm install` in server directory before deploying

**Issue:** "CORS headers missing"
- **Solution:** Verify handler.mjs is returning headers correctly

## 📝 Current Configuration

- **CORS:** Enabled at provider level (`httpApi.cors: true`)
- **Headers:** Lowercase (required by HTTP API Gateway v2)
- **Error Handling:** All errors include CORS headers
- **Models:** Using Gemini 2.5 series (gemini-2.5-flash, gemini-2.5-pro)

## ✅ Success Indicators

After successful deployment and fix:
- ✅ No CORS error in browser console
- ✅ OPTIONS request returns 200 with CORS headers
- ✅ POST request returns response (even if 500, should have CORS headers)
- ✅ Browser Network tab shows `access-control-allow-origin` header

