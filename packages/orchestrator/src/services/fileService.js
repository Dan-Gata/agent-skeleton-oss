// Service de gestion des fichiers téléchargés
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class FileService {
    constructor() {
        this.uploadDir = path.join(__dirname, '../../uploads');
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.allowedTypes = [
            'text/plain',
            'text/markdown',
            'application/json',
            'text/csv',
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/webp',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        
        this.initializeUploadDir();
    }

    async initializeUploadDir() {
        try {
            await fs.access(this.uploadDir);
        } catch (error) {
            // Le dossier n'existe pas, le créer
            await fs.mkdir(this.uploadDir, { recursive: true });
            console.log('📁 Dossier uploads créé:', this.uploadDir);
        }
    }

    // Générer un ID unique pour le fichier
    generateFileId() {
        return crypto.randomBytes(16).toString('hex');
    }

    // Valider le type de fichier
    isAllowedType(mimeType) {
        return this.allowedTypes.includes(mimeType);
    }

    // Sauvegarder un fichier téléchargé
    async saveFile(file, userId) {
        try {
            // Valider la taille
            if (file.size > this.maxFileSize) {
                throw new Error(`Fichier trop volumineux. Maximum autorisé: ${this.maxFileSize / 1024 / 1024}MB`);
            }

            // Valider le type
            if (!this.isAllowedType(file.mimetype)) {
                throw new Error(`Type de fichier non autorisé: ${file.mimetype}`);
            }

            const fileId = this.generateFileId();
            const fileExtension = path.extname(file.originalname);
            const fileName = `${fileId}${fileExtension}`;
            const filePath = path.join(this.uploadDir, fileName);

            // Sauvegarder le fichier
            await fs.writeFile(filePath, file.buffer);

            // Créer les métadonnées
            const metadata = {
                id: fileId,
                originalName: file.originalname,
                fileName: fileName,
                mimeType: file.mimetype,
                size: file.size,
                uploadedBy: userId,
                uploadedAt: new Date().toISOString(),
                path: filePath
            };

            // Sauvegarder les métadonnées
            const metadataPath = path.join(this.uploadDir, `${fileId}.meta.json`);
            await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

            console.log('✅ Fichier sauvegardé:', metadata);
            return metadata;
        } catch (error) {
            console.error('❌ Erreur sauvegarde fichier:', error);
            throw error;
        }
    }

    // Lire le contenu d'un fichier
    async readFileContent(fileId) {
        try {
            const metadata = await this.getFileMetadata(fileId);
            if (!metadata) {
                throw new Error('Fichier non trouvé');
            }

            const content = await fs.readFile(metadata.path);
            
            // Traitement selon le type
            if (metadata.mimeType.startsWith('text/') || metadata.mimeType === 'application/json') {
                return {
                    type: 'text',
                    content: content.toString('utf8'),
                    metadata
                };
            } else if (metadata.mimeType === 'application/pdf') {
                return {
                    type: 'binary',
                    content: content,
                    metadata,
                    note: 'PDF nécessite un parser spécialisé'
                };
            } else if (metadata.mimeType.startsWith('image/')) {
                return {
                    type: 'image',
                    content: content,
                    metadata,
                    base64: content.toString('base64')
                };
            } else {
                return {
                    type: 'binary',
                    content: content,
                    metadata
                };
            }
        } catch (error) {
            console.error('❌ Erreur lecture fichier:', error);
            throw error;
        }
    }

    // Récupérer les métadonnées d'un fichier
    async getFileMetadata(fileId) {
        try {
            const metadataPath = path.join(this.uploadDir, `${fileId}.meta.json`);
            const metadataContent = await fs.readFile(metadataPath, 'utf8');
            return JSON.parse(metadataContent);
        } catch (error) {
            console.error('❌ Métadonnées non trouvées:', fileId);
            return null;
        }
    }

    // Lister tous les fichiers d'un utilisateur
    async listUserFiles(userId) {
        try {
            const files = await fs.readdir(this.uploadDir);
            const metaFiles = files.filter(f => f.endsWith('.meta.json'));
            
            const userFiles = [];
            for (const metaFile of metaFiles) {
                const content = await fs.readFile(path.join(this.uploadDir, metaFile), 'utf8');
                const metadata = JSON.parse(content);
                
                if (metadata.uploadedBy === userId) {
                    userFiles.push({
                        id: metadata.id,
                        originalName: metadata.originalName,
                        mimeType: metadata.mimeType,
                        size: metadata.size,
                        uploadedAt: metadata.uploadedAt
                    });
                }
            }
            
            return userFiles.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        } catch (error) {
            console.error('❌ Erreur listage fichiers:', error);
            return [];
        }
    }

    // Supprimer un fichier
    async deleteFile(fileId, userId) {
        try {
            const metadata = await this.getFileMetadata(fileId);
            if (!metadata) {
                throw new Error('Fichier non trouvé');
            }

            if (metadata.uploadedBy !== userId) {
                throw new Error('Accès refusé');
            }

            // Supprimer le fichier et les métadonnées
            await fs.unlink(metadata.path);
            await fs.unlink(path.join(this.uploadDir, `${fileId}.meta.json`));

            console.log('🗑️ Fichier supprimé:', fileId);
            return true;
        } catch (error) {
            console.error('❌ Erreur suppression fichier:', error);
            throw error;
        }
    }

    // Analyser le contenu pour l'agent
    async analyzeForAgent(fileId) {
        try {
            const fileData = await this.readFileContent(fileId);
            
            let analysis = {
                fileId: fileId,
                metadata: fileData.metadata,
                contentType: fileData.type,
                analysis: ''
            };

            if (fileData.type === 'text') {
                const content = fileData.content;
                const lines = content.split('\n');
                
                analysis.analysis = `
📄 **Analyse du fichier texte :**
• **Nom :** ${fileData.metadata.originalName}
• **Taille :** ${Math.round(fileData.metadata.size / 1024)} Ko
• **Lignes :** ${lines.length}
• **Caractères :** ${content.length}

📝 **Aperçu du contenu :**
${content.substring(0, 500)}${content.length > 500 ? '...\n\n[Contenu tronqué - Fichier accessible à l\'agent]' : ''}

🤖 **L'agent peut maintenant :**
• Analyser le contenu complet
• Répondre aux questions sur ce document
• Utiliser ces informations dans ses réponses
• Créer des workflows basés sur ce contenu
                `;
                
                // Stocker le contenu pour l'agent
                analysis.fullContent = content;
            } else if (fileData.type === 'image') {
                analysis.analysis = `
🖼️ **Analyse de l'image :**
• **Nom :** ${fileData.metadata.originalName}
• **Type :** ${fileData.metadata.mimeType}
• **Taille :** ${Math.round(fileData.metadata.size / 1024)} Ko

🤖 **L'agent peut maintenant :**
• Analyser cette image avec les modèles de vision
• Décrire le contenu de l'image
• Extraire du texte si présent (OCR)
• Utiliser l'image dans ses analyses
                `;
            } else {
                analysis.analysis = `
📎 **Fichier reçu :**
• **Nom :** ${fileData.metadata.originalName}
• **Type :** ${fileData.metadata.mimeType}
• **Taille :** ${Math.round(fileData.metadata.size / 1024)} Ko

ℹ️ **Note :** Ce type de fichier nécessite un traitement spécialisé. L'agent peut le référencer mais ne peut pas encore en analyser le contenu directement.
                `;
            }

            return analysis;
        } catch (error) {
            console.error('❌ Erreur analyse fichier:', error);
            throw error;
        }
    }
}

module.exports = new FileService();