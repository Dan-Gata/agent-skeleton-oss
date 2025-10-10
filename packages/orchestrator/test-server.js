// Version simplifiée pour test - Agent Skeleton OSS
const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Configuration EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Middleware simple
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// Route de test simple
app.get('/test', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Test Agent Skeleton OSS</title>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #0a0e27; color: white; }
            .container { max-width: 800px; margin: 0 auto; }
            .models { margin: 20px 0; }
            select { padding: 10px; margin: 10px; width: 300px; }
            .file-area { border: 2px dashed #3b82f6; padding: 40px; margin: 20px 0; text-align: center; }
            .buttons { display: flex; gap: 10px; align-items: center; }
            button { padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; }
            .file-btn { background: #10b981; color: white; }
            .send-btn { background: #3b82f6; color: white; }
            textarea { width: 100%; padding: 15px; border-radius: 8px; border: 1px solid #333; background: #1a1a1a; color: white; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 Agent Skeleton OSS - Version Test</h1>
            
            <div class="models">
                <label>Sélectionnez un modèle IA :</label>
                <select id="modelSelect">
                    <!-- OpenAI Models -->
                    <option value="gpt-4o-mini">GPT-4o Mini (OpenAI)</option>
                    <option value="gpt-4o">GPT-4o (OpenAI)</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo (OpenAI)</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo (OpenAI)</option>
                    
                    <!-- Anthropic Models -->
                    <option value="claude-3.5-sonnet">Claude 3.5 Sonnet (Anthropic)</option>
                    <option value="claude-3-haiku">Claude 3 Haiku (Anthropic)</option>
                    <option value="claude-3-opus">Claude 3 Opus (Anthropic)</option>
                    
                    <!-- Google Models -->
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash (Google)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Google)</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Google)</option>
                    
                    <!-- xAI Models -->
                    <option value="grok-beta">Grok Beta (xAI)</option>
                    <option value="grok-2">Grok 2 (xAI)</option>
                    
                    <!-- Meta Llama Models -->
                    <option value="llama-3.2-90b">Llama 3.2 90B (Meta)</option>
                    <option value="llama-3.2-11b">Llama 3.2 11B (Meta)</option>
                    <option value="llama-3.1-70b">Llama 3.1 70B (Meta)</option>
                    <option value="llama-3.1-8b">Llama 3.1 8B (Meta)</option>
                    
                    <!-- Mistral Models -->
                    <option value="mistral-large">Mistral Large (Mistral AI)</option>
                    <option value="mistral-medium">Mistral Medium (Mistral AI)</option>
                    <option value="mistral-small">Mistral Small (Mistral AI)</option>
                    <option value="mixtral-8x7b">Mixtral 8x7B (Mistral AI)</option>
                    
                    <!-- Alibaba Models -->
                    <option value="qwen-2.5-72b">Qwen 2.5 72B (Alibaba)</option>
                    <option value="qwen-2.5-32b">Qwen 2.5 32B (Alibaba)</option>
                    <option value="qwen-2.5-14b">Qwen 2.5 14B (Alibaba)</option>
                    <option value="qwen-2.5-7b">Qwen 2.5 7B (Alibaba)</option>
                    <option value="qwen-2.5-coder-32b">Qwen 2.5 Coder 32B (Alibaba)</option>
                    <option value="qwen-2-vl-72b">Qwen 2 VL 72B (Alibaba Vision)</option>
                    
                    <!-- Cohere Models -->
                    <option value="command-r-plus">Command R+ (Cohere)</option>
                    <option value="command-r">Command R (Cohere)</option>
                    
                    <!-- Perplexity Models -->
                    <option value="llama-3.1-sonar-large">Sonar Large (Perplexity)</option>
                    <option value="llama-3.1-sonar-small">Sonar Small (Perplexity)</option>
                    
                    <!-- Free Models -->
                    <option value="llama-3.2-3b-free">🆓 Llama 3.2 3B (Free)</option>
                    <option value="llama-3.1-8b-free">🆓 Llama 3.1 8B (Free)</option>
                    <option value="gemma-2-9b-free">🆓 Gemma 2 9B (Free)</option>
                    <option value="gemma-2-2b-free">🆓 Gemma 2 2B (Free)</option>
                    <option value="phi-3-mini-free">🆓 Phi-3 Mini (Free)</option>
                    <option value="mistral-7b-free">🆓 Mistral 7B (Free)</option>
                    <option value="qwen-2.5-7b-free">🆓 Qwen 2.5 7B (Free)</option>
                    
                    <!-- Open Source Models -->
                    <option value="deepseek-coder-33b">DeepSeek Coder 33B</option>
                    <option value="codellama-34b">CodeLlama 34B (Meta)</option>
                    <option value="yi-34b">Yi 34B (01.AI)</option>
                    <option value="openchat-7b">OpenChat 7B</option>
                    <option value="zephyr-7b">Zephyr 7B</option>
                </select>
            </div>

            <div class="file-area">
                <h3>📁 Zone de téléchargement de fichiers</h3>
                <p>Glissez-déposez vos fichiers ici ou cliquez pour sélectionner</p>
                <input type="file" id="fileInput" accept=".txt,.md,.json,.csv,.pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx" style="margin: 10px;">
                <p><strong>Formats supportés :</strong> TXT, MD, JSON, CSV, PDF, Images, DOCX, XLSX (max 10MB)</p>
            </div>

            <div style="position: relative;">
                <textarea id="messageInput" placeholder="Tapez votre message ici..." rows="3"></textarea>
                <div class="buttons" style="margin-top: 10px;">
                    <button class="file-btn" onclick="document.getElementById('fileInput').click()">
                        📎 Télécharger un fichier
                    </button>
                    <button class="send-btn" onclick="sendMessage()">
                        📤 Envoyer le message
                    </button>
                </div>
            </div>

            <div id="messages" style="margin-top: 30px; padding: 20px; background: #1a1a1a; border-radius: 8px;">
                <h3>💬 Messages</h3>
                <div id="messageList"></div>
            </div>
        </div>

        <script>
            function sendMessage() {
                const input = document.getElementById('messageInput');
                const select = document.getElementById('modelSelect');
                const messageList = document.getElementById('messageList');
                
                if (input.value.trim()) {
                    const message = document.createElement('div');
                    message.style.cssText = 'margin: 10px 0; padding: 10px; background: #2a2a2a; border-radius: 6px;';
                    message.innerHTML = \`
                        <strong>Vous (\${select.options[select.selectedIndex].text}):</strong><br>
                        \${input.value}<br><br>
                        <strong>Agent:</strong><br>
                        <em>🤖 \${select.value} activé ! Je traite votre demande avec mes nouvelles capacités étendues. 
                        Les fichiers téléchargés sont maintenant intégrés dans ma mémoire et je peux les utiliser pour répondre à vos questions !</em>
                    \`;
                    messageList.appendChild(message);
                    input.value = '';
                    messageList.scrollTop = messageList.scrollHeight;
                }
            }

            document.getElementById('messageInput').addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });

            document.getElementById('fileInput').addEventListener('change', function(e) {
                if (e.target.files.length > 0) {
                    const file = e.target.files[0];
                    const messageList = document.getElementById('messageList');
                    const message = document.createElement('div');
                    message.style.cssText = 'margin: 10px 0; padding: 10px; background: #2a2a2a; border-radius: 6px; border-left: 4px solid #10b981;';
                    message.innerHTML = \`
                        <strong>📁 Fichier téléchargé :</strong><br>
                        \${file.name} (\${Math.round(file.size/1024)} KB)<br><br>
                        <em>✅ Fichier analysé et intégré dans la mémoire de l'agent ! 
                        Vous pouvez maintenant poser des questions sur ce document.</em>
                    \`;
                    messageList.appendChild(message);
                    messageList.scrollTop = messageList.scrollHeight;
                }
            });
        </script>
    </body>
    </html>
    `);
});

app.listen(port, () => {
    console.log(`🧪 Version TEST démarrée sur http://localhost:${port}/test`);
});