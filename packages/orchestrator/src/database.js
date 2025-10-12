// Database pour la mémoire conversationnelle et gestion des utilisateurs
const Database = require('better-sqlite3');
const path = require('path');

// Initialiser la base de données
const db = new Database(path.join(__dirname, '../data/agent.db'));

// Créer les tables
db.exec(`
  -- Table des utilisateurs
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
  );

  -- Table des conversations
  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Table des messages (mémoire conversationnelle)
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    role TEXT NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    model TEXT, -- Modèle IA utilisé
    tokens_used INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  );

  -- Table des fichiers uploadés
  CREATE TABLE IF NOT EXISTS uploaded_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    conversation_id INTEGER,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    extracted_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL
  );

  -- Table des préférences utilisateur
  CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    default_model TEXT DEFAULT 'gpt-4',
    theme TEXT DEFAULT 'dark',
    language TEXT DEFAULT 'fr',
    email_notifications BOOLEAN DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Table des analytics
  CREATE TABLE IF NOT EXISTS analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action_type TEXT NOT NULL, -- 'chat', 'upload', 'n8n_trigger', 'social_post'
    action_details TEXT,
    success BOOLEAN DEFAULT 1,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Index pour performance
  CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
  CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
  CREATE INDEX IF NOT EXISTS idx_files_user ON uploaded_files(user_id);
  CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics(user_id);
  CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics(created_at);
`);

console.log('✅ Database initialized with memory system');

// Fonctions helper pour la base de données
const dbHelpers = {
  // Utilisateurs
  createUser: db.prepare(`
    INSERT INTO users (email, password, name)
    VALUES (?, ?, ?)
  `),
  
  getUserByEmail: db.prepare(`
    SELECT * FROM users WHERE email = ?
  `),
  
  getUserById: db.prepare(`
    SELECT * FROM users WHERE id = ?
  `),
  
  updateLastLogin: db.prepare(`
    UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?
  `),

  // Conversations
  createConversation: db.prepare(`
    INSERT INTO conversations (user_id, title)
    VALUES (?, ?)
  `),
  
  getUserConversations: db.prepare(`
    SELECT * FROM conversations 
    WHERE user_id = ? 
    ORDER BY updated_at DESC 
    LIMIT ?
  `),
  
  getConversationById: db.prepare(`
    SELECT * FROM conversations WHERE id = ?
  `),
  
  updateConversationTitle: db.prepare(`
    UPDATE conversations SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `),

  // Messages (Mémoire)
  addMessage: db.prepare(`
    INSERT INTO messages (conversation_id, role, content, model, tokens_used)
    VALUES (?, ?, ?, ?, ?)
  `),
  
  getConversationMessages: db.prepare(`
    SELECT * FROM messages 
    WHERE conversation_id = ? 
    ORDER BY created_at ASC
  `),
  
  getRecentMessages: db.prepare(`
    SELECT m.*, c.user_id 
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    WHERE c.user_id = ?
    ORDER BY m.created_at DESC
    LIMIT ?
  `),

  // Fichiers
  addFile: db.prepare(`
    INSERT INTO uploaded_files (user_id, conversation_id, filename, original_name, file_path, file_type, file_size, extracted_text)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),
  
  getUserFiles: db.prepare(`
    SELECT * FROM uploaded_files 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT ?
  `),
  
  getFileById: db.prepare(`
    SELECT * FROM uploaded_files WHERE id = ?
  `),

  // Analytics
  logAction: db.prepare(`
    INSERT INTO analytics (user_id, action_type, action_details, success, error_message)
    VALUES (?, ?, ?, ?, ?)
  `),
  
  getUserAnalytics: db.prepare(`
    SELECT 
      action_type,
      COUNT(*) as count,
      SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as success_count,
      SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as error_count
    FROM analytics
    WHERE user_id = ?
    GROUP BY action_type
  `),

  // Préférences
  getUserPreferences: db.prepare(`
    SELECT * FROM user_preferences WHERE user_id = ?
  `),
  
  setUserPreferences: db.prepare(`
    INSERT INTO user_preferences (user_id, default_model, theme, language, email_notifications)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      default_model = excluded.default_model,
      theme = excluded.theme,
      language = excluded.language,
      email_notifications = excluded.email_notifications
  `)
};

module.exports = {
  db,
  ...dbHelpers
};
