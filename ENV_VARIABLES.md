# 🔐 Variables d'Environnement - Agent Skeleton OSS

## 📋 Vue d'Ensemble

Ce document liste **toutes** les variables d'environnement utilisées par l'application, leur status actuel, et les priorités de configuration.

---

## ✅ Variables ACTUELLEMENT Configurées

Ces variables sont **déjà configurées** dans Coolify et fonctionnent :

### 🔑 Anthropic / Claude
```env
ANTHROPIC_API_KEY=sk-ant-...
```
**Status :** ✅ Configuré  
**Utilisé pour :** Chat IA avec Claude 3.5 Sonnet  
**Endpoint :** `POST /api/chat`

---

### ⚡ N8N (Workflows)
```env
N8N_API_URL=https://n8n.kaussan-air.org
N8N_API_KEY=n8n_api_...
```
**Status :** ✅ Configuré  
**Utilisé pour :**
- Lister workflows : `GET /api/n8n/workflows`
- Déclencher workflows : `POST /api/n8n/trigger/:id`
- Supprimer workflows : `DELETE /api/n8n/workflows/:id`

**Vérifié dans /health :**
```bash
curl -s https://superairloup080448.kaussan-air.org/health | jq .services.n8n
# Devrait retourner: {"status": "configured", "url": "✅"}
```

---

### 🚀 Coolify (Déploiements)
```env
COOLIFY_API_URL=https://coolify.kaussan-air.org
COOLIFY_API_KEY=...
```
**Status :** ✅ Configuré  
**Utilisé pour :**
- Déployer services : `POST /api/coolify/deploy/:serviceId`

**Vérifié dans /health :**
```bash
curl -s https://superairloup080448.kaussan-air.org/health | jq .services.coolify
# Devrait retourner: {"status": "configured", "url": "✅"}
```

---

## ⚠️ Variables MANQUANTES (Non Critiques)

Ces variables ne sont **pas encore configurées** mais l'application fonctionne sans elles. Elles sont nécessaires pour certaines fonctionnalités avancées.

### 📊 Baserow (Base de Données)
```env
BASEROW_URL=https://baserow.kaussan-air.org
BASEROW_API_TOKEN=...
BASEROW_TABLE_ID=...
```
**Status :** ❌ Non configuré  
**Impact :**
- Pas de logging dans Baserow
- Endpoint `/baserow/rows` non fonctionnel
- Agent Baserow inactif

**Priorité :** 🟡 MOYENNE (pour audit logging)

**Vérifié dans /health :**
```bash
curl -s https://superairloup080448.kaussan-air.org/health | jq .services.baserow
# Retourne actuellement: {"status": "missing", "url": "❌", "table": "❌"}
```

**Comment configurer :**
1. Créer un compte Baserow
2. Créer une table pour les logs (colonnes : run_id, intent, status, result, timestamp)
3. Générer un token API
4. Ajouter dans Coolify :
   - `BASEROW_URL` : URL de votre instance
   - `BASEROW_API_TOKEN` : Token généré
   - `BASEROW_TABLE_ID` : ID de la table

---

### 📧 Email (Notifications)
```env
# Option 1 : SMTP Direct
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-app
EMAIL_FROM=ops@loup-solitaire.io

# Option 2 : Relay N8N
N8N_EMAIL_RELAY=https://n8n.kaussan-air.org/webhook/email
```
**Status :** ⚠️ Partiellement configuré (relay n8n possible)  
**Impact :**
- Endpoint `/email.send` peut utiliser n8n comme relay
- Pas d'envoi SMTP direct
- Man in the Loop emails non fonctionnels

**Priorité :** 🟢 BASSE (pour notifications automatiques)

**Vérifié dans /health :**
```bash
curl -s https://superairloup080448.kaussan-air.org/health | jq .services.email
# Retourne: {"status": "configured", "smtp": "❌", "relay": "✅"}
# (relay via n8n est possible)
```

**Comment configurer (SMTP Gmail) :**
1. Activer "Validation en 2 étapes" sur Gmail
2. Générer un "Mot de passe d'application"
3. Ajouter dans Coolify :
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=votre-email@gmail.com
   SMTP_PASS=xxxx-xxxx-xxxx-xxxx
   EMAIL_FROM=ops@loup-solitaire.io
   ```

---

## 🔐 Variables FUTURES (Spécifications)

Ces variables seront nécessaires pour les fonctionnalités à venir :

### 🛡️ Sécurité
```env
AGENT_API_KEY=secret-key-for-production
```
**Status :** ❌ Non configuré  
**Utilisé pour :**
- Header `X-AGENT-KEY` authentication
- Protection endpoints sensibles
- Production uniquement (optionnel en dev)

**Priorité :** 🟡 MOYENNE (quand endpoints directs seront publics)

**Sera vérifié dans :**
- `POST /intent/route`
- `POST /trigger/:webhookPath`
- `POST /run/:workflowId`
- `POST /coolify/deploy/:serviceId`
- Etc.

**Comment générer :**
```bash
# Linux/Mac
openssl rand -hex 32

# PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

---

### 📧 Notifications Man in the Loop
```env
ADMIN_EMAIL=admin@loup-solitaire.io
APPROVAL_TIMEOUT=300
```
**Status :** ❌ Non configuré  
**Utilisé pour :**
- Envoi d'emails d'approbation
- Timeout pour approbations (secondes)

**Priorité :** ⚪ BASSE (fonctionnalité future)

---

### 🌐 Application
```env
PORT=3000
NODE_ENV=production
DOMAIN=superairloup080448.kaussan-air.org
```
**Status :** ✅ PORT et NODE_ENV configurés automatiquement par Coolify  
**DOMAIN :** ❌ Non configuré mais peut être utile

**Utilisé pour :**
- `PORT` : Port d'écoute Express (3000 par défaut)
- `NODE_ENV` : Environnement (production/development)
- `DOMAIN` : Pour générer liens d'approbation

**Priorité :** 🟢 BASSE (fonctionne avec les defaults)

---

## 📊 Tableau Récapitulatif

| Variable | Status | Priorité | Impact |
|----------|--------|----------|--------|
| `ANTHROPIC_API_KEY` | ✅ Configuré | 🔴 CRITIQUE | Chat IA |
| `N8N_API_URL` | ✅ Configuré | 🔴 CRITIQUE | Workflows |
| `N8N_API_KEY` | ✅ Configuré | 🔴 CRITIQUE | Workflows |
| `COOLIFY_API_URL` | ✅ Configuré | 🔴 CRITIQUE | Déploiements |
| `COOLIFY_API_KEY` | ✅ Configuré | 🔴 CRITIQUE | Déploiements |
| `BASEROW_URL` | ❌ Manquant | 🟡 MOYENNE | Audit logging |
| `BASEROW_API_TOKEN` | ❌ Manquant | 🟡 MOYENNE | Audit logging |
| `BASEROW_TABLE_ID` | ❌ Manquant | 🟡 MOYENNE | Audit logging |
| `SMTP_HOST` | ❌ Manquant | 🟢 BASSE | Email direct |
| `SMTP_PORT` | ❌ Manquant | 🟢 BASSE | Email direct |
| `SMTP_USER` | ❌ Manquant | 🟢 BASSE | Email direct |
| `SMTP_PASS` | ❌ Manquant | 🟢 BASSE | Email direct |
| `EMAIL_FROM` | ❌ Manquant | 🟢 BASSE | Email sender |
| `N8N_EMAIL_RELAY` | ⚠️ Possible | 🟢 BASSE | Email via n8n |
| `AGENT_API_KEY` | ❌ Futur | 🟡 MOYENNE | Sécurité API |
| `ADMIN_EMAIL` | ❌ Futur | ⚪ BASSE | Approbations |
| `PORT` | ✅ Auto | ✅ OK | Port serveur |
| `NODE_ENV` | ✅ Auto | ✅ OK | Environnement |
| `DOMAIN` | ❌ Optionnel | 🟢 BASSE | Liens |

---

## 🧪 Vérification Rapide

### Test via /health
```bash
# Voir tous les services configurés
curl -s https://superairloup080448.kaussan-air.org/health | jq .services

# Résultat attendu actuel :
{
  "n8n": {
    "status": "configured",
    "url": "✅"
  },
  "coolify": {
    "status": "configured",
    "url": "✅"
  },
  "baserow": {
    "status": "missing",
    "url": "❌",
    "table": "❌"
  },
  "email": {
    "status": "configured",
    "smtp": "❌",
    "relay": "✅"
  },
  "database": {
    "status": "ok",
    "type": "SQLite",
    "conversations": "✅",
    "files": "✅",
    "sessions": "✅"
  }
}
```

### Test via /metrics
```bash
# Voir les compteurs
curl -s https://superairloup080448.kaussan-air.org/metrics | jq .counters
```

---

## 📝 Comment Ajouter une Variable dans Coolify

1. **Aller dans Coolify** : https://coolify.kaussan-air.org
2. **Sélectionner le projet** : agent-skeleton-oss
3. **Onglet "Environment Variables"**
4. **Cliquer "Add Variable"**
5. **Entrer :**
   - Name : `BASEROW_URL` (par exemple)
   - Value : `https://baserow.kaussan-air.org`
6. **Cliquer "Save"**
7. **Redémarrer le conteneur** (bouton "Restart")

---

## 🔍 Debugging

### Variable non prise en compte
1. Vérifier dans Coolify qu'elle est bien ajoutée
2. Redémarrer le conteneur
3. Vérifier dans les logs :
   ```bash
   # Afficher les logs Coolify
   # Section "Logs" dans l'interface
   ```
4. Tester `/health` pour voir si elle est détectée

### Variable avec valeur incorrecte
1. Vérifier qu'il n'y a pas d'espace avant/après
2. Vérifier que l'URL est bien https:// (pas http://)
3. Tester manuellement avec curl :
   ```bash
   curl -X GET https://baserow.kaussan-air.org \
     -H "Authorization: Token YOUR_TOKEN"
   ```

---

## 🎯 Prochaines Actions

### Maintenant (Dashboard fonctionne)
- ✅ ANTHROPIC_API_KEY configuré
- ✅ N8N configuré
- ✅ COOLIFY configuré

### Bientôt (Quand Baserow sera utilisé)
- [ ] Configurer `BASEROW_URL`
- [ ] Configurer `BASEROW_API_TOKEN`
- [ ] Configurer `BASEROW_TABLE_ID`

### Plus tard (Quand endpoints publics seront activés)
- [ ] Générer et configurer `AGENT_API_KEY`
- [ ] Configurer `ADMIN_EMAIL`
- [ ] Optionnel : Configurer SMTP

---

## 📚 Ressources

- [Documentation Baserow API](https://baserow.io/api-docs)
- [Documentation N8N API](https://docs.n8n.io/api/)
- [Documentation Coolify API](https://coolify.io/docs/api)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)

---

**Dernière mise à jour :** 19 octobre 2025  
**Commit :** 087d242  
**Status :** Variables critiques ✅ configurées, variables optionnelles ⚠️ documentées
