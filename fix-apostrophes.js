#!/usr/bin/env node

/**
 * RÉPARATION AUTOMATIQUE DES APOSTROPHES
 * 
 * Ce script va trouver et échapper TOUTES les apostrophes non échappées
 * dans les template literals du dashboard
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 ========================================');
console.log('🔧 RÉPARATION AUTOMATIQUE DES APOSTROPHES');
console.log('🔧 ========================================\n');

const indexPath = path.join(__dirname, 'packages', 'orchestrator', 'src', 'index.js');

console.log(`📁 Fichier: ${indexPath}\n`);

// Lire le fichier
let content = fs.readFileSync(indexPath, 'utf-8');
const originalContent = content;

console.log('🔍 Recherche des apostrophes non échappées...\n');

// Fonction pour échapper les apostrophes dans une chaîne
function escapeApostrophes(str) {
    // Ne pas toucher aux apostrophes déjà échappées
    // Échapper les apostrophes qui ne sont PAS précédées d'un backslash
    return str.replace(/(?<!\\)'/g, "\\'");
}

// Trouver tous les template literals et les corriger
let fixCount = 0;
const templateLiteralRegex = /`([^`]*)`/g;

content = content.replace(templateLiteralRegex, (match, innerContent) => {
    // Compter les apostrophes non échappées
    const unescapedCount = (innerContent.match(/(?<!\\)'/g) || []).length;
    
    if (unescapedCount > 0) {
        fixCount++;
        const fixed = '`' + escapeApostrophes(innerContent) + '`';
        console.log(`✅ Fix ${fixCount}: ${unescapedCount} apostrophe(s) échappée(s)`);
        return fixed;
    }
    
    return match;
});

if (fixCount === 0) {
    console.log('✅ Aucune apostrophe non échappée trouvée !\n');
    console.log('🤔 Le problème pourrait être ailleurs. Suggestions :');
    console.log('   1. Vider complètement le cache navigateur');
    console.log('   2. Tester en navigation privée');
    console.log('   3. Vérifier la console navigateur (F12)\n');
    process.exit(0);
}

// Sauvegarder le backup
const backupPath = path.join(__dirname, `index.js.backup-apostrophes.${Date.now()}`);
fs.writeFileSync(backupPath, originalContent);
console.log(`\n📦 Backup sauvegardé: ${backupPath}`);

// Écrire le fichier corrigé
fs.writeFileSync(indexPath, content);
console.log(`✅ Fichier corrigé sauvegardé: ${indexPath}\n`);

console.log('========================================');
console.log(`✅ RÉPARATION TERMINÉE : ${fixCount} template literal(s) corrigé(s)`);
console.log('========================================\n');

console.log('📝 PROCHAINES ÉTAPES :');
console.log('   1. Relancer le diagnostic: node diagnostic-dashboard.js');
console.log('   2. Si OK, tester localement le serveur');
console.log('   3. Git commit + push pour déployer sur Coolify');
console.log('   4. Vider le cache navigateur ET tester\n');

process.exit(0);
