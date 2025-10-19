/**
 * FileAgent - Sous-agent spécialisé dans la gestion et l'analyse de fichiers
 */

class FileAgent {
    constructor(config = {}) {
        this.config = config;
        this.filePersistence = config.filePersistence || null;
        console.log('📁 [FileAgent] Initialisé');
        
        if (!this.filePersistence) {
            console.warn('⚠️ [FileAgent] Aucune persistance configurée - utilisation de global.uploadedFiles (DÉPRÉCIÉ)');
        }
    }

    /**
     * Lister tous les fichiers uploadés
     */
    async listFiles() {
        console.log('📋 [FileAgent] Liste des fichiers...');
        
        // Utiliser la persistance SQLite si disponible
        let files;
        if (this.filePersistence) {
            const dbFiles = this.filePersistence.listFiles(null, 100);
            files = dbFiles.map(f => ({
                id: f.id,
                name: f.name,
                size: f.size,
                uploadedAt: f.uploadedAt,
                content: f.content, // Pour analyse
                type: this.detectFileType(f.name)
            }));
            console.log('✅ [FileAgent] Fichiers chargés depuis SQLite');
        } else {
            // Fallback sur global.uploadedFiles (déprécié)
            files = Object.values(global.uploadedFiles || {});
            console.warn('⚠️ [FileAgent] Fichiers chargés depuis mémoire (NON PERSISTANT)');
        }
        
        return {
            status: 'success',
            count: files.length,
            files: files.map(f => ({
                id: f.id,
                name: f.name,
                size: f.size,
                uploadedAt: f.uploadedAt,
                type: f.type || this.detectFileType(f.name)
            })),
            source: this.filePersistence ? 'sqlite-persistent' : 'memory-ephemeral'
        };
    }

    /**
     * Analyser les fichiers en profondeur
     */
    async analyzeFiles(files = []) {
        console.log(`🔍 [FileAgent] Analyse de ${files.length || 'tous les'} fichiers...`);
        
        // Si aucun fichier spécifié, analyser tous les fichiers uploadés
        if (!files || files.length === 0) {
            files = Object.values(global.uploadedFiles || {});
        }
        
        if (files.length === 0) {
            throw new Error('Aucun fichier à analyser. Uploadez d\'abord des fichiers !');
        }
        
        const analysis = {
            filesAnalyzed: files.length,
            totalSize: 0,
            types: new Set(),
            details: []
        };
        
        for (const file of files) {
            const fileAnalysis = {
                name: file.name,
                size: file.size,
                type: this.detectFileType(file.name),
                uploadedAt: file.uploadedAt,
                stats: {}
            };
            
            // Analyse du contenu
            if (file.content) {
                fileAnalysis.stats = {
                    chars: file.content.length,
                    words: file.content.split(/\s+/).filter(w => w.length > 0).length,
                    lines: file.content.split('\n').length
                };
                
                // Détection de langue/format
                if (fileAnalysis.type === 'json') {
                    try {
                        JSON.parse(file.content);
                        fileAnalysis.valid = true;
                    } catch (e) {
                        fileAnalysis.valid = false;
                        fileAnalysis.error = 'JSON invalide';
                    }
                }
                
                // Extraction de mots-clés
                fileAnalysis.keywords = this.extractKeywords(file.content);
            }
            
            analysis.totalSize += file.size;
            analysis.types.add(fileAnalysis.type);
            analysis.details.push(fileAnalysis);
        }
        
        // Génération d'insights
        const insights = this.generateInsights(analysis);
        
        return {
            status: 'success',
            filesAnalyzed: analysis.filesAnalyzed,
            totalSize: analysis.totalSize,
            types: Array.from(analysis.types),
            details: analysis.details,
            insights
        };
    }

    /**
     * Rechercher dans le contenu des fichiers
     */
    async searchInFiles(query) {
        console.log(`🔎 [FileAgent] Recherche: "${query}"`);
        
        const files = Object.values(global.uploadedFiles || {});
        
        if (files.length === 0) {
            throw new Error('Aucun fichier où chercher. Uploadez des fichiers d\'abord !');
        }
        
        const results = [];
        const searchTerm = query.toLowerCase();
        
        for (const file of files) {
            if (!file.content) continue;
            
            const content = file.content.toLowerCase();
            if (content.includes(searchTerm)) {
                // Trouver les occurrences
                const occurrences = this.findOccurrences(file.content, searchTerm);
                
                results.push({
                    file: file.name,
                    fileId: file.id,
                    occurrences: occurrences.length,
                    matches: occurrences.slice(0, 5) // Max 5 premiers résultats
                });
            }
        }
        
        return {
            status: 'success',
            query,
            filesSearched: files.length,
            filesMatched: results.length,
            results
        };
    }

    /**
     * Obtenir un fichier spécifique
     */
    async getFile(fileId) {
        console.log(`📄 [FileAgent] Récupération fichier: ${fileId}`);
        
        const file = global.uploadedFiles[fileId];
        
        if (!file) {
            throw new Error(`Fichier ${fileId} introuvable`);
        }
        
        return {
            status: 'success',
            file: {
                id: file.id,
                name: file.name,
                size: file.size,
                uploadedAt: file.uploadedAt,
                type: this.detectFileType(file.name),
                contentPreview: file.content ? file.content.substring(0, 500) : null
            }
        };
    }

    /**
     * Supprimer un fichier
     */
    async deleteFile(fileId) {
        console.log(`🗑️ [FileAgent] Suppression fichier: ${fileId}`);
        
        if (!global.uploadedFiles[fileId]) {
            throw new Error(`Fichier ${fileId} introuvable`);
        }
        
        const fileName = global.uploadedFiles[fileId].name;
        delete global.uploadedFiles[fileId];
        
        return {
            status: 'deleted',
            fileId,
            fileName,
            message: `Fichier "${fileName}" supprimé avec succès`
        };
    }

    // ========== HELPERS ==========

    /**
     * Détecter le type de fichier basé sur l'extension
     */
    detectFileType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        
        const types = {
            'txt': 'text',
            'md': 'markdown',
            'json': 'json',
            'xml': 'xml',
            'html': 'html',
            'css': 'css',
            'js': 'javascript',
            'ts': 'typescript',
            'py': 'python',
            'java': 'java',
            'c': 'c',
            'cpp': 'cpp',
            'pdf': 'pdf',
            'doc': 'word',
            'docx': 'word',
            'xls': 'excel',
            'xlsx': 'excel',
            'png': 'image',
            'jpg': 'image',
            'jpeg': 'image',
            'gif': 'image',
            'svg': 'image'
        };
        
        return types[ext] || 'unknown';
    }

    /**
     * Extraire les mots-clés d'un texte
     */
    extractKeywords(content, limit = 10) {
        // Mots vides à ignorer (stop words)
        const stopWords = new Set([
            'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'mais',
            'dans', 'sur', 'pour', 'par', 'avec', 'sans', 'est', 'sont', 'a', 'ont',
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
            'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had'
        ]);
        
        // Extraire les mots
        const words = content.toLowerCase()
            .split(/[^a-zàâçéèêëîïôûùüÿœæ0-9]+/)
            .filter(w => w.length > 3 && !stopWords.has(w));
        
        // Compter les occurrences
        const wordCount = {};
        words.forEach(word => {
            wordCount[word] = (wordCount[word] || 0) + 1;
        });
        
        // Trier par fréquence
        const sorted = Object.entries(wordCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([word, count]) => ({ word, count }));
        
        return sorted;
    }

    /**
     * Trouver les occurrences d'un terme dans un texte
     */
    findOccurrences(content, searchTerm) {
        const occurrences = [];
        const lines = content.split('\n');
        const searchLower = searchTerm.toLowerCase();
        
        lines.forEach((line, index) => {
            if (line.toLowerCase().includes(searchLower)) {
                occurrences.push({
                    line: index + 1,
                    text: line.trim().substring(0, 100)
                });
            }
        });
        
        return occurrences;
    }

    /**
     * Générer des insights sur l'analyse
     */
    generateInsights(analysis) {
        const insights = [];
        
        // Taille totale
        const sizeMB = (analysis.totalSize / (1024 * 1024)).toFixed(2);
        if (analysis.totalSize > 10 * 1024 * 1024) {
            insights.push(`⚠️ Volume important de données: ${sizeMB} MB`);
        } else {
            insights.push(`📊 Volume de données: ${sizeMB} MB`);
        }
        
        // Types de fichiers
        if (analysis.types.size > 1) {
            insights.push(`📂 ${analysis.types.size} types de fichiers différents détectés`);
        }
        
        // Fichiers avec erreurs
        const invalidFiles = analysis.details.filter(f => f.valid === false);
        if (invalidFiles.length > 0) {
            insights.push(`⚠️ ${invalidFiles.length} fichier(s) avec erreurs de format`);
        }
        
        // Taille moyenne
        const avgSize = (analysis.totalSize / analysis.filesAnalyzed).toFixed(0);
        insights.push(`📏 Taille moyenne par fichier: ${this.formatBytes(avgSize)}`);
        
        return insights.join('\n');
    }

    /**
     * Formater les bytes en format lisible
     */
    formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
}

module.exports = FileAgent;
