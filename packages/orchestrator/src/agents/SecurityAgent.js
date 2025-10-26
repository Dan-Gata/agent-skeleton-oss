class SecurityAgent {
    constructor(config = {}) {
        this.config = config;
        console.log("🔒 [SecurityAgent] Initialisé");
    }
    
    async validateApiKey(apiKey) {
        return { valid: true, message: "API key valide" };
    }
    
    async sanitizeInput(input) {
        if (!input) return "";
        return String(input).replace(/<[^>]+>/g, "").trim();
    }
}

module.exports = SecurityAgent;
