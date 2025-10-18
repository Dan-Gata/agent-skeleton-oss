# 🤖 Guide d'utilisation de l'Agent Autonome

## 📋 Vue d'ensemble

Votre application dispose maintenant d'un **vrai agent autonome** qui **exécute réellement** les tâches que vous lui confiez, au lieu de simplement simuler des réponses.

## 🎯 Capacités de l'agent

L'agent peut effectuer les actions suivantes :

### 1. **Vérifier votre compte N8N**
```
"Donne un coup d'œil sur mon compte N8N"
"Vérifie mon compte N8N"
"Connecte-toi à N8N"
```

**Ce que l'agent fait** :
- ✅ Se connecte à votre instance N8N
- ✅ Liste tous vos workflows
- ✅ Affiche leur statut (actif/inactif)
- ✅ Retourne des informations détaillées

### 2. **Exécuter un workflow N8N**
```
"Exécute le workflow 123"
"Lance le workflow email-automation"
"Démarre le workflow de backup"
```

**Ce que l'agent fait** :
- ✅ Identifie le workflow demandé
- ✅ L'exécute réellement via l'API N8N
- ✅ Retourne le résultat de l'exécution

### 3. **Analyser vos fichiers**
```
"Analyse mes fichiers"
"Regarde les documents uploadés"
"Que contiennent mes fichiers ?"
```

**Ce que l'agent fait** :
- ✅ Analyse chaque fichier uploadé
- ✅ Détecte le type (JSON, CSV, texte, etc.)
- ✅ Compte les mots, lignes, caractères
- ✅ Valide la structure (pour JSON)
- ✅ Génère un résumé complet

### 4. **Déployer un service**
```
"Déploie le service agent-skeleton"
"Lance un déploiement Coolify"
```

**Ce que l'agent fait** :
- ✅ Se connecte à Coolify
- ✅ Déclenche le déploiement du service
- ✅ Retourne le statut du déploiement

### 5. **Générer du contenu** (avec OpenRouter)
```
"Génère un email de bienvenue"
"Écris un article sur l'IA"
"Crée un résumé de mes fichiers"
```

**Ce que l'agent fait** :
- ✅ Utilise GPT-4/Claude/Gemini via OpenRouter
- ✅ Génère du contenu réel et pertinent
- ✅ Retourne le texte généré

### 6. **Recherche web**
```
"Cherche des infos sur Node.js"
"Trouve des tutoriels Docker"
```

**Ce que l'agent fait** :
- 🔄 Effectue une recherche (simulation actuellement)
- 🔄 Retourne des résultats pertinents
- 💡 **À venir** : Intégration Google Custom Search API

## ⚙️ Configuration requise

Pour utiliser toutes les fonctionnalités, configurez ces variables d'environnement :

```env
# N8N - Automation platform
N8N_API_URL=https://n8n.votredomaine.com
N8N_API_KEY=votre_cle_api_n8n

# OpenRouter - IA générative
OPENROUTER_API_KEY=votre_cle_openrouter

# Coolify - Déploiements
COOLIFY_API_URL=https://coolify.votredomaine.com
COOLIFY_API_KEY=votre_cle_coolify

# Baserow - Base de données
BASEROW_URL=http://baserow:80
BASEROW_API_TOKEN=votre_token_baserow
```

## 🚀 Exemples d'utilisation

### Exemple 1 : Vérifier N8N
**Vous** : "Donne un coup d'œil sur mon compte N8N"

**Agent répond** :
```
🤖 GPT-3.5 Turbo - Tâche exécutée avec succès

Type d'action : check_n8n

Résultat : Compte N8N connecté avec succès

Détails :
  • url : https://n8n.kaussan-air.org
  • workflowsCount : 5
  • workflows :
    - ID: 1, Nom: "Email Automation", Actif: true
    - ID: 2, Nom: "Data Sync", Actif: false
    - ID: 3, Nom: "Backup System", Actif: true
    ...

✅ Exécuté par Agent Autonome à 21:30:45
```

### Exemple 2 : Analyser fichiers
**Vous** : "Analyse mes fichiers"

**Agent répond** :
```
🤖 GPT-3.5 Turbo - Tâche exécutée avec succès

Type d'action : analyze_files

Résultat : 3 fichier(s) analysé(s)

Détails :
  • Fichier 1 : config.json
    - Type : json
    - Taille : 1.2 KB
    - Valide : ✅
    - Clés : 8

  • Fichier 2 : data.csv
    - Type : csv
    - Taille : 45 KB
    - Lignes : 1200
    - Colonnes : 5

  • Fichier 3 : notes.txt
    - Type : text
    - Taille : 3 KB
    - Mots : 450
    - Lignes : 42

✅ Exécuté par Agent Autonome à 21:32:15
```

## 🔧 Résolution de problèmes

### L'agent ne peut pas se connecter à N8N
**Erreur** : "Configuration N8N incomplète"

**Solution** :
1. Vérifiez que `N8N_API_URL` est définie
2. Vérifiez que `N8N_API_KEY` est valide
3. Testez la connexion manuellement :
   ```bash
   curl -H "X-N8N-API-KEY: votre_cle" https://n8n.votredomaine.com/api/v1/workflows
   ```

### L'agent ne peut pas générer de contenu
**Erreur** : "Clé API OpenRouter manquante"

**Solution** :
1. Obtenez une clé API sur https://openrouter.ai
2. Ajoutez-la dans vos variables d'environnement
3. Redémarrez le serveur

### L'agent retourne des erreurs génériques
**Solution** :
1. Vérifiez les logs du serveur
2. Consultez la console du navigateur (F12)
3. Vérifiez que toutes les dépendances sont installées

## 📊 Différence : Avant vs Maintenant

### ❌ Avant (Simulation)
```
Vous : "Vérifie mon compte N8N"
Bot : "J'ai bien reçu votre message et l'ai analysé..."
      (Réponse générique, aucune action réelle)
```

### ✅ Maintenant (Agent Autonome)
```
Vous : "Vérifie mon compte N8N"
Agent : 
  1. Se connecte réellement à N8N
  2. Récupère vos workflows
  3. Analyse leur statut
  4. Retourne des données réelles et actionables
```

## 🎯 Prochaines étapes

Fonctionnalités à venir :

- [ ] Intégration vraie API de recherche web
- [ ] Publication automatique sur réseaux sociaux (Twitter, LinkedIn)
- [ ] Génération de rapports PDF
- [ ] Envoi d'emails réels (via SendGrid/Mailgun)
- [ ] Analyse de logs en temps réel
- [ ] Automatisation complète de workflows

## 📞 Support

Si l'agent ne fonctionne pas comme attendu :

1. **Vérifiez les logs** : Ouvrez la console du navigateur (F12)
2. **Testez les APIs** : Vérifiez que N8N, Coolify sont accessibles
3. **Consultez la documentation** : Chaque service a sa propre doc
4. **Demandez à l'agent** : "Quelles sont tes capacités ?" pour voir ce qu'il peut faire

---

**🚀 L'agent est maintenant déployé et opérationnel !**

Testez-le avec : "Donne un coup d'œil sur mon compte N8N"
