// Service de mémoire pour l'agent autonome
class MemoryService {
    constructor() {
        this.conversations = new Map(); // userId -> conversations[]
        this.userProfiles = new Map();  // userId -> profile
        this.agentKnowledge = new Map(); // userId -> learned facts
    }

    // Sauvegarder une conversation
    saveConversation(userId, message, response, model, metadata = {}) {
        if (!this.conversations.has(userId)) {
            this.conversations.set(userId, []);
        }

        const conversation = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            userMessage: message,
            agentResponse: response,
            model: model,
            metadata: {
                ...metadata,
                messageLength: message.length,
                responseLength: response.length
            }
        };

        this.conversations.get(userId).push(conversation);
        
        // Garder seulement les 100 dernières conversations par utilisateur
        const userConversations = this.conversations.get(userId);
        if (userConversations.length > 100) {
            userConversations.splice(0, userConversations.length - 100);
        }

        return conversation.id;
    }

    // Récupérer l'historique des conversations
    getConversationHistory(userId, limit = 20) {
        const conversations = this.conversations.get(userId) || [];
        return conversations.slice(-limit);
    }

    // Analyser et apprendre des préférences utilisateur
    learnFromConversation(userId, message, response) {
        if (!this.agentKnowledge.has(userId)) {
            this.agentKnowledge.set(userId, {
                preferences: {},
                interests: [],
                workflowPatterns: [],
                frequentRequests: {},
                learningHistory: []
            });
        }

        const knowledge = this.agentKnowledge.get(userId);
        
        // Analyser les préférences
        if (message.toLowerCase().includes('j\'aime') || message.toLowerCase().includes('préfère')) {
            knowledge.preferences[Date.now()] = {
                type: 'preference',
                content: message,
                timestamp: new Date().toISOString()
            };
        }

        // Détecter les demandes fréquentes
        const requestType = this.categorizeRequest(message);
        if (requestType) {
            knowledge.frequentRequests[requestType] = (knowledge.frequentRequests[requestType] || 0) + 1;
        }

        // Apprendre des patterns de workflows
        if (message.toLowerCase().includes('workflow') || message.toLowerCase().includes('automatiser')) {
            knowledge.workflowPatterns.push({
                request: message,
                timestamp: new Date().toISOString(),
                context: response.substring(0, 200)
            });
        }
    }

    // Catégoriser les types de demandes
    categorizeRequest(message) {
        const msg = message.toLowerCase();
        if (msg.includes('n8n') || msg.includes('workflow')) return 'n8n_workflow';
        if (msg.includes('coolify') || msg.includes('déploi')) return 'coolify_deploy';
        if (msg.includes('baserow') || msg.includes('données')) return 'baserow_data';
        if (msg.includes('social') || msg.includes('facebook') || msg.includes('twitter')) return 'social_media';
        return 'general';
    }

    // Générer un contexte personnalisé pour l'agent
    generatePersonalizedContext(userId) {
        const conversations = this.getConversationHistory(userId, 5);
        const knowledge = this.agentKnowledge.get(userId);
        
        let context = "CONTEXTE PERSONNEL:\n";
        
        if (conversations.length > 0) {
            context += "Conversations récentes:\n";
            conversations.forEach((conv, index) => {
                context += `${index + 1}. User: "${conv.userMessage.substring(0, 100)}..."\n`;
                context += `   Agent: "${conv.agentResponse.substring(0, 100)}..."\n`;
            });
        }

        if (knowledge) {
            context += "\nPréférences apprises:\n";
            Object.entries(knowledge.frequentRequests).forEach(([type, count]) => {
                context += `- ${type}: ${count} demandes\n`;
            });
        }

        return context;
    }

    // Sauvegarder le profil utilisateur
    updateUserProfile(userId, profileData) {
        const existingProfile = this.userProfiles.get(userId) || {};
        const updatedProfile = {
            ...existingProfile,
            ...profileData,
            lastUpdated: new Date().toISOString()
        };
        
        this.userProfiles.set(userId, updatedProfile);
        return updatedProfile;
    }

    // Récupérer le profil utilisateur
    getUserProfile(userId) {
        return this.userProfiles.get(userId) || null;
    }
}

const memoryService = new MemoryService();

module.exports = { MemoryService, memoryService };