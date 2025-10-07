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

    async sendMessage(message, model = 'gpt-4o-mini', conversationId = null) {
        try {
            console.log(`🤖 Envoi message à ${model}:`, message);
            console.log(`🔑 Utilisation d'OpenRouter pour tous les modèles`);

            // Utiliser OpenRouter pour tous les modèles
            if (this.config.openrouter.apiKey) {
                console.log('✅ Clé OpenRouter trouvée, utilisation de l\'API');
                return await this.callOpenRouter(message, model);
            } else {
                console.log('⚠️ Clé OpenRouter manquante, mode simulation');
                return await this.simulateResponse(message, model);
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
            'grok-beta': 'x-ai/grok-beta',
            'grok-2': 'x-ai/grok-2',
            'claude-3.5-sonnet': 'anthropic/claude-3.5-sonnet',
            'gemini-2.0-flash': 'google/gemini-2.0-flash-exp',
            'gpt-4o-mini': 'openai/gpt-4o-mini'
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

    async simulateResponse(message, model) {
        // Réponses simulées d'agent autonome
        const responses = {
            'gpt-4o-mini': [
                `En tant qu'agent autonome, je peux exécuter des actions réelles sur vos systèmes. Pour "${message.toLowerCase().includes('n8n') ? 'n8n' : message.toLowerCase().includes('coolify') ? 'Coolify' : message.toLowerCase().includes('baserow') ? 'Baserow' : 'cette demande'}", je vais analyser la situation et proposer une action concrète...`,
                `Je suis connecté à vos APIs et prêt à agir. Concernant votre demande, je peux immédiatement vérifier l'état actuel et exécuter les actions nécessaires...`,
                `Agent autonome activé ! Je vais traiter votre demande en utilisant mes accès aux APIs n8n, Coolify et Baserow...`
            ],
            'grok-beta': [
                `Ah, une mission intéressante ! En tant qu'agent avec des capacités réelles, je vais examiner la situation et agir en conséquence. Laissez-moi vérifier l'état de vos systèmes...`,
                `Mission acceptée ! Je peux accéder directement à vos workflows, déploiements et bases de données. Voici ce que je vais faire...`,
                `Agent opérationnel ! Cette demande nécessite une action concrète que je peux exécuter via les APIs disponibles...`
            ],
            'claude-3.5-sonnet': [
                `Je vais analyser votre demande avec attention et exécuter les actions appropriées. En tant qu'agent autonome avec accès aux APIs, je peux réellement agir sur vos systèmes...`,
                `Excellente demande qui nécessite une action concrète. Je vais utiliser mes capacités d'agent pour examiner la situation et proposer/exécuter la meilleure solution...`,
                `En tant qu'agent autonome, je peux non seulement analyser mais aussi agir. Voici mon plan d'action basé sur l'accès direct à vos APIs...`
            ],
            'gemini-2.0-flash': [
                `Traitement ultra-rapide de votre mission ! Agent autonome prêt à exécuter des actions réelles via n8n, Coolify et Baserow...`,
                `Mission reçue et traitée ! Je vais immédiatement vérifier l'état de vos systèmes et exécuter les actions nécessaires...`,
                `Agent opérationnel avec accès API complet ! Voici mon analyse et les actions que je vais entreprendre...`
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