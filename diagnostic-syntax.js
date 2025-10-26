#!/usr/bin/env node

/**
 * DIAGNOSTIC CIBLÉ - Trouver UNIQUEMENT les vraies erreurs
 * 
 * Cette version NE corrige PAS les apostrophes dans les template literals
 * car elles n'ont PAS besoin d'être échappées !
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 ========================================');
console.log('🔍 DIAGNOSTIC CIBLÉ - SYNTAXE JAVASCRIPT');
console.log('🔍 ========================================\n');

const indexPath = path.join(__dirname, 'packages', 'orchestrator', 'src', 'index.js');

let content = fs.readFileSync(indexPath, 'utf-8');
const lines = content.split('\n');

console.log(`📁 Fichier: ${indexPath}`);
console.log(`📊 Total lignes: ${lines.length}\n`);

console.log('🔍 Recherche des erreurs de syntaxe JavaScript...\n');

const errors = [];

// Tester la syntaxe en tentant de charger le fichier
try {
    // Créer un fichier temporaire pour tester
    const tempPath = path.join(__dirname, 'temp-test-syntax.js');
    fs.writeFileSync(tempPath, content);
    
    // Tenter de require (sans exécuter)
    try {
        delete require.cache[tempPath];
        require(tempPath);
        console.log('✅ AUCUNE ERREUR DE SYNTAXE DÉTECTÉE !');
        console.log('✅ Le fichier JavaScript est syntaxiquement valide.\n');
        fs.unlinkSync(tempPath);
        process.exit(0);
    } catch (syntaxError) {
        fs.unlinkSync(tempPath);
        
        console.log('❌ ERREUR DE SYNTAXE DÉTECTÉE !\n');
        console.log('Message:', syntaxError.message);
        
        // Extraire le numéro de ligne de l'erreur
        const lineMatch = syntaxError.stack.match(/:(\d+):(\d+)/);
        if (lineMatch) {
            const errorLine = parseInt(lineMatch[1]);
            const errorCol = parseInt(lineMatch[2]);
            
            console.log('\n📍 Erreur à la ligne', errorLine, 'colonne', errorCol);
            console.log('\nContexte:');
            console.log('─'.repeat(80));
            
            // Afficher 5 lignes avant et après
            const start = Math.max(0, errorLine - 6);
            const end = Math.min(lines.length, errorLine + 5);
            
            for (let i = start; i < end; i++) {
                const lineNum = i + 1;
                const marker = lineNum === errorLine ? '→' : ' ';
                const line = lines[i];
                console.log(`${marker} ${lineNum.toString().padStart(5)} │ ${line}`);
                
                if (lineNum === errorLine) {
                    const pointer = ' '.repeat(errorCol + 8) + '^'.repeat(10);
                    console.log(`  ${pointer}`);
                }
            }
            console.log('─'.repeat(80));
        }
        
        console.log('\n🔧 SOLUTION:');
        console.log('   Corriger manuellement la syntaxe à la ligne indiquée');
        console.log('   Relancer ce diagnostic après correction\n');
        
        process.exit(1);
    }
} catch (error) {
    console.log('❌ Erreur lors du test:', error.message);
    process.exit(1);
}
