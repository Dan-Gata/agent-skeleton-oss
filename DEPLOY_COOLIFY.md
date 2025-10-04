# 🚀 Guide de Déploiement Coolify - Agent Skeleton OSS

> ✅ **MISE À JOUR**: Le problème "error server no active" a été résolu ! Consultez [COOLIFY_FIX.md](./COOLIFY_FIX.md) pour les détails du correctif.

## 📋 Prérequis

1. **Instance Coolify** configurée et accessible
2. **Domaine** pointant vers votre serveur Coolify
3. **Clés API** pour les services IA (OpenRouter, OpenAI, etc.)
4. **Repository Git** avec le code

## 🔧 Étapes de Déploiement

### 1️⃣ Connexion à Coolify

1. Accédez à votre dashboard Coolify
2. Cliquez sur **"New Project"**
3. Nommez le projet : `agent-skeleton-oss`

### 2️⃣ Configuration du Repository

1. Sélectionnez **"Git Repository"**
2. Ajoutez l'URL du repository : `https://github.com/Dan-Gata/agent-skeleton-oss`
3. Branche : `main`
4. Build Pack : **Docker**

### 3️⃣ Configuration des Variables d'Environnement

Dans l'onglet **Environment**, ajoutez :

```bash
# Configuration de base
NODE_ENV=production
PORT=3000
APP_URL=https://votre-domaine.com

# Sécurité
INTERNAL_API_KEY=votre-cle-secrete-aleatoire

# APIs IA (configurez vos vraies clés)
OPENROUTER_API_KEY=sk-or-v1-xxxxx
OPENAI_API_KEY=sk-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
GOOGLE_API_KEY=AIxxxxx

# Intégrations Coolify
COOLIFY_API_URL=https://votre-coolify.com/api
COOLIFY_API_KEY=votre-cle-coolify

# n8n (si vous l'avez)
N8N_API_URL=https://votre-n8n.com/api/v1
N8N_API_KEY=votre-cle-n8n

# Baserow (si vous l'avez)
BASEROW_URL=https://api.baserow.io
BASEROW_API_TOKEN=votre-token-baserow
```

### 4️⃣ Configuration du Domaine

1. Dans **Domains**, ajoutez votre domaine
2. Activez **HTTPS/SSL** automatique
3. Configurez les redirections si nécessaire

### 5️⃣ Configuration Docker

Coolify détectera automatiquement le `Dockerfile` et `docker-compose.yml`

### 6️⃣ Déploiement

1. Cliquez sur **"Deploy"**
2. Suivez les logs en temps réel
3. Le déploiement prend généralement 2-5 minutes

## 🔍 Vérification Post-Déploiement

### Tests de base :
```bash
# Health check
curl https://votre-domaine.com/health

# Interface principale
https://votre-domaine.com

# Nouvelle interface app
https://votre-domaine.com/app

# API chat public
curl -X POST https://votre-domaine.com/api/chat/public \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```

## 🛠️ Configuration Avancée

### Webhooks pour Auto-Deploy
1. Dans GitHub, ajoutez le webhook Coolify
2. Chaque push sur `main` redéployera automatiquement

### Monitoring
1. Activez les **logs** dans Coolify
2. Configurez les **alertes**
3. Surveillez les **métriques** (CPU, RAM, etc.)

### Backup
1. Configurez la **sauvegarde automatique**
2. Les volumes Docker sont persistants

## 🚨 Dépannage

### Erreur de build
- Vérifiez les logs de build
- Assurez-vous que le Dockerfile est correct

### Variables d'environnement
- Vérifiez que toutes les clés API sont valides
- Testez les endpoints des services externes

### Domaine ne fonctionne pas
- Vérifiez la configuration DNS
- Attendez la propagation SSL (jusqu'à 10 minutes)

## 📞 Support

- **Logs** : Accessible dans le dashboard Coolify
- **Restart** : Bouton restart dans l'interface
- **Rollback** : Historique des déploiements disponible

---

## 🎯 Prochaines Étapes

Une fois déployé :

1. **Testez l'interface** : https://votre-domaine.com/app
2. **Configurez les instructions** personnalisées
3. **Connectez n8n** pour les workflows
4. **Ajoutez Baserow** pour la base de données
5. **Explorez les modèles IA** disponibles

Votre Agent Skeleton OSS est maintenant prêt en production ! 🚀