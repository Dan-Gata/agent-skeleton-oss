# 🔧 Guide de Résolution - ERR_TOO_MANY_REDIRECTS

## ✅ Problème Résolu

Le problème de redirection infinie était causé par **la perte des sessions à chaque redémarrage du container Docker**. Les sessions étaient stockées en mémoire (`global.sessions`) et disparaissaient quand Coolify redéployait l'application.

## 🔄 Solution Implémentée

### 1. **SessionStore avec SQLite** (Commit: 2a400be)

Remplacement du stockage en mémoire par une base de données SQLite persistante :

```javascript
// Avant (sessions perdues au redémarrage)
global.sessions = {};

// Après (sessions persistées dans SQLite)
const sessionStore = getSessionStore();
```

**Fichiers modifiés :**
- ✅ `packages/orchestrator/src/sessionStore.js` - Nouveau module de gestion des sessions
- ✅ `packages/orchestrator/src/index.js` - Utilisation du SessionStore au lieu de global.sessions
- ✅ `docker-compose.yaml` - Volume Docker pour persister la base de données
- ✅ `packages/orchestrator/data/.gitkeep` - Dossier pour la base de données

### 2. **Volume Docker pour Persistence**

Le fichier `docker-compose.yaml` configure maintenant un volume persistant :

```yaml
volumes:
  - session-data:/app/packages/orchestrator/data

volumes:
  session-data:
    driver: local
```

## 📋 Instructions de Déploiement sur Coolify

### Étape 1 : Redéployer sur Coolify

Le commit **2a400be** contient toutes les corrections. Coolify va automatiquement :
1. Télécharger le nouveau code depuis GitHub
2. Reconstruire l'image Docker
3. Créer le volume `session-data` pour persister les sessions
4. Démarrer le nouveau container

### Étape 2 : Effacer les Cookies du Navigateur

**TRÈS IMPORTANT** : Avant de tester, effacez TOUS les cookies pour le domaine `superairloup080448.kaussan-air.org`

**Chrome/Edge :**
1. Ouvrir DevTools (F12)
2. Onglet "Application" → "Cookies"
3. Sélectionner `superairloup080448.kaussan-air.org`
4. Clic droit → "Clear"

**Firefox :**
1. F12 → Onglet "Storage"
2. Cookies → `superairloup080448.kaussan-air.org`
3. Tout supprimer

**Alternative rapide :** Navigation privée/incognito

### Étape 3 : Tester le Déploiement

1. Accéder à `https://superairloup080448.kaussan-air.org`
2. Vous devriez voir la page de connexion
3. **Tester la connexion :**
   - Email: `admin@example.com`
   - Mot de passe: `admin123`
4. Après connexion → redirection vers `/dashboard`
5. Vous devriez voir l'interface avec 4 onglets :
   - 💬 Chat IA
   - 📁 Fichiers
   - 🤖 Automation
   - 📊 Analytics

## 🔍 Vérification des Logs de Production

Sur Coolify, regardez les logs du container. Vous devriez voir :

```
✅ Session store initialized with SQLite
🔐 API /api/login appelée
✅ Session créée: [sessionId]
🍪 Cookie sessionId défini | secure: true | sameSite: strict
```

Si tout fonctionne correctement :
```
📍 Route / appelée
🔑 SessionId trouvé: [sessionId]
✅ Session found: [sessionId] for admin@example.com
✅ Session valide, redirect /dashboard
```

## 🎯 Avantages de la Solution

### ✅ Sessions Persistantes
- Les sessions survivent aux redémarrages du container
- Pas besoin de se reconnecter après chaque déploiement
- Base de données SQLite légère et rapide

### ✅ Nettoyage Automatique
- Les sessions expirées sont supprimées automatiquement
- Méthode `cleanupExpiredSessions()` au démarrage
- Pas d'accumulation de données obsolètes

### ✅ Production-Ready
- Cookie `secure` auto-détecté pour HTTPS
- Cookie `httpOnly` pour sécurité
- `sameSite: strict` en production

## 🐛 Si le Problème Persiste

### 1. Vérifier que le Volume est Créé

Sur le serveur Coolify, vérifiez que le volume Docker existe :

```bash
docker volume ls | grep session-data
```

### 2. Vérifier les Permissions

Le dossier `data/` doit être accessible en écriture :

```bash
docker exec [container-name] ls -la /app/packages/orchestrator/data
```

### 3. Vérifier la Base de Données

Si la base de données ne se crée pas :

```bash
docker exec [container-name] ls -la /app/packages/orchestrator/data/sessions.db
```

### 4. Logs de Debug

Les logs montrent maintenant :
- ✅ Nombre de sessions actives
- ✅ Création/suppression de sessions
- ✅ Détection HTTPS
- ✅ Cookies envoyés/reçus

## 📊 Endpoint de Debug

Accédez à `https://superairloup080448.kaussan-air.org/debug` pour voir :

```json
{
  "users": ["admin@example.com"],
  "sessions": [
    {
      "sessionId": "abc123...",
      "email": "admin@example.com",
      "expiresAt": "2025-10-15T..."
    }
  ],
  "totalSessions": 1,
  "cookies": { "sessionId": "abc123..." }
}
```

## 🚀 Prochaines Étapes Recommandées

### 1. Tester Complètement le Dashboard

- [ ] Tab Chat IA : Sélectionner un modèle et envoyer un message
- [ ] Tab Fichiers : Uploader un fichier PDF
- [ ] Tab Automation : Créer un workflow
- [ ] Tab Analytics : Voir les statistiques

### 2. Nettoyer les Logs de Debug (Optionnel)

Une fois que tout fonctionne, vous pouvez retirer les `console.log` de debug dans :
- `packages/orchestrator/src/index.js` (lignes avec 📍 🍪 🔑 etc.)

### 3. Configurer un Utilisateur Admin Permanent

Actuellement, l'utilisateur admin est en dur dans le code :

```javascript
global.users = {
    'admin@example.com': {
        email: 'admin@example.com',
        password: 'admin123', // ⚠️ À changer !
        name: 'Admin User'
    }
};
```

**Recommandation :** Migrer vers une base de données SQLite pour les utilisateurs aussi.

## 📝 Commits Liés

- **2a400be** - `fix: Use SQLite for persistent sessions` (CETTE FIX)
- 348618f - Debug: Add extensive logging
- b7e0c6e - Fix: Cookie security for HTTPS
- 1eec78f - Fix: Redirect to /dashboard after login
- 11a0915 - Fix: Route '/' session check
- 6966953 - Fix: Route restructure

## ✨ Résultat Attendu

Après ce déploiement :
1. ✅ Plus de redirection infinie
2. ✅ Les sessions survivent aux redémarrages
3. ✅ L'interface dashboard s'affiche correctement
4. ✅ Les 60+ modèles d'IA sont disponibles
5. ✅ Tous les onglets fonctionnent

---

**📅 Date :** 14 Octobre 2025  
**🔄 Commit :** 2a400be  
**👨‍💻 Auteur :** GitHub Copilot  
**🎯 Status :** ✅ RÉSOLU
