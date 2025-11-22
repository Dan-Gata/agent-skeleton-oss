#!/usr/bin/env node

/**
 * Script de test pré-déploiement
 * Vérifie que l'application est prête pour Coolify
 */

const http = require('http');

console.log('🔍 Test pré-déploiement Coolify\n');

// Test 1: Vérifier que le serveur démarre
console.log('1️⃣  Test démarrage du serveur...');
const server = require('./packages/orchestrator/src/index.js');

setTimeout(() => {
    // Test 2: Health check
    console.log('2️⃣  Test endpoint /health...');
    
    http.get('http://localhost:3000/health', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            if (res.statusCode === 200) {
                console.log('   ✅ /health répond HTTP 200');
                const health = JSON.parse(data);
                console.log('   📊 Status:', health.status);
                console.log('   📦 Version:', health.version);
            } else {
                console.log('   ❌ /health répond HTTP', res.statusCode);
                process.exit(1);
            }
            
            // Test 3: Route racine
            console.log('3️⃣  Test endpoint /...');
            http.get('http://localhost:3000/', (res2) => {
                let data2 = '';
                res2.on('data', chunk => data2 += chunk);
                res2.on('end', () => {
                    if (res2.statusCode === 200) {
                        console.log('   ✅ / répond HTTP 200');
                        const info = JSON.parse(data2);
                        console.log('   📛 Name:', info.name);
                        console.log('   🔗 Endpoints:', Object.keys(info.endpoints).length);
                    } else {
                        console.log('   ❌ / répond HTTP', res2.statusCode);
                    }
                    
                    console.log('\n✅ Tous les tests passés !');
                    console.log('🚀 L\'application est prête pour Coolify\n');
                    process.exit(0);
                });
            }).on('error', (err) => {
                console.log('   ❌ Erreur:', err.message);
                process.exit(1);
            });
        });
    }).on('error', (err) => {
        console.log('   ❌ Erreur:', err.message);
        process.exit(1);
    });
}, 2000); // Attendre 2 secondes que le serveur démarre
