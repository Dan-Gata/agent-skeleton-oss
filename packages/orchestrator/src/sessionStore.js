const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');

class SessionStore {
    constructor(dbPath = path.join(__dirname, '../data/sessions.db')) {
        this.db = new Database(dbPath);
        this.init();
    }

    init() {
        // Create sessions table if it doesn't exist
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS sessions (
                sessionId TEXT PRIMARY KEY,
                userId TEXT NOT NULL,
                email TEXT NOT NULL,
                createdAt INTEGER NOT NULL,
                expiresAt INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId);
            CREATE INDEX IF NOT EXISTS idx_sessions_expiresAt ON sessions(expiresAt);
        `);
        
        // Clean up expired sessions on startup
        this.cleanupExpiredSessions();
        console.log('✅ Session store initialized with SQLite');
    }

    createSession(userId, email, maxAge = 24 * 60 * 60 * 1000) {
        const sessionId = crypto.randomBytes(32).toString('hex');
        const now = Date.now();
        const expiresAt = now + maxAge;

        const stmt = this.db.prepare(`
            INSERT INTO sessions (sessionId, userId, email, createdAt, expiresAt)
            VALUES (?, ?, ?, ?, ?)
        `);

        stmt.run(sessionId, userId, email, now, expiresAt);
        console.log(`🔑 Session created: ${sessionId} for ${email}`);
        
        return sessionId;
    }

    getSession(sessionId) {
        if (!sessionId) return null;

        const stmt = this.db.prepare(`
            SELECT * FROM sessions 
            WHERE sessionId = ? AND expiresAt > ?
        `);

        const session = stmt.get(sessionId, Date.now());
        
        if (session) {
            console.log(`✅ Session found: ${sessionId} for ${session.email}`);
            return {
                userId: session.userId,
                email: session.email,
                createdAt: session.createdAt,
                expiresAt: session.expiresAt
            };
        } else {
            console.log(`❌ Session not found or expired: ${sessionId}`);
            return null;
        }
    }

    deleteSession(sessionId) {
        if (!sessionId) return;

        const stmt = this.db.prepare('DELETE FROM sessions WHERE sessionId = ?');
        const result = stmt.run(sessionId);
        
        if (result.changes > 0) {
            console.log(`🗑️ Session deleted: ${sessionId}`);
        }
    }

    cleanupExpiredSessions() {
        const stmt = this.db.prepare('DELETE FROM sessions WHERE expiresAt < ?');
        const result = stmt.run(Date.now());
        
        if (result.changes > 0) {
            console.log(`🧹 Cleaned up ${result.changes} expired sessions`);
        }
    }

    getAllSessions() {
        const stmt = this.db.prepare(`
            SELECT sessionId, userId, email, createdAt, expiresAt 
            FROM sessions 
            WHERE expiresAt > ?
            ORDER BY createdAt DESC
        `);
        
        return stmt.all(Date.now());
    }

    getSessionCount() {
        const stmt = this.db.prepare('SELECT COUNT(*) as count FROM sessions WHERE expiresAt > ?');
        const result = stmt.get(Date.now());
        return result.count;
    }
}

// Export singleton instance
let sessionStore = null;

function getSessionStore() {
    if (!sessionStore) {
        sessionStore = new SessionStore();
    }
    return sessionStore;
}

module.exports = { SessionStore, getSessionStore };
