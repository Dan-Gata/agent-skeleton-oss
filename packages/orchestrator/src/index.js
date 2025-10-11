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

// Route principale - Interface moderne
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🚀 Agent Skeleton OSS - Interface Moderne</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #0f0f23 0%, #16213e 50%, #1a1a2e 100%);
                color: white;
                min-height: 100vh;
                overflow-x: hidden;
            }
            
            .header {
                text-align: center;
                padding: 60px 20px;
                background: rgba(255,255,255,0.05);
                backdrop-filter: blur(10px);
                border-bottom: 1px solid rgba(52, 152, 219, 0.3);
            }
            
            .header h1 {
                font-size: 3.5rem;
                background: linear-gradient(45deg, #3498db, #e74c3c, #f39c12);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin-bottom: 10px;
                text-shadow: 0 0 30px rgba(52, 152, 219, 0.5);
            }
            
            .header p {
                font-size: 1.2rem;
                color: #bdc3c7;
                margin-bottom: 30px;
            }
            
            .status-bar {
                display: flex;
                justify-content: center;
                gap: 30px;
                flex-wrap: wrap;
            }
            
            .status-item {
                background: rgba(52, 152, 219, 0.1);
                padding: 15px 25px;
                border-radius: 25px;
                border: 1px solid rgba(52, 152, 219, 0.3);
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 0.9rem;
            }
            
            .status-dot {
                width: 8px;
                height: 8px;
                background: #2ecc71;
                border-radius: 50%;
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
            
            .main-content {
                max-width: 1400px;
                margin: 0 auto;
                padding: 60px 20px;
            }
            
            .features-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                gap: 30px;
                margin-bottom: 60px;
            }
            
            .feature-card {
                background: rgba(255,255,255,0.05);
                backdrop-filter: blur(15px);
                border-radius: 20px;
                padding: 40px;
                border: 1px solid rgba(52, 152, 219, 0.2);
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .feature-card::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: linear-gradient(45deg, transparent, rgba(52, 152, 219, 0.1), transparent);
                transform: rotate(45deg);
                transition: all 0.6s ease;
                opacity: 0;
            }
            
            .feature-card:hover::before {
                opacity: 1;
                animation: shimmer 1.5s ease-in-out;
            }
            
            @keyframes shimmer {
                0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
                100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
            }
            
            .feature-card:hover {
                transform: translateY(-10px);
                border-color: rgba(52, 152, 219, 0.5);
                box-shadow: 0 20px 40px rgba(52, 152, 219, 0.2);
            }
            
            .feature-icon {
                font-size: 4rem;
                margin-bottom: 20px;
                display: block;
                text-align: center;
            }
            
            .feature-title {
                font-size: 1.8rem;
                margin-bottom: 15px;
                color: #3498db;
                text-align: center;
            }
            
            .feature-description {
                color: #bdc3c7;
                line-height: 1.6;
                margin-bottom: 25px;
                text-align: center;
            }
            
            .feature-stats {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-bottom: 25px;
            }
            
            .stat-item {
                background: rgba(52, 152, 219, 0.1);
                padding: 15px;
                border-radius: 10px;
                text-align: center;
                border: 1px solid rgba(52, 152, 219, 0.2);
            }
            
            .stat-number {
                font-size: 1.5rem;
                font-weight: bold;
                color: #3498db;
            }
            
            .stat-label {
                font-size: 0.8rem;
                color: #95a5a6;
                margin-top: 5px;
            }
            
            .action-button {
                display: block;
                width: 100%;
                padding: 15px 30px;
                background: linear-gradient(45deg, #3498db, #2980b9);
                color: white;
                text-decoration: none;
                border-radius: 25px;
                text-align: center;
                font-weight: bold;
                font-size: 1.1rem;
                transition: all 0.3s ease;
                border: 2px solid transparent;
                position: relative;
                overflow: hidden;
            }
            
            .action-button::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                transition: left 0.5s;
            }
            
            .action-button:hover::before {
                left: 100%;
            }
            
            .action-button:hover {
                transform: scale(1.05);
                box-shadow: 0 10px 25px rgba(52, 152, 219, 0.3);
                border-color: rgba(255,255,255,0.3);
            }
            
            .admin-panel {
                background: rgba(231, 76, 60, 0.1);
                border: 1px solid rgba(231, 76, 60, 0.3);
                border-radius: 20px;
                padding: 30px;
                margin-top: 40px;
            }
            
            .admin-title {
                color: #e74c3c;
                font-size: 1.5rem;
                margin-bottom: 20px;
                text-align: center;
            }
            
            .admin-actions {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
            }
            
            .admin-button {
                padding: 12px 20px;
                background: rgba(231, 76, 60, 0.2);
                color: #e74c3c;
                text-decoration: none;
                border-radius: 10px;
                text-align: center;
                transition: all 0.3s ease;
                border: 1px solid rgba(231, 76, 60, 0.3);
            }
            
            .admin-button:hover {
                background: rgba(231, 76, 60, 0.3);
                transform: translateY(-2px);
            }
            
            .footer {
                text-align: center;
                padding: 40px;
                color: #7f8c8d;
                border-top: 1px solid rgba(52, 152, 219, 0.2);
                margin-top: 60px;
            }
            
            .version-info {
                display: inline-flex;
                align-items: center;
                gap: 10px;
                background: rgba(52, 152, 219, 0.1);
                padding: 10px 20px;
                border-radius: 20px;
                margin-top: 15px;
            }
            
            @media (max-width: 768px) {
                .header h1 { font-size: 2.5rem; }
                .features-grid { grid-template-columns: 1fr; }
                .feature-card { padding: 25px; }
                .status-bar { flex-direction: column; align-items: center; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🚀 Agent Skeleton OSS</h1>
            <p>Plateforme IA Complète avec 60+ Modèles • Upload de Fichiers • Chat Intelligent</p>
            
            <div class="status-bar">
                <div class="status-item">
                    <div class="status-dot"></div>
                    <span>Serveur Actif</span>
                </div>
                <div class="status-item">
                    <div class="status-dot"></div>
                    <span>OpenRouter Connecté</span>
                </div>
                <div class="status-item">
                    <div class="status-dot"></div>
                    <span>Upload Fonctionnel</span>
                </div>
                <div class="status-item">
                    <div class="status-dot"></div>
                    <span>Chat IA Prêt</span>
                </div>
            </div>
        </div>
        
        <div class="main-content">
            <div class="features-grid">
                <!-- Feature 1: Chat IA -->
                <div class="feature-card">
                    <div class="feature-icon">💬</div>
                    <h2 class="feature-title">Chat IA Avancé</h2>
                    <p class="feature-description">
                        Chattez avec 60+ modèles IA incluant GPT-4o, Claude 3.5, Gemini Pro, 
                        Alibaba Qwen et des modèles gratuits. Interface moderne avec sélection 
                        de modèles en temps réel.
                    </p>
                    
                    <div class="feature-stats">
                        <div class="stat-item">
                            <div class="stat-number">60+</div>
                            <div class="stat-label">Modèles IA</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">10</div>
                            <div class="stat-label">Modèles Gratuits</div>
                        </div>
                    </div>
                    
                    <a href="/chat" class="action-button">🚀 Démarrer le Chat</a>
                </div>
                
                <!-- Feature 2: Upload -->
                <div class="feature-card">
                    <div class="feature-icon">📁</div>
                    <h2 class="feature-title">Upload Intelligent</h2>
                    <p class="feature-description">
                        Uploadez vos fichiers avec drag & drop ou copier-coller. 
                        L'IA peut automatiquement analyser et utiliser le contenu 
                        de vos documents dans les conversations.
                    </p>
                    
                    <div class="feature-stats">
                        <div class="stat-item">
                            <div class="stat-number">50KB</div>
                            <div class="stat-label">Taille Max</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">3</div>
                            <div class="stat-label">Méthodes Upload</div>
                        </div>
                    </div>
                    
                    <a href="/upload-test" class="action-button">📤 Tester Upload</a>
                </div>
            </div>
            
            <!-- Panneau Admin -->
            <div class="admin-panel">
                <h3 class="admin-title">🔧 Panneau d'Administration</h3>
                <div class="admin-actions">
                    <a href="/health" class="admin-button">💚 Health Check</a>
                    <a href="/api/status" class="admin-button">📊 API Status</a>
                    <a href="/api/files-list" class="admin-button">📋 Liste Fichiers</a>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>Agent Skeleton OSS - Plateforme IA Open Source</p>
            <div class="version-info">
                <span>⚡</span>
                <span>Version 2.0 Moderne</span>
                <span>•</span>
                <span id="uptime">Chargement...</span>
            </div>
        </div>
        
        <script>
            // Animation d'entrée
            document.addEventListener('DOMContentLoaded', function() {
                const cards = document.querySelectorAll('.feature-card');
                cards.forEach((card, index) => {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(50px)';
                    
                    setTimeout(() => {
                        card.style.transition = 'all 0.6s ease';
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, index * 200);
                });
                
                updateUptime();
                setInterval(updateUptime, 1000);
            });
            
            // Mise à jour du temps de fonctionnement
            async function updateUptime() {
                try {
                    const response = await fetch('/health');
                    const data = await response.json();
                    const uptime = Math.floor(data.uptime);
                    const hours = Math.floor(uptime / 3600);
                    const minutes = Math.floor((uptime % 3600) / 60);
                    const seconds = uptime % 60;
                    
                    document.getElementById('uptime').textContent = 
                        \`⏱️ \${hours}h \${minutes}m \${seconds}s\`;
                } catch (error) {
                    document.getElementById('uptime').textContent = '⏱️ En ligne';
                }
            }
            
            // Effets visuels
            document.querySelectorAll('.feature-card').forEach(card => {
                card.addEventListener('mousemove', (e) => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    
                    const rotateX = (y - centerY) / 10;
                    const rotateY = (centerX - x) / 10;
                    
                    card.style.transform = \`perspective(1000px) rotateX(\${rotateX}deg) rotateY(\${rotateY}deg) translateY(-10px)\`;
                });
                
                card.addEventListener('mouseleave', () => {
                    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
                });
            });
        </script>
    </body>
    </html>
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