#!/usr/bin/env node
/**
 * Script de vérification pré-déploiement
 * Vérifie que tout est prêt avant de déployer l'application
 * Usage: node scripts/pre-deploy-check.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function checkMark(passed) {
  return passed ? `${COLORS.green}✓${COLORS.reset}` : `${COLORS.red}✗${COLORS.reset}`;
}

function exec(command, silent = true) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit',
    }).trim();
  } catch (error) {
    return null;
  }
}

async function checkBackendConnection(apiUrl) {
  return new Promise((resolve) => {
    const url = apiUrl.replace('http://', '');
    const [host, port] = url.split(':');

    const req = http.request(
      {
        host: host,
        port: port || 80,
        path: '/health',
        method: 'GET',
        timeout: 5000,
      },
      (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 500);
      }
    );

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function main() {
  log('', COLORS.reset);
  log('═══════════════════════════════════════════════════════════', COLORS.blue);
  log('  🔍 Vérification Pré-Déploiement - TSA Driver App', COLORS.bright);
  log('═══════════════════════════════════════════════════════════', COLORS.blue);
  log('', COLORS.reset);

  const checks = {
    passed: 0,
    warnings: 0,
    failed: 0,
  };

  // Check 1: Fichier .env existe
  log('📋 Vérification de la configuration...', COLORS.blue);
  log('', COLORS.reset);

  const envPath = path.join(__dirname, '..', '.env');
  const envExists = fs.existsSync(envPath);
  log(`  ${checkMark(envExists)} Fichier .env existe`, COLORS.reset);

  if (!envExists) {
    checks.failed++;
    log(`     ${COLORS.red}→ Exécutez: npm run env:prod${COLORS.reset}`, COLORS.dim);
  } else {
    checks.passed++;

    // Check 2: Environnement configuré
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = envContent.match(/EXPO_PUBLIC_ENV=(.+)/)?.[1];
    const apiUrl = envContent.match(/EXPO_PUBLIC_API_BASE_URL=(.+)/)?.[1];
    const debugMode = envContent.match(/EXPO_PUBLIC_DEBUG_MODE=(.+)/)?.[1];
    const googleMapsKey = envContent.match(/EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=(.+)/)?.[1];

    const isProduction = env === 'production';
    log(`  ${checkMark(isProduction)} Environnement: ${env}`, COLORS.reset);

    if (!isProduction) {
      checks.warnings++;
      log(`     ${COLORS.yellow}→ Production recommandée. Exécutez: npm run env:prod${COLORS.reset}`, COLORS.dim);
    } else {
      checks.passed++;
    }

    // Check 3: URL du backend
    const isProductionUrl = apiUrl && apiUrl.includes('51.91.77.0:30000');
    log(`  ${checkMark(isProductionUrl)} API Backend: ${apiUrl}`, COLORS.reset);

    if (!isProductionUrl) {
      checks.warnings++;
      log(`     ${COLORS.yellow}→ Configuré pour: ${apiUrl}${COLORS.reset}`, COLORS.dim);
    } else {
      checks.passed++;
    }

    // Check 4: Debug mode
    const debugDisabled = debugMode === 'false';
    log(`  ${checkMark(debugDisabled)} Debug Mode: ${debugMode}`, COLORS.reset);

    if (!debugDisabled) {
      checks.warnings++;
      log(`     ${COLORS.yellow}→ Recommandé de désactiver en production${COLORS.reset}`, COLORS.dim);
    } else {
      checks.passed++;
    }

    // Check 5: Google Maps API Key
    const hasGoogleMapsKey = googleMapsKey && googleMapsKey.length > 10 && !googleMapsKey.includes('your_');
    log(`  ${checkMark(hasGoogleMapsKey)} Google Maps API Key: ${hasGoogleMapsKey ? 'Configurée' : 'Manquante'}`, COLORS.reset);

    if (!hasGoogleMapsKey) {
      checks.warnings++;
      log(`     ${COLORS.yellow}→ L'app fonctionnera mais les cartes ne s'afficheront pas${COLORS.reset}`, COLORS.dim);
    } else {
      checks.passed++;
    }

    log('', COLORS.reset);

    // Check 6: Backend accessible
    log('🌐 Vérification de la connectivité...', COLORS.blue);
    log('', COLORS.reset);

    log(`  ${COLORS.dim}Testing connection to ${apiUrl}...${COLORS.reset}`, COLORS.reset);
    const backendReachable = await checkBackendConnection(apiUrl);
    log(`  ${checkMark(backendReachable)} Backend accessible: ${apiUrl}`, COLORS.reset);

    if (!backendReachable) {
      checks.warnings++;
      log(`     ${COLORS.yellow}→ Vérifiez que le serveur est en ligne${COLORS.reset}`, COLORS.dim);
    } else {
      checks.passed++;
    }

    log('', COLORS.reset);
  }

  // Check 7: Dependencies installées
  log('📦 Vérification des dépendances...', COLORS.blue);
  log('', COLORS.reset);

  const nodeModulesExists = fs.existsSync(path.join(__dirname, '..', 'node_modules'));
  log(`  ${checkMark(nodeModulesExists)} node_modules présent`, COLORS.reset);

  if (!nodeModulesExists) {
    checks.failed++;
    log(`     ${COLORS.red}→ Exécutez: npm install${COLORS.reset}`, COLORS.dim);
  } else {
    checks.passed++;
  }

  log('', COLORS.reset);

  // Check 8: EAS CLI
  log('🔧 Vérification des outils...', COLORS.blue);
  log('', COLORS.reset);

  const easInstalled = exec('npx eas --version') !== null;
  log(`  ${checkMark(easInstalled)} EAS CLI disponible`, COLORS.reset);

  if (!easInstalled) {
    checks.warnings++;
    log(`     ${COLORS.yellow}→ Sera installé automatiquement si nécessaire${COLORS.reset}`, COLORS.dim);
  } else {
    checks.passed++;
  }

  // Check 9: EAS login
  const easLoggedIn = exec('npx eas whoami') !== null;
  log(`  ${checkMark(easLoggedIn)} Connecté à EAS: ${easLoggedIn ? exec('npx eas whoami') : 'Non'}`, COLORS.reset);

  if (!easLoggedIn) {
    checks.warnings++;
    log(`     ${COLORS.yellow}→ Exécutez: npx eas login${COLORS.reset}`, COLORS.dim);
  } else {
    checks.passed++;
  }

  log('', COLORS.reset);

  // Check 10: Git status
  log('🔀 Vérification Git...', COLORS.blue);
  log('', COLORS.reset);

  const gitStatus = exec('git status --porcelain');
  const hasUncommittedChanges = gitStatus && gitStatus.length > 0;
  log(`  ${checkMark(!hasUncommittedChanges)} Pas de changements non-committé`, COLORS.reset);

  if (hasUncommittedChanges) {
    checks.warnings++;
    log(`     ${COLORS.yellow}→ Vous avez des changements non-committés${COLORS.reset}`, COLORS.dim);
    log(`     ${COLORS.dim}${gitStatus.split('\n').slice(0, 3).join('\n     ')}${COLORS.reset}`, COLORS.dim);
  } else {
    checks.passed++;
  }

  log('', COLORS.reset);

  // Résumé
  log('═══════════════════════════════════════════════════════════', COLORS.blue);
  log('  📊 Résumé de la vérification', COLORS.bright);
  log('═══════════════════════════════════════════════════════════', COLORS.blue);
  log('', COLORS.reset);

  log(`  ${COLORS.green}✓ Vérifications réussies: ${checks.passed}${COLORS.reset}`, COLORS.reset);
  log(`  ${COLORS.yellow}⚠ Avertissements: ${checks.warnings}${COLORS.reset}`, COLORS.reset);
  log(`  ${COLORS.red}✗ Erreurs bloquantes: ${checks.failed}${COLORS.reset}`, COLORS.reset);

  log('', COLORS.reset);

  if (checks.failed > 0) {
    log('❌ Déploiement non recommandé', COLORS.red);
    log('', COLORS.reset);
    log('Corrigez les erreurs ci-dessus avant de déployer.', COLORS.yellow);
    log('', COLORS.reset);
    process.exit(1);
  } else if (checks.warnings > 0) {
    log('⚠️  Déploiement possible avec avertissements', COLORS.yellow);
    log('', COLORS.reset);
    log('Vous pouvez déployer, mais vérifiez les avertissements ci-dessus.', COLORS.yellow);
    log('', COLORS.reset);
    log('Pour déployer:', COLORS.blue);
    log('  npm run deploy:android', COLORS.bright);
    log('', COLORS.reset);
  } else {
    log('✅ Tout est prêt pour le déploiement!', COLORS.green);
    log('', COLORS.reset);
    log('Commandes de déploiement:', COLORS.blue);
    log('  npm run deploy:android     # Android via EAS', COLORS.reset);
    log('  npm run deploy:ios         # iOS via EAS', COLORS.reset);
    log('  npm run deploy:both        # Android + iOS', COLORS.reset);
    log('', COLORS.reset);
  }

  log('═══════════════════════════════════════════════════════════', COLORS.blue);
  log('', COLORS.reset);
}

main().catch((error) => {
  log('', COLORS.reset);
  log('❌ Erreur lors de la vérification:', COLORS.red);
  log(error.message, COLORS.red);
  log('', COLORS.reset);
  process.exit(1);
});
