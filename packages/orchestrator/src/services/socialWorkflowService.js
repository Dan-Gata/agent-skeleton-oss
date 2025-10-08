// Service de workflows automatisés pour réseaux sociaux
const axios = require('axios');

class SocialWorkflowService {
    constructor() {
        this.n8nBaseUrl = process.env.N8N_API_URL;
        this.n8nApiKey = process.env.N8N_API_KEY;
    }

    // Créer un workflow de publication automatique
    async createSocialPublishingWorkflow(userId, platforms = ['facebook', 'twitter', 'linkedin']) {
        const workflowData = {
            name: `Social Media Publisher - User ${userId}`,
            active: false,
            nodes: [
                {
                    name: "Webhook Trigger",
                    type: "n8n-nodes-base.webhook",
                    position: [250, 300],
                    parameters: {
                        httpMethod: "POST",
                        path: `social-publish-${userId}`,
                        responseMode: "onReceived"
                    }
                },
                {
                    name: "Content Processing",
                    type: "n8n-nodes-base.function",
                    position: [450, 300],
                    parameters: {
                        functionCode: `
// Traitement du contenu pour chaque plateforme
const content = items[0].json.content;
const platforms = items[0].json.platforms || ['facebook', 'twitter', 'linkedin'];

let processedContent = [];

platforms.forEach(platform => {
    let adaptedContent = content;
    
    // Adaptation par plateforme
    switch(platform) {
        case 'twitter':
            // Limiter à 280 caractères
            if (content.length > 280) {
                adaptedContent = content.substring(0, 277) + '...';
            }
            break;
        case 'linkedin':
            // Format professionnel
            adaptedContent = content + '\\n\\n#professionnel #automation';
            break;
        case 'facebook':
            // Format engagement
            adaptedContent = content + '\\n\\nQu\\'en pensez-vous ? 🤔';
            break;
    }
    
    processedContent.push({
        platform: platform,
        content: adaptedContent,
        originalContent: content
    });
});

return processedContent;
                        `
                    }
                }
            ]
        };

        // Ajouter les nœuds de publication pour chaque plateforme
        let xPosition = 650;
        platforms.forEach(platform => {
            workflowData.nodes.push(this.createSocialPlatformNode(platform, xPosition, 200));
            xPosition += 200;
        });

        return await this.createN8NWorkflow(workflowData);
    }

    // Créer un workflow de monitoring social
    async createSocialMonitoringWorkflow(userId, keywords = []) {
        const workflowData = {
            name: `Social Media Monitor - User ${userId}`,
            active: false,
            nodes: [
                {
                    name: "Schedule Trigger",
                    type: "n8n-nodes-base.cron",
                    position: [250, 300],
                    parameters: {
                        rule: {
                            hour: "*/2"  // Toutes les 2 heures
                        }
                    }
                },
                {
                    name: "Twitter Search",
                    type: "n8n-nodes-base.twitter",
                    position: [450, 200],
                    parameters: {
                        operation: "search",
                        searchText: keywords.join(' OR '),
                        returnAll: false,
                        limit: 10
                    }
                },
                {
                    name: "Sentiment Analysis",
                    type: "n8n-nodes-base.function",
                    position: [650, 300],
                    parameters: {
                        functionCode: `
// Analyse de sentiment basique
const tweets = items;
let analysis = [];

tweets.forEach(tweet => {
    const text = tweet.json.text.toLowerCase();
    let sentiment = 'neutral';
    
    // Mots positifs
    const positiveWords = ['super', 'génial', 'excellent', 'parfait', 'top', 'bravo'];
    // Mots négatifs  
    const negativeWords = ['nul', 'mauvais', 'terrible', 'décevant', 'problème'];
    
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    
    if (positiveCount > negativeCount) sentiment = 'positive';
    else if (negativeCount > positiveCount) sentiment = 'negative';
    
    analysis.push({
        ...tweet.json,
        sentiment: sentiment,
        positiveScore: positiveCount,
        negativeScore: negativeCount
    });
});

return analysis;
                        `
                    }
                },
                {
                    name: "Save to Baserow",
                    type: "n8n-nodes-base.baserow",
                    position: [850, 300],
                    parameters: {
                        operation: "create",
                        tableId: "social_monitoring",
                        dataToSend: "defineBelow",
                        fieldsToSend: {
                            values: {
                                tweet_id: "={{$json.id}}",
                                content: "={{$json.text}}",
                                sentiment: "={{$json.sentiment}}",
                                author: "={{$json.user.screen_name}}",
                                created_at: "={{$json.created_at}}"
                            }
                        }
                    }
                }
            ]
        };

        return await this.createN8NWorkflow(workflowData);
    }

    // Créer un workflow de réponse automatique
    async createAutoReplyWorkflow(userId, rules = []) {
        const workflowData = {
            name: `Auto Reply Social - User ${userId}`,
            active: false,
            nodes: [
                {
                    name: "Mention Webhook",
                    type: "n8n-nodes-base.webhook",
                    position: [250, 300],
                    parameters: {
                        httpMethod: "POST",
                        path: `social-mentions-${userId}`
                    }
                },
                {
                    name: "Content Analysis",
                    type: "n8n-nodes-base.function",
                    position: [450, 300],
                    parameters: {
                        functionCode: `
// Analyser le contenu de la mention
const mention = items[0].json;
const content = mention.content.toLowerCase();

// Règles de réponse automatique
const autoRules = ${JSON.stringify(rules)};

let shouldReply = false;
let replyTemplate = '';

autoRules.forEach(rule => {
    if (rule.keywords.some(keyword => content.includes(keyword.toLowerCase()))) {
        shouldReply = true;
        replyTemplate = rule.response;
    }
});

return [{
    ...mention,
    shouldReply: shouldReply,
    replyContent: replyTemplate,
    analysisDate: new Date().toISOString()
}];
                        `
                    }
                },
                {
                    name: "Send Reply",
                    type: "n8n-nodes-base.if",
                    position: [650, 300],
                    parameters: {
                        conditions: {
                            boolean: [{
                                value1: "={{$json.shouldReply}}",
                                operation: "equal",
                                value2: true
                            }]
                        }
                    }
                }
            ]
        };

        return await this.createN8NWorkflow(workflowData);
    }

    // Créer un nœud pour une plateforme sociale spécifique
    createSocialPlatformNode(platform, x, y) {
        const baseNode = {
            position: [x, y],
            parameters: {}
        };

        switch (platform) {
            case 'facebook':
                return {
                    ...baseNode,
                    name: "Facebook Post",
                    type: "n8n-nodes-base.facebook",
                    parameters: {
                        operation: "post",
                        message: "={{$json.content}}"
                    }
                };
            case 'twitter':
                return {
                    ...baseNode,
                    name: "Twitter Post",
                    type: "n8n-nodes-base.twitter",
                    parameters: {
                        operation: "tweet",
                        text: "={{$json.content}}"
                    }
                };
            case 'linkedin':
                return {
                    ...baseNode,
                    name: "LinkedIn Post",
                    type: "n8n-nodes-base.linkedIn",
                    parameters: {
                        operation: "post",
                        text: "={{$json.content}}"
                    }
                };
            default:
                return {
                    ...baseNode,
                    name: `${platform} Post`,
                    type: "n8n-nodes-base.webhook",
                    parameters: {
                        httpMethod: "POST",
                        responseMode: "onReceived"
                    }
                };
        }
    }

    // Créer le workflow dans n8n
    async createN8NWorkflow(workflowData) {
        try {
            if (!this.n8nApiKey || !this.n8nBaseUrl) {
                return {
                    success: false,
                    error: 'Configuration n8n manquante',
                    simulated: true,
                    workflow: workflowData
                };
            }

            const response = await axios.post(
                `${this.n8nBaseUrl}/api/v1/workflows`,
                workflowData,
                {
                    headers: {
                        'X-N8N-API-KEY': this.n8nApiKey,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                workflowId: response.data.id,
                workflow: response.data
            };
        } catch (error) {
            console.error('Erreur création workflow n8n:', error.message);
            return {
                success: false,
                error: error.message,
                simulated: true,
                workflow: workflowData
            };
        }
    }

    // Activer un workflow
    async activateWorkflow(workflowId) {
        try {
            const response = await axios.patch(
                `${this.n8nBaseUrl}/api/v1/workflows/${workflowId}`,
                { active: true },
                {
                    headers: {
                        'X-N8N-API-KEY': this.n8nApiKey,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return { success: true, workflow: response.data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

const socialWorkflowService = new SocialWorkflowService();

module.exports = { SocialWorkflowService, socialWorkflowService };