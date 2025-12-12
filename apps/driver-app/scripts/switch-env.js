#!/usr/bin/env node
/**
 * Script pour basculer entre les environnements (development, production)
 * Usage: node scripts/switch-env.js [development|production]
 */

const fs = require('fs');
const path = require('path');

const ENVIRONMENTS = {
  development: '.env.development',
  production: '.env.production',
  dev: '.env.development',
  prod: '.env.production',
};

const args = process.argv.slice(2);
const requestedEnv = args[0]?.toLowerCase();

if (!requestedEnv || !ENVIRONMENTS[requestedEnv]) {
  console.error('❌ Erreur: Environnement invalide ou manquant');
  console.log('');
  console.log('Usage: node scripts/switch-env.js [development|production]');
  console.log('');
  console.log('Environnements disponibles:');
  console.log('  - development (ou dev)  : Backend local (localhost:3333)');
  console.log('  - production (ou prod)  : Backend en ligne (51.91.77.0:30000)');
  console.log('');
  process.exit(1);
}

const envFile = ENVIRONMENTS[requestedEnv];
const sourcePath = path.join(__dirname, '..', envFile);
const targetPath = path.join(__dirname, '..', '.env');

try {
  // Vérifier que le fichier source existe
  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ Erreur: Le fichier ${envFile} n'existe pas`);
    process.exit(1);
  }

  // Copier le fichier
  fs.copyFileSync(sourcePath, targetPath);

  const actualEnv = requestedEnv === 'dev' ? 'development' :
                    requestedEnv === 'prod' ? 'production' :
                    requestedEnv;

  console.log('');
  console.log('✅ Environnement configuré avec succès!');
  console.log('');
  console.log(`📝 Environnement actif: ${actualEnv.toUpperCase()}`);
  console.log(`📁 Fichier source: ${envFile}`);
  console.log('');

  // Lire et afficher les informations clés
  const envContent = fs.readFileSync(targetPath, 'utf8');
  const apiUrl = envContent.match(/EXPO_PUBLIC_API_BASE_URL=(.+)/)?.[1];
  const env = envContent.match(/EXPO_PUBLIC_ENV=(.+)/)?.[1];
  const debugMode = envContent.match(/EXPO_PUBLIC_DEBUG_MODE=(.+)/)?.[1];

  console.log('🔧 Configuration:');
  console.log(`   ENV: ${env}`);
  console.log(`   API: ${apiUrl}`);
  console.log(`   Debug: ${debugMode}`);
  console.log('');
  console.log('⚠️  Pensez à redémarrer Expo pour appliquer les changements:');
  console.log('   npm start -- --clear');
  console.log('');
} catch (error) {
  console.error('❌ Erreur lors de la copie du fichier:', error.message);
  process.exit(1);
}
