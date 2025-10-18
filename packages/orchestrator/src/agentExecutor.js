// Agent Executor - Système d'exécution autonome des tâches
const axios = require('axios');

/**
 * Agent autonome qui exécute réellement les tâches demandées
 */
class AgentExecutor {
    constructor(config = {}) {
        this.config = {
            n8nUrl: config.n8nUrl || process.env.N8N_API_URL,
            n8nApiKey: config.n8nApiKey || process.env.N8N_API_KEY,
            coolifyUrl: config.coolifyUrl || process.env.COOLIFY_API_URL,
            coolifyApiKey: config.coolifyApiKey || process.env.COOLIFY_API_KEY,
            openrouterApiKey: config.openrouterApiKey || process.env.OPENROUTER_API_KEY
        };
        
        this.capabilities = [
            'analyser_fichiers',
            'executer_n8n_workflow',
            'deployer_service',
            'recherche_web',
            'gestion_donnees',
            'generation_contenu',
            'analyse_logs',
            'automatisation'
        ];
    }

    /**
     * Point d'entrée principal : analyser la demande et exécuter la tâche
     */
    async execute(userRequest, context = {}) {
        console.log(`🤖 [AgentExecutor] Nouvelle mission : "${userRequest}"`);
        
        // Analyser la demande utilisateur
        const intent = this.analyzeIntent(userRequest);
        console.log(`🎯 [AgentExecutor] Intent détecté : ${intent.type}`);
        
        // Exécuter l'action appropriée
        let result;
        try {
            switch(intent.type) {
                case 'check_n8n':
                    result = await this.checkN8NAccount();
                    break;
                
                case 'execute_workflow':
                    result = await this.executeWorkflow(intent.params);
                    break;
                
                case 'analyze_files':
                    result = await this.analyzeFiles(context.files || []);
                    break;
                
                case 'deploy_service':
                    result = await this.deployService(intent.params);
                    break;
                
                case 'search_web':
                    result = await this.searchWeb(intent.query);
                    break;
                
                case 'generate_content':
                    result = await this.generateContent(intent.params);
                    break;
                
                default:
                    result = await this.handleGenericTask(userRequest, context);
            }
            
            return {
                success: true,
                intent: intent.type,
                result: result,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error(`❌ [AgentExecutor] Erreur :`, error.message);
            return {
                success: false,
                intent: intent.type,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Analyser l'intention de l'utilisateur
     */
    analyzeIntent(userRequest) {
        const requestLower = userRequest.toLowerCase();
        
        // Détection d'intent pour N8N
        if (requestLower.includes('n8n') && (requestLower.includes('compte') || requestLower.includes('vérif') || requestLower.includes('coup d\'œil'))) {
            return { type: 'check_n8n', params: {} };
        }
        
        // Détection d'intent pour workflows
        if (requestLower.includes('workflow') || requestLower.includes('automation') || requestLower.includes('execut')) {
            const workflowId = this.extractWorkflowId(userRequest);
            return { type: 'execute_workflow', params: { workflowId } };
        }
        
        // Détection d'intent pour fichiers
        if (requestLower.includes('analys') && (requestLower.includes('fichier') || requestLower.includes('document'))) {
            return { type: 'analyze_files', params: {} };
        }
        
        // Détection d'intent pour déploiement
        if (requestLower.includes('deploy') || requestLower.includes('déploi')) {
            return { type: 'deploy_service', params: {} };
        }
        
        // Détection d'intent pour recherche
        if (requestLower.includes('recherch') || requestLower.includes('trouve') || requestLower.includes('cherche')) {
            return { type: 'search_web', query: userRequest };
        }
        
        // Détection d'intent pour génération
        if (requestLower.includes('génér') || requestLower.includes('créer') || requestLower.includes('écri')) {
            return { type: 'generate_content', params: { prompt: userRequest } };
        }
        
        // Par défaut
        return { type: 'generic', params: { query: userRequest } };
    }

    /**
     * Vérifier le compte N8N
     */
    async checkN8NAccount() {
        console.log('🔍 [AgentExecutor] Vérification du compte N8N...');
        
        if (!this.config.n8nUrl || !this.config.n8nApiKey) {
            return {
                status: 'error',
                message: 'Configuration N8N incomplète',
                details: {
                    url: this.config.n8nUrl ? '✅ Configurée' : '❌ Manquante',
                    apiKey: this.config.n8nApiKey ? '✅ Configurée' : '❌ Manquante'
                }
            };
        }
        
        try {
            const response = await axios.get(`${this.config.n8nUrl}/api/v1/workflows`, {
                headers: {
                    'X-N8N-API-KEY': this.config.n8nApiKey
                },
                timeout: 10000
            });
            
            return {
                status: 'success',
                message: 'Compte N8N connecté avec succès',
                details: {
                    url: this.config.n8nUrl,
                    workflowsCount: response.data.data?.length || 0,
                    workflows: response.data.data?.map(w => ({
                        id: w.id,
                        name: w.name,
                        active: w.active
                    })) || []
                }
            };
        } catch (error) {
            return {
                status: 'error',
                message: `Erreur connexion N8N : ${error.message}`,
                details: {
                    url: this.config.n8nUrl,
                    errorCode: error.code,
                    suggestion: 'Vérifiez que N8N est accessible et que la clé API est valide'
                }
            };
        }
    }

    /**
     * Exécuter un workflow N8N
     */
    async executeWorkflow(params) {
        console.log('⚙️ [AgentExecutor] Exécution workflow N8N...');
        
        if (!params.workflowId) {
            return { status: 'error', message: 'ID de workflow non spécifié' };
        }
        
        try {
            const response = await axios.post(
                `${this.config.n8nUrl}/api/v1/workflows/${params.workflowId}/execute`,
                params.data || {},
                {
                    headers: {
                        'X-N8N-API-KEY': this.config.n8nApiKey
                    }
                }
            );
            
            return {
                status: 'success',
                message: `Workflow ${params.workflowId} exécuté avec succès`,
                result: response.data
            };
        } catch (error) {
            return {
                status: 'error',
                message: `Erreur exécution workflow : ${error.message}`
            };
        }
    }

    /**
     * Analyser des fichiers
     */
    async analyzeFiles(files) {
        console.log(`📄 [AgentExecutor] Analyse de ${files.length} fichier(s)...`);
        
        if (files.length === 0) {
            return {
                status: 'info',
                message: 'Aucun fichier à analyser',
                suggestion: 'Uploadez des fichiers pour que je puisse les analyser'
            };
        }
        
        const analyses = files.map(file => {
            const extension = file.name.split('.').pop().toLowerCase();
            const type = this.detectFileType(extension);
            
            return {
                name: file.name,
                size: file.size,
                type: type,
                preview: file.content ? file.content.substring(0, 200) : '',
                analysis: this.performBasicAnalysis(file.content, type)
            };
        });
        
        return {
            status: 'success',
            message: `${files.length} fichier(s) analysé(s)`,
            analyses: analyses,
            summary: this.generateFilesSummary(analyses)
        };
    }

    /**
     * Déployer un service
     */
    async deployService(params) {
        console.log('🚀 [AgentExecutor] Déploiement de service...');
        
        if (!this.config.coolifyUrl || !this.config.coolifyApiKey) {
            return {
                status: 'error',
                message: 'Configuration Coolify incomplète'
            };
        }
        
        try {
            const response = await axios.post(
                `${this.config.coolifyUrl}/api/v1/deploy/${params.serviceId}`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${this.config.coolifyApiKey}`
                    }
                }
            );
            
            return {
                status: 'success',
                message: 'Déploiement lancé avec succès',
                result: response.data
            };
        } catch (error) {
            return {
                status: 'error',
                message: `Erreur déploiement : ${error.message}`
            };
        }
    }

    /**
     * Recherche web (simulation - à remplacer par vraie API)
     */
    async searchWeb(query) {
        console.log(`🔍 [AgentExecutor] Recherche web : "${query}"`);
        
        return {
            status: 'success',
            message: `Recherche effectuée pour : "${query}"`,
            results: [
                {
                    title: 'Résultat simulé 1',
                    snippet: 'Ceci est une simulation de recherche web. Intégrez une vraie API de recherche pour des résultats réels.',
                    url: 'https://example.com/1'
                }
            ],
            suggestion: 'Intégrez une API de recherche (Google Custom Search, Bing, etc.) pour des résultats réels'
        };
    }

    /**
     * Générer du contenu avec IA
     */
    async generateContent(params) {
        console.log(`✍️ [AgentExecutor] Génération de contenu...`);
        
        if (!this.config.openrouterApiKey) {
            return {
                status: 'error',
                message: 'Clé API OpenRouter manquante',
                suggestion: 'Configurez OPENROUTER_API_KEY dans les variables d\'environnement'
            };
        }
        
        try {
            const response = await axios.post(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                    model: 'openai/gpt-3.5-turbo',
                    messages: [
                        { role: 'user', content: params.prompt }
                    ]
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.config.openrouterApiKey}`,
                        'HTTP-Referer': 'https://agent-skeleton-oss.com',
                        'X-Title': 'Agent Skeleton OSS'
                    }
                }
            );
            
            return {
                status: 'success',
                message: 'Contenu généré avec succès',
                content: response.data.choices[0].message.content
            };
        } catch (error) {
            return {
                status: 'error',
                message: `Erreur génération : ${error.message}`
            };
        }
    }

    /**
     * Gérer une tâche générique
     */
    async handleGenericTask(userRequest, context) {
        console.log(`🤔 [AgentExecutor] Tâche générique : "${userRequest}"`);
        
        return {
            status: 'info',
            message: 'Tâche reçue mais non spécifique',
            capabilities: this.capabilities,
            suggestion: 'Essayez des commandes comme : "vérifie mon compte N8N", "analyse mes fichiers", "exécute le workflow X"'
        };
    }

    // Fonctions utilitaires
    
    detectFileType(extension) {
        const types = {
            'txt': 'text',
            'md': 'markdown',
            'json': 'json',
            'csv': 'csv',
            'pdf': 'pdf',
            'doc': 'document',
            'docx': 'document',
            'jpg': 'image',
            'png': 'image',
            'gif': 'image'
        };
        return types[extension] || 'unknown';
    }

    performBasicAnalysis(content, type) {
        if (!content) return 'Pas de contenu à analyser';
        
        const stats = {
            characters: content.length,
            words: content.split(/\s+/).length,
            lines: content.split('\n').length
        };
        
        if (type === 'json') {
            try {
                const parsed = JSON.parse(content);
                stats.valid = true;
                stats.keys = Object.keys(parsed).length;
            } catch {
                stats.valid = false;
            }
        }
        
        return stats;
    }

    generateFilesSummary(analyses) {
        return {
            total: analyses.length,
            types: [...new Set(analyses.map(a => a.type))],
            totalSize: analyses.reduce((sum, a) => sum + a.size, 0)
        };
    }

    extractWorkflowId(text) {
        const match = text.match(/workflow[:\s]+(\d+|[a-zA-Z0-9-]+)/i);
        return match ? match[1] : null;
    }
}

module.exports = AgentExecutor;
