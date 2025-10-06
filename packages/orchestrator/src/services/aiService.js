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
        // Réponses simulées améliorées en attendant les clés API
        const responses = {
            'gpt-4o-mini': [
                `Excellente question ! Concernant ${message.toLowerCase().includes('n8n') ? 'n8n' : message.toLowerCase().includes('coolify') ? 'Coolify' : 'votre demande'}, je recommande une approche structurée. Voici comment procéder étape par étape...`,
                `Basé sur votre demande, voici mon analyse détaillée. La meilleure pratique serait de commencer par identifier les composants clés et leurs interactions...`,
                `Je comprends votre besoin. Pour optimiser cette solution, nous pourrions envisager plusieurs approches. La plus efficace serait probablement...`
            ],
            'grok-beta': [
                `Ah, une question intéressante ! Laissez-moi vous donner ma perspective unique sur ce défi. D'après mon analyse, la stratégie optimale serait...`,
                `Traitement rapide de votre demande ! Voici une approche efficace et moderne pour résoudre ce problème de manière élégante...`,
                `Excellent ! Cette question mérite une réponse technique précise. Basé sur les meilleures pratiques actuelles, je recommande...`
            ],
            'claude-3.5-sonnet': [
                `Je vais analyser votre demande avec attention. Cette question soulève plusieurs points intéressants que nous pouvons aborder méthodiquement...`,
                `Excellente question qui mérite une réponse nuancée. Permettez-moi de décomposer les différents aspects et de proposer une solution structurée...`,
                `Après analyse de votre demande, je propose cette approche méthodique qui prend en compte les contraintes techniques et les bonnes pratiques...`
            ],
            'gemini-2.0-flash': [
                `Traitement ultra-rapide de votre question ! Voici une solution optimisée basée sur les dernières technologies et méthodologies...`,
                `Analyse multimodale complétée. Cette demande nécessite une approche holistique que je vais détailler point par point...`,
                `Réponse instantanée ! Basé sur les données les plus récentes, je recommande cette stratégie progressive et scalable...`
            ]
        };

        const modelResponses = responses[model] || responses['gpt-4o-mini'];
        const response = modelResponses[Math.floor(Math.random() * modelResponses.length)];

        // Ajouter du contexte spécifique basé sur les mots-clés
        let contextualResponse = response;
        
        if (message.toLowerCase().includes('n8n')) {
            contextualResponse += `\n\n🔗 **Pour n8n spécifiquement :**\n• Créez un webhook trigger pour déclencher le workflow\n• Ajoutez une condition de filtrage pour valider les données\n• Connectez à votre API de destination avec gestion d'erreurs\n• Testez en mode debug pour vérifier le flux de données`;
        } else if (message.toLowerCase().includes('coolify')) {
            contextualResponse += `\n\n🚀 **Pour Coolify :**\n• Vérifiez vos variables d'environnement dans l'interface\n• Assurez-vous que le Dockerfile est optimisé\n• Surveillez les logs de déploiement en temps réel\n• Configurez les health checks pour la stabilité`;
        } else if (message.toLowerCase().includes('baserow')) {
            contextualResponse += `\n\n📊 **Pour Baserow :**\n• Utilisez l'API REST pour les opérations CRUD\n• Configurez les webhooks pour les mises à jour automatiques\n• Structurez vos tables avec les bons types de champs\n• Implémentez la pagination pour les grandes datasets`;
        } else {
            // Réponse générique plus utile
            contextualResponse += `\n\n💡 **Prochaines étapes recommandées :**\n• Définir clairement les objectifs et contraintes\n• Choisir les outils appropriés pour votre stack\n• Implémenter une solution MVP pour validation\n• Itérer basé sur les retours utilisateurs`;
        }

        return {
            response: contextualResponse,
            model: model,
            simulated: true
        };
    }
}

module.exports = new AIService();