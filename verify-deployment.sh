#!/bin/bash

# Script de vérification pour le déploiement Coolify
# Usage: ./verify-deployment.sh

set -e

echo "🔍 Vérification de la configuration pour Coolify..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteur de problèmes
ERRORS=0
WARNINGS=0

# Vérifier les fichiers requis
echo "📁 Vérification des fichiers requis..."

if [ -f "Dockerfile" ]; then
    echo -e "${GREEN}✅ Dockerfile trouvé${NC}"
else
    echo -e "${RED}❌ Dockerfile manquant${NC}"
    ERRORS=$((ERRORS + 1))
fi

if [ -f ".dockerignore" ]; then
    echo -e "${GREEN}✅ .dockerignore trouvé${NC}"
else
    echo -e "${YELLOW}⚠️  .dockerignore manquant (recommandé)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

if [ -f "package.json" ]; then
    echo -e "${GREEN}✅ package.json trouvé${NC}"
else
    echo -e "${RED}❌ package.json manquant${NC}"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "server.js" ]; then
    echo -e "${GREEN}✅ server.js trouvé${NC}"
else
    echo -e "${RED}❌ server.js manquant${NC}"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "src/index.js" ]; then
    echo -e "${GREEN}✅ src/index.js trouvé${NC}"
else
    echo -e "${RED}❌ src/index.js manquant${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "🧪 Test de démarrage du serveur..."

# Vérifier que node_modules existe
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installation des dépendances...${NC}"
    npm install --production
fi

# Tester le démarrage du serveur
echo "🚀 Démarrage du serveur en arrière-plan..."
PORT=3000 node server.js > /tmp/server.log 2>&1 &
SERVER_PID=$!

# Attendre que le serveur démarre
sleep 3

# Vérifier si le processus est toujours actif
if ps -p $SERVER_PID > /dev/null; then
    echo -e "${GREEN}✅ Serveur démarré avec succès (PID: $SERVER_PID)${NC}"
    
    # Tester le health check
    echo "🏥 Test du health check..."
    if curl -s -f http://localhost:3000/health > /dev/null; then
        echo -e "${GREEN}✅ Health check fonctionne${NC}"
        
        # Afficher la réponse
        echo "📊 Réponse du health check:"
        curl -s http://localhost:3000/health | jq '.' 2>/dev/null || curl -s http://localhost:3000/health
    else
        echo -e "${RED}❌ Health check échoue${NC}"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Tester l'API principale
    echo ""
    echo "🌐 Test de l'API principale..."
    if curl -s -f http://localhost:3000/ > /dev/null; then
        echo -e "${GREEN}✅ API principale fonctionne${NC}"
    else
        echo -e "${RED}❌ API principale échoue${NC}"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Arrêter le serveur
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
else
    echo -e "${RED}❌ Le serveur n'a pas démarré${NC}"
    echo "📋 Logs du serveur:"
    cat /tmp/server.log
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "📋 Vérification du Dockerfile..."

# Vérifier que le Dockerfile expose le port 3000
if grep -q "EXPOSE 3000" Dockerfile; then
    echo -e "${GREEN}✅ Port 3000 exposé dans le Dockerfile${NC}"
else
    echo -e "${RED}❌ Port 3000 non exposé dans le Dockerfile${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Vérifier la commande CMD
if grep -q 'CMD \["node", "server.js"\]' Dockerfile; then
    echo -e "${GREEN}✅ Commande de démarrage correcte${NC}"
else
    echo -e "${YELLOW}⚠️  Commande de démarrage non standard${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "================================"
echo "📊 RÉSUMÉ DE LA VÉRIFICATION"
echo "================================"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Prêt pour le déploiement Coolify !${NC}"
    echo ""
    echo "📝 Prochaines étapes:"
    echo "1. Poussez le code sur GitHub"
    echo "2. Créez une nouvelle application dans Coolify"
    echo "3. Sélectionnez Docker comme Build Pack"
    echo "4. Configurez le port 3000"
    echo "5. Ajoutez les variables d'environnement nécessaires"
    echo "6. Déployez !"
    exit 0
else
    echo -e "${RED}❌ $ERRORS erreur(s) détectée(s)${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  $WARNINGS avertissement(s)${NC}"
    fi
    echo ""
    echo "Corrigez les erreurs avant de déployer sur Coolify."
    exit 1
fi
