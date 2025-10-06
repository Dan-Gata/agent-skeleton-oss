# 🚀 Configuration des APIs IA - Agent Skeleton OSS

## Configuration Rapide

### 1. Copier le fichier de configuration
```bash
cp .env.local.example .env
```

### 2. Ajouter vos clés API dans `.env`

#### OpenAI (GPT-4o-mini)
```env
OPENAI_API_KEY=sk-proj-votre-cle-ici
```
- **Où l'obtenir** : https://platform.openai.com/api-keys
- **Modèles supportés** : gpt-4o-mini, gpt-4

#### xAI (Grok) via OpenRouter
```env
OPENROUTER_API_KEY=sk-or-v1-votre-cle-ici
```
- **Où l'obtenir** : https://openrouter.ai/keys
- **Modèles supportés** : grok-beta, grok-2
- **Note** : OpenRouter donne accès à xAI et beaucoup d'autres modèles

#### Anthropic (Claude)
```env
ANTHROPIC_API_KEY=sk-ant-votre-cle-ici
```
- **Où l'obtenir** : https://console.anthropic.com/
- **Modèles supportés** : claude-3.5-sonnet, claude-3-haiku

#### Google AI (Gemini)
```env
GOOGLE_API_KEY=AIvotre-cle-ici
```
- **Où l'obtenir** : https://makersuite.google.com/app/apikey
- **Modèles supportés** : gemini-2.0-flash, gemini-1.5-pro

### 3. Mode Démo vs Mode Complet

#### Sans clés API (Mode Démo)
- ✅ Interface fonctionne
- ✅ Réponses simulées intelligentes
- ⚠️ Pas de vraie IA

#### Avec clés API (Mode Complet)
- ✅ Vraies réponses IA
- ✅ Conversations avancées
- ✅ Capacités complètes des modèles

### 4. Test Local
```bash
npm start
# Ouvrir http://localhost:3000/app
# Tester le chat avec différents modèles
```

### 5. Déploiement Coolify

1. **Variables d'environnement dans Coolify :**
   - Ajouter toutes les clés API dans les variables d'environnement
   - Marquer comme "secrets" pour la sécurité

2. **Déployer avec commit :**
   ```
   53cf498
   ```

## 🎯 Modèles Recommandés

| Modèle | Usage | Vitesse | Coût |
|--------|-------|---------|------|
| **GPT-4o-mini** | Usage général, rapide | ⚡⚡⚡ | 💰 |
| **Grok Beta** | Code, technique | ⚡⚡ | 💰💰 |
| **Claude 3.5** | Analyse, créativité | ⚡⚡ | 💰💰 |
| **Gemini 2.0** | Multimodal, rapide | ⚡⚡⚡ | 💰 |

## 🔧 Dépannage

### Erreurs courantes
- **"Clé API manquante"** : Vérifier le fichier `.env`
- **"Erreur de connexion"** : Vérifier la validité des clés
- **"Rate limit"** : Attendre ou changer de modèle

### Logs de debug
Les logs montrent en temps réel :
- 📤 Messages envoyés
- 🤖 Réponses reçues
- ⚠️ Erreurs éventuelles

## 💡 Conseils

1. **Commencer avec OpenRouter** : Une seule clé pour plusieurs modèles
2. **Tester en local** avant déploiement
3. **Surveiller les coûts** avec des limites API
4. **Backup des clés** dans un gestionnaire sécurisé