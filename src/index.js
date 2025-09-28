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
            coolify: {
                deployments: '/coolify/deployments',
                applications: '/coolify/applications',
                deploy: '/coolify/deploy/:appId',
                status: '/coolify/status/:appId'
            },
            n8n: {
                workflows: '/n8n/workflows',
                execute: '/n8n/execute/:workflowId',
                executions: '/n8n/executions',
                status: '/n8n/status'
            },
            automation: {
                deployAndNotify: '/automate/deploy-notify',
                healthCheck: '/automate/health-check',
                fullPipeline: '/automate/full-pipeline'
            }
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

// ========================================
// FONCTIONNALITÉS COOLIFY
// ========================================

// Lister toutes les applications Coolify
app.get('/coolify/applications', async (req, res) => {
    try {
        const response = await coolifyClient.get('/applications');
        res.json({
            success: true,
            data: response.data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.response?.data || 'Unknown error'
        });
    }
});

// Obtenir le statut d'une application
app.get('/coolify/status/:appId', async (req, res) => {
    try {
        const { appId } = req.params;
        const response = await coolifyClient.get(`/applications/${appId}`);
        res.json({
            success: true,
            appId,
            status: response.data.status,
            data: response.data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            appId: req.params.appId
        });
    }
});

// Déclencher un déploiement
app.post('/coolify/deploy/:appId', async (req, res) => {
    try {
        const { appId } = req.params;
        const response = await coolifyClient.post(`/applications/${appId}/deploy`);
        res.json({
            success: true,
            message: `Deployment started for application ${appId}`,
            deploymentId: response.data.id,
            data: response.data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            appId: req.params.appId
        });
    }
});

// Lister les déploiements récents
app.get('/coolify/deployments', async (req, res) => {
    try {
        const limit = req.query.limit || 10;
        const response = await coolifyClient.get(`/deployments?limit=${limit}`);
        res.json({
            success: true,
            deployments: response.data,
            count: response.data.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================
// FONCTIONNALITÉS N8N
// ========================================

// Lister tous les workflows N8N
app.get('/n8n/workflows', async (req, res) => {
    try {
        const response = await n8nClient.get('/workflows');
        res.json({
            success: true,
            workflows: response.data,
            count: response.data.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.response?.data || 'Unknown error'
        });
    }
});

// Exécuter un workflow N8N
app.post('/n8n/execute/:workflowId', async (req, res) => {
    try {
        const { workflowId } = req.params;
        const inputData = req.body || {};
        
        const response = await n8nClient.post(`/workflows/${workflowId}/execute`, {
            data: inputData
        });
        
        res.json({
            success: true,
            message: `Workflow ${workflowId} executed successfully`,
            executionId: response.data.id,
            data: response.data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            workflowId: req.params.workflowId
        });
    }
});

// Obtenir les exécutions récentes de N8N
app.get('/n8n/executions', async (req, res) => {
    try {
        const limit = req.query.limit || 10;
        const response = await n8nClient.get(`/executions?limit=${limit}`);
        res.json({
            success: true,
            executions: response.data,
            count: response.data.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obtenir le statut de N8N
app.get('/n8n/status', async (req, res) => {
    try {
        const response = await n8nClient.get('/');
        res.json({
            success: true,
            status: 'operational',
            n8nVersion: response.data.version || 'unknown',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            status: 'unreachable'
        });
    }
});

// ========================================
// FONCTIONNALITÉS D'AUTOMATISATION
// ========================================

// Déployer une app et notifier via N8N
app.post('/automate/deploy-notify', async (req, res) => {
    try {
        const { appId, notificationWorkflowId } = req.body;
        
        if (!appId || !notificationWorkflowId) {
            return res.status(400).json({
                success: false,
                error: 'appId and notificationWorkflowId are required'
            });
        }

        // 1. Déclencher le déploiement
        const deployResponse = await coolifyClient.post(`/applications/${appId}/deploy`);
        
        // 2. Attendre quelques secondes pour que le déploiement commence
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 3. Envoyer une notification via N8N
        const notificationData = {
            appId,
            deploymentId: deployResponse.data.id,
            status: 'deployment_started',
            timestamp: new Date().toISOString()
        };
        
        await n8nClient.post(`/workflows/${notificationWorkflowId}/execute`, {
            data: notificationData
        });

        res.json({
            success: true,
            message: 'Deployment started and notification sent',
            appId,
            deploymentId: deployResponse.data.id,
            notificationSent: true,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            step: 'automation_failed'
        });
    }
});

// Vérification de santé complète (Coolify + N8N)
app.get('/automate/health-check', async (req, res) => {
    const results = {
        timestamp: new Date().toISOString(),
        overall: 'unknown',
        services: {}
    };

    // Test Coolify
    try {
        await coolifyClient.get('/applications');
        results.services.coolify = { status: 'healthy', error: null };
    } catch (error) {
        results.services.coolify = { status: 'unhealthy', error: error.message };
    }

    // Test N8N
    try {
        await n8nClient.get('/');
        results.services.n8n = { status: 'healthy', error: null };
    } catch (error) {
        results.services.n8n = { status: 'unhealthy', error: error.message };
    }

    // Déterminer le statut global
    const allHealthy = Object.values(results.services).every(service => service.status === 'healthy');
    results.overall = allHealthy ? 'healthy' : 'degraded';

    const statusCode = allHealthy ? 200 : 503;
    res.status(statusCode).json(results);
});

// Pipeline complet : Déployer -> Vérifier -> Notifier
app.post('/automate/full-pipeline', async (req, res) => {
    try {
        const { appId, notificationWorkflowId, maxWaitTime = 300000 } = req.body; // 5 min par défaut
        
        if (!appId) {
            return res.status(400).json({
                success: false,
                error: 'appId is required'
            });
        }

        const pipeline = {
            appId,
            steps: [],
            startTime: new Date().toISOString(),
            success: false
        };

        // Étape 1: Démarrer le déploiement
        pipeline.steps.push({ step: 'deploy_start', status: 'in_progress', timestamp: new Date().toISOString() });
        const deployResponse = await coolifyClient.post(`/applications/${appId}/deploy`);
        pipeline.deploymentId = deployResponse.data.id;
        pipeline.steps[pipeline.steps.length - 1].status = 'completed';

        // Étape 2: Attendre la fin du déploiement (polling)
        pipeline.steps.push({ step: 'deploy_wait', status: 'in_progress', timestamp: new Date().toISOString() });
        const startTime = Date.now();
        let deployed = false;
        
        while (!deployed && (Date.now() - startTime) < maxWaitTime) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Attendre 10 secondes
            
            try {
                const statusResponse = await coolifyClient.get(`/applications/${appId}`);
                if (statusResponse.data.status === 'running') {
                    deployed = true;
                    pipeline.steps[pipeline.steps.length - 1].status = 'completed';
                }
            } catch (error) {
                console.log('Checking deployment status...', error.message);
            }
        }

        if (!deployed) {
            pipeline.steps[pipeline.steps.length - 1].status = 'timeout';
            return res.status(408).json({
                success: false,
                error: 'Deployment timeout',
                pipeline
            });
        }

        // Étape 3: Notification (si workflow spécifié)
        if (notificationWorkflowId) {
            pipeline.steps.push({ step: 'notification', status: 'in_progress', timestamp: new Date().toISOString() });
            
            const notificationData = {
                appId,
                deploymentId: pipeline.deploymentId,
                status: 'deployment_completed',
                duration: Date.now() - startTime,
                timestamp: new Date().toISOString()
            };
            
            await n8nClient.post(`/workflows/${notificationWorkflowId}/execute`, {
                data: notificationData
            });
            
            pipeline.steps[pipeline.steps.length - 1].status = 'completed';
        }

        pipeline.success = true;
        pipeline.endTime = new Date().toISOString();
        pipeline.duration = Date.now() - startTime;

        res.json({
            success: true,
            message: 'Full pipeline completed successfully',
            pipeline
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            pipeline: req.body
        });
    }
});

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Agent running on port ${PORT}`);
    console.log(`Health check available at: http://0.0.0.0:${PORT}/health`);
});