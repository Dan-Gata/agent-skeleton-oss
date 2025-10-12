# Coolify - Résolution des problèmes de déploiement

## Problème: L'ancienne interface s'affiche toujours après le déploiement

### Causes possibles:
1. Coolify n'a pas détecté le nouveau commit
2. Cache Docker non vidé
3. Container ancien toujours en cours d'exécution
4. Fichiers statiques en cache

---

## ✅ SOLUTION 1: Forcer le redéploiement complet

### Dans Coolify (https://kaussan-air.org):

1. **Aller dans votre application** → Onglet "Deployments"

2. **Arrêter l'application actuelle**:
   - Cliquez sur "Stop" ou "Force Stop"
   - Attendez que le statut devienne "Stopped"

3. **Vider le cache Docker**:
   - Onglet "Settings" → "Advanced"
   - Cherchez "Clear Build Cache" ou "Prune"
   - Confirmez l'action

4. **Redéployer manuellement**:
   - Cliquez sur "Deploy" ou "Redeploy"
   - **Vérifiez** que le commit affiché est `d127c37` (le dernier)
   - Si ce n'est pas le cas, cliquez sur "Pull Latest" d'abord

5. **Surveiller les logs de build**:
   ```
   ✓ Node 20-alpine doit apparaître (pas 18)
   ✓ Python3 installation doit réussir
   ✓ better-sqlite3 doit compiler sans erreur
   ✓ "npm install" doit réussir
   ✓ Container doit démarrer
   ✓ Health check doit passer
   ```

---

## ✅ SOLUTION 2: Forcer la reconstruction sans cache

### Si la Solution 1 ne fonctionne pas:

1. **Dans Coolify → Settings → Build Options**:
   - Ajoutez l'option: `--no-cache`
   - Ou cochez "Build without cache"

2. **Redéployer** avec cette option activée

---

## ✅ SOLUTION 3: Vérifier le commit déployé

### Dans Coolify → Deployments:

1. **Vérifiez le "Commit SHA"** du déploiement actuel
   - Doit être: `d127c37` (ou plus récent)
   - Si c'est un ancien commit (ex: `7a01640`), le déploiement n'a pas pris en compte les nouveaux changements

2. **Si c'est un ancien commit**:
   - Allez dans "Settings" → "Source"
   - Cliquez sur "Force Pull" ou "Sync Repository"
   - Redéployez ensuite

---

## ✅ SOLUTION 4: Vider le cache navigateur

### Si le serveur est bien déployé mais l'interface ne change pas:

1. **Vider le cache du navigateur**:
   - **Chrome/Edge**: `Ctrl + Shift + Delete` → Cochez "Images et fichiers en cache" → Effacer
   - **Firefox**: `Ctrl + Shift + Delete` → Cochez "Cache" → Effacer
   - Ou utilisez le mode navigation privée: `Ctrl + Shift + N`

2. **Forcer le rechargement**:
   - `Ctrl + F5` (Windows)
   - `Ctrl + Shift + R` (alternative)

---

## ✅ SOLUTION 5: Vérifier les variables d'environnement

### Assurez-vous que ces variables sont définies dans Coolify:

**Variables critiques** (minimum):
```bash
NODE_ENV=production
PORT=3000
OPENROUTER_API_KEY=votre_clé_ici  # Pour le Chat IA
```

**Variables importantes** (recommandées):
```bash
EMAIL_USER=votre_email@gmail.com
EMAIL_PASS=votre_mot_de_passe_app
EMAIL_FROM=votre_email@gmail.com
```

---

## 🔍 Vérification du déploiement réussi

### 1. Vérifier le endpoint `/health`:
```bash
curl https://votre-domaine.com/health
```

**Résultat attendu**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-10-12T...",
  "uptime": 123,
  "services": {
    "database": "operational",
    "openrouter": "not configured",
    "email": "not configured",
    "n8n": "not configured",
    "coolify": "not configured",
    "baserow": "not configured"
  }
}
```

### 2. Tester le nouveau dashboard:
```
https://votre-domaine.com/dashboard
```

**Vous devriez voir**:
- ✅ 4 onglets: Chat IA, Fichiers, Automation, Analytics
- ✅ Interface moderne avec couleurs dégradées
- ✅ Liste de 60+ modèles IA dans Chat IA
- ✅ Zone de téléchargement de fichiers
- ✅ 6 outils d'automation (n8n, Coolify, Baserow, etc.)

### 3. Tester le Chat IA:
1. Aller sur l'onglet "Chat IA"
2. Sélectionner un modèle (ex: "GPT-4o")
3. Envoyer un message test
4. Vérifier la réponse

---

## 📋 Checklist de diagnostic

- [ ] Commit `d127c37` visible dans Coolify
- [ ] Build logs montrent Node 20 (pas 18)
- [ ] better-sqlite3 compilé avec succès
- [ ] Container démarré (statut "Running")
- [ ] Health check réussi (vert)
- [ ] Domaine accessible
- [ ] Cache navigateur vidé
- [ ] `/health` retourne status "healthy"
- [ ] `/dashboard` affiche nouvelle interface
- [ ] Variables d'environnement configurées

---

## 🆘 Si rien ne fonctionne

### Dernière option: Supprimer et recréer l'application

1. **Sauvegarder vos variables d'environnement** (copier/coller quelque part)

2. **Dans Coolify**:
   - Aller dans Settings → "Danger Zone"
   - Cliquer sur "Delete Application"
   - Confirmer

3. **Recréer l'application**:
   - Ajouter une nouvelle application
   - Type: "Docker Compose" ou "Dockerfile"
   - Repository: `https://github.com/Dan-Gata/agent-skeleton-oss`
   - Branch: `main`
   - Dockerfile path: `/Dockerfile` (par défaut)

4. **Reconfigurer les variables d'environnement**

5. **Déployer**

---

## 📞 Informations de debug utiles

### Logs à vérifier dans Coolify:

1. **Build Logs**: Doivent montrer:
   ```
   FROM node:20-alpine    ← VERSION 20
   Installing Python3     ← PYTHON INSTALLÉ
   npm install success    ← PAS D'ERREUR
   ```

2. **Runtime Logs**: Doivent montrer:
   ```
   Server started on port 3000
   Health check endpoint active
   Database initialized
   ```

3. **Container Status**:
   - État: "Running" (vert)
   - Health: "Healthy" (vert)
   - Restart count: 0 (pas de crash)

---

## 🎯 Version déployée attendue

**Commit**: `d127c37` - "fix: Upgrade to Node 20 and add build dependencies"

**Fonctionnalités**:
- Chat IA avec 60+ modèles OpenRouter
- Upload de fichiers (PDF, Word, images)
- 6 outils d'automation
- Dashboard à 4 onglets
- Analytics en temps réel

**Dockerfile**:
- Base: `node:20-alpine`
- Python3 + build tools installés
- Health check configuré

---

**Date**: 12 octobre 2025  
**Version**: 1.0.0  
**Repository**: https://github.com/Dan-Gata/agent-skeleton-oss
