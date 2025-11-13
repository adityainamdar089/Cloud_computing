# Test script to verify the API endpoint is working
# Run this in PowerShell: .\test-endpoint.ps1

$endpoint = "https://eiupslxog9.execute-api.us-east-1.amazonaws.com/api/generate"

Write-Host "Testing OPTIONS (preflight) request..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $endpoint -Method OPTIONS -Headers @{
        "Origin" = "http://localhost:3000"
        "Access-Control-Request-Method" = "POST"
    } -UseBasicParsing
    
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "CORS Headers:" -ForegroundColor Cyan
    $response.Headers | Format-Table
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`nTesting POST request..." -ForegroundColor Yellow
try {
    $body = @{
        prompt = "test"
        model = "gemini-2.5-flash"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri $endpoint -Method POST -Body $body -ContentType "application/json" -Headers @{
        "Origin" = "http://localhost:3000"
    } -UseBasicParsing
    
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Cyan
    $response.Content
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Yellow
    }
}

