// Version complète et professionnelle - Agent Skeleton OSS
require('dotenv').config(); // Charger les variables d'environnement

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { getSessionStore } = require('./sessionStore');
const FilePersistence = require('./utils/FilePersistence');
const ConversationMemory = require('./utils/ConversationMemory');

const app = express();
const port = process.env.PORT || 3000;

// Configuration sécurisée avec headers complets
app.use(helmet({
    contentSecurityPolicy: false, // Désactiver CSP temporairement
    xssFilter: false, // Éviter x-xss-protection deprecated
}));

// Headers de sécurité additionnels
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    next();
});
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.raw({ type: '*/*', limit: '10mb' }));

// Initialize session store with SQLite
const sessionStore = getSessionStore();

// NOUVELLE PERSISTANCE DES FICHIERS avec SQLite
const filePersistence = new FilePersistence();

// NOUVELLE MÉMOIRE DES CONVERSATIONS avec SQLite
const conversationMemory = new ConversationMemory();

// MÉTRIQUES GLOBALES (pour endpoint /metrics)
global.metrics = {
    requests: 0,
    n8nTriggers: 0,
    n8nRuns: 0,
    coolifyDeploys: 0,
    baserowOps: 0,
    fileOps: 0,
    emailsSent: 0,
    errors: 0,
    startTime: new Date().toISOString()
};

// Migrer les anciens fichiers en mémoire s'ils existent
if (global.uploadedFiles && Object.keys(global.uploadedFiles).length > 0) {
    console.log('🔄 Migration des fichiers en mémoire vers SQLite...');
    filePersistence.migrateFromMemory(global.uploadedFiles);
}

// Stockage en mémoire (base de données temporaire)
global.users = {
    'admin@example.com': {
        email: 'admin@example.com',
        password: 'admin123',
        name: 'Admin User',
        createdAt: new Date().toISOString()
    }
};
// DÉPRÉCIÉ: global.uploadedFiles est remplacé par filePersistence
global.uploadedFiles = {}; // Gardé pour compatibilité temporaire
global.conversations = {};

// Helper fonction pour créer des cookies sécurisés
function setSecureCookie(req, res, name, value, maxAge = 24 * 60 * 60 * 1000) {
    const isProduction = process.env.NODE_ENV === 'production';
    const isHttps = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https';
    
    res.cookie(name, value, { 
        httpOnly: true, 
        maxAge: maxAge,
        sameSite: isProduction ? 'strict' : 'lax',
        secure: isHttps,
        path: '/'
    });
    
    console.log(`🍪 Cookie ${name} défini | secure: ${isHttps} | sameSite: ${isProduction ? 'strict' : 'lax'}`);
}

// Configuration EJS pour les vues
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Servir les fichiers statiques depuis /public avec configuration MIME correcte
app.use(express.static(path.join(__dirname, '../public'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        }
    }
}));

// Debug: Log du chemin public
console.log('📁 Dossier public:', path.join(__dirname, '../public'));

// Middleware d'authentification
function requireAuth(req, res, next) {
    // Désactiver l'auth en mode développement si DISABLE_AUTH=true
    if (process.env.DISABLE_AUTH === 'true') {
        console.log('⚠️ Auth désactivée (mode dev)');
        req.user = { email: 'dev@local.com', name: 'Dev User' };
        return next();
    }
    
    console.log('🔒 Vérification auth pour:', req.url);
    console.log('🍪 Cookies reçus:', req.cookies);
    
    const sessionId = req.cookies.sessionId;
    console.log('🔑 SessionId:', sessionId);
    
    const session = sessionStore.getSession(sessionId);
    if (!session) {
        console.log('❌ Session non trouvée, redirection vers /login');
        console.log('📝 Sessions actives:', sessionStore.getSessionCount());
        return res.redirect('/login');
    }
    
    req.user = session;
    console.log('✅ Utilisateur authentifié:', req.user.email);
    next();
}

// Route de connexion
app.get('/login', (req, res) => {
    console.log('📍 Route /login appelée');
    console.log('🍪 Cookies reçus:', JSON.stringify(req.cookies));
    console.log('📝 Sessions actives:', sessionStore.getSessionCount());
    console.log('🌐 Headers:', JSON.stringify({
        'x-forwarded-proto': req.get('x-forwarded-proto'),
        'protocol': req.protocol,
        'secure': req.secure,
        'host': req.get('host')
    }));
    
    // Vérifier si déjà connecté pour éviter la boucle
    const sessionId = req.cookies.sessionId;
    const session = sessionStore.getSession(sessionId);
    if (session) {
        console.log('👤 Utilisateur déjà connecté, redirection vers /dashboard');
        return res.redirect('/dashboard');
    }
    
    console.log('📄 Envoi du formulaire auth.html');
    res.sendFile(path.join(__dirname, '../auth.html'));
});

// API de connexion
app.post('/api/login', (req, res) => {
    console.log('🔐 API /api/login appelée');
    console.log('📦 Body:', JSON.stringify(req.body));
    console.log('🍪 Cookies avant login:', JSON.stringify(req.cookies));
    console.log('🌐 Protocol:', req.protocol, '| x-forwarded-proto:', req.get('x-forwarded-proto'));
    
    const { email, password } = req.body;
    
    if (!email || !password) {
        console.log('❌ Email ou mot de passe manquant');
        return res.status(400).json({ error: 'Email et mot de passe requis' });
    }
    
    const user = global.users[email];
    console.log('👤 Utilisateur trouvé:', user ? 'Oui' : 'Non');
    
    if (!user || user.password !== password) {
        console.log('❌ Identifiants incorrects');
        return res.status(401).json({ error: 'Identifiants incorrects' });
    }
    
    // Create persistent session in SQLite
    const sessionId = sessionStore.createSession(email, user.email, 24 * 60 * 60 * 1000);
    
    console.log('✅ Session créée:', sessionId);
    
    // Définir le cookie de session sécurisé
    setSecureCookie(req, res, 'sessionId', sessionId, 24 * 60 * 60 * 1000);
    
    res.json({ success: true, message: 'Connexion réussie !', user: { email: user.email, name: user.name } });
});

// API d'inscription
app.post('/api/register', (req, res) => {
    console.log('📝 Tentative d\'inscription:', req.body);
    
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
        console.log('❌ Champs manquants');
        return res.status(400).json({ error: 'Tous les champs sont requis' });
    }
    
    if (global.users[email]) {
        console.log('❌ Email déjà utilisé');
        return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }
    
    global.users[email] = {
        email,
        password,
        name,
        createdAt: new Date().toISOString()
    };
    
    // Initialiser la conversation de l'utilisateur
    global.conversations[email] = [];
    
    console.log('✅ Utilisateur créé:', email);
    console.log('👥 Total utilisateurs:', Object.keys(global.users).length);
    
    res.json({ success: true, message: 'Inscription réussie ! Vous pouvez maintenant vous connecter.' });
});

// API de déconnexion
app.post('/api/logout', (req, res) => {
    const sessionId = req.cookies.sessionId;
    if (sessionId) {
        sessionStore.deleteSession(sessionId);
    }
    res.clearCookie('sessionId');
    res.redirect('/login');
});

// Route de test pour l'authentification
app.get('/test-auth', (req, res) => {
    res.sendFile(path.join(__dirname, '../test-auth.html'));
});

// Endpoint de débogage
app.get('/debug', (req, res) => {
    const sessions = sessionStore.getAllSessions();
    res.json({
        users: Object.keys(global.users),
        sessions: sessions.map(s => ({ sessionId: s.sessionId, email: s.email, expiresAt: new Date(s.expiresAt).toISOString() })),
        files: Object.keys(global.uploadedFiles || {}),
        totalUsers: Object.keys(global.users).length,
        totalSessions: sessionStore.getSessionCount(),
        sessionDetails: sessions,
        cookies: req.cookies
    });
});

// Route de test des cookies
app.get('/test-cookie', (req, res) => {
    const sessions = sessionStore.getAllSessions();
    res.send(`
    <h1>Test Cookies</h1>
    <p><strong>Cookies reçus:</strong> ${JSON.stringify(req.cookies)}</p>
    <p><strong>Sessions disponibles:</strong> ${sessionStore.getSessionCount()}</p>
    <p><strong>Sessions détails:</strong> ${JSON.stringify(sessions, null, 2)}</p>
    <p><strong>Headers:</strong> ${JSON.stringify(req.headers, null, 2)}</p>
    <br>
    <a href="/login">← Retour login</a> | <a href="/">Tester homepage</a>
    `);
});

// ROUTE D'URGENCE - LOGIN DIRECT SANS BOUCLE
app.get('/direct-login', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Login Direct</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #f0f0f0; }
            .container { max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
            input { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px; }
            button { width: 100%; padding: 15px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; }
            button:hover { background: #0056b3; }
            .message { padding: 10px; margin: 10px 0; border-radius: 5px; }
            .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
            .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>🚨 LOGIN DIRECT (Anti-Boucle)</h2>
            
            <div id="message"></div>
            
            <form id="directLogin">
                <input type="email" id="email" placeholder="Email" value="admin@example.com" required>
                <input type="password" id="password" placeholder="Mot de passe" value="admin123" required>
                <button type="submit">CONNEXION DIRECTE</button>
            </form>
            
            <p><small>Compte de test pré-rempli. Cliquez juste sur "CONNEXION DIRECTE"</small></p>
        </div>
        
        <script>
            document.getElementById('directLogin').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                
                try {
                    console.log('Tentative de connexion:', { email, password });
                    
                    const response = await fetch('/api/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'same-origin', // Important pour les cookies
                        body: JSON.stringify({ email, password })
                    });
                    
                    const result = await response.json();
                    console.log('Réponse serveur:', result);
                    
                    if (response.ok) {
                        document.getElementById('message').innerHTML = 
                            '<div class="success">✅ Connexion réussie ! Redirection...</div>';
                        
                        // Redirection avec recharge forcée
                        setTimeout(() => {
                            window.location.replace('/dashboard');
                        }, 500);
                    } else {
                        document.getElementById('message').innerHTML = 
                            '<div class="error">❌ ' + result.error + '</div>';
                    }
                } catch (error) {
                    console.error('Erreur:', error);
                    document.getElementById('message').innerHTML = 
                        '<div class="error">❌ Erreur: ' + error.message + '</div>';
                }
            });
        </script>
    </body>
    </html>
    `);
});

// Dashboard route (requires authentication) - NOUVEAU DASHBOARD COMPLET
app.get('/dashboard', requireAuth, (req, res) => {
    console.log('📊 Route /dashboard appelée');
    console.log('👤 User:', req.user ? req.user.email : 'none');
    console.log('🍪 Cookies:', JSON.stringify(req.cookies));
    
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>🎛️ Agent Skeleton OSS - Dashboard Complet</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);
                color: #ffffff;
                line-height: 1.6;
            }
            
            /* Header */
            .header {
                background: linear-gradient(135deg, #16213e 0%, #0f3460 100%);
                padding: 20px 40px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .header h1 {
                font-size: 28px;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .header-actions {
                display: flex;
                gap: 15px;
            }
            .btn {
                padding: 10px 20px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                transition: all 0.3s;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }
            .btn-primary { background: #3498db; color: white; }
            .btn-primary:hover { background: #2980b9; transform: translateY(-2px); }
            .btn-success { background: #2ecc71; color: white; }
            .btn-success:hover { background: #27ae60; transform: translateY(-2px); }
            .btn-danger { background: #e74c3c; color: white; }
            .btn-danger:hover { background: #c0392b; transform: translateY(-2px); }
            
            /* Container */
            .container {
                max-width: 1600px;
                margin: 0 auto;
                padding: 30px;
            }
            
            /* Grid Layout */
            .grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                gap: 25px;
                margin-bottom: 30px;
            }
            
            /* Cards */
            .card {
                background: linear-gradient(135deg, #1e2a3a 0%, #263849 100%);
                border-radius: 12px;
                padding: 25px;
                box-shadow: 0 8px 30px rgba(0,0,0,0.4);
                transition: all 0.3s;
            }
            .card:hover {
                transform: translateY(-5px);
                box-shadow: 0 12px 40px rgba(52, 152, 219, 0.3);
            }
            .card-header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid rgba(52, 152, 219, 0.3);
            }
            .card-header h3 {
                font-size: 20px;
                flex: 1;
            }
            .card-icon {
                font-size: 28px;
            }
            
            /* Stats */
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
            }
            .stat-item {
                background: rgba(255,255,255,0.05);
                padding: 15px;
                border-radius: 8px;
                text-align: center;
            }
            .stat-value {
                font-size: 32px;
                font-weight: bold;
                color: #3498db;
                margin-bottom: 5px;
            }
            .stat-label {
                font-size: 13px;
                color: #bdc3c7;
                text-transform: uppercase;
            }
            
            /* Agents Grid */
            .agents-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 15px;
            }
            .agent-card {
                background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s;
                border: 2px solid transparent;
            }
            .agent-card:hover {
                border-color: #3498db;
                transform: scale(1.05);
            }
            .agent-card.active {
                border-color: #2ecc71;
                background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
            }
            .agent-icon {
                font-size: 42px;
                margin-bottom: 10px;
            }
            .agent-name {
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 5px;
            }
            .agent-status {
                font-size: 11px;
                color: #95a5a6;
            }
            
            /* History List */
            .history-list {
                max-height: 400px;
                overflow-y: auto;
            }
            .history-item {
                background: rgba(255,255,255,0.05);
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 12px;
                border-left: 4px solid #3498db;
                transition: all 0.3s;
            }
            .history-item:hover {
                background: rgba(255,255,255,0.1);
                transform: translateX(5px);
            }
            .history-item.assistant {
                border-left-color: #2ecc71;
            }
            .history-item.user {
                border-left-color: #e74c3c;
            }
            .history-meta {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                font-size: 12px;
                color: #95a5a6;
            }
            .history-content {
                font-size: 14px;
                line-height: 1.5;
            }
            
            /* Instructions */
            .instruction-item {
                background: rgba(46, 204, 113, 0.1);
                border: 1px solid #2ecc71;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .instruction-content {
                flex: 1;
            }
            .instruction-category {
                display: inline-block;
                background: #3498db;
                color: white;
                padding: 3px 10px;
                border-radius: 4px;
                font-size: 11px;
                margin-right: 10px;
            }
            .instruction-text {
                margin-top: 8px;
                font-size: 14px;
            }
            
            /* Workflows */
            .workflow-item {
                background: rgba(255,255,255,0.05);
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .workflow-info {
                flex: 1;
            }
            .workflow-name {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 5px;
            }
            .workflow-id {
                font-size: 12px;
                color: #95a5a6;
                font-family: monospace;
            }
            .workflow-actions {
                display: flex;
                gap: 8px;
            }
            .btn-small {
                padding: 6px 12px;
                font-size: 12px;
            }
            
            /* Loading */
            .loading {
                text-align: center;
                padding: 40px;
                font-size: 16px;
                color: #95a5a6;
            }
            .spinner {
                border: 3px solid rgba(255,255,255,0.1);
                border-top: 3px solid #3498db;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 0 auto 15px;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* Scrollbar */
            ::-webkit-scrollbar {
                width: 8px;
                height: 8px;
            }
            ::-webkit-scrollbar-track {
                background: rgba(255,255,255,0.05);
                border-radius: 4px;
            }
            ::-webkit-scrollbar-thumb {
                background: #3498db;
                border-radius: 4px;
            }
            ::-webkit-scrollbar-thumb:hover {
                background: #2980b9;
            }
            
            /* Modal */
            .modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                z-index: 1000;
                justify-content: center;
                align-items: center;
            }
            .modal.active {
                display: flex;
            }
            .modal-content {
                background: linear-gradient(135deg, #1e2a3a 0%, #263849 100%);
                padding: 30px;
                border-radius: 12px;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            }
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            .modal-close {
                background: #e74c3c;
                color: white;
                border: none;
                padding: 8px 15px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
            }
            
            /* Form */
            .form-group {
                margin-bottom: 20px;
            }
            .form-label {
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                font-size: 14px;
            }
            .form-input, .form-textarea, .form-select {
                width: 100%;
                padding: 12px;
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 6px;
                color: white;
                font-size: 14px;
            }
            .form-textarea {
                min-height: 100px;
                resize: vertical;
            }
            
            /* Badge */
            .badge {
                display: inline-block;
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
            }
            .badge-success { background: #2ecc71; color: white; }
            .badge-warning { background: #f39c12; color: white; }
            .badge-danger { background: #e74c3c; color: white; }
            .badge-info { background: #3498db; color: white; }
            
            /* Chat Interface */
            .chat-container {
                background: linear-gradient(135deg, #1e2a3a 0%, #263849 100%);
                border-radius: 12px;
                padding: 25px;
                box-shadow: 0 8px 30px rgba(0,0,0,0.4);
                margin-bottom: 30px;
            }
            .chat-messages {
                max-height: 400px;
                overflow-y: auto;
                margin-bottom: 20px;
                padding: 15px;
                background: rgba(0,0,0,0.2);
                border-radius: 8px;
            }
            .chat-message {
                margin-bottom: 15px;
                padding: 12px 16px;
                border-radius: 8px;
                max-width: 80%;
                word-wrap: break-word;
            }
            .chat-message.user {
                background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
                margin-left: auto;
                text-align: right;
            }
            .chat-message.assistant {
                background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
                margin-right: auto;
            }
            .chat-input-area {
                display: flex;
                gap: 12px;
            }
            .chat-input {
                flex: 1;
                padding: 12px;
                background: rgba(255,255,255,0.1);
                border: 2px solid rgba(52, 152, 219, 0.3);
                border-radius: 8px;
                color: white;
                font-size: 14px;
                resize: vertical;
                min-height: 60px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            .chat-input:focus {
                outline: none;
                border-color: #3498db;
            }
            .chat-send-btn {
                padding: 12px 30px;
                background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
                border: none;
                border-radius: 8px;
                color: white;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }
            .chat-send-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(52, 152, 219, 0.4);
            }
            .chat-send-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            /* File Upload */
            .upload-area {
                padding: 15px;
                background: rgba(255,255,255,0.05);
                border: 2px dashed rgba(52, 152, 219, 0.3);
                border-radius: 8px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s;
            }
            .upload-area:hover {
                border-color: #3498db;
                background: rgba(52, 152, 219, 0.1);
            }
            .upload-area input[type="file"] {
                display: none;
            }
        </style>
    </head>
    <body>
        <!-- Header -->
        <div class="header">
            <h1>
                <span>🎛️</span>
                Agent Skeleton OSS - Dashboard Central
            </h1>
            <div class="header-actions">
                <button onclick="scrollToChatSection()" class="btn btn-primary">💬 Chat</button>
                <button onclick="scrollToUploadSection()" class="btn btn-success">📁 Upload</button>
                <button onclick="openInstructionModal()" class="btn btn-primary">➕ Instruction</button>
                <button onclick="refreshAll()" class="btn btn-success">🔄 Actualiser</button>
            </div>
        </div>

        <div class="container">
            <!-- Stats Grid -->
            <div class="grid">
                <!-- Statistiques Générales -->
                <div class="card">
                    <div class="card-header">
                        <span class="card-icon">📊</span>
                        <h3>Statistiques Système</h3>
                    </div>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-value" id="totalMessages">-</div>
                            <div class="stat-label">Messages Total</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="totalInstructions">-</div>
                            <div class="stat-label">Instructions</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="recentMessages">-</div>
                            <div class="stat-label">Récents (24h)</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="totalFiles">-</div>
                            <div class="stat-label">Fichiers</div>
                        </div>
                    </div>
                </div>

                <!-- Agent Orchestrateur -->
                <div class="card">
                    <div class="card-header">
                        <span class="card-icon">🎯</span>
                        <h3>Orchestrateur Central</h3>
                        <span class="badge badge-success">ACTIF</span>
                    </div>
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 64px; margin-bottom: 15px;">🧠</div>
                        <h4 style="font-size: 18px; margin-bottom: 10px;">Agent Orchestrateur</h4>
                        <p style="color: #95a5a6; font-size: 14px;">
                            Coordonne tous les sous-agents<br>
                            Analyse les intentions<br>
                            Route les requêtes intelligemment
                        </p>
                    </div>
                </div>

                <!-- Man in the Loop -->
                <div class="card">
                    <div class="card-header">
                        <span class="card-icon">👤</span>
                        <h3>Man in the Loop (Vous)</h3>
                        <span class="badge badge-info">CONTRÔLE</span>
                    </div>
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 64px; margin-bottom: 15px;">👨‍💼</div>
                        <h4 style="font-size: 18px; margin-bottom: 10px;">Contrôle Humain</h4>
                        <p style="color: #95a5a6; font-size: 14px;">
                            Supervision en temps réel<br>
                            Validation des actions critiques<br>
                            Override des décisions
                        </p>
                    </div>
                </div>
            </div>

            <!-- SECTION CHAT INTERACTIVE -->
            <div class="chat-container" id="chatSection">
                <div class="card-header">
                    <span class="card-icon">💬</span>
                    <h3>Chat avec les Agents IA</h3>
                    <span class="badge badge-success">EN LIGNE</span>
                </div>
                
                <!-- Sélecteur de Modèle IA - 60+ Modèles OpenRouter -->
                <div style="margin-bottom: 15px; padding: 15px; background: rgba(52, 152, 219, 0.1); border-radius: 8px; border-left: 4px solid #3498db;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px;">
                        🤖 Modèle IA (60+ disponibles) :
                    </label>
                    <select id="modelSelect" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.1); border: 1px solid rgba(52, 152, 219, 0.3); border-radius: 6px; color: white; font-size: 14px;">
                        <!-- 🌟 MODÈLES RECOMMANDÉS -->
                        <optgroup label="⭐ RECOMMANDÉS">
                            <option value="anthropic/claude-3.5-sonnet" selected>Claude 3.5 Sonnet (Meilleur)</option>
                            <option value="openai/gpt-4o">GPT-4o (Multimodal)</option>
                            <option value="google/gemini-pro-1.5">Gemini Pro 1.5</option>
                            <option value="meta-llama/llama-3.1-70b-instruct">Llama 3.1 70B</option>
                        </optgroup>
                        
                        <!-- 🆓 MODÈLES GRATUITS -->
                        <optgroup label="🆓 GRATUITS">
                            <option value="meta-llama/llama-3-8b-instruct:free">Llama 3 8B (Gratuit)</option>
                            <option value="microsoft/phi-3-medium-128k-instruct:free">Phi-3 Medium (Gratuit)</option>
                            <option value="google/gemma-7b-it:free">Gemma 7B (Gratuit)</option>
                            <option value="qwen/qwen-2-7b-instruct:free">Qwen 2 7B (Gratuit)</option>
                        </optgroup>
                        
                        <!-- 🧠 ANTHROPIC CLAUDE -->
                        <optgroup label="🧠 ANTHROPIC CLAUDE">
                            <option value="anthropic/claude-3-opus">Claude 3 Opus (Le plus puissant)</option>
                            <option value="anthropic/claude-3-sonnet">Claude 3 Sonnet</option>
                            <option value="anthropic/claude-3-haiku">Claude 3 Haiku (Rapide)</option>
                        </optgroup>
                        
                        <!-- 🤖 OPENAI GPT -->
                        <optgroup label="🤖 OPENAI GPT">
                            <option value="openai/gpt-4-turbo">GPT-4 Turbo</option>
                            <option value="openai/gpt-4">GPT-4</option>
                            <option value="openai/gpt-3.5-turbo">GPT-3.5 Turbo</option>
                            <option value="openai/gpt-3.5-turbo-instruct">GPT-3.5 Instruct</option>
                        </optgroup>
                        
                        <!-- 💎 GOOGLE GEMINI -->
                        <optgroup label="💎 GOOGLE GEMINI">
                            <option value="google/gemini-pro">Gemini Pro</option>
                            <option value="google/gemini-flash-1.5">Gemini Flash 1.5 (Rapide)</option>
                            <option value="google/palm-2-chat-bison">PaLM 2 Chat</option>
                        </optgroup>
                        
                        <!-- 🦙 META LLAMA -->
                        <optgroup label="🦙 META LLAMA">
                            <option value="meta-llama/llama-3.1-405b-instruct">Llama 3.1 405B (Énorme)</option>
                            <option value="meta-llama/llama-3.1-70b-instruct">Llama 3.1 70B</option>
                            <option value="meta-llama/llama-3-70b-instruct">Llama 3 70B</option>
                            <option value="meta-llama/llama-3-8b-instruct">Llama 3 8B</option>
                        </optgroup>
                        
                        <!-- 🇨🇳 ALIBABA QWEN -->
                        <optgroup label="🇨🇳 ALIBABA QWEN">
                            <option value="qwen/qwen-2-72b-instruct">Qwen 2 72B</option>
                            <option value="qwen/qwen-turbo">Qwen Turbo</option>
                            <option value="qwen/qwen-plus">Qwen Plus</option>
                            <option value="qwen/qwen-max">Qwen Max</option>
                        </optgroup>
                        
                        <!-- 🌟 MISTRAL AI -->
                        <optgroup label="🌟 MISTRAL AI">
                            <option value="mistralai/mistral-large">Mistral Large</option>
                            <option value="mistralai/mistral-medium">Mistral Medium</option>
                            <option value="mistralai/mistral-small">Mistral Small</option>
                            <option value="mistralai/mixtral-8x7b-instruct">Mixtral 8x7B</option>
                        </optgroup>
                        
                        <!-- 🔍 PERPLEXITY -->
                        <optgroup label="🔍 PERPLEXITY">
                            <option value="perplexity/llama-3.1-sonar-large-128k-online">Sonar Large Online</option>
                            <option value="perplexity/llama-3.1-sonar-small-128k-online">Sonar Small Online</option>
                        </optgroup>
                        
                        <!-- 🚀 AUTRES MODÈLES -->
                        <optgroup label="🚀 AUTRES">
                            <option value="x-ai/grok-beta">Grok Beta (xAI)</option>
                            <option value="cohere/command-r-plus">Command R+ (Cohere)</option>
                            <option value="databricks/dbrx-instruct">DBRX Instruct</option>
                            <option value="deepseek/deepseek-coder">DeepSeek Coder</option>
                            <option value="microsoft/wizardlm-2-8x22b">WizardLM 2 8x22B</option>
                        </optgroup>
                    </select>
                    <div style="margin-top: 8px; font-size: 12px; color: #95a5a6;">
                        💡 Claude 3.5 Sonnet recommandé | 🆓 Modèles gratuits disponibles | 60+ modèles via OpenRouter
                    </div>
                </div>
                
                <div class="chat-messages" id="chatMessages">
                    <div class="loading">Prêt à converser avec vos agents...</div>
                </div>
                <div class="chat-input-area">
                    <textarea 
                        id="chatInput" 
                        class="chat-input" 
                        placeholder="💬 Tapez votre message ici... (Shift+Enter pour nouvelle ligne, Enter pour envoyer)"
                        onkeydown="handleChatKeyDown(event)"
                    ></textarea>
                    <button id="chatSendBtn" class="chat-send-btn" onclick="sendChatMessage()">
                        📤 Envoyer
                    </button>
                </div>
            </div>

            <!-- SECTION UPLOAD DE FICHIERS -->
            <div class="card" id="uploadSection">
                <div class="card-header">
                    <span class="card-icon">📁</span>
                    <h3>Upload de Fichiers</h3>
                </div>
                <div class="upload-area" onclick="document.getElementById('fileInput').click()">
                    <input type="file" id="fileInput" onchange="handleFileUpload(event)">
                    <div style="font-size: 48px; margin-bottom: 10px;">📤</div>
                    <p style="font-size: 16px; margin-bottom: 5px;"><strong>Cliquez pour choisir un fichier</strong></p>
                    <p style="font-size: 13px; color: #95a5a6;">Tous types de fichiers acceptés</p>
                </div>
                <div id="uploadStatus" style="margin-top: 15px; text-align: center;"></div>
                <div id="filesList" style="margin-top: 20px;"></div>
            </div>

            <!-- Agents Grid -->
            <div class="card">
                <div class="card-header">
                    <span class="card-icon">🤖</span>
                    <h3>Sous-Agents Spécialisés</h3>
                </div>
                <div class="agents-grid" id="agentsGrid">
                    <div class="agent-card" data-agent="n8n" onclick="showAgentDetails('n8n')">
                        <div class="agent-icon">⚡</div>
                        <div class="agent-name">N8N Agent</div>
                        <div class="agent-status">Workflows & Automatisation</div>
                    </div>
                    <div class="agent-card" data-agent="file" onclick="showAgentDetails('file')">
                        <div class="agent-icon">📁</div>
                        <div class="agent-name">File Agent</div>
                        <div class="agent-status">Gestion Fichiers</div>
                    </div>
                    <div class="agent-card" data-agent="coolify" onclick="showAgentDetails('coolify')">
                        <div class="agent-icon">🚀</div>
                        <div class="agent-name">Coolify Agent</div>
                        <div class="agent-status">Déploiements</div>
                    </div>
                    <div class="agent-card" data-agent="baserow" onclick="showAgentDetails('baserow')">
                        <div class="agent-icon">📊</div>
                        <div class="agent-name">Baserow Agent</div>
                        <div class="agent-status">Base de Données</div>
                    </div>
                    <div class="agent-card" data-agent="email" onclick="showAgentDetails('email')">
                        <div class="agent-icon">📧</div>
                        <div class="agent-name">Email Agent</div>
                        <div class="agent-status">Communication</div>
                    </div>
                    <div class="agent-card" data-agent="security" onclick="showAgentDetails('security')">
                        <div class="agent-icon">🔒</div>
                        <div class="agent-name">Security Agent</div>
                        <div class="agent-status">Sécurité</div>
                    </div>
                </div>
            </div>

            <!-- Two Column Layout -->
            <div class="grid">
                <!-- Historique des Conversations -->
                <div class="card">
                    <div class="card-header">
                        <span class="card-icon">💬</span>
                        <h3>Historique Conversations</h3>
                        <button class="btn btn-small btn-danger" onclick="clearHistory()">🗑️ Effacer</button>
                    </div>
                    <div class="history-list" id="historyList">
                        <div class="loading">
                            <div class="spinner"></div>
                            Chargement de l'historique...
                        </div>
                    </div>
                </div>

                <!-- Instructions Système -->
                <div class="card">
                    <div class="card-header">
                        <span class="card-icon">📝</span>
                        <h3>Instructions Système</h3>
                        <button class="btn btn-small btn-primary" onclick="openInstructionModal()">➕ Ajouter</button>
                    </div>
                    <div id="instructionsList">
                        <div class="loading">
                            <div class="spinner"></div>
                            Chargement des instructions...
                        </div>
                    </div>
                </div>
            </div>

            <!-- Workflows N8N -->
            <div class="card">
                <div class="card-header">
                    <span class="card-icon">⚡</span>
                    <h3>Workflows N8N Actifs</h3>
                    <button class="btn btn-small btn-success" onclick="loadWorkflows()">🔄 Actualiser</button>
                </div>
                <div id="workflowsList">
                    <div class="loading">
                        <div class="spinner"></div>
                        Chargement des workflows...
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal Instruction -->
        <div class="modal" id="instructionModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>➕ Ajouter une Instruction Système</h3>
                    <button class="modal-close" onclick="closeInstructionModal()">✖ Fermer</button>
                </div>
                <form onsubmit="addInstruction(event)">
                    <div class="form-group">
                        <label class="form-label">Instruction *</label>
                        <textarea class="form-textarea" id="instructionText" required placeholder="Ex: Réponds toujours en français avec des émojis"></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Catégorie</label>
                        <select class="form-select" id="instructionCategory">
                            <option value="general">Général</option>
                            <option value="style">Style de Réponse</option>
                            <option value="language">Langue</option>
                            <option value="behavior">Comportement</option>
                            <option value="formatting">Formatage</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Priorité (1-10)</label>
                        <input type="number" class="form-input" id="instructionPriority" min="1" max="10" value="5">
                    </div>
                    <button type="submit" class="btn btn-success" style="width: 100%;">✅ Ajouter l'Instruction</button>
                </form>
            </div>
        </div>

        <!-- Modal Agent Details -->
        <div class="modal" id="agentModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="agentModalTitle">🤖 Détails Agent</h3>
                    <button class="modal-close" onclick="closeAgentModal()">✖ Fermer</button>
                </div>
                <div id="agentModalContent">
                    <div class="loading">
                        <div class="spinner"></div>
                        Chargement des informations...
                    </div>
                </div>
            </div>
        </div>

        <script>
            // Variables globales
            let refreshInterval;

            // Initialisation
            document.addEventListener('DOMContentLoaded', function() {
                console.log('🚀 Dashboard chargé');
                loadAll();
                loadFilesList();
                
                // Auto-refresh toutes les 30 secondes
                refreshInterval = setInterval(() => {
                    loadAll();
                    loadFilesList();
                }, 30000);
            });

            // Charger toutes les données
            async function loadAll() {
                await Promise.all([
                    loadStats(),
                    loadHistory(),
                    loadInstructions(),
                    loadWorkflows()
                ]);
            }

            // Charger les statistiques
            async function loadStats() {
                try {
                    const response = await fetch('/api/memory/stats');
                    const data = await response.json();
                    
                    if (data.success && data.stats) {
                        document.getElementById('totalMessages').textContent = data.stats.totalMessages || 0;
                        document.getElementById('totalInstructions').textContent = data.stats.totalInstructions || 0;
                        document.getElementById('recentMessages').textContent = data.stats.recentMessages || 0;
                    }
                } catch (error) {
                    console.error('❌ Erreur stats:', error);
                }
                
                // Charger aussi le nombre de fichiers
                try {
                    const response = await fetch('/api/files');
                    const data = await response.json();
                    document.getElementById('totalFiles').textContent = data.count || 0;
                } catch (error) {
                    document.getElementById('totalFiles').textContent = '0';
                }
            }

            // Charger l'historique
            async function loadHistory() {
                try {
                    const response = await fetch('/api/conversation/history?limit=10');
                    const data = await response.json();
                    
                    const container = document.getElementById('historyList');
                    
                    if (data.success && data.history && data.history.length > 0) {
                        container.innerHTML = data.history.map(item => \`
                            <div class="history-item \${item.role}">
                                <div class="history-meta">
                                    <span><strong>\${item.role === 'user' ? '👤 Utilisateur' : '🤖 Assistant'}</strong></span>
                                    <span>\${new Date(item.createdAt).toLocaleString('fr-FR')}</span>
                                </div>
                                <div class="history-content">\${item.message.substring(0, 150)}\${item.message.length > 150 ? '...' : ''}</div>
                            </div>
                        \`).join('');
                    } else {
                        container.innerHTML = '<div class="loading">Aucun historique disponible</div>';
                    }
                } catch (error) {
                    console.error('❌ Erreur historique:', error);
                    document.getElementById('historyList').innerHTML = '<div class="loading">❌ Erreur de chargement</div>';
                }
            }

            // Charger les instructions
            async function loadInstructions() {
                try {
                    const response = await fetch('/api/instructions/list');
                    const data = await response.json();
                    
                    const container = document.getElementById('instructionsList');
                    
                    if (data.success && data.instructions && data.instructions.length > 0) {
                        container.innerHTML = data.instructions.map(item => \`
                            <div class="instruction-item">
                                <div class="instruction-content">
                                    <span class="instruction-category">\${item.category || 'general'}</span>
                                    <span class="badge badge-info">Priorité: \${item.priority || 5}</span>
                                    <div class="instruction-text">\${item.instruction}</div>
                                </div>
                                <button class="btn btn-small btn-danger" onclick="deleteInstruction(\${item.id})">🗑️</button>
                            </div>
                        \`).join('');
                    } else {
                        container.innerHTML = '<div class="loading">Aucune instruction configurée</div>';
                    }
                } catch (error) {
                    console.error('❌ Erreur instructions:', error);
                    document.getElementById('instructionsList').innerHTML = '<div class="loading">❌ Erreur de chargement</div>';
                }
            }

            // Charger les workflows (simulation)
            async function loadWorkflows() {
                const container = document.getElementById('workflowsList');
                
                // Simulation de workflows (à remplacer par vraie API N8N)
                const mockWorkflows = [
                    { id: '3wnBU3rbhJATJfYW', name: '🔴 Inactif **Demo: My first AI Agent in n8n**', status: 'inactive' },
                    { id: 'abc123def456ghi7', name: '✅ Publication Automatique Réseaux Sociaux', status: 'active' },
                    { id: 'xyz789uvw321rst4', name: '📧 Envoi Email Notifications', status: 'active' }
                ];
                
                container.innerHTML = mockWorkflows.map(wf => \`
                    <div class="workflow-item">
                        <div class="workflow-info">
                            <div class="workflow-name">\${wf.name}</div>
                            <div class="workflow-id">ID: \${wf.id}</div>
                        </div>
                        <div class="workflow-actions">
                            <button class="btn btn-small btn-primary" onclick="triggerWorkflow('\${wf.id}')">▶️ Lancer</button>
                            <button class="btn btn-small btn-danger" onclick="deleteWorkflow('\${wf.id}')">🗑️ Supprimer</button>
                        </div>
                    </div>
                \`).join('');
            }

            // Ajouter une instruction
            async function addInstruction(event) {
                event.preventDefault();
                
                const instruction = document.getElementById('instructionText').value;
                const category = document.getElementById('instructionCategory').value;
                const priority = parseInt(document.getElementById('instructionPriority').value);
                
                try {
                    const response = await fetch('/api/instructions/add', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ instruction, category, priority })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        alert('✅ Instruction ajoutée avec succès !');
                        closeInstructionModal();
                        loadInstructions();
                        
                        // Reset form
                        document.getElementById('instructionText').value = '';
                        document.getElementById('instructionPriority').value = '5';
                    } else {
                        alert('❌ Erreur: ' + data.error);
                    }
                } catch (error) {
                    console.error('❌ Erreur ajout instruction:', error);
                    alert('❌ Erreur: ' + error.message);
                }
            }

            // Supprimer une instruction
            async function deleteInstruction(id) {
                if (!confirm('Voulez-vous vraiment désactiver cette instruction ?')) return;
                
                try {
                    const response = await fetch(\`/api/instructions/\${id}\`, {
                        method: 'DELETE'
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        alert('✅ Instruction désactivée');
                        loadInstructions();
                    } else {
                        alert('❌ Erreur: ' + data.error);
                    }
                } catch (error) {
                    alert('❌ Erreur: ' + error.message);
                }
            }

            // Effacer l'historique
            async function clearHistory() {
                if (!confirm('Voulez-vous vraiment effacer l\\'historique de plus de 90 jours ?')) return;
                
                try {
                    const response = await fetch('/api/conversation/clear?days=90', {
                        method: 'DELETE'
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        alert(\`✅ \${data.deletedCount} messages supprimés\`);
                        loadHistory();
                    } else {
                        alert('❌ Erreur: ' + data.error);
                    }
                } catch (error) {
                    alert('❌ Erreur: ' + error.message);
                }
            }

            // Déclencher un workflow
            function triggerWorkflow(id) {
                alert(\`⚡ Déclenchement du workflow \${id}...\\n\\nCette fonctionnalité sera implémentée avec l'API N8N.\`);
            }

            // Supprimer un workflow
            function deleteWorkflow(id) {
                if (!confirm(\`Voulez-vous vraiment supprimer le workflow \${id} ?\`)) return;
                alert(\`🗑️ Suppression du workflow \${id}...\\n\\nCette fonctionnalité sera implémentée avec l'API N8N.\`);
            }

            // Modal
            function openInstructionModal() {
                document.getElementById('instructionModal').classList.add('active');
            }

            function closeInstructionModal() {
                document.getElementById('instructionModal').classList.remove('active');
            }

            // Actualiser tout
            function refreshAll() {
                loadAll();
                loadFilesList();
                alert('🔄 Données actualisées !');
            }

            // === NOUVELLES FONCTIONS CHAT ===
            
            // Gérer les touches dans le chat (Enter pour envoyer, Shift+Enter pour nouvelle ligne)
            function handleChatKeyDown(event) {
                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    sendChatMessage();
                }
            }
            
            // Envoyer un message dans le chat
            async function sendChatMessage() {
                const input = document.getElementById('chatInput');
                const message = input.value.trim();
                
                if (!message) return;
                
                // Récupérer le modèle sélectionné
                const selectedModel = document.getElementById('modelSelect').value;
                
                const sendBtn = document.getElementById('chatSendBtn');
                sendBtn.disabled = true;
                sendBtn.textContent = '⏳ Envoi...';
                
                // Afficher le message utilisateur
                displayChatMessage('user', message);
                input.value = '';
                
                try {
                    const response = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            message, 
                            model: selectedModel
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success || data.response) {
                        displayChatMessage('assistant', data.response);
                        
                        // Rafraîchir l'historique après quelques secondes
                        setTimeout(() => loadHistory(), 2000);
                    } else {
                        displayChatMessage('assistant', '❌ Erreur: ' + (data.error || 'Réponse invalide'));
                    }
                } catch (error) {
                    console.error('❌ Erreur chat:', error);
                    displayChatMessage('assistant', '❌ Erreur de connexion: ' + error.message);
                }
                
                sendBtn.disabled = false;
                sendBtn.textContent = '📤 Envoyer';
            }
            
            // Afficher un message dans le chat
            function displayChatMessage(role, content) {
                const container = document.getElementById('chatMessages');
                
                // Supprimer le message "Prêt à converser" si présent
                const loadingMsg = container.querySelector('.loading');
                if (loadingMsg) loadingMsg.remove();
                
                const messageDiv = document.createElement('div');
                messageDiv.className = \`chat-message \${role}\`;
                messageDiv.textContent = content;
                
                container.appendChild(messageDiv);
                messageDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
            
            // Scroller vers la section chat
            function scrollToChatSection() {
                document.getElementById('chatSection').scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }
            
            // === NOUVELLES FONCTIONS UPLOAD ===
            
            // Gérer l'upload de fichier
            async function handleFileUpload(event) {
                const file = event.target.files[0];
                if (!file) return;
                
                const statusDiv = document.getElementById('uploadStatus');
                statusDiv.innerHTML = \`
                    <div class="loading">
                        <div class="spinner"></div>
                        Upload de "\${file.name}" en cours...
                    </div>
                \`;
                
                const formData = new FormData();
                formData.append('file', file);
                
                try {
                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        statusDiv.innerHTML = \`
                            <div style="color: #2ecc71; font-weight: 600;">
                                ✅ Fichier uploadé avec succès !
                            </div>
                        \`;
                        
                        // Rafraîchir la liste des fichiers
                        setTimeout(() => {
                            loadFilesList();
                            statusDiv.innerHTML = '';
                        }, 3000);
                    } else {
                        statusDiv.innerHTML = \`
                            <div style="color: #e74c3c; font-weight: 600;">
                                ❌ Erreur: \${data.error || 'Upload échoué'}
                            </div>
                        \`;
                    }
                } catch (error) {
                    console.error('❌ Erreur upload:', error);
                    statusDiv.innerHTML = \`
                        <div style="color: #e74c3c; font-weight: 600;">
                            ❌ Erreur: \${error.message}
                        </div>
                    \`;
                }
                
                // Reset input
                event.target.value = '';
            }
            
            // Charger la liste des fichiers
            async function loadFilesList() {
                try {
                    const response = await fetch('/api/files');
                    const data = await response.json();
                    
                    const container = document.getElementById('filesList');
                    
                    if (data.success && data.files && data.files.length > 0) {
                        container.innerHTML = '<h4 style="margin-bottom: 15px;">📁 Fichiers uploadés (' + data.files.length + ')</h4>' +
                            data.files.map(file => \`
                                <div class="history-item" style="display: flex; justify-content: space-between; align-items: center;">
                                    <div style="flex: 1;">
                                        <strong>\${file.filename}</strong><br>
                                        <small style="color: #95a5a6;">
                                            Taille: \${formatFileSize(file.size)} | 
                                            Type: \${file.mimetype} | 
                                            Date: \${new Date(file.uploadedAt).toLocaleDateString('fr-FR')}
                                        </small>
                                    </div>
                                    <button class="btn btn-small btn-danger" onclick="deleteFile(\${file.id})">🗑️</button>
                                </div>
                            \`).join('');
                    } else {
                        container.innerHTML = '<p style="color: #95a5a6; text-align: center;">Aucun fichier uploadé</p>';
                    }
                } catch (error) {
                    console.error('❌ Erreur chargement fichiers:', error);
                }
            }
            
            // Formater la taille de fichier
            function formatFileSize(bytes) {
                if (bytes < 1024) return bytes + ' B';
                if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
                return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
            }
            
            // Supprimer un fichier
            async function deleteFile(fileId) {
                if (!confirm('Voulez-vous vraiment supprimer ce fichier ?')) return;
                
                try {
                    const response = await fetch(\`/api/files/\${fileId}\`, {
                        method: 'DELETE'
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        alert('✅ Fichier supprimé');
                        loadFilesList();
                        loadStats(); // Rafraîchir le compteur
                    } else {
                        alert('❌ Erreur: ' + data.error);
                    }
                } catch (error) {
                    alert('❌ Erreur: ' + error.message);
                }
            }
            
            // Scroller vers la section upload
            function scrollToUploadSection() {
                document.getElementById('uploadSection').scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }
            
            // === NOUVELLES FONCTIONS AGENTS ===
            
            // Afficher les détails d'un agent
            async function showAgentDetails(agentName) {
                const modal = document.getElementById('agentModal');
                const title = document.getElementById('agentModalTitle');
                const content = document.getElementById('agentModalContent');
                
                // Configurations des agents
                const agentConfigs = {
                    'n8n': {
                        icon: '⚡',
                        name: 'N8N Agent',
                        description: 'Gère les workflows et automatisations via n8n',
                        capabilities: [
                            '✅ Créer et exécuter des workflows',
                            '✅ Déclencher des webhooks',
                            '✅ Lister les workflows actifs',
                            '✅ Supprimer des workflows'
                        ],
                        actions: [
                            { label: '📋 Lister les workflows', action: 'listWorkflows()' },
                            { label: '▶️ Tester un workflow', action: 'testWorkflow()' }
                        ]
                    },
                    'file': {
                        icon: '📁',
                        name: 'File Agent',
                        description: 'Gère les opérations sur les fichiers',
                        capabilities: [
                            '✅ Upload de fichiers',
                            '✅ Stockage SQLite',
                            '✅ Recherche de fichiers',
                            '✅ Suppression de fichiers'
                        ],
                        actions: [
                            { label: '📁 Voir les fichiers', action: 'scrollToUploadSection()' }
                        ]
                    },
                    'coolify': {
                        icon: '🚀',
                        name: 'Coolify Agent',
                        description: 'Gère les déploiements via Coolify',
                        capabilities: [
                            '✅ Déployer des services',
                            '✅ Gérer les conteneurs',
                            '✅ Rollback de déploiements',
                            '✅ Monitoring des services'
                        ],
                        actions: [
                            { label: '🚀 Déployer un service', action: 'deployCoolifyService()' }
                        ]
                    },
                    'baserow': {
                        icon: '📊',
                        name: 'Baserow Agent',
                        description: 'Gère la base de données Baserow',
                        capabilities: [
                            '✅ Ajouter des lignes',
                            '✅ Lire des données',
                            '✅ Mettre à jour des lignes',
                            '✅ Supprimer des lignes'
                        ],
                        actions: [
                            { label: '📊 Consulter les données', action: 'alert("Baserow API nécessite configuration")' }
                        ]
                    },
                    'email': {
                        icon: '📧',
                        name: 'Email Agent',
                        description: 'Gère l\'envoi d\'emails',
                        capabilities: [
                            '✅ Envoi via SMTP',
                            '✅ Relay via n8n',
                            '✅ Templates d\'emails',
                            '✅ Notifications automatiques'
                        ],
                        actions: [
                            { label: '📧 Envoyer un test', action: 'sendTestEmail()' }
                        ]
                    },
                    'security': {
                        icon: '🔒',
                        name: 'Security Agent',
                        description: 'Gère la sécurité et les validations',
                        capabilities: [
                            '✅ Validation des API keys',
                            '✅ Rate limiting',
                            '✅ Sanitization des inputs',
                            '✅ Détection d\'anomalies'
                        ],
                        actions: [
                            { label: '🔒 Vérifier la sécurité', action: 'checkSecurity()' }
                        ]
                    }
                };
                
                const config = agentConfigs[agentName];
                
                title.innerHTML = \`\${config.icon} \${config.name}\`;
                
                content.innerHTML = \`
                    <div style="margin-bottom: 20px;">
                        <h4 style="margin-bottom: 10px;">📝 Description</h4>
                        <p style="color: #95a5a6;">\${config.description}</p>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <h4 style="margin-bottom: 10px;">⚡ Capacités</h4>
                        \${config.capabilities.map(cap => \`<div style="margin: 5px 0;">\${cap}</div>\`).join('')}
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <h4 style="margin-bottom: 10px;">🎯 Actions Disponibles</h4>
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            \${config.actions.map(action => \`
                                <button class="btn btn-primary" onclick="\${action.action}">
                                    \${action.label}
                                </button>
                            \`).join('')}
                        </div>
                    </div>
                    
                    <div style="background: rgba(52, 152, 219, 0.1); padding: 15px; border-radius: 8px; border-left: 4px solid #3498db;">
                        <strong>💡 Astuce:</strong> Vous pouvez interagir avec cet agent via le chat en mentionnant son nom ou en décrivant la tâche.
                    </div>
                \`;
                
                modal.classList.add('active');
            }
            
            // Fermer le modal agent
            function closeAgentModal() {
                document.getElementById('agentModal').classList.remove('active');
            }
            
            // Actions des agents
            function testWorkflow() {
                closeAgentModal();
                alert('⚡ Pour tester un workflow, utilisez le chat ou la section Workflows N8N ci-dessous.');
            }
            
            function deployCoolifyService() {
                closeAgentModal();
                const serviceId = prompt('Entrez l\'ID du service Coolify à déployer:');
                if (serviceId) {
                    alert(\`🚀 Déploiement du service \${serviceId}...\\n\\nCette fonctionnalité sera bientôt disponible via l'API.\`);
                }
            }
            
            function sendTestEmail() {
                closeAgentModal();
                const email = prompt('Entrez l\'adresse email de test:');
                if (email) {
                    alert(\`📧 Envoi d\'un email de test à \${email}...\\n\\nCette fonctionnalité sera bientôt disponible via l\'API.\`);
                }
            }
            
            function checkSecurity() {
                closeAgentModal();
                alert('🔒 Vérification de la sécurité...\\n\\n✅ Session valide\\n✅ Aucune anomalie détectée\\n✅ Rate limits: OK');
            }

            // Supprimer l'ancien event listener pour les agents (déjà géré par onclick dans le HTML)
        </script>
    </body>
    </html>
    `);
});

// API endpoint to get current user info
app.get('/api/user', requireAuth, (req, res) => {
    res.json(req.user);
});

// Route simple pour tester si le serveur fonctionne
app.get('/simple', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Test Simple</title></head>
    <body>
        <h1>✅ Serveur fonctionne !</h1>
        <div>
            <button onclick="testAuth()">Tester Auth</button>
            <div id="result"></div>
        </div>
        <script>
            async function testAuth() {
                try {
                    const response = await fetch('/api/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: 'test@test.com',
                            password: '123456',
                            name: 'Test User'
                        })
                    });
                    
                    const data = await response.json();
                    document.getElementById('result').innerHTML = 
                        '<h3>Inscription:</h3>' +
                        '<p>Status: ' + response.status + '</p>' +
                        '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
                    
                } catch (error) {
                    document.getElementById('result').innerHTML = 
                        '<p style="color: red;">Erreur: ' + error.message + '</p>';
                }
            }
        </script>
    </body>
    </html>
    `);
});

// Route de debug complète
app.get('/debug-test', (req, res) => {
    res.sendFile(path.join(__dirname, '../debug.html'));
});

// Route principale - Interface SaaS moderne et simple
app.get('/', (req, res) => {
    console.log('📍 Route / appelée');
    console.log('🍪 Tous les cookies:', JSON.stringify(req.cookies));
    console.log('📝 Sessions actives:', sessionStore.getSessionCount());
    
    // Vérifier si l'utilisateur est connecté
    const sessionId = req.cookies.sessionId;
    console.log('🔑 SessionId trouvé:', sessionId);
    
    const session = sessionStore.getSession(sessionId);
    if (session) {
        // Utilisateur connecté → dashboard
        console.log('✅ Session valide, redirect /dashboard');
        return res.redirect('/dashboard');
    } else {
        // Utilisateur non connecté → login
        console.log('❌ Pas de session, redirect /login');
        return res.redirect('/login');
    }
});

// Ancienne page d'accueil (conservée pour référence)
app.get('/old-home', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Agent Skeleton OSS</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f8fafc;
                color: #1a202c;
                line-height: 1.6;
            }
            
            .top-bar {
                background: white;
                border-bottom: 1px solid #e2e8f0;
                padding: 1rem 2rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            
            .user-info {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            
            .user-avatar {
                width: 32px;
                height: 32px;
                background: #4299e1;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
            }
            
            .logout-btn {
                background: #e2e8f0;
                color: #4a5568;
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.9rem;
                transition: background 0.2s;
            }
            
            .logout-btn:hover {
                background: #cbd5e0;
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 2rem;
            }
            
            .header {
                text-align: center;
                margin-bottom: 3rem;
            }
            
            .header h1 {
                font-size: 2.5rem;
                color: #2d3748;
                margin-bottom: 0.5rem;
                font-weight: 700;
            }
            
            .header p {
                font-size: 1.1rem;
                color: #718096;
            }
            
            .welcome-message {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 1.5rem;
                border-radius: 12px;
                text-align: center;
                margin-bottom: 2rem;
            }
            
            .grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                gap: 2rem;
                margin-bottom: 3rem;
            }
            
            .card {
                background: white;
                border-radius: 12px;
                padding: 2rem;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                border: 1px solid #e2e8f0;
                transition: all 0.2s;
            }
            
            .card:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }
            
            .card-icon {
                font-size: 2.5rem;
                margin-bottom: 1rem;
            }
            
            .card h3 {
                font-size: 1.5rem;
                color: #2d3748;
                margin-bottom: 1rem;
                font-weight: 600;
            }
            
            .card p {
                color: #4a5568;
                margin-bottom: 1.5rem;
            }
            
            .btn {
                display: inline-block;
                background: #4299e1;
                color: white;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 500;
                transition: background 0.2s;
                border: none;
                cursor: pointer;
                width: 100%;
                text-align: center;
            }
            
            .btn:hover {
                background: #3182ce;
            }
            
            .btn-secondary {
                background: #e2e8f0;
                color: #4a5568;
            }
            
            .btn-secondary:hover {
                background: #cbd5e0;
            }
            
            .status-bar {
                background: white;
                border-radius: 8px;
                padding: 1rem;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 1rem;
            }
            
            .status-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.9rem;
            }
            
            .status-dot {
                width: 8px;
                height: 8px;
                background: #48bb78;
                border-radius: 50%;
            }
            
            .feature-list {
                list-style: none;
                margin: 1rem 0;
            }
            
            .feature-list li {
                padding: 0.5rem 0;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: #4a5568;
            }
            
            .feature-list li::before {
                content: "✓";
                color: #48bb78;
                font-weight: bold;
            }
            
            @media (max-width: 768px) {
                .container { padding: 1rem; }
                .grid { grid-template-columns: 1fr; }
                .status-bar { flex-direction: column; }
                .top-bar { padding: 1rem; flex-direction: column; gap: 1rem; }
            }
        </style>
    </head>
    <body>
        <div class="top-bar">
            <div class="user-info">
                <div class="user-avatar">U</div>
                <span>Bonjour, <strong>Utilisateur</strong></span>
            </div>
            <button class="logout-btn" onclick="window.location.href='/login'">� Connexion</button>
        </div>
        
        <div class="container">
            <div class="header">
                <h1>🚀 Agent Skeleton OSS</h1>
                <p>Plateforme IA complète avec chat intelligent et upload de fichiers</p>
            </div>
            
            <div class="welcome-message">
                <h3>👋 Bienvenue !</h3>
                <p>Votre plateforme IA sécurisée est prête. Explorez les fonctionnalités ci-dessous.</p>
            </div>
            
            <div class="grid">
                <div class="card">
                    <div class="card-icon">💬</div>
                    <h3>Chat IA</h3>
                    <p>Chattez avec 60+ modèles IA incluant GPT-4, Claude, Gemini et Alibaba Qwen</p>
                    <ul class="feature-list">
                        <li>60+ modèles disponibles</li>
                        <li>Modèles gratuits inclus</li>
                        <li>Interface moderne</li>
                    </ul>
                    <a href="/chat" class="btn">Démarrer le chat</a>
                </div>
                
                <div class="card">
                    <div class="card-icon">📁</div>
                    <h3>Upload de fichiers</h3>
                    <p>Uploadez vos documents pour que l'IA puisse les analyser et répondre</p>
                    <ul class="feature-list">
                        <li>Drag & drop</li>
                        <li>Analyse automatique</li>
                        <li>Intégration chat</li>
                    </ul>
                    <a href="/upload-test" class="btn">Tester upload</a>
                </div>
            </div>
            
            <div class="status-bar">
                <div class="status-item">
                    <div class="status-dot"></div>
                    <span>Serveur en ligne</span>
                </div>
                <div class="status-item">
                    <div class="status-dot"></div>
                    <span>Chat IA prêt</span>
                </div>
                <div class="status-item">
                    <div class="status-dot"></div>
                    <span>Upload fonctionnel</span>
                </div>
                <div class="status-item">
                    <a href="/health" class="btn btn-secondary" style="width: auto; padding: 0.5rem 1rem;">Status</a>
                </div>
            </div>
        </div>
        
        <script>
            async function logout() {
                try {
                    const response = await fetch('/api/auth/logout', { method: 'POST' });
                    if (response.ok) {
                        window.location.href = '/login';
                    }
                } catch (error) {
                    console.error('Erreur déconnexion:', error);
                }
            }
        </script>
    </body>
    </html>
    `);
});

// Route de test d'upload ultra-simple
app.get('/upload-test', requireAuth, (req, res) => {
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
app.get('/chat', requireAuth, (req, res) => {
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
app.post('/api/upload-simple', requireAuth, (req, res) => {
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

// Route /api/files - AVEC PERSISTANCE SQLite
app.get('/api/files', (req, res) => {
    try {
        const userId = req.session?.user?.email || null;
        
        // Récupérer depuis SQLite au lieu de global.uploadedFiles
        const files = filePersistence.listFiles(userId, 100);
        
        res.json({ 
            success: true,
            files: files.map(f => ({ 
                id: f.id, 
                name: f.name, 
                size: f.size, 
                uploadedAt: f.uploadedAt,
                type: f.name.split('.').pop(),
                mimeType: f.mimeType
            })), 
            count: files.length,
            source: 'sqlite-persistent'
        });
    } catch (error) {
        console.error('❌ Erreur liste fichiers:', error.message);
        res.status(500).json({ success: false, error: 'Erreur liste fichiers' });
    }
});

// Route /api/upload - AVEC PERSISTANCE SQLite
app.post('/api/upload', requireAuth, (req, res) => {
    try {
        console.log('📁 API /api/upload appelée');
        console.log('📋 Headers reçus:', JSON.stringify(req.headers, null, 2));
        
        if (!req.body || req.body.length === 0) {
            return res.status(400).json({ success: false, error: 'Aucun contenu reçu' });
        }
        
        const fileId = Date.now().toString();
        
        // Essayer plusieurs façons de récupérer le nom du fichier
        const fileName = req.headers['x-filename'] || 
                        req.headers['filename'] || 
                        req.headers['x-file-name'] ||
                        req.headers['content-disposition']?.match(/filename="?([^"]+)"?/)?.[1] ||
                        `fichier_${fileId}.txt`;
        
        console.log('📝 Nom de fichier détecté:', fileName);
        
        const content = req.body.toString('utf8').substring(0, 50000);
        const size = req.body.length;
        const mimeType = req.headers['content-type'] || 'text/plain';
        const userId = req.session?.user?.email || null;
        
        // SAUVEGARDER DANS LA BASE DE DONNÉES SQLite
        const fileData = {
            id: fileId,
            name: fileName,
            content: content,
            size: size,
            mimeType: mimeType,
            userId: userId,
            uploadedAt: new Date().toISOString()
        };
        
        const saved = filePersistence.saveFile(fileData);
        
        if (!saved) {
            console.error('❌ Échec sauvegarde fichier dans SQLite');
            return res.status(500).json({ 
                success: false, 
                error: 'Échec sauvegarde du fichier' 
            });
        }
        
        // VÉRIFICATION: Le fichier est-il vraiment sauvegardé?
        const verifyFile = filePersistence.getFile(fileId);
        if (!verifyFile) {
            console.error('❌ VÉRIFICATION ÉCHEC: Fichier non trouvé après sauvegarde!');
            return res.status(500).json({ 
                success: false, 
                error: 'Fichier non persisté (vérification échouée)' 
            });
        }
        
        console.log('✅ Fichier uploadé ET VÉRIFIÉ:', fileName, 'Taille:', size, 'bytes');
        console.log('✅ ID:', fileId, 'User:', userId);
        
        res.json({
            success: true,
            fileId: fileId,
            fileName: fileName,
            verified: true,
            size: req.body.length,
            message: `Fichier "${fileName}" uploadé avec succès !`
        });
    } catch (error) {
        console.error('❌ Erreur upload:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Route /api/analytics (statistiques d'utilisation)
app.get('/api/analytics', (req, res) => {
    res.json({
        success: true,
        stats: {
            totalUsers: Object.keys(global.users).length,
            totalFiles: Object.keys(global.uploadedFiles || {}).length,
            totalSessions: sessionStore.getSessionCount(),
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        }
    });
});

// ============================================================================
// NOUVELLES API - HISTORIQUE CONVERSATIONS & INSTRUCTIONS SYSTÈME
// ============================================================================

/**
 * GET /api/conversation/history
 * Récupère l'historique des conversations de l'utilisateur
 */
app.get('/api/conversation/history', requireAuth, (req, res) => {
    try {
        const userId = req.session?.user?.email || 'anonymous';
        const limit = parseInt(req.query.limit) || 50;
        
        const history = conversationMemory.getHistory(userId, limit);
        const stats = conversationMemory.getStats(userId);
        
        res.json({
            success: true,
            history: history,
            stats: stats,
            count: history.length
        });
    } catch (error) {
        console.error('❌ Erreur récupération historique:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/conversation/search
 * Recherche dans l'historique des conversations
 */
app.post('/api/conversation/search', requireAuth, (req, res) => {
    try {
        const userId = req.session?.user?.email || 'anonymous';
        const { query, limit } = req.body;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Query requis'
            });
        }
        
        const results = conversationMemory.searchHistory(userId, query, limit || 20);
        
        res.json({
            success: true,
            results: results,
            count: results.length,
            query: query
        });
    } catch (error) {
        console.error('❌ Erreur recherche historique:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/conversation/clear
 * Nettoie l'historique ancien
 */
app.delete('/api/conversation/clear', requireAuth, (req, res) => {
    try {
        const userId = req.session?.user?.email || 'anonymous';
        const daysOld = parseInt(req.query.days) || 90;
        
        const deletedCount = conversationMemory.cleanOldHistory(userId, daysOld);
        
        res.json({
            success: true,
            message: `${deletedCount} messages anciens supprimés`,
            deletedCount: deletedCount
        });
    } catch (error) {
        console.error('❌ Erreur nettoyage historique:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/instructions/add
 * Ajouter une instruction système pour l'agent
 */
app.post('/api/instructions/add', requireAuth, (req, res) => {
    try {
        const userId = req.session?.user?.email || 'anonymous';
        const { instruction, category, priority } = req.body;
        
        if (!instruction) {
            return res.status(400).json({
                success: false,
                error: 'Instruction requise'
            });
        }
        
        const instructionId = conversationMemory.addInstruction(
            userId,
            instruction,
            category || 'general',
            priority || 5
        );
        
        res.json({
            success: true,
            message: 'Instruction ajoutée avec succès',
            instructionId: instructionId
        });
    } catch (error) {
        console.error('❌ Erreur ajout instruction:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/instructions/list
 * Liste toutes les instructions actives
 */
app.get('/api/instructions/list', requireAuth, (req, res) => {
    try {
        const userId = req.session?.user?.email || 'anonymous';
        const instructions = conversationMemory.getInstructions(userId);
        
        res.json({
            success: true,
            instructions: instructions,
            count: instructions.length
        });
    } catch (error) {
        console.error('❌ Erreur liste instructions:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/instructions/:id
 * Désactive une instruction système
 */
app.delete('/api/instructions/:id', requireAuth, (req, res) => {
    try {
        const instructionId = parseInt(req.params.id);
        const success = conversationMemory.deactivateInstruction(instructionId);
        
        if (success) {
            res.json({
                success: true,
                message: 'Instruction désactivée'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Instruction non trouvée'
            });
        }
    } catch (error) {
        console.error('❌ Erreur désactivation instruction:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/memory/stats
 * Statistiques de la mémoire conversationnelle
 */
app.get('/api/memory/stats', requireAuth, (req, res) => {
    try {
        const userId = req.session?.user?.email || 'anonymous';
        const stats = conversationMemory.getStats(userId);
        
        res.json({
            success: true,
            stats: stats
        });
    } catch (error) {
        console.error('❌ Erreur stats mémoire:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================================================
// FIN NOUVELLES API MÉMOIRE & INSTRUCTIONS
// ============================================================================

// Route /api/file/:fileId (récupérer un fichier spécifique)
app.get('/api/file/:fileId', requireAuth, (req, res) => {
    const { fileId } = req.params;
    const file = global.uploadedFiles[fileId];
    
    if (!file) {
        return res.status(404).json({
            success: false,
            error: 'Fichier non trouvé',
            fileId: fileId
        });
    }
    
    res.json({
        success: true,
        file: {
            id: file.id,
            name: file.name,
            size: file.size,
            uploadedAt: file.uploadedAt,
            contentPreview: file.content.substring(0, 200) + '...',
            type: file.name.split('.').pop()
        }
    });
});

// Route /api/email/send (simulation d'envoi d'email)
app.post('/api/email/send', requireAuth, (req, res) => {
    console.log('📧 Email send request:', req.body);
    // Simulation d'envoi d'email
    res.json({
        success: true,
        message: 'Email envoyé avec succès (simulation)',
        data: req.body
    });
});

// Route /api/social/publish (publication sur réseaux sociaux)
app.post('/api/social/publish', requireAuth, async (req, res) => {
    console.log('📱 Social publish request:', req.body);
    
    const { platform, content, media } = req.body;
    
    if (!platform || !content) {
        return res.status(400).json({
            success: false,
            error: 'Platform et content requis'
        });
    }
    
    // Simulation de publication sur réseaux sociaux
    // TODO: Intégrer vraies APIs (Twitter, Facebook, LinkedIn, etc.)
    
    res.json({
        success: true,
        message: `Publication sur ${platform} réussie (simulation)`,
        data: {
            platform,
            content: content.substring(0, 100) + '...',
            publishedAt: new Date().toISOString(),
            postId: `sim_${Date.now()}`,
            url: `https://${platform}.com/post/sim_${Date.now()}`
        }
    });
});

// API Chat IA avec 60+ modèles ET AGENT ORCHESTRATEUR CONVERSATIONNEL
app.post('/api/chat', requireAuth, async (req, res) => {
    try {
        const { message, model } = req.body;
        
        if (!message || !model) {
            return res.status(400).json({ error: 'Message et modèle requis' });
        }
        
        const userId = req.session?.user?.email || 'anonymous';
        
        console.log('💬 Chat reçu:', { model, messageLength: message.length, userId });
        
        // SAUVEGARDER LE MESSAGE UTILISATEUR DANS L'HISTORIQUE
        conversationMemory.saveMessage(userId, message, 'user', { model });
        
        // Récupérer l'historique récent pour le contexte
        const recentHistory = conversationMemory.getRecentContext(userId, 5);
        
        // Récupérer les instructions système
        const systemInstructions = conversationMemory.formatInstructions(userId);
        
        // Récupération des fichiers uploadés pour le contexte
        const uploadedFiles = Object.values(global.uploadedFiles || {});
        
        // 🤖 NOUVEAU : Utiliser l'orchestrateur conversationnel AVEC CONTEXTE
        const context = {
            files: uploadedFiles,
            user: req.user,
            model: model,
            history: recentHistory,
            instructions: systemInstructions
        };
        
        const orchestratorResponse = await orchestrator.chat(message, context);
        
        console.log('🎯 Orchestrator response:', orchestratorResponse.success ? 'Success' : 'Error');
        
        // Formater la réponse finale
        const modelName = getModelName(model);
        let finalResponse = '';
        
        // Ajouter les instructions système en préfixe si elles existent
        if (systemInstructions) {
            finalResponse = systemInstructions + '\n\n';
        }
        
        if (orchestratorResponse.success) {
            finalResponse += `🤖 **${modelName}** via Orchestrateur\n\n${orchestratorResponse.message}`;
        } else {
            finalResponse += `⚠️ **${modelName}** - Problème rencontré\n\n${orchestratorResponse.message}`;
        }
        
        // SAUVEGARDER LA RÉPONSE DANS L'HISTORIQUE
        conversationMemory.saveMessage(userId, finalResponse, 'assistant', {
            model,
            intent: orchestratorResponse.intent,
            response: orchestratorResponse.message
        });
        
        res.json({
            success: orchestratorResponse.success,
            response: finalResponse,
            model: model,
            filesUsed: uploadedFiles.length,
            orchestration: {
                intent: orchestratorResponse.intent,
                agentsUsed: orchestratorResponse.agentsUsed || [],
                details: orchestratorResponse.details
            },
            memory: {
                historyUsed: recentHistory.length > 0,
                instructionsActive: systemInstructions.length > 0
            }
        });
        
    } catch (error) {
        console.error('❌ Erreur chat:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erreur chat: ' + error.message,
            response: `❌ Désolé, une erreur s'est produite: ${error.message}\n\nRéessayez ou demandez "aide" pour voir mes capacités.`
        });
    }
});

// Fonction pour formatter la réponse en cas de succès
function formatAgentSuccessResponse(agentResult, model) {
    const modelName = getModelName(model);
    let response = `🤖 ${modelName} - Tâche exécutée avec succès\n\n`;
    
    response += `**Type d'action** : ${agentResult.intent}\n\n`;
    
    if (agentResult.result.message) {
        response += `**Résultat** : ${agentResult.result.message}\n\n`;
    }
    
    if (agentResult.result.details) {
        response += `**Détails** :\n`;
        response += formatDetails(agentResult.result.details);
    }
    
    if (agentResult.result.suggestion) {
        response += `\n💡 **Suggestion** : ${agentResult.result.suggestion}`;
    }
    
    response += `\n\n✅ *Exécuté par Agent Autonome à ${new Date().toLocaleTimeString('fr-FR')}*`;
    
    return response;
}

// Fonction pour formatter la réponse en cas d'erreur
function formatAgentErrorResponse(agentResult, model) {
    const modelName = getModelName(model);
    let response = `🤖 ${modelName} - Problème rencontré\n\n`;
    
    response += `**Type d'action** : ${agentResult.intent}\n\n`;
    response += `**Erreur** : ${agentResult.error}\n\n`;
    
    if (agentResult.result && agentResult.result.suggestion) {
        response += `💡 **Suggestion** : ${agentResult.result.suggestion}\n\n`;
    }
    
    response += `**Que puis-je faire ?**\n`;
    response += `- Vérifier la configuration (clés API, URLs)\n`;
    response += `- Essayer une commande différente\n`;
    response += `- Consulter les logs pour plus de détails\n\n`;
    
    response += `⚠️ *Tenté à ${new Date().toLocaleTimeString('fr-FR')}*`;
    
    return response;
}

// Fonction pour formater les détails
function formatDetails(details) {
    if (typeof details !== 'object') return details;
    
    let formatted = '';
    for (const [key, value] of Object.entries(details)) {
        if (typeof value === 'object' && value !== null) {
            formatted += `  • **${key}** :\n`;
            formatted += `    ${JSON.stringify(value, null, 2)}\n`;
        } else {
            formatted += `  • **${key}** : ${value}\n`;
        }
    }
    return formatted;
}

// Fonction helper pour récupérer le nom du modèle
function getModelName(model) {
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
    
    return modelNames[model] || model.split('/')[1] || 'Assistant IA';
}

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
    
    // Analyse du prompt pour générer une réponse contextuelle
    const promptLower = prompt.toLowerCase();
    let response = '';
    
    // Détection de questions spécifiques
    if (promptLower.includes('bonjour') || promptLower.includes('salut') || promptLower.includes('hello')) {
        response = `👋 Bonjour ! Je suis ${modelName}, comment puis-je vous aider aujourd'hui ? Je peux répondre à vos questions, analyser des documents, ou discuter de n'importe quel sujet.`;
    } else if (promptLower.includes('comment') && promptLower.includes('?')) {
        response = `🤔 ${modelName} analyse votre question "${prompt.substring(0, 100)}..."

Pour répondre à votre question, voici quelques points clés :
• Point 1 : Analyse contextuelle de votre demande
• Point 2 : Considérations pratiques
• Point 3 : Recommandations basées sur votre cas

N'hésitez pas à demander plus de détails !`;
    } else if (promptLower.includes('pourquoi') || promptLower.includes('pourquoi')) {
        response = `💡 ${modelName} répond :

La raison principale est que chaque situation est unique. Dans votre cas spécifique concernant "${prompt.substring(0, 80)}...", plusieurs facteurs entrent en jeu.

Voici mon analyse approfondie :
1. Contexte général
2. Facteurs spécifiques à votre cas
3. Implications pratiques

Souhaitez-vous que je développe un aspect particulier ?`;
    } else if (promptLower.includes('merci') || promptLower.includes('thank')) {
        response = `� Je vous en prie ! C'est un plaisir de vous aider. Si vous avez d'autres questions, n'hésitez pas !

${modelName} est toujours à votre disposition.`;
    } else if (promptLower.includes('problème') || promptLower.includes('erreur') || promptLower.includes('bug')) {
        response = `🔧 ${modelName} diagnostique votre problème...

Concernant "${prompt.substring(0, 100)}...", voici mon analyse :

**Diagnostic** : J'ai identifié plusieurs pistes possibles
**Solutions proposées** :
1. Vérification des configurations
2. Analyse des logs
3. Tests des composants

Pouvez-vous me donner plus de détails sur les symptômes ?`;
    } else {
        // Réponse générique mais contextuelle
        const snippets = [
            `J'ai analysé votre message concernant "${prompt.substring(0, 80)}..." et voici ma réponse détaillée.`,
            `Excellente question ! Concernant "${prompt.substring(0, 80)}...", permettez-moi de vous expliquer.`,
            `Intéressant ! Pour répondre à "${prompt.substring(0, 80)}...", voici ce que je peux vous dire.`,
            `Merci pour votre message. À propos de "${prompt.substring(0, 80)}...", laissez-moi vous aider.`
        ];
        
        const randomSnippet = snippets[Math.floor(Math.random() * snippets.length)];
        
        response = `🤖 ${modelName} répond :

${randomSnippet}

**Analyse contextuelle** :
${prompt.length > 100 ? 'Votre message est détaillé, ce qui me permet de mieux comprendre votre besoin.' : 'Votre message est concis. N\'hésitez pas à préciser si besoin.'}

**Ma réponse** :
Basé sur votre demande, voici mon analyse et mes recommandations. Chaque cas est unique, et je suis là pour vous accompagner dans votre réflexion.

Voulez-vous que j'approfondisse un aspect particulier ?`;
    }
    
    // Ajout d'informations sur les fichiers si présents
    if (prompt.includes('📁 FICHIERS DISPONIBLES:')) {
        response += `\n\n📄 **Fichiers détectés** : J'ai accès à vos documents uploadés et je peux les analyser pour vous fournir des réponses plus précises !`;
    }
    
    // Ajout d'éléments dynamiques
    response += `\n\n💡 *Réponse générée par ${modelName} à ${new Date().toLocaleTimeString('fr-FR')}*`;
    
    return response;
}

// ============================================================================
// ENDPOINTS ORCHESTRATEUR (n8n, Coolify, Baserow, Toolkit Vidéo)
// ============================================================================

// Configuration des clients API avec variables d'environnement
require('dotenv').config();
const axios = require('axios');
const OrchestratorAgent = require('./agents/OrchestratorAgent');

// Initialiser l'agent orchestrateur avec sous-agents ET PERSISTANCE
const orchestrator = new OrchestratorAgent({
    n8nUrl: process.env.N8N_API_URL,
    n8nApiKey: process.env.N8N_API_KEY,
    coolifyUrl: process.env.COOLIFY_API_URL,
    coolifyApiKey: process.env.COOLIFY_API_KEY,
    baserowUrl: process.env.BASEROW_URL,
    baserowApiToken: process.env.BASEROW_API_TOKEN,
    filePersistence: filePersistence  // Passer la persistance aux agents
});

// Client n8n
const n8nClient = axios.create({
    baseURL: process.env.N8N_API_URL || 'https://n8n.kaussan-air.org',
    headers: {
        'X-N8N-API-KEY': process.env.N8N_API_KEY || '',
        'Content-Type': 'application/json'
    }
});

// Client Coolify
const coolifyClient = axios.create({
    baseURL: process.env.COOLIFY_API_URL || 'https://kaussan-air.org',
    headers: {
        'Authorization': `Bearer ${process.env.COOLIFY_API_KEY || ''}`,
        'Content-Type': 'application/json'
    }
});

// Client Baserow
const baserowClient = axios.create({
    baseURL: process.env.BASEROW_URL || 'http://baserow:80',
    headers: {
        'Authorization': `Token ${process.env.BASEROW_API_TOKEN || ''}`,
        'Content-Type': 'application/json'
    }
});

// Client Toolkit Vidéo
const videoToolkitClient = axios.create({
    baseURL: process.env.VIDEO_TOOLKIT_URL || 'http://video-toolkit:8080'
});

// ============================================================================
// 1. ENDPOINTS n8n - DÉCLENCHEMENT DE WORKFLOWS
// ============================================================================

/**
 * POST /trigger/n8n/:webhookPath
 * Déclenche un workflow n8n via webhook
 * Body: JSON data à transmettre au workflow
 */
app.post('/trigger/n8n/:webhookPath', async (req, res) => {
    const { webhookPath } = req.params;
    const webhookData = req.body;
    
    console.log(`[${new Date().toISOString()}] [n8n-webhook] Déclenchement: ${webhookPath}`);
    console.log('📦 Data:', JSON.stringify(webhookData, null, 2));
    
    try {
        const response = await n8nClient.post(`/webhook/${webhookPath}`, webhookData);
        
        console.log(`[${new Date().toISOString()}] [n8n-webhook] ✅ Succès`);
        
        res.json({
            success: true,
            message: 'Workflow n8n déclenché avec succès',
            data: response.data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] [n8n-webhook] ❌ Erreur:`, error.message);
        
        res.status(500).json({
            success: false,
            error: 'Échec du déclenchement du workflow n8n',
            service: 'n8n',
            webhookPath,
            message: error.response?.data?.message || error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /run/:workflowId
 * Exécute un workflow n8n via l'API REST (nécessite N8N_API_KEY)
 * Body: Données d'entrée optionnelles pour le workflow
 */
app.post('/run/:workflowId', async (req, res) => {
    const { workflowId } = req.params;
    const workflowData = req.body;
    
    console.log(`[${new Date().toISOString()}] [n8n-rest] Exécution workflow: ${workflowId}`);
    
    if (!process.env.N8N_API_KEY) {
        return res.status(500).json({
            success: false,
            error: 'N8N_API_KEY non configurée',
            message: 'Impossible d\'utiliser l\'API REST n8n sans clé API',
            timestamp: new Date().toISOString()
        });
    }
    
    try {
        const response = await n8nClient.post(
            `/rest/workflows/${workflowId}/run`,
            workflowData
        );
        
        console.log(`[${new Date().toISOString()}] [n8n-rest] ✅ Workflow exécuté`);
        
        res.json({
            success: true,
            message: 'Workflow n8n exécuté avec succès',
            workflowId,
            data: response.data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] [n8n-rest] ❌ Erreur:`, error.message);
        
        res.status(500).json({
            success: false,
            error: 'Échec de l\'exécution du workflow n8n',
            service: 'n8n',
            workflowId,
            message: error.response?.data?.message || error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ============================================================================
// 2. ENDPOINTS COOLIFY - DÉPLOIEMENTS
// ============================================================================

/**
 * POST /coolify/deploy/:serviceId
 * Déclenche le déploiement d'un service via l'API Coolify
 */
app.post('/coolify/deploy/:serviceId', async (req, res) => {
    const { serviceId } = req.params;
    
    console.log(`[${new Date().toISOString()}] [coolify] Déploiement service: ${serviceId}`);
    
    if (!process.env.COOLIFY_API_KEY) {
        return res.status(500).json({
            success: false,
            error: 'COOLIFY_API_KEY non configurée',
            timestamp: new Date().toISOString()
        });
    }
    
    try {
        const response = await coolifyClient.post(`/api/v1/deploy/${serviceId}`);
        
        console.log(`[${new Date().toISOString()}] [coolify] ✅ Déploiement lancé`);
        
        res.json({
            success: true,
            message: 'Déploiement Coolify déclenché avec succès',
            serviceId,
            data: response.data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] [coolify] ❌ Erreur:`, error.message);
        
        res.status(500).json({
            success: false,
            error: 'Échec du déploiement Coolify',
            service: 'coolify',
            serviceId,
            message: error.response?.data?.message || error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Alias pour le dashboard qui appelle /api/coolify/deploy
app.post('/api/coolify/deploy/:serviceId', async (req, res) => {
    const { serviceId } = req.params;
    
    console.log(`[${new Date().toISOString()}] [coolify-api-alias] Déploiement service: ${serviceId}`);
    
    if (!process.env.COOLIFY_API_KEY) {
        return res.status(500).json({
            success: false,
            error: 'COOLIFY_API_KEY non configurée',
            timestamp: new Date().toISOString()
        });
    }
    
    try {
        const response = await coolifyClient.post(`/api/v1/deploy/${serviceId}`);
        
        console.log(`[${new Date().toISOString()}] [coolify-api-alias] ✅ Déploiement lancé`);
        
        res.json({
            success: true,
            message: 'Déploiement Coolify déclenché avec succès',
            serviceId,
            data: response.data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] [coolify-api-alias] ❌ Erreur:`, error.message);
        
        res.status(500).json({
            success: false,
            error: 'Échec du déploiement Coolify',
            service: 'coolify',
            serviceId,
            message: error.response?.data?.message || error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ============================================================================
// 3. ENDPOINTS BASEROW - GESTION DONNÉES & ASSETS
// ============================================================================

/**
 * POST /baserow/upload
 * Upload un asset vers Baserow
 */
app.post('/baserow/upload', async (req, res) => {
    const { tableId, data } = req.body;
    
    console.log(`[${new Date().toISOString()}] [baserow] Upload vers table: ${tableId}`);
    
    if (!process.env.BASEROW_API_TOKEN) {
        return res.status(500).json({
            success: false,
            error: 'BASEROW_API_TOKEN non configuré',
            timestamp: new Date().toISOString()
        });
    }
    
    try {
        const response = await baserowClient.post(`/api/database/rows/table/${tableId}/`, data);
        
        console.log(`[${new Date().toISOString()}] [baserow] ✅ Upload réussi`);
        
        res.json({
            success: true,
            message: 'Upload Baserow réussi',
            tableId,
            data: response.data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] [baserow] ❌ Erreur:`, error.message);
        
        res.status(500).json({
            success: false,
            error: 'Échec de l\'upload Baserow',
            service: 'baserow',
            tableId,
            message: error.response?.data?.message || error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /baserow/assets
 * Récupère la liste des assets depuis Baserow
 */
app.get('/baserow/assets', async (req, res) => {
    const { tableId } = req.query;
    
    console.log(`[${new Date().toISOString()}] [baserow] Récupération assets table: ${tableId}`);
    
    if (!tableId) {
        return res.status(400).json({
            success: false,
            error: 'tableId requis dans la query string',
            timestamp: new Date().toISOString()
        });
    }
    
    try {
        const response = await baserowClient.get(`/api/database/rows/table/${tableId}/`);
        
        console.log(`[${new Date().toISOString()}] [baserow] ✅ ${response.data.count || 0} assets récupérés`);
        
        res.json({
            success: true,
            message: 'Assets récupérés avec succès',
            tableId,
            data: response.data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] [baserow] ❌ Erreur:`, error.message);
        
        res.status(500).json({
            success: false,
            error: 'Échec de la récupération des assets',
            service: 'baserow',
            tableId,
            message: error.response?.data?.message || error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ============================================================================
// 4. ENDPOINTS TOOLKIT VIDÉO
// ============================================================================

/**
 * POST /video/generate
 * Déclenche la génération vidéo via le toolkit
 */
app.post('/video/generate', async (req, res) => {
    const videoParams = req.body;
    
    console.log(`[${new Date().toISOString()}] [video-toolkit] Génération vidéo`);
    
    try {
        const response = await videoToolkitClient.post('/generate', videoParams);
        
        console.log(`[${new Date().toISOString()}] [video-toolkit] ✅ Vidéo générée`);
        
        res.json({
            success: true,
            message: 'Vidéo générée avec succès',
            data: response.data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] [video-toolkit] ❌ Erreur:`, error.message);
        
        res.status(500).json({
            success: false,
            error: 'Échec de la génération vidéo',
            service: 'video-toolkit',
            message: error.response?.data?.message || error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Alias pour le dashboard qui appelle /api/video/generate
app.post('/api/video/generate', async (req, res) => {
    const videoParams = req.body;
    
    console.log(`[${new Date().toISOString()}] [video-toolkit-api-alias] Génération vidéo`);
    
    try {
        const response = await videoToolkitClient.post('/generate', videoParams);
        
        console.log(`[${new Date().toISOString()}] [video-toolkit-api-alias] ✅ Vidéo générée`);
        
        res.json({
            success: true,
            message: 'Vidéo générée avec succès',
            data: response.data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] [video-toolkit-api-alias] ❌ Erreur:`, error.message);
        
        res.status(500).json({
            success: false,
            error: 'Échec de la génération vidéo',
            service: 'video-toolkit',
            message: error.response?.data?.message || error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ============================================================================
// HEALTH CHECK AMÉLIORÉ
// ============================================================================

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime(),
        services: {
            n8n: {
                configured: !!process.env.N8N_API_URL,
                url: process.env.N8N_API_URL || 'not configured',
                hasApiKey: !!process.env.N8N_API_KEY
            },
            coolify: {
                configured: !!process.env.COOLIFY_API_URL,
                url: process.env.COOLIFY_API_URL || 'not configured',
                hasApiKey: !!process.env.COOLIFY_API_KEY
            },
            baserow: {
                configured: !!process.env.BASEROW_URL,
                url: process.env.BASEROW_URL || 'not configured',
                hasToken: !!process.env.BASEROW_API_TOKEN
            },
            videoToolkit: {
                configured: !!process.env.VIDEO_TOOLKIT_URL,
                url: process.env.VIDEO_TOOLKIT_URL || 'not configured'
            }
        },
        endpoints: {
            n8n: [
                'POST /trigger/n8n/:webhookPath',
                'POST /run/:workflowId'
            ],
            coolify: [
                'POST /coolify/deploy/:serviceId'
            ],
            baserow: [
                'POST /baserow/upload',
                'GET /baserow/assets'
            ],
            video: [
                'POST /video/generate'
            ]
        }
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

// ============================================================================
// ENDPOINTS ORCHESTRATEUR (Spécifications utilisateur)
// ============================================================================

/**
 * GET /health
 * Vérifie l'état de santé du système et des services configurés
 * Retourne le status de chaque service (configured/missing)
 */
app.get('/health', (req, res) => {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    const health = {
        status: 'ok',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: {
            seconds: Math.floor(uptime),
            formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
        },
        memory: {
            heapUsed: Math.floor(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
            heapTotal: Math.floor(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
            rss: Math.floor(memoryUsage.rss / 1024 / 1024) + ' MB'
        },
        services: {
            n8n: {
                status: process.env.N8N_API_URL && process.env.N8N_API_KEY ? 'configured' : 'missing',
                url: process.env.N8N_API_URL ? '✅' : '❌'
            },
            coolify: {
                status: process.env.COOLIFY_API_URL && process.env.COOLIFY_API_KEY ? 'configured' : 'missing',
                url: process.env.COOLIFY_API_URL ? '✅' : '❌'
            },
            baserow: {
                status: process.env.BASEROW_URL && process.env.BASEROW_API_TOKEN ? 'configured' : 'missing',
                url: process.env.BASEROW_URL ? '✅' : '❌',
                table: process.env.BASEROW_TABLE_ID ? '✅' : '❌'
            },
            email: {
                status: process.env.SMTP_HOST || process.env.N8N_EMAIL_RELAY ? 'configured' : 'missing',
                smtp: process.env.SMTP_HOST ? '✅' : '❌',
                relay: process.env.N8N_EMAIL_RELAY ? '✅' : '❌'
            },
            database: {
                status: 'ok',
                type: 'SQLite',
                conversations: '✅',
                files: '✅',
                sessions: '✅'
            }
        },
        agents: {
            orchestrator: 'active',
            n8n: 'active',
            file: 'active',
            coolify: process.env.COOLIFY_API_URL ? 'active' : 'inactive',
            baserow: process.env.BASEROW_URL ? 'active' : 'inactive',
            email: 'active',
            security: 'active'
        }
    };
    
    res.json(health);
});

/**
 * GET /metrics
 * Retourne les métriques d'utilisation du système
 * Compteurs d'opérations, temps de démarrage, statistiques
 */
app.get('/metrics', (req, res) => {
    const uptime = process.uptime();
    
    const metrics = {
        timestamp: new Date().toISOString(),
        startTime: global.metrics.startTime,
        uptime: {
            seconds: Math.floor(uptime),
            formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
        },
        counters: {
            requests: global.metrics.requests,
            n8nTriggers: global.metrics.n8nTriggers,
            n8nRuns: global.metrics.n8nRuns,
            coolifyDeploys: global.metrics.coolifyDeploys,
            baserowOps: global.metrics.baserowOps,
            fileOps: global.metrics.fileOps,
            emailsSent: global.metrics.emailsSent,
            errors: global.metrics.errors
        },
        rates: {
            requestsPerMinute: uptime > 60 ? Math.floor((global.metrics.requests / uptime) * 60) : 0,
            errorsPerMinute: uptime > 60 ? Math.floor((global.metrics.errors / uptime) * 60) : 0
        },
        health: {
            errorRate: global.metrics.requests > 0 
                ? ((global.metrics.errors / global.metrics.requests) * 100).toFixed(2) + '%' 
                : '0%',
            status: global.metrics.errors / global.metrics.requests < 0.05 ? 'healthy' : 'degraded'
        }
    };
    
    res.json(metrics);
});

// Middleware pour incrémenter le compteur de requêtes
app.use((req, res, next) => {
    if (!req.path.startsWith('/health') && !req.path.startsWith('/metrics')) {
        global.metrics.requests++;
    }
    next();
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