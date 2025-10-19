/**
 * Gestionnaire de persistance des fichiers dans SQLite
 * Remplace le stockage en mémoire (global.uploadedFiles) par une vraie persistance
 */

const Database = require('better-sqlite3');
const path = require('path');

class FilePersistence {
    constructor(dbPath = null) {
        // Utiliser le même chemin que pour la session
        this.dbPath = dbPath || path.join(process.cwd(), 'data', 'sessions.db');
        this.db = new Database(this.dbPath);
        
        console.log(`📁 [FilePersistence] Initialisation avec: ${this.dbPath}`);
        
        this.initializeTable();
    }
    
    /**
     * Créer la table files si elle n'existe pas
     */
    initializeTable() {
        const createTable = `
            CREATE TABLE IF NOT EXISTS files (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                content TEXT NOT NULL,
                size INTEGER NOT NULL,
                mimeType TEXT,
                userId TEXT,
                uploadedAt TEXT NOT NULL,
                metadata TEXT
            )
        `;
        
        try {
            this.db.exec(createTable);
            console.log('✅ [FilePersistence] Table files initialisée');
            
            // Créer un index pour rechercher par userId
            this.db.exec('CREATE INDEX IF NOT EXISTS idx_files_userId ON files(userId)');
            this.db.exec('CREATE INDEX IF NOT EXISTS idx_files_uploadedAt ON files(uploadedAt)');
            
        } catch (error) {
            console.error('❌ [FilePersistence] Erreur création table:', error.message);
            throw error;
        }
    }
    
    /**
     * Sauvegarder un fichier
     */
    saveFile(fileData) {
        const insert = this.db.prepare(`
            INSERT INTO files (id, name, content, size, mimeType, userId, uploadedAt, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        try {
            const result = insert.run(
                fileData.id,
                fileData.name,
                fileData.content,
                fileData.size,
                fileData.mimeType || 'text/plain',
                fileData.userId || null,
                fileData.uploadedAt || new Date().toISOString(),
                fileData.metadata ? JSON.stringify(fileData.metadata) : null
            );
            
            console.log(`✅ [FilePersistence] Fichier sauvegardé: ${fileData.id} - ${fileData.name}`);
            return result.changes > 0;
            
        } catch (error) {
            console.error('❌ [FilePersistence] Erreur sauvegarde:', error.message);
            throw error;
        }
    }
    
    /**
     * Récupérer un fichier par son ID
     */
    getFile(fileId) {
        const select = this.db.prepare('SELECT * FROM files WHERE id = ?');
        
        try {
            const file = select.get(fileId);
            
            if (file && file.metadata) {
                try {
                    file.metadata = JSON.parse(file.metadata);
                } catch (e) {
                    file.metadata = null;
                }
            }
            
            return file;
            
        } catch (error) {
            console.error(`❌ [FilePersistence] Erreur récupération ${fileId}:`, error.message);
            return null;
        }
    }
    
    /**
     * Lister tous les fichiers (avec option de filtrage par userId)
     */
    listFiles(userId = null, limit = 100) {
        let select;
        let params = [];
        
        if (userId) {
            select = this.db.prepare(`
                SELECT id, name, size, mimeType, userId, uploadedAt 
                FROM files 
                WHERE userId = ? 
                ORDER BY uploadedAt DESC 
                LIMIT ?
            `);
            params = [userId, limit];
        } else {
            select = this.db.prepare(`
                SELECT id, name, size, mimeType, userId, uploadedAt 
                FROM files 
                ORDER BY uploadedAt DESC 
                LIMIT ?
            `);
            params = [limit];
        }
        
        try {
            const files = select.all(...params);
            console.log(`📋 [FilePersistence] ${files.length} fichiers trouvés`);
            return files;
            
        } catch (error) {
            console.error('❌ [FilePersistence] Erreur liste fichiers:', error.message);
            return [];
        }
    }
    
    /**
     * Supprimer un fichier
     */
    deleteFile(fileId) {
        const deleteStmt = this.db.prepare('DELETE FROM files WHERE id = ?');
        
        try {
            const result = deleteStmt.run(fileId);
            
            if (result.changes > 0) {
                console.log(`✅ [FilePersistence] Fichier supprimé: ${fileId}`);
                return true;
            } else {
                console.log(`⚠️ [FilePersistence] Fichier ${fileId} non trouvé`);
                return false;
            }
            
        } catch (error) {
            console.error(`❌ [FilePersistence] Erreur suppression ${fileId}:`, error.message);
            throw error;
        }
    }
    
    /**
     * Rechercher dans les fichiers
     */
    searchFiles(query, userId = null) {
        const searchPattern = `%${query}%`;
        let select;
        let params = [];
        
        if (userId) {
            select = this.db.prepare(`
                SELECT id, name, size, mimeType, userId, uploadedAt 
                FROM files 
                WHERE userId = ? AND (name LIKE ? OR content LIKE ?)
                ORDER BY uploadedAt DESC 
                LIMIT 50
            `);
            params = [userId, searchPattern, searchPattern];
        } else {
            select = this.db.prepare(`
                SELECT id, name, size, mimeType, userId, uploadedAt 
                FROM files 
                WHERE name LIKE ? OR content LIKE ?
                ORDER BY uploadedAt DESC 
                LIMIT 50
            `);
            params = [searchPattern, searchPattern];
        }
        
        try {
            const files = select.all(...params);
            console.log(`🔍 [FilePersistence] ${files.length} fichiers trouvés pour: "${query}"`);
            return files;
            
        } catch (error) {
            console.error('❌ [FilePersistence] Erreur recherche:', error.message);
            return [];
        }
    }
    
    /**
     * Obtenir les statistiques de stockage
     */
    getStats() {
        try {
            const totalFiles = this.db.prepare('SELECT COUNT(*) as count FROM files').get();
            const totalSize = this.db.prepare('SELECT SUM(size) as total FROM files').get();
            const byUser = this.db.prepare(`
                SELECT userId, COUNT(*) as count, SUM(size) as totalSize 
                FROM files 
                GROUP BY userId
            `).all();
            
            return {
                totalFiles: totalFiles.count,
                totalSize: totalSize.total || 0,
                byUser: byUser
            };
            
        } catch (error) {
            console.error('❌ [FilePersistence] Erreur stats:', error.message);
            return { totalFiles: 0, totalSize: 0, byUser: [] };
        }
    }
    
    /**
     * Migrer les fichiers depuis global.uploadedFiles
     */
    migrateFromMemory(uploadedFiles) {
        console.log('🔄 [FilePersistence] Migration des fichiers en mémoire...');
        
        let migrated = 0;
        let errors = 0;
        
        for (const [id, fileData] of Object.entries(uploadedFiles)) {
            try {
                this.saveFile({
                    id: fileData.id || id,
                    name: fileData.name,
                    content: fileData.content,
                    size: fileData.size,
                    mimeType: fileData.mimeType || 'text/plain',
                    userId: fileData.userId,
                    uploadedAt: fileData.uploadedAt,
                    metadata: fileData.metadata
                });
                migrated++;
            } catch (error) {
                console.error(`❌ Erreur migration fichier ${id}:`, error.message);
                errors++;
            }
        }
        
        console.log(`✅ [FilePersistence] Migration terminée: ${migrated} fichiers migrés, ${errors} erreurs`);
        
        return { migrated, errors };
    }
    
    /**
     * Fermer la connexion à la base de données
     */
    close() {
        this.db.close();
        console.log('🔒 [FilePersistence] Connexion fermée');
    }
}

module.exports = FilePersistence;
