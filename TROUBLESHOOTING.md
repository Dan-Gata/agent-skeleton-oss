# 🔧 Guide de Dépannage - Coolify Deployment

## ❌ Problèmes Courants et Solutions

### 1. "Error Server No Active" ✅ RÉSOLU

**Symptôme** : Coolify affiche "error server no active" lors du déploiement

**Causes identifiées** :
- ✅ Dockerfile manquant à la racine du projet
- ✅ Fichier `packages/orchestrator/src/index.js` corrompu avec code dupliqué
- ✅ `server.js` pointait vers le mauvais fichier

**Solution appliquée** :
1. Dockerfile créé avec configuration optimale
2. `server.js` utilise maintenant `src/index.js` qui fonctionne
3. Health check ajouté au Dockerfile
4. `.dockerignore` créé pour build propre

**Vérification** :
```bash
# Testez localement avant de déployer
./verify-deployment.sh
```

---

### 2. Build Docker Échoue

**Symptôme** : Le build échoue dans Coolify avec des erreurs npm

**Solutions possibles** :

#### A. Dépendances manquantes dans package.json
```bash
# Vérifiez que package.json contient toutes les dépendances
cat package.json | grep -A 10 "dependencies"

# Si manquantes, ajoutez :
npm install --save express axios dotenv ejs
```

#### B. Problème de cache npm
Dans Coolify :
1. Allez dans les paramètres de l'application
2. Activez "Clear build cache"
3. Redéployez

#### C. Version de Node.js
Vérifiez le Dockerfile :
```dockerfile
FROM node:18-alpine  # Assurez-vous d'utiliser Node 18+
```

---

### 3. Serveur Démarre Mais Health Check Échoue

**Symptôme** : Le serveur semble démarrer mais Coolify le marque comme "unhealthy"

**Solutions** :

#### A. Port incorrect
Vérifiez dans Coolify → Environment Variables :
```env
PORT=3000  # Doit correspondre à EXPOSE dans Dockerfile
```

#### B. Health check path incorrect
Dans Coolify → Settings → Health Check :
- Path : `/health`
- Method : GET
- Expected Status : 200

#### C. Serveur n'écoute pas sur 0.0.0.0
Vérifiez dans `src/index.js` :
```javascript
app.listen(PORT, '0.0.0.0', () => {  // Important : 0.0.0.0 pas localhost
    console.log(`Agent running on port ${PORT}`);
});
```

---

### 4. Domaine Ne Fonctionne Pas

**Symptôme** : L'application est déployée mais inaccessible via le domaine

**Solutions** :

#### A. Vérifier la configuration DNS
```bash
# Testez que le domaine pointe vers Coolify
dig votre-domaine.com
nslookup votre-domaine.com
```

Le domaine doit pointer vers l'IP de votre serveur Coolify.

#### B. SSL/HTTPS en cours de génération
- Les certificats Let's Encrypt peuvent prendre 5-10 minutes
- Consultez les logs Coolify pour voir la progression
- Testez temporairement avec http:// (non sécurisé)

#### C. Configuration du domaine dans Coolify
1. Application → Domains
2. Vérifiez que le domaine est bien configuré
3. Testez la génération SSL :
   - Remove domain
   - Re-add domain
   - Wait for SSL generation

---

### 5. Variables d'Environnement Non Prises en Compte

**Symptôme** : Les services externes (n8n, Coolify API) ne fonctionnent pas

**Solutions** :

#### A. Variables mal configurées
Dans Coolify → Environment :
```env
# Vérifiez qu'il n'y a pas de guillemets superflus
PORT=3000                    # ✅ Correct
PORT="3000"                  # ❌ Peut causer des problèmes

# URLs doivent être complètes
N8N_API_URL=https://n8n.example.com/api/v1  # ✅ Correct
N8N_API_URL=n8n.example.com                 # ❌ Incomplet
```

#### B. Redémarrage nécessaire
Après modification des variables :
1. Cliquez sur "Restart" (pas "Redeploy")
2. Les variables seront rechargées

#### C. Variables sensibles
Pour les clés API :
- Ne jamais commiter dans Git
- Utiliser uniquement l'interface Coolify
- Marquer comme "Secret" si disponible

---

### 6. Erreur "Cannot find module"

**Symptôme** : Le serveur crash avec "Cannot find module 'express'" ou similaire

**Solutions** :

#### A. Vérifier le Dockerfile
Assurez-vous que les dépendances sont installées :
```dockerfile
# Dans le Dockerfile
RUN npm install --production
```

#### B. Vérifier package.json
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.5.0",
    "dotenv": "^16.3.1",
    "ejs": "^3.1.9"
  }
}
```

#### C. Cache npm corrompu
Dans Coolify :
1. Build Settings → Advanced
2. Cochez "Clear all caches"
3. Redéployez

---

### 7. Logs Coolify

**Comment accéder aux logs** :

1. **Build Logs** : Pendant le build, visible en temps réel
2. **Runtime Logs** : Application → Logs
3. **System Logs** : Server → Logs

**Filtrer les logs** :
```bash
# Recherchez les erreurs
grep -i "error" logs.txt
grep -i "failed" logs.txt

# Recherchez le démarrage
grep -i "agent running" logs.txt
grep -i "health check" logs.txt
```

---

### 8. Performance et Ressources

**Symptôme** : L'application est lente ou se coupe

**Solutions** :

#### A. Vérifier les ressources
Dans Coolify → Resources :
- CPU : Minimum 0.5 vCPU
- RAM : Minimum 512 MB
- Storage : Minimum 1 GB

#### B. Optimiser l'image Docker
```dockerfile
# Utiliser alpine pour une image plus légère
FROM node:18-alpine

# Production build uniquement
RUN npm install --production
```

#### C. Monitoring
Ajoutez des logs de performance :
```javascript
// Dans src/index.js
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});
```

---

## 🧪 Tests de Diagnostic

### Test Local Complet
```bash
# 1. Vérification de la configuration
./verify-deployment.sh

# 2. Test manuel du serveur
npm start

# 3. Test des endpoints
curl http://localhost:3000/health
curl http://localhost:3000/

# 4. Vérifier les logs
# Pas d'erreurs dans la console ?
```

### Test Docker Local (Optionnel)
```bash
# Build l'image
docker build -t agent-test .

# Run le container
docker run -p 3000:3000 -e PORT=3000 agent-test

# Tester
curl http://localhost:3000/health
```

---

## 📞 Obtenir de l'Aide

### Informations à Fournir
Quand vous demandez de l'aide, incluez :

1. **Logs Coolify** : Copiez les logs de build et runtime
2. **Configuration** : Variables d'environnement (sans les clés secrètes)
3. **Étapes reproduites** : Ce que vous avez essayé
4. **Version** : Node.js, système d'exploitation du serveur

### Checklist de Vérification
- [ ] Dockerfile présent à la racine
- [ ] `.dockerignore` présent
- [ ] `server.js` utilise `src/index.js`
- [ ] `package.json` contient toutes les dépendances
- [ ] Variables d'environnement configurées
- [ ] Port 3000 exposé et configuré
- [ ] Health check path = `/health`
- [ ] DNS pointe vers le serveur Coolify
- [ ] Test local réussi avec `./verify-deployment.sh`

---

## ✅ Résolution Réussie

Si tout fonctionne :
```bash
✅ Serveur démarré
✅ Health check répond
✅ Domaine accessible
✅ Variables d'environnement chargées
✅ Logs sans erreurs
```

**Prochaines étapes** :
1. 🔒 Configurez les clés API pour les services IA
2. 🔗 Intégrez n8n, Baserow, etc.
3. 📊 Activez le monitoring
4. 🔄 Configurez les webhooks pour auto-deploy
5. 🎉 Profitez de votre agent !

---

**Besoin d'aide ?** Ouvrez une issue sur GitHub avec les détails de votre problème et les logs Coolify.
