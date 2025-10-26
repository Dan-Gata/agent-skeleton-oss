#!/bin/sh
# Script de diagnostic pour le conteneur Docker

echo "========================================="
echo "🔍 DIAGNOSTIC CONTENEUR DOCKER"
echo "========================================="
echo ""

echo "📦 Node version:"
node --version
echo ""

echo "📦 NPM version:"
npm --version
echo ""

echo "📂 Contenu /app:"
ls -la /app
echo ""

echo "📂 Contenu /app/packages:"
ls -la /app/packages 2>/dev/null || echo "Dossier packages manquant!"
echo ""

echo "📂 Contenu /app/packages/orchestrator:"
ls -la /app/packages/orchestrator 2>/dev/null || echo "Dossier orchestrator manquant!"
echo ""

echo "📄 Fichier package.json existe?"
test -f /app/package.json && echo "✅ /app/package.json existe" || echo "❌ /app/package.json MANQUANT"
echo ""

echo "📄 Fichier packages/orchestrator/package.json existe?"
test -f /app/packages/orchestrator/package.json && echo "✅ package.json orchestrator existe" || echo "❌ package.json orchestrator MANQUANT"
echo ""

echo "📄 Fichier packages/orchestrator/src/index.js existe?"
test -f /app/packages/orchestrator/src/index.js && echo "✅ index.js existe" || echo "❌ index.js MANQUANT"
echo ""

echo "🔍 Variables d'environnement (sécurisées):"
echo "NODE_ENV = ${NODE_ENV:-NOT_SET}"
echo "PORT = ${PORT:-NOT_SET}"
echo "OPENROUTER_API_KEY = ${OPENROUTER_API_KEY:+***SET***}"
echo ""

echo "========================================="
echo "✅ Diagnostic terminé"
echo "========================================="
