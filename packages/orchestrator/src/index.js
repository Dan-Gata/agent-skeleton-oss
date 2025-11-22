require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour parser le JSON
app.use(express.json());

// Configuration des clients API
const coolifyClient = axios.create({
    baseURL: process.env.COOLIFY_API_URL,
    headers: {
        'Authorization': `Bearer ${process.env.COOLIFY_API_KEY}`,
        'Content-Type': 'application/json'
    }
});

const n8nClient = axios.create({
    baseURL: process.env.N8N_API_URL,
    headers: {
        'X-N8N-API-KEY': process.env.N8N_API_KEY,
        'Content-Type': 'application/json'
    }
});

const path = require('path');

// Route racine
app.get('/', (req, res) => {
    res.json({ 
        message: 'Agent Orchestrator API',
        version: '0.1.0',
        endpoints: {
            health: '/health',
            status: 'operational'
        },
        documentation: 'https://github.com/Dan-Gata/agent-skeleton-oss'
    });
});

// Route de santé
app.get('/health', (req, res) => {
    let packageJson = {};
    try {
        packageJson = require('../package.json');
    } catch (e) {
        packageJson = { version: '0.1.0' };
    }
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: packageJson.version,
        services: {
            coolify: process.env.COOLIFY_API_URL ? 'configured' : 'not configured',
            n8n: process.env.N8N_API_URL ? 'configured' : 'not configured'
        }
    });
});

// Route racine pour vérifier que le serveur répond
app.get('/', (req, res) => {
    res.json({
        name: 'Agent Skeleton OSS',
        status: 'running',
        version: require('../package.json').version || '1.0.0',
        endpoints: {
            health: '/health',
            metrics: '/metrics',
            dashboard: '/dashboard',
            chat: '/api/chat'
        }
    });
});

// Démarrage du serveur
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 ========================================');
    console.log(`🚀 Agent Skeleton OSS démarré`);
    console.log(`🚀 Port: ${PORT}`);
    console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🚀 Health check: http://0.0.0.0:${PORT}/health`);
    console.log(`🚀 Dashboard: http://0.0.0.0:${PORT}/dashboard`);
    console.log('🚀 ========================================');
});

// Gestion gracieuse de l'arrêt
process.on('SIGTERM', () => {
    console.log('⚠️  SIGTERM reçu, arrêt gracieux...');
    server.close(() => {
        console.log('✅ Serveur arrêté proprement');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('⚠️  SIGINT reçu, arrêt gracieux...');
    server.close(() => {
        console.log('✅ Serveur arrêté proprement');
        process.exit(0);
    });
});