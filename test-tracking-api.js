// Script de test pour vérifier l'API de tracking
const fetch = require('node-fetch');

const BACKEND_URL = 'http://localhost:3333';

async function testTrackingAPI() {
  console.log('🧪 Test de l\'API de tracking GPS\n');

  // Test 1: Envoyer une position
  console.log('1️⃣ Test: Envoi d\'une position GPS...');
  try {
    const response = await fetch(`${BACKEND_URL}/api/tracking/update-location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceId: 'test-device-123',
        latitude: 3.8480,
        longitude: 11.5021,
        speed: 25,
        heading: 90,
      }),
    });

    const data = await response.json();
    console.log('   Réponse:', data);

    if (data.success) {
      console.log('   ✅ Position envoyée avec succès!\n');
    } else {
      console.log('   ❌ Échec:', data.message, '\n');
    }
  } catch (error) {
    console.log('   ❌ Erreur réseau:', error.message, '\n');
    return;
  }

  // Test 2: Récupérer toutes les positions
  console.log('2️⃣ Test: Récupération de toutes les positions...');
  try {
    const response = await fetch(`${BACKEND_URL}/api/tracking/locations`);
    const data = await response.json();

    console.log('   Réponse:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log(`   ✅ ${data.data.count} position(s) trouvée(s)!\n`);

      if (data.data.positions.length > 0) {
        console.log('   📍 Positions actives:');
        data.data.positions.forEach((pos, index) => {
          console.log(`      ${index + 1}. Device: ${pos.deviceId}`);
          console.log(`         Position: ${pos.latitude.toFixed(6)}, ${pos.longitude.toFixed(6)}`);
          console.log(`         Timestamp: ${new Date(pos.timestamp).toLocaleString()}`);
          if (pos.speed) {
            console.log(`         Vitesse: ${(pos.speed * 3.6).toFixed(1)} km/h`);
          }
          console.log('');
        });
      }
    } else {
      console.log('   ❌ Échec:', data.message, '\n');
    }
  } catch (error) {
    console.log('   ❌ Erreur réseau:', error.message, '\n');
  }

  // Test 3: Récupérer une position spécifique
  console.log('3️⃣ Test: Récupération d\'une position spécifique...');
  try {
    const response = await fetch(`${BACKEND_URL}/api/tracking/locations/test-device-123`);
    const data = await response.json();

    if (data.success) {
      console.log('   ✅ Position récupérée!');
      console.log('   Device:', data.data.deviceId);
      console.log('   Position:', data.data.latitude.toFixed(6), ',', data.data.longitude.toFixed(6));
      console.log('');
    } else {
      console.log('   ⚠️ ', data.message, '\n');
    }
  } catch (error) {
    console.log('   ❌ Erreur réseau:', error.message, '\n');
  }

  console.log('✅ Tests terminés!');
}

testTrackingAPI();
