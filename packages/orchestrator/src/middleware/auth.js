// Middleware d'authentification simple
const users = new Map(); // En production, utiliser une vraie base de données

class AuthService {
    constructor() {
        this.sessions = new Map();
        this.users = new Map();
    }

    // Créer un compte utilisateur
    createAccount(username, password, email) {
        if (this.users.has(username)) {
            throw new Error('Nom d\'utilisateur déjà existant');
        }

        const user = {
            id: Date.now().toString(),
            username,
            password, // En production: hasher le mot de passe
            email,
            createdAt: new Date().toISOString(),
            lastLogin: null,
            preferences: {}
        };

        this.users.set(username, user);
        return { success: true, userId: user.id };
    }

    // Connexion utilisateur
    login(username, password) {
        const user = this.users.get(username);
        if (!user || user.password !== password) {
            throw new Error('Identifiants incorrects');
        }

        const sessionId = this.generateSessionId();
        const session = {
            userId: user.id,
            username: user.username,
            createdAt: Date.now(),
            lastActivity: Date.now()
        };

        this.sessions.set(sessionId, session);
        user.lastLogin = new Date().toISOString();

        return { sessionId, user: { id: user.id, username: user.username, email: user.email } };
    }

    // Vérifier une session
    verifySession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return null;

        // Vérifier si la session n'a pas expiré (24h)
        const now = Date.now();
        if (now - session.lastActivity > 24 * 60 * 60 * 1000) {
            this.sessions.delete(sessionId);
            return null;
        }

        // Mettre à jour l'activité
        session.lastActivity = now;
        return session;
    }

    // Déconnexion
    logout(sessionId) {
        return this.sessions.delete(sessionId);
    }

    generateSessionId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
}

// Middleware pour vérifier l'authentification
function requireAuth(req, res, next) {
    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
    
    if (!sessionId) {
        // Si c'est une requête AJAX, retourner JSON
        if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
            return res.status(401).json({ error: 'Session requise', needAuth: true });
        }
        // Sinon, rediriger vers la page de connexion
        return res.redirect('/login');
    }

    const session = authService.verifySession(sessionId);
    if (!session) {
        // Session invalide ou expirée
        if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
            return res.status(401).json({ error: 'Session invalide ou expirée', needAuth: true });
        }
        res.clearCookie('sessionId');
        return res.redirect('/login');
    }

    req.user = session;
    next();
}

// Middleware pour les APIs qui nécessitent une réponse JSON
function requireAuthAPI(req, res, next) {
    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
    
    if (!sessionId) {
        return res.status(401).json({ error: 'Session requise', needAuth: true });
    }

    const session = authService.verifySession(sessionId);
    if (!session) {
        return res.status(401).json({ error: 'Session invalide ou expirée', needAuth: true });
    }

    req.user = session;
    next();
}

const authService = new AuthService();

module.exports = { AuthService, authService, requireAuth, requireAuthAPI };