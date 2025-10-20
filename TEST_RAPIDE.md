# ⚡ GUIDE RAPIDE - Tester les Nouvelles Fonctionnalités

## 🎯 Problèmes Résolus (Commit fca7166)

### 1. ✅ Extraction ID Workflow - **FONCTIONNE MAINTENANT**

**Avant**: ❌ `ID de workflow requis pour la suppression`

**Après**: ✅ Détecte tous les formats:
- `(ID: 3wnBU3rbhJATJfYW)`
- `ID: 3wnBU3rbhJATJfYW`
- `` `3wnBU3rbhJATJfYW` ``
- `workflow: 3wnBU3rbhJATJfYW`
- `3wnBU3rbhJATJfYW`

### 2. ✅ Historique Conversations - **IMPLÉMENTÉ**

L'agent se souvient maintenant de TOUTES vos conversations passées.

### 3. ✅ Instructions Système - **IMPLÉMENTÉ**

Vous pouvez apprendre à l'agent comment se comporter.

---

## 🧪 Tests Immédiats

### Test 1: Suppression Workflow (Résolution du Bug)

**Dans le chat de l'application:**

```
User: suprime moi cette workflow (ID: 3wnBU3rbhJATJfYW)
```

**Résultat attendu**:
```
🤖 Assistant IA via Orchestrateur

✅ Workflow 'Demo: My first AI Agent in n8n' supprimé et vérifié avec succès

Le workflow n'existe plus dans N8N (confirmé par vérification 404).

🤖 Agents utilisés: N8NAgent
```

**Si erreur `N8N_API_KEY non configurée`**: Voir `ACTION_IMMEDIATE.md`

---

### Test 2: Ajouter une Instruction Système

**Via curl** (remplacer `xxx` par votre sessionId):

```bash
curl -X POST http://localhost:3000/api/instructions/add \
  -H "Cookie: sessionId=xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "instruction": "Réponds toujours avec des émojis et sois enthousiaste",
    "category": "style",
    "priority": 10
  }'
```

**Résultat**:
```json
{
  "success": true,
  "message": "Instruction ajoutée avec succès",
  "instructionId": 1
}
```

**Maintenant dans le chat:**
```
User: Bonjour

Agent: 📋 Instructions système actives:
       1. [STYLE] Réponds toujours avec des émojis et sois enthousiaste
       
       🤖 Bonjour ! 👋 Super de te voir ! 🎉 
       Comment puis-je t'aider aujourd'hui ? 😊
```

**L'agent suivra TOUJOURS cette instruction dans TOUTES ses réponses!**

---

### Test 3: Vérifier l'Historique

**Faire plusieurs échanges**:
```
User: Liste mes workflows
Agent: [...liste...]

User: Combien j'en ai?
Agent: [...répond...]

User: Supprime le premier
Agent: [...supprime...]
```

**Puis demander**:
```
User: Rappelle-moi ce qu'on a fait ensemble

Agent: 📚 Historique de vos conversations récentes:

       👤 Vous (il y a 5 min): Liste mes workflows
       🤖 Assistant: [liste des 14 workflows...]
       
       👤 Vous (il y a 3 min): Combien j'en ai?
       🤖 Assistant: Vous avez 14 workflows...
       
       👤 Vous (il y a 1 min): Supprime le premier
       🤖 Assistant: ✅ Workflow supprimé...
```

---

## 🔧 Configuration Avancée

### Ajouter Plusieurs Instructions

**Instruction 1 - Langue**:
```bash
curl -X POST http://localhost:3000/api/instructions/add \
  -H "Cookie: sessionId=xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "instruction": "Réponds TOUJOURS en français",
    "category": "language",
    "priority": 10
  }'
```

**Instruction 2 - Ton**:
```bash
curl -X POST http://localhost:3000/api/instructions/add \
  -H "Cookie: sessionId=xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "instruction": "Sois professionnel mais amical dans tes réponses",
    "category": "tone",
    "priority": 9
  }'
```

**Instruction 3 - Comportement**:
```bash
curl -X POST http://localhost:3000/api/instructions/add \
  -H "Cookie: sessionId=xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "instruction": "Avant de supprimer un workflow, demande toujours confirmation",
    "category": "behavior",
    "priority": 8
  }'
```

**Instruction 4 - Format**:
```bash
curl -X POST http://localhost:3000/api/instructions/add \
  -H "Cookie: sessionId=xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "instruction": "Utilise des listes à puces et des émojis pour clarté",
    "category": "format",
    "priority": 7
  }'
```

**Maintenant chatter**:
```
User: suprime moi le workflow 3wnBU3rbhJATJfYW

Agent: 📋 Instructions système actives:
       1. [LANGUAGE] Réponds TOUJOURS en français
       2. [TONE] Sois professionnel mais amical
       3. [BEHAVIOR] Demande confirmation avant suppression
       4. [FORMAT] Utilise listes à puces et émojis
       
       🤖 Bonjour ! 👋
       
       ⚠️ Confirmation de suppression:
       
       • **Workflow**: Demo: My first AI Agent in n8n
       • **ID**: 3wnBU3rbhJATJfYW
       • **Statut**: Inactif
       
       🔴 Êtes-vous sûr de vouloir supprimer ce workflow ?
       
       Répondez "oui" pour confirmer ou "non" pour annuler.
```

---

## 📊 Utiliser les API

### Liste des Instructions Actives

```bash
curl http://localhost:3000/api/instructions/list \
  -H "Cookie: sessionId=xxx"
```

**Résultat**:
```json
{
  "success": true,
  "instructions": [
    {
      "id": 1,
      "userId": "admin@example.com",
      "instruction": "Réponds TOUJOURS en français",
      "category": "language",
      "priority": 10,
      "active": 1,
      "createdAt": "2025-10-19T05:30:00.000Z"
    },
    {
      "id": 2,
      "instruction": "Sois professionnel mais amical",
      "category": "tone",
      "priority": 9,
      "active": 1
    }
  ],
  "count": 2
}
```

### Désactiver une Instruction

```bash
curl -X DELETE http://localhost:3000/api/instructions/1 \
  -H "Cookie: sessionId=xxx"
```

**Résultat**:
```json
{
  "success": true,
  "message": "Instruction désactivée"
}
```

### Voir l'Historique Complet

```bash
curl "http://localhost:3000/api/conversation/history?limit=100" \
  -H "Cookie: sessionId=xxx"
```

### Rechercher dans l'Historique

```bash
curl -X POST http://localhost:3000/api/conversation/search \
  -H "Cookie: sessionId=xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "workflow",
    "limit": 20
  }'
```

### Statistiques Mémoire

```bash
curl http://localhost:3000/api/memory/stats \
  -H "Cookie: sessionId=xxx"
```

**Résultat**:
```json
{
  "success": true,
  "stats": {
    "totalMessages": 150,
    "totalInstructions": 4,
    "recentMessages": 25
  }
}
```

### Nettoyer Historique Ancien

```bash
# Supprimer messages > 90 jours
curl -X DELETE "http://localhost:3000/api/conversation/clear?days=90" \
  -H "Cookie: sessionId=xxx"
```

---

## 🐛 Debug - Vérifier que ça Marche

### 1. Vérifier Tables SQLite

```bash
cd packages/orchestrator

# Ouvrir la base de données
sqlite3 data/sessions.db

# Lister les tables
.tables
# Devrait afficher: conversations  files  sessions  system_instructions

# Voir les conversations
SELECT * FROM conversations ORDER BY createdAt DESC LIMIT 5;

# Voir les instructions
SELECT * FROM system_instructions WHERE active = 1;

# Quitter
.quit
```

### 2. Vérifier Logs Console

**Lancer le serveur avec logs détaillés**:
```bash
cd packages/orchestrator
node src/index.js
```

**Dans les logs, chercher**:
```
💭 [ConversationMemory] Initialisation mémoire conversations
✅ [ConversationMemory] Tables initialisées
```

**Quand vous chattez**:
```
💬 Chat reçu: { model: 'openai/gpt-3.5-turbo', messageLength: 50, userId: 'admin@example.com' }
✅ [ConversationMemory] Message sauvegardé: user - suprime moi cette workflow...
🎯 [OrchestratorAgent] ID workflow extrait: 3wnBU3rbhJATJfYW via pattern: ...
🗑️ [N8NAgent] Suppression workflow: 3wnBU3rbhJATJfYW
✅ [N8NAgent] VÉRIFIÉ: Workflow vraiment supprimé (404)
✅ [ConversationMemory] Message sauvegardé: assistant - Workflow supprimé...
```

---

## ✅ Checklist de Validation

- [ ] **Serveur démarre** sans erreur
- [ ] **Tables créées** (conversations, system_instructions)
- [ ] **Suppression workflow** fonctionne avec `(ID: xxx)`
- [ ] **Instruction ajoutée** via API
- [ ] **Agent applique** l'instruction dans le chat
- [ ] **Historique sauvegardé** après chaque message
- [ ] **Contexte récupéré** dans les réponses
- [ ] **Recherche historique** fonctionne
- [ ] **Stats mémoire** affichées correctement

---

## 🚨 Si Problème

### Erreur: `N8N_API_KEY non configurée`

**Solution**: Voir `ACTION_IMMEDIATE.md` - Configurer dans Coolify

### Erreur: `Cannot find module 'ConversationMemory'`

**Solution**:
```bash
cd packages/orchestrator
npm install  # S'assurer que better-sqlite3 est installé
```

### Base de données non créée

**Solution**:
```bash
mkdir -p packages/orchestrator/data
# Relancer le serveur
```

### Instructions non appliquées

**Vérifier dans SQLite**:
```bash
sqlite3 data/sessions.db
SELECT * FROM system_instructions WHERE active = 1;
```

Si vide, les instructions ne sont pas sauvegardées. Vérifier logs.

---

## 🎯 Exemple Complet de Workflow

**Scénario**: Configurer un agent personnel

1. **Ajouter instructions**:
   ```bash
   # Langue
   curl -X POST http://localhost:3000/api/instructions/add \
     -d '{"instruction":"Réponds en français","category":"language","priority":10}'
   
   # Style  
   curl -X POST http://localhost:3000/api/instructions/add \
     -d '{"instruction":"Utilise des émojis","category":"style","priority":8}'
   
   # Comportement
   curl -X POST http://localhost:3000/api/instructions/add \
     -d '{"instruction":"Sois concis et direct","category":"behavior","priority":7}'
   ```

2. **Utiliser dans le chat**:
   ```
   User: Liste mes workflows
   
   Agent: 📋 Instructions actives:
          1. [LANGUAGE] Réponds en français
          2. [STYLE] Utilise des émojis  
          3. [BEHAVIOR] Sois concis et direct
          
          🤖 Voici vos workflows:
          
          • 🔴 Demo (ID: 3wnBU3rbhJATJfYW)
          • 🟢 My workflow 5 (ID: W60HYcYpzznj56wb)
          • 🔴 tiktok_short (ID: yKMSHULhJtpfTzDY)
          
          14 workflows au total.
   ```

3. **Supprimer avec confirmation**:
   ```
   User: suprime le premier
   
   Agent: ⚠️ Confirmation:
          Supprimer "Demo" (3wnBU3rbhJATJfYW)?
          
          Répondez oui/non.
   
   User: oui
   
   Agent: ✅ Supprimé et vérifié!
   ```

4. **Vérifier l'historique**:
   ```
   User: qu'est-ce qu'on a fait?
   
   Agent: 📚 Historique:
          
          1. Vous: Liste mes workflows
             Moi: [liste affichée...]
          
          2. Vous: suprime le premier  
             Moi: Demandé confirmation
          
          3. Vous: oui
             Moi: ✅ Workflow supprimé
   ```

---

**TOUT EST MAINTENANT FONCTIONNEL** ✅

Documentation complète: `NOUVELLES_FONCTIONNALITES.md`
