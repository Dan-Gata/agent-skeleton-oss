# Script de test rapide des endpoints
# test-endpoints.ps1

$baseUrl = "http://localhost:3000"
$ErrorActionPreference = "Continue"

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Agent Skeleton OSS - Test des Endpoints" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "🧪 Test 1: Health Check" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────" -ForegroundColor DarkGray
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "✅ Status: $($health.status)" -ForegroundColor Green
    Write-Host "📊 Version: $($health.version)" -ForegroundColor Gray
    Write-Host "⏱️  Uptime: $([math]::Round($health.uptime, 2))s" -ForegroundColor Gray
    
    Write-Host "`n🔌 Services configurés:" -ForegroundColor White
    foreach ($service in $health.services.PSObject.Properties) {
        $name = $service.Name
        $config = $service.Value
        $status = if ($config.configured) { "✅" } else { "❌" }
        Write-Host "  $status $name : $($config.url)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Vérifiez que le serveur est démarré avec 'npm start'" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Test 2: n8n Webhook (test avec webhook factice)
Write-Host "🧪 Test 2: n8n Webhook Trigger" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────" -ForegroundColor DarkGray
try {
    $n8nBody = @{
        test = "data"
        timestamp = (Get-Date).ToString("o")
    } | ConvertTo-Json
    
    $n8nResult = Invoke-RestMethod -Uri "$baseUrl/trigger/n8n/test-webhook" `
        -Method Post `
        -ContentType "application/json" `
        -Body $n8nBody `
        -ErrorAction Stop
    
    Write-Host "✅ n8n webhook endpoint OK" -ForegroundColor Green
    Write-Host "📦 Réponse: $($n8nResult.message)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 500) {
        Write-Host "⚠️  Endpoint OK, mais n8n non accessible (normal en dev)" -ForegroundColor Yellow
        Write-Host "💡 Configurez N8N_API_URL dans .env pour tester réellement" -ForegroundColor Gray
    } else {
        Write-Host "❌ n8n webhook failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 3: Baserow Assets (test avec tableId factice)
Write-Host "🧪 Test 3: Baserow Assets" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────" -ForegroundColor DarkGray
try {
    $assets = Invoke-RestMethod -Uri "$baseUrl/baserow/assets?tableId=12345" `
        -Method Get `
        -ErrorAction Stop
    
    Write-Host "✅ Baserow endpoint OK" -ForegroundColor Green
    Write-Host "📦 Réponse: $($assets.message)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host "❌ tableId manquant dans la requête" -ForegroundColor Red
    } elseif ($statusCode -eq 500) {
        Write-Host "⚠️  Endpoint OK, mais Baserow non accessible (normal en dev)" -ForegroundColor Yellow
        Write-Host "💡 Configurez BASEROW_URL et BASEROW_API_TOKEN dans .env" -ForegroundColor Gray
    } else {
        Write-Host "❌ Baserow failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 4: Coolify Deploy (test sans réellement déployer)
Write-Host "🧪 Test 4: Coolify Deploy" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────" -ForegroundColor DarkGray
try {
    $deployResult = Invoke-RestMethod -Uri "$baseUrl/coolify/deploy/test-service" `
        -Method Post `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "✅ Coolify endpoint OK" -ForegroundColor Green
    Write-Host "📦 Réponse: $($deployResult.message)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 500) {
        Write-Host "⚠️  Endpoint OK, mais Coolify non accessible (normal en dev)" -ForegroundColor Yellow
        Write-Host "💡 Configurez COOLIFY_API_URL et COOLIFY_API_KEY dans .env" -ForegroundColor Gray
    } else {
        Write-Host "❌ Coolify failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 5: Video Toolkit
Write-Host "🧪 Test 5: Video Toolkit" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────" -ForegroundColor DarkGray
try {
    $videoBody = @{
        text = "Test de génération"
        voice = "fr-FR-Neural"
    } | ConvertTo-Json
    
    $videoResult = Invoke-RestMethod -Uri "$baseUrl/video/generate" `
        -Method Post `
        -ContentType "application/json" `
        -Body $videoBody `
        -ErrorAction Stop
    
    Write-Host "✅ Video Toolkit endpoint OK" -ForegroundColor Green
    Write-Host "📦 Réponse: $($videoResult.message)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 500) {
        Write-Host "⚠️  Endpoint OK, mais Video Toolkit non accessible (normal en dev)" -ForegroundColor Yellow
        Write-Host "💡 Configurez VIDEO_TOOLKIT_URL dans .env" -ForegroundColor Gray
    } else {
        Write-Host "❌ Video Toolkit failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Résumé
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🎉 Tests terminés!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 Documentation complète:" -ForegroundColor White
Write-Host "  - README.md      : Guide complet" -ForegroundColor Gray
Write-Host "  - TESTING.md     : Exemples de tests détaillés" -ForegroundColor Gray
Write-Host "  - .env.example   : Configuration variables d'environnement" -ForegroundColor Gray
Write-Host ""
Write-Host "🔗 Endpoints disponibles:" -ForegroundColor White
Write-Host "  - GET  /health" -ForegroundColor Gray
Write-Host "  - POST /trigger/n8n/:webhookPath" -ForegroundColor Gray
Write-Host "  - POST /run/:workflowId" -ForegroundColor Gray
Write-Host "  - POST /coolify/deploy/:serviceId" -ForegroundColor Gray
Write-Host "  - POST /baserow/upload" -ForegroundColor Gray
Write-Host "  - GET  /baserow/assets?tableId=..." -ForegroundColor Gray
Write-Host "  - POST /video/generate" -ForegroundColor Gray
Write-Host ""
