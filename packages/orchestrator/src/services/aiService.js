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

COMPORTEMENT:
- Sois précis et utile dans tes réponses
- Adapte ta réponse au niveau technique de l'utilisateur
- Suggère des améliorations quand c'est pertinent
- Reste dans le cadre de ${this.customInstructions.brand}`;
    }

    async sendMessage(message, model = 'gpt-4o-mini', conversationId = null) {
        try {
            console.log(`🤖 Envoi message à ${model}:`, message);

            // Router vers la bonne API selon le modèle
            if (model.includes('gpt') || model.includes('openai')) {
                return await this.callOpenAI(message, model);
            } else if (model.includes('claude') || model.includes('anthropic')) {
                return await this.callAnthropic(message, model);
            } else if (model.includes('gemini') || model.includes('google')) {
                return await this.callGoogle(message, model);
            } else if (model.includes('grok') || this.config.openrouter.apiKey) {
                return await this.callOpenRouter(message, model);
            } else {
                // Fallback vers simulation améliorée
                return await this.simulateResponse(message, model);
            }
        } catch (error) {
            console.error('❌ Erreur service IA:', error);
            return {
                response: `❌ Erreur de connexion avec ${model}. ${error.message}`,
                model: model,
                error: true
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

        const response = await axios.post(
            `${this.config.google.baseURL}/models/gemini-1.5-flash:generateContent?key=${this.config.google.apiKey}`,
            {
                contents: [
                    {
                        parts: [
                            {
                                text: `Tu es un assistant IA intelligent intégré dans Agent Skeleton OSS. Tu aides avec le développement, l'automatisation, et les intégrations. Voici la question de l'utilisateur: ${message}`
                            }
                        ]
                    }
                ]
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        return {
            response: response.data.candidates[0].content.parts[0].text,
            model: model,
            usage: response.data.usageMetadata
        };
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
        // Réponses simulées améliorées en attendant les clés API
        const responses = {
            'gpt-4o-mini': [
                `🚀 GPT-4o Mini : Excellente question ! Pour ${message.toLowerCase().includes('n8n') ? 'n8n' : message.toLowerCase().includes('coolify') ? 'Coolify' : 'cela'}, je recommande une approche structurée...`,
                `⚡ GPT-4o Mini : Basé sur votre demande concernant "${message.substring(0, 50)}...", voici mon analyse détaillée...`,
                `🎯 GPT-4o Mini : Je comprends votre besoin. Pour optimiser cette solution, nous pourrions...`
            ],
            'grok-beta': [
                `🤖 Grok : Ah, une question intéressante ! Laissez-moi vous donner ma perspective unique sur "${message.substring(0, 30)}..."`,
                `⚡ Grok Fast : Traitement rapide de votre demande ! Voici une approche efficace pour résoudre cela...`,
                `🔥 Grok : D'après mon analyse, la meilleure stratégie serait...`
            ],
            'claude-3.5-sonnet': [
                `🧠 Claude 3.5 Sonnet : Je vais analyser votre demande avec attention. Concernant "${message.substring(0, 40)}...", voici ma réflexion structurée...`,
                `💡 Claude 3.5 : Excellente question qui mérite une réponse nuancée. Permettez-moi de décomposer cela...`,
                `📊 Claude 3.5 Sonnet : Après analyse de votre demande, je propose cette approche méthodique...`
            ],
            'gemini-2.0-flash': [
                `💎 Gemini 2.0 Flash : Traitement ultra-rapide ! Pour votre question sur "${message.substring(0, 35)}...", voici ma réponse optimisée...`,
                `🌟 Gemini Flash : Analyse multimodale en cours... Voici une solution complète pour votre demande...`,
                `⚡ Gemini 2.0 : Réponse instantanée ! Basé sur les dernières données, je recommande...`
            ]
        };

        const modelResponses = responses[model] || responses['gpt-4o-mini'];
        const response = modelResponses[Math.floor(Math.random() * modelResponses.length)];

        // Ajouter du contexte spécifique
        let contextualResponse = response;
        if (message.toLowerCase().includes('n8n')) {
            contextualResponse += `\n\n🔗 Pour n8n spécifiquement : créez un webhook trigger, ajoutez une condition de filtrage, puis connectez à votre API de destination. N'oubliez pas de tester en mode debug !`;
        } else if (message.toLowerCase().includes('coolify')) {
            contextualResponse += `\n\n🚀 Pour Coolify : vérifiez vos variables d'environnement, assurez-vous que le Dockerfile est optimisé, et surveillez les logs de déploiement.`;
        } else if (message.toLowerCase().includes('baserow')) {
            contextualResponse += `\n\n📊 Pour Baserow : utilisez l'API REST, configurez les webhooks pour les mises à jour en temps réel, et pensez à la structure de vos tables.`;
        }

        return {
            response: contextualResponse,
            model: model,
            simulated: true
        };
    }
}

module.exports = new AIService();