# 🤖 Agent Skeleton OSS

> **Assistant IA Intelligent avec Interface Moderne**  
> Intégrations n8n • Coolify • Baserow • Multi-Modèles IA

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![Coolify](https://img.shields.io/badge/Coolify-Compatible-purple.svg)](https://coolify.io/)

## 🚀 Fonctionnalités

### 🤖 **Système d'IA Avancé**
- **8+ Modèles IA** : Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro, Qwen, Llama...
- **Apprentissage Adaptatif** : Mémorisation des préférences utilisateur
- **Instructions Personnalisables** : Templates Professionnel, Créatif, Technique, Coach
- **Système de Feedback** : Amélioration continue basée sur les interactions

### 🎨 **Interface Moderne**
- **Design App Native** : Interface similaire aux applications desktop/mobile
- **Mode Sombre/Clair** : Thème adaptatif avec animations fluides
- **Responsive** : Optimisé mobile, tablette, desktop
- **Temps Réel** : Statistiques live (CPU, mémoire, uptime)
- **Shortcuts** : Raccourcis clavier et actions rapides

### 🔧 **Intégrations Puissantes**
- **n8n** : Workflows et automatisations avancées
- **Coolify** : Déploiement et infrastructure as code
- **Baserow** : Base de données no-code intégrée
- **OpenRouter** : Accès unifié à tous les modèles IA
- **APIs RESTful** : Endpoints complets pour intégrations

### ⚡ **Fonctionnalités Avancées**
- **Chat Intelligent** : Formatage Markdown, émojis, fichiers
- **Reconnaissance Vocale** : Dictée intégrée (navigateurs compatibles)
- **Export/Import** : Sauvegarde complète des données
- **Analytics** : Métriques d'utilisation et performance
- **Multi-Conversations** : Gestion de sessions multiples

## 🌐 **Accès Rapide**

```bash
# Interface Moderne (Recommandée)
https://votre-domaine.com/app

# Interface Classique  
https://votre-domaine.com

# API Chat Public
POST https://votre-domaine.com/api/chat/public

# Health Check
GET https://votre-domaine.com/health
```

## 🚀 **Déploiement Coolify (5 minutes)**

### 1️⃣ **Clone & Configure**
```bash
git clone https://github.com/Dan-Gata/agent-skeleton-oss
cd agent-skeleton-oss
cp .env.example .env
# Configurez vos clés API dans .env
```

### 2️⃣ **Coolify Setup**
1. **Nouveau Projet** dans Coolify
2. **Repository** : `https://github.com/Dan-Gata/agent-skeleton-oss`
3. **Build Pack** : Docker
4. **Variables d'environnement** (voir `.env.example`)
5. **Deploy** ! 🚀

### 3️⃣ **Configuration Minimale**
```env
NODE_ENV=production
PORT=3000
APP_URL=https://votre-domaine.com
INTERNAL_API_KEY=votre-cle-secrete-random
OPENROUTER_API_KEY=sk-or-v1-your-key  # Pour accès multi-modèles
```

📚 **Guide Détaillé** : [GUIDE_DEPLOIEMENT_COMPLET.md](./GUIDE_DEPLOIEMENT_COMPLET.md)

---

**Votre Assistant IA Intelligent est maintenant prêt ! 🤖✨**

## 🎯 **Démarrage Immédiat**

1. 🚀 **Déployez sur Coolify** (5 minutes)
2. 🌐 **Ouvrez** `https://votre-domaine.com/app`
3. 💬 **Testez le chat** avec "Bonjour !"
4. ⚙️ **Explorez** les sections Instructions & Modèles
5. 🛠️ **Commencez à créer** ! 

**C'est parti ! Votre agent IA est opérationnel ! 🎉**