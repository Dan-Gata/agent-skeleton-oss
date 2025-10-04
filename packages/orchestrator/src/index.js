const express = require('express');const express = require('express');const express = require('express');const express = require('express');

const axios = require('axios');

const path = require('path');const axios   = require('axios');

const helmet = require('helmet');

const cors = require('cors');const path    = require('path');const axios   = require('axios');const axios   = require('axios');

const rateLimit = require('express-rate-limit');

const { body, validationResult } = require('express-validator');const helmet  = require('helmet');



const app = express();const cors    = require('cors');const path    = require('path');const path    = require('path');

const port = process.env.PORT || 3000;

const rateLimit = require('express-rate-limit');

// 🔒 SÉCURITÉ : Configuration des headers de sécurité

app.use(helmet({const { body, validationResult } = require('express-validator');const app     = express();const app     = express();

    contentSecurityPolicy: {

        directives: {

            defaultSrc: ["'self'"],

            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],const app = express();const port    = process.env.PORT || 3000;const port    = process.env.PORT || 3000;

            scriptSrc: ["'self'", "'unsafe-inline'"],

            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],const port = process.env.PORT || 3000;

            imgSrc: ["'self'", "data:", "https:"],

            connectSrc: ["'self'"]

        }

    },// 🔒 SÉCURITÉ : Configuration des headers de sécurité

    hsts: {

        maxAge: 31536000,app.use(helmet({// Configuration du moteur de templates// Configuration du moteur de templates

        includeSubDomains: true,

        preload: true    contentSecurityPolicy: {

    }

}));        directives: {app.set('view engine', 'ejs');app.set('view engine', 'ejs');



// 🔒 SÉCURITÉ : Configuration CORS restrictive            defaultSrc: ["'self'"],

const allowedOrigins = process.env.ALLOWED_ORIGINS 

    ? process.env.ALLOWED_ORIGINS.split(',')             styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],app.set('views', path.join(__dirname, '../views'));app.set('views', path.join(__dirname, '../views'));

    : ['http://localhost:3000'];

            scriptSrc: ["'self'", "'unsafe-inline'"],

app.use(cors({

    origin: allowedOrigins,            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],

    credentials: true,

    optionsSuccessStatus: 200            imgSrc: ["'self'", "data:", "https:"],

}));

            connectSrc: ["'self'"]// Middleware pour servir les fichiers statiques// Middleware pour servir les fichiers statiques

// 🔒 SÉCURITÉ : Limitation du taux de requêtes

const limiter = rateLimit({        }

    windowMs: 15 * 60 * 1000,

    max: 100,    },app.use(express.static(path.join(__dirname, '../public')));app.use(express.static(path.join(__dirname, '../public')));

    message: {

        error: 'Trop de requêtes depuis cette IP, réessayez dans 15 minutes.',    hsts: {

        code: 'RATE_LIMIT_EXCEEDED'

    },        maxAge: 31536000,app.use(express.json());app.use(express.json());

    standardHeaders: true,

    legacyHeaders: false        includeSubDomains: true,

});

        preload: true

const apiLimiter = rateLimit({

    windowMs: 15 * 60 * 1000,    }

    max: 50,

    message: {}));// Route principale - Interface moderne// Route principale - Interface moderne

        error: 'Trop de requêtes API, réessayez dans 15 minutes.',

        code: 'API_RATE_LIMIT_EXCEEDED'

    }

});// 🔒 SÉCURITÉ : Configuration CORS restrictiveapp.get('/', (req, res) => {app.get('/', (req, res) => {



app.use(limiter);app.use(cors({

app.use('/api/', apiLimiter);

    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],    res.render('interface', {    res.render('interface', {

// Configuration du moteur de templates

app.set('view engine', 'ejs');    credentials: true,

app.set('views', path.join(__dirname, '../views'));

app.set('trust proxy', 1);    optionsSuccessStatus: 200        title: 'Agent Skeleton OSS - Interface Intelligente',        title: 'Agent Skeleton OSS - Interface Intelligente',



// Middleware pour servir les fichiers statiques}));

app.use(express.static(path.join(__dirname, '../public'), {

    maxAge: '1d',        version: '1.0.0'        version: '1.0.0'

    etag: true,

    lastModified: true// 🔒 SÉCURITÉ : Limitation du taux de requêtes

}));

const limiter = rateLimit({    });    });

// Limitation de la taille des payloads

app.use(express.json({ limit: '10mb', strict: true }));    windowMs: 15 * 60 * 1000, // 15 minutes

app.use(express.urlencoded({ extended: false, limit: '10mb' }));

    max: 100, // Limite chaque IP à 100 requêtes par windowMs});});

// Masquer les informations du serveur

app.disable('x-powered-by');    message: {



// Route principale - Interface moderne        error: 'Trop de requêtes depuis cette IP, réessayez dans 15 minutes.',

app.get('/', (req, res) => {

    res.render('interface', {        code: 'RATE_LIMIT_EXCEEDED'

        title: 'Agent Skeleton OSS - Interface Intelligente',

        version: '1.0.0'    },// Route nouvelle interface APP moderne// Route nouvelle interface APP moderne

    });

});    standardHeaders: true,



// Route nouvelle interface APP moderne    legacyHeaders: falseapp.get('/app', (req, res) => {app.get('/app', (req, res) => {

app.get('/app', (req, res) => {

    res.render('app', {});

        title: 'Agent Skeleton OSS - Application',

        version: '1.0.0'    res.render('app', {    res.render('app', {

    });

});const apiLimiter = rateLimit({



// Validation des entrées pour l'API Chat    windowMs: 15 * 60 * 1000, // 15 minutes        title: 'Agent Skeleton OSS - Application',        title: 'Agent Skeleton OSS - Application',

const chatValidation = [

    body('message')    max: 50, // Plus restrictif pour l'API

        .isLength({ min: 1, max: 5000 })

        .withMessage('Le message doit contenir entre 1 et 5000 caractères')    message: {        version: '1.0.0'        version: '1.0.0'

        .trim()

        .escape(),        error: 'Trop de requêtes API, réessayez dans 15 minutes.',

    body('model')

        .optional()        code: 'API_RATE_LIMIT_EXCEEDED'    });    });

        .isAlphanumeric('en-US', { ignore: '-.' })

        .withMessage('Le modèle doit être alphanumérique')    }

        .isLength({ max: 50 })

        .withMessage('Le nom du modèle est trop long')});});});

];



// API Chat public pour l'interface avec sécurité

app.post('/api/chat/public', chatValidation, async (req, res) => {app.use(limiter);

    try {

        const errors = validationResult(req);app.use('/api/', apiLimiter);

        if (!errors.isEmpty()) {

            return res.status(400).json({// API Chat public pour l'interface// API Chat public pour l'interface

                success: false,

                error: 'Données invalides',// 🔒 SÉCURITÉ : Configuration du moteur de templates avec sécurité

                details: errors.array()

            });app.set('view engine', 'ejs');app.post('/api/chat/public', async (req, res) => {app.post('/api/chat/public', async (req, res) => {

        }

app.set('views', path.join(__dirname, '../views'));

        const { message, model = 'claude-3.5-sonnet' } = req.body;

        app.set('trust proxy', 1); // Pour les proxies comme Coolify    try {    try {

        if (!message || typeof message !== 'string') {

            return res.status(400).json({

                success: false,

                error: 'Message requis et doit être une chaîne de caractères'// 🔒 SÉCURITÉ : Middleware pour servir les fichiers statiques avec sécurité        const { message, model = 'claude-3.5-sonnet' } = req.body;        const { message, model = 'claude-3.5-sonnet' } = req.body;

            });

        }app.use(express.static(path.join(__dirname, '../public'), {



        const allowedModels = [    maxAge: '1d',                

            'claude-3.5-sonnet', 'gpt-4o', 'gpt-4', 'gemini-1.5-pro',

            'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'    etag: true,

        ];

            lastModified: true,        if (!message) {        if (!message) {

        if (!allowedModels.includes(model)) {

            return res.status(400).json({    setHeaders: (res, path) => {

                success: false,

                error: 'Modèle non autorisé'        // Sécurité pour les fichiers JS/CSS            return res.status(400).json({            return res.status(400).json({

            });

        }        if (path.endsWith('.js')) {

        

        // Réponses IA intelligentes            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');                success: false,                success: false,

        const responses = {

            "explique-moi tes capacités": `🤖 **Mes Capacités Principales:**        }



**💬 Intelligence Artificielle:**        if (path.endsWith('.css')) {                error: 'Message is required'                error: 'Message is required'

- Chat intelligent avec 8+ modèles IA (Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro...)

- Raisonnement complexe et créativité avancée            res.setHeader('Content-Type', 'text/css; charset=utf-8');

- Apprentissage adaptatif selon vos préférences

        }            });            });

**🔧 Automatisation:**

- Workflows n8n pour automatiser vos processus    }

- Intégration Coolify pour déploiements automatiques  

- Base de données Baserow pour stockage structuré}));        }        }



**🎨 Interface Moderne:**

- Design app-style responsive

- Mode sombre/clair adaptatif// 🔒 SÉCURITÉ : Limitation de la taille des payloads                

- Analytics en temps réel

app.use(express.json({ 

**🚀 Cas d'usage:**

- Développement et architecture logicielle    limit: '10mb',        // Simulation de réponse IA intelligente        // Simulation de réponse IA intelligente

- Création de contenu et marketing

- Analyse de données et reporting    strict: true

- Support client automatisé

}));        const responses = {        const responses = {

Que souhaitez-vous explorer en premier ?`,

app.use(express.urlencoded({ 

            "aide-moi à créer un projet": `🛠️ **Création de Projet avec Agent Skeleton OSS:**

    extended: false,             "explique-moi tes capacités": `🤖 **Mes Capacités Principales:**            "explique-moi tes capacités": `🤖 **Mes Capacités Principales:**

**📋 Types de projets supportés:**

- 🌐 Applications web (React, Vue, Next.js)    limit: '10mb' 

- 📱 Apps mobiles (React Native, Flutter)

- 🤖 Chatbots et assistants IA}));

- ⚡ APIs et microservices

- 🔗 Workflows d'automatisation



**🚀 Processus de création:**// 🔒 SÉCURITÉ : Masquer les informations du serveur**💬 Intelligence Artificielle:****💬 Intelligence Artificielle:**

1. **Planification** - Architecture et stack technique

2. **Setup** - Configuration environnement et toolsapp.disable('x-powered-by');

3. **Développement** - Code avec best practices

4. **Automatisation** - Workflows n8n intégrés- Chat intelligent avec 8+ modèles IA (Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro...)- Chat intelligent avec 8+ modèles IA (Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro...)

5. **Déploiement** - Via Coolify en 1 clic

// Route principale - Interface moderne

**💡 Exemple concret:**

"Je veux créer un chatbot pour mon e-commerce"app.get('/', (req, res) => {- Raisonnement complexe et créativité avancée- Raisonnement complexe et créativité avancée

→ Stack suggérée: Node.js + Express + OpenAI API + Baserow

→ Workflow n8n pour gestion commandes    res.render('interface', {

→ Déploiement automatique Coolify

        title: 'Agent Skeleton OSS - Interface Intelligente',- Apprentissage adaptatif selon vos préférences- Apprentissage adaptatif selon vos préférences

Quel type de projet vous intéresse ?`,

        version: '1.0.0',

            "comment configurer les intégrations": `⚙️ **Configuration des Intégrations:**

        nonce: res.locals.nonce // Pour CSP

**🔗 n8n (Workflows):**

\`\`\`    });

N8N_API_URL=https://votre-n8n.com/api/v1

N8N_API_KEY=votre-cle-api});**🔧 Automatisation:****🔧 Automatisation:**

\`\`\`



**🚀 Coolify (Déploiement):**

\`\`\`// Route nouvelle interface APP moderne- Workflows n8n pour automatiser vos processus- Workflows n8n pour automatiser vos processus

COOLIFY_API_URL=https://votre-coolify.com/api

COOLIFY_API_KEY=votre-cle-coolifyapp.get('/app', (req, res) => {

\`\`\`

    res.render('app', {- Intégration Coolify pour déploiements automatiques  - Intégration Coolify pour déploiements automatiques  

**📊 Baserow (Base de données):**

\`\`\`        title: 'Agent Skeleton OSS - Application',

BASEROW_URL=https://api.baserow.io

BASEROW_API_TOKEN=votre-token        version: '1.0.0',- Base de données Baserow pour stockage structuré- Base de données Baserow pour stockage structuré

\`\`\`

        nonce: res.locals.nonce // Pour CSP

**🤖 APIs IA:**

\`\`\`    });

OPENROUTER_API_KEY=sk-or-v1-xxxxx (accès multi-modèles)

OPENAI_API_KEY=sk-xxxxx});

ANTHROPIC_API_KEY=sk-ant-xxxxx

\`\`\`**🎨 Interface Moderne:****🎨 Interface Moderne:**



**✅ Étapes de configuration:**// 🔒 SÉCURITÉ : Validation des entrées pour l'API Chat

1. Créez vos comptes sur chaque service

2. Générez les clés APIconst chatValidation = [- Design app-style responsive- Design app-style responsive

3. Ajoutez-les dans variables environnement Coolify

4. Testez les connexions via l'interface    body('message')



Besoin d'aide pour un service spécifique ?`        .isLength({ min: 1, max: 5000 })- Mode sombre/clair adaptatif- Mode sombre/clair adaptatif

        };

                .withMessage('Le message doit contenir entre 1 et 5000 caractères')

        let response = responses[message.toLowerCase().trim()];

                .trim()- Analytics en temps réel- Analytics en temps réel

        if (!response) {

            const safeMessage = message.replace(/[<>\"'&]/g, (match) => {        .escape(),

                const escapeMap = {

                    '<': '&lt;',    body('model')

                    '>': '&gt;',

                    '"': '&quot;',        .optional()

                    "'": '&#x27;',

                    '&': '&amp;'        .isAlphanumeric('en-US', { ignore: '-.' })**🚀 Cas d'usage:****🚀 Cas d'usage:**

                };

                return escapeMap[match];        .withMessage('Le modèle doit être alphanumérique')

            });

        .isLength({ max: 50 })- Développement et architecture logicielle- Développement et architecture logicielle

            response = `Merci pour votre message : "${safeMessage}"

        .withMessage('Le nom du modèle est trop long')

🤖 **Agent Skeleton OSS** - Votre assistant IA intelligent !

];- Création de contenu et marketing- Création de contenu et marketing

**Fonctionnalités disponibles :**

- 💬 Chat avec 8+ modèles IA avancés

- 🔧 Intégrations n8n, Coolify, Baserow

- 📊 Analytics et monitoring en temps réel// API Chat public pour l'interface avec sécurité- Analyse de données et reporting- Analyse de données et reporting

- 🎨 Interface moderne responsive

app.post('/api/chat/public', chatValidation, async (req, res) => {

**Actions rapides :**

- Dites "explique-moi tes capacités" pour découvrir mes fonctions    try {- Support client automatisé- Support client automatisé

- "aide-moi à créer un projet" pour commencer un développement

- "comment configurer les intégrations" pour la setup technique        // 🔒 SÉCURITÉ : Vérification des erreurs de validation



Comment puis-je vous aider concrètement ?`;        const errors = validationResult(req);

        }

                if (!errors.isEmpty()) {

        res.json({

            success: true,            return res.status(400).json({Que souhaitez-vous explorer en premier ?`,Que souhaitez-vous explorer en premier ?`,

            response,

            model,                success: false,

            timestamp: new Date().toISOString(),

            messageLength: message.length                error: 'Données invalides',

        });

                        details: errors.array()

    } catch (error) {

        console.error('[SECURITY] API Error:', {            });            "aide-moi à créer un projet": `🛠️ **Création de Projet avec Agent Skeleton OSS:**            "aide-moi à créer un projet": `🛠️ **Création de Projet avec Agent Skeleton OSS:**

            timestamp: new Date().toISOString(),

            ip: req.ip,        }

            userAgent: req.get('User-Agent'),

            error: error.message

        });

                const { message, model = 'claude-3.5-sonnet' } = req.body;

        res.status(500).json({

            success: false,        **📋 Types de projets supportés:****📋 Types de projets supportés:**

            error: 'Erreur du serveur',

            timestamp: new Date().toISOString()        // 🔒 SÉCURITÉ : Validation supplémentaire côté serveur

        });

    }        if (!message || typeof message !== 'string') {- 🌐 Applications web (React, Vue, Next.js)- 🌐 Applications web (React, Vue, Next.js)

});

            return res.status(400).json({

// Health check endpoint pour Coolify

app.get('/health', (req, res) => {                success: false,- 📱 Apps mobiles (React Native, Flutter)- 📱 Apps mobiles (React Native, Flutter)

    res.json({

        message: "Agent Orchestrator API",                error: 'Message requis et doit être une chaîne de caractères'

        version: "1.0.0",

        endpoints: {            });- 🤖 Chatbots et assistants IA- 🤖 Chatbots et assistants IA

            health: "/health",

            app: "/app",        }

            status: "operational"

        },- ⚡ APIs et microservices- ⚡ APIs et microservices

        security: {

            helmet: true,        // 🔒 SÉCURITÉ : Filtrage des modèles autorisés

            cors: true,

            rateLimit: true,        const allowedModels = [- 🔗 Workflows d'automatisation- 🔗 Workflows d'automatisation

            validation: true

        },            'claude-3.5-sonnet', 'gpt-4o', 'gpt-4', 'gemini-1.5-pro',

        timestamp: new Date().toISOString(),

        documentation: "https://github.com/Dan-Gata/agent-skeleton-oss"            'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'

    });

});        ];



// Webhook n8n sécurisé        **🚀 Processus de création:****🚀 Processus de création:**

app.get('/workflow', async (req, res) => {

    try {        if (!allowedModels.includes(model)) {

        const webhookUrl = process.env.N8N_WEBHOOK_URL;

                    return res.status(400).json({1. **Planification** - Architecture et stack technique1. **Planification** - Architecture et stack technique

        if (!webhookUrl) {

            return res.json({                 success: false,

                success: false,

                message: 'N8N_WEBHOOK_URL not configured'                 error: 'Modèle non autorisé'2. **Setup** - Configuration environnement et tools2. **Setup** - Configuration environnement et tools

            });

        }            });



        if (!webhookUrl.startsWith('https://')) {        }3. **Développement** - Code avec best practices3. **Développement** - Code avec best practices

            return res.status(400).json({

                success: false,        

                error: 'Webhook URL must use HTTPS'

            });        // Simulation de réponse IA intelligente (sécurisée)4. **Automatisation** - Workflows n8n intégrés4. **Automatisation** - Workflows n8n intégrés

        }

                const responses = {

        const payload = { 

            message: 'Triggered from Agent Skeleton OSS',            "explique-moi tes capacités": `🤖 **Mes Capacités Principales:**5. **Déploiement** - Via Coolify en 1 clic5. **Déploiement** - Via Coolify en 1 clic

            timestamp: new Date().toISOString(),

            source: 'orchestrator',

            ip: req.ip

        };**💬 Intelligence Artificielle:**



        await axios.post(webhookUrl, payload, {- Chat intelligent avec 8+ modèles IA (Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro...)

            timeout: 5000,

            headers: {- Raisonnement complexe et créativité avancée**💡 Exemple concret:****💡 Exemple concret:**

                'Content-Type': 'application/json',

                'User-Agent': 'Agent-Skeleton-OSS/1.0.0'- Apprentissage adaptatif selon vos préférences

            }

        });"Je veux créer un chatbot pour mon e-commerce""Je veux créer un chatbot pour mon e-commerce"

        

        res.json({ **🔧 Automatisation:**

            success: true, 

            message: 'n8n webhook triggered securely!',- Workflows n8n pour automatiser vos processus→ Stack suggérée: Node.js + Express + OpenAI API + Baserow→ Stack suggérée: Node.js + Express + OpenAI API + Baserow

            timestamp: new Date().toISOString()

        });- Intégration Coolify pour déploiements automatiques  

        

    } catch (error) {- Base de données Baserow pour stockage structuré→ Workflow n8n pour gestion commandes→ Workflow n8n pour gestion commandes

        console.error('[SECURITY] Webhook error:', {

            timestamp: new Date().toISOString(),

            error: error.message,

            ip: req.ip**🎨 Interface Moderne:**→ Déploiement automatique Coolify→ Déploiement automatique Coolify

        });

        - Design app-style responsive

        res.status(500).json({ 

            success: false, - Mode sombre/clair adaptatif

            error: 'Webhook call failed',

            timestamp: new Date().toISOString()- Analytics en temps réel

        });

    }Quel type de projet vous intéresse ?`,Quel type de projet vous intéresse ?`,

});

**🚀 Cas d'usage:**

// Gestion des erreurs 404

app.use('*', (req, res) => {- Développement et architecture logicielle

    res.status(404).json({

        error: 'Route not found',- Création de contenu et marketing

        timestamp: new Date().toISOString(),

        path: req.originalUrl- Analyse de données et reporting            "comment configurer les intégrations": `⚙️ **Configuration des Intégrations:**            "comment configurer les intégrations": `⚙️ **Configuration des Intégrations:**

    });

});- Support client automatisé



// Gestionnaire d'erreurs global

app.use((error, req, res, next) => {

    console.error('[SECURITY] Global error:', {Que souhaitez-vous explorer en premier ?`,

        timestamp: new Date().toISOString(),

        error: error.message,**🔗 n8n (Workflows):****🔗 n8n (Workflows):**

        stack: error.stack,

        ip: req.ip,            "aide-moi à créer un projet": `🛠️ **Création de Projet avec Agent Skeleton OSS:**

        path: req.path

    });\`\`\`\`\`\`

    

    res.status(500).json({**📋 Types de projets supportés:**

        error: 'Internal server error',

        timestamp: new Date().toISOString()- 🌐 Applications web (React, Vue, Next.js)N8N_API_URL=https://votre-n8n.com/api/v1N8N_API_URL=https://votre-n8n.com/api/v1

    });

});- 📱 Apps mobiles (React Native, Flutter)



// Démarrage du serveur sécurisé- 🤖 Chatbots et assistants IAN8N_API_KEY=votre-cle-apiN8N_API_KEY=votre-cle-api

app.listen(port, '0.0.0.0', () => {

    console.log(`[${new Date().toISOString()}] 🚀 Agent Skeleton OSS démarré (SÉCURISÉ) !`);- ⚡ APIs et microservices

    console.log(`[${new Date().toISOString()}] 🌐 Interface moderne: http://localhost:${port}/app`);

    console.log(`[${new Date().toISOString()}] 💚 Health check: http://localhost:${port}/health`);- 🔗 Workflows d'automatisation\`\`\`\`\`\`

    console.log(`[${new Date().toISOString()}] 🔒 Sécurité: Helmet, CORS, Rate Limiting, Validation`);

    console.log(`[${new Date().toISOString()}] ⚡ Prêt pour Coolify sur port ${port} !`);

});
**🚀 Processus de création:**

1. **Planification** - Architecture et stack technique

2. **Setup** - Configuration environnement et tools**🚀 Coolify (Déploiement):****🚀 Coolify (Déploiement):**

3. **Développement** - Code avec best practices

4. **Automatisation** - Workflows n8n intégrés\`\`\`\`\`\`

5. **Déploiement** - Via Coolify en 1 clic

COOLIFY_API_URL=https://votre-coolify.com/apiCOOLIFY_API_URL=https://votre-coolify.com/api

**💡 Exemple concret:**

"Je veux créer un chatbot pour mon e-commerce"COOLIFY_API_KEY=votre-cle-coolifyCOOLIFY_API_KEY=votre-cle-coolify

→ Stack suggérée: Node.js + Express + OpenAI API + Baserow

→ Workflow n8n pour gestion commandes\`\`\`\`\`\`

→ Déploiement automatique Coolify



Quel type de projet vous intéresse ?`,

**📊 Baserow (Base de données):****📊 Baserow (Base de données):**

            "comment configurer les intégrations": `⚙️ **Configuration des Intégrations:**

\`\`\`\`\`\`

**🔗 n8n (Workflows):**

\`\`\`BASEROW_URL=https://api.baserow.ioBASEROW_URL=https://api.baserow.io

N8N_API_URL=https://votre-n8n.com/api/v1

N8N_API_KEY=votre-cle-apiBASEROW_API_TOKEN=votre-tokenBASEROW_API_TOKEN=votre-token

\`\`\`

\`\`\`\`\`\`

**🚀 Coolify (Déploiement):**

\`\`\`

COOLIFY_API_URL=https://votre-coolify.com/api

COOLIFY_API_KEY=votre-cle-coolify**🤖 APIs IA:****🤖 APIs IA:**

\`\`\`

\`\`\`\`\`\`

**📊 Baserow (Base de données):**

\`\`\`OPENROUTER_API_KEY=sk-or-v1-xxxxx (accès multi-modèles)OPENROUTER_API_KEY=sk-or-v1-xxxxx (accès multi-modèles)

BASEROW_URL=https://api.baserow.io

BASEROW_API_TOKEN=votre-tokenOPENAI_API_KEY=sk-xxxxxOPENAI_API_KEY=sk-xxxxx

\`\`\`

ANTHROPIC_API_KEY=sk-ant-xxxxxANTHROPIC_API_KEY=sk-ant-xxxxx

**🤖 APIs IA:**

\`\`\`\`\`\`\`\`\`

OPENROUTER_API_KEY=sk-or-v1-xxxxx (accès multi-modèles)

OPENAI_API_KEY=sk-xxxxx

ANTHROPIC_API_KEY=sk-ant-xxxxx

\`\`\`**✅ Étapes de configuration:****✅ Étapes de configuration:**



**✅ Étapes de configuration:**1. Créez vos comptes sur chaque service1. Créez vos comptes sur chaque service

1. Créez vos comptes sur chaque service

2. Générez les clés API2. Générez les clés API2. Générez les clés API

3. Ajoutez-les dans variables environnement Coolify

4. Testez les connexions via l'interface3. Ajoutez-les dans variables environnement Coolify3. Ajoutez-les dans variables environnement Coolify



Besoin d'aide pour un service spécifique ?`4. Testez les connexions via l'interface4. Testez les connexions via l'interface

        };

        

        // Recherche de réponse contextuelle avec échappement HTML

        let response = responses[message.toLowerCase().trim()];Besoin d'aide pour un service spécifique ?`Besoin d'aide pour un service spécifique ?`

        

        if (!response) {        };        };

            // 🔒 SÉCURITÉ : Échappement du message utilisateur pour prévenir XSS

            const safeMessage = message.replace(/[<>\"'&]/g, (match) => {                

                const escapeMap = {

                    '<': '&lt;',        // Recherche de réponse contextuelle        // Recherche de réponse contextuelle

                    '>': '&gt;',

                    '"': '&quot;',        let response = responses[message.toLowerCase()];        let response = responses[message.toLowerCase()];

                    "'": '&#x27;',

                    '&': '&amp;'                

                };

                return escapeMap[match];        if (!response) {        if (!response) {

            });

            response = `Merci pour votre message : "${message}"            response = `Merci pour votre message : "${message}"

            response = `Merci pour votre message : "${safeMessage}"



🤖 **Agent Skeleton OSS** - Votre assistant IA intelligent !

🤖 **Agent Skeleton OSS** - Votre assistant IA intelligent !🤖 **Agent Skeleton OSS** - Votre assistant IA intelligent !

**Fonctionnalités disponibles :**

- 💬 Chat avec 8+ modèles IA avancés

- 🔧 Intégrations n8n, Coolify, Baserow

- 📊 Analytics et monitoring en temps réel**Fonctionnalités disponibles :****Fonctionnalités disponibles :**

- 🎨 Interface moderne responsive

- 💬 Chat avec 8+ modèles IA avancés- 💬 Chat avec 8+ modèles IA avancés

**Actions rapides :**

- Dites "explique-moi tes capacités" pour découvrir mes fonctions- 🔧 Intégrations n8n, Coolify, Baserow- 🔧 Intégrations n8n, Coolify, Baserow

- "aide-moi à créer un projet" pour commencer un développement

- "comment configurer les intégrations" pour la setup technique- 📊 Analytics et monitoring en temps réel- 📊 Analytics et monitoring en temps réel



Comment puis-je vous aider concrètement ?`;- 🎨 Interface moderne responsive- 🎨 Interface moderne responsive

        }

        

        res.json({

            success: true,**Actions rapides :****Actions rapides :**

            response,

            model,- Dites "explique-moi tes capacités" pour découvrir mes fonctions- Dites "explique-moi tes capacités" pour découvrir mes fonctions

            timestamp: new Date().toISOString(),

            messageLength: message.length- "aide-moi à créer un projet" pour commencer un développement- "aide-moi à créer un projet" pour commencer un développement

        });

        - "comment configurer les intégrations" pour la setup technique- "comment configurer les intégrations" pour la setup technique

    } catch (error) {

        // 🔒 SÉCURITÉ : Logging sécurisé (sans exposer d'infos sensibles)

        console.error('[SECURITY] API Error:', {

            timestamp: new Date().toISOString(),Comment puis-je vous aider concrètement ?`;Comment puis-je vous aider concrètement ?`;

            ip: req.ip,

            userAgent: req.get('User-Agent'),        }        }

            error: error.message

        });                

        

        res.status(500).json({        res.json({        res.json({

            success: false,

            error: 'Erreur du serveur',            success: true,            success: true,

            timestamp: new Date().toISOString()

        });            response,            response,

    }

});            model,            model,



// 🔒 SÉCURITÉ : Health check sécurisé pour Coolify            timestamp: new Date().toISOString()            timestamp: new Date().toISOString()

app.get('/health', (req, res) => {

    res.json({        });        });

        message: "Agent Orchestrator API",

        version: "1.0.0",                

        endpoints: {

            health: "/health",    } catch (error) {    } catch (error) {

            app: "/app",

            status: "operational"        res.status(500).json({        res.status(500).json({

        },

        security: {            success: false,            success: false,

            helmet: true,

            cors: true,            error: 'Erreur du serveur',            error: 'Erreur du serveur',

            rateLimit: true,

            validation: true            message: error.message            message: error.message

        },

        timestamp: new Date().toISOString(),        });        });

        documentation: "https://github.com/Dan-Gata/agent-skeleton-oss"

    });    }    }

});

});});

// 🔒 SÉCURITÉ : Webhook n8n sécurisé

app.get('/workflow', async (req, res) => {

    try {

        const webhookUrl = process.env.N8N_WEBHOOK_URL;// Health check endpoint pour Coolify// Health check

        

        // 🔒 SÉCURITÉ : Vérification de l'URL webhookapp.get('/health', (req, res) => {app.get('/health', (req, res) => {

        if (!webhookUrl) {

            return res.json({     res.json({    res.json({

                success: false,

                message: 'N8N_WEBHOOK_URL not configured'         message: "Agent Orchestrator API",        status: 'healthy',

            });

        }        version: "0.1.0",        timestamp: new Date().toISOString(),



        // 🔒 SÉCURITÉ : Validation de l'URL        endpoints: {        version: '1.0.0',

        if (!webhookUrl.startsWith('https://')) {

            return res.status(400).json({            health: "/health",        features: ['modern-interface', 'ai-chat', 'integrations']

                success: false,

                error: 'Webhook URL must use HTTPS'            app: "/app",    });

            });

        }            status: "operational"});

        

        const payload = {         },

            message: 'Triggered from Agent Skeleton OSS',

            timestamp: new Date().toISOString(),        documentation: "https://github.com/Dan-Gata/agent-skeleton-oss"// Appelle le webhook n8n en production

            source: 'orchestrator',

            ip: req.ip    });app.get('/workflow', async (req, res) => {

        };

});  try {

        await axios.post(webhookUrl, payload, {

            timeout: 5000,    // Remplace cette URL par celle de ton workflow n8n en mode production

            headers: {

                'Content-Type': 'application/json',// Webhook n8n (optionnel)    const webhookUrl = 'https://n8n.kaussan-air.org/webhook/monWebhook';

                'User-Agent': 'Agent-Skeleton-OSS/1.0.0'

            }app.get('/workflow', async (req, res) => {    await axios.post(webhookUrl, { message: 'Coucou depuis l’orchestrateur' });

        });

            try {    res.send('Webhook n8n déclenché !');

        res.json({ 

            success: true,         const webhookUrl = process.env.N8N_WEBHOOK_URL;  } catch (error) {

            message: 'n8n webhook triggered securely!',

            timestamp: new Date().toISOString()        if (!webhookUrl) {    console.error(error);

        });

                    return res.json({ message: 'N8N_WEBHOOK_URL not configured' });    res.status(500).send("Erreur lors de l'appel du webhook");

    } catch (error) {

        console.error('[SECURITY] Webhook error:', {        }  }

            timestamp: new Date().toISOString(),

            error: error.message,        });

            ip: req.ip

        });        await axios.post(webhookUrl, { 

        

        res.status(500).json({             message: 'Triggered from Agent Skeleton OSS',app.listen(port, () => {

            success: false, 

            error: 'Webhook call failed',            timestamp: new Date().toISOString()  console.log(`Orchestrateur à l’écoute sur http://localhost:${port}`);

            timestamp: new Date().toISOString()

        });        });});

    }

});        res.json({ success: true, message: 'n8n webhook triggered!' });

    } catch (error) {

// 🔒 SÉCURITÉ : Gestion des erreurs 404 sécurisée        console.error('Webhook error:', error.message);

app.use('*', (req, res) => {        res.status(500).json({ 

    res.status(404).json({            success: false, 

        error: 'Route not found',            error: 'Webhook call failed',

        timestamp: new Date().toISOString(),            message: error.message 

        path: req.originalUrl        });

    });    }

});});



// 🔒 SÉCURITÉ : Gestionnaire d'erreurs global// Démarrage du serveur

app.use((error, req, res, next) => {app.listen(port, '0.0.0.0', () => {

    console.error('[SECURITY] Global error:', {    console.log(`[${new Date().toISOString()}] 🚀 Agent Skeleton OSS démarré !`);

        timestamp: new Date().toISOString(),    console.log(`[${new Date().toISOString()}] 🌐 Interface moderne: http://localhost:${port}/app`);

        error: error.message,    console.log(`[${new Date().toISOString()}] 💚 Health check: http://localhost:${port}/health`);

        stack: error.stack,    console.log(`[${new Date().toISOString()}] ⚡ Prêt pour Coolify sur port ${port} !`);

        ip: req.ip,});
        path: req.path
    });
    
    res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// Démarrage du serveur sécurisé
app.listen(port, '0.0.0.0', () => {
    console.log(`[${new Date().toISOString()}] 🚀 Agent Skeleton OSS démarré (SÉCURISÉ) !`);
    console.log(`[${new Date().toISOString()}] 🌐 Interface moderne: http://localhost:${port}/app`);
    console.log(`[${new Date().toISOString()}] 💚 Health check: http://localhost:${port}/health`);
    console.log(`[${new Date().toISOString()}] 🔒 Sécurité: Helmet, CORS, Rate Limiting, Validation`);
    console.log(`[${new Date().toISOString()}] ⚡ Prêt pour Coolify sur port ${port} !`);
});