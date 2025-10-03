@echo off
REM 🚀 Script de déploiement Agent Skeleton OSS pour Windows
REM Usage: deploy.bat [environment]

setlocal enabledelayedexpansion

set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=production

set PROJECT_NAME=agent-skeleton-oss
set DOCKER_IMAGE=agent-skeleton-oss:latest

echo.
echo 🚀 Déploiement Agent Skeleton OSS
echo Environment: %ENVIRONMENT%
echo ================================
echo.

REM Vérifications préliminaires
echo 📋 Vérifications préliminaires...

REM Vérifier Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker n'est pas installé ou pas accessible
    pause
    exit /b 1
)

REM Vérifier les fichiers requis
if not exist "Dockerfile" (
    echo ❌ Fichier manquant: Dockerfile
    pause
    exit /b 1
)

if not exist "docker-compose.yml" (
    echo ❌ Fichier manquant: docker-compose.yml
    pause
    exit /b 1
)

if not exist "packages\orchestrator\package.json" (
    echo ❌ Fichier manquant: packages\orchestrator\package.json
    pause
    exit /b 1
)

echo ✅ Vérifications OK
echo.

REM Build de l'image Docker
echo 🔨 Build de l'image Docker...
docker build -t %DOCKER_IMAGE% . --no-cache

if errorlevel 1 (
    echo ❌ Échec du build
    pause
    exit /b 1
)

echo ✅ Build réussie
echo.

REM Test local si demandé
if "%ENVIRONMENT%"=="test" (
    echo 🧪 Test local...
    
    REM Arrêter les conteneurs existants
    docker-compose down 2>nul
    
    REM Démarrer en mode test
    docker-compose up -d
    
    REM Attendre que le service soit prêt
    echo ⏳ Attente du démarrage...
    timeout /t 10 /nobreak >nul
    
    REM Test health check
    curl -f http://localhost:3000/health >nul 2>&1
    if errorlevel 1 (
        echo ❌ Service non accessible
        docker-compose logs
        pause
        exit /b 1
    )
    
    echo ✅ Service healthy
    echo.
    echo 🎉 Test local réussi !
    echo Interface: http://localhost:3000
    echo App moderne: http://localhost:3000/app
    echo.
    echo Appuyez sur une touche pour arrêter le test...
    pause >nul
    docker-compose down
    exit /b 0
)

REM Tag pour production
for /f "tokens=2 delims==" %%I in ('wmic OS Get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%-%datetime:~8,6%
set PROD_TAG=%PROJECT_NAME%:%TIMESTAMP%
docker tag %DOCKER_IMAGE% %PROD_TAG%

echo ✅ Image taguée: %PROD_TAG%
echo.

REM Information de fin
echo 🎉 Déploiement terminé !
echo ================================
echo 📋 Instructions Coolify:
echo 1. Créez un nouveau projet 'agent-skeleton-oss'
echo 2. Connectez votre repository Git
echo 3. Configurez les variables d'environnement
echo 4. Déployez !
echo ================================
echo 📚 Voir DEPLOY_COOLIFY.md pour les détails
echo.
pause