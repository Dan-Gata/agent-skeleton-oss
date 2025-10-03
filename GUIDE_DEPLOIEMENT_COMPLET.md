# 🚀 Agent Skeleton OSS - Guide de Déploiement Complet

## 🎯 Options de Déploiement

### Option 1: Déploiement Direct sur Coolify (Recommandé)
### Option 2: Déploiement via Git + Coolify Auto-Deploy  
### Option 3: Déploiement Local puis Push

---

## 🔥 OPTION 1: Déploiement Direct Coolify

### 📋 Prérequis
- ✅ Instance Coolify fonctionnelle
- ✅ Domaine configuré
- ✅ Repository Git accessible

### 🚀 Étapes Détaillées

#### 1️⃣ Préparer le Repository

```bash
# Si pas encore fait, initialisez Git
git init
git add .
git commit -m "feat: Initial Agent Skeleton OSS with modern interface"

# Pushez vers GitHub/GitLab
git remote add origin https://github.com/votre-username/agent-skeleton-oss
git push -u origin main
```

#### 2️⃣ Configuration Coolify

1. **Connectez-vous à Coolify**
   - Ouvrez votre dashboard Coolify
   - Cliquez sur "New Project"

2. **Configuration du Projet**
   ```
   Project Name: agent-skeleton-oss
   Description: Assistant IA intelligent avec interface moderne
   ```

3. **Source Configuration**
   ```
   Source Type: Git Repository
   Repository URL: https://github.com/votre-username/agent-skeleton-oss
   Branch: main
   Build Pack: Docker
   ```

4. **Variables d'Environnement**
   ```bash
   # OBLIGATOIRES
   NODE_ENV=production
   PORT=3000
   APP_URL=https://votre-domaine.com
   INTERNAL_API_KEY=generate-random-secret-key-here
   
   # APIs IA (configurer au moins une)
   OPENROUTER_API_KEY=sk-or-v1-your-key
   OPENAI_API_KEY=sk-your-openai-key
   ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
   GOOGLE_API_KEY=your-google-ai-key
   
   # INTÉGRATIONS (optionnelles pour commencer)
   COOLIFY_API_URL=https://votre-coolify.com/api
   COOLIFY_API_KEY=votre-coolify-api-key
   N8N_API_URL=https://votre-n8n.com/api/v1
   N8N_API_KEY=votre-n8n-key
   BASEROW_URL=https://api.baserow.io
   BASEROW_API_TOKEN=votre-baserow-token
   ```

5. **Configuration Domaine**
   ```
   Domain: votre-domaine.com
   SSL: Automatique (Let's Encrypt)
   Redirect WWW: Oui
   ```

6. **Déploiement**
   - Cliquez sur "Deploy"
   - Surveillez les logs en temps réel
   - Le déploiement prend ~3-5 minutes

#### 3️⃣ Vérification Post-Déploiement

```bash
# Tests essentiels
curl https://votre-domaine.com/health
# Réponse: {"status":"healthy","timestamp":"...","test":"Agent de test fonctionnel"}

curl https://votre-domaine.com/
# Interface moderne doit s'afficher

curl https://votre-domaine.com/app  
# Nouvelle interface app doit s'afficher

# Test API Chat
curl -X POST https://votre-domaine.com/api/chat/public \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "model": "claude-3.5-sonnet"}'
```

---

## 🔧 OPTION 2: Auto-Deploy avec Webhooks

### Configuration Auto-Deploy

1. **Dans Coolify**
   - Activez "Auto Deploy on Git Push"
   - Copiez l'URL du webhook

2. **Dans GitHub/GitLab**
   - Settings > Webhooks
   - Ajoutez l'URL webhook Coolify
   - Events: Push to main branch

3. **Test**
   ```bash
   # Faire un changement et push
   echo "# Update $(date)" >> README.md
   git add README.md
   git commit -m "test: Auto-deploy test"
   git push
   ```

---

## 📊 Monitoring et Maintenance

### 🔍 Health Checks
```bash
# Vérification automatique toutes les 30s
curl https://votre-domaine.com/health

# Logs en temps réel dans Coolify
# Métriques CPU/RAM disponibles
```

### 🚨 Dépannage

**Erreur: Module not found**
```bash
# Vérifiez que package.json contient toutes les dépendances
# Redéployez depuis Coolify
```

**Erreur: Port 3000 not accessible**
```bash
# Vérifiez la variable PORT=3000
# Vérifiez la configuration du domaine
```

**Erreur: API Keys invalid**
```bash
# Vérifiez les variables d'environnement
# Testez les clés API individuellement
```

---

## 🎯 Post-Déploiement: Commencer le Travail

### 1️⃣ Accès aux Interfaces

- **Interface Principale**: https://votre-domaine.com
- **App Moderne**: https://votre-domaine.com/app ⭐
- **Chat Legacy**: https://votre-domaine.com/chat

### 2️⃣ Configuration Initiale

1. **Testez le Chat**
   - Ouvrez /app
   - Envoyez un message test
   - Vérifiez les réponses IA

2. **Configurez les Instructions**
   - Section "Instructions Agent"
   - Choisissez un template (Professionnel, Créatif, etc.)
   - Personnalisez selon vos besoins

3. **Explorez les Modèles**
   - Section "Modèles IA"
   - Testez différents modèles
   - Comparez les performances

### 3️⃣ Intégrations Avancées

1. **n8n Workflows**
   - Configurez n8n séparément
   - Connectez via API
   - Créez des automatisations

2. **Baserow Database**
   - Créez votre workspace Baserow
   - Connectez l'API
   - Stockez les données structurées

3. **Coolify Management**
   - Utilisez l'API Coolify pour déploiements automatiques
   - Créez des workflows DevOps

---

## 🚀 Cas d'Usage Immédiats

### 💼 Business
- **Assistant client** intelligent
- **Génération de contenu** marketing
- **Analyse de données** automatisée
- **Workflows** de validation

### 🔧 Technique  
- **Code review** automatique
- **Documentation** auto-générée
- **Tests** et débogage assistés
- **Déploiements** orchestrés

### 🎨 Créatif
- **Brainstorming** d'idées
- **Création de contenu** multimédia
- **Design** et prototypage
- **Scénarios** et storytelling

---

## 📞 Support et Ressources

- **Logs**: Dashboard Coolify > Logs
- **Métriques**: Dashboard Coolify > Metrics  
- **Redémarrage**: Dashboard Coolify > Restart
- **Rollback**: Dashboard Coolify > Deployments

**Votre Agent Skeleton OSS est maintenant prêt en production ! 🎉**

Commencez par tester l'interface /app et explorez toutes les fonctionnalités ! 🚀