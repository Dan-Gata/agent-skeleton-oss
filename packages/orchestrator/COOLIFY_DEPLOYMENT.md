# 🚀 Configuration Coolify - Agent Redoutable

## ✅ Code Poussé vers GitHub

**Commit**: `7a01640`
**Message**: feat: Add comprehensive dashboard with AI chat, file management, and automation tools
**Fichiers ajoutés**: 18 fichiers, 7402+ lignes de code

---

## 🔧 Variables d'Environnement pour Coolify

### **OBLIGATOIRES - Pour le fonctionnement de base:**

```env
# Port du serveur
PORT=3000

# Node Environment
NODE_ENV=production
```

---

### **🤖 AI CHAT - OpenRouter (pour Chat IA avec 60+ modèles)**

```env
# OpenRouter API Key (REQUIS pour le Chat IA)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OpenRouter API URL (optionnel, par défaut: https://openrouter.ai/api/v1)
OPENROUTER_API_URL=https://openrouter.ai/api/v1
```

**Comment obtenir:**
1. Aller sur https://openrouter.ai/
2. Créer un compte
3. Aller dans Settings > API Keys
4. Créer une nouvelle clé API

**Modèles disponibles avec cette clé:**
- GPT-4, GPT-3.5 Turbo (OpenAI)
- Claude 3 Opus, Sonnet (Anthropic)
- Gemini Pro (Google)
- Qwen 2 72B (Alibaba)
- Llama 3 70B (Meta)
- Mistral Large
- Et 50+ autres modèles

---

### **🔄 n8n - Automation Workflows**

```env
# n8n Webhook Base URL
N8N_WEBHOOK_URL=https://n8n.kaussan-air.org

# n8n API URL
N8N_URL=https://n8n.kaussan-air.org

# n8n API Key (pour lister les workflows)
N8N_API_KEY=n8n_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Comment obtenir:**
1. Aller dans votre instance n8n: https://n8n.kaussan-air.org
2. Settings > API
3. Générer une API Key

**Workflows configurés:**
- Content Creator Workflow
- Brain Rotter 5000
- Social Media Publisher
- Video Toolkit Integration

---

### **🚀 Coolify - Deployment**

```env
# Coolify API URL
COOLIFY_URL=https://kaussan-air.org

# Coolify API Key
COOLIFY_API_KEY=coolify_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Comment obtenir:**
1. Aller dans Coolify: https://kaussan-air.org
2. User Settings > API Tokens
3. Créer un nouveau token

**Services déployables:**
- agent-skeleton-oss
- n8n
- baserow
- Autres services Docker

---

### **🗄️ Baserow - Database/Asset Management**

```env
# Baserow API URL
BASEROW_URL=https://baserow.io

# Baserow API Token
BASEROW_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Baserow Table ID (pour les assets)
BASEROW_TABLE_ID=12345
```

**Comment obtenir:**
1. Aller sur https://baserow.io
2. Settings > API Tokens
3. Créer un nouveau token
4. Copier l'ID de la table depuis l'URL

**Tables recommandées:**
- Assets (pour stocker les médias générés)
- Content Calendar
- Analytics Data
- User Generated Content

---

### **✉️ Email Service - Nodemailer**

```env
# Service Email (gmail, outlook, sendgrid, etc.)
EMAIL_SERVICE=gmail

# Email Sender
EMAIL_USER=votre-email@gmail.com

# Email Password (App Password pour Gmail)
EMAIL_PASS=xxxx xxxx xxxx xxxx

# Email From Name
EMAIL_FROM=Agent Redoutable <votre-email@gmail.com>
```

**Comment obtenir (Gmail):**
1. Aller sur https://myaccount.google.com/
2. Security > 2-Step Verification
3. App passwords
4. Générer un mot de passe pour "Mail"
5. Utiliser ce mot de passe (format: xxxx xxxx xxxx xxxx)

**Fonctionnalités:**
- Welcome emails
- Notifications
- Analytics reports
- Custom HTML emails

---

### **🎬 Video Toolkit - Génération de Vidéos**

```env
# Video Toolkit API URL
VIDEO_TOOLKIT_URL=https://your-video-service.com/api

# Video Toolkit API Key (si requis)
VIDEO_TOOLKIT_API_KEY=vt_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Services compatibles:**
- RunwayML
- Synthesia
- D-ID
- Pictory
- Custom video API

---

### **📱 Social Media - OAuth Credentials (via n8n)**

**Ces credentials sont configurés dans n8n, pas ici.**

```env
# Note: Les credentials OAuth sont gérés dans n8n
# Voir SOCIAL_MEDIA_INTEGRATION.md pour la configuration
```

**Plateformes supportées:**
1. **YouTube** - OAuth2 + API Key
2. **TikTok** - OAuth2
3. **Instagram** - Facebook Graph API
4. **X (Twitter)** - OAuth 1.0a
5. **LinkedIn** - OAuth2
6. **Pinterest** - OAuth2
7. **Threads** - API Graph

**Configuration:** Voir `SOCIAL_MEDIA_INTEGRATION.md`

---

## 📋 Configuration Minimale (Pour Tester)

Si vous voulez juste tester l'application sans toutes les intégrations:

```env
# Minimum requis
PORT=3000
NODE_ENV=production

# Pour le Chat IA (recommandé)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Avec cette config minimale, vous aurez:
- ✅ Dashboard fonctionnel
- ✅ Authentication
- ✅ Upload de fichiers
- ✅ Chat IA avec 60+ modèles
- ⚠️ Automation limitée (n8n, Coolify, Baserow non disponibles)

---

## 📋 Configuration Complète (Production)

Pour avoir toutes les fonctionnalités:

```env
# === BASE ===
PORT=3000
NODE_ENV=production

# === AI CHAT ===
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENROUTER_API_URL=https://openrouter.ai/api/v1

# === n8n AUTOMATION ===
N8N_WEBHOOK_URL=https://n8n.kaussan-air.org
N8N_URL=https://n8n.kaussan-air.org
N8N_API_KEY=n8n_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# === COOLIFY DEPLOYMENT ===
COOLIFY_URL=https://kaussan-air.org
COOLIFY_API_KEY=coolify_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# === BASEROW DATABASE ===
BASEROW_URL=https://baserow.io
BASEROW_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
BASEROW_TABLE_ID=12345

# === EMAIL SERVICE ===
EMAIL_SERVICE=gmail
EMAIL_USER=votre-email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
EMAIL_FROM=Agent Redoutable <votre-email@gmail.com>

# === VIDEO TOOLKIT (optionnel) ===
VIDEO_TOOLKIT_URL=https://your-video-service.com/api
VIDEO_TOOLKIT_API_KEY=vt_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🔐 Sécurité

### **Variables sensibles:**
- ⚠️ **Ne jamais commiter** les vraies valeurs dans Git
- ⚠️ Utiliser les variables d'environnement Coolify
- ⚠️ Renouveler les API keys régulièrement

### **Fichiers à NE PAS commiter:**
- `.env` (local)
- `.env.local`
- `.env.production`

### **Fichier safe à commiter:**
- ✅ `.env.example` (contient les noms, pas les valeurs)

---

## 📦 Dépendances npm Installées

Les dépendances suivantes sont déjà dans `package.json`:

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "cookie-parser": "^1.4.6",
    "multer": "^1.4.5-lts.1",
    "dotenv": "^16.3.1",
    "axios": "^1.6.2",
    "better-sqlite3": "^9.2.2",
    "nodemailer": "^6.9.7",
    "pdf-parse": "^1.1.1",
    "mammoth": "^1.6.0"
  }
}
```

**Coolify installera automatiquement toutes ces dépendances avec `npm install`.**

---

## 🚀 Déploiement sur Coolify

### **Étapes:**

1. **Aller dans Coolify** (https://kaussan-air.org)

2. **Créer ou mettre à jour le service:**
   - Repository: `https://github.com/votre-username/agent-skeleton-oss`
   - Branch: `main`
   - Build Pack: `nixpacks`
   - Port: `3000`

3. **Ajouter les variables d'environnement:**
   - Copier les variables depuis cette page
   - Aller dans Service > Environment Variables
   - Ajouter chaque variable une par une

4. **Configuration du Build:**
   - Install Command: `cd packages/orchestrator && npm install`
   - Start Command: `cd packages/orchestrator && node src/index.js`
   - Working Directory: `/`

5. **Deploy:**
   - Cliquer sur "Deploy"
   - Attendre la fin du build
   - Vérifier les logs

---

## ✅ Vérification Post-Déploiement

Après le déploiement, testez ces endpoints:

```bash
# Health check
curl https://votre-domaine.com/health

# Login page
curl https://votre-domaine.com/direct-login

# Dashboard (après login)
curl https://votre-domaine.com/dashboard
```

**Résultats attendus:**
- Health: JSON avec status "healthy"
- Login: HTML page
- Dashboard: HTML page (ou redirect si non authentifié)

---

## 🆕 Nouvelles Variables (Cette Version)

Comparé à la version précédente, voici les **NOUVELLES** variables ajoutées:

```env
# NOUVEAU - Pour le Chat IA
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENROUTER_API_URL=https://openrouter.ai/api/v1

# NOUVEAU - Pour Email
EMAIL_SERVICE=gmail
EMAIL_USER=votre-email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
EMAIL_FROM=Agent Redoutable <votre-email@gmail.com>

# NOUVEAU - Pour Video Toolkit
VIDEO_TOOLKIT_URL=https://your-video-service.com/api
VIDEO_TOOLKIT_API_KEY=vt_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Variables existantes (déjà configurées):**
- `N8N_WEBHOOK_URL`
- `N8N_URL`
- `N8N_API_KEY`
- `COOLIFY_URL`
- `COOLIFY_API_KEY`
- `BASEROW_URL`
- `BASEROW_API_KEY`
- `BASEROW_TABLE_ID`

---

## 📊 Résumé

### **Variables Obligatoires (2):**
- `PORT`
- `NODE_ENV`

### **Variables Recommandées (3):**
- `OPENROUTER_API_KEY` - Pour le Chat IA
- `N8N_API_KEY` - Pour n8n workflows
- `EMAIL_USER` + `EMAIL_PASS` - Pour les emails

### **Variables Optionnelles (11):**
- Coolify, Baserow, Video Toolkit, etc.

### **Total: 16 variables d'environnement**

---

## 🎯 Priorité de Configuration

1. **🔴 CRITIQUE** - Sans cela, l'app ne fonctionne pas:
   - `PORT`
   - `NODE_ENV`

2. **🟡 IMPORTANT** - Fonctionnalités principales:
   - `OPENROUTER_API_KEY` (Chat IA)
   - `N8N_API_KEY` (Automation)
   - `EMAIL_USER`, `EMAIL_PASS` (Emails)

3. **🟢 OPTIONNEL** - Fonctionnalités avancées:
   - `COOLIFY_API_KEY` (Deploy depuis l'app)
   - `BASEROW_API_KEY` (Gestion assets)
   - `VIDEO_TOOLKIT_API_KEY` (Génération vidéo)

---

## 📞 Support

Si vous avez des questions sur la configuration:
1. Vérifier les logs Coolify
2. Tester `/health` endpoint
3. Vérifier que toutes les variables sont définies

**Dashboard URL après déploiement:**
https://votre-domaine.com/dashboard

Bon déploiement! 🚀
