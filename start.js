#!/usr/bin/env node

// Startup script pour Coolify
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Démarrage de Agent Skeleton OSS...');
console.log(`📁 Dossier: ${__dirname}`);

// Démarrage depuis la racine avec src/index.js
const startApp = spawn('node', ['src/index.js'], {
  stdio: 'inherit',
  cwd: __dirname,
  env: {
    ...process.env,
    PORT: process.env.PORT || 3000
  }
});

startApp.on('error', (error) => {
  console.error('❌ Erreur de démarrage:', error);
  process.exit(1);
});

startApp.on('close', (code) => {
  console.log(`🔚 Application fermée avec le code ${code}`);
  process.exit(code);
});

// Gestion des signaux
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM reçu, arrêt de l\'application...');
  startApp.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT reçu, arrêt de l\'application...');
  startApp.kill('SIGINT');
});