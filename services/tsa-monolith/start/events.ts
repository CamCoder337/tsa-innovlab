import emitter from '@adonisjs/core/services/emitter'
const MissionListener = () => import('#listeners/mission_listener')

console.log('🔔 Registering mission event listeners...')

// Écouteur pour les mises à jour de localisation des missions
emitter.on('mission:location_update', [MissionListener, 'onLocationUpdate'])

console.log('✅ Mission event listeners registered successfully')
