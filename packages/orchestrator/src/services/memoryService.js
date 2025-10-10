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

    // Récupérer les fichiers téléchargés d'un utilisateur avec leur contenu
    async getUserFiles(userId) {
        const knowledge = this.agentKnowledge.get(userId);
        if (!knowledge || !knowledge.uploaded_files) return [];
        
        return knowledge.uploaded_files || [];
    }

    // Enrichir le contexte avec le contenu des fichiers
    async enrichContextWithFiles(userId, currentMessage) {
        try {
            const fileService = require('./fileService');
            const userFiles = await this.getUserFiles(userId);
            
            if (!userFiles || userFiles.length === 0) {
                return '';
            }

            let fileContext = '\n\n📁 **FICHIERS DISPONIBLES POUR L\'AGENT :**\n';
            
            for (const fileData of userFiles) {
                try {
                    // Récupérer le contenu réel du fichier
                    const fileContent = await fileService.readFileContent(fileData.fileId);
                    
                    if (fileContent && fileContent.type === 'text' && fileContent.content) {
                        fileContext += `\n**📄 ${fileContent.metadata.originalName}** (ID: ${fileData.fileId}):\n`;
                        
                        // Limiter le contenu pour éviter de surcharger le contexte
                        const content = fileContent.content;
                        if (content.length > 2000) {
                            fileContext += content.substring(0, 2000) + '...\n[Contenu tronqué - fichier accessible avec ID]\n';
                        } else {
                            fileContext += content + '\n';
                        }
                        
                        fileContext += `---\n`;
                    } else if (fileContent) {
                        fileContext += `\n**📎 ${fileContent.metadata.originalName}** (${fileContent.type}): Fichier disponible (ID: ${fileData.fileId})\n`;
                    }
                } catch (error) {
                    console.error('Erreur lecture fichier pour contexte:', error);
                }
            }
            
            // Ajouter des instructions pour l'agent
            fileContext += `\n🤖 **INSTRUCTIONS POUR L'AGENT :**\n`;
            fileContext += `- Tu as accès aux fichiers ci-dessus et peux t'y référer dans tes réponses\n`;
            fileContext += `- Utilise le contenu de ces fichiers pour enrichir tes réponses\n`;
            fileContext += `- Quand tu mentionnes un fichier, cite son nom\n`;
            fileContext += `- Tu peux analyser, résumer ou répondre aux questions sur ces documents\n\n`;
            
            return fileContext;
        } catch (error) {
            console.error('Erreur enrichissement contexte fichiers:', error);
            return '';
        }
    }

    // Vérifier si un message fait référence à un fichier spécifique
    detectFileReference(message) {
        const fileKeywords = [
            'fichier', 'document', 'pdf', 'texte', 'contenu',
            'téléchargé', 'uploadé', 'analysé', 'dans le document',
            'selon le fichier', 'based on', 'file', 'document'
        ];
        
        const msg = message.toLowerCase();
        return fileKeywords.some(keyword => msg.includes(keyword));
    }
}

const memoryService = new MemoryService();

module.exports = { MemoryService, memoryService };