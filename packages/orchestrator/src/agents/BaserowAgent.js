/**
 * BaserowAgent - Sous-agent spécialisé dans la gestion de données Baserow
 */

const axios = require('axios');

class BaserowAgent {
    constructor(config = {}) {
        this.config = {
            url: config.baserowUrl || process.env.BASEROW_URL || 'http://baserow:80',
            apiToken: config.baserowApiToken || process.env.BASEROW_API_TOKEN
        };
        
        console.log('📊 [BaserowAgent] Initialisé avec URL:', this.config.url);
    }

    /**
     * Lister les enregistrements d'une table
     */
    async listRecords(tableId) {
        console.log(`📋 [BaserowAgent] Liste table: ${tableId}`);
        
        if (!tableId) {
            throw new Error('ID de table requis');
        }
        
        if (!this.config.apiToken) {
            throw new Error('BASEROW_API_TOKEN non configuré');
        }
        
        try {
            const response = await axios.get(
                `${this.config.url}/api/database/rows/table/${tableId}/`,
                {
                    headers: {
                        'Authorization': `Token ${this.config.apiToken}`
                    }
                }
            );
            
            return {
                status: 'success',
                tableId,
                count: response.data.count || 0,
                records: response.data.results || []
            };
            
        } catch (error) {
            throw new Error(`Erreur Baserow: ${error.message}`);
        }
    }

    /**
     * Créer un enregistrement
     */
    async createRecord(params) {
        console.log(`➕ [BaserowAgent] Création enregistrement...`);
        
        if (!params.tableId) {
            throw new Error('ID de table requis');
        }
        
        try {
            const response = await axios.post(
                `${this.config.url}/api/database/rows/table/${params.tableId}/`,
                params.data || {},
                {
                    headers: {
                        'Authorization': `Token ${this.config.apiToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            return {
                status: 'created',
                record: response.data
            };
            
        } catch (error) {
            throw new Error(`Erreur création: ${error.message}`);
        }
    }

    /**
     * Mettre à jour un enregistrement
     */
    async updateRecord(tableId, recordId, data) {
        console.log(`📝 [BaserowAgent] Mise à jour enregistrement ${recordId}...`);
        
        try {
            const response = await axios.patch(
                `${this.config.url}/api/database/rows/table/${tableId}/${recordId}/`,
                data,
                {
                    headers: {
                        'Authorization': `Token ${this.config.apiToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            return {
                status: 'updated',
                record: response.data
            };
            
        } catch (error) {
            throw new Error(`Erreur mise à jour: ${error.message}`);
        }
    }

    /**
     * Supprimer un enregistrement
     */
    async deleteRecord(tableId, recordId) {
        console.log(`🗑️ [BaserowAgent] Suppression enregistrement ${recordId}...`);
        
        try {
            await axios.delete(
                `${this.config.url}/api/database/rows/table/${tableId}/${recordId}/`,
                {
                    headers: {
                        'Authorization': `Token ${this.config.apiToken}`
                    }
                }
            );
            
            return {
                status: 'deleted',
                recordId
            };
            
        } catch (error) {
            throw new Error(`Erreur suppression: ${error.message}`);
        }
    }
}

module.exports = BaserowAgent;
