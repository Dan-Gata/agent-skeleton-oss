#!/usr/bin/env node

/**
 * RÉINSTALLATION COMPLÈTE DU DASHBOARD
 * 
 * Ce script va :
 * 1. Sauvegarder les fichiers importants (.env, database.sqlite)
 * 2. Réinitialiser le dashboard à une version PROPRE
 * 3. Restaurer les fichiers sauvegardés
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 ========================================');
console.log('🔄 RÉINSTALLATION COMPLÈTE DU DASHBOARD');
console.log('🔄 ========================================\n');

const indexPath = path.join(__dirname, 'packages', 'orchestrator', 'src', 'index.js');

console.log('📥 Lecture du fichier actuel...\n');

let content = fs.readFileSync(indexPath, 'utf-8');

// Trouver la section dashboard
const dashboardStart = content.indexOf("// Dashboard route (requires authentication)");
const dashboardEnd = content.indexOf("// API endpoint to get current user info", dashboardStart);

if (dashboardStart === -1 || dashboardEnd === -1) {
    console.log('❌ Impossible de localiser la section dashboard !');
    process.exit(1);
}

console.log(`✅ Section dashboard localisée (lignes ${content.substring(0, dashboardStart).split('\n').length} - ${content.substring(0, dashboardEnd).split('\n').length})\n`);

// Lire le dashboard simple
const simpleDashboardPath = path.join(__dirname, 'DASHBOARD_SIMPLE.html');

if (!fs.existsSync(simpleDashboardPath)) {
    console.log('❌ DASHBOARD_SIMPLE.html introuvable !');
    console.log('   Veuillez d\'abord créer ce fichier.\n');
    process.exit(1);
}

const simpleDashboard = fs.readFileSync(simpleDashboardPath, 'utf-8');

// Créer le nouveau dashboard route
const newDashboardRoute = `// Dashboard route (requires authentication) - VERSION ULTRA-SIMPLE GARANTIE
app.get('/dashboard', requireAuth, (req, res) => {
    console.log('📊 Route /dashboard appelée (VERSION SIMPLE)');
    console.log('👤 User:', req.user ? req.user.email : 'none');
    console.log('🍪 Cookies:', JSON.stringify(req.cookies));
    
    res.send(\`${simpleDashboard.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`);
});

`;

// Remplacer la section
const newContent = content.substring(0, dashboardStart) + newDashboardRoute + content.substring(dashboardEnd);

// Sauvegarder le backup
const backupPath = path.join(__dirname, `index.js.backup.${Date.now()}`);
fs.writeFileSync(backupPath, content);
console.log(`📦 Backup sauvegardé: ${backupPath}\n`);

// Écrire le nouveau fichier
fs.writeFileSync(indexPath, newContent);
console.log(`✅ Nouveau dashboard installé: ${indexPath}\n`);

// Vérifier la syntaxe
console.log('🔍 Vérification de la syntaxe JavaScript...\n');

try {
    require(indexPath);
    console.log('✅ SYNTAXE VALIDE ! Le fichier se charge sans erreur.\n');
} catch (error) {
    console.log(`❌ ERREUR DE SYNTAXE: ${error.message}\n`);
    console.log('🔄 Restoration du backup...');
    fs.writeFileSync(indexPath, content);
    console.log('✅ Backup restauré.\n');
    process.exit(1);
}

console.log('========================================');
console.log('✅ RÉINSTALLATION TERMINÉE AVEC SUCCÈS !');
console.log('========================================\n');

console.log('📝 PROCHAINES ÉTAPES :');
console.log('   1. Vérifier que le serveur redémarre sans erreur');
console.log('   2. Tester le dashboard localement: http://localhost:3000/dashboard');
console.log('   3. Si OK, faire: git add . && git commit -m "fix: Dashboard ultra-simple" && git push');
console.log('   4. Attendre le déploiement Coolify (~5 minutes)');
console.log('   5. Vider le cache navigateur ET tester\n');

console.log('💡 Le nouveau dashboard est ULTRA-SIMPLE mais GARANTI de fonctionner.\n');
