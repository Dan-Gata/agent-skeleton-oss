// Version simplifiée pour déploiement Coolify - Agent Skeleton OSS
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const port = process.env.PORT || 3000;

// Configuration basique
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.raw({ type: '*/*', limit: '10mb' }));

// Configuration EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Stockage temporaire en mémoire
global.uploadedFiles = {};
global.conversations = {};

// Route principale
app.get('/', (req, res) => {
    res.send(`
        <h1>🚀 Agent Skeleton OSS - Version Simplifiée</h1>
        <p>Application démarrée avec succès !</p>
        <ul>
            <li><a href="/upload-test">🔧 Test Upload</a></li>
            <li><a href="/health">💚 Health Check</a></li>
            <li><a href="/api/status">📊 API Status</a></li>
        </ul>
    `);
});

// Route de test d'upload ultra-simple
app.get('/upload-test', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Test Upload Simple</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #1a1a2e; color: white; }
            .container { max-width: 600px; margin: 0 auto; }
            .upload-area { border: 2px dashed #3498db; padding: 30px; margin: 20px 0; text-align: center; border-radius: 8px; }
            button { padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; background: #3498db; color: white; margin: 10px; }
            .result { margin: 20px 0; padding: 15px; background: #2c2c2c; border-radius: 6px; }
            textarea { width: 100%; height: 150px; margin: 10px 0; padding: 10px; background: #333; color: white; border: 1px solid #555; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔧 Test Upload Simplifié</h1>
            
            <div class="upload-area">
                <h3>📁 Upload Fichier</h3>
                <input type="file" id="fileInput">
                <br><br>
                <button onclick="uploadFile()">📤 Upload</button>
            </div>
            
            <div>
                <h3>📝 Upload Texte Direct</h3>
                <textarea id="textInput" placeholder="Collez votre texte ici..."></textarea>
                <button onclick="uploadText()">📝 Upload Texte</button>
            </div>
            
            <button onclick="listFiles()">📋 Liste Fichiers</button>
            
            <div id="result" class="result" style="display: none;">
                <div id="resultContent"></div>
            </div>
        </div>

        <script>
            async function uploadFile() {
                const file = document.getElementById('fileInput').files[0];
                if (!file) { alert('Sélectionnez un fichier'); return; }
                
                showResult('⏳ Upload en cours...');
                
                try {
                    const response = await fetch('/api/upload-simple', {
                        method: 'POST',
                        headers: { 'X-Filename': file.name },
                        body: file
                    });
                    
                    const result = await response.json();
                    
                    if (response.ok) {
                        showResult(\`✅ Succès !<br>Fichier: \${result.fileName}<br>ID: \${result.fileId}<br>Taille: \${result.size} bytes\`);
                    } else {
                        showResult(\`❌ Erreur: \${result.error}\`);
                    }
                } catch (error) {
                    showResult(\`❌ Erreur: \${error.message}\`);
                }
            }
            
            async function uploadText() {
                const text = document.getElementById('textInput').value;
                if (!text.trim()) { alert('Saisissez du texte'); return; }
                
                showResult('⏳ Upload texte...');
                
                try {
                    const response = await fetch('/api/upload-simple', {
                        method: 'POST',
                        headers: { 'X-Filename': 'texte.txt' },
                        body: text
                    });
                    
                    const result = await response.json();
                    
                    if (response.ok) {
                        showResult(\`✅ Texte uploadé !<br>ID: \${result.fileId}<br>Taille: \${result.size} caractères\`);
                    } else {
                        showResult(\`❌ Erreur: \${result.error}\`);
                    }
                } catch (error) {
                    showResult(\`❌ Erreur: \${error.message}\`);
                }
            }
            
            async function listFiles() {
                try {
                    const response = await fetch('/api/files-list');
                    const result = await response.json();
                    
                    let html = \`<h4>📋 Fichiers (\${result.count})</h4>\`;
                    result.files.forEach(f => {
                        html += \`<div style="border: 1px solid #555; margin: 5px 0; padding: 10px;">
                            <strong>\${f.name}</strong> - \${f.size} bytes<br>
                            <small>\${f.uploadedAt}</small>
                        </div>\`;
                    });
                    
                    showResult(html);
                } catch (error) {
                    showResult(\`❌ Erreur liste: \${error.message}\`);
                }
            }
            
            function showResult(html) {
                document.getElementById('resultContent').innerHTML = html;
                document.getElementById('result').style.display = 'block';
            }
        </script>
    </body>
    </html>
    `);
});

// API Upload ultra-simple
app.post('/api/upload-simple', (req, res) => {
    try {
        console.log('📁 Upload reçu - Headers:', req.headers);
        
        if (!req.body || req.body.length === 0) {
            return res.status(400).json({ error: 'Aucun contenu reçu' });
        }
        
        const fileId = Date.now().toString();
        const fileName = req.headers['x-filename'] || 'fichier_inconnu.txt';
        const content = req.body.toString('utf8').substring(0, 50000); // Max 50KB
        
        // Stockage en mémoire
        global.uploadedFiles[fileId] = {
            id: fileId,
            name: fileName,
            content: content,
            size: req.body.length,
            uploadedAt: new Date().toISOString()
        };
        
        console.log('✅ Fichier stocké:', fileName, req.body.length, 'bytes');
        
        res.json({
            success: true,
            fileId: fileId,
            fileName: fileName,
            size: req.body.length,
            message: 'Fichier uploadé avec succès !'
        });
        
    } catch (error) {
        console.error('❌ Erreur upload:', error);
        res.status(500).json({ error: 'Erreur upload: ' + error.message });
    }
});

// Liste des fichiers
app.get('/api/files-list', (req, res) => {
    try {
        const files = Object.values(global.uploadedFiles || {});
        res.json({ 
            files: files.map(f => ({ 
                id: f.id, 
                name: f.name, 
                size: f.size, 
                uploadedAt: f.uploadedAt 
            })), 
            count: files.length 
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur liste' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0-simple',
        uptime: process.uptime()
    });
});

// API Status
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        version: '1.0.0-simple',
        environment: process.env.NODE_ENV || 'production',
        filesUploaded: Object.keys(global.uploadedFiles || {}).length
    });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error('Erreur:', err);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
});

// 404
app.use((req, res) => {
    res.status(404).json({ error: 'Route non trouvée' });
});

// Démarrage
app.listen(port, () => {
    console.log(`🚀 Agent Skeleton OSS (Simple) démarré sur le port ${port}`);
    console.log(`🌐 Interface: http://localhost:${port}`);
    console.log(`🔧 Test Upload: http://localhost:${port}/upload-test`);
    console.log(`💚 Health: http://localhost:${port}/health`);
});

module.exports = app;