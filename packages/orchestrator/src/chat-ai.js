// Module Chat IA avec OpenRouter (60+ modèles)
const axios = require('axios');
const { addMessage, getConversationMessages, logAction } = require('./database');

// Configuration OpenRouter
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Client OpenRouter
const openRouterClient = axios.create({
    baseURL: OPENROUTER_BASE_URL,
    headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'Agent Skeleton OSS',
        'Content-Type': 'application/json'
    }
});

// Liste des modèles disponibles (60+ modèles OpenRouter)
const AI_MODELS = {
    // OpenAI
    'gpt-4-turbo': { name: 'GPT-4 Turbo', provider: 'OpenAI', free: false },
    'gpt-4': { name: 'GPT-4', provider: 'OpenAI', free: false },
    'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', provider: 'OpenAI', free: true },
    
    // Anthropic Claude
    'claude-3-opus': { name: 'Claude 3 Opus', provider: 'Anthropic', free: false },
    'claude-3-sonnet': { name: 'Claude 3 Sonnet', provider: 'Anthropic', free: false },
    'claude-3-haiku': { name: 'Claude 3 Haiku', provider: 'Anthropic', free: true },
    
    // Google
    'gemini-pro': { name: 'Gemini Pro', provider: 'Google', free: true },
    'gemini-pro-vision': { name: 'Gemini Pro Vision', provider: 'Google', free: true },
    
    // Meta
    'llama-3-70b': { name: 'Llama 3 70B', provider: 'Meta', free: true },
    'llama-3-8b': { name: 'Llama 3 8B', provider: 'Meta', free: true },
    
    // Alibaba
    'qwen-72b': { name: 'Qwen 72B', provider: 'Alibaba', free: true },
    'qwen-32b': { name: 'Qwen 32B', provider: 'Alibaba', free: true },
    
    // Mistral
    'mistral-large': { name: 'Mistral Large', provider: 'Mistral', free: false },
    'mistral-medium': { name: 'Mistral Medium', provider: 'Mistral', free: true },
    'mixtral-8x7b': { name: 'Mixtral 8x7B', provider: 'Mistral', free: true },
    
    // Autres modèles populaires
    'claude-2': { name: 'Claude 2', provider: 'Anthropic', free: false },
    'palm-2': { name: 'PaLM 2', provider: 'Google', free: true },
    'phi-2': { name: 'Phi-2', provider: 'Microsoft', free: true }
};

/**
 * Envoyer un message au modèle IA avec mémoire conversationnelle
 */
async function sendChatMessage(userId, conversationId, userMessage, modelId = 'gpt-3.5-turbo', includeFileContext = null) {
    try {
        // Récupérer l'historique de conversation pour la mémoire
        const conversationHistory = getConversationMessages.all(conversationId);
        
        // Construire le contexte avec mémoire
        const messages = [
            {
                role: 'system',
                content: `Tu es un assistant IA intelligent et polyvalent intégré à Agent Skeleton OSS.
Tu as accès à des workflows n8n pour la création de contenu, des intégrations avec les réseaux sociaux, 
et des outils d'analyse. Tu peux aider l'utilisateur avec:
- Génération de contenu créatif
- Analyse de documents
- Automatisation via n8n
- Publication sur les réseaux sociaux
- Et bien plus encore.

${includeFileContext ? `\n\nCONTEXTE DU FICHIER UPLOADÉ:\n${includeFileContext}` : ''}`
            }
        ];
        
        // Ajouter l'historique (mémoire des 10 derniers messages pour le contexte)
        const recentHistory = conversationHistory.slice(-10);
        recentHistory.forEach(msg => {
            if (msg.role !== 'system') {
                messages.push({
                    role: msg.role,
                    content: msg.content
                });
            }
        });
        
        // Ajouter le nouveau message de l'utilisateur
        messages.push({
            role: 'user',
            content: userMessage
        });
        
        console.log(`[${new Date().toISOString()}] [chat-ai] Envoi vers ${modelId}, ${messages.length} messages dans le contexte`);
        
        // Appeler OpenRouter
        const response = await openRouterClient.post('/chat/completions', {
            model: modelId,
            messages: messages,
            temperature: 0.7,
            max_tokens: 2000
        });
        
        const assistantMessage = response.data.choices[0].message.content;
        const tokensUsed = response.data.usage?.total_tokens || 0;
        
        // Sauvegarder les messages dans la base de données (mémoire)
        addMessage.run(conversationId, 'user', userMessage, modelId, 0);
        addMessage.run(conversationId, 'assistant', assistantMessage, modelId, tokensUsed);
        
        // Logger l'action
        logAction.run(userId, 'chat', JSON.stringify({ model: modelId, tokens: tokensUsed }), true, null);
        
        console.log(`[${new Date().toISOString()}] [chat-ai] ✅ Réponse générée (${tokensUsed} tokens)`);
        
        return {
            success: true,
            message: assistantMessage,
            model: modelId,
            tokensUsed: tokensUsed,
            conversationId: conversationId
        };
        
    } catch (error) {
        console.error(`[${new Date().toISOString()}] [chat-ai] ❌ Erreur:`, error.message);
        
        // Logger l'erreur
        logAction.run(userId, 'chat', JSON.stringify({ model: modelId, error: error.message }), false, error.message);
        
        throw error;
    }
}

/**
 * Récupérer l'historique complet d'une conversation
 */
function getConversationHistory(conversationId) {
    return getConversationMessages.all(conversationId);
}

/**
 * Obtenir la liste des modèles disponibles
 */
function getAvailableModels() {
    return Object.entries(AI_MODELS).map(([id, info]) => ({
        id,
        ...info
    }));
}

/**
 * Obtenir les modèles gratuits seulement
 */
function getFreeModels() {
    return Object.entries(AI_MODELS)
        .filter(([_, info]) => info.free)
        .map(([id, info]) => ({ id, ...info }));
}

/**
 * Génération de titre automatique pour une conversation
 */
async function generateConversationTitle(firstMessage) {
    try {
        const response = await openRouterClient.post('/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'Génère un titre court (max 6 mots) pour cette conversation. Réponds uniquement avec le titre, sans guillemets ni ponctuation finale.'
                },
                {
                    role: 'user',
                    content: firstMessage
                }
            ],
            temperature: 0.5,
            max_tokens: 20
        });
        
        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Erreur génération titre:', error.message);
        return 'Nouvelle conversation';
    }
}

module.exports = {
    sendChatMessage,
    getConversationHistory,
    getAvailableModels,
    getFreeModels,
    generateConversationTitle,
    AI_MODELS
};
