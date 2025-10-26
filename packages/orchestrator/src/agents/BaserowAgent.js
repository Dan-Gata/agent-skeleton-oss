const axios = require("axios");

class BaserowAgent {
    constructor(config = {}) {
        this.config = {
            url: config.baserowUrl || process.env.BASEROW_URL || "http://baserow:80",
            apiToken: config.baserowApiToken || process.env.BASEROW_API_TOKEN
        };
        console.log("📊 [BaserowAgent] Initialisé avec URL:", this.config.url);
    }

    async listRecords(tableId) {
        if (!tableId || !this.config.apiToken) {
            return { status: "error", message: "Configuration manquante" };
        }
        try {
            const response = await axios.get(
                `${this.config.url}/api/database/rows/table/${tableId}/`,
                { headers: { "Authorization": `Token ${this.config.apiToken}` } }
            );
            return {
                status: "success",
                tableId,
                count: response.data.count || 0,
                records: response.data.results || []
            };
        } catch (error) {
            return { status: "error", message: error.message };
        }
    }
}

module.exports = BaserowAgent;
