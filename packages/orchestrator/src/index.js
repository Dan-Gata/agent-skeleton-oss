const express = require('express');
const axios   = require('axios');
const path    = require('path');
const app     = express();
const port    = process.env.PORT || 3000;

// Configurapp.listen(port, '0.0.0.0', () => {
  console.log(`[${new Date().toISOString()}] 🚀 Agent Skeleton OSS démarré !`);
  console.log(`[${new Date().toISOString()}] 🌐 Interface moderne: http://localhost:${port}/app`);
  console.log(`[${new Date().toISOString()}] 💚 Health check: http://localhost:${port}/health`);
  console.log(`[${new Date().toISOString()}] ⚡ Prêt pour Coolify !`);
});on du moteur de templates
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Middleware pour servir les fichiers statiques
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// Route principale - Interface moderne
app.get('/', (req, res) => {
    res.render('interface', {
        title: 'Agent Skeleton OSS - Interface Intelligente',
        version: '1.0.0'
    });
});

// Route nouvelle interface APP moderne
app.get('/app', (req, res) => {
    res.render('app', {
        title: 'Agent Skeleton OSS - Application',
        version: '1.0.0'
    });
});

// API Chat public pour l'interface
app.post('/api/chat/public', async (req, res) => {
    try {
        const { message, model = 'claude-3.5-sonnet' } = req.body;
        
        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }
        
        // Simulation de réponse IA intelligente
        const responses = {
            "explique-moi tes capacités": `🤖 **Mes Capacités Principales:**

**💬 Intelligence Artificielle:**
- Chat intelligent avec 8+ modèles IA (Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro...)
- Raisonnement complexe et créativité avancée
- Apprentissage adaptatif selon vos préférences

**🔧 Automatisation:**
- Workflows n8n pour automatiser vos processus
- Intégration Coolify pour déploiements automatiques  
- Base de données Baserow pour stockage structuré

**🎨 Interface Moderne:**
- Design app-style responsive
- Mode sombre/clair adaptatif
- Analytics en temps réel

**🚀 Cas d'usage:**
- Développement et architecture logicielle
- Création de contenu et marketing
- Analyse de données et reporting
- Support client automatisé

Que souhaitez-vous explorer en premier ?`,

            "aide-moi à créer un projet": `🛠️ **Création de Projet avec Agent Skeleton OSS:**

**📋 Types de projets supportés:**
- 🌐 Applications web (React, Vue, Next.js)
- 📱 Apps mobiles (React Native, Flutter)
- 🤖 Chatbots et assistants IA
- ⚡ APIs et microservices
- 🔗 Workflows d'automatisation

**🚀 Processus de création:**
1. **Planification** - Architecture et stack technique
2. **Setup** - Configuration environnement et tools
3. **Développement** - Code avec best practices
4. **Automatisation** - Workflows n8n intégrés
5. **Déploiement** - Via Coolify en 1 clic

**💡 Exemple concret:**
"Je veux créer un chatbot pour mon e-commerce"
→ Stack suggérée: Node.js + Express + OpenAI API + Baserow
→ Workflow n8n pour gestion commandes
→ Déploiement automatique Coolify

Quel type de projet vous intéresse ?`,

            "comment configurer les intégrations": `⚙️ **Configuration des Intégrations:**

**🔗 n8n (Workflows):**
\`\`\`
N8N_API_URL=https://votre-n8n.com/api/v1
N8N_API_KEY=votre-cle-api
\`\`\`

**🚀 Coolify (Déploiement):**
\`\`\`
COOLIFY_API_URL=https://votre-coolify.com/api
COOLIFY_API_KEY=votre-cle-coolify
\`\`\`

**📊 Baserow (Base de données):**
\`\`\`
BASEROW_URL=https://api.baserow.io
BASEROW_API_TOKEN=votre-token
\`\`\`

**🤖 APIs IA:**
\`\`\`
OPENROUTER_API_KEY=sk-or-v1-xxxxx (accès multi-modèles)
OPENAI_API_KEY=sk-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
\`\`\`

**✅ Étapes de configuration:**
1. Créez vos comptes sur chaque service
2. Générez les clés API
3. Ajoutez-les dans variables environnement Coolify
4. Testez les connexions via l'interface

Besoin d'aide pour un service spécifique ?`
        };
        
        // Recherche de réponse contextuelle
        let response = responses[message.toLowerCase()];
        
        if (!response) {
            response = `Merci pour votre message : "${message}"

🤖 **Agent Skeleton OSS** - Votre assistant IA intelligent !

**Fonctionnalités disponibles :**
- 💬 Chat avec 8+ modèles IA avancés
- 🔧 Intégrations n8n, Coolify, Baserow
- 📊 Analytics et monitoring en temps réel
- 🎨 Interface moderne responsive

**Actions rapides :**
- Dites "explique-moi tes capacités" pour découvrir mes fonctions
- "aide-moi à créer un projet" pour commencer un développement
- "comment configurer les intégrations" pour la setup technique

Comment puis-je vous aider concrètement ?`;
        }
        
        res.json({
            success: true,
            response,
            model,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erreur du serveur',
            message: error.message
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        features: ['modern-interface', 'ai-chat', 'integrations']
    });
});

// Appelle le webhook n8n en production
app.get('/workflow', async (req, res) => {
  try {
    // Remplace cette URL par celle de ton workflow n8n en mode production
    const webhookUrl = 'https://n8n.kaussan-air.org/webhook/monWebhook';
    await axios.post(webhookUrl, { message: 'Coucou depuis l’orchestrateur' });
    res.send('Webhook n8n déclenché !');
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de l'appel du webhook");
  }
});

app.listen(port, () => {
  console.log(`Orchestrateur à l’écoute sur http://localhost:${port}`);
});
