# Guide de Test des Endpoints - Agent Skeleton OSS

Ce document fournit des exemples concrets pour tester tous les endpoints de l'orchestrateur.

## Prérequis

1. L'orchestrateur doit être démarré:
   ```powershell
   cd C:\Users\Admin\Downloads\agent-skeleton-oss\packages\orchestrator
   npm start
   ```

2. Fichier `.env` configuré avec les variables nécessaires

## 1. Health Check

### Test de santé des services
```powershell
# PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get

# Ou avec curl
curl http://localhost:3000/health
```

**Réponse attendue:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-11T...",
  "version": "1.0.0",
  "uptime": 123.45,
  "services": {
    "n8n": { "configured": true, "url": "https://n8n.kaussan-air.org" },
    "coolify": { "configured": true, "url": "https://kaussan-air.org" },
    "baserow": { "configured": true, "url": "http://baserow:80" },
    "videoToolkit": { "configured": true, "url": "http://video-toolkit:8080" }
  }
}
```

## 2. Endpoints n8n

### 2.1 Déclencher un workflow via Webhook

```powershell
# PowerShell - Content Creator Workflow
$body = @{
    topic = "Intelligence Artificielle"
    platform = "YouTube"
    tone = "éducatif"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/trigger/n8n/content-creator" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

```bash
# curl (Git Bash ou WSL)
curl -X POST http://localhost:3000/trigger/n8n/content-creator \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Intelligence Artificielle",
    "platform": "YouTube",
    "tone": "éducatif"
  }'
```

### 2.2 Exécuter un workflow via REST API

```powershell
# PowerShell
$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    inputData = @{
        topic = "Automatisation"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/run/workflow-id-123" `
    -Method Post `
    -Headers $headers `
    -Body $body
```

**Note:** Nécessite `N8N_API_KEY` configurée dans `.env`

## 3. Endpoints Coolify

### 3.1 Déclencher un déploiement

```powershell
# PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/coolify/deploy/service-123" `
    -Method Post `
    -ContentType "application/json"
```

```bash
# curl
curl -X POST http://localhost:3000/coolify/deploy/service-123
```

**Note:** Remplacez `service-123` par l'ID réel de votre service Coolify

## 4. Endpoints Baserow

### 4.1 Upload de données vers Baserow

```powershell
# PowerShell - Ajouter une ligne dans une table
$body = @{
    tableId = "12345"
    data = @{
        field_name = "Nouvelle vidéo"
        field_description = "Description du contenu"
        field_status = "En production"
        field_date = "2025-10-11"
    }
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "http://localhost:3000/baserow/upload" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

```bash
# curl
curl -X POST http://localhost:3000/baserow/upload \
  -H "Content-Type: application/json" \
  -d '{
    "tableId": "12345",
    "data": {
      "field_name": "Nouvelle vidéo",
      "field_description": "Description du contenu",
      "field_status": "En production"
    }
  }'
```

### 4.2 Récupérer des assets depuis Baserow

```powershell
# PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/baserow/assets?tableId=12345" `
    -Method Get
```

```bash
# curl
curl "http://localhost:3000/baserow/assets?tableId=12345"
```

## 5. Endpoints Toolkit Vidéo

### 5.1 Générer une vidéo

```powershell
# PowerShell
$body = @{
    text = "Ceci est un test de génération vidéo"
    voice = "fr-FR-Neural"
    addCaptions = $true
    addMusic = $true
    backgroundMusic = "upbeat"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/video/generate" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

```bash
# curl
curl -X POST http://localhost:3000/video/generate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Ceci est un test de génération vidéo",
    "voice": "fr-FR-Neural",
    "addCaptions": true,
    "addMusic": true,
    "backgroundMusic": "upbeat"
  }'
```

## 6. Workflow Complet - Brain Rotter 5000

Exemple de déclenchement du workflow complet de génération de contenu viral:

```powershell
# PowerShell
$body = @{
    topic = "Fun Facts sur les animaux"
    duration = 60
    style = "viral"
    platforms = @("TikTok", "YouTube Shorts", "Instagram Reels")
    autoPublish = $false
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/trigger/n8n/brain-rotter" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

## 7. Tests Automatisés avec Script PowerShell

Créez un fichier `test-endpoints.ps1`:

```powershell
# test-endpoints.ps1
$baseUrl = "http://localhost:3000"

Write-Host "🧪 Test 1: Health Check" -ForegroundColor Cyan
$health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
Write-Host "✅ Status: $($health.status)" -ForegroundColor Green
Write-Host ""

Write-Host "🧪 Test 2: n8n Webhook" -ForegroundColor Cyan
try {
    $n8nBody = @{ test = "data" } | ConvertTo-Json
    $n8nResult = Invoke-RestMethod -Uri "$baseUrl/trigger/n8n/test-webhook" `
        -Method Post -ContentType "application/json" -Body $n8nBody
    Write-Host "✅ n8n webhook OK" -ForegroundColor Green
} catch {
    Write-Host "❌ n8n webhook failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "🧪 Test 3: Baserow Assets" -ForegroundColor Cyan
try {
    $assets = Invoke-RestMethod -Uri "$baseUrl/baserow/assets?tableId=12345" -Method Get
    Write-Host "✅ Baserow OK" -ForegroundColor Green
} catch {
    Write-Host "❌ Baserow failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "🎉 Tests terminés!" -ForegroundColor Green
```

Exécutez avec:
```powershell
.\test-endpoints.ps1
```

## 8. Debugging et Logs

### Voir les logs en temps réel
```powershell
# PowerShell - suivre les logs
Get-Content -Path "C:\chemin\vers\logs\app.log" -Wait -Tail 50
```

### Format des logs
```
[2025-10-11T10:30:45.123Z] [n8n-webhook] Déclenchement: content-creator
📦 Data: { "topic": "IA", "platform": "YouTube" }
[2025-10-11T10:30:46.456Z] [n8n-webhook] ✅ Succès
```

## 9. Erreurs Courantes et Solutions

### Erreur: "N8N_API_KEY non configurée"
**Solution:** Ajoutez `N8N_API_KEY=votre-clé` dans `.env`

### Erreur: "ECONNREFUSED"
**Solution:** Vérifiez que le service cible (n8n/Coolify/Baserow) est accessible

### Erreur: 401/403
**Solution:** Vérifiez que les tokens API sont valides et non expirés

### Erreur: "Webhook test non enregistré"
**Solution:** Dans n8n, cliquez sur "Exécuter le workflow" pour activer le webhook

## 10. Collection Postman

Importez cette collection JSON dans Postman pour tester facilement:

```json
{
  "info": {
    "name": "Agent Skeleton OSS",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": "{{baseUrl}}/health"
      }
    },
    {
      "name": "Trigger n8n Webhook",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"topic\": \"Test\",\n  \"platform\": \"YouTube\"\n}"
        },
        "url": "{{baseUrl}}/trigger/n8n/content-creator"
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    }
  ]
}
```

## Support

En cas de problème, vérifiez:
1. Logs de l'orchestrateur
2. `/health` endpoint pour voir l'état des services
3. Configuration des variables d'environnement
4. Connectivité réseau vers les services externes
