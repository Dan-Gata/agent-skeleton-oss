# 🔄 GUIDE DE RÉINSTALLATION COMPLÈTE
# Suppression et reconfiguration du conteneur avec toutes les variables d'environnement

## 📋 ÉTAPE 1 : SUPPRIMER COMPLÈTEMENT LE CONTENEUR EXISTANT

### Dans Coolify (Interface Web) :

1. **Accéder à votre application** :
   - Aller sur https://kaussan-air.org
   - Se connecter à Coolify
   - Chercher le projet "agent-skeleton-oss"

2. **Supprimer l'application** :
   - Cliquer sur l'application
   - Aller dans "Settings" ou "Paramètres"
   - Cliquer sur "Delete" ou "Supprimer"
   - Confirmer la suppression
   - ✅ Cela supprimera le conteneur, l'image Docker, et la configuration

## 📋 ÉTAPE 2 : CRÉER UNE NOUVELLE APPLICATION DANS COOLIFY

### Configuration de base :

1. **Créer nouvelle application** :
   - Cliquer sur "+ New Resource" ou "+ Nouvelle Ressource"
   - Choisir "Public Repository" ou "Dépôt Public"
   - Type : Application

2. **Configuration Git** :
   ```
   Repository URL: https://github.com/Dan-Gata/agent-skeleton-oss
   Branch: main
   Build Pack: Dockerfile
   ```

3. **Configuration du domaine** :
   ```
   Domain: superairloup080448.kaussan-air.org
   ```
   ✅ Coolify configurera automatiquement :
   - Traefik reverse proxy
   - Certificat SSL (Let's Encrypt)
   - Port mapping

## 📋 ÉTAPE 3 : CONFIGURER LES VARIABLES D'ENVIRONNEMENT

### Variables OBLIGATOIRES :

```bash
# ============================================================================
# CONFIGURATION BASE
# ============================================================================
NODE_ENV=production
PORT=3000

# ============================================================================
# OPENROUTER API (REQUIS pour le chat IA)
# ============================================================================
OPENROUTER_API_KEY=sk-or-v1-VOTRE_CLE_ICI
# ⚠️ Obtenir votre clé sur : https://openrouter.ai/keys
# Sans cette clé, le chat ne fonctionnera pas !

# ============================================================================
# N8N (Automatisation)
# ============================================================================
N8N_API_URL=https://n8n.kaussan-air.org
N8N_API_KEY=VOTRE_CLE_N8N_ICI
# ℹ️ Optionnel : Uniquement si vous utilisez n8n

# ============================================================================
# COOLIFY API (Déploiements)
# ============================================================================
COOLIFY_API_URL=https://kaussan-air.org
COOLIFY_API_KEY=VOTRE_CLE_COOLIFY_ICI
# ℹ️ Optionnel : Pour gérer les déploiements via l'interface

# ============================================================================
# BASEROW (Base de données)
# ============================================================================
BASEROW_URL=http://baserow:80
BASEROW_API_TOKEN=VOTRE_TOKEN_BASEROW_ICI
BASEROW_TABLE_ID=VOTRE_TABLE_ID_ICI
# ℹ️ Optionnel : Uniquement si vous utilisez Baserow

# ============================================================================
# EMAIL (Notifications)
# ============================================================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre.email@gmail.com
SMTP_PASSWORD=votre_mot_de_passe_app
SMTP_FROM=votre.email@gmail.com
# OU utiliser n8n comme relay
N8N_EMAIL_RELAY=https://n8n.kaussan-air.org/webhook/email
# ℹ️ Optionnel : Pour les notifications par email

# ============================================================================
# SÉCURITÉ
# ============================================================================
SESSION_SECRET=GENEREZ_UN_SECRET_ALEATOIRE_ICI_32_CARACTERES_MIN
# ⚠️ IMPORTANT : Générer un secret unique et sécurisé
# Exemple de génération : openssl rand -base64 32

# ============================================================================
# COOLIFY - CONFIGURATION AUTOMATIQUE
# ============================================================================
# Ces variables sont automatiquement définies par Coolify :
# - COOLIFY_URL
# - COOLIFY_FQDN
# - COOLIFY_BRANCH
# - COOLIFY_RESOURCE_UUID
# - COOLIFY_CONTAINER_NAME
```

## 📋 ÉTAPE 4 : CONFIGURER DANS COOLIFY

### Dans l'interface Coolify :

1. **Aller dans "Environment Variables"** ou "Variables d'environnement"

2. **Ajouter les variables UNE PAR UNE** :
   ```
   Nom : NODE_ENV
   Valeur : production
   [Cliquer "Add" ou "Ajouter"]

   Nom : PORT
   Valeur : 3000
   [Cliquer "Add"]

   Nom : OPENROUTER_API_KEY
   Valeur : sk-or-v1-VOTRE_CLE_REELLE
   [Cliquer "Add"]

   ... (répéter pour toutes les variables)
   ```

3. **Variables marquées comme "Secret"** :
   - Cocher "Is Secret" ou "Est Secret" pour :
     - OPENROUTER_API_KEY
     - N8N_API_KEY
     - COOLIFY_API_KEY
     - BASEROW_API_TOKEN
     - SESSION_SECRET
     - SMTP_PASSWORD

## 📋 ÉTAPE 5 : OBTENIR LES CLÉS API

### 🔑 OpenRouter API Key (OBLIGATOIRE) :

1. Aller sur https://openrouter.ai/
2. Créer un compte ou se connecter
3. Aller dans "Keys" ou "Clés"
4. Cliquer "Create API Key" ou "Créer une clé API"
5. Copier la clé : `sk-or-v1-...`
6. ⚠️ **Ajouter des crédits** : Aller dans "Credits" et ajouter au minimum 5-10$ pour tester

### 🔑 Session Secret :

**Générer un secret aléatoire** :

**Méthode 1 : En ligne**
- Aller sur https://www.random.org/strings/
- Generate 1 string, 32 characters
- Copier le résultat

**Méthode 2 : PowerShell**
```powershell
# Générer un secret de 32 caractères
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Méthode 3 : Node.js**
```javascript
// Exécuter dans la console du navigateur ou Node.js
require('crypto').randomBytes(32).toString('base64')
```

## 📋 ÉTAPE 6 : DÉPLOYER L'APPLICATION

### Dans Coolify :

1. **Vérifier la configuration** :
   - Repository : ✅ https://github.com/Dan-Gata/agent-skeleton-oss
   - Branch : ✅ main
   - Domain : ✅ superairloup080448.kaussan-air.org
   - Variables : ✅ Toutes configurées

2. **Lancer le déploiement** :
   - Cliquer sur "Deploy" ou "Déployer"
   - Attendre 5-10 minutes

3. **Surveiller les logs** :
   - Vérifier qu'il n'y a pas d'erreur "SyntaxError"
   - Attendre le message : "Agent Skeleton OSS démarré sur le port 3000"
   - Vérifier le healthcheck : "healthy" ✅

## 📋 ÉTAPE 7 : TESTER L'APPLICATION

### Tests de base :

1. **Healthcheck** :
   ```
   URL : https://superairloup080448.kaussan-air.org/health
   Attendu : JSON avec status "healthy"
   ```

2. **Page d'accueil** :
   ```
   URL : https://superairloup080448.kaussan-air.org/
   Attendu : Page de login
   ```

3. **Se connecter** :
   - Créer un compte (email + mot de passe)
   - Se connecter

4. **Dashboard** :
   ```
   URL : https://superairloup080448.kaussan-air.org/dashboard
   Attendu : Dashboard complet avec 60+ modèles
   ```

5. **Console navigateur (F12)** :
   ```
   Attendu : 0 erreurs
   Messages attendus :
   - "✅ Dashboard JavaScript chargé"
   - "✅ Toutes les fonctions JavaScript sont définies"
   ```

### Tests fonctionnels :

**1. Chat IA** :
- [ ] Sélectionner un modèle dans la liste
- [ ] Taper un message : "Bonjour, comment vas-tu ?"
- [ ] Cliquer "📤 Envoyer"
- [ ] Recevoir une réponse de l'IA

**2. Upload de fichiers** :
- [ ] Cliquer sur la zone d'upload
- [ ] Sélectionner un fichier texte
- [ ] Vérifier que le fichier apparaît dans la liste
- [ ] Vérifier que le compteur "Fichiers" s'incrémente

**3. Agents** :
- [ ] Cliquer sur une carte agent (ex: N8N Agent)
- [ ] Vérifier que le modal s'ouvre
- [ ] Lire les détails de l'agent
- [ ] Fermer le modal

**4. Instructions système** :
- [ ] Cliquer "➕ Instruction"
- [ ] Remplir le formulaire
- [ ] Ajouter l'instruction
- [ ] Vérifier qu'elle apparaît dans la liste

**5. Historique** :
- [ ] Vérifier que les messages s'affichent
- [ ] Vérifier la différenciation user/assistant

## 📋 ÉTAPE 8 : RÉSOLUTION DES PROBLÈMES

### ❌ Problème : "Application failed to start"

**Solution** :
1. Vérifier les logs Coolify
2. Chercher "Error" ou "SyntaxError"
3. Vérifier que toutes les dépendances npm sont installées
4. Vérifier que le port 3000 est exposé

### ❌ Problème : "Unhealthy" dans Coolify

**Solution** :
1. Vérifier que le healthcheck répond : `wget http://localhost:3000/health`
2. Vérifier les logs du conteneur : `docker logs <container_id>`
3. Augmenter le timeout du healthcheck dans Coolify (Settings > Healthcheck)

### ❌ Problème : Le dashboard affiche des erreurs JavaScript

**Solution** :
1. Ouvrir F12 (console navigateur)
2. Noter TOUTES les erreurs
3. Vider complètement le cache : Ctrl+Shift+Delete
4. Tester en navigation privée : Ctrl+Shift+N
5. Si erreur persiste : copier/coller les erreurs exactes

### ❌ Problème : Le chat ne répond pas

**Causes possibles** :
1. ❌ OPENROUTER_API_KEY non configurée ou invalide
2. ❌ Pas de crédits sur OpenRouter
3. ❌ Modèle non disponible

**Solution** :
1. Vérifier la clé API OpenRouter : https://openrouter.ai/keys
2. Vérifier les crédits : https://openrouter.ai/credits
3. Tester avec un modèle gratuit : "meta-llama/llama-3-8b-instruct:free"
4. Vérifier les logs : `docker logs <container_id> | grep "Chat"`

### ❌ Problème : "Cannot connect to database"

**Solution** :
1. La base de données SQLite est créée automatiquement
2. Vérifier les permissions du dossier : `/app/packages/orchestrator/src/`
3. Vérifier les logs : chercher "database.sqlite"

## 📋 ÉTAPE 9 : CONFIGURATION AVANCÉE (Optionnel)

### Configuration N8N :

Si vous voulez utiliser n8n pour l'automatisation :

1. Créer une application n8n dans Coolify
2. Obtenir l'URL : `https://n8n.kaussan-air.org`
3. Créer une API Key dans n8n
4. Ajouter les variables :
   ```
   N8N_API_URL=https://n8n.kaussan-air.org
   N8N_API_KEY=votre_cle_n8n
   ```

### Configuration Baserow :

Si vous voulez utiliser Baserow comme base de données :

1. Créer une application Baserow dans Coolify
2. Créer une table
3. Obtenir le token API
4. Ajouter les variables :
   ```
   BASEROW_URL=https://baserow.kaussan-air.org
   BASEROW_API_TOKEN=votre_token
   BASEROW_TABLE_ID=123456
   ```

## 🎯 CHECKLIST FINALE

Avant de dire que c'est terminé, vérifier :

- [ ] Application déployée dans Coolify
- [ ] Status : "healthy" ✅
- [ ] URL accessible : https://superairloup080448.kaussan-air.org
- [ ] Page de login s'affiche
- [ ] Peut créer un compte
- [ ] Dashboard s'affiche après login
- [ ] Console navigateur (F12) : 0 erreurs
- [ ] Chat IA fonctionne avec au moins 1 modèle
- [ ] Upload de fichiers fonctionne
- [ ] Variables d'environnement configurées :
  - [ ] NODE_ENV=production
  - [ ] PORT=3000
  - [ ] OPENROUTER_API_KEY=***
  - [ ] SESSION_SECRET=***
  - [ ] (Optionnel) N8N_API_URL et N8N_API_KEY
  - [ ] (Optionnel) COOLIFY_API_URL et COOLIFY_API_KEY
  - [ ] (Optionnel) BASEROW_URL, BASEROW_API_TOKEN, BASEROW_TABLE_ID

## 📞 SUPPORT

Si après TOUT cela l'application ne fonctionne toujours pas :

1. **Copier les logs Coolify complets** (du début à la fin du déploiement)
2. **Copier les logs du conteneur** : 
   ```bash
   docker logs <container_id> -n 200
   ```
3. **Copier les erreurs console navigateur** (F12)
4. **Faire une capture d'écran** du dashboard si visible
5. **Fournir toutes ces informations** pour un diagnostic complet

---

**Date** : ${new Date().toLocaleString('fr-FR')}  
**URL cible** : https://superairloup080448.kaussan-air.org  
**Status** : Guide de réinstallation complet prêt
