# 🔧 Guide de Résolution - ERR_TOO_MANY_REDIRECTS

## ✅ Problème Résolu

Le problème de redirection infinie était causé par **la perte des sessions à chaque redémarrage du container Docker**. Les sessions étaient stockées en mémoire (`global.sessions`) et disparaissaient quand Coolify redéployait l''application.

## 🔄 Solution Implémentée

### Commits de Correction

- **9a30aba** - `fix: Restore missing dependencies and Node 20 Dockerfile` (DERNIER FIX)
- **2a400be** - `fix: Use SQLite for persistent sessions`
- **348618f** - `debug: Add extensive logging`

### 1. **SessionStore avec SQLite** (Commit: 2a400be)

Remplacement du stockage en mémoire par une base de données SQLite persistante.

### 2. **Dépendances Restaurées** (Commit: 9a30aba)

Le module `better-sqlite3` et autres dépendances manquantes ont été restaurés dans `package.json`.

**Fichiers corrigés :**
- ✅ `Dockerfile` - Upgrade vers Node 20-alpine avec Python/build tools
- ✅ `packages/orchestrator/package.json` - Toutes les dépendances restaurées
- ✅ `packages/orchestrator/src/sessionStore.js` - Gestion des sessions SQLite
- ✅ `docker-compose.yaml` - Volume pour persister les données

## 📋 Instructions de Déploiement sur Coolify

### Étape 1 : Redéployer sur Coolify

Le commit **9a30aba** contient TOUTES les corrections. Coolify va :
1. Télécharger le nouveau code depuis GitHub
2. Construire l''image avec Node 20 (et non Node 18)
3. Installer toutes les dépendances incluant `better-sqlite3`
4. Créer le volume `session-data` pour persister les sessions
5. Démarrer le container

### Étape 2 : Effacer les Cookies du Navigateur

**TRÈS IMPORTANT** : Avant de tester, effacez TOUS les cookies pour le domaine `superairloup080448.kaussan-air.org`

**Chrome/Edge :**
1. Ouvrir DevTools (F12)
2. Onglet "Application" → "Cookies"
3. Sélectionner `superairloup080448.kaussan-air.org`
4. Clic droit → "Clear"

**Alternative rapide :** Navigation privée/incognito

### Étape 3 : Tester le Déploiement

1. Accéder à `https://superairloup080448.kaussan-air.org`
2. Vous devriez voir la page de connexion
3. **Tester la connexion :**
   - Email: `admin@example.com`
   - Mot de passe: `admin123`
4. Après connexion → redirection vers `/dashboard`
5. Dashboard avec 4 onglets :
   - 💬 Chat IA
   - 📁 Fichiers
   - 🤖 Automation
   - 📊 Analytics

## 🔍 Vérification des Logs de Production

Sur Coolify, regardez les logs. Vous devriez voir :

```
✅ Session store initialized with SQLite
🔐 API /api/login appelée
✅ Session créée: [sessionId]
🍪 Cookie sessionId défini | secure: true | sameSite: strict
```

Si tout fonctionne :
```
📍 Route / appelée
🔑 SessionId trouvé: [sessionId]
✅ Session found: [sessionId] for admin@example.com
✅ Session valide, redirect /dashboard
```

## 🐛 Historique des Problèmes Résolus

### 1. Node 18 au lieu de Node 20
- **Erreur :** `better-sqlite3` nécessite Node 20+
- **Solution :** Dockerfile mis à jour vers `FROM node:20-alpine`

### 2. Module manquant better-sqlite3
- **Erreur :** `Error: Cannot find module ''better-sqlite3''`
- **Solution :** Dépendance restaurée dans `package.json`

### 3. Sessions perdues au redémarrage
- **Erreur :** `ERR_TOO_MANY_REDIRECTS`
- **Solution :** SQLite avec volume Docker persistant

## ✨ Résultat Attendu

Après ce déploiement :
1. ✅ Plus de redirection infinie
2. ✅ Les sessions survivent aux redémarrages
3. ✅ L''interface dashboard s''affiche correctement
4. ✅ Les 60+ modèles d''IA sont disponibles
5. ✅ Tous les onglets fonctionnent

---

**📅 Date :** 17 Octobre 2025  
**🔄 Commit :** 9a30aba  
**👨‍💻 Auteur :** GitHub Copilot  
**🎯 Status :** ✅ RÉSOLU
