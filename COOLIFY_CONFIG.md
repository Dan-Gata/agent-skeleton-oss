# 🔧 CONFIGURATION COOLIFY - Agent Skeleton OSS

## ⚠️ IMPORTANT : Configuration des Variables d'Environnement

### 🔒 RÈGLE D'OR : JAMAIS "Build Time" pour les secrets !

**Les variables d'environnement doivent être configurées comme suit dans Coolify :**

### ✅ Variables RUNTIME UNIQUEMENT (PAS Build Time)

```bash
# Application
NODE_ENV=production                    # ✅ Runtime SEULEMENT
PORT=3000                              # ✅ Runtime SEULEMENT

# OpenRouter API (OBLIGATOIRE pour le chat IA)
OPENROUTER_API_KEY=sk-or-v1-xxx        # ✅ Runtime + Secret

# URLs (automatiques via Coolify)
COOLIFY_URL=https://superairloup080448.kaussan-air.org
COOLIFY_FQDN=superairloup080448.kaussan-air.org
```

### ⚙️ Variables OPTIONNELLES (Services externes)

```bash
# N8N (Automatisation)
N8N_API_URL=https://n8n.kaussan-air.org
N8N_API_KEY=votre_clé_n8n              # ✅ Secret

# Coolify API (Déploiements)
COOLIFY_API_URL=https://kaussan-air.org
COOLIFY_API_KEY=votre_clé_coolify      # ✅ Secret

# Baserow (Base de données)
BASEROW_URL=http://baserow:80
BASEROW_API_TOKEN=votre_token_baserow  # ✅ Secret
BASEROW_TABLE_ID=xxx

# Email (Optionnel)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password                     # ✅ Secret
```

## 📋 PROCÉDURE DE CONFIGURATION DANS COOLIFY

### 1. Supprimer TOUTES les variables existantes

Dans Coolify → Service → Environment Variables :
- Supprimer toutes les variables une par une
- Confirmer chaque suppression

### 2. Recréer UNIQUEMENT les variables essentielles

Pour chaque variable :

#### NODE_ENV (ESSENTIELLE)
- Key: `NODE_ENV`
- Value: `production`
- ⬜ Build Time (DÉCOCHÉ)
- ✅ Runtime (COCHÉ)
- ⬜ Secret (DÉCOCHÉ)

#### PORT (ESSENTIELLE)
- Key: `PORT`
- Value: `3000`
- ⬜ Build Time (DÉCOCHÉ)
- ✅ Runtime (COCHÉ)
- ⬜ Secret (DÉCOCHÉ)

#### OPENROUTER_API_KEY (ESSENTIELLE pour le chat)
- Key: `OPENROUTER_API_KEY`
- Value: `sk-or-v1-...` (votre vraie clé)
- ⬜ Build Time (DÉCOCHÉ)
- ✅ Runtime (COCHÉ)
- ✅ Secret (COCHÉ)

### 3. Redéployer

- Cliquer sur "Deploy"
- Attendre 5-10 minutes
- Vérifier les logs

## 🔍 VÉRIFICATION POST-DÉPLOIEMENT

### Logs à surveiller

```bash
# ✅ BON - Démarrage réussi
🚀 Agent Skeleton OSS (Simple) démarré sur le port 3000
🌐 Interface: http://localhost:3000
💚 Health: http://localhost:3000/health

# ❌ MAUVAIS - Erreur de syntaxe
SyntaxError: Invalid or unexpected token

# ❌ MAUVAIS - Module manquant
Error: Cannot find module 'xxx'
```

### Tests à effectuer

```bash
# 1. Healthcheck
curl https://superairloup080448.kaussan-air.org/health
# Réponse attendue: {"status":"healthy",...}

# 2. Dashboard
https://superairloup080448.kaussan-air.org/dashboard
# Doit afficher le dashboard sans erreur console

# 3. Chat (si OPENROUTER_API_KEY configurée)
# Tester l'envoi d'un message dans le dashboard
```

## 🚨 PROBLÈMES COURANTS

### "Container unhealthy"
**Cause** : Variables Build Time au lieu de Runtime
**Solution** : Supprimer + Recréer en Runtime uniquement

### "SyntaxError"
**Cause** : Fichier index.js corrompu
**Solution** : `git pull origin main` puis redéployer

### "Cannot find module"
**Cause** : Dependencies manquantes
**Solution** : Vérifier que `npm install` s'exécute dans les logs

### "Port 3000 already in use"
**Cause** : Ancien conteneur non supprimé
**Solution** : Dans Coolify, supprimer l'ancien conteneur manuellement

## 🎯 CHECKLIST FINALE

- [ ] Toutes les anciennes variables supprimées
- [ ] NODE_ENV=production créée (Runtime uniquement)
- [ ] PORT=3000 créée (Runtime uniquement)
- [ ] OPENROUTER_API_KEY créée (Runtime + Secret)
- [ ] Aucune variable en "Build Time"
- [ ] Déploiement lancé
- [ ] Logs sans erreur "SyntaxError"
- [ ] Healthcheck "healthy"
- [ ] Dashboard accessible
- [ ] Console navigateur sans erreur (F12)

## 📞 EN CAS D'ÉCHEC

Si après avoir suivi cette procédure le déploiement échoue encore :

1. **Copier les logs Coolify complets**
2. **Noter le message d'erreur exact**
3. **Vérifier que git est à jour** : `git pull origin main`
4. **Vérifier le commit déployé** : Doit être `611191b` ou plus récent

---

**Date** : 26 octobre 2025
**Version** : Agent Skeleton OSS v1.0.1
**URL** : https://superairloup080448.kaussan-air.org
