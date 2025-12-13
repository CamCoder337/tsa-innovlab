import emitter from '@adonisjs/core/services/emitter'
const MissionListener = () => import('#listeners/mission_listener')
const SosListener = () => import('#listeners/sos_listener')

console.log('🔔 Registering event listeners...')

// Écouteur pour les mises à jour de localisation des missions
emitter.on('mission:location_update', [MissionListener, 'onLocationUpdate'])

// Écouteurs pour les alertes SOS / Urgences
emitter.on('mission:sos_alert', [SosListener, 'onSosAlert'])
emitter.on('mission:sos_acknowledged', [SosListener, 'onSosAcknowledged'])
emitter.on('mission:sos_resolved', [SosListener, 'onSosResolved'])

console.log('✅ Event listeners registered successfully (Mission + SOS)')
