// Version complète et professionnelle - Agent Skeleton OSS
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

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
global.sessions = {};

// Configuration EJS pour les vues
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Middleware d'authentification
function requireAuth(req, res, next) {
    console.log('🔒 Vérification auth pour:', req.url);
    console.log('🍪 Cookies reçus:', req.cookies);
    
    const sessionId = req.cookies.sessionId;
    console.log('🔑 SessionId:', sessionId);
    
    if (!sessionId || !global.sessions[sessionId]) {
        console.log('❌ Session non trouvée, redirection vers /login');
        console.log('📝 Sessions disponibles:', Object.keys(global.sessions));
        return res.redirect('/login');
    }
    
    req.user = global.sessions[sessionId];
    console.log('✅ Utilisateur authentifié:', req.user.email);
    next();
}

// Route de connexion
app.get('/login', (req, res) => {
    console.log('📍 Accès à /login - Cookies:', req.cookies);
    console.log('📍 User-Agent:', req.get('User-Agent'));
    
    // Vérifier si déjà connecté pour éviter la boucle
    const sessionId = req.cookies.sessionId;
    if (sessionId && global.sessions[sessionId]) {
        console.log('👤 Utilisateur déjà connecté, redirection vers dashboard');
        return res.redirect('/');
    }
    
    res.sendFile(path.join(__dirname, '../auth.html'));
});

// API de connexion
app.post('/api/login', (req, res) => {
    console.log('🔐 Tentative de connexion:', req.body);
    
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
    
    const sessionId = Date.now().toString() + Math.random().toString(36);
    global.sessions[sessionId] = user;
    
    console.log('✅ Session créée:', sessionId);
    
    // Configuration de cookie moins restrictive pour le debug
    res.cookie('sessionId', sessionId, { 
        httpOnly: true, 
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax',
        secure: false // Pour le développement local
    });
    
    console.log('🍪 Cookie défini avec sessionId:', sessionId);
    
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
        delete global.sessions[sessionId];
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
    res.json({
        users: Object.keys(global.users),
        sessions: Object.keys(global.sessions),
        files: Object.keys(global.uploadedFiles || {}),
        totalUsers: Object.keys(global.users).length,
        totalSessions: Object.keys(global.sessions).length,
        sessionDetails: global.sessions,
        cookies: req.cookies
    });
});

// Route de test des cookies
app.get('/test-cookie', (req, res) => {
    res.send(`
    <h1>Test Cookies</h1>
    <p><strong>Cookies reçus:</strong> ${JSON.stringify(req.cookies)}</p>
    <p><strong>Sessions disponibles:</strong> ${JSON.stringify(Object.keys(global.sessions))}</p>
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
global.users = {}; // Stockage des utilisateurs

// Middleware d'authentification
function requireAuth(req, res, next) {
    const userId = req.cookies.userId;
    if (!userId || !global.users[userId]) {
        return res.redirect('/login');
    }
    req.user = global.users[userId];
    next();
}

// Route de connexion
app.get('/login', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Connexion - Agent Skeleton OSS</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            
            .auth-container {
                background: white;
                border-radius: 12px;
                padding: 3rem;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                width: 100%;
                max-width: 400px;
            }
            
            .auth-header {
                text-align: center;
                margin-bottom: 2rem;
            }
            
            .auth-header h1 {
                font-size: 2rem;
                color: #2d3748;
                margin-bottom: 0.5rem;
            }
            
            .auth-header p {
                color: #718096;
            }
            
            .auth-tabs {
                display: flex;
                margin-bottom: 2rem;
                background: #f7fafc;
                border-radius: 8px;
                padding: 4px;
            }
            
            .auth-tab {
                flex: 1;
                padding: 0.75rem;
                text-align: center;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
                font-weight: 500;
            }
            
            .auth-tab.active {
                background: white;
                color: #4299e1;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            
            .auth-form {
                display: none;
            }
            
            .auth-form.active {
                display: block;
            }
            
            .form-group {
                margin-bottom: 1.5rem;
            }
            
            .form-label {
                display: block;
                margin-bottom: 0.5rem;
                font-weight: 500;
                color: #2d3748;
            }
            
            .form-input {
                width: 100%;
                padding: 0.75rem;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                font-size: 1rem;
                transition: border-color 0.2s;
            }
            
            .form-input:focus {
                outline: none;
                border-color: #4299e1;
                box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
            }
            
            .auth-button {
                width: 100%;
                padding: 0.75rem;
                background: #4299e1;
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 1rem;
                font-weight: 500;
                cursor: pointer;
                transition: background 0.2s;
            }
            
            .auth-button:hover {
                background: #3182ce;
            }
            
            .auth-button:disabled {
                background: #a0aec0;
                cursor: not-allowed;
            }
            
            .message {
                margin-top: 1rem;
                padding: 0.75rem;
                border-radius: 6px;
                text-align: center;
                display: none;
            }
            
            .message.success {
                background: #f0fff4;
                color: #38a169;
                border: 1px solid #9ae6b4;
            }
            
            .message.error {
                background: #fed7d7;
                color: #e53e3e;
                border: 1px solid #feb2b2;
            }
            
            .demo-info {
                background: #ebf8ff;
                border: 1px solid #90cdf4;
                border-radius: 6px;
                padding: 1rem;
                margin-top: 1.5rem;
                font-size: 0.9rem;
                color: #2b6cb0;
            }
        </style>
    </head>
    <body>
        <div class="auth-container">
            <div class="auth-header">
                <h1>🚀 Agent Skeleton OSS</h1>
                <p>Plateforme IA sécurisée</p>
            </div>
            
            <div class="auth-tabs">
                <div class="auth-tab active" onclick="switchTab('login')">Connexion</div>
                <div class="auth-tab" onclick="switchTab('signup')">Inscription</div>
            </div>
            
            <!-- Formulaire de connexion -->
            <form class="auth-form active" id="loginForm">
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-input" id="loginEmail" required placeholder="votre@email.com">
                </div>
                <div class="form-group">
                    <label class="form-label">Mot de passe</label>
                    <input type="password" class="form-input" id="loginPassword" required placeholder="••••••••">
                </div>
                <button type="submit" class="auth-button">Se connecter</button>
            </form>
            
            <!-- Formulaire d'inscription -->
            <form class="auth-form" id="signupForm">
                <div class="form-group">
                    <label class="form-label">Nom complet</label>
                    <input type="text" class="form-input" id="signupName" required placeholder="John Doe">
                </div>
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-input" id="signupEmail" required placeholder="votre@email.com">
                </div>
                <div class="form-group">
                    <label class="form-label">Mot de passe</label>
                    <input type="password" class="form-input" id="signupPassword" required placeholder="••••••••">
                </div>
                <div class="form-group">
                    <label class="form-label">Confirmer le mot de passe</label>
                    <input type="password" class="form-input" id="signupConfirm" required placeholder="••••••••">
                </div>
                <button type="submit" class="auth-button">S'inscrire</button>
            </form>
            
            <div class="message" id="message"></div>
            
            <div class="demo-info">
                💡 <strong>Mode démo :</strong> Créez un compte pour accéder à la plateforme IA avec chat et upload de fichiers.
            </div>
        </div>
        
        <script>
            function switchTab(tab) {
                // Gérer les onglets
                document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
                
                if (tab === 'login') {
                    document.querySelector('.auth-tab').classList.add('active');
                    document.getElementById('loginForm').classList.add('active');
                } else {
                    document.querySelectorAll('.auth-tab')[1].classList.add('active');
                    document.getElementById('signupForm').classList.add('active');
                }
                
                hideMessage();
            }
            
            function showMessage(text, type) {
                const msg = document.getElementById('message');
                msg.textContent = text;
                msg.className = \`message \${type}\`;
                msg.style.display = 'block';
            }
            
            function hideMessage() {
                document.getElementById('message').style.display = 'none';
            }
            
            // Gestion connexion
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;
                
                try {
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password })
                    });
                    
                    const result = await response.json();
                    
                    if (response.ok) {
                        showMessage('Connexion réussie !', 'success');
                        setTimeout(() => window.location.href = '/', 1000);
                    } else {
                        showMessage(result.error, 'error');
                    }
                } catch (error) {
                    showMessage('Erreur de connexion', 'error');
                }
            });
            
            // Gestion inscription
            document.getElementById('signupForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const name = document.getElementById('signupName').value;
                const email = document.getElementById('signupEmail').value;
                const password = document.getElementById('signupPassword').value;
                const confirm = document.getElementById('signupConfirm').value;
                
                if (password !== confirm) {
                    showMessage('Les mots de passe ne correspondent pas', 'error');
                    return;
                }
                
                try {
                    const response = await fetch('/api/auth/signup', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, email, password })
                    });
                    
                    const result = await response.json();
                    
                    if (response.ok) {
                        showMessage('Compte créé avec succès !', 'success');
                        setTimeout(() => window.location.href = '/', 1000);
                    } else {
                        showMessage(result.error, 'error');
                    }
                } catch (error) {
                    showMessage('Erreur lors de l\\'inscription', 'error');
                }
            });
        </script>
    </body>
    </html>
    `);
});

// APIs d'authentification
app.post('/api/auth/signup', (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Tous les champs sont requis' });
        }
        
        // Vérifier si l'utilisateur existe déjà
        const existingUser = Object.values(global.users).find(u => u.email === email);
        if (existingUser) {
            return res.status(400).json({ error: 'Cet email est déjà utilisé' });
        }
        
        // Créer un nouvel utilisateur
        const userId = Date.now().toString();
        global.users[userId] = {
            id: userId,
            name: name,
            email: email,
            password: password, // En production, hashé bien sûr !
            createdAt: new Date().toISOString()
        };
        
        // Définir le cookie de session
        res.cookie('userId', userId, { 
            httpOnly: true, 
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
        });
        
        console.log('🔐 Nouvel utilisateur créé:', email);
        
        res.json({
            success: true,
            message: 'Compte créé avec succès',
            user: { id: userId, name, email }
        });
        
    } catch (error) {
        console.error('❌ Erreur inscription:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.post('/api/auth/login', (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email et mot de passe requis' });
        }
        
        // Trouver l'utilisateur
        const user = Object.values(global.users).find(u => u.email === email);
        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }
        
        // Définir le cookie de session
        res.cookie('userId', user.id, { 
            httpOnly: true, 
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
        });
        
        console.log('🔐 Utilisateur connecté:', email);
        
        res.json({
            success: true,
            message: 'Connexion réussie',
            user: { id: user.id, name: user.name, email: user.email }
        });
        
    } catch (error) {
        console.error('❌ Erreur connexion:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('userId');
    res.json({ success: true, message: 'Déconnexion réussie' });
});

// Route principale - Interface SaaS moderne et simple
app.get('/', (req, res) => {
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

// API Chat IA avec 60+ modèles
app.post('/api/chat', requireAuth, async (req, res) => {
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

// ============================================================================
// ENDPOINTS ORCHESTRATEUR (n8n, Coolify, Baserow, Toolkit Vidéo)
// ============================================================================

// Configuration des clients API avec variables d'environnement
require('dotenv').config();
const axios = require('axios');

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