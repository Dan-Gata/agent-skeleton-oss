const express = require('express');
const axios = require('axios');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

// Import du service IA
const aiService = require('./services/aiService');

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fichiers statiques
app.use(express.static(path.join(__dirname, '../public')));

// 🏠 Route principale - Interface moderne
app.get('/', (req, res) => {
    res.render('app', {
        title: 'Agent Skeleton OSS',
        version: '1.0.0'
    });
});

// 📱 Route pour l'interface moderne
app.get('/app', (req, res) => {
    res.render('app', {
        title: 'Agent Skeleton OSS - Interface Moderne',
        version: '1.0.0'
    });
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
    const status = {
        openai: !!process.env.OPENAI_API_KEY,
        anthropic: !!process.env.ANTHROPIC_API_KEY,
        google: !!process.env.GOOGLE_API_KEY,
        openrouter: !!process.env.OPENROUTER_API_KEY,
        keys_count: [
            process.env.OPENAI_API_KEY,
            process.env.ANTHROPIC_API_KEY, 
            process.env.GOOGLE_API_KEY,
            process.env.OPENROUTER_API_KEY
        ].filter(Boolean).length,
        demo_mode: ![
            process.env.OPENAI_API_KEY,
            process.env.ANTHROPIC_API_KEY, 
            process.env.GOOGLE_API_KEY,
            process.env.OPENROUTER_API_KEY
        ].some(Boolean)
    };
    
    res.json(status);
});

// 💬 API Chat avec validation et rate limiting
app.post('/api/chat', chatLimiter, async (req, res) => {
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
        
        // Debug des clés API
        console.log('🔑 État des clés API:', {
            OPENAI: !!process.env.OPENAI_API_KEY,
            ANTHROPIC: !!process.env.ANTHROPIC_API_KEY,
            GOOGLE: !!process.env.GOOGLE_API_KEY,
            OPENROUTER: !!process.env.OPENROUTER_API_KEY
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

        // Appel du service IA réel
        const aiResponse = await aiService.sendMessage(message, model, conversationId);
        
        console.log('🤖 Réponse IA reçue:', aiResponse);

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