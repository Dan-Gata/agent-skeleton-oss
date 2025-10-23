#!/usr/bin/env node

/**
 * DIAGNOSTIC FINAL - Identifier la cause exacte du problème JavaScript
 * 
 * Ce script va :
 * 1. Tester la syntaxe JavaScript du fichier index.js
 * 2. Vérifier les erreurs de parsing
 * 3. Générer un rapport détaillé
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 ========================================');
console.log('🔍 DIAGNOSTIC FINAL DU DASHBOARD');
console.log('🔍 ========================================\n');

const indexPath = path.join(__dirname, 'packages', 'orchestrator', 'src', 'index.js');

console.log(`📁 Fichier à analyser: ${indexPath}\n`);

// Lire le fichier
let content;
try {
    content = fs.readFileSync(indexPath, 'utf-8');
    console.log(`✅ Fichier lu avec succès (${content.length} caractères)\n`);
} catch (error) {
    console.log(`❌ ERREUR lecture fichier: ${error.message}`);
    process.exit(1);
}

// Trouver la section dashboard
const dashboardStart = content.indexOf("app.get('/dashboard'");
const dashboardEnd = content.indexOf("// API endpoint to get current user info", dashboardStart);

if (dashboardStart === -1) {
    console.log('❌ Route /dashboard NON TROUVÉE dans le fichier !');
    process.exit(1);
}

console.log(`✅ Route /dashboard trouvée à la position ${dashboardStart}`);
console.log(`✅ Fin de la route estimée à la position ${dashboardEnd}\n`);

// Extraire la section dashboard
const dashboardSection = content.substring(dashboardStart, dashboardEnd > 0 ? dashboardEnd : content.length);

console.log('🔍 Analyse de la syntaxe JavaScript...\n');

// Rechercher les patterns problématiques
const issues = [];

// 1. Template literals non fermés
const backtickCount = (dashboardSection.match(/`/g) || []).length;
if (backtickCount % 2 !== 0) {
    issues.push({
        type: 'TEMPLATE_LITERAL',
        severity: 'CRITIQUE',
        message: `Nombre impair de backticks: ${backtickCount} (doit être pair)`
    });
}

// 2. Apostrophes non échappées dans template literals
const templateLiteralRegex = /`[^`]*`/g;
let templateLiterals = dashboardSection.match(templateLiteralRegex) || [];

templateLiterals.forEach((tpl, index) => {
    // Vérifier les apostrophes non échappées
    const unescapedQuotes = tpl.match(/[^\\]'/g);
    if (unescapedQuotes) {
        const lineNumber = content.substring(0, content.indexOf(tpl)).split('\n').length;
        issues.push({
            type: 'UNESCAPED_QUOTE',
            severity: 'CRITIQUE',
            message: `Apostrophe non échappée détectée à la ligne ~${lineNumber}`,
            preview: tpl.substring(0, 100) + '...'
        });
    }
});

// 3. Fonctions non fermées
const functionMatches = dashboardSection.match(/function\s+\w+\s*\([^)]*\)\s*\{/g) || [];
const openBraces = (dashboardSection.match(/\{/g) || []).length;
const closeBraces = (dashboardSection.match(/\}/g) || []).length;

if (openBraces !== closeBraces) {
    issues.push({
        type: 'BRACES_MISMATCH',
        severity: 'CRITIQUE',
        message: `Accolades non équilibrées: ${openBraces} ouvrantes, ${closeBraces} fermantes (diff: ${openBraces - closeBraces})`
    });
}

// 4. Parenthèses non fermées
const openParens = (dashboardSection.match(/\(/g) || []).length;
const closeParens = (dashboardSection.match(/\)/g) || []).length;

if (openParens !== closeParens) {
    issues.push({
        type: 'PARENS_MISMATCH',
        severity: 'CRITIQUE',
        message: `Parenthèses non équilibrées: ${openParens} ouvrantes, ${closeParens} fermantes (diff: ${openParens - closeParens})`
    });
}

// Afficher les résultats
console.log('========================================');
console.log('📊 RÉSULTATS DE L\'ANALYSE');
console.log('========================================\n');

if (issues.length === 0) {
    console.log('✅ AUCUNE ERREUR DÉTECTÉE !');
    console.log('✅ Le JavaScript semble syntaxiquement correct.\n');
    console.log('🤔 Si le dashboard ne fonctionne toujours pas :');
    console.log('   1. Vérifier les erreurs dans la console navigateur (F12)');
    console.log('   2. Vider le cache navigateur complètement');
    console.log('   3. Tester en mode navigation privée');
    console.log('   4. Vérifier que Coolify a bien déployé la dernière version\n');
} else {
    console.log(`❌ ${issues.length} PROBLÈME(S) DÉTECTÉ(S) :\n`);
    
    issues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.severity}] ${issue.type}`);
        console.log(`   ${issue.message}`);
        if (issue.preview) {
            console.log(`   Preview: ${issue.preview}`);
        }
        console.log('');
    });
    
    console.log('🔧 ACTIONS RECOMMANDÉES :');
    console.log('   1. Corriger les erreurs listées ci-dessus');
    console.log('   2. Relancer ce diagnostic');
    console.log('   3. Git commit + push pour déclencher redéploiement Coolify\n');
}

// Statistiques
console.log('========================================');
console.log('📈 STATISTIQUES');
console.log('========================================\n');
console.log(`Taille dashboard route: ${dashboardSection.length} caractères`);
console.log(`Nombre de fonctions JavaScript: ${functionMatches.length}`);
console.log(`Backticks (template literals): ${backtickCount}`);
console.log(`Accolades: ${openBraces} ouvrantes, ${closeBraces} fermantes`);
console.log(`Parenthèses: ${openParens} ouvrantes, ${closeParens} fermantes\n`);

// Sauvegarder le rapport
const reportPath = path.join(__dirname, 'DIAGNOSTIC_DASHBOARD_RAPPORT.txt');
const report = `
RAPPORT DE DIAGNOSTIC DASHBOARD
Date: ${new Date().toISOString()}
========================================

FICHIER ANALYSÉ: ${indexPath}
Taille: ${content.length} caractères
Section dashboard: ${dashboardSection.length} caractères

PROBLÈMES DÉTECTÉS: ${issues.length}
${issues.map((issue, i) => `
${i + 1}. [${issue.severity}] ${issue.type}
   ${issue.message}
   ${issue.preview || ''}
`).join('\n')}

STATISTIQUES:
- Fonctions JavaScript: ${functionMatches.length}
- Template literals (backticks): ${backtickCount}
- Accolades: ${openBraces} ouvrantes, ${closeBraces} fermantes
- Parenthèses: ${openParens} ouvrantes, ${closeParens} fermantes

STATUS: ${issues.length === 0 ? '✅ SYNTAXE OK' : '❌ ERREURS DÉTECTÉES'}
`;

fs.writeFileSync(reportPath, report);
console.log(`📝 Rapport sauvegardé: ${reportPath}\n`);

// Code de sortie
process.exit(issues.length > 0 ? 1 : 0);
