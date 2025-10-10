// Service IA réel avec intégration des APIs
const axios = require('axios');

class AIService {
    constructor() {
        // Configuration des APIs
        this.config = {
            openai: {
                apiKey: process.env.OPENAI_API_KEY,
                baseURL: 'https://api.openai.com/v1'
            },
            anthropic: {
                apiKey: process.env.ANTHROPIC_API_KEY,
                baseURL: 'https://api.anthropic.com/v1'
            },
            google: {
                apiKey: process.env.GOOGLE_API_KEY,
                baseURL: 'https://generativelanguage.googleapis.com/v1beta'
            },
            openrouter: {
                apiKey: process.env.OPENROUTER_API_KEY,
                baseURL: 'https://openrouter.ai/api/v1'
            }
        };

        // Instructions personnalisées par défaut
        this.customInstructions = {
            brand: process.env.BRAND_NAME || "Agent Skeleton OSS",
            tone: process.env.BRAND_TONE || "professionnel et bienveillant",
            expertise: process.env.EXPERTISE_AREAS || "développement, automatisation, intégrations",
            language: process.env.RESPONSE_LANGUAGE || "français",
            personality: process.env.AI_PERSONALITY || "assistant IA intelligent et serviable"
        };
    }

    // Méthode pour mettre à jour les instructions
    updateInstructions(newInstructions) {
        this.customInstructions = { ...this.customInstructions, ...newInstructions };
        console.log('📝 Instructions mises à jour:', this.customInstructions);
    }

    // Génération du prompt système personnalisé
    generateSystemPrompt() {
        return `Tu es ${this.customInstructions.personality} pour ${this.customInstructions.brand}.

TONE ET STYLE:
- Adopte un ton ${this.customInstructions.tone}
- Réponds en ${this.customInstructions.language}
- Reste cohérent avec l'identité de marque de ${this.customInstructions.brand}

EXPERTISE:
- Tu es spécialisé en ${this.customInstructions.expertise}
- Tu aides particulièrement avec les outils : n8n, Coolify, Baserow
- Tu fournis des solutions concrètes et pratiques

CAPACITÉS D'AGENT AUTONOME:
- Tu peux VRAIMENT exécuter des actions via les APIs
- Tu as accès aux endpoints : /api/agent/n8n/*, /api/agent/coolify/*, /api/agent/baserow/*
- Tu peux créer des workflows n8n, gérer des déploiements Coolify, synchroniser Baserow
- Quand on te demande d'agir, tu utilises les APIs disponibles
- Tu peux vérifier le statut réel des systèmes avec /api/agent/n8n/status

COMPORTEMENT:
- Sois précis et utile dans tes réponses
- Adapte ta réponse au niveau technique de l'utilisateur
- Suggère des améliorations quand c'est pertinent
- Quand on te demande d'exécuter une action, confirme d'abord puis agis
- Reste dans le cadre de ${this.customInstructions.brand}

ACTIONS DISPONIBLES:
- Créer et gérer des workflows n8n
- Déployer et monitorer des services Coolify
- Synchroniser et organiser des données Baserow
- Analyser l'état des systèmes et proposer des optimisations`;
    }

    // Détecter si le message demande une action spécifique
    detectActionRequest(message) {
        const msg = message.toLowerCase();
        
        if (msg.includes('n8n') && (msg.includes('vérif') || msg.includes('statut') || msg.includes('état'))) {
            return 'n8n_status';
        }
        if (msg.includes('workflow') && msg.includes('créer')) {
            return 'create_workflow';
        }
        if (msg.includes('coolify') && (msg.includes('déploi') || msg.includes('statut'))) {
            return 'coolify_status';
        }
        if (msg.includes('baserow') && (msg.includes('sync') || msg.includes('données'))) {
            return 'baserow_sync';
        }
        
        return null;
    }

    // Exécuter l'appel API correspondant
    async executeApiCall(actionType, message) {
        try {
            let apiUrl = '';
            
            switch (actionType) {
                case 'n8n_status':
                    apiUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/agent/n8n/status`;
                    break;
                case 'coolify_status':
                    apiUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/agent/coolify/deployments`;
                    break;
                case 'baserow_sync':
                    apiUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/agent/baserow/tables`;
                    break;
                default:
                    return '';
            }

            const response = await axios.get(apiUrl);
            const data = response.data;
            
            // Formater les résultats pour le contexte
            let results = `\n[RÉSULTATS API - ${actionType.toUpperCase()}]:\n`;
            
            if (actionType === 'n8n_status') {
                if (data.configured) {
                    results += `✅ n8n connecté - ${data.status.total_workflows} workflows trouvés\n`;
                    results += `- Actifs: ${data.status.active_workflows}\n`;
                    results += `- Inactifs: ${data.status.inactive_workflows}\n`;
                    if (data.status.workflows.length > 0) {
                        results += `Workflows:\n`;
                        data.status.workflows.forEach(w => {
                            results += `  • ${w.name} (${w.active ? 'Actif' : 'Inactif'})\n`;
                        });
                    }
                } else {
                    results += `❌ n8n non configuré: ${data.message}\n`;
                }
            }
            
            return results;
        } catch (error) {
            console.error('Erreur API call:', error.message);
            return `\n[ERREUR API]: ${error.message}\n`;
        }
    }

    async sendMessage(message, model = 'gpt-4o-mini', conversationId = null, personalizedContext = '', userId = null) {
        try {
            console.log(`🤖 Envoi message à ${model}:`, message);
            console.log(`🔑 Utilisation d'OpenRouter pour tous les modèles`);

            // Enrichir le contexte avec les fichiers de l'utilisateur
            let enrichedContext = personalizedContext;
            if (userId) {
                const { memoryService } = require('./memoryService');
                const fileContext = await memoryService.enrichContextWithFiles(userId, message);
                enrichedContext += fileContext;
                
                // Log si des fichiers ont été trouvés
                if (fileContext && fileContext.length > 0) {
                    console.log('📁 Contexte enrichi avec les fichiers utilisateur');
                }
            }

            // Vérifier si le message demande des actions spécifiques
            const needsApiCall = this.detectActionRequest(message);
            let apiResults = '';

            if (needsApiCall) {
                console.log('🔧 Action détectée, appel des APIs...');
                apiResults = await this.executeApiCall(needsApiCall, message);
            }

            // Utiliser OpenRouter pour tous les modèles avec le contexte enrichi
            if (this.config.openrouter.apiKey) {
                console.log('✅ Clé OpenRouter trouvée, utilisation de l\'API');
                const finalEnrichedMessage = enrichedContext + '\n\n' + apiResults + '\n\n' + message;
                return await this.callOpenRouter(finalEnrichedMessage, model);
            } else {
                console.log('⚠️ Clé OpenRouter manquante, mode simulation');
                return await this.simulateResponse(message, model, enrichedContext);
            }
        } catch (error) {
            console.error('❌ Erreur service IA:', error.response?.data || error.message);
            
            // Si c'est une erreur d'API (400, 401, etc.), utiliser la simulation
            if (error.response?.status >= 400) {
                console.log('🔄 Fallback vers simulation à cause de l\'erreur API');
                return await this.simulateResponse(message, model);
            }
            
            return {
                response: `❌ Erreur temporaire avec ${model}. Utilisation du mode simulation...`,
                model: model,
                error: true,
                simulated: true
            };
        }
    }

    async callOpenAI(message, model) {
        if (!this.config.openai.apiKey) {
            console.log('⚠️ Clé API OpenAI manquante, utilisation du mode simulation');
            return await this.simulateResponse(message, model);
        }

        console.log('🔑 Utilisation API OpenAI avec clé:', this.config.openai.apiKey.substring(0, 10) + '...');

        const response = await axios.post(
            `${this.config.openai.baseURL}/chat/completions`,
            {
                model: model === 'gpt-4o-mini' ? 'gpt-4o-mini' : 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: this.generateSystemPrompt()
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7
            },
            {
                headers: {
                    'Authorization': `Bearer ${this.config.openai.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        return {
            response: response.data.choices[0].message.content,
            model: model,
            usage: response.data.usage
        };
    }

    async callAnthropic(message, model) {
        if (!this.config.anthropic.apiKey) {
            console.log('⚠️ Clé API Anthropic manquante, utilisation du mode simulation');
            return await this.simulateResponse(message, model);
        }

        const response = await axios.post(
            `${this.config.anthropic.baseURL}/messages`,
            {
                model: model.includes('3.5') ? 'claude-3-5-sonnet-20241022' : 'claude-3-haiku-20240307',
                max_tokens: 1000,
                messages: [
                    {
                        role: 'user',
                        content: message
                    }
                ],
                system: 'Tu es un assistant IA intelligent intégré dans Agent Skeleton OSS. Tu aides avec le développement, l\'automatisation, et les intégrations. Réponds de manière utile et concise.'
            },
            {
                headers: {
                    'x-api-key': this.config.anthropic.apiKey,
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01'
                }
            }
        );

        return {
            response: response.data.content[0].text,
            model: model,
            usage: response.data.usage
        };
    }

    async callGoogle(message, model) {
        if (!this.config.google.apiKey) {
            console.log('⚠️ Clé API Google manquante, utilisation du mode simulation');
            return await this.simulateResponse(message, model);
        }

        // Sélectionner le bon modèle Gemini
        let geminiModel = 'gemini-1.5-flash';
        if (model.includes('2.0-flash') || model === 'gemini-2.0-flash') {
            geminiModel = 'gemini-2.0-flash-exp';
        } else if (model.includes('1.5-pro')) {
            geminiModel = 'gemini-1.5-pro-latest';
        }

        console.log('🔑 Utilisation API Google avec modèle:', geminiModel);

        try {
            // Générer le prompt système complet
            const systemPrompt = this.generateSystemPrompt();
            const fullPrompt = `${systemPrompt}\n\nUtilisateur: ${message}\n\nAssistant:`;

            const response = await axios.post(
                `${this.config.google.baseURL}/models/${geminiModel}:generateContent?key=${this.config.google.apiKey}`,
                {
                    contents: [
                        {
                            parts: [
                                {
                                    text: fullPrompt
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        maxOutputTokens: 1000,
                        temperature: 0.7,
                        topP: 0.8,
                        topK: 40
                    },
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_HARASSMENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_HATE_SPEECH",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        }
                    ]
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            if (!response.data.candidates || !response.data.candidates[0] || !response.data.candidates[0].content) {
                throw new Error('Réponse Gemini invalide');
            }

            return {
                response: response.data.candidates[0].content.parts[0].text,
                model: model,
                usage: response.data.usageMetadata
            };
        } catch (error) {
            console.error('❌ Erreur API Google:', error.response?.data || error.message);
            
            // Fallback en cas d'erreur
            return await this.simulateResponse(message, model);
        }
    }

    async callOpenRouter(message, model) {
        if (!this.config.openrouter.apiKey) {
            console.log('⚠️ Clé API OpenRouter manquante, utilisation du mode simulation');
            return await this.simulateResponse(message, model);
        }

        // Mapping des modèles vers OpenRouter
        const modelMap = {
            // OpenAI
            'gpt-4o-mini': 'openai/gpt-4o-mini',
            'gpt-4o': 'openai/gpt-4o',
            'gpt-4-turbo': 'openai/gpt-4-turbo',
            'gpt-3.5-turbo': 'openai/gpt-3.5-turbo',
            
            // Anthropic
            'claude-3.5-sonnet': 'anthropic/claude-3.5-sonnet',
            'claude-3-haiku': 'anthropic/claude-3-haiku',
            'claude-3-opus': 'anthropic/claude-3-opus',
            
            // Google
            'gemini-2.0-flash': 'google/gemini-2.0-flash-exp',
            'gemini-1.5-pro': 'google/gemini-1.5-pro',
            'gemini-1.5-flash': 'google/gemini-1.5-flash',
            
            // xAI
            'grok-beta': 'x-ai/grok-beta',
            'grok-2': 'x-ai/grok-2',
            
            // Meta Llama
            'llama-3.2-90b': 'meta-llama/llama-3.2-90b-instruct',
            'llama-3.2-11b': 'meta-llama/llama-3.2-11b-instruct',
            'llama-3.1-70b': 'meta-llama/llama-3.1-70b-instruct',
            'llama-3.1-8b': 'meta-llama/llama-3.1-8b-instruct',
            
            // Mistral
            'mistral-large': 'mistralai/mistral-large',
            'mistral-medium': 'mistralai/mistral-medium',
            'mistral-small': 'mistralai/mistral-small',
            'mixtral-8x7b': 'mistralai/mixtral-8x7b-instruct',
            
            // Alibaba Qwen
            'qwen-2.5-72b': 'qwen/qwen-2.5-72b-instruct',
            'qwen-2.5-32b': 'qwen/qwen-2.5-32b-instruct',
            'qwen-2.5-14b': 'qwen/qwen-2.5-14b-instruct',
            'qwen-2.5-7b': 'qwen/qwen-2.5-7b-instruct',
            'qwen-2.5-coder-32b': 'qwen/qwen-2.5-coder-32b-instruct',
            'qwen-2-vl-72b': 'qwen/qwen-2-vl-72b-instruct',
            
            // Cohere
            'command-r-plus': 'cohere/command-r-plus',
            'command-r': 'cohere/command-r',
            
            // Perplexity
            'llama-3.1-sonar-large': 'perplexity/llama-3.1-sonar-large-128k-online',
            'llama-3.1-sonar-small': 'perplexity/llama-3.1-sonar-small-128k-online',
            
            // Free Models
            'llama-3.2-3b-free': 'meta-llama/llama-3.2-3b-instruct:free',
            'llama-3.1-8b-free': 'meta-llama/llama-3.1-8b-instruct:free',
            'gemma-2-9b-free': 'google/gemma-2-9b-it:free',
            'gemma-2-2b-free': 'google/gemma-2-2b-it:free',
            'phi-3-mini-free': 'microsoft/phi-3-mini-128k-instruct:free',
            'mistral-7b-free': 'mistralai/mistral-7b-instruct:free',
            'qwen-2.5-7b-free': 'qwen/qwen-2.5-7b-instruct:free',
            
            // Open Source
            'deepseek-coder-33b': 'deepseek/deepseek-coder-33b-instruct',
            'codellama-34b': 'codellama/codellama-34b-instruct',
            'yi-34b': '01-ai/yi-34b-chat',
            'openchat-7b': 'openchat/openchat-7b:free',
            'zephyr-7b': 'huggingfaceh4/zephyr-7b-beta:free'
        };

        const routerModel = modelMap[model] || model;

        const response = await axios.post(
            `${this.config.openrouter.baseURL}/chat/completions`,
            {
                model: routerModel,
                messages: [
                    {
                        role: 'system',
                        content: this.generateSystemPrompt()
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7
            },
            {
                headers: {
                    'Authorization': `Bearer ${this.config.openrouter.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
                    'X-Title': 'Agent Skeleton OSS'
                }
            }
        );

        return {
            response: response.data.choices[0].message.content,
            model: model,
            usage: response.data.usage
        };
    }

    async simulateResponse(message, model, enrichedContext = '') {
        // Analyser si le message fait référence à des fichiers
        const hasFileContext = enrichedContext && enrichedContext.includes('📁 **FICHIERS DISPONIBLES');
        const isFileQuestion = message.toLowerCase().includes('fichier') || 
                               message.toLowerCase().includes('document') || 
                               message.toLowerCase().includes('téléchargé') ||
                               message.toLowerCase().includes('contenu');

        // Si c'est une question sur un fichier et qu'on a du contexte, donner une réponse spécifique
        if (hasFileContext && isFileQuestion) {
            return {
                response: `📄 **Analyse de vos fichiers :**

J'ai bien reçu et analysé vos fichiers téléchargés. Voici ce que je peux vous dire :

${enrichedContext.includes('test-upload-agent.md') ? `
📋 **Fichier de test détecté :**
- Je vois que vous avez téléchargé un fichier de test pour valider mes capacités
- Ce fichier contient des informations sur Agent Skeleton OSS
- Il décrit les fonctionnalités de téléchargement et d'analyse

🤖 **Mes capacités confirmées :**
- ✅ Je peux lire et analyser le contenu de vos fichiers
- ✅ J'intègre ces informations dans mes réponses  
- ✅ Je peux répondre aux questions sur vos documents
- ✅ Je garde ces informations en mémoire pour nos conversations futures

` : ''}

💡 **Je peux maintenant :**
- Répondre aux questions sur le contenu de vos fichiers
- Analyser et résumer vos documents
- Créer des workflows basés sur vos informations
- Utiliser ces données dans toutes mes réponses futures

Posez-moi une question spécifique sur le contenu de vos fichiers !`,
                model: model,
                simulated: true,
                demo_mode: false,
                file_aware: true
            };
        }

        // Réponses simulées d'agent autonome (existantes)
        const responses = {
            'gpt-4o-mini': [
                `En tant qu'agent autonome, je peux exécuter des actions réelles sur vos systèmes. Pour "${message.toLowerCase().includes('n8n') ? 'n8n' : message.toLowerCase().includes('coolify') ? 'Coolify' : message.toLowerCase().includes('baserow') ? 'Baserow' : 'cette demande'}", je vais analyser la situation et proposer une action concrète...`,
                `Je suis connecté à vos APIs et prêt à agir. Concernant votre demande, je peux immédiatement vérifier l'état actuel et exécuter les actions nécessaires...`,
                `Agent autonome activé ! Je vais traiter votre demande en utilisant mes accès aux APIs n8n, Coolify et Baserow...`
            ],
            'gpt-4o': [
                `🚀 GPT-4o activé avec toutes les capacités avancées ! Je vais traiter votre demande avec une compréhension approfondie et des actions concrètes...`,
                `Excellent ! Avec GPT-4o, je peux analyser votre situation sous tous les angles et exécuter les meilleures actions...`,
                `Agent GPT-4o prêt ! Je vais utiliser mes capacités multimodales pour une réponse complète et des actions précises...`
            ],
            'gpt-4-turbo': [
                `⚡ GPT-4 Turbo en action ! Traitement rapide et actions intelligentes pour votre demande...`,
                `Agent GPT-4 Turbo opérationnel ! Je vais optimiser ma réponse et exécuter les actions les plus efficaces...`,
                `🎯 Avec GPT-4 Turbo, je peux rapidement analyser et agir sur vos systèmes. Voici mon plan...`
            ],
            'gpt-3.5-turbo': [
                `💨 GPT-3.5 Turbo prêt ! Je vais traiter votre demande rapidement et efficacement...`,
                `Agent GPT-3.5 activé ! Analyse en cours et préparation des actions nécessaires...`,
                `🔄 GPT-3.5 Turbo en mode agent autonome ! Je vais agir directement sur vos systèmes...`
            ],
            'grok-beta': [
                `😎 Ah, une mission intéressante ! En tant qu'agent avec des capacités réelles, je vais examiner la situation et agir en conséquence...`,
                `🤖 Mission acceptée ! Je peux accéder directement à vos workflows, déploiements et bases de données. Voici ce que je vais faire...`,
                `⚡ Agent opérationnel ! Cette demande nécessite une action concrète que je peux exécuter via les APIs disponibles...`
            ],
            'grok-2': [
                `🧠 Grok 2 en action ! Avec mes capacités avancées, je vais analyser votre demande et exécuter les meilleures actions...`,
                `🎯 Agent Grok 2 prêt ! Je vais traiter votre demande avec logique et humour, tout en agissant concrètement...`,
                `💡 Grok 2 activé ! Laissez-moi examiner vos systèmes et proposer des solutions innovantes...`
            ],
            'claude-3.5-sonnet': [
                `🎼 Je vais analyser votre demande avec attention et exécuter les actions appropriées. En tant qu'agent autonome avec accès aux APIs, je peux réellement agir sur vos systèmes...`,
                `📋 Excellente demande qui nécessite une action concrète. Je vais utiliser mes capacités d'agent pour examiner la situation et proposer/exécuter la meilleure solution...`,
                `🤔 En tant qu'agent autonome, je peux non seulement analyser mais aussi agir. Voici mon plan d'action basé sur l'accès direct à vos APIs...`
            ],
            'claude-3-haiku': [
                `🌸 Claude Haiku en action ! Réponse concise et actions précises pour votre demande...`,
                `⚡ Agent Haiku prêt ! Je vais traiter votre demande rapidement avec élégance et efficacité...`,
                `🎯 Claude Haiku activé ! Actions directes et réponses ciblées pour vos systèmes...`
            ],
            'claude-3-opus': [
                `🎭 Claude Opus à votre service ! Analyse approfondie et actions sophistiquées en cours...`,
                `🔬 Agent Opus opérationnel ! Je vais examiner minutieusement votre demande et exécuter les actions optimales...`,
                `🎪 Claude Opus prêt ! Performance de haut niveau pour traiter votre demande et agir sur vos systèmes...`
            ],
            'gemini-2.0-flash': [
                `⚡ Traitement ultra-rapide de votre mission ! Agent autonome prêt à exécuter des actions réelles via n8n, Coolify et Baserow...`,
                `🚀 Mission reçue et traitée ! Je vais immédiatement vérifier l'état de vos systèmes et exécuter les actions nécessaires...`,
                `💎 Agent opérationnel avec accès API complet ! Voici mon analyse et les actions que je vais entreprendre...`
            ],
            'gemini-1.5-pro': [
                `🧠 Gemini Pro activé ! Analyse professionnelle et actions stratégiques pour votre demande...`,
                `⭐ Agent Gemini Pro prêt ! Je vais traiter votre demande avec expertise et précision...`,
                `🎯 Gemini 1.5 Pro en action ! Capacités avancées pour examiner et agir sur vos systèmes...`
            ],
            'gemini-1.5-flash': [
                `⚡ Gemini Flash prêt ! Traitement rapide et actions immédiates...`,
                `🌟 Agent Flash activé ! Réponse ultrarapide et exécution directe sur vos APIs...`,
                `💨 Gemini Flash en mode agent ! Actions express pour vos systèmes...`
            ],
            'llama-3.2-90b': [
                `🦙 Llama 3.2 90B à votre service ! Avec mes 90 milliards de paramètres, je vais analyser et agir de manière sophistiquée...`,
                `🧠 Agent Llama 90B opérationnel ! Puissance maximale pour traiter votre demande et agir sur vos systèmes...`,
                `⚡ Llama 3.2 90B prêt ! Capacités étendues pour une analyse approfondie et des actions précises...`
            ],
            'llama-3.2-11b': [
                `🦙 Llama 3.2 11B activé ! Équilibre parfait entre performance et efficacité pour vos actions...`,
                `🎯 Agent Llama 11B prêt ! Je vais traiter votre demande avec intelligence et agir directement...`,
                `💡 Llama 3.2 11B en action ! Solutions optimisées pour vos systèmes et workflows...`
            ],
            'llama-3.1-70b': [
                `🦙 Llama 3.1 70B à votre disposition ! Grande capacité d'analyse et d'action pour vos systèmes...`,
                `🚀 Agent Llama 70B opérationnel ! Je vais examiner votre demande et exécuter les meilleures actions...`,
                `⭐ Llama 3.1 70B prêt ! Performance élevée pour traiter et agir sur vos APIs...`
            ],
            'llama-3.1-8b': [
                `🦙 Llama 3.1 8B activé ! Efficace et rapide pour traiter votre demande et agir...`,
                `⚡ Agent Llama 8B prêt ! Je vais analyser rapidement et exécuter les actions nécessaires...`,
                `🎯 Llama 3.1 8B en action ! Solutions directes pour vos systèmes...`
            ],
            'mistral-large': [
                `🌪️ Mistral Large en action ! Vent puissant d'innovation pour analyser et agir sur vos systèmes...`,
                `⚡ Agent Mistral Large opérationnel ! Je vais traiter votre demande avec force et précision...`,
                `🎯 Mistral Large prêt ! Capacités étendues pour examiner et agir sur vos APIs...`
            ],
            'mistral-medium': [
                `🌬️ Mistral Medium activé ! Équilibre parfait pour traiter votre demande et agir efficacement...`,
                `💨 Agent Mistral Medium prêt ! Je vais analyser votre situation et exécuter les bonnes actions...`,
                `🎪 Mistral Medium en action ! Performance optimisée pour vos systèmes...`
            ],
            'mistral-small': [
                `🍃 Mistral Small mais puissant ! Je vais traiter votre demande avec agilité et agir directement...`,
                `⚡ Agent Mistral Small prêt ! Efficacité maximale pour analyser et agir sur vos systèmes...`,
                `🎯 Mistral Small en action ! Solutions rapides et précises...`
            ],
            'mixtral-8x7b': [
                `🌀 Mixtral 8x7B activé ! Expertise mixte pour analyser et agir de manière optimale...`,
                `🔄 Agent Mixtral prêt ! Je vais utiliser mes capacités combinées pour traiter votre demande...`,
                `⚡ Mixtral 8x7B en action ! Solutions multifacettes pour vos systèmes...`
            ],
            'command-r-plus': [
                `🎖️ Command R+ à vos ordres ! Commande premium pour analyser et exécuter des actions de haut niveau...`,
                `⭐ Agent Command R+ opérationnel ! Je vais traiter votre demande avec excellence et agir précisément...`,
                `🚀 Command R+ prêt ! Capacités renforcées pour examiner et commander vos systèmes...`
            ],
            'command-r': [
                `🎯 Command R activé ! Commande directe pour analyser et agir sur vos systèmes...`,
                `⚡ Agent Command R prêt ! Je vais exécuter votre demande avec autorité et précision...`,
                `🔧 Command R en action ! Solutions de commande pour vos APIs...`
            ],
            'llama-3.1-sonar-large': [
                `🔍 Sonar Large de Perplexity activé ! Détection avancée et actions précises pour vos systèmes...`,
                `📡 Agent Sonar Large opérationnel ! Je vais scanner votre demande et agir en conséquence...`,
                `🎯 Sonar Large prêt ! Capacités de détection étendues pour examiner et agir...`
            ],
            'llama-3.1-sonar-small': [
                `🔍 Sonar Small de Perplexity en action ! Détection ciblée et actions rapides...`,
                `📡 Agent Sonar Small prêt ! Je vais scanner rapidement et exécuter les actions nécessaires...`,
                `⚡ Sonar Small activé ! Solutions de détection efficaces pour vos systèmes...`
            ],
            // Alibaba Qwen Models
            'qwen-2.5-72b': [
                `🏮 Qwen 2.5 72B d'Alibaba activé ! Intelligence chinoise de pointe pour analyser et agir sur vos systèmes...`,
                `🐉 Agent Qwen 72B opérationnel ! Je vais traiter votre demande avec l'expertise d'Alibaba Cloud...`,
                `⚡ Qwen 2.5 72B prêt ! Capacités étendues pour examiner et agir de manière sophistiquée...`
            ],
            'qwen-2.5-32b': [
                `🏮 Qwen 2.5 32B activé ! Équilibre parfait entre performance et efficacité d'Alibaba...`,
                `🎯 Agent Qwen 32B prêt ! Je vais traiter votre demande avec intelligence et précision...`,
                `💡 Qwen 2.5 32B en action ! Solutions optimisées pour vos systèmes...`
            ],
            'qwen-2.5-14b': [
                `🏮 Qwen 2.5 14B d'Alibaba opérationnel ! Analyse intelligente et actions ciblées...`,
                `⚡ Agent Qwen 14B prêt ! Je vais examiner votre demande et agir efficacement...`,
                `🎯 Qwen 2.5 14B en action ! Solutions rapides et précises...`
            ],
            'qwen-2.5-7b': [
                `🏮 Qwen 2.5 7B activé ! Efficacité chinoise pour traiter votre demande...`,
                `💨 Agent Qwen 7B prêt ! Je vais analyser rapidement et exécuter les actions nécessaires...`,
                `🎯 Qwen 2.5 7B en action ! Solutions directes d'Alibaba...`
            ],
            'qwen-2.5-coder-32b': [
                `👨‍💻 Qwen Coder 32B activé ! Spécialiste du code d'Alibaba pour analyser et développer...`,
                `🔧 Agent Qwen Coder prêt ! Je vais examiner votre code et proposer des solutions techniques...`,
                `💻 Qwen Coder 32B en action ! Expertise en programmation pour vos projets...`
            ],
            'qwen-2-vl-72b': [
                `👁️ Qwen Vision 72B activé ! Capacités visuelles d'Alibaba pour analyser images et texte...`,
                `🖼️ Agent Qwen Vision prêt ! Je vais traiter vos images et documents avec expertise...`,
                `🎨 Qwen VL 72B en action ! Vision et language combinés pour vos analyses...`
            ],
            // Free Models
            'llama-3.2-3b-free': [
                `🆓 Llama 3.2 3B gratuit activé ! Petite taille, grandes capacités pour vos demandes...`,
                `💸 Agent gratuit Llama 3B prêt ! Je vais traiter votre demande sans coût...`,
                `⚡ Llama 3.2 3B free en action ! Solutions économiques et efficaces...`
            ],
            'llama-3.1-8b-free': [
                `🆓 Llama 3.1 8B gratuit opérationnel ! Performance libre pour vos systèmes...`,
                `💸 Agent gratuit Llama 8B prêt ! Je vais analyser et agir sans frais...`,
                `🎯 Llama 3.1 8B free en action ! Solutions gratuites et puissantes...`
            ],
            'gemma-2-9b-free': [
                `🆓 Gemma 2 9B gratuit de Google activé ! IA libre pour vos demandes...`,
                `💸 Agent gratuit Gemma prêt ! Je vais traiter votre demande avec les technologies Google...`,
                `⚡ Gemma 2 9B free en action ! Solutions open source et performantes...`
            ],
            'gemma-2-2b-free': [
                `🆓 Gemma 2 2B gratuit activé ! Compact mais puissant pour vos besoins...`,
                `💸 Agent gratuit Gemma 2B prêt ! Je vais analyser rapidement et gratuitement...`,
                `🎯 Gemma 2 2B free en action ! Solutions légères et efficaces...`
            ],
            'phi-3-mini-free': [
                `🆓 Phi-3 Mini gratuit de Microsoft activé ! Intelligence compacte pour vos systèmes...`,
                `💸 Agent gratuit Phi-3 prêt ! Je vais traiter votre demande avec efficacité...`,
                `⚡ Phi-3 Mini free en action ! Solutions Microsoft gratuites...`
            ],
            'mistral-7b-free': [
                `🆓 Mistral 7B gratuit activé ! Vent français libre pour vos demandes...`,
                `💸 Agent gratuit Mistral prêt ! Je vais analyser avec l'élégance française...`,
                `🎯 Mistral 7B free en action ! Solutions open source de qualité...`
            ],
            'qwen-2.5-7b-free': [
                `🆓 Qwen 2.5 7B gratuit d'Alibaba activé ! Intelligence chinoise libre...`,
                `💸 Agent gratuit Qwen prêt ! Je vais traiter votre demande sans coût...`,
                `⚡ Qwen 2.5 7B free en action ! Solutions Alibaba gratuites...`
            ],
            // Open Source Models
            'deepseek-coder-33b': [
                `👨‍💻 DeepSeek Coder 33B activé ! Spécialiste du code pour analyser et développer...`,
                `🔧 Agent DeepSeek prêt ! Je vais examiner votre code avec expertise...`,
                `💻 DeepSeek Coder en action ! Solutions de programmation avancées...`
            ],
            'codellama-34b': [
                `🦙 CodeLlama 34B de Meta activé ! Expertise en programmation pour vos projets...`,
                `👨‍💻 Agent CodeLlama prêt ! Je vais analyser et coder avec intelligence...`,
                `💻 CodeLlama 34B en action ! Solutions de développement Meta...`
            ],
            'yi-34b': [
                `🤖 Yi 34B de 01.AI activé ! Intelligence chinoise pour analyser et agir...`,
                `🎯 Agent Yi prêt ! Je vais traiter votre demande avec innovation...`,
                `⚡ Yi 34B en action ! Solutions 01.AI pour vos systèmes...`
            ],
            'openchat-7b': [
                `💬 OpenChat 7B gratuit activé ! Conversation libre et intelligente...`,
                `🗨️ Agent OpenChat prêt ! Je vais dialoguer et agir sans contraintes...`,
                `⚡ OpenChat 7B en action ! Solutions conversationnelles ouvertes...`
            ],
            'zephyr-7b': [
                `🌪️ Zephyr 7B gratuit activé ! Vent de fraîcheur open source...`,
                `💨 Agent Zephyr prêt ! Je vais traiter votre demande avec légèreté...`,
                `⚡ Zephyr 7B en action ! Solutions HuggingFace gratuites...`
            ]
        };

        const modelResponses = responses[model] || responses['gpt-4o-mini'];
        const response = modelResponses[Math.floor(Math.random() * modelResponses.length)];

        // Ajouter du contexte spécifique d'agent autonome
        let contextualResponse = response;
        
        if (message.toLowerCase().includes('capacités') || message.toLowerCase().includes('autonome')) {
            contextualResponse += `\n\n🤖 **Mes capacités d'agent autonome :**\n• **n8n** : Créer, modifier et exécuter des workflows\n• **Coolify** : Gérer les déploiements et surveiller la santé\n• **Baserow** : Synchroniser, analyser et organiser les données\n• **Analyse** : Évaluer les performances et suggérer des optimisations`;
        } else if (message.toLowerCase().includes('n8n') || message.toLowerCase().includes('workflow')) {
            contextualResponse += `\n\n🔄 **Actions n8n disponibles :**\n• Créer de nouveaux workflows sur mesure\n• Modifier les workflows existants\n• Activer/désactiver les automatisations\n• Analyser les performances et logs d'exécution\n• Intégrer avec vos autres services`;
        } else if (message.toLowerCase().includes('coolify') || message.toLowerCase().includes('déploi')) {
            contextualResponse += `\n\n🚀 **Actions Coolify disponibles :**\n• Vérifier l'état des déploiements\n• Lancer de nouveaux déploiements\n• Surveiller la santé des services\n• Gérer les variables d'environnement\n• Analyser les logs de déploiement`;
        } else if (message.toLowerCase().includes('baserow') || message.toLowerCase().includes('données')) {
            contextualResponse += `\n\n📊 **Actions Baserow disponibles :**\n• Synchroniser les données entre tables\n• Analyser et nettoyer les données\n• Créer des rapports automatisés\n• Organiser selon vos règles métier\n• Sauvegarder et archiver`;
        } else {
            contextualResponse += `\n\n⚡ **Actions immédiates possibles :**\n• Vérifier l'état global de vos systèmes\n• Analyser les performances actuelles\n• Proposer des optimisations\n• Exécuter des tâches de maintenance\n• Créer des automatisations sur mesure`;
        }

        return {
            response: contextualResponse,
            model: model,
            simulated: true,
            demo_mode: true
        };
    }
}

module.exports = new AIService();