/**
 * N8NAgent - Sous-agent spécialisé dans la gestion des workflows N8N
 */

const axios = require('axios');

class N8NAgent {
    constructor(config = {}) {
        this.config = {
            url: config.n8nUrl || process.env.N8N_API_URL || 'https://n8n.kaussan-air.org',
            apiKey: config.n8nApiKey || process.env.N8N_API_KEY
        };
        
        console.log('🔄 [N8NAgent] Initialisé avec URL:', this.config.url);
    }

    /**
     * Vérifier la configuration et le compte N8N
     */
    async checkAccount() {
        console.log('🔍 [N8NAgent] Vérification du compte...');
        
        if (!this.config.apiKey) {
            throw new Error('N8N_API_KEY non configurée. Ajoutez-la dans les variables d\'environnement Coolify.');
        }
        
        try {
            const response = await axios.get(`${this.config.url}/api/v1/workflows`, {
                headers: {
                    'X-N8N-API-KEY': this.config.apiKey,
                    'Accept': 'application/json'
                },
                timeout: 15000
            });
            
            const workflows = response.data.data || [];
            
            console.log(`✅ [N8NAgent] ${workflows.length} workflows trouvés`);
            
            return {
                status: 'connected',
                url: this.config.url,
                workflowsCount: workflows.length,
                workflows: workflows.map(w => ({
                    id: w.id,
                    name: w.name,
                    active: w.active,
                    createdAt: w.createdAt,
                    updatedAt: w.updatedAt
                }))
            };
            
        } catch (error) {
            console.error('❌ [N8NAgent] Erreur connexion:', error.message);
            
            if (error.response?.status === 401) {
                throw new Error('Clé API N8N invalide. Vérifiez N8N_API_KEY dans Coolify.');
            }
            if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                throw new Error(`Impossible de se connecter à N8N (${this.config.url}). Vérifiez que N8N est accessible.`);
            }
            throw new Error(`Erreur N8N: ${error.message}`);
        }
    }

    /**
     * Lister tous les workflows
     */
    async listWorkflows() {
        console.log('📋 [N8NAgent] Liste des workflows...');
        
        const accountInfo = await this.checkAccount();
        return accountInfo;
    }

    /**
     * Exécuter un workflow
     */
    async executeWorkflow(workflowId, data = {}) {
        console.log(`▶️ [N8NAgent] Exécution workflow: ${workflowId}`);
        
        if (!workflowId) {
            throw new Error('ID de workflow requis. Exemple: "Exécute le workflow yKMSHULhJtpfTzDY"');
        }
        
        if (!this.config.apiKey) {
            throw new Error('N8N_API_KEY non configurée');
        }
        
        try {
            const response = await axios.post(
                `${this.config.url}/api/v1/workflows/${workflowId}/execute`,
                data,
                {
                    headers: {
                        'X-N8N-API-KEY': this.config.apiKey,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );
            
            console.log(`✅ [N8NAgent] Workflow exécuté avec succès`);
            
            return {
                status: 'executed',
                workflowId,
                executionId: response.data.executionId,
                data: response.data,
                message: 'Workflow exécuté avec succès'
            };
            
        } catch (error) {
            console.error('❌ [N8NAgent] Erreur exécution:', error.message);
            
            if (error.response?.status === 404) {
                throw new Error(`Workflow ${workflowId} introuvable. Utilisez "Liste mes workflows" pour voir les IDs disponibles.`);
            }
            throw new Error(`Erreur exécution workflow: ${error.message}`);
        }
    }

    /**
     * Supprimer un workflow
     */
    async deleteWorkflow(workflowId) {
        console.log(`🗑️ [N8NAgent] Suppression workflow: ${workflowId}`);
        
        if (!workflowId) {
            throw new Error('ID de workflow requis pour la suppression');
        }
        
        if (!this.config.apiKey) {
            throw new Error('N8N_API_KEY non configurée');
        }
        
        try {
            // D'abord vérifier que le workflow existe
            const listResponse = await axios.get(`${this.config.url}/api/v1/workflows/${workflowId}`, {
                headers: {
                    'X-N8N-API-KEY': this.config.apiKey
                },
                timeout: 10000
            });
            
            const workflowName = listResponse.data.name;
            
            // Supprimer le workflow
            await axios.delete(`${this.config.url}/api/v1/workflows/${workflowId}`, {
                headers: {
                    'X-N8N-API-KEY': this.config.apiKey
                },
                timeout: 10000
            });
            
            console.log(`✅ [N8NAgent] Workflow "${workflowName}" supprimé`);
            
            return {
                status: 'deleted',
                workflowId,
                workflowName,
                message: `Workflow "${workflowName}" supprimé avec succès`
            };
            
        } catch (error) {
            console.error('❌ [N8NAgent] Erreur suppression:', error.message);
            
            if (error.response?.status === 404) {
                throw new Error(`Workflow ${workflowId} introuvable. Il a peut-être déjà été supprimé.`);
            }
            throw new Error(`Erreur suppression workflow: ${error.message}`);
        }
    }

    /**
     * Activer/Désactiver un workflow
     */
    async toggleWorkflow(workflowId, active) {
        console.log(`🔄 [N8NAgent] ${active ? 'Activation' : 'Désactivation'} workflow: ${workflowId}`);
        
        if (!this.config.apiKey) {
            throw new Error('N8N_API_KEY non configurée');
        }
        
        try {
            const response = await axios.patch(
                `${this.config.url}/api/v1/workflows/${workflowId}`,
                { active },
                {
                    headers: {
                        'X-N8N-API-KEY': this.config.apiKey,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log(`✅ [N8NAgent] Workflow ${active ? 'activé' : 'désactivé'}`);
            
            return {
                status: 'updated',
                workflowId,
                active,
                message: `Workflow ${active ? 'activé' : 'désactivé'} avec succès`
            };
            
        } catch (error) {
            throw new Error(`Erreur modification workflow: ${error.message}`);
        }
    }

    /**
     * Obtenir les détails d'un workflow
     */
    async getWorkflowDetails(workflowId) {
        console.log(`🔍 [N8NAgent] Récupération détails workflow: ${workflowId}`);
        
        if (!this.config.apiKey) {
            throw new Error('N8N_API_KEY non configurée');
        }
        
        try {
            const response = await axios.get(`${this.config.url}/api/v1/workflows/${workflowId}`, {
                headers: {
                    'X-N8N-API-KEY': this.config.apiKey
                }
            });
            
            return {
                status: 'success',
                workflow: response.data
            };
            
        } catch (error) {
            throw new Error(`Erreur récupération workflow: ${error.message}`);
        }
    }

    /**
     * Obtenir l'historique d'exécution
     */
    async getExecutionHistory(workflowId, limit = 10) {
        console.log(`📊 [N8NAgent] Historique exécutions workflow: ${workflowId}`);
        
        if (!this.config.apiKey) {
            throw new Error('N8N_API_KEY non configurée');
        }
        
        try {
            const response = await axios.get(
                `${this.config.url}/api/v1/executions`,
                {
                    params: {
                        workflowId,
                        limit
                    },
                    headers: {
                        'X-N8N-API-KEY': this.config.apiKey
                    }
                }
            );
            
            return {
                status: 'success',
                workflowId,
                executions: response.data.data || [],
                count: response.data.data?.length || 0
            };
            
        } catch (error) {
            throw new Error(`Erreur récupération historique: ${error.message}`);
        }
    }
}

module.exports = N8NAgent;
