const express = require('express');
const axios = require('axios');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const cookieParser = require('cookie-parser');

// Import des services
const aiService = require('./services/aiService');
const { authService, requireAuth } = require('./middleware/auth');
const { memoryService } = require('./services/memoryService');
const { socialWorkflowService } = require('./services/socialWorkflowService');

const app = express();
const port = process.env.PORT || 3000;

// 🔒 SÉCURITÉ : Configuration des headers de sécurité
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Configuration du moteur de templates
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// 🔒 CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    optionsSuccessStatus: 200
}));

// 🔒 Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limite chaque IP à 100 requêtes par windowMs
    message: {
        error: 'Trop de requêtes depuis cette IP, réessayez plus tard.',
        retryAfter: '15 minutes'
    },
    legacyHeaders: false
});

const chatLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // limite chaque IP à 10 requêtes de chat par minute
    message: {
        error: 'Trop de messages de chat, attendez avant de continuer.',
        retryAfter: '1 minute'
    }
});

app.use(limiter);

// Middleware pour parsing JSON et URL-encoded
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fichiers statiques
app.use(express.static(path.join(__dirname, '../public')));

// 🏠 Route principale - Interface moderne (protégée)
app.get('/', requireAuth, (req, res) => {
    res.render('app', {
        title: 'Agent Skeleton OSS',
        version: '1.0.0',
        user: req.user
    });
});

// � Route de connexion (non protégée)
app.get('/login', (req, res) => {
    res.render('login', { title: 'Connexion - Agent Skeleton OSS' });
});

// �📱 Route pour l'interface moderne (protégée)
app.get('/app', requireAuth, (req, res) => {
    res.render('app', {
        title: 'Agent Skeleton OSS - Interface Moderne',
        version: '1.0.0',
        user: req.user
    });
});

// 🔐 Routes d'authentification
app.post('/api/auth/register', [
    body('username').isLength({ min: 3 }).withMessage('Nom d\'utilisateur requis (min 3 caractères)'),
    body('password').isLength({ min: 6 }).withMessage('Mot de passe requis (min 6 caractères)'),
    body('email').isEmail().withMessage('Email valide requis')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { username, password, email } = req.body;
        const result = authService.createAccount(username, password, email);
        res.json({ success: true, message: 'Compte créé avec succès' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/auth/login', [
    body('username').notEmpty().withMessage('Nom d\'utilisateur requis'),
    body('password').notEmpty().withMessage('Mot de passe requis')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { username, password } = req.body;
        const result = authService.login(username, password);
        
        // Définir le cookie de session
        res.cookie('sessionId', result.sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 heures
        });

        res.json({ success: true, user: result.user });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
    const sessionId = req.cookies?.sessionId;
    if (sessionId) {
        authService.logout(sessionId);
        res.clearCookie('sessionId');
    }
    res.json({ success: true, message: 'Déconnexion réussie' });
});

// 🔧 Route de debug pour tester la navigation
app.get('/debug', (req, res) => {
    res.render('app_debug', {
        title: 'Agent Skeleton OSS - Debug Interface',
        version: '1.0.0'
    });
});

// 🔍 Health Check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// 🔑 API Keys Status Check (pour debug)
app.get('/api/keys-status', (req, res) => {
    const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
    const status = {
        openrouter: hasOpenRouter,
        all_models_available: hasOpenRouter,
        provider: 'OpenRouter (Unified API)',
        models: {
            'gpt-4o-mini': hasOpenRouter ? 'Available via OpenRouter' : 'Requires OpenRouter key',
            'claude-3.5-sonnet': hasOpenRouter ? 'Available via OpenRouter' : 'Requires OpenRouter key',
            'gemini-2.0-flash': hasOpenRouter ? 'Available via OpenRouter' : 'Requires OpenRouter key',
            'grok-beta': hasOpenRouter ? 'Available via OpenRouter' : 'Requires OpenRouter key'
        },
        demo_mode: !hasOpenRouter
    };
    
    res.json(status);
});

// 🤖 ENDPOINTS AGENT AUTONOME

// 🔄 n8n Workflows Management
app.get('/api/agent/n8n/workflows', async (req, res) => {
    try {
        if (!process.env.N8N_API_KEY || !process.env.N8N_API_URL) {
            return res.status(400).json({ error: 'Clés n8n manquantes', configured: false });
        }
        
        // Simuler la récupération des workflows (remplacer par vraie API)
        const workflows = [
            { id: 1, name: 'Agent Chat Automation', active: true, lastExecution: '2025-10-07T10:30:00Z' },
            { id: 2, name: 'Baserow Sync', active: true, lastExecution: '2025-10-07T09:15:00Z' },
            { id: 3, name: 'Deploy Monitor', active: false, lastExecution: '2025-10-06T22:00:00Z' }
        ];
        
        res.json({ workflows, configured: true });
    } catch (error) {
        res.status(500).json({ error: 'Erreur n8n', details: error.message });
    }
});

app.post('/api/agent/n8n/create-workflow', async (req, res) => {
    try {
        const { name, description, trigger, actions } = req.body;
        
        // Simuler la création d'un workflow
        const newWorkflow = {
            id: Date.now(),
            name: name || 'Nouveau Workflow',
            description: description || 'Créé par Agent Skeleton OSS',
            active: false,
            created: new Date().toISOString()
        };
        
        res.json({ 
            success: true, 
            workflow: newWorkflow,
            message: `Workflow "${newWorkflow.name}" créé avec succès` 
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur création workflow', details: error.message });
    }
});

// 🚀 Coolify Deployments Management  
app.get('/api/agent/coolify/deployments', async (req, res) => {
    try {
        if (!process.env.COOLIFY_API_KEY || !process.env.COOLIFY_API_URL) {
            return res.status(400).json({ error: 'Clés Coolify manquantes', configured: false });
        }
        
        // Simuler l'état des déploiements
        const deployments = [
            { id: 1, name: 'agent-skeleton-oss', status: 'running', lastDeploy: '2025-10-07T11:00:00Z', health: 'healthy' },
            { id: 2, name: 'n8n-instance', status: 'running', lastDeploy: '2025-10-07T08:30:00Z', health: 'healthy' },
            { id: 3, name: 'baserow-db', status: 'stopped', lastDeploy: '2025-10-06T20:15:00Z', health: 'warning' }
        ];
        
        res.json({ deployments, configured: true });
    } catch (error) {
        res.status(500).json({ error: 'Erreur Coolify', details: error.message });
    }
});

app.post('/api/agent/coolify/deploy', async (req, res) => {
    try {
        const { serviceId, serviceName } = req.body;
        
        // Simuler un déploiement
        const deployment = {
            id: serviceId || Date.now(),
            name: serviceName || 'Service inconnu',
            status: 'deploying',
            startedAt: new Date().toISOString()
        };
        
        res.json({ 
            success: true, 
            deployment,
            message: `Déploiement de "${deployment.name}" initié` 
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur déploiement', details: error.message });
    }
});

// 📊 Baserow Database Management
app.get('/api/agent/baserow/tables', async (req, res) => {
    try {
        if (!process.env.BASEROW_API_KEY || !process.env.BASEROW_URL) {
            return res.status(400).json({ error: 'Clés Baserow manquantes', configured: false });
        }
        
        // Simuler les tables Baserow
        const tables = [
            { id: 1, name: 'Conversations', rows: 156, lastUpdate: '2025-10-07T10:45:00Z' },
            { id: 2, name: 'Workflows Status', rows: 3, lastUpdate: '2025-10-07T09:30:00Z' },
            { id: 3, name: 'Deployments Log', rows: 42, lastUpdate: '2025-10-07T11:00:00Z' }
        ];
        
        res.json({ tables, configured: true });
    } catch (error) {
        res.status(500).json({ error: 'Erreur Baserow', details: error.message });
    }
});

app.post('/api/agent/baserow/sync', async (req, res) => {
    try {
        const { tableId, action } = req.body;
        
        // Simuler une synchronisation
        const syncResult = {
            tableId: tableId || 1,
            action: action || 'sync',
            recordsProcessed: Math.floor(Math.random() * 50) + 10,
            status: 'completed',
            timestamp: new Date().toISOString()
        };
        
        res.json({ 
            success: true, 
            result: syncResult,
            message: `Synchronisation réussie : ${syncResult.recordsProcessed} enregistrements traités` 
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur synchronisation', details: error.message });
    }
});

// 🎭 Routes pour les workflows de réseaux sociaux
app.post('/api/agent/social/create-publisher', requireAuth, async (req, res) => {
    try {
        const { platforms, autoPost } = req.body;
        const userId = req.user.userId;
        
        const result = await socialWorkflowService.createSocialPublishingWorkflow(
            userId, 
            platforms || ['facebook', 'twitter', 'linkedin']
        );
        
        if (result.success) {
            memoryService.saveConversation(userId, 
                `Créer un workflow de publication sociale pour ${platforms?.join(', ')}`,
                `Workflow de publication créé avec succès pour les plateformes: ${platforms?.join(', ')}`,
                'system',
                { workflowId: result.workflowId, action: 'create_social_workflow' }
            );
        }
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Erreur création workflow social', details: error.message });
    }
});

app.post('/api/agent/social/create-monitor', requireAuth, async (req, res) => {
    try {
        const { keywords, platforms } = req.body;
        const userId = req.user.userId;
        
        const result = await socialWorkflowService.createSocialMonitoringWorkflow(
            userId,
            keywords || []
        );
        
        if (result.success) {
            memoryService.saveConversation(userId,
                `Créer un monitoring social pour: ${keywords?.join(', ')}`,
                `Workflow de monitoring créé pour surveiller: ${keywords?.join(', ')}`,
                'system',
                { workflowId: result.workflowId, action: 'create_monitor_workflow' }
            );
        }
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Erreur création monitoring social', details: error.message });
    }
});

// 🧠 Routes de mémoire pour l'agent
app.get('/api/agent/memory/conversations', requireAuth, (req, res) => {
    try {
        const userId = req.user.userId;
        const limit = parseInt(req.query.limit) || 20;
        
        const conversations = memoryService.getConversationHistory(userId, limit);
        res.json({ conversations, count: conversations.length });
    } catch (error) {
        res.status(500).json({ error: 'Erreur récupération mémoire', details: error.message });
    }
});

// 💬 API Chat avec validation, rate limiting et mémoire
app.post('/api/chat', chatLimiter, requireAuth, async (req, res) => {
    try {
        console.log('🔍 Données reçues brutes:', req.body);
        
        const { message, conversationId, model } = req.body;
        
        // Validation simple manuelle
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            console.log('❌ Message invalide:', message);
            return res.status(400).json({
                error: 'Message requis',
                details: 'Le message ne peut pas être vide'
            });
        }

        console.log('✅ Message valide reçu:', { message, conversationId, model });
        
        // Debug des clés API (OpenRouter uniquement)
        console.log('🔑 État OpenRouter:', {
            OPENROUTER_KEY: !!process.env.OPENROUTER_API_KEY,
            ALL_MODELS: !!process.env.OPENROUTER_API_KEY ? 'Available' : 'Demo Mode'
        });

        // Responses basées sur le modèle sélectionné
        const modelResponses = {
            'claude-3.5-sonnet': [
                "🧠 Claude 3.5 Sonnet ici ! Je vais analyser votre demande avec attention.",
                "🔍 Excellente question ! Avec Claude, je peux vous aider à explorer cette idée en profondeur.",
                "💡 En tant que Claude 3.5 Sonnet, je propose une approche méthodique pour résoudre cela.",
                "📊 Grâce aux capacités de Claude, voici une analyse détaillée de votre demande.",
                "🎯 Claude 3.5 Sonnet est conçu pour vous fournir des réponses nuancées et pertinentes."
            ],
            'gpt-4': [
                "� GPT-4 activé ! Je vais traiter votre requête avec ma compréhension avancée.",
                "⚡ Excellent ! GPT-4 est parfait pour ce type de question complexe.",
                "🎭 Avec GPT-4, je peux aborder votre demande sous plusieurs angles créatifs.",
                "� Utilisant les capacités de GPT-4, voici une réponse structurée pour vous.",
                "🌟 GPT-4 me permet de vous offrir une perspective riche et détaillée."
            ],
            'gemini-pro': [
                "💎 Gemini Pro en action ! Analysons cela ensemble de manière intelligente.",
                "🌈 Avec Gemini Pro, j'apporte une approche multimodale à votre question.",
                "🔮 Gemini Pro me donne la flexibilité pour explorer votre demande créativement.",
                "⭐ Grâce à Gemini Pro, je peux connecter différents concepts pour vous aider.",
                "� Gemini Pro excelle dans la compréhension nuancée de votre demande."
            ]
        };

        // Réponses génériques pour les autres modèles
        const genericResponses = [
            `🤖 ${model || 'IA'} : Votre message est bien reçu ! Comment puis-je vous aider davantage ?`,
            `💭 Avec ${model || 'ce modèle'}, je traite votre demande avec soin.`,
            `🔧 ${model || 'Le système'} analyse votre question et prépare une réponse adaptée.`,
            `📝 Utilisant ${model || 'les capacités IA'}, voici ma réflexion sur votre demande.`,
            `🎯 ${model || 'L\'assistant'} est prêt à vous accompagner dans cette tâche.`
        ];

        // Récupérer le contexte de mémoire pour l'utilisateur
        const personalizedContext = memoryService.generatePersonalizedContext(req.user.userId);
        
        // Appel du service IA réel avec contexte personnalisé
        const aiResponse = await aiService.sendMessage(message, model, conversationId, personalizedContext);
        
        console.log('🤖 Réponse IA reçue:', aiResponse);

        // Sauvegarder la conversation dans la mémoire
        memoryService.saveConversation(req.user.userId, message, aiResponse.response, model, {
            simulated: aiResponse.simulated,
            conversationId: conversationId
        });

        // Apprendre des préférences utilisateur
        memoryService.learnFromConversation(req.user.userId, message, aiResponse.response);

        // Si c'est une simulation, on ajoute un indicateur
        let finalResponse = aiResponse.response;
        if (aiResponse.simulated) {
            finalResponse = `${aiResponse.response}\n\n💡 *Mode démo - Configurez vos clés API pour activer l'IA complète*`;
        } else if (aiResponse.error) {
            finalResponse = aiResponse.response;
        }

        res.json({
            response: finalResponse,
            conversationId: conversationId || `conv_${Date.now()}`,
            timestamp: new Date().toISOString(),
            model: model || 'assistant',
            usage: aiResponse.usage || null,
            simulated: aiResponse.simulated || false
        });

    } catch (error) {
        console.error('Erreur API Chat:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur',
            message: 'Une erreur est survenue lors du traitement de votre message'
        });
    }
});

// 📝 API Instructions personnalisées
app.get('/api/instructions', (req, res) => {
    res.json({
        instructions: aiService.customInstructions
    });
});

app.post('/api/instructions', [
    body('brand').optional().isString().trim(),
    body('tone').optional().isString().trim(),
    body('expertise').optional().isString().trim(),
    body('language').optional().isString().trim(),
    body('personality').optional().isString().trim()
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Données invalides',
                details: errors.array()
            });
        }

        // Filtrer les champs non-null
        const newInstructions = {};
        ['brand', 'tone', 'expertise', 'language', 'personality'].forEach(field => {
            if (req.body[field] !== undefined && req.body[field] !== '') {
                newInstructions[field] = req.body[field];
            }
        });

        // Mettre à jour les instructions
        aiService.updateInstructions(newInstructions);

        res.json({
            success: true,
            instructions: aiService.customInstructions,
            message: 'Instructions mises à jour avec succès'
        });

    } catch (error) {
        console.error('Erreur API Instructions:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur',
            message: 'Une erreur est survenue lors de la mise à jour'
        });
    }
});

// 📊 API Status
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// 🔧 Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
    console.error('Erreur:', err);
    res.status(500).json({
        error: 'Erreur interne du serveur',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Page non trouvée',
        message: `La route ${req.originalUrl} n'existe pas`
    });
});

// Démarrage du serveur
app.listen(port, () => {
    console.log(`🚀 Agent Skeleton OSS démarré sur le port ${port}`);
    console.log(`🌐 Interface disponible : http://localhost:${port}/app`);
    console.log(`💚 Health check : http://localhost:${port}/health`);
    console.log(`📡 API Status : http://localhost:${port}/api/status`);
});

module.exports = app;