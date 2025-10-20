# 🧪 Guide de Test Rapide - Dashboard Fonctionnel

## ✅ Test 1 : Chat Interactif (30 secondes)

**Objectif :** Vérifier que le chat fonctionne et appelle l'API

### Étapes :
1. Ouvrez https://superairloup080448.kaussan-air.org/dashboard
2. Scrollez jusqu'à la section "💬 Chat avec les Agents IA"
3. Tapez : `Bonjour, liste les workflows n8n actifs`
4. Appuyez sur Enter (ou cliquez "📤 Envoyer")

### Résultats attendus :
- ✅ Votre message apparaît en **bleu** à droite
- ✅ Message "⏳ Envoi..." apparaît brièvement sur le bouton
- ✅ Réponse de l'IA apparaît en **vert** à gauche
- ✅ Section "Historique Conversations" se met à jour (après 2 secondes)

### Si ça ne marche pas :
- Ouvrez la console (F12)
- Vérifiez les erreurs en rouge
- Testez l'endpoint directement : `POST /api/chat`

---

## ✅ Test 2 : Upload de Fichiers (1 minute)

**Objectif :** Vérifier que l'upload fonctionne et stocke dans SQLite

### Étapes :
1. Scrollez jusqu'à la section "📁 Upload de Fichiers"
2. Cliquez sur la zone "📤 Cliquez pour choisir un fichier"
3. Sélectionnez n'importe quel fichier (txt, jpg, pdf, etc.)
4. Attendez le message de confirmation

### Résultats attendus :
- ✅ Message "Upload de '[nom fichier]' en cours..." s'affiche
- ✅ Message "✅ Fichier uploadé avec succès !" apparaît en vert
- ✅ Le fichier apparaît dans la liste en dessous avec :
  - Nom du fichier
  - Taille (KB ou MB)
  - Type (image/jpeg, text/plain, etc.)
  - Date d'aujourd'hui
  - Bouton "🗑️" rouge
- ✅ Statistique "Fichiers" en haut se met à jour (+1)

### Test supplémentaire :
1. Cliquez sur le bouton "🗑️" d'un fichier
2. Confirmez la suppression
3. Le fichier disparaît de la liste
4. Le compteur diminue de 1

### Si ça ne marche pas :
- Vérifiez que `/api/upload` existe et répond
- Vérifiez que SQLite `files` table existe
- Regardez les logs Coolify pour erreurs backend

---

## ✅ Test 3 : Instructions Système (45 secondes)

**Objectif :** Vérifier que les instructions sont sauvegardées (pas de redirect)

### Étapes :
1. Cliquez sur le bouton "➕ Instruction" (en haut à droite)
2. Remplissez le formulaire :
   - **Instruction :** "Réponds toujours avec des émojis 🎉"
   - **Catégorie :** Style de Réponse
   - **Priorité :** 8
3. Cliquez "✅ Ajouter l'Instruction"

### Résultats attendus :
- ✅ Modal se ferme automatiquement
- ✅ Alerte "✅ Instruction ajoutée avec succès !" s'affiche
- ✅ L'instruction apparaît dans la section "Instructions Système"
- ✅ Badge bleu "style" visible
- ✅ Badge bleu "Priorité: 8" visible
- ✅ **IMPORTANT :** Vous restez sur `/dashboard` (pas de redirect vers `/chat`)

### Test de suppression :
1. Cliquez sur le bouton "🗑️" de l'instruction
2. Confirmez
3. L'instruction disparaît

### Si ça redirige vers /chat :
- Videz le cache du navigateur (Ctrl+Shift+Delete)
- Rafraîchissez (Ctrl+F5)
- Vérifiez que vous avez bien le commit 94eee36

---

## ✅ Test 4 : Agents Interactifs (1 minute)

**Objectif :** Vérifier que les cartes agents ouvrent un modal détaillé

### Étapes :
1. Scrollez jusqu'à la section "Sous-Agents Spécialisés"
2. Cliquez sur la carte "⚡ N8N Agent"

### Résultats attendus :
- ✅ Modal s'ouvre par-dessus la page
- ✅ Titre : "⚡ N8N Agent"
- ✅ Section "📝 Description" avec texte
- ✅ Section "⚡ Capacités" avec liste à checkmarks :
  - ✅ Créer et exécuter des workflows
  - ✅ Déclencher des webhooks
  - ✅ Lister les workflows actifs
  - ✅ Supprimer des workflows
- ✅ Section "🎯 Actions Disponibles" avec boutons :
  - 📋 Lister les workflows
  - ▶️ Tester un workflow
- ✅ Encadré bleu "💡 Astuce" en bas

### Test de chaque agent :
Cliquez sur chaque carte et vérifiez qu'elle ouvre le bon modal :

1. **⚡ N8N Agent** → Modal avec actions workflows
2. **📁 File Agent** → Modal avec action "Voir les fichiers"
3. **🚀 Coolify Agent** → Modal avec action "Déployer un service"
4. **📊 Baserow Agent** → Modal avec action "Consulter les données"
5. **📧 Email Agent** → Modal avec action "Envoyer un test"
6. **🔒 Security Agent** → Modal avec action "Vérifier la sécurité"

### Test des actions :
1. Cliquez sur un bouton d'action dans le modal
2. Vérifiez qu'une action se produit (alert, fermeture modal, scroll, etc.)

### Si rien ne se passe au clic :
- Vérifiez la console (F12) pour erreurs JavaScript
- Vérifiez que l'attribut `onclick` est bien présent sur les cartes
- Rafraîchissez la page (Ctrl+F5)

---

## ✅ Test 5 : Navigation et UX (30 secondes)

**Objectif :** Vérifier que les boutons de navigation fonctionnent

### Test boutons header :

1. **Bouton "💬 Chat"** :
   - Cliquez
   - Page scroll automatiquement vers la section Chat
   - ✅ Scroll smooth vers "Chat avec les Agents IA"

2. **Bouton "📁 Upload"** :
   - Cliquez
   - Page scroll automatiquement vers la section Upload
   - ✅ Scroll smooth vers "Upload de Fichiers"

3. **Bouton "🔄 Actualiser"** :
   - Cliquez
   - ✅ Toutes les statistiques se rechargent
   - ✅ Historique se met à jour
   - ✅ Liste de fichiers se met à jour
   - ✅ Alert "🔄 Données actualisées !" s'affiche

---

## ✅ Test 6 : Auto-Refresh (30 secondes de patience)

**Objectif :** Vérifier que les données se rafraîchissent automatiquement

### Étapes :
1. Ouvrez la console (F12)
2. Restez sur le dashboard sans rien toucher
3. Attendez 30 secondes
4. Observez la console

### Résultats attendus :
- ✅ Au bout de 30 secondes, nouvelles requêtes API dans la console :
  - `GET /api/memory/stats`
  - `GET /api/files`
  - `GET /api/conversation/history?limit=10`
  - `GET /api/instructions/list`
- ✅ Les données se mettent à jour automatiquement

---

## 🎯 Checklist Globale

Après avoir effectué tous les tests, vérifiez :

### Fonctionnalités Critiques (LES 4 PROBLÈMES)
- [ ] ✅ **Chat** : J'ai pu envoyer un message et recevoir une réponse
- [ ] ✅ **Upload** : J'ai pu uploader un fichier et le voir dans la liste
- [ ] ✅ **Instructions** : J'ai pu ajouter une instruction sans être redirigé
- [ ] ✅ **Agents** : J'ai pu cliquer sur une carte agent et voir le modal

### UI/UX
- [ ] Design moderne et professionnel
- [ ] Pas d'erreurs dans la console navigateur
- [ ] Pas d'erreurs dans les logs Coolify
- [ ] Scroll smooth fonctionne
- [ ] Modals s'ouvrent et se ferment correctement
- [ ] Boutons ont un effet hover
- [ ] Messages de succès/erreur s'affichent

### Performance
- [ ] Pages se charge en moins de 2 secondes
- [ ] Chat répond en moins de 5 secondes
- [ ] Upload se termine en moins de 3 secondes
- [ ] Auto-refresh se déclenche toutes les 30 secondes

---

## 🐛 Debugging Rapide

### Problème : "Le chat ne répond pas"
```bash
# Vérifier l'endpoint
curl -X POST https://superairloup080448.kaussan-air.org/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test","model":"claude-3-5-sonnet-20241022"}'
```

### Problème : "L'upload échoue"
```bash
# Vérifier l'endpoint
curl -X POST https://superairloup080448.kaussan-air.org/api/upload \
  -F "file=@test.txt"
```

### Problème : "Les agents ne sont pas cliquables"
1. F12 > Elements
2. Cherchez `.agent-card`
3. Vérifiez que `onclick="showAgentDetails('n8n')"` est présent

### Problème : "Les données ne se rafraîchissent pas"
1. F12 > Network
2. Attendez 30 secondes
3. Vérifiez que les requêtes API partent automatiquement

---

## 📊 Résultats Attendus

Si TOUS les tests passent :

```
✅ Test 1 : Chat Interactif         → PASS
✅ Test 2 : Upload de Fichiers      → PASS
✅ Test 3 : Instructions Système    → PASS
✅ Test 4 : Agents Interactifs      → PASS
✅ Test 5 : Navigation et UX        → PASS
✅ Test 6 : Auto-Refresh            → PASS

🎉 DASHBOARD 100% FONCTIONNEL !
```

Vous pouvez maintenant utiliser le dashboard pour :
- Converser avec vos agents IA
- Uploader et gérer vos fichiers
- Configurer les instructions système
- Interagir avec les 6 sous-agents spécialisés

---

## 🚀 Prochaines Étapes

Maintenant que le dashboard est parfait, on peut implémenter :

1. **Endpoints d'orchestration** (`/health`, `/metrics`, `/intent/route`)
2. **Sécurité** (X-AGENT-KEY, helmet, rate-limit)
3. **Logging** (pino)
4. **Intégrations** (Baserow, Email, Man in the Loop)

---

**Dernière mise à jour :** 19 octobre 2025  
**Commit testé :** 94eee36  
**Status :** ✅ Prêt pour tests utilisateur
