/**
 * Orchestrator Agent - Agent central qui dirige tous les sous-agents
 * Comme une conversation avec GitHub Copilot - comprend le langage naturel et délègue aux experts
 */

const N8NAgent = require('./N8NAgent');
const CoolifyAgent = require('./CoolifyAgent');
const BaserowAgent = require('./BaserowAgent');
const EmailAgent = require('./EmailAgent');
const SecurityAgent = require('./SecurityAgent');
const FileAgent = require('./FileAgent');

class OrchestratorAgent {
    constructor(config = {}) {
        this.config = config;
        this.conversationHistory = [];
        
        // Initialiser tous les sous-agents spécialisés AVEC PERSISTANCE
        this.agents = {
            n8n: new N8NAgent(config),
            coolify: new CoolifyAgent(config),
            baserow: new BaserowAgent(config),
            email: new EmailAgent(config),
            security: new SecurityAgent(config),
            files: new FileAgent({ ...config, filePersistence: config.filePersistence })
        };
        
        console.log('🎯 [OrchestratorAgent] Orchestrateur initialisé avec', Object.keys(this.agents).length, 'sous-agents');
    }

    /**
     * Interface conversationnelle principale - comme parler à un assistant
     */
    async chat(userMessage, context = {}) {
        console.log(`\n💬 [OrchestratorAgent] Utilisateur: "${userMessage}"`);
        
        // Ajouter à l'historique
        this.conversationHistory.push({
            role: 'user',
            message: userMessage,
            timestamp: new Date().toISOString()
        });
        
        // Analyser l'intention avec contexte conversationnel
        const intent = await this.analyzeIntent(userMessage, context);
        console.log(`🧠 [OrchestratorAgent] Intent détecté:`, intent.type);
        
        // Déléguer au(x) sous-agent(s) approprié(s)
        const response = await this.delegateTask(intent, context);
        
        // Formater la réponse de manière conversationnelle
        const conversationalResponse = this.formatConversationalResponse(response, intent);
        
        // Ajouter à l'historique
        this.conversationHistory.push({
            role: 'assistant',
            message: conversationalResponse,
            intent: intent.type,
            timestamp: new Date().toISOString()
        });
        
        return {
            success: response.success,
            message: conversationalResponse,
            intent: intent.type,
            details: response.details,
            agentsUsed: response.agentsUsed || [],
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Analyse conversationnelle de l'intention
     * Comprend le contexte, les références, le langage naturel
     */
    async analyzeIntent(userMessage, context) {
        const msg = userMessage.toLowerCase();
        
        // ========== WORKFLOWS N8N ==========
        if (msg.match(/(workflow|n8n|automation|automatisation)/i)) {
            // Suppression de workflow
            if (msg.match(/(supprim|efface|delete|retire)/i)) {
                // Détecter "TOUT" ou "TOUS" ou "CES"
                if (msg.match(/(tout|tous|ces|ces workflow|all)/i)) {
                    return {
                        type: 'n8n_delete_all_inactive_workflows',
                        params: {},
                        confidence: 0.98
                    };
                }
                
                // Extraire tous les IDs de la commande
                const workflowIds = this.extractAllWorkflowIds(userMessage);
                
                if (workflowIds.length > 1) {
                    return {
                        type: 'n8n_delete_multiple_workflows',
                        params: { workflowIds },
                        confidence: 0.95
                    };
                }
                
                const workflowId = workflowIds[0] || this.extractWorkflowId(userMessage);
                return {
                    type: 'n8n_delete_workflow',
                    params: { workflowId },
                    confidence: workflowId ? 0.95 : 0.6
                };
            }
            
            // Liste workflows
            if (msg.match(/(liste|affiche|montre|voir|workflows)/i)) {
                return {
                    type: 'n8n_list_workflows',
                    params: {},
                    confidence: 0.9
                };
            }
            
            // Exécution workflow
            if (msg.match(/(exécut|lance|démarre|run|trigger)/i)) {
                const workflowId = this.extractWorkflowId(userMessage);
                return {
                    type: 'n8n_execute_workflow',
                    params: { workflowId },
                    confidence: workflowId ? 0.95 : 0.7
                };
            }
            
            // Vérification compte
            return {
                type: 'n8n_check_account',
                params: {},
                confidence: 0.8
            };
        }
        
        // ========== FICHIERS ==========
        if (msg.match(/(fichier|file|document|upload|télécharge)/i)) {
            // Récupérer fichiers
            if (msg.match(/(récupèr|obtenir|voir|liste|affiche)/i)) {
                return {
                    type: 'files_list',
                    params: {},
                    confidence: 0.9
                };
            }
            
            // Analyser fichiers
            if (msg.match(/(analy|examine|inspect|vérifie)/i)) {
                return {
                    type: 'files_analyze',
                    params: { files: context.files || [] },
                    confidence: 0.95
                };
            }
            
            // Recherche dans fichiers
            if (msg.match(/(cherche|trouve|recherch|search)/i)) {
                return {
                    type: 'files_search',
                    params: { query: userMessage },
                    confidence: 0.85
                };
            }
        }
        
        // ========== DÉPLOIEMENTS COOLIFY ==========
        if (msg.match(/(déploi|deploy|coolify|build|rebuild)/i)) {
            const serviceId = this.extractServiceId(userMessage);
            
            if (msg.match(/(status|état|santé|health)/i)) {
                return {
                    type: 'coolify_check_status',
                    params: { serviceId },
                    confidence: 0.9
                };
            }
            
            return {
                type: 'coolify_deploy',
                params: { serviceId },
                confidence: serviceId ? 0.95 : 0.7
            };
        }
        
        // ========== BASE DE DONNÉES BASEROW ==========
        if (msg.match(/(baserow|database|données|table|enregistrement)/i)) {
            if (msg.match(/(liste|affiche|voir|récupèr)/i)) {
                return {
                    type: 'baserow_list_records',
                    params: { tableId: this.extractTableId(userMessage) },
                    confidence: 0.85
                };
            }
            
            if (msg.match(/(ajoute|créer|insert|enregistr)/i)) {
                return {
                    type: 'baserow_create_record',
                    params: {},
                    confidence: 0.8
                };
            }
        }
        
        // ========== EMAIL ==========
        if (msg.match(/(email|mail|envoi|send|message)/i)) {
            return {
                type: 'email_send',
                params: {
                    to: this.extractEmail(userMessage),
                    content: userMessage
                },
                confidence: 0.85
            };
        }
        
        // ========== SÉCURITÉ ==========
        if (msg.match(/(sécurité|security|audit|permission|accès)/i)) {
            return {
                type: 'security_audit',
                params: { user: context.user },
                confidence: 0.8
            };
        }
        
        // ========== COMMANDES SYSTÈME ==========
        if (msg.match(/(aide|help|capacité|que peux-tu faire)/i)) {
            return {
                type: 'system_help',
                params: {},
                confidence: 1.0
            };
        }
        
        // ========== GÉNÉRIQUE ==========
        return {
            type: 'generic_conversation',
            params: { query: userMessage, context },
            confidence: 0.5
        };
    }

    /**
     * Déléguer la tâche au(x) agent(s) approprié(s)
     */
    async delegateTask(intent, context) {
        const agentsUsed = [];
        let result;

        try {
            switch(intent.type) {
                // ===== N8N AGENT =====
                case 'n8n_check_account':
                    agentsUsed.push('N8NAgent');
                    result = await this.agents.n8n.checkAccount();
                    break;
                
                case 'n8n_list_workflows':
                    agentsUsed.push('N8NAgent');
                    result = await this.agents.n8n.listWorkflows();
                    break;
                
                case 'n8n_execute_workflow':
                    agentsUsed.push('N8NAgent');
                    result = await this.agents.n8n.executeWorkflow(intent.params.workflowId);
                    break;
                
                case 'n8n_delete_workflow':
                    agentsUsed.push('N8NAgent');
                    result = await this.agents.n8n.deleteWorkflow(intent.params.workflowId);
                    break;
                
                case 'n8n_delete_multiple_workflows':
                    agentsUsed.push('N8NAgent');
                    result = await this.agents.n8n.deleteMultipleWorkflows(intent.params.workflowIds);
                    break;
                
                case 'n8n_delete_all_inactive_workflows':
                    agentsUsed.push('N8NAgent');
                    result = await this.agents.n8n.deleteAllInactiveWorkflows();
                    break;
                
                // ===== FILE AGENT =====
                case 'files_list':
                    agentsUsed.push('FileAgent');
                    result = await this.agents.files.listFiles();
                    break;
                
                case 'files_analyze':
                    agentsUsed.push('FileAgent');
                    result = await this.agents.files.analyzeFiles(intent.params.files);
                    break;
                
                case 'files_search':
                    agentsUsed.push('FileAgent');
                    result = await this.agents.files.searchInFiles(intent.params.query);
                    break;
                
                // ===== COOLIFY AGENT =====
                case 'coolify_deploy':
                    agentsUsed.push('CoolifyAgent');
                    result = await this.agents.coolify.deployService(intent.params.serviceId);
                    break;
                
                case 'coolify_check_status':
                    agentsUsed.push('CoolifyAgent');
                    result = await this.agents.coolify.checkServiceStatus(intent.params.serviceId);
                    break;
                
                // ===== BASEROW AGENT =====
                case 'baserow_list_records':
                    agentsUsed.push('BaserowAgent');
                    result = await this.agents.baserow.listRecords(intent.params.tableId);
                    break;
                
                case 'baserow_create_record':
                    agentsUsed.push('BaserowAgent');
                    result = await this.agents.baserow.createRecord(intent.params);
                    break;
                
                // ===== EMAIL AGENT =====
                case 'email_send':
                    agentsUsed.push('EmailAgent');
                    result = await this.agents.email.sendEmail(intent.params);
                    break;
                
                // ===== SECURITY AGENT =====
                case 'security_audit':
                    agentsUsed.push('SecurityAgent');
                    result = await this.agents.security.auditAccess(intent.params.user);
                    break;
                
                // ===== AIDE SYSTÈME =====
                case 'system_help':
                    result = this.getSystemHelp();
                    break;
                
                // ===== GÉNÉRIQUE =====
                default:
                    result = this.handleGenericConversation(intent.params.query, context);
            }

            return {
                success: true,
                details: result,
                agentsUsed
            };
            
        } catch (error) {
            console.error(`❌ [OrchestratorAgent] Erreur délégation:`, error.message);
            return {
                success: false,
                error: error.message,
                agentsUsed
            };
        }
    }

    /**
     * Formater la réponse de manière conversationnelle
     */
    formatConversationalResponse(response, intent) {
        if (!response.success) {
            return `❌ Désolé, j'ai rencontré un problème : ${response.error}\n\nBesoin d'aide ? Demandez-moi "aide" pour voir ce que je peux faire.`;
        }

        const details = response.details;
        const agents = response.agentsUsed.join(', ');
        
        let message = '';
        
        // Personnaliser selon le type d'intent
        switch(intent.type) {
            case 'n8n_check_account':
                message = `✅ **Compte N8N vérifié**\n\n`;
                message += `📊 **${details.workflowsCount}** workflows trouvés\n\n`;
                if (details.workflows && details.workflows.length > 0) {
                    message += `**Workflows disponibles:**\n`;
                    details.workflows.forEach(w => {
                        const status = w.active ? '🟢 Actif' : '🔴 Inactif';
                        message += `• ${status} **${w.name}** (ID: \`${w.id}\`)\n`;
                    });
                }
                break;
            
            case 'n8n_delete_workflow':
                message = `✅ **Workflow supprimé avec succès**\n\n`;
                message += `🗑️ Le workflow a été retiré de votre compte N8N.\n`;
                message += `ID: \`${intent.params.workflowId}\``;
                break;
            
            case 'n8n_delete_multiple_workflows':
                message = `✅ **${details.deletedCount} Workflows supprimés avec succès**\n\n`;
                message += `🗑️ Workflows supprimés:\n`;
                details.deleted.forEach(w => {
                    message += `• **${w.name}** (ID: \`${w.id}\`)\n`;
                });
                if (details.failed && details.failed.length > 0) {
                    message += `\n⚠️ Erreurs (${details.failed.length}):\n`;
                    details.failed.forEach(f => {
                        message += `• ${f.id}: ${f.error}\n`;
                    });
                }
                break;
            
            case 'n8n_delete_all_inactive_workflows':
                message = `✅ **${details.deletedCount} Workflows inactifs supprimés**\n\n`;
                if (details.deletedCount > 0) {
                    message += `🗑️ Workflows supprimés:\n`;
                    details.deleted.forEach(w => {
                        message += `• **${w.name}** (ID: \`${w.id}\`)\n`;
                    });
                } else {
                    message += `Aucun workflow inactif à supprimer.`;
                }
                if (details.keptCount > 0) {
                    message += `\n\n✅ ${details.keptCount} workflow(s) actif(s) conservé(s)`;
                }
                break;
            
            case 'files_list':
                message = `📂 **Fichiers uploadés** (${details.count})\n\n`;
                if (details.files && details.files.length > 0) {
                    details.files.forEach(f => {
                        message += `📄 **${f.name}** - ${this.formatFileSize(f.size)}\n`;
                        message += `   Uploadé: ${new Date(f.uploadedAt).toLocaleString('fr-FR')}\n\n`;
                    });
                } else {
                    message += `Aucun fichier trouvé. Uploadez des fichiers pour commencer !`;
                }
                break;
            
            case 'files_analyze':
                message = `🔍 **Analyse de fichiers**\n\n`;
                message += `📊 **Résumé:**\n`;
                message += `• Fichiers analysés: ${details.filesAnalyzed}\n`;
                message += `• Taille totale: ${this.formatFileSize(details.totalSize)}\n`;
                message += `• Types détectés: ${details.types.join(', ')}\n\n`;
                if (details.insights) {
                    message += `💡 **Insights:**\n${details.insights}`;
                }
                break;
            
            case 'system_help':
                message = details.helpText;
                break;
            
            default:
                message = `✅ Tâche exécutée avec succès\n\n`;
                message += JSON.stringify(details, null, 2);
        }
        
        message += `\n\n🤖 *Agents utilisés: ${agents || 'Orchestrator'}*`;
        
        return message;
    }

    /**
     * Aide système - liste des capacités
     */
    getSystemHelp() {
        return {
            helpText: `🤖 **Assistant IA Orchestrateur - Guide des Capacités**

Je suis un agent centralisé qui dirige plusieurs sous-agents spécialisés. Voici ce que je peux faire pour vous:

**🔄 Workflows N8N**
• "Vérifie mon compte N8N" - Lister workflows
• "Exécute le workflow [ID]" - Lancer un workflow
• "Supprime le workflow [ID]" - Retirer un workflow
• "Liste mes workflows" - Voir tous les workflows

**📁 Gestion de Fichiers**
• "Récupère mes fichiers" - Lister fichiers uploadés
• "Analyse mes fichiers" - Analyse approfondie
• "Cherche [terme] dans mes fichiers" - Recherche

**🚀 Déploiements Coolify**
• "Déploie le service [ID]" - Déclencher déploiement
• "Status du service [ID]" - Vérifier état

**📊 Base de Données Baserow**
• "Liste les enregistrements table [ID]" - Voir données
• "Ajoute un enregistrement" - Créer donnée

**📧 Email**
• "Envoie un email à [adresse]" - Envoyer message

**🔒 Sécurité**
• "Audit de sécurité" - Vérifier accès et permissions

**💬 Conversation Naturelle**
Parlez-moi comme vous me parlez maintenant ! Je comprends le langage naturel et je délègue automatiquement aux bons agents.

**Exemples:**
- "Supprime moi le workflow tiktok_short_video_agent"
- "Montre moi tous mes fichiers"
- "Déploie l'application principale"
- "Qu'est-ce qui tourne actuellement sur N8N ?"

Que puis-je faire pour vous ? 😊`
        };
    }

    /**
     * Conversation générique
     */
    handleGenericConversation(query, context) {
        return {
            message: `Je ne suis pas sûr de comprendre exactement ce que vous voulez faire. Voici quelques suggestions:\n\n` +
                     `• Si vous voulez gérer des workflows: "Liste mes workflows N8N"\n` +
                     `• Si vous voulez voir vos fichiers: "Récupère mes fichiers"\n` +
                     `• Si vous voulez de l'aide: "Aide"\n\n` +
                     `Ou reformulez votre demande et je ferai de mon mieux pour comprendre !`,
            suggestion: 'Demandez "aide" pour voir toutes mes capacités'
        };
    }

    // ========== HELPERS ==========
    
    extractWorkflowId(text) {
        // Patterns plus robustes pour extraction d'ID - ORDRE DE PRIORITÉ
        const patterns = [
            /\(ID[:\s]*[`'"]*([a-zA-Z0-9]{16})[`'"]*\)/i,  // (ID: `3wnBU3rbhJATJfYW`)
            /ID[:\s]+[`'"]*([a-zA-Z0-9]{16})[`'"]*/i,  // ID: 3wnBU3rbhJATJfYW
            /[`'"]([a-zA-Z0-9]{16})[`'"]/,  // `3wnBU3rbhJATJfYW`
            /workflow[:\s]+[`'"]*([a-zA-Z0-9]{16})[`'"]*/i,  // workflow: 3wnBU3rbhJATJfYW
            /\b([a-zA-Z0-9]{16})\b/  // 3wnBU3rbhJATJfYW (seul, 16 caractères exactement)
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                console.log(`🎯 [OrchestratorAgent] ID workflow extrait: ${match[1]} via pattern: ${pattern}`);
                return match[1];
            }
        }
        
        console.warn(`⚠️ [OrchestratorAgent] Aucun ID workflow trouvé dans: "${text.substring(0, 100)}..."`);
        return null;
    }
    
    extractAllWorkflowIds(text) {
        // Extraire tous les IDs de workflows (format: EXACTEMENT 16 caractères alphanumériques)
        const idMatches = text.match(/\b[a-zA-Z0-9]{16}\b/g);
        
        if (idMatches && idMatches.length > 0) {
            console.log(`🎯 [OrchestratorAgent] ${idMatches.length} IDs workflow extraits: ${idMatches.join(', ')}`);
            return idMatches;
        }
        
        return [];
    }
    
    extractServiceId(text) {
        const idMatch = text.match(/service[:\s]+([a-zA-Z0-9-]+)/i);
        return idMatch ? idMatch[1] : null;
    }
    
    extractTableId(text) {
        const idMatch = text.match(/table[:\s]+(\d+)/i);
        return idMatch ? idMatch[1] : null;
    }
    
    extractEmail(text) {
        const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        return emailMatch ? emailMatch[0] : null;
    }
    
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    /**
     * Obtenir l'historique de conversation
     */
    getConversationHistory() {
        return this.conversationHistory;
    }

    /**
     * Réinitialiser l'historique
     */
    resetConversation() {
        this.conversationHistory = [];
        console.log('🔄 [OrchestratorAgent] Historique de conversation réinitialisé');
    }
}

module.exports = OrchestratorAgent;
