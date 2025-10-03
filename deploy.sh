#!/bin/bash

# 🚀 Script de déploiement Agent Skeleton OSS sur Coolify
# Usage: ./deploy.sh [environment]

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
PROJECT_NAME="agent-skeleton-oss"
DOCKER_IMAGE="agent-skeleton-oss:latest"

echo -e "${BLUE}🚀 Déploiement Agent Skeleton OSS${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}================================${NC}"

# Vérifications préliminaires
echo -e "${YELLOW}📋 Vérifications préliminaires...${NC}"

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas installé${NC}"
    exit 1
fi

# Vérifier les fichiers requis
required_files=("Dockerfile" "docker-compose.yml" "packages/orchestrator/package.json")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Fichier manquant: $file${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Vérifications OK${NC}"

# Build de l'image Docker
echo -e "${YELLOW}🔨 Build de l'image Docker...${NC}"
docker build -t $DOCKER_IMAGE . --no-cache

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build réussie${NC}"
else
    echo -e "${RED}❌ Échec du build${NC}"
    exit 1
fi

# Test local (optionnel)
if [ "$ENVIRONMENT" == "test" ]; then
    echo -e "${YELLOW}🧪 Test local...${NC}"
    
    # Arrêter les conteneurs existants
    docker-compose down 2>/dev/null || true
    
    # Démarrer en mode test
    docker-compose up -d
    
    # Attendre que le service soit prêt
    echo -e "${YELLOW}⏳ Attente du démarrage...${NC}"
    sleep 10
    
    # Test health check
    if curl -f http://localhost:3000/health &>/dev/null; then
        echo -e "${GREEN}✅ Service healthy${NC}"
        docker-compose logs --tail=20
    else
        echo -e "${RED}❌ Service non accessible${NC}"
        docker-compose logs
        exit 1
    fi
    
    echo -e "${GREEN}🎉 Test local réussi !${NC}"
    echo -e "${BLUE}Interface: http://localhost:3000${NC}"
    echo -e "${BLUE}App moderne: http://localhost:3000/app${NC}"
    
    exit 0
fi

# Déploiement production
echo -e "${YELLOW}🚀 Déploiement en production...${NC}"

# Tag pour production
PROD_TAG="$PROJECT_NAME:$(date +%Y%m%d-%H%M%S)"
docker tag $DOCKER_IMAGE $PROD_TAG

echo -e "${GREEN}✅ Image taguée: $PROD_TAG${NC}"

# Push vers registry (si configuré)
if [ ! -z "$DOCKER_REGISTRY" ]; then
    echo -e "${YELLOW}📤 Push vers registry...${NC}"
    docker tag $PROD_TAG $DOCKER_REGISTRY/$PROD_TAG
    docker push $DOCKER_REGISTRY/$PROD_TAG
    echo -e "${GREEN}✅ Push réussi${NC}"
fi

# Information de fin
echo -e "${GREEN}🎉 Déploiement terminé !${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}📋 Instructions Coolify:${NC}"
echo -e "${BLUE}1. Créez un nouveau projet 'agent-skeleton-oss'${NC}"
echo -e "${BLUE}2. Connectez votre repository Git${NC}"
echo -e "${BLUE}3. Configurez les variables d'environnement${NC}"
echo -e "${BLUE}4. Déployez !${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}📚 Voir DEPLOY_COOLIFY.md pour les détails${NC}"