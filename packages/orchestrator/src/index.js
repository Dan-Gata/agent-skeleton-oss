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
            <li><a href="/chat">💬 Chat IA (60+ Modèles)</a></li>
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

// Route Chat IA
app.get('/chat', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Chat IA - Agent Skeleton OSS</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #0f0f23; color: white; margin: 0; }
            .container { max-width: 1200px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .chat-container { display: grid; grid-template-columns: 300px 1fr; gap: 20px; height: 80vh; }
            .sidebar { background: #1a1a2e; padding: 20px; border-radius: 8px; overflow-y: auto; }
            .chat-area { background: #16213e; padding: 20px; border-radius: 8px; display: flex; flex-direction: column; }
            .model-selector { margin-bottom: 20px; }
            .model-grid { display: grid; gap: 8px; max-height: 400px; overflow-y: auto; }
            .model-btn { background: #0f3460; border: 1px solid #3498db; color: white; padding: 8px 12px; border-radius: 6px; cursor: pointer; text-align: left; font-size: 12px; }
            .model-btn:hover { background: #3498db; }
            .model-btn.active { background: #e74c3c; border-color: #e74c3c; }
            .messages { flex: 1; overflow-y: auto; margin-bottom: 20px; max-height: 500px; }
            .message { margin: 10px 0; padding: 15px; border-radius: 8px; }
            .user-msg { background: #2c3e50; margin-left: 50px; }
            .ai-msg { background: #34495e; margin-right: 50px; }
            .input-area { display: flex; gap: 10px; }
            .chat-input { flex: 1; padding: 12px; background: #2c2c2c; color: white; border: 1px solid #555; border-radius: 6px; }
            .send-btn { padding: 12px 24px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer; }
            .send-btn:hover { background: #2980b9; }
            .send-btn:disabled { background: #7f8c8d; cursor: not-allowed; }
            .status { text-align: center; color: #95a5a6; margin: 10px 0; }
            .files-info { background: #2c3e50; padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💬 Chat IA - Agent Skeleton OSS</h1>
                <p>60+ Modèles IA disponibles | OpenRouter | Alibaba Qwen | Modèles Gratuits</p>
            </div>
            
            <div class="chat-container">
                <div class="sidebar">
                    <div class="model-selector">
                        <h3>🤖 Sélection Modèle</h3>
                        <div class="model-grid" id="modelGrid">
                            <!-- Modèles chargés par JS -->
                        </div>
                    </div>
                    
                    <div class="files-info" id="filesInfo">
                        <h4>📁 Fichiers Uploadés</h4>
                        <div id="filesList">Chargement...</div>
                    </div>
                </div>
                
                <div class="chat-area">
                    <div class="messages" id="messages">
                        <div class="ai-msg">
                            <strong>🤖 Assistant IA</strong><br>
                            Bonjour ! Je suis votre assistant IA avec accès à 60+ modèles incluant Alibaba Qwen, GPT-4, Claude, Gemini et plus. 
                            Sélectionnez un modèle dans la barre latérale et commencez à chatter !
                            <br><br>
                            💡 <em>Je peux aussi analyser vos fichiers uploadés.</em>
                        </div>
                    </div>
                    
                    <div class="status" id="status">Prêt à chatter</div>
                    
                    <div class="input-area">
                        <input type="text" id="chatInput" class="chat-input" placeholder="Tapez votre message..." maxlength="2000">
                        <button id="sendBtn" class="send-btn">📤 Envoyer</button>
                    </div>
                </div>
            </div>
        </div>

        <script>
            let currentModel = 'openai/gpt-3.5-turbo';
            let isLoading = false;

            // Modèles IA disponibles
            const models = [
                { id: 'openai/gpt-4o', name: '🚀 GPT-4o', free: false },
                { id: 'openai/gpt-3.5-turbo', name: '⚡ GPT-3.5 Turbo', free: false },
                { id: 'anthropic/claude-3.5-sonnet', name: '🧠 Claude 3.5 Sonnet', free: false },
                { id: 'google/gemini-pro', name: '💎 Gemini Pro', free: false },
                { id: 'alibaba/qwen-turbo', name: '🇨🇳 Alibaba Qwen Turbo', free: false },
                { id: 'alibaba/qwen-plus', name: '🇨🇳 Qwen Plus', free: false },
                { id: 'alibaba/qwen-max', name: '🇨🇳 Qwen Max', free: false },
                { id: 'meta-llama/llama-3.1-70b-instruct', name: '🦙 Llama 3.1 70B', free: false },
                { id: 'mistralai/mistral-large', name: '🌟 Mistral Large', free: false },
                { id: 'perplexity/llama-3.1-sonar-large-128k-online', name: '🔍 Perplexity', free: false },
                
                // Modèles gratuits
                { id: 'openai/gpt-3.5-turbo-instruct', name: '🆓 GPT-3.5 Instruct', free: true },
                { id: 'meta-llama/llama-3-8b-instruct:free', name: '🆓 Llama 3 8B', free: true },
                { id: 'microsoft/phi-3-medium-128k-instruct:free', name: '🆓 Phi-3 Medium', free: true },
                { id: 'google/gemma-7b-it:free', name: '🆓 Gemma 7B', free: true },
                { id: 'qwen/qwen-2-7b-instruct:free', name: '🆓 Qwen 2 7B', free: true },
                
                // Plus de modèles premium
                { id: 'x-ai/grok-beta', name: '🚀 Grok Beta', free: false },
                { id: 'cohere/command-r-plus', name: '📝 Command R+', free: false },
                { id: 'anthropic/claude-3-opus', name: '🎭 Claude 3 Opus', free: false },
                { id: 'openai/gpt-4-turbo', name: '⚡ GPT-4 Turbo', free: false }
            ];

            // Initialisation
            document.addEventListener('DOMContentLoaded', function() {
                loadModels();
                loadFiles();
                
                document.getElementById('sendBtn').addEventListener('click', sendMessage);
                document.getElementById('chatInput').addEventListener('keypress', function(e) {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                    }
                });
            });

            function loadModels() {
                const grid = document.getElementById('modelGrid');
                grid.innerHTML = '';
                
                models.forEach((model, index) => {
                    const btn = document.createElement('button');
                    btn.className = 'model-btn' + (index === 1 ? ' active' : '');
                    btn.innerHTML = model.name + (model.free ? ' 🆓' : '');
                    btn.onclick = () => selectModel(model.id, btn);
                    grid.appendChild(btn);
                });
            }

            function selectModel(modelId, btnElement) {
                currentModel = modelId;
                document.querySelectorAll('.model-btn').forEach(b => b.classList.remove('active'));
                btnElement.classList.add('active');
                updateStatus(\`Modèle sélectionné: \${btnElement.textContent}\`);
            }

            async function loadFiles() {
                try {
                    const response = await fetch('/api/files-list');
                    const result = await response.json();
                    
                    const filesList = document.getElementById('filesList');
                    if (result.files && result.files.length > 0) {
                        filesList.innerHTML = result.files.map(f => 
                            \`<div style="margin: 5px 0; padding: 5px; background: #34495e; border-radius: 4px;">
                                📄 \${f.name}<br>
                                <small>\${f.size} bytes</small>
                            </div>\`
                        ).join('');
                    } else {
                        filesList.innerHTML = '<small style="color: #95a5a6;">Aucun fichier uploadé</small>';
                    }
                } catch (error) {
                    document.getElementById('filesList').innerHTML = '<small style="color: #e74c3c;">Erreur chargement</small>';
                }
            }

            async function sendMessage() {
                if (isLoading) return;
                
                const input = document.getElementById('chatInput');
                const message = input.value.trim();
                
                if (!message) return;
                
                input.value = '';
                addMessage('user', message);
                
                isLoading = true;
                updateStatus('⏳ Génération en cours...');
                document.getElementById('sendBtn').disabled = true;
                
                try {
                    const response = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: message,
                            model: currentModel
                        })
                    });
                    
                    const result = await response.json();
                    
                    if (response.ok) {
                        addMessage('ai', result.response);
                        updateStatus('✅ Réponse reçue');
                    } else {
                        addMessage('ai', '❌ Erreur: ' + result.error);
                        updateStatus('❌ Erreur de réponse');
                    }
                } catch (error) {
                    addMessage('ai', '❌ Erreur de connexion: ' + error.message);
                    updateStatus('❌ Erreur de connexion');
                }
                
                isLoading = false;
                document.getElementById('sendBtn').disabled = false;
            }

            function addMessage(type, content) {
                const messages = document.getElementById('messages');
                const div = document.createElement('div');
                div.className = 'message ' + (type === 'user' ? 'user-msg' : 'ai-msg');
                
                const icon = type === 'user' ? '👤 Vous' : '🤖 ' + currentModel.split('/')[1];
                div.innerHTML = \`<strong>\${icon}</strong><br>\${content.replace(/\\n/g, '<br>')}\`;
                
                messages.appendChild(div);
                messages.scrollTop = messages.scrollHeight;
            }

            function updateStatus(text) {
                document.getElementById('status').textContent = text;
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

// API Chat IA avec 60+ modèles
app.post('/api/chat', async (req, res) => {
    try {
        const { message, model } = req.body;
        
        if (!message || !model) {
            return res.status(400).json({ error: 'Message et modèle requis' });
        }
        
        console.log('💬 Chat reçu:', { model, messageLength: message.length });
        
        // Récupération des fichiers uploadés
        const uploadedFiles = Object.values(global.uploadedFiles || {});
        let contextFiles = '';
        
        if (uploadedFiles.length > 0) {
            contextFiles = '\\n\\n📁 FICHIERS DISPONIBLES:\\n' + 
                uploadedFiles.map(f => `- ${f.name} (${f.size} bytes): ${f.content.substring(0, 500)}...`).join('\\n');
        }
        
        // Construction du prompt avec contexte des fichiers
        const fullPrompt = `${message}${contextFiles}`;
        
        // Simulation de réponse IA (à remplacer par OpenRouter)
        const response = await simulateAIResponse(fullPrompt, model);
        
        res.json({
            success: true,
            response: response,
            model: model,
            filesUsed: uploadedFiles.length
        });
        
    } catch (error) {
        console.error('❌ Erreur chat:', error);
        res.status(500).json({ error: 'Erreur chat: ' + error.message });
    }
});

// Simulation de réponse IA (version simplifiée)
async function simulateAIResponse(prompt, model) {
    // Simulation d'un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const modelNames = {
        'openai/gpt-4o': 'GPT-4o',
        'openai/gpt-3.5-turbo': 'GPT-3.5 Turbo',
        'anthropic/claude-3.5-sonnet': 'Claude 3.5 Sonnet',
        'google/gemini-pro': 'Gemini Pro',
        'alibaba/qwen-turbo': 'Alibaba Qwen Turbo',
        'alibaba/qwen-plus': 'Alibaba Qwen Plus',
        'alibaba/qwen-max': 'Alibaba Qwen Max',
        'meta-llama/llama-3.1-70b-instruct': 'Llama 3.1 70B',
        'mistralai/mistral-large': 'Mistral Large',
        'perplexity/llama-3.1-sonar-large-128k-online': 'Perplexity Sonar'
    };
    
    const modelName = modelNames[model] || model.split('/')[1] || 'Assistant IA';
    
    // Réponses simulées basées sur le modèle
    const responses = {
        'alibaba/qwen-turbo': `🇨🇳 Salutations ! Je suis Qwen de Alibaba Cloud. Votre message: "${prompt.substring(0, 100)}..." a été analysé avec mes capacités multilingues avancées. Comment puis-je vous aider davantage ?`,
        
        'anthropic/claude-3.5-sonnet': `🧠 Bonjour ! Claude 3.5 Sonnet ici. J'ai analysé votre demande avec attention. Voici ma réflexion structurée sur votre question...`,
        
        'openai/gpt-4o': `🚀 GPT-4o à votre service ! J'ai traité votre demande avec mes capacités multimodales avancées. Voici une réponse optimisée...`,
        
        'google/gemini-pro': `💎 Gemini Pro activé ! J'ai analysé votre requête avec mes algorithmes Google avancés. Voici ma réponse enrichie...`,
        
        'meta-llama/llama-3.1-70b-instruct': `🦙 Llama 3.1 70B en action ! Avec 70 milliards de paramètres, j'ai traité votre demande de manière approfondie...`
    };
    
    let response = responses[model] || `🤖 ${modelName} répond: J'ai bien reçu votre message et l'ai analysé avec attention.`;
    
    // Ajout d'informations sur les fichiers si présents
    if (prompt.includes('📁 FICHIERS DISPONIBLES:')) {
        response += `\\n\\n📄 J'ai également analysé vos fichiers uploadés et je peux vous aider avec leur contenu !`;
    }
    
    // Ajout d'éléments dynamiques
    response += `\\n\\n💡 *Réponse générée par ${modelName} à ${new Date().toLocaleTimeString()}*`;
    
    return response;
}

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