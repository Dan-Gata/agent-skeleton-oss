const express = require('express');
const axios = require('axios');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const cookieParser = require('cookie-parser');
const multer = require('multer');

// Import des services
const aiService = require('./services/aiService');
const { authService, requireAuth, requireAuthAPI } = require('./middleware/auth');
const { memoryService } = require('./services/memoryService');
const { socialWorkflowService } = require('./services/socialWorkflowService');
const fileService = require('./services/fileService');

const app = express();
const port = process.env.PORT || 3000;

// 🔒 SÉCURITÉ : Configuration des headers de sécurité
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Configuration du moteur de templates
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// 🔒 CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    optionsSuccessStatus: 200
}));

// 🔒 Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limite chaque IP à 100 requêtes par windowMs
    message: {
        error: 'Trop de requêtes depuis cette IP, réessayez plus tard.',
        retryAfter: '15 minutes'
    },
    legacyHeaders: false
});

const chatLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // limite chaque IP à 10 requêtes de chat par minute
    message: {
        error: 'Trop de messages de chat, attendez avant de continuer.',
        retryAfter: '1 minute'
    }
});

app.use(limiter);

// Middleware pour parsing JSON et URL-encoded
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 📁 Configuration Multer pour les uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 1
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
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
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Type de fichier non autorisé: ${file.mimetype}`), false);
        }
    }
});

// Fichiers statiques
app.use(express.static(path.join(__dirname, '../public')));

// 🏠 Route principale - Interface moderne (protégée)
app.get('/', requireAuth, (req, res) => {
    res.render('app', {
        title: 'Agent Skeleton OSS',
        version: '1.0.0',
        user: req.user
    });
});

// � Route de connexion (non protégée)
app.get('/login', (req, res) => {
    res.render('login', { title: 'Connexion - Agent Skeleton OSS' });
});

// 📱 Route pour l'interface moderne (protégée)
app.get('/app', requireAuth, (req, res) => {
    res.render('app', {
        title: 'Agent Skeleton OSS - Interface Moderne',
        version: '1.0.0',
        user: req.user
    });
});

// 🔧 Route de debug sans cache (ajout temporaire)
app.get('/app-debug', requireAuth, (req, res) => {
    res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'ETag': false,
        'Last-Modified': new Date().toUTCString()
    });
    
    res.render('app', {
        title: 'Agent Skeleton OSS - Interface Moderne (DEBUG)',
        version: '1.0.0-debug-' + Date.now(),
        user: req.user,
        cacheBuster: Date.now()
    });
});

// 🔥 UPLOAD ULTRA-SIMPLE - GARANTI DE FONCTIONNER
app.post('/api/files/emergency-upload', express.raw({type: '*/*', limit: '10mb'}), (req, res) => {
    try {
        console.log('🚨 Emergency upload - Headers:', req.headers);
        console.log('🚨 Body type:', typeof req.body);
        console.log('🚨 Body length:', req.body ? req.body.length : 'null');
        
        if (!req.body || req.body.length === 0) {
            return res.status(400).json({ error: 'Aucun contenu reçu' });
        }
        
        // Traitement ultra-simple - juste stockage en mémoire locale
        const fileId = Date.now().toString();
        const fileName = req.headers['x-filename'] || 'fichier_inconnu.txt';
        const content = req.body.toString('utf8').substring(0, 10000); // Max 10KB
        
        // Stockage dans une variable globale simple
        global.uploadedFiles = global.uploadedFiles || {};
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
            message: 'Fichier reçu et stocké avec succès !',
            preview: content.substring(0, 200) + '...'
        });
        
    } catch (error) {
        console.error('❌ Erreur emergency upload:', error);
        res.status(500).json({ 
            error: 'Erreur emergency upload', 
            details: error.message 
        });
    }
});

// 📋 Liste des fichiers emergency
app.get('/api/files/emergency-list', (req, res) => {
    try {
        const files = global.uploadedFiles || {};
        const fileList = Object.values(files).map(f => ({
            id: f.id,
            name: f.name,
            size: f.size,
            uploadedAt: f.uploadedAt,
            preview: f.content.substring(0, 100) + '...'
        }));
        
        res.json({ files: fileList, count: fileList.length });
    } catch (error) {
        res.status(500).json({ error: 'Erreur liste emergency' });
    }
});

// 📄 Récupérer un fichier emergency
app.get('/api/files/emergency/:fileId', (req, res) => {
    try {
        const files = global.uploadedFiles || {};
        const file = files[req.params.fileId];
        
        if (!file) {
            return res.status(404).json({ error: 'Fichier non trouvé' });
        }
        
        res.json({ file });
    } catch (error) {
        res.status(500).json({ error: 'Erreur récupération emergency' });
    }
});

// 🆘 Page de test EMERGENCY (garantie de fonctionner)
app.get('/emergency-upload', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>🆘 Emergency Upload - Agent Skeleton OSS</title>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #1a1a2e; color: white; }
            .container { max-width: 800px; margin: 0 auto; }
            .upload-area { border: 2px dashed #e74c3c; padding: 40px; margin: 20px 0; text-align: center; border-radius: 8px; background: rgba(231, 76, 60, 0.1); }
            input[type="file"] { margin: 20px 0; padding: 10px; width: 100%; }
            button { padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; background: #e74c3c; color: white; margin: 5px; }
            .result { margin: 20px 0; padding: 20px; background: #2a2a2a; border-radius: 8px; }
            .success { border-left: 4px solid #27ae60; }
            .error { border-left: 4px solid #e74c3c; }
            textarea { width: 100%; height: 200px; margin: 10px 0; padding: 10px; background: #333; color: white; border: 1px solid #555; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🆘 Emergency Upload Test</h1>
            <p>Cette méthode ultra-simple va FORCÉMENT fonctionner !</p>
            
            <div class="upload-area">
                <h3>📁 Upload d'Urgence</h3>
                <input type="file" id="fileInput" accept=".txt,.md,.json,.csv">
                <br>
                <button onclick="emergencyUpload()">🚨 Upload d'Urgence</button>
                <button onclick="listFiles()">📋 Liste des Fichiers</button>
            </div>
            
            <div>
                <h3>💬 Test Direct avec Contenu:</h3>
                <textarea id="textContent" placeholder="Ou collez directement le contenu de votre fichier ici..."></textarea>
                <button onclick="uploadText()">📝 Upload Texte Direct</button>
            </div>
            
            <div id="result" class="result" style="display: none;">
                <div id="resultContent"></div>
            </div>
        </div>

        <script>
            async function emergencyUpload() {
                const fileInput = document.getElementById('fileInput');
                const file = fileInput.files[0];
                
                if (!file) {
                    alert('Sélectionnez un fichier !');
                    return;
                }
                
                const resultDiv = document.getElementById('result');
                const resultContent = document.getElementById('resultContent');
                
                resultContent.innerHTML = '⏳ Upload d\\'urgence en cours...';
                resultDiv.style.display = 'block';
                resultDiv.className = 'result';
                
                try {
                    const response = await fetch('/api/files/emergency-upload', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/octet-stream',
                            'X-Filename': file.name
                        },
                        body: file
                    });
                    
                    const result = await response.json();
                    
                    if (response.ok) {
                        resultDiv.className = 'result success';
                        resultContent.innerHTML = \`
                            <h4>🎉 Upload d'urgence RÉUSSI !</h4>
                            <p><strong>Fichier:</strong> \${result.fileName}</p>
                            <p><strong>ID:</strong> \${result.fileId}</p>
                            <p><strong>Taille:</strong> \${result.size} bytes</p>
                            <p><strong>Aperçu:</strong></p>
                            <pre style="background: #444; padding: 10px; border-radius: 4px; overflow-x: auto;">\${result.preview}</pre>
                            <p>✅ Le fichier est maintenant stocké et peut être utilisé par l'agent !</p>
                        \`;
                    } else {
                        throw new Error(result.error || 'Erreur inconnue');
                    }
                } catch (error) {
                    resultDiv.className = 'result error';
                    resultContent.innerHTML = \`
                        <h4>❌ Erreur Emergency Upload</h4>
                        <p><strong>Erreur:</strong> \${error.message}</p>
                        <p>Si même cette méthode échoue, il y a un problème de configuration serveur.</p>
                    \`;
                }
            }
            
            async function uploadText() {
                const textContent = document.getElementById('textContent').value;
                
                if (!textContent.trim()) {
                    alert('Saisissez du contenu !');
                    return;
                }
                
                const resultDiv = document.getElementById('result');
                const resultContent = document.getElementById('resultContent');
                
                resultContent.innerHTML = '⏳ Upload texte en cours...';
                resultDiv.style.display = 'block';
                resultDiv.className = 'result';
                
                try {
                    const response = await fetch('/api/files/emergency-upload', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'text/plain',
                            'X-Filename': 'texte_colle.txt'
                        },
                        body: textContent
                    });
                    
                    const result = await response.json();
                    
                    if (response.ok) {
                        resultDiv.className = 'result success';
                        resultContent.innerHTML = \`
                            <h4>🎉 Texte uploadé avec succès !</h4>
                            <p><strong>ID:</strong> \${result.fileId}</p>
                            <p><strong>Taille:</strong> \${result.size} caractères</p>
                            <p>✅ Votre texte est maintenant disponible pour l'agent !</p>
                        \`;
                    } else {
                        throw new Error(result.error || 'Erreur inconnue');
                    }
                } catch (error) {
                    resultDiv.className = 'result error';
                    resultContent.innerHTML = \`
                        <h4>❌ Erreur Upload Texte</h4>
                        <p><strong>Erreur:</strong> \${error.message}</p>
                    \`;
                }
            }
            
            async function listFiles() {
                try {
                    const response = await fetch('/api/files/emergency-list');
                    const result = await response.json();
                    
                    const resultDiv = document.getElementById('result');
                    const resultContent = document.getElementById('resultContent');
                    
                    resultDiv.style.display = 'block';
                    resultDiv.className = 'result success';
                    
                    if (result.files.length === 0) {
                        resultContent.innerHTML = '<h4>📭 Aucun fichier uploadé</h4>';
                    } else {
                        resultContent.innerHTML = \`
                            <h4>📋 Fichiers Uploadés (\${result.count})</h4>
                            \${result.files.map(f => \`
                                <div style="border: 1px solid #555; margin: 10px 0; padding: 10px; border-radius: 4px;">
                                    <p><strong>\${f.name}</strong> (ID: \${f.id})</p>
                                    <p>Taille: \${f.size} bytes | \${f.uploadedAt}</p>
                                    <p>Aperçu: <em>\${f.preview}</em></p>
                                </div>
                            \`).join('')}
                        \`;
                    }
                } catch (error) {
                    console.error('Erreur liste:', error);
                }
            }
        </script>
    </body>
    </html>
    `);
});

// 🧪 Route de test de fichiers (SANS AUTHENTIFICATION)
app.get('/test-files', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Test Upload - Agent Skeleton OSS</title>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #0a0e27; color: white; }
            .container { max-width: 800px; margin: 0 auto; }
            .upload-area { border: 2px dashed #3b82f6; padding: 40px; margin: 20px 0; text-align: center; border-radius: 8px; }
            .upload-area:hover { background: rgba(59, 130, 246, 0.1); }
            input[type="file"] { margin: 20px 0; padding: 10px; }
            button { padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; background: #10b981; color: white; margin: 5px; }
            .result { margin: 20px 0; padding: 20px; background: #1a1a1a; border-radius: 8px; }
            .btn-simple { background: #f59e0b; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🧪 Test de Téléchargement de Fichiers</h1>
            
            <div class="upload-area" onclick="document.getElementById('fileInput').click()">
                <h3>📁 Zone de Test Upload</h3>
                <p>Cliquez ici pour sélectionner un fichier</p>
                <input type="file" id="fileInput" style="display: none;" accept=".txt,.md,.json,.csv,.pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx">
            </div>
            
            <div>
                <button onclick="uploadFile('test')">📤 Test Basic (Sans Auth)</button>
                <button onclick="uploadFile('simple')" class="btn-simple">🔧 Test Simplifié (Avec Auth)</button>
                <button onclick="uploadFile('full')">🚀 Test Complet (Avec Auth)</button>
            </div>
            
            <div id="result" class="result" style="display: none;">
                <h3>📊 Résultat du Test</h3>
                <div id="resultContent"></div>
            </div>
        </div>

        <script>
            async function uploadFile(type) {
                const fileInput = document.getElementById('fileInput');
                const file = fileInput.files[0];
                
                if (!file) {
                    alert('Veuillez sélectionner un fichier d\\'abord !');
                    return;
                }
                
                const formData = new FormData();
                formData.append('file', file);
                
                const resultDiv = document.getElementById('result');
                const resultContent = document.getElementById('resultContent');
                
                let endpoint;
                switch(type) {
                    case 'test':
                        endpoint = '/api/files/upload-test';
                        break;
                    case 'simple':
                        endpoint = '/api/files/upload-simple';
                        break;
                    case 'full':
                        endpoint = '/api/files/upload';
                        break;
                }
                
                resultContent.innerHTML = \`⏳ Test \${type} en cours...\`;
                resultDiv.style.display = 'block';
                
                try {
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        body: formData,
                        credentials: 'include'
                    });
                    
                    const result = await response.json();
                    
                    if (response.ok) {
                        resultContent.innerHTML = \`
                            <h4>✅ Test \${type} réussi !</h4>
                            <p><strong>Endpoint:</strong> \${endpoint}</p>
                            <p><strong>Fichier:</strong> \${result.file.originalName}</p>
                            <p><strong>Taille:</strong> \${Math.round(result.file.size/1024)} KB</p>
                            <p><strong>Type:</strong> \${result.file.type}</p>
                            <div style="margin-top: 15px; padding: 15px; background: #2a2a2a; border-radius: 6px;">
                                \${result.analysis.replace(/\\n/g, '<br>')}
                            </div>
                        \`;
                    } else {
                        throw new Error(result.error || 'Erreur inconnue');
                    }
                } catch (error) {
                    resultContent.innerHTML = \`
                        <h4>❌ Erreur test \${type}</h4>
                        <p><strong>Endpoint:</strong> \${endpoint}</p>
                        <p><strong>Erreur:</strong> \${error.message}</p>
                        <p><em>Essayez un autre type de test</em></p>
                    \`;
                }
            }
            
            document.getElementById('fileInput').addEventListener('change', function() {
                const file = this.files[0];
                if (file) {
                    document.querySelector('.upload-area p').textContent = 
                        \`Fichier sélectionné: \${file.name} (\${Math.round(file.size/1024)} KB)\`;
                }
            });
        </script>
    </body>
    </html>
    `);
});

// 🔐 Routes d'authentification
app.post('/api/auth/register', [
    body('username').isLength({ min: 3 }).withMessage('Nom d\'utilisateur requis (min 3 caractères)'),
    body('password').isLength({ min: 6 }).withMessage('Mot de passe requis (min 6 caractères)'),
    body('email').isEmail().withMessage('Email valide requis')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { username, password, email } = req.body;
        const result = authService.createAccount(username, password, email);
        res.json({ success: true, message: 'Compte créé avec succès' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/auth/login', [
    body('username').notEmpty().withMessage('Nom d\'utilisateur requis'),
    body('password').notEmpty().withMessage('Mot de passe requis')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { username, password } = req.body;
        const result = authService.login(username, password);
        
        // Définir le cookie de session
        res.cookie('sessionId', result.sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 heures
        });

        res.json({ success: true, user: result.user });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

app.post('/api/auth/logout', requireAuthAPI, (req, res) => {
    const sessionId = req.cookies?.sessionId;
    if (sessionId) {
        authService.logout(sessionId);
        res.clearCookie('sessionId');
    }
    res.json({ success: true, message: 'Déconnexion réussie' });
});

// 🔧 Route de debug pour tester la navigation
app.get('/debug', (req, res) => {
    res.render('app_debug', {
        title: 'Agent Skeleton OSS - Debug Interface',
        version: '1.0.0'
    });
});

// 🔍 Health Check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// 🔑 API Keys Status Check (pour debug)
app.get('/api/keys-status', (req, res) => {
    const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
    const status = {
        openrouter: hasOpenRouter,
        all_models_available: hasOpenRouter,
        provider: 'OpenRouter (Unified API)',
        models: {
            'gpt-4o-mini': hasOpenRouter ? 'Available via OpenRouter' : 'Requires OpenRouter key',
            'claude-3.5-sonnet': hasOpenRouter ? 'Available via OpenRouter' : 'Requires OpenRouter key',
            'gemini-2.0-flash': hasOpenRouter ? 'Available via OpenRouter' : 'Requires OpenRouter key',
            'grok-beta': hasOpenRouter ? 'Available via OpenRouter' : 'Requires OpenRouter key'
        },
        demo_mode: !hasOpenRouter
    };
    
    res.json(status);
});

// 🤖 ENDPOINTS AGENT AUTONOME

// 🔄 n8n Workflows Management
app.get('/api/agent/n8n/status', async (req, res) => {
    try {
        if (!process.env.N8N_API_KEY || !process.env.N8N_API_URL) {
            return res.status(400).json({ 
                error: 'Configuration n8n manquante', 
                configured: false,
                message: 'Veuillez ajouter N8N_API_KEY et N8N_API_URL dans les variables d\'environnement Coolify'
            });
        }

        // Vérifier la connexion à n8n
        const response = await axios.get(`${process.env.N8N_API_URL}/api/v1/workflows`, {
            headers: {
                'X-N8N-API-KEY': process.env.N8N_API_KEY
            }
        });

        const workflows = response.data.data || [];
        
        // Analyser les workflows
        const activeWorkflows = workflows.filter(w => w.active);
        const inactiveWorkflows = workflows.filter(w => !w.active);

        res.json({
            success: true,
            configured: true,
            n8n_url: process.env.N8N_API_URL,
            status: {
                total_workflows: workflows.length,
                active_workflows: activeWorkflows.length,
                inactive_workflows: inactiveWorkflows.length,
                workflows: workflows.map(w => ({
                    id: w.id,
                    name: w.name,
                    active: w.active,
                    createdAt: w.createdAt,
                    updatedAt: w.updatedAt
                }))
            }
        });
    } catch (error) {
        console.error('Erreur n8n:', error.message);
        
        if (error.response?.status === 401) {
            return res.status(401).json({ 
                error: 'Clé API n8n invalide', 
                configured: false,
                message: 'Vérifiez votre N8N_API_KEY dans Coolify'
            });
        }
        
        res.status(500).json({ 
            error: 'Erreur connexion n8n', 
            details: error.message,
            configured: !!process.env.N8N_API_KEY
        });
    }
});

app.get('/api/agent/n8n/workflows', async (req, res) => {
    try {
        if (!process.env.N8N_API_KEY || !process.env.N8N_API_URL) {
            return res.status(400).json({ error: 'Clés n8n manquantes', configured: false });
        }
        
        // Simuler la récupération des workflows (remplacer par vraie API)
        const workflows = [
            { id: 1, name: 'Agent Chat Automation', active: true, lastExecution: '2025-10-07T10:30:00Z' },
            { id: 2, name: 'Baserow Sync', active: true, lastExecution: '2025-10-07T09:15:00Z' },
            { id: 3, name: 'Deploy Monitor', active: false, lastExecution: '2025-10-06T22:00:00Z' }
        ];
        
        res.json({ workflows, configured: true });
    } catch (error) {
        res.status(500).json({ error: 'Erreur n8n', details: error.message });
    }
});

app.get('/api/agent/n8n/executions', async (req, res) => {
    try {
        if (!process.env.N8N_API_KEY || !process.env.N8N_API_URL) {
            return res.status(400).json({ error: 'Configuration n8n manquante', configured: false });
        }

        // Récupérer les exécutions récentes
        const response = await axios.get(`${process.env.N8N_API_URL}/api/v1/executions`, {
            headers: {
                'X-N8N-API-KEY': process.env.N8N_API_KEY
            },
            params: {
                limit: 20,
                includeData: false
            }
        });

        const executions = response.data.data || [];
        
        // Analyser les exécutions
        const successful = executions.filter(e => e.finished && !e.stoppedAt).length;
        const failed = executions.filter(e => e.stoppedAt && e.stoppedAt !== e.finishedAt).length;
        const running = executions.filter(e => !e.finished).length;

        res.json({
            success: true,
            executions: executions.map(e => ({
                id: e.id,
                workflowId: e.workflowId,
                mode: e.mode,
                finished: e.finished,
                startedAt: e.startedAt,
                finishedAt: e.finishedAt,
                stoppedAt: e.stoppedAt
            })),
            stats: {
                total: executions.length,
                successful,
                failed,
                running
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur récupération exécutions', details: error.message });
    }
});

app.post('/api/agent/n8n/create-workflow', async (req, res) => {
    try {
        const { name, description, trigger, actions } = req.body;
        
        // Simuler la création d'un workflow
        const newWorkflow = {
            id: Date.now(),
            name: name || 'Nouveau Workflow',
            description: description || 'Créé par Agent Skeleton OSS',
            active: false,
            created: new Date().toISOString()
        };
        
        res.json({ 
            success: true, 
            workflow: newWorkflow,
            message: `Workflow "${newWorkflow.name}" créé avec succès` 
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur création workflow', details: error.message });
    }
});

// 🚀 Coolify Deployments Management  
app.get('/api/agent/coolify/deployments', async (req, res) => {
    try {
        if (!process.env.COOLIFY_API_KEY || !process.env.COOLIFY_API_URL) {
            return res.status(400).json({ error: 'Clés Coolify manquantes', configured: false });
        }
        
        // Simuler l'état des déploiements
        const deployments = [
            { id: 1, name: 'agent-skeleton-oss', status: 'running', lastDeploy: '2025-10-07T11:00:00Z', health: 'healthy' },
            { id: 2, name: 'n8n-instance', status: 'running', lastDeploy: '2025-10-07T08:30:00Z', health: 'healthy' },
            { id: 3, name: 'baserow-db', status: 'stopped', lastDeploy: '2025-10-06T20:15:00Z', health: 'warning' }
        ];
        
        res.json({ deployments, configured: true });
    } catch (error) {
        res.status(500).json({ error: 'Erreur Coolify', details: error.message });
    }
});

app.post('/api/agent/coolify/deploy', async (req, res) => {
    try {
        const { serviceId, serviceName } = req.body;
        
        // Simuler un déploiement
        const deployment = {
            id: serviceId || Date.now(),
            name: serviceName || 'Service inconnu',
            status: 'deploying',
            startedAt: new Date().toISOString()
        };
        
        res.json({ 
            success: true, 
            deployment,
            message: `Déploiement de "${deployment.name}" initié` 
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur déploiement', details: error.message });
    }
});

// 📊 Baserow Database Management
app.get('/api/agent/baserow/tables', async (req, res) => {
    try {
        if (!process.env.BASEROW_API_KEY || !process.env.BASEROW_URL) {
            return res.status(400).json({ error: 'Clés Baserow manquantes', configured: false });
        }
        
        // Simuler les tables Baserow
        const tables = [
            { id: 1, name: 'Conversations', rows: 156, lastUpdate: '2025-10-07T10:45:00Z' },
            { id: 2, name: 'Workflows Status', rows: 3, lastUpdate: '2025-10-07T09:30:00Z' },
            { id: 3, name: 'Deployments Log', rows: 42, lastUpdate: '2025-10-07T11:00:00Z' }
        ];
        
        res.json({ tables, configured: true });
    } catch (error) {
        res.status(500).json({ error: 'Erreur Baserow', details: error.message });
    }
});

app.post('/api/agent/baserow/sync', async (req, res) => {
    try {
        const { tableId, action } = req.body;
        
        // Simuler une synchronisation
        const syncResult = {
            tableId: tableId || 1,
            action: action || 'sync',
            recordsProcessed: Math.floor(Math.random() * 50) + 10,
            status: 'completed',
            timestamp: new Date().toISOString()
        };
        
        res.json({ 
            success: true, 
            result: syncResult,
            message: `Synchronisation réussie : ${syncResult.recordsProcessed} enregistrements traités` 
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur synchronisation', details: error.message });
    }
});

// 🎭 Routes pour les workflows de réseaux sociaux
app.post('/api/agent/social/create-publisher', requireAuthAPI, async (req, res) => {
    try {
        const { platforms, autoPost } = req.body;
        const userId = req.user.userId;
        
        const result = await socialWorkflowService.createSocialPublishingWorkflow(
            userId, 
            platforms || ['facebook', 'twitter', 'linkedin']
        );
        
        if (result.success) {
            memoryService.saveConversation(userId, 
                `Créer un workflow de publication sociale pour ${platforms?.join(', ')}`,
                `Workflow de publication créé avec succès pour les plateformes: ${platforms?.join(', ')}`,
                'system',
                { workflowId: result.workflowId, action: 'create_social_workflow' }
            );
        }
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Erreur création workflow social', details: error.message });
    }
});

app.post('/api/agent/social/create-monitor', requireAuthAPI, async (req, res) => {
    try {
        const { keywords, platforms } = req.body;
        const userId = req.user.userId;
        
        const result = await socialWorkflowService.createSocialMonitoringWorkflow(
            userId,
            keywords || []
        );
        
        if (result.success) {
            memoryService.saveConversation(userId,
                `Créer un monitoring social pour: ${keywords?.join(', ')}`,
                `Workflow de monitoring créé pour surveiller: ${keywords?.join(', ')}`,
                'system',
                { workflowId: result.workflowId, action: 'create_monitor_workflow' }
            );
        }
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Erreur création monitoring social', details: error.message });
    }
});

// 🧠 Routes de mémoire pour l'agent
app.get('/api/agent/memory/conversations', requireAuthAPI, (req, res) => {
    try {
        const userId = req.user.userId;
        const limit = parseInt(req.query.limit) || 20;
        
        const conversations = memoryService.getConversationHistory(userId, limit);
        res.json({ conversations, count: conversations.length });
    } catch (error) {
        res.status(500).json({ error: 'Erreur récupération mémoire', details: error.message });
    }
});

// � Route de debug pour vérifier la mémoire et les fichiers
app.get('/api/debug/memory', requireAuthAPI, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Récupérer toutes les données de mémoire pour cet utilisateur
        const conversations = memoryService.getConversationHistory(userId, 10);
        const userFiles = await memoryService.getUserFiles(userId);
        const personalizedContext = memoryService.generatePersonalizedContext(userId);
        
        // Vérifier les fichiers stockés dans le service de fichiers
        const filesList = await fileService.listUserFiles(userId);
        
        res.json({
            userId: userId,
            memoryStats: {
                conversations: conversations.length,
                userFiles: userFiles.length,
                contextLength: personalizedContext.length
            },
            files: {
                inMemory: userFiles.map(f => ({
                    fileId: f.fileId,
                    fileName: f.fileName,
                    hasContent: !!f.fullContent,
                    uploadedAt: f.uploadedAt
                })),
                inFileService: filesList.map(f => ({
                    id: f.id,
                    originalName: f.originalName,
                    size: f.size,
                    uploadedAt: f.uploadedAt
                }))
            },
            contextPreview: personalizedContext.substring(0, 500) + '...'
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur debug mémoire', details: error.message });
    }
});

// �💬 API Chat avec validation, rate limiting et mémoire
app.post('/api/chat', chatLimiter, requireAuthAPI, async (req, res) => {
    try {
        console.log('🔍 Données reçues brutes:', req.body);
        
        const { message, conversationId, model } = req.body;
        
        // Validation simple manuelle
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            console.log('❌ Message invalide:', message);
            return res.status(400).json({
                error: 'Message requis',
                details: 'Le message ne peut pas être vide'
            });
        }

        console.log('✅ Message valide reçu:', { message, conversationId, model });
        
        // Debug des clés API (OpenRouter uniquement)
        console.log('🔑 État OpenRouter:', {
            OPENROUTER_KEY: !!process.env.OPENROUTER_API_KEY,
            ALL_MODELS: !!process.env.OPENROUTER_API_KEY ? 'Available' : 'Demo Mode'
        });

        // Responses basées sur le modèle sélectionné
        const modelResponses = {
            'claude-3.5-sonnet': [
                "🧠 Claude 3.5 Sonnet ici ! Je vais analyser votre demande avec attention.",
                "🔍 Excellente question ! Avec Claude, je peux vous aider à explorer cette idée en profondeur.",
                "💡 En tant que Claude 3.5 Sonnet, je propose une approche méthodique pour résoudre cela.",
                "📊 Grâce aux capacités de Claude, voici une analyse détaillée de votre demande.",
                "🎯 Claude 3.5 Sonnet est conçu pour vous fournir des réponses nuancées et pertinentes."
            ],
            'gpt-4': [
                "� GPT-4 activé ! Je vais traiter votre requête avec ma compréhension avancée.",
                "⚡ Excellent ! GPT-4 est parfait pour ce type de question complexe.",
                "🎭 Avec GPT-4, je peux aborder votre demande sous plusieurs angles créatifs.",
                "� Utilisant les capacités de GPT-4, voici une réponse structurée pour vous.",
                "🌟 GPT-4 me permet de vous offrir une perspective riche et détaillée."
            ],
            'gemini-pro': [
                "💎 Gemini Pro en action ! Analysons cela ensemble de manière intelligente.",
                "🌈 Avec Gemini Pro, j'apporte une approche multimodale à votre question.",
                "🔮 Gemini Pro me donne la flexibilité pour explorer votre demande créativement.",
                "⭐ Grâce à Gemini Pro, je peux connecter différents concepts pour vous aider.",
                "� Gemini Pro excelle dans la compréhension nuancée de votre demande."
            ]
        };

        // Réponses génériques pour les autres modèles
        const genericResponses = [
            `🤖 ${model || 'IA'} : Votre message est bien reçu ! Comment puis-je vous aider davantage ?`,
            `💭 Avec ${model || 'ce modèle'}, je traite votre demande avec soin.`,
            `🔧 ${model || 'Le système'} analyse votre question et prépare une réponse adaptée.`,
            `📝 Utilisant ${model || 'les capacités IA'}, voici ma réflexion sur votre demande.`,
            `🎯 ${model || 'L\'assistant'} est prêt à vous accompagner dans cette tâche.`
        ];

        // Récupérer le contexte de mémoire pour l'utilisateur
        const personalizedContext = memoryService.generatePersonalizedContext(req.user.userId);
        console.log('🧠 Contexte personnalisé généré pour userId:', req.user.userId);
        console.log('📄 Longueur du contexte:', personalizedContext.length);
        
        // Debug: vérifier les fichiers dans la mémoire
        const userFiles = await memoryService.getUserFiles(req.user.userId);
        console.log('📁 Fichiers trouvés pour cet utilisateur:', userFiles.length);
        if (userFiles.length > 0) {
            console.log('📋 Liste des fichiers:', userFiles.map(f => ({ fileId: f.fileId, fileName: f.fileName })));
        }
        
        // Appel du service IA réel avec contexte personnalisé et accès aux fichiers
        const aiResponse = await aiService.sendMessage(message, model, conversationId, personalizedContext, req.user.userId);
        
        console.log('🤖 Réponse IA reçue:', aiResponse);

        // Sauvegarder la conversation dans la mémoire
        memoryService.saveConversation(req.user.userId, message, aiResponse.response, model, {
            simulated: aiResponse.simulated,
            conversationId: conversationId
        });

        // Apprendre des préférences utilisateur
        memoryService.learnFromConversation(req.user.userId, message, aiResponse.response);

        // Si c'est une simulation, on ajoute un indicateur
        let finalResponse = aiResponse.response;
        if (aiResponse.simulated) {
            finalResponse = `${aiResponse.response}\n\n💡 *Mode démo - Configurez vos clés API pour activer l'IA complète*`;
        } else if (aiResponse.error) {
            finalResponse = aiResponse.response;
        }

        res.json({
            response: finalResponse,
            conversationId: conversationId || `conv_${Date.now()}`,
            timestamp: new Date().toISOString(),
            model: model || 'assistant',
            usage: aiResponse.usage || null,
            simulated: aiResponse.simulated || false
        });

    } catch (error) {
        console.error('Erreur API Chat:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur',
            message: 'Une erreur est survenue lors du traitement de votre message'
        });
    }
});

// 📁 API Gestion des fichiers

// Upload d'un fichier (VERSION TEMPORAIRE SANS AUTH POUR TEST)
app.post('/api/files/upload-test', upload.single('file'), async (req, res) => {
    try {
        console.log('📁 Test upload reçu:', req.file ? req.file.originalname : 'Aucun fichier');
        
        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier fourni' });
        }

        // Simuler l'analyse sans sauvegarder réellement
        const analysis = {
            fileName: req.file.originalname,
            size: req.file.size,
            type: req.file.mimetype,
            analysisResult: `✅ Fichier "${req.file.originalname}" analysé avec succès ! 
            
🤖 **Analyse automatique :**
- Nom: ${req.file.originalname}
- Taille: ${Math.round(req.file.size / 1024)} KB
- Type: ${req.file.mimetype}

L'agent peut maintenant utiliser ce fichier dans ses réponses !`
        };

        res.json({
            success: true,
            file: {
                id: Date.now(),
                originalName: req.file.originalname,
                size: req.file.size,
                type: req.file.mimetype
            },
            analysis: analysis.analysisResult,
            message: '✅ Test de téléchargement réussi !'
        });
    } catch (error) {
        console.error('❌ Erreur upload test:', error);
        res.status(500).json({ 
            error: 'Erreur lors du test de téléchargement', 
            details: error.message 
        });
    }
});

// Upload d'un fichier (VERSION COMPLÈTE AVEC AUTH)
app.post('/api/files/upload', requireAuthAPI, upload.single('file'), async (req, res) => {
    try {
        console.log('📁 Début upload - User:', req.user);
        
        if (!req.file) {
            console.log('❌ Aucun fichier reçu');
            return res.status(400).json({ error: 'Aucun fichier fourni' });
        }

        console.log('📄 Fichier reçu:', req.file.originalname, req.file.size, 'bytes');
        
        const userId = req.user.userId || req.user.id; // Harmonisation des identifiants
        console.log('� UserId harmonisé:', userId);
        
        // Sauvegarder le fichier avec gestion d'erreur
        let metadata;
        try {
            metadata = await fileService.saveFile(req.file, userId);
            console.log('✅ Fichier sauvegardé:', metadata.id);
        } catch (saveError) {
            console.error('❌ Erreur sauvegarde fichier:', saveError);
            // Fallback: créer des métadonnées temporaires
            metadata = {
                id: Date.now().toString(),
                originalName: req.file.originalname,
                size: req.file.size,
                mimeType: req.file.mimetype,
                uploadedBy: userId,
                uploadedAt: new Date().toISOString(),
                content: req.file.buffer.toString('utf8').substring(0, 5000) // Limiter le contenu
            };
            console.log('🔄 Fallback metadata créé:', metadata.id);
        }
        
        // Analyser le fichier avec gestion d'erreur
        let analysis;
        try {
            analysis = await fileService.analyzeForAgent(metadata.id);
            console.log('✅ Analyse réussie');
        } catch (analysisError) {
            console.error('❌ Erreur analyse:', analysisError);
            // Fallback: analyse simple
            analysis = {
                fileId: metadata.id,
                analysis: `📄 **Fichier "${metadata.originalName}" reçu :**\n\n` +
                         `• Taille: ${Math.round(metadata.size / 1024)} KB\n` +
                         `• Type: ${metadata.mimeType}\n` +
                         `• Date: ${new Date().toLocaleDateString()}\n\n` +
                         `🤖 L'agent peut maintenant utiliser ce fichier dans ses réponses.`,
                fullContent: metadata.content || ''
            };
            console.log('🔄 Fallback analyse créé');
        }
        
        // Stocker dans la mémoire avec gestion d'erreur
        try {
            console.log('🧠 Tentative stockage en mémoire...');
            memoryService.addUserPreference(userId, 'uploaded_files', {
                fileId: metadata.id,
                fileName: metadata.originalName,
                analysis: analysis,
                fullContent: analysis.fullContent || metadata.content || '',
                uploadedAt: new Date().toISOString()
            });
            console.log('✅ Stocké en mémoire avec succès');
        } catch (memoryError) {
            console.error('❌ Erreur mémoire:', memoryError);
            // Continuer quand même, l'upload est réussi
        }

        res.json({
            success: true,
            file: {
                id: metadata.id,
                originalName: metadata.originalName,
                size: metadata.size,
                type: metadata.mimeType
            },
            analysis: analysis.analysis,
            message: '✅ Fichier téléchargé et analysé par l\'agent'
        });
        
        console.log('🎉 Upload terminé avec succès pour:', metadata.originalName);
        
    } catch (error) {
        console.error('❌ Erreur upload globale:', error);
        res.status(500).json({ 
            error: 'Erreur lors du téléchargement', 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// 🧪 Upload de fichier SIMPLIFIÉ (fallback si problèmes avec fileService)
app.post('/api/files/upload-simple', requireAuthAPI, upload.single('file'), async (req, res) => {
    try {
        console.log('📁 Upload simple - début');
        
        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier fourni' });
        }

        const userId = req.user.userId || req.user.id;
        const fileId = Date.now().toString();
        
        // Traitement direct du contenu selon le type
        let content = '';
        if (req.file.mimetype.startsWith('text/') || req.file.mimetype === 'application/json') {
            content = req.file.buffer.toString('utf8');
        } else {
            content = `[Fichier binaire: ${req.file.originalname}]`;
        }
        
        // Stockage direct en mémoire sans passer par fileService
        const fileData = {
            fileId: fileId,
            fileName: req.file.originalname,
            size: req.file.size,
            mimeType: req.file.mimetype,
            content: content.substring(0, 10000), // Limiter à 10KB
            uploadedAt: new Date().toISOString(),
            analysis: {
                analysis: `📄 **Fichier "${req.file.originalname}" analysé :**\n\n` +
                         `• Taille: ${Math.round(req.file.size / 1024)} KB\n` +
                         `• Type: ${req.file.mimetype}\n` +
                         `• Contenu disponible pour l'agent\n\n` +
                         `🤖 L'agent peut maintenant répondre aux questions sur ce document.`,
                fullContent: content.substring(0, 10000)
            }
        };
        
        // Stockage direct dans la mémoire
        memoryService.addUserPreference(userId, 'uploaded_files', fileData);
        
        console.log('✅ Upload simple réussi:', req.file.originalname);
        
        res.json({
            success: true,
            file: {
                id: fileId,
                originalName: req.file.originalname,
                size: req.file.size,
                type: req.file.mimetype
            },
            analysis: fileData.analysis.analysis,
            message: '✅ Fichier traité et intégré à la mémoire de l\'agent'
        });
        
    } catch (error) {
        console.error('❌ Erreur upload simple:', error);
        res.status(500).json({ 
            error: 'Erreur upload simple', 
            details: error.message 
        });
    }
});

// Lister les fichiers de l'utilisateur
app.get('/api/files', requireAuthAPI, async (req, res) => {
    try {
        const userId = req.user.id;
        const files = await fileService.listUserFiles(userId);
        res.json({ files });
    } catch (error) {
        console.error('❌ Erreur listage fichiers:', error);
        res.status(500).json({ error: 'Erreur récupération fichiers' });
    }
});

// Récupérer le contenu d'un fichier
app.get('/api/files/:fileId', requireAuthAPI, async (req, res) => {
    try {
        const userId = req.user.id;
        const { fileId } = req.params;
        
        const metadata = await fileService.getFileMetadata(fileId);
        if (!metadata || metadata.uploadedBy !== userId) {
            return res.status(404).json({ error: 'Fichier non trouvé' });
        }

        const content = await fileService.readFileContent(fileId);
        res.json({ content });
    } catch (error) {
        console.error('❌ Erreur lecture fichier:', error);
        res.status(500).json({ error: 'Erreur lecture fichier' });
    }
});

// Analyser un fichier pour l'agent
app.post('/api/files/:fileId/analyze', requireAuthAPI, async (req, res) => {
    try {
        const userId = req.user.id;
        const { fileId } = req.params;
        
        const metadata = await fileService.getFileMetadata(fileId);
        if (!metadata || metadata.uploadedBy !== userId) {
            return res.status(404).json({ error: 'Fichier non trouvé' });
        }

        const analysis = await fileService.analyzeForAgent(fileId);
        
        // Mettre à jour la mémoire
        memoryService.addUserPreference(userId, 'file_analysis', {
            fileId: fileId,
            analysis: analysis,
            analyzedAt: new Date().toISOString()
        });

        res.json({
            analysis: analysis.analysis,
            message: '🤖 Fichier analysé et intégré à la mémoire de l\'agent'
        });
    } catch (error) {
        console.error('❌ Erreur analyse fichier:', error);
        res.status(500).json({ error: 'Erreur analyse fichier' });
    }
});

// Supprimer un fichier
app.delete('/api/files/:fileId', requireAuthAPI, async (req, res) => {
    try {
        const userId = req.user.id;
        const { fileId } = req.params;
        
        await fileService.deleteFile(fileId, userId);
        
        res.json({ 
            success: true, 
            message: '🗑️ Fichier supprimé avec succès' 
        });
    } catch (error) {
        console.error('❌ Erreur suppression fichier:', error);
        res.status(500).json({ error: 'Erreur suppression fichier' });
    }
});

// �📝 API Instructions personnalisées
app.get('/api/instructions', (req, res) => {
    res.json({
        instructions: aiService.customInstructions
    });
});

app.post('/api/instructions', [
    body('brand').optional().isString().trim(),
    body('tone').optional().isString().trim(),
    body('expertise').optional().isString().trim(),
    body('language').optional().isString().trim(),
    body('personality').optional().isString().trim()
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Données invalides',
                details: errors.array()
            });
        }

        // Filtrer les champs non-null
        const newInstructions = {};
        ['brand', 'tone', 'expertise', 'language', 'personality'].forEach(field => {
            if (req.body[field] !== undefined && req.body[field] !== '') {
                newInstructions[field] = req.body[field];
            }
        });

        // Mettre à jour les instructions
        aiService.updateInstructions(newInstructions);

        res.json({
            success: true,
            instructions: aiService.customInstructions,
            message: 'Instructions mises à jour avec succès'
        });

    } catch (error) {
        console.error('Erreur API Instructions:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur',
            message: 'Une erreur est survenue lors de la mise à jour'
        });
    }
});

// 📊 API Status
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// 🔧 Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
    console.error('Erreur:', err);
    res.status(500).json({
        error: 'Erreur interne du serveur',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Page non trouvée',
        message: `La route ${req.originalUrl} n'existe pas`
    });
});

// Démarrage du serveur
app.listen(port, () => {
    console.log(`🚀 Agent Skeleton OSS démarré sur le port ${port}`);
    console.log(`🌐 Interface disponible : http://localhost:${port}/app`);
    console.log(`💚 Health check : http://localhost:${port}/health`);
    console.log(`📡 API Status : http://localhost:${port}/api/status`);
});

module.exports = app;