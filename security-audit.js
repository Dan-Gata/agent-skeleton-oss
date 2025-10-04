#!/usr/bin/env node

/**
 * 🔒 SCRIPT D'AUDIT DE SÉCURITÉ POUR AGENT SKELETON OSS
 * Ce script vérifie les vulnérabilités de sécurité du code
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 DÉMARRAGE DE L\'AUDIT DE SÉCURITÉ');
console.log('=====================================\n');

// 1. Vérification des fichiers sensibles
const sensitiveFiles = [
    '.env',
    '.env.local', 
    '.env.production',
    'config.json',
    'secrets.json',
    'private.key',
    '.aws/credentials'
];

console.log('📁 VÉRIFICATION DES FICHIERS SENSIBLES:');
sensitiveFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`⚠️  ATTENTION: ${file} trouvé - Vérifiez qu'il n'est pas dans Git`);
    } else {
        console.log(`✅ ${file} - Non trouvé (bon)`);
    }
});

// 2. Vérification du .gitignore
console.log('\n🔒 VÉRIFICATION DU .GITIGNORE:');
if (fs.existsSync('.gitignore')) {
    const gitignore = fs.readFileSync('.gitignore', 'utf8');
    const requiredEntries = ['.env', 'node_modules', '*.log', '.DS_Store'];
    
    requiredEntries.forEach(entry => {
        if (gitignore.includes(entry)) {
            console.log(`✅ ${entry} - Ignoré correctement`);
        } else {
            console.log(`⚠️  MANQUANT: ${entry} devrait être dans .gitignore`);
        }
    });
} else {
    console.log('❌ .gitignore non trouvé - CRÉEZ-LE !');
}

// 3. Analyse du code pour vulnérabilités communes
console.log('\n🔍 ANALYSE DU CODE POUR VULNÉRABILITÉS:');

const codeChecks = [
    {
        pattern: /eval\s*\(/g,
        file: 'src/index.js',
        message: 'Usage d\'eval() détecté - VULNÉRABILITÉ CRITIQUE',
        severity: 'CRITIQUE'
    },
    {
        pattern: /innerHTML\s*=/g,
        file: 'public/js/dashboard.js',
        message: 'Usage d\'innerHTML détecté - Risque XSS',
        severity: 'ÉLEVÉ'
    },
    {
        pattern: /process\.env\./g,
        file: 'src/index.js',
        message: 'Variables d\'environnement utilisées - Vérifiez la validation',
        severity: 'INFO'
    },
    {
        pattern: /req\.query\./g,
        file: 'src/index.js',
        message: 'Paramètres de requête utilisés - Vérifiez la validation',
        severity: 'MOYEN'
    }
];

codeChecks.forEach(check => {
    const filePath = path.join('packages/orchestrator', check.file);
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const matches = content.match(check.pattern);
        
        if (matches) {
            const severity = check.severity === 'CRITIQUE' ? '🚨' : 
                           check.severity === 'ÉLEVÉ' ? '⚠️' : 
                           check.severity === 'MOYEN' ? '🔶' : 'ℹ️';
            console.log(`${severity} ${check.severity}: ${check.message} (${matches.length} occurrences)`);
        } else {
            console.log(`✅ ${check.file} - Aucun problème détecté pour: ${check.message}`);
        }
    } else {
        console.log(`📄 ${check.file} - Fichier non trouvé`);
    }
});

// 4. Vérification des dépendances de sécurité
console.log('\n🛡️  VÉRIFICATION DES PACKAGES DE SÉCURITÉ:');
const securityPackages = ['helmet', 'cors', 'express-rate-limit', 'express-validator'];

try {
    const packageJson = JSON.parse(fs.readFileSync('packages/orchestrator/package.json', 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    securityPackages.forEach(pkg => {
        if (dependencies[pkg]) {
            console.log(`✅ ${pkg} v${dependencies[pkg]} - Installé`);
        } else {
            console.log(`❌ ${pkg} - NON INSTALLÉ (recommandé)`);
        }
    });
} catch (error) {
    console.log('❌ Impossible de lire package.json');
}

// 5. Recommandations de sécurité
console.log('\n📋 RECOMMANDATIONS DE SÉCURITÉ:');
console.log('✅ Utilisez HTTPS en production');
console.log('✅ Validez toutes les entrées utilisateur'); 
console.log('✅ Implémentez la limitation du taux de requêtes');
console.log('✅ Utilisez des headers de sécurité (helmet)');
console.log('✅ Configurez CORS correctement');
console.log('✅ Loggez les événements de sécurité');
console.log('✅ Mettez à jour régulièrement les dépendances');
console.log('✅ Utilisez des variables d\'environnement pour les secrets');

console.log('\n🔒 AUDIT DE SÉCURITÉ TERMINÉ');
console.log('============================');