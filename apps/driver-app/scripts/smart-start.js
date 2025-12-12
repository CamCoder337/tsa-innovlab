#!/usr/bin/env node

/**
 * Script de démarrage intelligent
 * 
 * Ce script vérifie automatiquement la configuration et démarre l'app
 * avec les bonnes paramètres selon l'environnement détecté.
 */

const { exec, spawn } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');
const http = require('http');

const BACKEND_PORT = 3333;

console.log('\n🚀 Démarrage intelligent TSA Driver App');
console.log('='.repeat(50));

/**
 * Détecte l'IP locale
 */
function detectLocalIP() {
  const interfaces = os.networkInterfaces();
  const priorityInterfaces = ['Wi-Fi', 'Ethernet', 'en0', 'en1', 'eth0', 'wlan0'];

  for (const name of priorityInterfaces) {
    if (interfaces[name]) {
      const iface = interfaces[name].find(
        (details) => details.family === 'IPv4' && !details.internal
      );
      if (iface) {
        return iface.address;
      }
    }
  }
  return null;
}

/**
 * Teste la connectivité backend
 */
function testBackend(url) {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      resolve(true);
    });

    request.on('error', () => resolve(false));
    request.setTimeout(3000, () => {
      request.destroy();
      resolve(false);
    });
  });
}

/**
 * Met à jour le fichier .env
 */
function updateEnvFile(ipAddress) {
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ Fichier .env introuvable');
    return false;
  }

  let envContent = fs.readFileSync(envPath, 'utf-8');
  const newApiUrl = `http://${ipAddress}:${BACKEND_PORT}`;
  const urlRegex = /^EXPO_PUBLIC_API_BASE_URL=.+$/m;

  if (urlRegex.test(envContent)) {
    envContent = envContent.replace(urlRegex, `EXPO_PUBLIC_API_BASE_URL=${newApiUrl}`);
    fs.writeFileSync(envPath, envContent, 'utf-8');
    return true;
  }
  
  return false;
}

/**
 * Démarre Expo avec les bonnes options
 */
function startExpo(mode = 'lan') {
  console.log(`\n🎯 Démarrage d'Expo en mode ${mode.toUpperCase()}...`);
  
  const args = ['start', '--clear'];
  
  if (mode === 'tunnel') {
    args.push('--tunnel');
  }

  const expoProcess = spawn('npx', ['expo', ...args], {
    stdio: 'inherit',
    shell: true
  });

  expoProcess.on('error', (error) => {
    console.error('❌ Erreur lors du démarrage d\'Expo:', error.message);
  });

  return expoProcess;
}

/**
 * Fonction principale
 */
async function main() {
  console.log('\n1️⃣ Détection de l\'environnement...');
  
  const localIP = detectLocalIP();
  if (!localIP) {
    console.log('❌ Impossible de détecter l\'IP locale');
    console.log('🔄 Démarrage en mode tunnel...');
    startExpo('tunnel');
    return;
  }

  console.log(`✅ IP détectée: ${localIP}`);

  console.log('\n2️⃣ Mise à jour de la configuration...');
  
  const envUpdated = updateEnvFile(localIP);
  if (envUpdated) {
    console.log('✅ Fichier .env mis à jour');
  } else {
    console.log('⚠️  Impossible de mettre à jour le .env');
  }

  console.log('\n3️⃣ Vérification du backend...');
  
  const backendRunning = await testBackend(`http://localhost:${BACKEND_PORT}`);
  
  if (!backendRunning) {
    console.log('❌ Backend non accessible sur localhost:3333');
    console.log('💡 Assurez-vous que le serveur AdonisJS est démarré:');
    console.log('   cd services/tsa-monolith && npm run dev');
    console.log('\n🔄 Démarrage d\'Expo quand même...');
  } else {
    console.log('✅ Backend accessible');
  }

  console.log('\n4️⃣ Test de l\'accessibilité réseau...');
  
  const networkAccessible = await testBackend(`http://${localIP}:${BACKEND_PORT}`);
  
  if (!networkAccessible) {
    console.log('⚠️  Backend non accessible via IP locale');
    console.log('💡 Cela peut être dû au firewall Windows');
    console.log('🔄 Démarrage en mode tunnel pour contourner le problème...');
    startExpo('tunnel');
    return;
  }

  console.log('✅ Backend accessible via réseau local');
  console.log('\n5️⃣ Démarrage d\'Expo...');
  
  startExpo('lan');

  console.log('\n📱 Instructions:');
  console.log('1. Scannez le QR code avec Expo Go');
  console.log('2. Si erreur de connexion, fermez ce terminal et exécutez:');
  console.log('   npm run start:tunnel');
  console.log('\n💡 URLs de test:');
  console.log(`   Backend: http://${localIP}:${BACKEND_PORT}`);
  console.log(`   Health: http://${localIP}:${BACKEND_PORT}/api/health`);
}

// Gestion des signaux pour un arrêt propre
process.on('SIGINT', () => {
  console.log('\n\n👋 Arrêt du serveur Expo...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Arrêt du serveur Expo...');
  process.exit(0);
});

// Démarrage
main().catch((error) => {
  console.error('❌ Erreur:', error.message);
  console.log('🔄 Tentative de démarrage en mode tunnel...');
  startExpo('tunnel');
});