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

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Agent running on port ${PORT}`);
    console.log(`Health check available at: http://localhost:${PORT}/health`);
});