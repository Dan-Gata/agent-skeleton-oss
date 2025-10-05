const express = require('express');
const axios = require('axios');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const app = express();
const port = process.env.PORT || 3000;

// 🔒 SÉCURITÉ : Configuration des headers de sécurité
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
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

// 🔍 Health Check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// 💬 API Chat avec validation et rate limiting
app.post('/api/chat', chatLimiter, [
    body('message').notEmpty().trim().isLength({ min: 1, max: 1000 }).escape(),
    body('conversationId').optional().isUUID()
], async (req, res) => {
    try {
        // Validation des entrées
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Données invalides',
                details: errors.array()
            });
        }

        const { message, conversationId } = req.body;

        // Simulation d'une réponse intelligente
        const responses = [
            "🤖 Bonjour ! Comment puis-je vous aider aujourd'hui ?",
            "💡 C'est une excellente question ! Laissez-moi réfléchir...",
            "🚀 Agent Skeleton OSS est prêt à vous assister !",
            "⚡ Traitement de votre demande en cours...",
            "🎯 Voici ce que je peux vous proposer comme solution."
        ];

        const response = responses[Math.floor(Math.random() * responses.length)];

        res.json({
            response: response,
            conversationId: conversationId || `conv_${Date.now()}`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Erreur API Chat:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur',
            message: 'Une erreur est survenue lors du traitement de votre message'
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