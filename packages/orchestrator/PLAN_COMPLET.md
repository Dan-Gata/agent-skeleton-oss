# Plan Complet - Agent d'Automatisation
## Orchestrateur + n8n + Coolify + Baserow + Réseaux Sociaux

> **Statut:** ✅ Phase 1 Complétée - Endpoints implémentés et documentés

---

## 🎯 Objectif

Disposer d'un agent (app Node/Express "orchestrateur") capable de :
- ✅ Déclencher workflows n8n (création de contenus, scripts vidéo)
- ✅ Orchestrer des déploiements via Coolify
- ✅ Stocker/servir des données médias (Baserow/toolkit vidéo)
- 🔄 Publier automatiquement sur 7 plateformes sociales

---

## 1️⃣ Architecture Cible

### Vue d'Ensemble

```
┌──────────────┐
│  Utilisateur │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│           ORCHESTRATEUR (Node/Express)               │
│  - Endpoints REST sécurisés                          │
│  - Port 3000                                         │
│  - Authentication & Rate Limiting                    │
└──────┬───────────────────────────────────────────────┘
       │
       ├─────► [n8n] Workflows
       │        ├─ Content Creator
       │        ├─ Brain Rotter 5000
       │        └─ Social Publisher
       │
       ├─────► [Coolify] Déploiements
       │        └─ CI/CD automatisé
       │
       ├─────► [Baserow] Données
       │        ├─ Métadonnées contenus
       │        ├─ Assets médias
       │        └─ Analytics
       │
       ├─────► [Toolkit Vidéo] Génération
       │        ├─ TTS (Text-to-Speech)
       │        ├─ Captions/Sous-titres
       │        ├─ Concat/Merge
       │        └─ Musique de fond
       │
       └─────► [Réseaux Sociaux] via n8n
                ├─ YouTube
                ├─ TikTok
                ├─ Instagram
                ├─ X/Twitter
                ├─ LinkedIn
                ├─ Pinterest
                └─ Threads
```

---

## 2️⃣ Variables d'Environnement

### Configuration `.env`

| Clé | Valeur Exemple | Usage |
|-----|----------------|-------|
| **PORT** | 3000 | Port HTTP de l'orchestrateur |
| **NODE_ENV** | development/production | Environnement d'exécution |
| **N8N_API_URL** | https://n8n.votre-domaine.tld | Racine n8n (webhook/API) |
| **N8N_API_KEY** | xxxxxxxx | Clé API n8n (optionnel webhook, requis REST) |
| **COOLIFY_API_URL** | https://coolify.votre-domaine.tld | Base URL API Coolify |
| **COOLIFY_API_KEY** | token-coolify | Token d'accès Coolify |
| **BASEROW_URL** | http://baserow:80 | Base URL Baserow (Docker interne ou public) |
| **BASEROW_API_TOKEN** | token-baserow | Token API Baserow |
| **VIDEO_TOOLKIT_URL** | http://video-toolkit:8080 | Base URL toolkit vidéo (HTTP) |

**Fichier:** `packages/orchestrator/.env.example` (à copier en `.env`)

---

## 3️⃣ Mapping Workflows n8n

### Workflows Fournis

#### 🎨 Content Creator
- **Fonction:** Génération d'idées de contenu au ton de marque
- **Webhook:** `/webhook/content-creator`
- **Tool Workflows:** GET BRAND BRIEFLY, feedback tools
- **Execute Workflow:** Idées de contenu
- **⚠️ Vérifier:** Workflows référencés existent et sont activés

#### 🎬 Brain Rotter 5000
- **Fonction:** Génération vidéos virales courtes
- **Webhook:** `/webhook/brain-rotter`
- **Endpoints HTTP:** Toolkit vidéo
- **Upload:** Fichiers vers Baserow
- **Tables Baserow:** Pistes et assets persistés
- **⚠️ Attention:** URLs internes (remplacer `host.docker.internal` en prod)

#### 📱 Social Publisher
- **Fonction:** Publication multi-plateformes
- **Webhook:** `/webhook/social-publish`
- **Intégrations:** 7 réseaux sociaux via credentials n8n
- **Logs:** Résultats dans Baserow

---

## 4️⃣ Endpoints Orchestrateur

### ✅ Implémentés et Testés

#### Système & Monitoring
```http
GET  /health
GET  /
GET  /login
POST /api/login
POST /api/logout
```

#### n8n - Workflows
```http
POST /trigger/n8n/:webhookPath
# Body: JSON data pour le workflow
# Exemple: /trigger/n8n/content-creator

POST /run/:workflowId
# Headers: X-N8N-API-KEY requis
# Exécution via REST API
```

#### Coolify - Déploiements
```http
POST /coolify/deploy/:serviceId
# Déclenche le déploiement d'un service
```

#### Baserow - Données
```http
POST /baserow/upload
# Body: { "tableId": "123", "data": {...} }

GET  /baserow/assets?tableId=123
# Récupère assets d'une table
```

#### Toolkit Vidéo
```http
POST /video/generate
# Body: Paramètres génération (TTS, captions, etc.)
```

**Documentation complète:** `TESTING.md`

---

## 5️⃣ Déploiement avec Coolify

### Cheatsheet

#### Prérequis Repo GitHub
- ✅ `Dockerfile` avec `EXPOSE 3000`
- ✅ `.dockerignore` (node_modules, .git)
- ✅ `packages/orchestrator` comme structure

#### Procédure
1. **Coolify** → New Resource → Application → Git
2. **Repository URL:** `https://github.com/Dan-Gata/agent-skeleton-oss`
3. **Base Directory:** `packages/orchestrator`
4. **Build Pack:** Dockerfile
5. **Port:** 3000
6. **Environment Variables:** Configurer toutes les variables (section 2)
7. **Deploy** → Vérifier logs → Tester `/health`
8. **Domaine/SSL:** Géré automatiquement par Coolify

**Statut actuel:** 
- Production: https://kaussan-air.org
- n8n: https://n8n.kaussan-air.org

---

## 6️⃣ Sécurité & Secrets

### Best Practices

#### ❌ À NE JAMAIS FAIRE
- Commiter `.env` dans le repo
- Exposer les tokens dans les logs
- Utiliser HTTP en production

#### ✅ À FAIRE
- Utiliser variables d'environnement Coolify pour la prod
- Limiter accès endpoints sensibles (clé API, IP allowlist)
- HTTPS partout (géré par Coolify)
- Régénérer tokens régulièrement
- Stocker dans un coffre de secrets

#### Middleware d'Authentification (À Implémenter)
```javascript
const authenticateAPI = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};
```

---

## 7️⃣ Procédure Locale (Dev)

### Setup
```powershell
# 1. Cloner le repo
git clone https://github.com/Dan-Gata/agent-skeleton-oss.git
cd agent-skeleton-oss/packages/orchestrator

# 2. Installer dépendances
npm install

# 3. Configurer environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# 4. Démarrer le serveur
npm run dev  # Avec hot-reload
# ou
npm start    # Mode production
```

### Tests
```powershell
# Health check
curl http://localhost:3000/health

# Test workflow n8n
curl -X POST http://localhost:3000/trigger/n8n/test-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Script de tests complet
.\test-endpoints.ps1
```

**⚠️ Adapter URLs:** `host.docker.internal` si Docker Desktop vs local pur

---

## 8️⃣ Procédure Production (VPS via Coolify)

### Checklist
- [ ] App Orchestrateur créée dans Coolify
- [ ] Variables d'environnement configurées
- [ ] Services n8n, Baserow, Toolkit liés (même Coolify)
- [ ] URLs internes n8n mises à jour (noms services Docker ou URLs publiques)
- [ ] Workflows n8n activés
- [ ] Tests via URL publique orchestrateur
- [ ] Domaine/SSL configuré
- [ ] Monitoring actif

---

## 9️⃣ Diagrammes de Flux

### Flux Utilisateur
```
[Utilisateur] 
    │
    ├──GET /health──► [Orchestrateur] ──► status/version ──► [OK]
    │
    └──POST /trigger/n8n/:webhookPath + JSON──► [Orchestrateur]
              │
              └──POST /webhook/:webhookPath──► [n8n Workflow]
                        │
                        ├──HTTP──► [Toolkit Vidéo]
                        ├──API───► [Baserow]
                        └──API───► [Réseaux Sociaux]
```

### Flux Déploiement
```
[Dev PC]
    │
    └──git push──► [GitHub]
                      │
                      └──webhook──► [Coolify]
                                       │
                                       ├──pull/build──► [Orchestrateur Container]
                                       ├──env vars───► [Config]
                                       └──deploy─────► [Production]
```

---

## 🔟 Checklist Réseaux Sociaux (n8n)

### À Vérifier Absolument

#### Comptes & Authentification
- [ ] YouTube: OAuth configuré, scopes upload/analytics
- [ ] TikTok: API credentials, Content Posting API activé
- [ ] Instagram: Graph API, compte Business lié
- [ ] X/Twitter: OAuth 1.0a, permissions Read & Write
- [ ] LinkedIn: OAuth2, Share API approuvé
- [ ] Pinterest: OAuth2, scopes pins:write
- [ ] Threads: Instagram Graph API (beta)

#### Contenu & Assets
- [ ] Modèles de contenu: titres, descriptions, hashtags
- [ ] Ton de marque: variables n8n mappées
- [ ] Planning: fenêtres de publication, fuseaux horaires
- [ ] Quotas API: limites quotidiennes respectées
- [ ] Formats: vidéo/audio/images adaptés par plateforme
- [ ] Validation humaine: étape d'approbation (optionnel)

#### Logs & Monitoring
- [ ] ID de publication stocké dans Baserow
- [ ] Liens publics sauvegardés
- [ ] Statut (succès/erreur) tracké
- [ ] Analytics initiaux (vues T+1h, T+24h)

**Documentation complète:** `SOCIAL_MEDIA_INTEGRATION.md`

---

## 1️⃣1️⃣ Améliorations Possibles

### Phase Immédiate
- [ ] Génération automatique vignettes (thumbnail)
- [ ] A/B testing titres/vignettes
- [ ] Génération chapitres depuis transcription
- [ ] Réponses auto premiers commentaires

### Phase Avancée
- [ ] File d'attente publication avec retry/backoff
- [ ] Tableau de bord analytics (vues, likes, CTR)
- [ ] Webhooks retour statut publication
- [ ] Cache Redis pour métadonnées
- [ ] Queue system (Bull/Agenda) pour jobs async
- [ ] WebSockets updates temps réel

---

## 1️⃣2️⃣ Checklists Rapides

### A. Orchestrateur ✅
- [x] Dockerfile OK (EXPOSE 3000)
- [x] .dockerignore (node_modules, .git)
- [x] Health endpoint implémenté
- [x] Logs démarrage OK
- [x] Clients axios configurés
- [x] Endpoints /trigger, /run, /coolify implémentés

### B. n8n 🔄
- [ ] Workflows importés et activés
- [ ] Webhooks disponibles ou IDs connus
- [ ] Credentials créées (OpenAI, Baserow, réseaux sociaux)
- [ ] URLs internes corrigées pour production

### C. Baserow & Toolkit 🔄
- [ ] Baserow accessible (token OK)
- [ ] Tables/fields conformes aux IDs workflows
- [ ] Toolkit vidéo accessible (endpoints up)
- [ ] Formats et tailles conformes

### D. Coolify ✅
- [x] App connectée au repo GitHub
- [x] Base Directory correcte
- [x] Variables d'environnement renseignées
- [x] Déploiement OK
- [x] Domaine/SSL configuré
- [x] Logs consultés après déploiement

---

## 1️⃣3️⃣ Dépannage Rapide

### Erreurs Fréquentes

| Erreur | Cause | Solution |
|--------|-------|----------|
| **Webhook n8n 404 GET** | URL ouverte dans navigateur (GET) | Utiliser l'orchestrateur (POST) |
| **Webhook test non enregistré** | Workflow n8n pas activé | Cliquer "Exécuter le workflow" dans n8n |
| **host.docker.internal introuvable** | URL dev en production | Remplacer par nom service (`http://baserow:80`) ou URL publique |
| **401/403 Coolify** | Token invalide ou droits | Vérifier `COOLIFY_API_KEY` et permissions |
| **Échec build Docker** | Dockerfile incorrect | Vérifier `COPY . .`, `WORKDIR`, `EXPOSE`, `package.json` présent |

### Logs Format
```
[2025-10-11T10:30:45.123Z] [service] Message
```

**Consultation logs:** Voir console serveur ou Coolify logs

---

## 📚 Documentation Complète

### Fichiers Créés
- ✅ `README.md` - Guide complet orchestrateur
- ✅ `TESTING.md` - Exemples de tests détaillés
- ✅ `SOCIAL_MEDIA_INTEGRATION.md` - Configuration 7 plateformes
- ✅ `.env.example` - Template variables d'environnement
- ✅ `test-endpoints.ps1` - Script de tests automatisé
- ✅ `.github/copilot-instructions.md` - Guide pour agents IA

### Dans le Code
- ✅ Clients API configurés (n8n, Coolify, Baserow, Video Toolkit)
- ✅ Endpoints REST implémentés et documentés
- ✅ Gestion d'erreurs standardisée
- ✅ Health check détaillé
- ✅ Logs structurés

---

## 🎉 Statut Actuel

### ✅ Phase 1 - COMPLÉTÉE
- Infrastructure orchestrateur fonctionnelle
- Tous les endpoints critiques implémentés
- Documentation exhaustive créée
- Tests manuels validés
- Prêt pour déploiement production

### 🔄 Phase 2 - EN COURS
- Configuration workflows n8n spécifiques
- Intégration credentials réseaux sociaux
- Tests end-to-end complets

### 📋 Phase 3 - PLANIFIÉE
- Optimisations (cache, queues)
- Dashboard analytics
- Fonctionnalités avancées (A/B testing, auto-réponses)

---

## 🚀 Prochaines Étapes

1. **Configurer n8n**
   - Importer workflows Content Creator et Brain Rotter 5000
   - Ajouter credentials pour toutes les plateformes
   - Tester chaque workflow individuellement

2. **Setup Baserow**
   - Créer tables pour métadonnées, assets, analytics
   - Configurer champs conformes aux workflows
   - Tester upload/récupération

3. **Intégration Réseaux Sociaux**
   - Suivre `SOCIAL_MEDIA_INTEGRATION.md`
   - Configurer OAuth pour chaque plateforme
   - Tests de publication sur chaque réseau

4. **Tests End-to-End**
   - Workflow complet: génération → production → publication
   - Vérifier logs et statuts
   - Valider analytics

5. **Production**
   - Déployer via Coolify
   - Configurer monitoring
   - Planifier publications initiales

---

**Version:** 1.0.0  
**Dernière mise à jour:** 11 Octobre 2025  
**Statut:** ✅ Ready for Production
