# Local test script to simulate GitHub Actions workflow
Write-Host "Starting Local TAM MCP Server Workflow Test" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green

# Exit on any error
$ErrorActionPreference = "Stop"

try {
    Write-Host "Step 1: Building project..." -ForegroundColor Yellow
    npm run build
    Write-Host "Build completed successfully" -ForegroundColor Green

    Write-Host "Step 2: Running API health check..." -ForegroundColor Yellow
    npm run test:api-health
    Write-Host "API health check completed" -ForegroundColor Green

    Write-Host "Step 3: Running unit tests..." -ForegroundColor Yellow
    npm run test:unit
    Write-Host "Unit tests completed" -ForegroundColor Green

    Write-Host "Step 4: Running integration tests..." -ForegroundColor Yellow
    npm run test:integration
    Write-Host "Integration tests completed" -ForegroundColor Green

    Write-Host "Step 5: Starting HTTP server for Postman tests..." -ForegroundColor Yellow
    $env:PORT = 3000
    $job = Start-Job -ScriptBlock { 
        Set-Location $using:PWD
        $env:PORT = 3000
        npm run start:http 
    }
    Write-Host "Server started with Job ID: $($job.Id)" -ForegroundColor Blue

    # Wait for server to start
    Write-Host "Waiting for server to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10

    # Check if server is running
    Write-Host "Testing server health..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get
        if ($response.status -eq "healthy") {
            Write-Host "Server is healthy" -ForegroundColor Green
        } else {
            throw "Server health check failed"
        }
    } catch {
        Write-Host "Server health check failed: $_" -ForegroundColor Red
        throw
    }

    Write-Host "Step 6: Running Newman/Postman tests..." -ForegroundColor Yellow
    npx newman run examples/TAM-MCP-Server-Postman-Collection.json `
        --env-var serverUrl=http://localhost:3000 `
        --timeout-request 30000 `
        --delay-request 2000 `
        --bail
    Write-Host "Newman tests completed" -ForegroundColor Green

} catch {
    Write-Host "Test failed: $_" -ForegroundColor Red
    exit 1
} finally {
    # Clean up
    Write-Host "Cleaning up..." -ForegroundColor Yellow
    if ($job) {
        Stop-Job -Job $job -ErrorAction SilentlyContinue
        Remove-Job -Job $job -ErrorAction SilentlyContinue
    }
    # Also kill any remaining Node processes
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "Server stopped" -ForegroundColor Green
}

Write-Host ""
Write-Host "All tests completed successfully!" -ForegroundColor Green
Write-Host "Your workflow is ready for GitHub Actions!" -ForegroundColor Green
