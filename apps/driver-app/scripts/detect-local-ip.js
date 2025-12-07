#!/usr/bin/env node

/**
 * Script de détection automatique de l'IP locale
 *
 * Ce script détecte l'adresse IP locale de la machine et met à jour
 * le fichier .env avec la bonne URL de l'API backend.
 *
 * Usage:
 *   node scripts/detect-local-ip.js
 *   npm run update-ip
 */

const os = require('os');
const fs = require('fs');
const path = require('path');

// Port du backend AdonisJS
const BACKEND_PORT = 3333;

/**
 * Détecte l'adresse IP locale de la machine
 * Priorité : Wi-Fi > Ethernet > Autres
 */
function detectLocalIP() {
  const interfaces = os.networkInterfaces();
  let ipAddress = null;

  // Priorité aux interfaces Wi-Fi et Ethernet
  const priorityInterfaces = ['Wi-Fi', 'Ethernet', 'en0', 'en1', 'eth0', 'wlan0'];

  // Essayer d'abord les interfaces prioritaires
  for (const name of priorityInterfaces) {
    if (interfaces[name]) {
      const iface = interfaces[name].find(
        (details) => details.family === 'IPv4' && !details.internal
      );
      if (iface) {
        ipAddress = iface.address;
        console.log(`✓ IP détectée via interface "${name}": ${ipAddress}`);
        return ipAddress;
      }
    }
  }

  // Sinon, chercher n'importe quelle interface IPv4 non-interne
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name].find(
      (details) => details.family === 'IPv4' && !details.internal
    );
    if (iface) {
      ipAddress = iface.address;
      console.log(`✓ IP détectée via interface "${name}": ${ipAddress}`);
      return ipAddress;
    }
  }

  console.warn('⚠ Aucune adresse IP locale détectée');
  return null;
}

/**
 * Met à jour le fichier .env avec la nouvelle URL de l'API
 */
function updateEnvFile(ipAddress) {
  const envPath = path.join(__dirname, '..', '.env');

  if (!fs.existsSync(envPath)) {
    console.error('❌ Fichier .env introuvable. Copiez .env.example vers .env d\'abord.');
    process.exit(1);
  }

  let envContent = fs.readFileSync(envPath, 'utf-8');
  const newApiUrl = `http://${ipAddress}:${BACKEND_PORT}`;

  // Remplacer l'URL de l'API
  const urlRegex = /^EXPO_PUBLIC_API_BASE_URL=.+$/m;

  if (urlRegex.test(envContent)) {
    const oldUrl = envContent.match(urlRegex)[0];
    envContent = envContent.replace(urlRegex, `EXPO_PUBLIC_API_BASE_URL=${newApiUrl}`);
    console.log(`\n📝 Mise à jour du .env :`);
    console.log(`   Ancien: ${oldUrl.split('=')[1]}`);
    console.log(`   Nouveau: ${newApiUrl}`);
  } else {
    console.error('❌ Variable EXPO_PUBLIC_API_BASE_URL introuvable dans le .env');
    process.exit(1);
  }

  fs.writeFileSync(envPath, envContent, 'utf-8');
  console.log(`\n✅ Fichier .env mis à jour avec succès!`);
}

/**
 * Affiche l'aide pour se connecter depuis différents appareils
 */
function displayHelp(ipAddress) {
  console.log(`\n${'='.repeat(80)}`);
  console.log('📱 Guide de connexion selon votre appareil :');
  console.log('='.repeat(80));
  console.log(`\n📍 Simulateur iOS (Mac) :`);
  console.log(`   → URL: http://localhost:${BACKEND_PORT}`);
  console.log(`   → Déjà configuré par défaut`);
  console.log(`\n📍 Émulateur Android :`);
  console.log(`   → URL: http://10.0.2.2:${BACKEND_PORT}`);
  console.log(`   → 10.0.2.2 est l'alias pour localhost sur Android`);
  console.log(`\n📍 Appareil Physique (Wi-Fi) :`);
  console.log(`   → URL: http://${ipAddress}:${BACKEND_PORT}`);
  console.log(`   → Assurez-vous que l'appareil et votre PC sont sur le même réseau Wi-Fi`);
  console.log(`   → Vérifiez que le firewall autorise les connexions sur le port ${BACKEND_PORT}`);
  console.log(`\n💡 Conseil :`);
  console.log(`   Pour tester la connectivité depuis votre téléphone :`);
  console.log(`   → Ouvrez un navigateur web`);
  console.log(`   → Accédez à http://${ipAddress}:${BACKEND_PORT}/api/health`);
  console.log(`   → Vous devriez voir une réponse du serveur`);
  console.log(`\n${'='.repeat(80)}\n`);
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n🔍 Détection de l\'adresse IP locale...\n');

const localIP = detectLocalIP();

if (!localIP) {
  console.error('\n❌ Impossible de détecter l\'adresse IP locale.');
  console.error('   Veuillez configurer manuellement EXPO_PUBLIC_API_BASE_URL dans le .env\n');
  process.exit(1);
}

updateEnvFile(localIP);
displayHelp(localIP);

console.log('🚀 Vous pouvez maintenant lancer l\'application avec :');
console.log('   npm start --clear\n');
