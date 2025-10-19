// Version complète et professionnelle - Agent Skeleton OSS
require('dotenv').config(); // Charger les variables d'environnement

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { getSessionStore } = require('./sessionStore');

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

// Stockage en mémoire (base de données temporaire)
global.users = {
    'admin@example.com': {
        email: 'admin@example.com',
        password: 'admin123',
        name: 'Admin User',
        createdAt: new Date().toISOString()
    }
};
global.uploadedFiles = {};
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

// Dashboard route (requires authentication)
app.get('/dashboard', requireAuth, (req, res) => {
    console.log('📊 Route /dashboard appelée');
    console.log('👤 User:', req.user ? req.user.email : 'none');
    console.log('🍪 Cookies:', JSON.stringify(req.cookies));
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
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

// Route /api/files (alias de /api/files-list pour le dashboard)
app.get('/api/files', (req, res) => {
    try {
        const files = Object.values(global.uploadedFiles || {});
        res.json({ 
            success: true,
            files: files.map(f => ({ 
                id: f.id, 
                name: f.name, 
                size: f.size, 
                uploadedAt: f.uploadedAt,
                type: f.name.split('.').pop()
            })), 
            count: files.length 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erreur liste fichiers' });
    }
});

// Route /api/upload (alias de /api/upload-simple)
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
        
        global.uploadedFiles[fileId] = {
            id: fileId,
            name: fileName,
            content: content,
            size: req.body.length,
            uploadedAt: new Date().toISOString()
        };
        
        console.log('✅ Fichier uploadé:', fileName, 'Taille:', req.body.length, 'bytes');
        
        res.json({
            success: true,
            fileId: fileId,
            fileName: fileName,
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

// API Chat IA avec 60+ modèles ET AGENT AUTONOME
app.post('/api/chat', requireAuth, async (req, res) => {
    try {
        const { message, model } = req.body;
        
        if (!message || !model) {
            return res.status(400).json({ error: 'Message et modèle requis' });
        }
        
        console.log('💬 Chat reçu:', { model, messageLength: message.length });
        
        // Récupération des fichiers uploadés
        const uploadedFiles = Object.values(global.uploadedFiles || {});
        
        // 🤖 NOUVEAU : Utiliser l'agent autonome pour exécuter la tâche
        const agentResult = await agentExecutor.execute(message, {
            files: uploadedFiles,
            user: req.user
        });
        
        console.log('🎯 Agent result:', agentResult);
        
        // Générer une réponse contextualisée basée sur le résultat de l'agent
        let response = '';
        
        if (agentResult.success) {
            response = formatAgentSuccessResponse(agentResult, model);
        } else {
            response = formatAgentErrorResponse(agentResult, model);
        }
        
        res.json({
            success: true,
            response: response,
            model: model,
            filesUsed: uploadedFiles.length,
            agentExecution: agentResult // Inclure le résultat de l'agent
        });
        
    } catch (error) {
        console.error('❌ Erreur chat:', error);
        res.status(500).json({ error: 'Erreur chat: ' + error.message });
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
const AgentExecutor = require('./agentExecutor');

// Initialiser l'agent autonome
const agentExecutor = new AgentExecutor();

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