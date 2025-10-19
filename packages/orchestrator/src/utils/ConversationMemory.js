/**
 * ConversationMemory - Gestion de l'historique des conversations
 * Permet à l'agent de se souvenir des échanges passés
 */

const Database = require('better-sqlite3');
const path = require('path');

class ConversationMemory {
    constructor(dbPath = null) {
        this.dbPath = dbPath || path.join(process.cwd(), 'data', 'sessions.db');
        this.db = new Database(this.dbPath);
        
        console.log('💭 [ConversationMemory] Initialisation mémoire conversations');
        
        this.initializeTable();
    }
    
    /**
     * Créer la table conversations si elle n'existe pas
     */
    initializeTable() {
        const createConversationsTable = `
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId TEXT NOT NULL,
                message TEXT NOT NULL,
                role TEXT NOT NULL,
                model TEXT,
                intent TEXT,
                response TEXT,
                createdAt TEXT NOT NULL,
                metadata TEXT
            )
        `;
        
        const createSystemInstructionsTable = `
            CREATE TABLE IF NOT EXISTS system_instructions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId TEXT NOT NULL,
                instruction TEXT NOT NULL,
                category TEXT,
                priority INTEGER DEFAULT 5,
                active INTEGER DEFAULT 1,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
        `;
        
        try {
            this.db.exec(createConversationsTable);
            this.db.exec(createSystemInstructionsTable);
            
            // Index pour performances
            this.db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_userId ON conversations(userId)');
            this.db.exec('CREATE INDEX IF NOT EXISTS idx_conversations_createdAt ON conversations(createdAt)');
            this.db.exec('CREATE INDEX IF NOT EXISTS idx_instructions_userId ON system_instructions(userId)');
            
            console.log('✅ [ConversationMemory] Tables initialisées');
            
        } catch (error) {
            console.error('❌ [ConversationMemory] Erreur création tables:', error.message);
            throw error;
        }
    }
    
    /**
     * Sauvegarder un message dans l'historique
     */
    saveMessage(userId, message, role, options = {}) {
        const insert = this.db.prepare(`
            INSERT INTO conversations (userId, message, role, model, intent, response, createdAt, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        try {
            const result = insert.run(
                userId,
                message,
                role, // 'user' ou 'assistant'
                options.model || null,
                options.intent || null,
                options.response || null,
                new Date().toISOString(),
                options.metadata ? JSON.stringify(options.metadata) : null
            );
            
            console.log(`✅ [ConversationMemory] Message sauvegardé: ${role} - ${message.substring(0, 50)}...`);
            return result.lastInsertRowid;
            
        } catch (error) {
            console.error('❌ [ConversationMemory] Erreur sauvegarde message:', error.message);
            throw error;
        }
    }
    
    /**
     * Récupérer l'historique des conversations d'un utilisateur
     */
    getHistory(userId, limit = 50) {
        const select = this.db.prepare(`
            SELECT * FROM conversations 
            WHERE userId = ? 
            ORDER BY createdAt DESC 
            LIMIT ?
        `);
        
        try {
            const conversations = select.all(userId, limit);
            
            // Parser metadata JSON
            conversations.forEach(conv => {
                if (conv.metadata) {
                    try {
                        conv.metadata = JSON.parse(conv.metadata);
                    } catch (e) {
                        conv.metadata = null;
                    }
                }
            });
            
            // Inverser pour avoir chronologique
            return conversations.reverse();
            
        } catch (error) {
            console.error('❌ [ConversationMemory] Erreur récupération historique:', error.message);
            return [];
        }
    }
    
    /**
     * Rechercher dans l'historique
     */
    searchHistory(userId, query, limit = 20) {
        const searchPattern = `%${query}%`;
        const select = this.db.prepare(`
            SELECT * FROM conversations 
            WHERE userId = ? AND (message LIKE ? OR response LIKE ?)
            ORDER BY createdAt DESC 
            LIMIT ?
        `);
        
        try {
            return select.all(userId, searchPattern, searchPattern, limit);
        } catch (error) {
            console.error('❌ [ConversationMemory] Erreur recherche:', error.message);
            return [];
        }
    }
    
    /**
     * Obtenir le contexte récent pour l'IA (format prompt)
     */
    getRecentContext(userId, messageCount = 10) {
        const history = this.getHistory(userId, messageCount);
        
        let context = "📚 **Historique de vos conversations récentes:**\n\n";
        
        history.forEach((conv, index) => {
            const time = new Date(conv.createdAt).toLocaleString('fr-FR');
            if (conv.role === 'user') {
                context += `👤 **Vous** (${time}):\n${conv.message}\n\n`;
            } else {
                context += `🤖 **Assistant** (${time}):\n${conv.response || conv.message}\n\n`;
            }
        });
        
        return context;
    }
    
    /**
     * Nettoyer l'historique ancien
     */
    cleanOldHistory(userId, daysOld = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        
        const deleteStmt = this.db.prepare(`
            DELETE FROM conversations 
            WHERE userId = ? AND createdAt < ?
        `);
        
        try {
            const result = deleteStmt.run(userId, cutoffDate.toISOString());
            console.log(`🧹 [ConversationMemory] ${result.changes} messages anciens supprimés`);
            return result.changes;
        } catch (error) {
            console.error('❌ [ConversationMemory] Erreur nettoyage:', error.message);
            return 0;
        }
    }
    
    /**
     * SYSTEM INSTRUCTIONS - Ajouter une instruction système
     */
    addInstruction(userId, instruction, category = 'general', priority = 5) {
        const insert = this.db.prepare(`
            INSERT INTO system_instructions (userId, instruction, category, priority, active, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, 1, ?, ?)
        `);
        
        try {
            const now = new Date().toISOString();
            const result = insert.run(userId, instruction, category, priority, now, now);
            
            console.log(`✅ [ConversationMemory] Instruction ajoutée: ${instruction.substring(0, 50)}...`);
            return result.lastInsertRowid;
            
        } catch (error) {
            console.error('❌ [ConversationMemory] Erreur ajout instruction:', error.message);
            throw error;
        }
    }
    
    /**
     * Récupérer les instructions système actives
     */
    getInstructions(userId) {
        const select = this.db.prepare(`
            SELECT * FROM system_instructions 
            WHERE userId = ? AND active = 1
            ORDER BY priority DESC, createdAt ASC
        `);
        
        try {
            return select.all(userId);
        } catch (error) {
            console.error('❌ [ConversationMemory] Erreur récupération instructions:', error.message);
            return [];
        }
    }
    
    /**
     * Formater les instructions pour l'IA
     */
    formatInstructions(userId) {
        const instructions = this.getInstructions(userId);
        
        if (instructions.length === 0) {
            return "";
        }
        
        let formatted = "📋 **Instructions système actives:**\n\n";
        
        instructions.forEach((inst, index) => {
            formatted += `${index + 1}. [${inst.category.toUpperCase()}] ${inst.instruction}\n`;
        });
        
        formatted += "\n⚠️ **Respectez ces instructions dans toutes vos réponses.**\n\n";
        
        return formatted;
    }
    
    /**
     * Désactiver une instruction
     */
    deactivateInstruction(instructionId) {
        const update = this.db.prepare(`
            UPDATE system_instructions 
            SET active = 0, updatedAt = ? 
            WHERE id = ?
        `);
        
        try {
            const result = update.run(new Date().toISOString(), instructionId);
            return result.changes > 0;
        } catch (error) {
            console.error('❌ [ConversationMemory] Erreur désactivation instruction:', error.message);
            return false;
        }
    }
    
    /**
     * Obtenir statistiques
     */
    getStats(userId) {
        try {
            const totalMessages = this.db.prepare('SELECT COUNT(*) as count FROM conversations WHERE userId = ?').get(userId);
            const totalInstructions = this.db.prepare('SELECT COUNT(*) as count FROM system_instructions WHERE userId = ? AND active = 1').get(userId);
            const recentMessages = this.db.prepare('SELECT COUNT(*) as count FROM conversations WHERE userId = ? AND createdAt > datetime("now", "-7 days")').get(userId);
            
            return {
                totalMessages: totalMessages.count,
                totalInstructions: totalInstructions.count,
                recentMessages: recentMessages.count
            };
        } catch (error) {
            console.error('❌ [ConversationMemory] Erreur stats:', error.message);
            return { totalMessages: 0, totalInstructions: 0, recentMessages: 0 };
        }
    }
    
    /**
     * Fermer la connexion
     */
    close() {
        this.db.close();
        console.log('🔒 [ConversationMemory] Connexion fermée');
    }
}

module.exports = ConversationMemory;
