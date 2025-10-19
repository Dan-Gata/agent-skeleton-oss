/**
 * CoolifyAgent - Sous-agent spécialisé dans les déploiements Coolify
 */

const axios = require('axios');

class CoolifyAgent {
    constructor(config = {}) {
        this.config = {
            url: config.coolifyUrl || process.env.COOLIFY_API_URL || 'https://kaussan-air.org',
            apiKey: config.coolifyApiKey || process.env.COOLIFY_API_KEY
        };
        
        console.log('🚀 [CoolifyAgent] Initialisé avec URL:', this.config.url);
    }

    /**
     * Déployer un service
     */
    async deployService(serviceId) {
        console.log(`🚀 [CoolifyAgent] Déploiement service: ${serviceId}`);
        
        if (!serviceId) {
            throw new Error('ID de service requis. Exemple: "Déploie le service my-app"');
        }
        
        if (!this.config.apiKey) {
            throw new Error('COOLIFY_API_KEY non configurée. Ajoutez-la dans Coolify.');
        }
        
        try {
            const response = await axios.post(
                `${this.config.url}/api/v1/deploy/${serviceId}`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${this.config.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );
            
            console.log(`✅ [CoolifyAgent] Déploiement lancé`);
            
            return {
                status: 'deploying',
                serviceId,
                message: 'Déploiement déclenché avec succès',
                data: response.data
            };
            
        } catch (error) {
            console.error('❌ [CoolifyAgent] Erreur:', error.message);
            throw new Error(`Erreur déploiement Coolify: ${error.message}`);
        }
    }

    /**
     * Vérifier le status d'un service
     */
    async checkServiceStatus(serviceId) {
        console.log(`🔍 [CoolifyAgent] Status service: ${serviceId}`);
        
        if (!this.config.apiKey) {
            throw new Error('COOLIFY_API_KEY non configurée');
        }
        
        try {
            const response = await axios.get(
                `${this.config.url}/api/v1/services/${serviceId}/status`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.config.apiKey}`
                    }
                }
            );
            
            return {
                status: 'success',
                serviceId,
                serviceStatus: response.data
            };
            
        } catch (error) {
            throw new Error(`Erreur status service: ${error.message}`);
        }
    }

    /**
     * Lister tous les services
     */
    async listServices() {
        console.log('📋 [CoolifyAgent] Liste des services...');
        
        if (!this.config.apiKey) {
            throw new Error('COOLIFY_API_KEY non configurée');
        }
        
        try {
            const response = await axios.get(
                `${this.config.url}/api/v1/services`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.config.apiKey}`
                    }
                }
            );
            
            return {
                status: 'success',
                services: response.data
            };
            
        } catch (error) {
            throw new Error(`Erreur liste services: ${error.message}`);
        }
    }
}

module.exports = CoolifyAgent;
