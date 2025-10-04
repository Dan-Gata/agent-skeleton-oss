# 🔧 Fix pour le Déploiement Coolify

## Problème Résolu

L'erreur "server no active" sur Coolify était causée par plusieurs problèmes :

1. ❌ **Pas de Dockerfile** - Coolify ne pouvait pas construire l'image Docker
2. ❌ **Fichier corrompu** - `packages/orchestrator/src/index.js` contenait des duplications de code
3. ❌ **Dépendances manquantes** - Le Dockerfile n'installait pas correctement les dépendances
4. ❌ **Pas de .dockerignore** - Trop de fichiers inutiles dans le build

## Solutions Appliquées

### ✅ 1. Dockerfile Créé
Un Dockerfile optimisé a été créé à la racine du projet :
- Installation des dépendances avec `npm install --production`
- Exposition du port 3000
- Health check intégré pour Coolify
- Variables d'environnement configurées

### ✅ 2. .dockerignore Ajouté
Fichier `.dockerignore` pour exclure :
- `node_modules` (réinstallés dans le build)
- Fichiers de configuration locale (`.env`, `.git`, etc.)
- Documentation et tests
- Fichiers temporaires

### ✅ 3. server.js Corrigé
Le fichier `server.js` utilise maintenant `./src/index.js` qui fonctionne correctement au lieu du fichier corrompu `./packages/orchestrator/src/index.js`.

### ✅ 4. Health Check Fonctionnel
Le endpoint `/health` retourne :
```json
{
  "status": "healthy",
  "timestamp": "2025-10-04T20:17:17.033Z",
  "version": "1.0.0",
  "services": {
    "coolify": "configured",
    "n8n": "configured"
  }
}
```

## 🚀 Déploiement sur Coolify

### Configuration Requise

1. **Repository Git** : Assurez-vous que le code est poussé sur GitHub
2. **Build Pack** : Docker
3. **Port** : 3000
4. **Health Check Path** : `/health`

### Variables d'Environnement Minimales

```bash
# Configuration de base
NODE_ENV=production
PORT=3000

# Optionnel - APIs externes
COOLIFY_API_URL=https://votre-coolify.com/api
COOLIFY_API_KEY=votre-cle-coolify
N8N_API_URL=https://votre-n8n.com/api/v1
N8N_API_KEY=votre-cle-n8n
```

### Étapes de Déploiement

1. **Créer une nouvelle application dans Coolify**
   - Source : Git Repository
   - URL : `https://github.com/Dan-Gata/agent-skeleton-oss`
   - Branch : `main` (ou la branche avec ce fix)

2. **Configurer le Build**
   - Build Pack : Docker
   - Dockerfile Path : `Dockerfile` (à la racine)
   - Port : 3000

3. **Ajouter les variables d'environnement**
   - Au minimum : `NODE_ENV=production` et `PORT=3000`

4. **Configurer le domaine**
   - Ajouter votre domaine personnalisé
   - Activer HTTPS/SSL automatique

5. **Déployer**
   - Cliquer sur "Deploy"
   - Suivre les logs en temps réel
   - Vérifier le health check : `https://votre-domaine.com/health`

## 🧪 Tests Locaux

Pour tester avant de déployer :

```bash
# Test du serveur Node.js
npm start
# ou
node server.js

# Vérifier le health check
curl http://localhost:3000/health

# Test du build Docker (optionnel)
docker build -t agent-skeleton-test .
docker run -p 3000:3000 agent-skeleton-test

# Tester dans le container
curl http://localhost:3000/health
```

## 📊 Vérification Post-Déploiement

Une fois déployé sur Coolify :

1. **Vérifier le health check**
   ```bash
   curl https://votre-domaine.com/health
   ```

2. **Vérifier l'API principale**
   ```bash
   curl https://votre-domaine.com/
   ```

3. **Consulter les logs Coolify**
   - Vérifier qu'il n'y a pas d'erreurs
   - Confirmer que le serveur écoute sur le port 3000

## ⚠️ Notes Importantes

1. **Fichier Corrompu** : Le fichier `packages/orchestrator/src/index.js` contient des duplications et ne doit PAS être utilisé tant qu'il n'est pas corrigé.

2. **Dependencies** : Les dépendances dans `packages/orchestrator/package.json` ne sont pas utilisées actuellement puisqu'on utilise `src/index.js`.

3. **Health Check Coolify** : Le Dockerfile inclut un health check qui sera automatiquement utilisé par Coolify pour vérifier que l'application fonctionne.

## 🐛 Dépannage

### L'application ne démarre pas
- Vérifier les logs Coolify
- S'assurer que `PORT=3000` est configuré
- Vérifier que le Dockerfile est bien détecté

### Health check échoue
- Vérifier que l'application écoute sur `0.0.0.0:3000` (pas seulement `localhost`)
- Tester le endpoint `/health` manuellement
- Vérifier les logs pour voir les erreurs

### Build Docker échoue
- S'assurer que `package.json` est à la racine
- Vérifier que toutes les dépendances sont listées
- Consulter les logs de build dans Coolify

## 📞 Support

Si vous rencontrez d'autres problèmes :
1. Consultez les logs détaillés dans Coolify
2. Vérifiez que toutes les variables d'environnement sont configurées
3. Testez localement avec `npm start` avant de déployer
4. Ouvrez une issue sur GitHub avec les logs d'erreur

## ✅ Résumé

Avec ces changements, votre application devrait maintenant :
- ✅ Se construire correctement avec Docker
- ✅ Démarrer sans erreurs
- ✅ Répondre au health check de Coolify
- ✅ Être accessible sur votre domaine

Le déploiement devrait prendre 2-5 minutes et l'application sera disponible dès que le health check passe au vert ! 🚀
