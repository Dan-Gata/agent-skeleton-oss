/**
 * Correcteur intelligent : retire les échappements d'apostrophes SEULEMENT dans les template literals
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'packages/orchestrator/src/index.js');
let content = fs.readFileSync(filePath, 'utf8');

// Regex pour trouver les template literals
const templateLiteralRegex = /`([^`]*)`/g;

let modifications = 0;

// Remplacer les \' par ' uniquement DANS les template literals
content = content.replace(templateLiteralRegex, (match) => {
    const original = match;
    // Remplacer \' par ' dans le template literal
    const fixed = match.replace(/\\'/g, "'");
    
    if (original !== fixed) {
        modifications++;
        console.log(`✅ Correction dans template literal:`);
        console.log(`   Avant: ${original.substring(0, 80)}...`);
        console.log(`   Après: ${fixed.substring(0, 80)}...`);
    }
    
    return fixed;
});

// Sauvegarder
fs.writeFileSync(filePath, content, 'utf8');

console.log(`\n✅ Terminé ! ${modifications} template literals corrigés.`);
console.log(`📄 Fichier: ${filePath}`);
