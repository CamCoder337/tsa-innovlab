#!/usr/bin/env node

/**
 * Script de diagnostic de connexion
 * 
 * Ce script vérifie la connectivité réseau et diagnostique les problèmes
 * de connexion entre l'app mobile et le serveur backend.
 */

const os = require('os');
const fs = require('path');
const { exec } = require('child_process');
const http = require('http');

const BACKEND_PORT = 3333;

console.log('\n🔍 Diagnostic de connexion TSA Driver App');
console.log('='.repeat(50));

/**
 * Détecte l'adresse IP locale
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
        return { ip: iface.address, interface: name };
      }
    }
  }

  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name].find(
      (details) => details.family === 'IPv4' && !details.internal
    );
    if (iface) {
      return { ip: iface.address, interface: name };
    }
  }

  return null;
}

/**
 * Teste la connectivité HTTP vers une URL
 */
function testHttpConnection(url) {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      resolve({
        success: true,
        status: response.statusCode,
        message: `Connexion réussie (${response.statusCode})`
      });
    });

    request.on('error', (error) => {
      resolve({
        success: false,
        error: error.code,
        message: error.message
      });
    });

    request.setTimeout(5000, () => {
      request.destroy();
      resolve({
        success: false,
        error: 'TIMEOUT',
        message: 'Timeout après 5 secondes'
      });
    });
  });
}

/**
 * Vérifie si un port est ouvert
 */
function checkPort(host, port) {
  return new Promise((resolve) => {
    const net = require('net');
    const socket = new net.Socket();

    socket.setTimeout(3000);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      resolve(false);
    });

    socket.connect(port, host);
  });
}

/**
 * Diagnostic principal
 */
async function runDiagnostic() {
  console.log('\n1️⃣ Détection de l\'adresse IP locale...');
  
  const networkInfo = detectLocalIP();
  if (!networkInfo) {
    console.log('❌ Aucune adresse IP locale détectée');
    return;
  }

  console.log(`✅ IP détectée: ${networkInfo.ip} (${networkInfo.interface})`);

  console.log('\n2️⃣ Vérification du fichier .env...');
  
  const envPath = require('path').join(__dirname, '..', '.env');
  if (!require('fs').existsSync(envPath)) {
    console.log('❌ Fichier .env introuvable');
    return;
  }

  const envContent = require('fs').readFileSync(envPath, 'utf-8');
  const urlMatch = envContent.match(/EXPO_PUBLIC_API_BASE_URL=(.+)/);
  
  if (!urlMatch) {
    console.log('❌ EXPO_PUBLIC_API_BASE_URL non trouvée dans .env');
    return;
  }

  const configuredUrl = urlMatch[1];
  console.log(`📝 URL configurée: ${configuredUrl}`);

  const expectedUrl = `http://${networkInfo.ip}:${BACKEND_PORT}`;
  if (configuredUrl !== expectedUrl) {
    console.log(`⚠️  URL différente de l'IP actuelle: ${expectedUrl}`);
    console.log('💡 Exécutez "npm run update-ip" pour corriger');
  } else {
    console.log('✅ URL cohérente avec l\'IP actuelle');
  }

  console.log('\n3️⃣ Test de connectivité réseau...');

  // Test localhost
  console.log('🔍 Test localhost:3333...');
  const localhostResult = await testHttpConnection(`http://localhost:${BACKEND_PORT}`);
  if (localhostResult.success) {
    console.log('✅ Serveur backend accessible en localhost');
  } else {
    console.log(`❌ Serveur backend inaccessible: ${localhostResult.message}`);
    console.log('💡 Vérifiez que le serveur AdonisJS est démarré');
  }

  // Test IP locale
  console.log(`🔍 Test ${networkInfo.ip}:3333...`);
  const ipResult = await testHttpConnection(`http://${networkInfo.ip}:${BACKEND_PORT}`);
  if (ipResult.success) {
    console.log('✅ Serveur accessible via IP locale');
  } else {
    console.log(`❌ Serveur inaccessible via IP: ${ipResult.message}`);
    console.log('💡 Vérifiez les paramètres firewall');
  }

  // Test port
  console.log(`🔍 Test port ${BACKEND_PORT}...`);
  const portOpen = await checkPort(networkInfo.ip, BACKEND_PORT);
  if (portOpen) {
    console.log('✅ Port accessible');
  } else {
    console.log('❌ Port inaccessible');
  }

  console.log('\n4️⃣ Recommandations...');

  if (!localhostResult.success) {
    console.log('🚨 PROBLÈME PRINCIPAL: Serveur backend non démarré');
    console.log('   → Démarrez le serveur: cd services/tsa-monolith && npm run dev');
  } else if (!ipResult.success) {
    console.log('🚨 PROBLÈME PRINCIPAL: Firewall ou configuration réseau');
    console.log('   → Vérifiez les paramètres firewall Windows');
    console.log('   → Autorisez le port 3333 en entrée');
  } else {
    console.log('✅ Configuration réseau correcte');
    console.log('💡 Si l\'app mobile ne se connecte toujours pas:');
    console.log('   → Vérifiez que le téléphone est sur le même Wi-Fi');
    console.log('   → Redémarrez Expo Go');
    console.log('   → Essayez "expo start --tunnel"');
  }

  console.log('\n📱 URLs de test depuis votre téléphone:');
  console.log(`   → Backend: http://${networkInfo.ip}:${BACKEND_PORT}`);
  console.log(`   → Health check: http://${networkInfo.ip}:${BACKEND_PORT}/api/health`);
  console.log(`   → Expo: exp://${networkInfo.ip}:8081`);

  console.log('\n' + '='.repeat(50));
}

// Exécuter le diagnostic
runDiagnostic().catch(console.error);