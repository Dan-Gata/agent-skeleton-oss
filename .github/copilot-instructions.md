# Agent Skeleton OSS - Instructions pour les Agents IA

## Mission & Objectif Principal

**Agent d'automatisation multi-services** pour l'orchestration complète de contenus et déploiements :
- **Workflows n8n** : Content Creator, Brain Rotter 5000 (génération vidéo/audio)
- **Baserow** : stockage métadonnées, assets, fichiers média
- **Coolify** : déploiement automatisé et gestion infra
- **Réseaux sociaux** : publication multi-plateformes (YouTube, TikTok, Instagram, X, LinkedIn, Pinterest, Threads)
- **Toolkit vidéo** : TTS, captions, concat/merge, musique de fond

## Architecture Cible

### Structure Principale
```
agent-skeleton-oss/
├── apps/desktop/          # Interface Tauri/React (frontend)
├── packages/
│   ├── orchestrator/      # Serveur Express principal (port 3000)
│   │   ├── src/index.js   # Point d'entrée avec endpoints REST
│   │   └── Dockerfile     # Conteneurisation pour Coolify
│   ├── connectors/        # Connecteurs vers services externes
│   │   ├── n8n/          # Workflows et intégrations sociales
│   │   ├── coolify/      # Déploiement et gestion infra
│   │   └── docker/       # Conteneurisation
│   └── shared/           # Types et utilitaires partagés
```

### Flux d'Architecture
```
[Utilisateur] → [Orchestrateur] → [n8n Workflows] → [Toolkit vidéo/Baserow/Réseaux sociaux]
[GitHub] → [Coolify] → [Déploiement containers] → [Services en production]
```

## Configuration Environnement Complète

### Variables d'Environnement Critiques
```env
# Serveur
PORT=3000
NODE_ENV=development

# n8n Integration
N8N_API_URL=https://n8n.votre-domaine.tld
N8N_API_KEY=xxxxxxxx                    # Optionnel pour REST API

# Coolify (DevOps)
COOLIFY_API_URL=https://coolify.votre-domaine.tld
COOLIFY_API_KEY=token-coolify

# Baserow (Données & Assets)
BASEROW_URL=http://baserow:80           # URL interne Docker ou publique
BASEROW_API_TOKEN=token-baserow

# Toolkit Vidéo
VIDEO_TOOLKIT_URL=http://video-toolkit:8080

# URLs actuelles (production)
N8N_API_URL=https://n8n.kaussan-air.org
COOLIFY_API_URL=https://kaussan-air.org
```

### ⚠️ **Conventions URL Docker**
- **Développement local** : `host.docker.internal`
- **Production Coolify** : Noms de services (`http://baserow:80`) ou URLs publiques

## Endpoints API de l'Orchestrateur

### Endpoints Essentiels Implémentés
- **GET** `/` - Informations API et documentation
- **GET** `/health` - État des services connectés (Coolify, n8n configurés)

### Endpoints à Implémenter (Critiques)

#### 🎯 **n8n Workflows**
```javascript
// Déclencher workflow via webhook
POST /trigger/n8n/:webhookPath
// Body: JSON data pour le workflow
// → POST N8N_API_URL/webhook/:webhookPath

// Exécuter workflow via REST API (optionnel)
POST /run/:workflowId
// Headers: Authorization: Bearer N8N_API_KEY
// → POST N8N_API_URL/rest/workflows/:workflowId/run
```

#### 🚀 **Coolify Déploiements**
```javascript
// Déclencher déploiement d'un service
POST /coolify/deploy/:serviceId
// Headers: Authorization: Bearer COOLIFY_API_KEY
```

### Workflows n8n Clés à Intégrer

#### **Content Creator**
- Inclut des Tool Workflows (GET BRAND BRIEFLY, feedback tools)
- Execute Workflow pour génération d'idées de contenu
- **Vérifier** : workflows référencés existent et sont activés

#### **Brain Rotter 5000**
- Utilise endpoints HTTP du toolkit vidéo
- Upload fichiers vers Baserow
- Tables/fields Baserow pour persister pistes et assets
- **Attention** : URLs internes à corriger pour production

## Workflows de Développement

### 🔧 **Développement Local**
```bash
# Configuration initiale
cd packages/orchestrator
npm install express axios dotenv nodemon

# Créer .env avec toutes les variables (section Configuration)
npm run dev              # Démarre avec nodemon
# ou
npm start               # Production

# Tests essentiels
curl http://localhost:3000/health
curl -X POST http://localhost:3000/trigger/n8n/webhook-test -H "Content-Type: application/json" -d '{}'
```

### 🚀 **Déploiement Production (Coolify)**

#### Pré-requis Repo GitHub
- ✅ `Dockerfile` avec `EXPOSE 3000`
- ✅ `.dockerignore` (node_modules, .git)
- ✅ `packages/orchestrator` comme Base Directory

#### Procédure Coolify
1. **New Resource** → **Application** → **Git** (URL repo)
2. **Base Directory** : `packages/orchestrator`
3. **Build Pack** : Dockerfile
4. **Port** : 3000
5. **Environment Variables** : Toutes les variables de la section Configuration
6. **Deploy** → Vérifier logs → Tester `/health`

## Intégrations Critiques

### 📹 **Toolkit Vidéo (HTTP)**
```javascript
// Endpoints locaux pour :
// - TTS (Text-to-Speech)
// - Captions/sous-titres
// - Concat/merge vidéo
// - Musique de fond
const videoToolkitClient = axios.create({
    baseURL: process.env.VIDEO_TOOLKIT_URL || 'http://video-toolkit:8080'
});
```

### 🗄️ **Baserow (Assets & Métadonnées)**
```javascript
// Stockage des :
// - Métadonnées de contenu
// - Assets média (upload API)
// - Liens de publication
// - Analytics et statuts
const baserowClient = axios.create({
    baseURL: process.env.BASEROW_URL,
    headers: {
        'Authorization': `Token ${process.env.BASEROW_API_TOKEN}`,
        'Content-Type': 'application/json'
    }
});
```

### 📱 **Réseaux Sociaux (via n8n)**
**Plateformes supportées** :
- YouTube (upload, analytics)
- TikTok (publication, engagement)
- Instagram (posts, stories)
- X/Twitter (threads, médias)
- LinkedIn (articles, posts)
- Pinterest (épingles, tableaux)
- Threads (publication croisée)

**Checklist OAuth/API** :
- ✅ Comptes connectés avec scopes upload/analytics
- ✅ Modèles de contenu (titres, descriptions, hashtags)
- ✅ Planning & quotas API respectés
- ✅ Formats d'assets par plateforme
- ✅ Validation humaine optionnelle
- ✅ Logs des publications dans Baserow

## Conventions de Code & Patterns

### Structure des Connecteurs
Chaque connecteur dans `packages/connectors/` suit ce pattern :
```javascript
// packages/connectors/{service}/index.js
class ServiceConnector {
    constructor(config) {
        this.client = axios.create({
            baseURL: config.baseURL,
            headers: { /* auth headers */ }
        });
    }

    async executeAction(params) {
        // Logique spécifique au service
    }
}
```

### Clients API Préconfigurés
```javascript
// Dans packages/orchestrator/src/index.js
const coolifyClient = axios.create({
    baseURL: process.env.COOLIFY_API_URL,
    headers: {
        'Authorization': `Bearer ${process.env.COOLIFY_API_KEY}`,
        'Content-Type': 'application/json'
    }
});

const n8nClient = axios.create({
    baseURL: process.env.N8N_API_URL,
    headers: {
        'X-N8N-API-KEY': process.env.N8N_API_KEY,
        'Content-Type': 'application/json'
    }
});

// À ajouter
const baserowClient = axios.create({
    baseURL: process.env.BASEROW_URL,
    headers: {
        'Authorization': `Token ${process.env.BASEROW_API_TOKEN}`,
        'Content-Type': 'application/json'
    }
});

const videoToolkitClient = axios.create({
    baseURL: process.env.VIDEO_TOOLKIT_URL
});
```

### Gestion d'Erreurs Standardisée
```javascript
// Pattern utilisé dans tous les endpoints
try {
    const response = await serviceClient.post('/endpoint', data);
    res.json({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
    });
} catch (error) {
    console.error(`[${new Date().toISOString()}] [${serviceName}] Error:`, error.message);
    res.status(500).json({
        success: false,
        error: 'Service unavailable',
        service: serviceName,
        message: error.response?.data?.message || error.message,
        timestamp: new Date().toISOString()
    });
}
```

## Sécurité & Production

### 🔐 **Secrets Management**
- ❌ **JAMAIS** commiter `.env` dans le repo
- ✅ Utiliser variables d'environnement Coolify pour la production
- ✅ Régénérer tokens régulièrement (Coolify/Baserow/n8n)
- ✅ Stocker dans un coffre de secrets pour backup

### 🛡️ **Sécurisation des Endpoints**
```javascript
// Middleware d'authentification à implémenter
const authenticateAPI = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// Utilisation sur endpoints sensibles
app.post('/trigger/n8n/:webhookPath', authenticateAPI, async (req, res) => {
    // Code du endpoint
});
```

### 🌐 **Production Checklist**
- ✅ HTTPS partout (Coolify gère SSL automatiquement)
- ✅ Variables d'environnement configurées
- ✅ IP allowlist si nécessaire
- ✅ Rate limiting sur endpoints publics
- ✅ Monitoring et logs centralisés

## Debugging & Dépannage

### 🐛 **Erreurs Fréquentes**

#### **Webhook n8n 404 GET**
- **Problème** : URL webhook ouverte dans navigateur (GET au lieu de POST)
- **Solution** : Utiliser l'orchestrateur avec POST

#### **Webhook test non enregistré**
- **Problème** : Workflow n8n pas activé
- **Solution** : Cliquer "Exécuter le workflow" dans n8n pour `/webhook-test/...`

#### **host.docker.internal introuvable en prod**
- **Problème** : URL de développement en production
- **Solution** : Remplacer par nom de service (`http://baserow:80`) ou URL publique

#### **401/403 Coolify**
- **Problème** : Token invalide ou droits insuffisants
- **Solution** : Vérifier `COOLIFY_API_KEY` et permissions

#### **Échec build Docker**
- **Problème** : Dockerfile ou structure incorrecte
- **Solution** : Vérifier `COPY . .`, `WORKDIR`, `EXPOSE 3000`, `package.json` présent

### 📊 **Logs & Monitoring**
```javascript
// Format de logs standardisé
console.log(`[${new Date().toISOString()}] [${serviceName}] ${message}`);

// Health check détaillé
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: require('../package.json').version,
        services: {
            coolify: process.env.COOLIFY_API_URL ? 'configured' : 'not configured',
            n8n: process.env.N8N_API_URL ? 'configured' : 'not configured',
            baserow: process.env.BASEROW_URL ? 'configured' : 'not configured',
            videoToolkit: process.env.VIDEO_TOOLKIT_URL ? 'configured' : 'not configured'
        }
    });
});
```

## Amélirations Futures

### 🚀 **Fonctionnalités Avancées**
- **Génération automatique de vignettes** avec A/B testing de titres
- **Génération de chapitres** à partir de transcriptions
- **Réponses automatiques** aux premiers commentaires (engagement)
- **File d'attente de publication** avec retry et backoff
- **Tableau de bord analytics** : vues, likes, CTR par plateforme

### 🔄 **Optimisations Techniques**
- **Cache Redis** pour métadonnées fréquentes
- **Queue system** (Bull/Agenda) pour jobs asynchrones
- **WebSockets** pour updates temps réel du dashboard
- **Clustering** pour haute disponibilité
- **Rate limiting intelligent** par plateforme

## Récapitulatif Endpoints API

```javascript
// Actuellement implémentés
GET  /                                    // Info API
GET  /health                             // État services

// À implémenter (priorité haute)
POST /trigger/n8n/:webhookPath           // Déclencher workflow n8n
POST /run/:workflowId                    // Exécuter workflow REST
POST /coolify/deploy/:serviceId          // Déployer service

// À implémenter (workflows spécifiques)
POST /content/create                     // Content Creator workflow
POST /video/generate                     // Brain Rotter 5000 workflow
POST /social/publish                     // Publication multi-plateformes
GET  /social/analytics                   // Analytics consolidées
POST /baserow/upload                     // Upload assets
GET  /baserow/assets                     // Liste assets
```

## Prochaines Étapes Critiques

1. **Implémenter les endpoints n8n** (`/trigger/n8n/`, `/run/`)
2. **Ajouter les clients Baserow et VideoToolkit** dans l'orchestrateur
3. **Créer les workflows Content Creator et Brain Rotter 5000** dans n8n
4. **Configurer l'authentification OAuth** pour toutes les plateformes sociales
5. **Tester le pipeline complet** : génération → production → publication
6. **Déployer en production** via Coolify avec monitoring