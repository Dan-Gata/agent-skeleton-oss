// Module d'upload et analyse de fichiers
const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { addFile, logAction } = require('./database');

// Dossier de stockage des fichiers
const UPLOAD_DIR = path.join(__dirname, '../uploads');

// Créer le dossier s'il n'existe pas
(async () => {
    try {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
        console.log('✅ Upload directory ready');
    } catch (error) {
        console.error('❌ Error creating upload directory:', error);
    }
})();

// Types de fichiers supportés
const SUPPORTED_TYPES = {
    'application/pdf': { ext: '.pdf', category: 'document' },
    'application/msword': { ext: '.doc', category: 'document' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: '.docx', category: 'document' },
    'text/plain': { ext: '.txt', category: 'text' },
    'text/csv': { ext: '.csv', category: 'data' },
    'application/json': { ext: '.json', category: 'data' },
    'image/jpeg': { ext: '.jpg', category: 'image' },
    'image/png': { ext: '.png', category: 'image' },
    'image/webp': { ext: '.webp', category: 'image' }
};

/**
 * Extraire le texte d'un fichier PDF
 */
async function extractTextFromPDF(filePath) {
    try {
        const dataBuffer = await fs.readFile(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } catch (error) {
        console.error('Erreur extraction PDF:', error.message);
        return null;
    }
}

/**
 * Extraire le texte d'un fichier Word (.docx)
 */
async function extractTextFromWord(filePath) {
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    } catch (error) {
        console.error('Erreur extraction Word:', error.message);
        return null;
    }
}

/**
 * Extraire le texte d'un fichier texte brut
 */
async function extractTextFromPlainText(filePath) {
    try {
        return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
        console.error('Erreur lecture fichier texte:', error.message);
        return null;
    }
}

/**
 * Analyser un fichier et extraire son contenu
 */
async function analyzeFile(filePath, fileType) {
    console.log(`[${new Date().toISOString()}] [file-analysis] Analyse de ${path.basename(filePath)} (${fileType})`);
    
    let extractedText = null;
    
    try {
        switch (fileType) {
            case 'application/pdf':
                extractedText = await extractTextFromPDF(filePath);
                break;
                
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                extractedText = await extractTextFromWord(filePath);
                break;
                
            case 'text/plain':
            case 'text/csv':
            case 'application/json':
                extractedText = await extractTextFromPlainText(filePath);
                break;
                
            case 'image/jpeg':
            case 'image/png':
            case 'image/webp':
                extractedText = '[Image - Analyse visuelle disponible via GPT-4 Vision ou Gemini Pro Vision]';
                break;
                
            default:
                extractedText = '[Type de fichier non supporté pour l\'extraction de texte]';
        }
        
        console.log(`[${new Date().toISOString()}] [file-analysis] ✅ Analyse terminée (${extractedText ? extractedText.length : 0} caractères extraits)`);
        
        return extractedText;
        
    } catch (error) {
        console.error(`[${new Date().toISOString()}] [file-analysis] ❌ Erreur:`, error.message);
        return null;
    }
}

/**
 * Sauvegarder un fichier uploadé et l'analyser
 */
async function saveUploadedFile(userId, conversationId, file) {
    try {
        const timestamp = Date.now();
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${timestamp}_${sanitizedName}`;
        const filePath = path.join(UPLOAD_DIR, filename);
        
        // Sauvegarder le fichier
        await fs.writeFile(filePath, file.buffer);
        
        console.log(`[${new Date().toISOString()}] [file-upload] Fichier sauvegardé: ${filename}`);
        
        // Analyser le contenu
        const extractedText = await analyzeFile(filePath, file.mimetype);
        
        // Enregistrer dans la base de données
        const result = addFile.run(
            userId,
            conversationId,
            filename,
            file.originalname,
            filePath,
            file.mimetype,
            file.size,
            extractedText
        );
        
        // Logger l'action
        logAction.run(userId, 'upload', JSON.stringify({
            filename: file.originalname,
            size: file.size,
            type: file.mimetype
        }), true, null);
        
        return {
            success: true,
            fileId: result.lastInsertRowid,
            filename: file.originalname,
            extractedText: extractedText,
            fileSize: file.size,
            fileType: file.mimetype
        };
        
    } catch (error) {
        console.error(`[${new Date().toISOString()}] [file-upload] ❌ Erreur:`, error.message);
        
        // Logger l'erreur
        logAction.run(userId, 'upload', JSON.stringify({
            filename: file.originalname,
            error: error.message
        }), false, error.message);
        
        throw error;
    }
}

/**
 * Récupérer le contenu extrait d'un fichier
 */
async function getFileContent(fileId) {
    const { getFileById } = require('./database');
    const file = getFileById.get(fileId);
    
    if (!file) {
        throw new Error('Fichier non trouvé');
    }
    
    return {
        id: file.id,
        filename: file.original_name,
        fileType: file.file_type,
        fileSize: file.file_size,
        extractedText: file.extracted_text,
        createdAt: file.created_at
    };
}

/**
 * Vérifier si un type de fichier est supporté
 */
function isFileTypeSupported(mimetype) {
    return mimetype in SUPPORTED_TYPES;
}

/**
 * Obtenir les statistiques d'upload pour un utilisateur
 */
function getUserUploadStats(userId) {
    const { getUserFiles } = require('./database');
    const files = getUserFiles.all(userId, 1000); // Récupérer tous les fichiers
    
    const stats = {
        totalFiles: files.length,
        totalSize: files.reduce((sum, file) => sum + file.file_size, 0),
        byType: {}
    };
    
    files.forEach(file => {
        const category = SUPPORTED_TYPES[file.file_type]?.category || 'other';
        stats.byType[category] = (stats.byType[category] || 0) + 1;
    });
    
    return stats;
}

module.exports = {
    saveUploadedFile,
    analyzeFile,
    getFileContent,
    isFileTypeSupported,
    getUserUploadStats,
    SUPPORTED_TYPES
};
