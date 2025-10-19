# 🤖 Guide de Conversation avec votre Assistant IA Orchestrateur

## Vision
Votre assistant fonctionne maintenant comme **GitHub Copilot** - vous lui parlez naturellement et il comprend vos intentions, délègue aux bons experts (sous-agents), et vous répond de manière intelligente.

---

## 🎯 Architecture Multi-Agents

```
         VOUS (Dirigeant)
              ↓
    🤖 ORCHESTRATEUR CENTRAL
         /  |  |  |  |  \
        /   |  |  |  |   \
      📁  🔄 🚀 📊 📧  🔒
     File N8N Cool Base Email Sec
    Agent    ify row       urity
```

**Vous dirigez** → **Orchestrateur analyse** → **Délègue au bon sous-agent** → **Vous répond**

---

## 📁 Commandes Fichiers (FileAgent)

### Lister vos fichiers
```
"Récupère mes fichiers"
"Montre moi ce que j'ai uploadé"
"Liste mes documents"
"Quels fichiers j'ai?"
```

**Résultat**: Liste avec nom, taille, date, type

### Analyser vos fichiers
```
"Analyse mes fichiers"
"Analyse le contenu de mes documents"
"Fais une analyse complète"
"Qu'est-ce qu'il y a dans mes fichiers?"
```

**Résultat**: 
- Stats (caractères, mots, lignes)
- Types détectés
- Mots-clés extraits
- Insights (volume, formats, etc.)

### Rechercher dans les fichiers
```
"Cherche [terme] dans mes fichiers"
"Trouve 'mot-clé' dans mes documents"
"Recherche 'expression' dans les fichiers"
```

**Résultat**: Fichiers contenant le terme + extraits

---

## 🔄 Commandes N8N (N8NAgent)

### Lister workflows
```
"Liste mes workflows"
"Vérifie mon compte N8N"
"Montre moi mes workflows N8N"
"Qu'est-ce qui tourne sur N8N?"
```

**Résultat**: 
- Nombre de workflows
- ID, nom, statut (actif/inactif)
- Date création/modification

### Supprimer un workflow
```
"Supprime le workflow yKMSHULhJtpfTzDY"
"Supprime le workflow tiktok_short_video_agent"
"Retire le workflow [ID]"
"Efface ce workflow inutile"
```

**Résultat**: Confirmation de suppression avec nom du workflow

### Exécuter un workflow
```
"Exécute le workflow [ID]"
"Lance le workflow principal"
"Démarre l'automation [ID]"
```

**Résultat**: ID d'exécution, statut

---

## 🚀 Commandes Coolify (CoolifyAgent)

### Déployer un service
```
"Déploie le service [ID]"
"Déploie l'application principale"
"Rebuild le service"
```

**Résultat**: Confirmation de déploiement déclenché

### Vérifier status
```
"Status du service [ID]"
"État de l'application"
"Santé du service"
```

**Résultat**: État actuel du service

---

## 📊 Commandes Baserow (BaserowAgent)

### Lister données
```
"Liste les enregistrements table [ID]"
"Montre moi la table [ID]"
"Récupère les données table [ID]"
```

**Résultat**: Enregistrements de la table

### Créer donnée
```
"Ajoute un enregistrement dans table [ID]"
"Créer une nouvelle entrée"
```

---

## 📧 Commandes Email (EmailAgent)

### Envoyer email
```
"Envoie un email à contact@example.com"
"Envoie un message à [adresse]"
```

**Résultat**: Confirmation d'envoi (simulation si SMTP non configuré)

---

## 🔒 Commandes Sécurité (SecurityAgent)

### Audit de sécurité
```
"Audit de sécurité"
"Vérifie mes permissions"
"Analyse la sécurité"
"Rapport de sécurité"
```

**Résultat**: 
- Vérifications effectuées
- Status de session
- Permissions
- Recommandations

---

## ❓ Commandes Système

### Aide
```
"aide"
"que peux-tu faire?"
"quelles sont tes capacités?"
"help"
```

**Résultat**: Guide complet des fonctionnalités

### Conversation générale
```
"Bonjour"
"Salut"
"Comment ça va?"
```

**Résultat**: Réponse contextuelle avec suggestions

---

## 💡 Exemples de Conversations Naturelles

### Exemple 1 - Gestion de fichiers
**Vous**: `"Salut, montre moi ce que j'ai uploadé"`

**Assistant**:
```
🤖 GPT-3.5 Turbo via Orchestrateur

📂 Fichiers uploadés (1)

📄 document_152KB.txt - 148.63 KB
   Uploadé: 18/10/2024 18:45:30

🤖 Agents utilisés: FileAgent
```

### Exemple 2 - Analyse approfondie
**Vous**: `"Analyse le contenu de mes documents en détail"`

**Assistant**:
```
🤖 GPT-3.5 Turbo via Orchestrateur

🔍 Analyse de fichiers

📊 Résumé:
• Fichiers analysés: 1
• Taille totale: 148.63 KB
• Types détectés: text

💡 Insights:
📊 Volume de données: 0.15 MB
📏 Taille moyenne par fichier: 148.63 KB

🤖 Agents utilisés: FileAgent
```

### Exemple 3 - Suppression workflow N8N
**Vous**: `"Supprime moi ce workflow tiktok qui ne sert à rien"`

**Assistant** (si N8N configuré):
```
🤖 GPT-3.5 Turbo via Orchestrateur

✅ Workflow supprimé avec succès

🗑️ Le workflow a été retiré de votre compte N8N.
ID: yKMSHULhJtpfTzDY

🤖 Agents utilisés: N8NAgent
```

**OU** (si N8N pas configuré):
```
⚠️ GPT-3.5 Turbo - Problème rencontré

N8N_API_KEY non configurée. Ajoutez-la dans Coolify.

💡 Suggestion: Configurez N8N_API_KEY pour utiliser les workflows

🤖 Agents utilisés: N8NAgent
```

---

## 🔧 Configuration pour Fonctionnalités Avancées

### N8N (Workflows)
1. Aller dans N8N → Settings → API
2. Créer une clé API
3. Dans Coolify → Votre app → Environment:
   ```
   N8N_API_URL=https://n8n.kaussan-air.org
   N8N_API_KEY=votre_clé_api
   ```
4. Redéployer

### Coolify (Déploiements)
1. Coolify → Settings → API Tokens
2. Créer un token
3. Dans Coolify → Votre app → Environment:
   ```
   COOLIFY_API_URL=https://kaussan-air.org
   COOLIFY_API_KEY=votre_token
   ```
4. Redéployer

### Baserow (Base de données)
```
BASEROW_URL=http://baserow:80
BASEROW_API_TOKEN=votre_token
```

### Email (SMTP)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre_email@gmail.com
SMTP_PASS=votre_mot_de_passe_app
FROM_EMAIL=noreply@kaussan-air.org
```

---

## ✅ Fonctionnalités Disponibles IMMÉDIATEMENT

**Sans aucune configuration**:
- ✅ Lister fichiers uploadés
- ✅ Analyser fichiers (stats, mots-clés, insights)
- ✅ Rechercher dans fichiers
- ✅ Aide système
- ✅ Audit de sécurité basique
- ✅ Conversation naturelle

**Avec configuration N8N**:
- ✅ Lister workflows
- ✅ **Supprimer workflows** ← VOTRE DEMANDE
- ✅ Exécuter workflows
- ✅ Historique d'exécution

---

## 🎯 Test Immédiat

### Maintenant (sans config)
1. `"aide"` → Voir toutes les capacités
2. `"Récupère mes fichiers"` → Voir votre fichier 152KB
3. `"Analyse mes fichiers"` → Stats complètes

### Après config N8N
4. `"Liste mes workflows"` → Voir tous vos workflows
5. `"Supprime le workflow yKMSHULhJtpfTzDY"` → Supprimer le workflow tiktok

---

## 🚀 Avantages du Nouveau Système

### AVANT
- ❌ Réponses simulées sans action
- ❌ Pas de vraie suppression
- ❌ Réponses répétitives
- ❌ Un seul agent monolithique

### MAINTENANT
- ✅ **6 sous-agents spécialisés**
- ✅ **Vraies actions** (suppression, analyse, etc.)
- ✅ **Délégation intelligente**
- ✅ **Interface conversationnelle naturelle**
- ✅ **Vous dirigez l'orchestrateur**
- ✅ **Réponses contextuelles variées**

---

## 📞 Support

Si une commande ne fonctionne pas:
1. **Vérifier Console (F12)**: Logs détaillés
2. **Demander "aide"**: Voir capacités actuelles
3. **Vérifier configuration**: Variables d'environnement
4. **Reformuler**: L'agent comprend le langage naturel

---

**🎉 Votre assistant est maintenant un véritable orchestrateur multi-agents !**

**Commit**: d535157  
**Status**: Déployé sur Coolify  
**Prêt à l'emploi**: Testez maintenant !
