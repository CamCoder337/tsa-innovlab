#!/usr/bin/env node
/**
 * Script de déploiement automatisé pour TSA Driver App
 * Usage: node scripts/deploy.js [android|ios|both]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function exec(command, silent = false) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit'
    });
    return result;
  } catch (error) {
    log(`❌ Erreur lors de l'exécution: ${command}`, COLORS.red);
    throw error;
  }
}

function checkEnvironment() {
  log('', COLORS.reset);
  log('═══════════════════════════════════════════════════════════', COLORS.blue);
  log('  🚀 TSA Driver App - Script de Déploiement', COLORS.bright);
  log('═══════════════════════════════════════════════════════════', COLORS.blue);
  log('', COLORS.reset);

  // Vérifier que .env existe
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    log('❌ Fichier .env manquant', COLORS.red);
    log('', COLORS.reset);
    log('Exécutez d\'abord:', COLORS.yellow);
    log('  node scripts/switch-env.js production', COLORS.yellow);
    log('', COLORS.reset);
    process.exit(1);
  }

  // Vérifier l'environnement
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = envContent.match(/EXPO_PUBLIC_ENV=(.+)/)?.[1];
  const apiUrl = envContent.match(/EXPO_PUBLIC_API_BASE_URL=(.+)/)?.[1];

  log('📝 Configuration actuelle:', COLORS.blue);
  log(`   Environnement: ${env}`, COLORS.reset);
  log(`   API Backend: ${apiUrl}`, COLORS.reset);
  log('', COLORS.reset);

  if (env !== 'production') {
    log('⚠️  Attention: L\'environnement n\'est pas en mode production', COLORS.yellow);
    log('', COLORS.reset);
    log('Pour déployer en production, exécutez:', COLORS.yellow);
    log('  node scripts/switch-env.js production', COLORS.yellow);
    log('', COLORS.reset);

    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      readline.question('Continuer quand même? (y/N) ', (answer) => {
        readline.close();
        if (answer.toLowerCase() !== 'y') {
          process.exit(0);
        }
        resolve();
      });
    });
  }
}

async function buildEAS(platform) {
  log('', COLORS.reset);
  log('───────────────────────────────────────────────────────────', COLORS.blue);
  log(`  🔨 Build EAS pour ${platform}`, COLORS.bright);
  log('───────────────────────────────────────────────────────────', COLORS.blue);
  log('', COLORS.reset);

  try {
    log('Vérification de la connexion EAS...', COLORS.yellow);
    exec('npx eas whoami', true);
    log('✅ Connecté à EAS', COLORS.green);
  } catch (error) {
    log('❌ Non connecté à EAS', COLORS.red);
    log('', COLORS.reset);
    log('Exécutez: npx eas login', COLORS.yellow);
    process.exit(1);
  }

  log('', COLORS.reset);
  log('Lancement du build...', COLORS.yellow);
  log('⏱️  Cela peut prendre 10-15 minutes', COLORS.yellow);
  log('', COLORS.reset);

  const buildCommand = `npx eas build --platform ${platform} --profile production --non-interactive`;
  exec(buildCommand);

  log('', COLORS.reset);
  log('✅ Build terminé!', COLORS.green);
  log('', COLORS.reset);
  log('📱 Téléchargez l\'APK/IPA via le lien fourni ci-dessus', COLORS.blue);
  log('', COLORS.reset);
}

function buildLocal(platform) {
  log('', COLORS.reset);
  log('───────────────────────────────────────────────────────────', COLORS.blue);
  log(`  🔨 Build local pour ${platform}`, COLORS.bright);
  log('───────────────────────────────────────────────────────────', COLORS.blue);
  log('', COLORS.reset);

  if (platform === 'android') {
    log('Génération des fichiers Android...', COLORS.yellow);
    exec('npx expo prebuild --platform android');

    log('', COLORS.reset);
    log('Build de l\'APK...', COLORS.yellow);
    exec('cd android && ./gradlew assembleRelease');

    const apkPath = 'android/app/build/outputs/apk/release/app-release.apk';
    log('', COLORS.reset);
    log('✅ APK généré avec succès!', COLORS.green);
    log('', COLORS.reset);
    log(`📁 Chemin: ${apkPath}`, COLORS.blue);
    log('', COLORS.reset);
  } else if (platform === 'ios') {
    log('❌ Build iOS local nécessite macOS et Xcode', COLORS.red);
    log('', COLORS.reset);
    log('Utilisez EAS Build à la place:', COLORS.yellow);
    log('  npx eas build --platform ios --profile production', COLORS.yellow);
    log('', COLORS.reset);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const platform = args[0]?.toLowerCase();
  const buildType = args[1]?.toLowerCase() || 'eas'; // 'eas' ou 'local'

  if (!platform || !['android', 'ios', 'both'].includes(platform)) {
    log('❌ Plateforme invalide ou manquante', COLORS.red);
    log('', COLORS.reset);
    log('Usage: node scripts/deploy.js [android|ios|both] [eas|local]', COLORS.yellow);
    log('', COLORS.reset);
    log('Exemples:', COLORS.blue);
    log('  node scripts/deploy.js android eas     # Build Android via EAS (recommandé)', COLORS.reset);
    log('  node scripts/deploy.js android local   # Build Android en local', COLORS.reset);
    log('  node scripts/deploy.js both eas        # Build Android + iOS via EAS', COLORS.reset);
    log('', COLORS.reset);
    process.exit(1);
  }

  await checkEnvironment();

  const platforms = platform === 'both' ? ['android', 'ios'] : [platform];

  for (const p of platforms) {
    if (buildType === 'eas') {
      await buildEAS(p);
    } else if (buildType === 'local') {
      buildLocal(p);
    }
  }

  log('', COLORS.reset);
  log('═══════════════════════════════════════════════════════════', COLORS.green);
  log('  ✅ Déploiement terminé!', COLORS.bright);
  log('═══════════════════════════════════════════════════════════', COLORS.green);
  log('', COLORS.reset);
}

main().catch((error) => {
  log('', COLORS.reset);
  log('❌ Erreur lors du déploiement:', COLORS.red);
  log(error.message, COLORS.red);
  log('', COLORS.reset);
  process.exit(1);
});
