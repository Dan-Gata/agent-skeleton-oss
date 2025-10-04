const express = require('express');const express = require('express');

const axios   = require('axios');const axios   = require('axios');

const path    = require('path');const path    = require('path');

const app     = express();const app     = express();

const port    = process.env.PORT || 3000;const port    = process.env.PORT || 3000;



// Configuration du moteur de templates// Configuration du moteur de templates

app.set('view engine', 'ejs');app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, '../views'));app.set('views', path.join(__dirname, '../views'));



// Middleware pour servir les fichiers statiques// Middleware pour servir les fichiers statiques

app.use(express.static(path.join(__dirname, '../public')));app.use(express.static(path.join(__dirname, '../public')));

app.use(express.json());app.use(express.json());



// Route principale - Interface moderne// Route principale - Interface moderne

app.get('/', (req, res) => {app.get('/', (req, res) => {

    res.render('interface', {    res.render('interface', {

        title: 'Agent Skeleton OSS - Interface Intelligente',        title: 'Agent Skeleton OSS - Interface Intelligente',

        version: '1.0.0'        version: '1.0.0'

    });    });

});});



// Route nouvelle interface APP moderne// Route nouvelle interface APP moderne

app.get('/app', (req, res) => {app.get('/app', (req, res) => {

    res.render('app', {    res.render('app', {

        title: 'Agent Skeleton OSS - Application',        title: 'Agent Skeleton OSS - Application',

        version: '1.0.0'        version: '1.0.0'

    });    });

});});



// API Chat public pour l'interface// API Chat public pour l'interface

app.post('/api/chat/public', async (req, res) => {app.post('/api/chat/public', async (req, res) => {

    try {    try {

        const { message, model = 'claude-3.5-sonnet' } = req.body;        const { message, model = 'claude-3.5-sonnet' } = req.body;

                

        if (!message) {        if (!message) {

            return res.status(400).json({            return res.status(400).json({

                success: false,                success: false,

                error: 'Message is required'                error: 'Message is required'

            });            });

        }        }

                

        // Simulation de réponse IA intelligente        // Simulation de réponse IA intelligente

        const responses = {        const responses = {

            "explique-moi tes capacités": `🤖 **Mes Capacités Principales:**            "explique-moi tes capacités": `🤖 **Mes Capacités Principales:**



**💬 Intelligence Artificielle:****💬 Intelligence Artificielle:**

- Chat intelligent avec 8+ modèles IA (Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro...)- Chat intelligent avec 8+ modèles IA (Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro...)

- Raisonnement complexe et créativité avancée- Raisonnement complexe et créativité avancée

- Apprentissage adaptatif selon vos préférences- Apprentissage adaptatif selon vos préférences



**🔧 Automatisation:****🔧 Automatisation:**

- Workflows n8n pour automatiser vos processus- Workflows n8n pour automatiser vos processus

- Intégration Coolify pour déploiements automatiques  - Intégration Coolify pour déploiements automatiques  

- Base de données Baserow pour stockage structuré- Base de données Baserow pour stockage structuré



**🎨 Interface Moderne:****🎨 Interface Moderne:**

- Design app-style responsive- Design app-style responsive

- Mode sombre/clair adaptatif- Mode sombre/clair adaptatif

- Analytics en temps réel- Analytics en temps réel



**🚀 Cas d'usage:****🚀 Cas d'usage:**

- Développement et architecture logicielle- Développement et architecture logicielle

- Création de contenu et marketing- Création de contenu et marketing

- Analyse de données et reporting- Analyse de données et reporting

- Support client automatisé- Support client automatisé



Que souhaitez-vous explorer en premier ?`,Que souhaitez-vous explorer en premier ?`,



            "aide-moi à créer un projet": `🛠️ **Création de Projet avec Agent Skeleton OSS:**            "aide-moi à créer un projet": `🛠️ **Création de Projet avec Agent Skeleton OSS:**



**📋 Types de projets supportés:****📋 Types de projets supportés:**

- 🌐 Applications web (React, Vue, Next.js)- 🌐 Applications web (React, Vue, Next.js)

- 📱 Apps mobiles (React Native, Flutter)- 📱 Apps mobiles (React Native, Flutter)

- 🤖 Chatbots et assistants IA- 🤖 Chatbots et assistants IA

- ⚡ APIs et microservices- ⚡ APIs et microservices

- 🔗 Workflows d'automatisation- 🔗 Workflows d'automatisation



**🚀 Processus de création:****🚀 Processus de création:**

1. **Planification** - Architecture et stack technique1. **Planification** - Architecture et stack technique

2. **Setup** - Configuration environnement et tools2. **Setup** - Configuration environnement et tools

3. **Développement** - Code avec best practices3. **Développement** - Code avec best practices

4. **Automatisation** - Workflows n8n intégrés4. **Automatisation** - Workflows n8n intégrés

5. **Déploiement** - Via Coolify en 1 clic5. **Déploiement** - Via Coolify en 1 clic



**💡 Exemple concret:****💡 Exemple concret:**

"Je veux créer un chatbot pour mon e-commerce""Je veux créer un chatbot pour mon e-commerce"

→ Stack suggérée: Node.js + Express + OpenAI API + Baserow→ Stack suggérée: Node.js + Express + OpenAI API + Baserow

→ Workflow n8n pour gestion commandes→ Workflow n8n pour gestion commandes

→ Déploiement automatique Coolify→ Déploiement automatique Coolify



Quel type de projet vous intéresse ?`,Quel type de projet vous intéresse ?`,



            "comment configurer les intégrations": `⚙️ **Configuration des Intégrations:**            "comment configurer les intégrations": `⚙️ **Configuration des Intégrations:**



**🔗 n8n (Workflows):****🔗 n8n (Workflows):**

\`\`\`\`\`\`

N8N_API_URL=https://votre-n8n.com/api/v1N8N_API_URL=https://votre-n8n.com/api/v1

N8N_API_KEY=votre-cle-apiN8N_API_KEY=votre-cle-api

\`\`\`\`\`\`



**🚀 Coolify (Déploiement):****🚀 Coolify (Déploiement):**

\`\`\`\`\`\`

COOLIFY_API_URL=https://votre-coolify.com/apiCOOLIFY_API_URL=https://votre-coolify.com/api

COOLIFY_API_KEY=votre-cle-coolifyCOOLIFY_API_KEY=votre-cle-coolify

\`\`\`\`\`\`



**📊 Baserow (Base de données):****📊 Baserow (Base de données):**

\`\`\`\`\`\`

BASEROW_URL=https://api.baserow.ioBASEROW_URL=https://api.baserow.io

BASEROW_API_TOKEN=votre-tokenBASEROW_API_TOKEN=votre-token

\`\`\`\`\`\`



**🤖 APIs IA:****🤖 APIs IA:**

\`\`\`\`\`\`

OPENROUTER_API_KEY=sk-or-v1-xxxxx (accès multi-modèles)OPENROUTER_API_KEY=sk-or-v1-xxxxx (accès multi-modèles)

OPENAI_API_KEY=sk-xxxxxOPENAI_API_KEY=sk-xxxxx

ANTHROPIC_API_KEY=sk-ant-xxxxxANTHROPIC_API_KEY=sk-ant-xxxxx

\`\`\`\`\`\`



**✅ Étapes de configuration:****✅ Étapes de configuration:**

1. Créez vos comptes sur chaque service1. Créez vos comptes sur chaque service

2. Générez les clés API2. Générez les clés API

3. Ajoutez-les dans variables environnement Coolify3. Ajoutez-les dans variables environnement Coolify

4. Testez les connexions via l'interface4. Testez les connexions via l'interface



Besoin d'aide pour un service spécifique ?`Besoin d'aide pour un service spécifique ?`

        };        };

                

        // Recherche de réponse contextuelle        // Recherche de réponse contextuelle

        let response = responses[message.toLowerCase()];        let response = responses[message.toLowerCase()];

                

        if (!response) {        if (!response) {

            response = `Merci pour votre message : "${message}"            response = `Merci pour votre message : "${message}"



🤖 **Agent Skeleton OSS** - Votre assistant IA intelligent !🤖 **Agent Skeleton OSS** - Votre assistant IA intelligent !



**Fonctionnalités disponibles :****Fonctionnalités disponibles :**

- 💬 Chat avec 8+ modèles IA avancés- 💬 Chat avec 8+ modèles IA avancés

- 🔧 Intégrations n8n, Coolify, Baserow- 🔧 Intégrations n8n, Coolify, Baserow

- 📊 Analytics et monitoring en temps réel- 📊 Analytics et monitoring en temps réel

- 🎨 Interface moderne responsive- 🎨 Interface moderne responsive



**Actions rapides :****Actions rapides :**

- Dites "explique-moi tes capacités" pour découvrir mes fonctions- Dites "explique-moi tes capacités" pour découvrir mes fonctions

- "aide-moi à créer un projet" pour commencer un développement- "aide-moi à créer un projet" pour commencer un développement

- "comment configurer les intégrations" pour la setup technique- "comment configurer les intégrations" pour la setup technique



Comment puis-je vous aider concrètement ?`;Comment puis-je vous aider concrètement ?`;

        }        }

                

        res.json({        res.json({

            success: true,            success: true,

            response,            response,

            model,            model,

            timestamp: new Date().toISOString()            timestamp: new Date().toISOString()

        });        });

                

    } catch (error) {    } catch (error) {

        res.status(500).json({        res.status(500).json({

            success: false,            success: false,

            error: 'Erreur du serveur',            error: 'Erreur du serveur',

            message: error.message            message: error.message

        });        });

    }    }

});});



// Health check endpoint pour Coolify// Health check

app.get('/health', (req, res) => {app.get('/health', (req, res) => {

    res.json({    res.json({

        message: "Agent Orchestrator API",        status: 'healthy',

        version: "0.1.0",        timestamp: new Date().toISOString(),

        endpoints: {        version: '1.0.0',

            health: "/health",        features: ['modern-interface', 'ai-chat', 'integrations']

            app: "/app",    });

            status: "operational"});

        },

        documentation: "https://github.com/Dan-Gata/agent-skeleton-oss"// Appelle le webhook n8n en production

    });app.get('/workflow', async (req, res) => {

});  try {

    // Remplace cette URL par celle de ton workflow n8n en mode production

// Webhook n8n (optionnel)    const webhookUrl = 'https://n8n.kaussan-air.org/webhook/monWebhook';

app.get('/workflow', async (req, res) => {    await axios.post(webhookUrl, { message: 'Coucou depuis l’orchestrateur' });

    try {    res.send('Webhook n8n déclenché !');

        const webhookUrl = process.env.N8N_WEBHOOK_URL;  } catch (error) {

        if (!webhookUrl) {    console.error(error);

            return res.json({ message: 'N8N_WEBHOOK_URL not configured' });    res.status(500).send("Erreur lors de l'appel du webhook");

        }  }

        });

        await axios.post(webhookUrl, { 

            message: 'Triggered from Agent Skeleton OSS',app.listen(port, () => {

            timestamp: new Date().toISOString()  console.log(`Orchestrateur à l’écoute sur http://localhost:${port}`);

        });});

        res.json({ success: true, message: 'n8n webhook triggered!' });
    } catch (error) {
        console.error('Webhook error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Webhook call failed',
            message: error.message 
        });
    }
});

// Démarrage du serveur
app.listen(port, '0.0.0.0', () => {
    console.log(`[${new Date().toISOString()}] 🚀 Agent Skeleton OSS démarré !`);
    console.log(`[${new Date().toISOString()}] 🌐 Interface moderne: http://localhost:${port}/app`);
    console.log(`[${new Date().toISOString()}] 💚 Health check: http://localhost:${port}/health`);
    console.log(`[${new Date().toISOString()}] ⚡ Prêt pour Coolify sur port ${port} !`);
});