# Script de démarrage pour Agent Skeleton OSS
Set-Location $PSScriptRoot
Write-Host "Démarrage de l'Agent Skeleton OSS..."
Write-Host "Dossier courant: $(Get-Location)"

if (Test-Path "src/index.js") {
    Write-Host "✅ Fichier index.js trouvé"
    node src/index.js
} else {
    Write-Host "❌ Fichier src/index.js non trouvé"
    exit 1
}