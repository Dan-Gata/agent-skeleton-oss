require('dotenv').config();
const express = require('express');
const axios = require('axios');
const OpenAI = require('openai');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

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

// Configuration du client Baserow
const baserowClient = axios.create({
    baseURL: process.env.BASEROW_API_URL,
    headers: {
        'Authorization': `Token ${process.env.BASEROW_API_TOKEN}`,
        'Content-Type': 'application/json'
    }
});

// Configuration du client OpenRouter pour l'IA 
const openai = new OpenAI({
    baseURL: process.env.OPENROUTER_API_URL || "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
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
            },
            baserow: {
                databases: '/baserow/databases',
                tables: '/baserow/tables/:databaseId',
                createTable: '/baserow/table/create',
                rows: '/baserow/rows/:tableId',
                generateContent: '/baserow/generate-content'
            },
            socialMedia: {
                connectPlatforms: '/social/connect',
                syncContent: '/social/sync',
                schedulePost: '/social/schedule',
                analytics: '/social/analytics'
            },
            aiAgent: {
                chat: '/ai/chat',
                generateContent: '/ai/generate',
                analyzeData: '/ai/analyze',
                createWorkflow: '/ai/create-workflow'
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

// ========================================
// FONCTIONNALITÉS BASEROW
// ========================================

// Lister toutes les bases de données Baserow
app.get('/baserow/databases', async (req, res) => {
    try {
        const response = await baserowClient.get('/applications/');
        res.json({
            success: true,
            databases: response.data.results,
            count: response.data.count,
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

// Lister les tables d'une base de données
app.get('/baserow/tables/:databaseId', async (req, res) => {
    try {
        const { databaseId } = req.params;
        const response = await baserowClient.get(`/applications/${databaseId}/`);
        res.json({
            success: true,
            tables: response.data.tables,
            databaseId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            databaseId: req.params.databaseId
        });
    }
});

// Créer une nouvelle table avec colonnes personnalisées
app.post('/baserow/table/create', async (req, res) => {
    try {
        const { databaseId, tableName, fields } = req.body;
        
        if (!databaseId || !tableName) {
            return res.status(400).json({
                success: false,
                error: 'databaseId and tableName are required'
            });
        }

        // Créer la table
        const tableResponse = await baserowClient.post(`/database/tables/`, {
            database_id: databaseId,
            name: tableName
        });

        const tableId = tableResponse.data.id;

        // Ajouter les champs personnalisés si fournis
        if (fields && fields.length > 0) {
            for (const field of fields) {
                await baserowClient.post(`/database/fields/`, {
                    table_id: tableId,
                    name: field.name,
                    type: field.type || 'text'
                });
            }
        }

        res.json({
            success: true,
            message: `Table '${tableName}' created successfully`,
            table: tableResponse.data,
            fieldsAdded: fields?.length || 0,
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

// Obtenir les données d'une table
app.get('/baserow/rows/:tableId', async (req, res) => {
    try {
        const { tableId } = req.params;
        const page = req.query.page || 1;
        const size = req.query.size || 100;
        
        const response = await baserowClient.get(`/database/rows/table/${tableId}/?page=${page}&size=${size}`);
        
        res.json({
            success: true,
            tableId,
            rows: response.data.results,
            count: response.data.count,
            pagination: {
                page: parseInt(page),
                size: parseInt(size),
                hasNext: !!response.data.next,
                hasPrevious: !!response.data.previous
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            tableId: req.params.tableId
        });
    }
});

// Ajouter des lignes à une table
app.post('/baserow/rows/:tableId', async (req, res) => {
    try {
        const { tableId } = req.params;
        const rowData = req.body;
        
        const response = await baserowClient.post(`/database/rows/table/${tableId}/`, rowData);
        
        res.json({
            success: true,
            message: 'Row added successfully',
            tableId,
            row: response.data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            tableId: req.params.tableId
        });
    }
});

// Générer du contenu avec IA et l'insérer dans Baserow
app.post('/baserow/generate-content', async (req, res) => {
    try {
        const { tableId, prompt, fieldsMapping, count = 1 } = req.body;
        
        if (!tableId || !prompt) {
            return res.status(400).json({
                success: false,
                error: 'tableId and prompt are required'
            });
        }

        const generatedRows = [];

        for (let i = 0; i < count; i++) {
            // Générer le contenu avec OpenRouter
            const completion = await openai.chat.completions.create({
                model: process.env.AI_MODEL || "openai/gpt-4o-mini",
                messages: [
                    {
                        role: "system", 
                        content: "Tu es un assistant qui génère du contenu structuré pour des bases de données. Réponds toujours avec un objet JSON valide."
                    },
                    {
                        role: "user", 
                        content: `${prompt}\n\nGénère le contenu ${i + 1}/${count}. Format: JSON avec les champs demandés.`
                    }
                ],
                temperature: parseFloat(process.env.DEFAULT_TEMPERATURE) || 0.7,
                max_tokens: parseInt(process.env.MAX_TOKENS) || 2000
            });

            try {
                const generatedContent = JSON.parse(completion.choices[0].message.content);
                
                // Mapper les champs si nécessaire
                let mappedContent = generatedContent;
                if (fieldsMapping) {
                    mappedContent = {};
                    Object.keys(fieldsMapping).forEach(key => {
                        mappedContent[fieldsMapping[key]] = generatedContent[key];
                    });
                }

                // Ajouter à Baserow
                const rowResponse = await baserowClient.post(`/database/rows/table/${tableId}/`, mappedContent);
                generatedRows.push(rowResponse.data);

            } catch (parseError) {
                console.error('Error parsing AI response:', parseError);
                // Fallback: créer une ligne avec le contenu brut
                const fallbackRow = {
                    content: completion.choices[0].message.content,
                    generated_at: moment().format(),
                    id: uuidv4()
                };
                const rowResponse = await baserowClient.post(`/database/rows/table/${tableId}/`, fallbackRow);
                generatedRows.push(rowResponse.data);
            }
        }

        res.json({
            success: true,
            message: `Generated and inserted ${generatedRows.length} rows`,
            tableId,
            rows: generatedRows,
            prompt,
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

// ========================================
// FONCTIONNALITÉS RÉSEAUX SOCIAUX
// ========================================

// Connecter les plateformes sociales via N8N
app.post('/social/connect', async (req, res) => {
    try {
        const { platforms, n8nWorkflowId } = req.body;
        
        if (!platforms || !n8nWorkflowId) {
            return res.status(400).json({
                success: false,
                error: 'platforms array and n8nWorkflowId are required'
            });
        }

        const connectionData = {
            platforms,
            action: 'connect_platforms',
            timestamp: new Date().toISOString(),
            requestId: uuidv4()
        };

        const response = await n8nClient.post(`/workflows/${n8nWorkflowId}/execute`, {
            data: connectionData
        });

        res.json({
            success: true,
            message: 'Social media connection workflow triggered',
            platforms,
            executionId: response.data.id,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Synchroniser le contenu entre plateformes
app.post('/social/sync', async (req, res) => {
    try {
        const { sourcePost, targetPlatforms, syncWorkflowId, adaptContent } = req.body;
        
        if (!sourcePost || !targetPlatforms || !syncWorkflowId) {
            return res.status(400).json({
                success: false,
                error: 'sourcePost, targetPlatforms, and syncWorkflowId are required'
            });
        }

        let finalContent = sourcePost;

        // Adapter le contenu avec IA si demandé
        if (adaptContent) {
            const completion = await openai.chat.completions.create({
                model: process.env.AI_MODEL || "openai/gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "Tu adaptes le contenu pour différentes plateformes sociales en respectant leurs spécificités (longueur, ton, hashtags, etc.)"
                    },
                    {
                        role: "user",
                        content: `Adapte ce contenu pour ${targetPlatforms.join(', ')}: "${sourcePost.content}"`
                    }
                ],
                temperature: 0.7
            });

            finalContent = {
                ...sourcePost,
                adaptedContent: completion.choices[0].message.content,
                adaptedFor: targetPlatforms
            };
        }

        const syncData = {
            originalPost: sourcePost,
            adaptedContent: finalContent,
            targetPlatforms,
            action: 'sync_content',
            timestamp: new Date().toISOString()
        };

        const response = await n8nClient.post(`/workflows/${syncWorkflowId}/execute`, {
            data: syncData
        });

        res.json({
            success: true,
            message: 'Content sync workflow triggered',
            targetPlatforms,
            contentAdapted: adaptContent,
            executionId: response.data.id,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Programmer une publication
app.post('/social/schedule', async (req, res) => {
    try {
        const { content, platforms, scheduleTime, scheduleWorkflowId } = req.body;
        
        const scheduleData = {
            content,
            platforms,
            scheduleTime,
            action: 'schedule_post',
            createdAt: new Date().toISOString(),
            scheduleId: uuidv4()
        };

        const response = await n8nClient.post(`/workflows/${scheduleWorkflowId}/execute`, {
            data: scheduleData
        });

        res.json({
            success: true,
            message: 'Post scheduled successfully',
            scheduleId: scheduleData.scheduleId,
            scheduleTime,
            platforms,
            executionId: response.data.id,
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
// FONCTIONNALITÉS AGENT IA
// ========================================

// Chat avec l'agent IA
app.post('/ai/chat', async (req, res) => {
    try {
        const { message, context, systemPrompt } = req.body;
        
        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'message is required'
            });
        }

        const messages = [
            {
                role: "system",
                content: systemPrompt || "Tu es un assistant IA spécialisé dans l'automatisation et la gestion de contenu."
            }
        ];

        if (context) {
            messages.push({
                role: "system",
                content: `Contexte: ${JSON.stringify(context)}`
            });
        }

        messages.push({
            role: "user",
            content: message
        });

        const completion = await openai.chat.completions.create({
            model: process.env.AI_MODEL || "openai/gpt-4o-mini",
            messages,
            temperature: parseFloat(process.env.DEFAULT_TEMPERATURE) || 0.7,
            max_tokens: parseInt(process.env.MAX_TOKENS) || 2000
        });

        res.json({
            success: true,
            response: completion.choices[0].message.content,
            model: process.env.AI_MODEL || "openai/gpt-4o-mini",
            usage: completion.usage,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Générer du contenu spécialisé
app.post('/ai/generate', async (req, res) => {
    try {
        const { type, prompt, parameters } = req.body;
        
        if (!type || !prompt) {
            return res.status(400).json({
                success: false,
                error: 'type and prompt are required'
            });
        }

        let systemPrompt = "";
        switch (type) {
            case 'social_post':
                systemPrompt = "Tu génères des posts optimisés pour les réseaux sociaux avec hashtags et engagement.";
                break;
            case 'table_data':
                systemPrompt = "Tu génères des données structurées pour des tableaux/bases de données.";
                break;
            case 'workflow':
                systemPrompt = "Tu crées des descriptions de workflows d'automatisation.";
                break;
            default:
                systemPrompt = "Tu es un générateur de contenu polyvalent.";
        }

        const completion = await openai.chat.completions.create({
            model: process.env.AI_MODEL || "openai/gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ],
            temperature: parameters?.temperature || 0.7,
            max_tokens: parameters?.maxTokens || 2000
        });

        res.json({
            success: true,
            type,
            content: completion.choices[0].message.content,
            parameters,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Analyser des données
app.post('/ai/analyze', async (req, res) => {
    try {
        const { data, analysisType, questions } = req.body;
        
        if (!data) {
            return res.status(400).json({
                success: false,
                error: 'data is required'
            });
        }

        let prompt = `Analyse ces données: ${JSON.stringify(data)}\n\n`;
        
        if (analysisType) {
            prompt += `Type d'analyse: ${analysisType}\n\n`;
        }
        
        if (questions && questions.length > 0) {
            prompt += `Questions spécifiques:\n${questions.map(q => `- ${q}`).join('\n')}\n\n`;
        }
        
        prompt += "Fournis une analyse détaillée avec des insights et recommandations.";

        const completion = await openai.chat.completions.create({
            model: process.env.AI_MODEL || "openai/gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "Tu es un analyste de données expert qui fournit des insights précis et des recommandations actionables."
                },
                { role: "user", content: prompt }
            ],
            temperature: 0.3, // Plus factuel pour l'analyse
            max_tokens: 3000
        });

        res.json({
            success: true,
            analysis: completion.choices[0].message.content,
            analysisType,
            dataSize: JSON.stringify(data).length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Créer un workflow N8N avec IA
app.post('/ai/create-workflow', async (req, res) => {
    try {
        const { description, platforms, triggers, actions } = req.body;
        
        if (!description) {
            return res.status(400).json({
                success: false,
                error: 'description is required'
            });
        }

        const workflowPrompt = `
Crée un workflow N8N détaillé basé sur cette description: "${description}"

Plateformes impliquées: ${platforms?.join(', ') || 'Non spécifiées'}
Déclencheurs: ${triggers?.join(', ') || 'À déterminer'}
Actions: ${actions?.join(', ') || 'À déterminer'}

Génère un JSON de configuration N8N avec:
1. Les nœuds nécessaires
2. Les connexions entre nœuds
3. La configuration de chaque nœud
4. Les paramètres d'authentification nécessaires

Format: JSON valide pour N8N.
        `;

        const completion = await openai.chat.completions.create({
            model: process.env.AI_MODEL || "openai/gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "Tu es un expert N8N qui crée des workflows d'automatisation complets et fonctionnels."
                },
                { role: "user", content: workflowPrompt }
            ],
            temperature: 0.5,
            max_tokens: 4000
        });

        try {
            const workflowConfig = JSON.parse(completion.choices[0].message.content);
            
            res.json({
                success: true,
                workflow: workflowConfig,
                description,
                platforms,
                generatedAt: new Date().toISOString()
            });
        } catch (parseError) {
            // Si le JSON n'est pas valide, retourner le texte brut
            res.json({
                success: true,
                workflowText: completion.choices[0].message.content,
                description,
                note: "Workflow généré en format texte (non-JSON)",
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Agent running on port ${PORT}`);
    console.log(`Health check available at: http://0.0.0.0:${PORT}/health`);
});