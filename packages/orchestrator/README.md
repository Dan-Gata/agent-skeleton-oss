# Agent Orchestrateur - Documentation Complète

## 🎯 Objectif

Orchestrateur Node.js/Express pour automatiser la création de contenu, les déploiements et la gestion multi-plateforme via:
- **n8n** : Workflows de création (Content Creator, Brain Rotter 5000)
- **Coolify** : Déploiements automatisés
- **Baserow** : Stockage métadonnées et assets
- **Toolkit Vidéo** : Génération TTS, captions, montage
- **Réseaux Sociaux** : Publication YouTube, TikTok, Instagram, X, LinkedIn, Pinterest, Threads

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│             │────▶│              │────▶│   n8n       │
│ Utilisateur │     │ Orchestrateur│     │  Workflows  │
│             │◀────│   Express    │◀────│             │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ├────▶ Coolify (Déploiements)
                           ├────▶ Baserow (Assets)
                           ├────▶ Toolkit Vidéo
                           └────▶ Réseaux Sociaux (via n8n)
```

## 🚀 Démarrage Rapide

### Installation

```powershell
# Cloner le repo
git clone https://github.com/Dan-Gata/agent-skeleton-oss.git
cd agent-skeleton-oss/packages/orchestrator

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditez .env avec vos valeurs
```

### Configuration `.env`

```env
PORT=3000
NODE_ENV=development

# n8n
N8N_API_URL=https://n8n.votre-domaine.tld
N8N_API_KEY=votre-clé-api

# Coolify
COOLIFY_API_URL=https://coolify.votre-domaine.tld
COOLIFY_API_KEY=votre-token

# Baserow
BASEROW_URL=http://baserow:80
BASEROW_API_TOKEN=votre-token

# Toolkit Vidéo
VIDEO_TOOLKIT_URL=http://video-toolkit:8080
```

### Lancement

```powershell
# Développement (avec hot-reload)
npm run dev

# Production
npm start

# Tests
npm test
```

Accédez à: `http://localhost:3000`

## 📡 API Endpoints

### Système

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Dashboard principal |
| GET | `/health` | État des services |
| GET | `/login` | Page de connexion |
| POST | `/api/login` | Authentification |

### n8n - Workflows

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/trigger/n8n/:webhookPath` | Déclencher workflow via webhook |
| POST | `/run/:workflowId` | Exécuter workflow via REST API |

**Exemples:**
```powershell
# Content Creator
curl -X POST http://localhost:3000/trigger/n8n/content-creator \
  -H "Content-Type: application/json" \
  -d '{"topic": "IA", "platform": "YouTube"}'

# Brain Rotter 5000
curl -X POST http://localhost:3000/trigger/n8n/brain-rotter \
  -H "Content-Type: application/json" \
  -d '{"topic": "Fun Facts", "duration": 60}'
```

### Coolify - Déploiements

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/coolify/deploy/:serviceId` | Déclencher déploiement |

**Exemple:**
```powershell
curl -X POST http://localhost:3000/coolify/deploy/app-123
```

### Baserow - Assets

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/baserow/upload` | Upload données vers table |
| GET | `/baserow/assets?tableId=123` | Récupérer assets |

**Exemples:**
```powershell
# Upload
curl -X POST http://localhost:3000/baserow/upload \
  -H "Content-Type: application/json" \
  -d '{"tableId": "123", "data": {"name": "Vidéo 1"}}'

# Récupération
curl "http://localhost:3000/baserow/assets?tableId=123"
```

### Toolkit Vidéo

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/video/generate` | Générer vidéo (TTS, captions, etc.) |

**Exemple:**
```powershell
curl -X POST http://localhost:3000/video/generate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Contenu vocal",
    "voice": "fr-FR-Neural",
    "addCaptions": true
  }'
```

## 🔧 Configuration n8n

### Workflows à Créer

#### 1. Content Creator
- **Webhook:** `/webhook/content-creator`
- **Fonction:** Génère des idées de contenu au ton de marque
- **Tools requis:** GET BRAND BRIEFLY, feedback tools

#### 2. Brain Rotter 5000
- **Webhook:** `/webhook/brain-rotter`
- **Fonction:** Génère vidéos virales courtes
- **Intégrations:** Toolkit vidéo, Baserow, réseaux sociaux

#### 3. Social Publisher
- **Webhook:** `/webhook/social-publish`
- **Fonction:** Publication multi-plateformes
- **Plateformes:** YouTube, TikTok, Instagram, X, LinkedIn, Pinterest, Threads

### Credentials n8n à Configurer

Dans n8n Settings → Credentials, ajoutez:

1. **Baserow**
   - Type: HTTP Header Auth
   - Name: Authorization
   - Value: `Token votre-token`

2. **YouTube**
   - Type: OAuth2 API
   - Scopes: upload, analytics

3. **TikTok**
   - Type: TikTok API
   - Credentials selon docs TikTok

4. **Instagram**
   - Type: Instagram Graph API
   - Token d'accès

5. **X/Twitter**
   - Type: Twitter OAuth 1.0a

6. **LinkedIn**
   - Type: LinkedIn OAuth2

7. **Pinterest**
   - Type: Pinterest OAuth2

## 🐳 Déploiement Coolify

### 1. Préparer le Repo

```powershell
# Vérifier la structure
tree /F packages/orchestrator
```

Doit contenir:
- ✅ `Dockerfile`
- ✅ `.dockerignore`
- ✅ `package.json`
- ✅ `src/index.js`

### 2. Créer l'Application Coolify

1. **Coolify** → **New Resource** → **Application**
2. **Source:** GitHub
3. **Repository:** `https://github.com/Dan-Gata/agent-skeleton-oss`
4. **Base Directory:** `packages/orchestrator`
5. **Build Pack:** Dockerfile
6. **Port:** 3000

### 3. Configurer les Variables

Dans Coolify → App Settings → Environment Variables:

```env
PORT=3000
NODE_ENV=production
N8N_API_URL=https://n8n.kaussan-air.org
N8N_API_KEY=***
COOLIFY_API_URL=https://kaussan-air.org
COOLIFY_API_KEY=***
BASEROW_URL=http://baserow:80
BASEROW_API_TOKEN=***
VIDEO_TOOLKIT_URL=http://video-toolkit:8080
```

### 4. Déployer

1. Cliquez sur **Deploy**
2. Surveillez les logs
3. Testez `/health` une fois déployé
4. Configurez le domaine/SSL (géré automatiquement par Coolify)

## 🔒 Sécurité

### Best Practices

1. **Secrets**
   - ❌ Ne jamais commiter `.env`
   - ✅ Utiliser variables d'environnement Coolify
   - ✅ Régénérer tokens régulièrement
   - ✅ Stocker dans un coffre de secrets

2. **Endpoints**
   - ✅ HTTPS partout (géré par Coolify)
   - ✅ Rate limiting sur endpoints publics
   - ✅ Authentification API (middleware à implémenter)
   - ✅ IP allowlist si nécessaire

3. **Logs**
   - ✅ Ne pas logger les secrets
   - ✅ Sanitizer les données utilisateur
   - ✅ Monitoring centralisé

### Middleware d'Authentification (À Implémenter)

```javascript
// Exemple de protection des endpoints sensibles
const authenticateAPI = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

app.post('/trigger/n8n/:webhookPath', authenticateAPI, async (req, res) => {
    // Endpoint protégé
});
```

## 🧪 Tests

### Tests Unitaires

```powershell
npm test
```

### Tests Manuels

Voir [TESTING.md](./TESTING.md) pour exemples détaillés.

```powershell
# Health check
curl http://localhost:3000/health

# Test n8n webhook
curl -X POST http://localhost:3000/trigger/n8n/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## 🐛 Dépannage

### Erreurs Courantes

#### 1. Webhook n8n 404 GET
**Problème:** URL ouverte dans navigateur (GET au lieu de POST)
**Solution:** Utiliser POST via curl/Postman

#### 2. host.docker.internal introuvable
**Problème:** URL de dev en production
**Solution:** Remplacer par nom de service (`http://baserow:80`) ou URL publique

#### 3. 401/403 Coolify
**Problème:** Token invalide
**Solution:** Vérifier `COOLIFY_API_KEY` et permissions

#### 4. Échec build Docker
**Problème:** Dockerfile ou structure incorrecte
**Solution:** Vérifier `COPY`, `WORKDIR`, `EXPOSE`, présence de `package.json`

### Logs de Debugging

```javascript
// Format standardisé dans index.js
console.log(`[${new Date().toISOString()}] [service] Message`);
```

Exemple:
```
[2025-10-11T10:30:45.123Z] [n8n-webhook] Déclenchement: content-creator
[2025-10-11T10:30:46.456Z] [n8n-webhook] ✅ Succès
```

## 📊 Monitoring

### Health Check Détaillé

`GET /health` retourne l'état de tous les services:

```json
{
  "status": "healthy",
  "services": {
    "n8n": { "configured": true, "url": "...", "hasApiKey": true },
    "coolify": { "configured": true, "url": "...", "hasApiKey": true },
    "baserow": { "configured": true, "url": "...", "hasToken": true },
    "videoToolkit": { "configured": true, "url": "..." }
  },
  "endpoints": {
    "n8n": [...],
    "coolify": [...],
    "baserow": [...],
    "video": [...]
  }
}
```

## 🚦 Roadmap

### Phase 1 - ✅ Complété
- [x] Endpoints n8n (webhook + REST)
- [x] Endpoints Coolify (deploy)
- [x] Endpoints Baserow (upload + get)
- [x] Endpoint Toolkit Vidéo
- [x] Health check amélioré

### Phase 2 - 🔄 En cours
- [ ] Workflows orchestrés (Content Creator complet)
- [ ] Authentification API sécurisée
- [ ] Rate limiting
- [ ] Système de queues (retry, backoff)

### Phase 3 - 📋 Planifié
- [ ] Dashboard analytics
- [ ] A/B testing titres/vignettes
- [ ] Génération chapitres automatique
- [ ] Réponses auto aux commentaires
- [ ] WebSockets temps réel

## 📚 Ressources

- [Documentation n8n](https://docs.n8n.io)
- [API Coolify](https://coolify.io/docs/api)
- [API Baserow](https://baserow.io/docs/apis/rest-api)
- [Guide Copilot](.github/copilot-instructions.md)
- [Guide de Tests](./TESTING.md)

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

MIT License - Voir [LICENSE](../../LICENSE)

## 📞 Support

- **Issues:** https://github.com/Dan-Gata/agent-skeleton-oss/issues
- **Discussions:** https://github.com/Dan-Gata/agent-skeleton-oss/discussions
