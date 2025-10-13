#!/usr/bin/env node

/**
 * Script de test pour le système de notifications SSE
 * Usage: node test_notifications_sse.mjs <transporteur_email> <transporteur_password>
 */

import { Transmit } from '@adonisjs/transmit-client'

const API_BASE = 'http://localhost:3333'

// Couleurs console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
}

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  notification: (msg) => console.log(`${colors.magenta}🔔 ${msg}${colors.reset}`),
}

async function login(email, password) {
  log.info(`Connexion en tant que ${email}...`)
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = await response.json()
  if (!data.success) {
    throw new Error(data.message || 'Login failed')
  }

  log.success(
    `Connecté: ${data.data.user.firstName} ${data.data.user.lastName} (${data.data.user.role})`
  )
  return {
    token: data.data.token,
    user: data.data.user,
  }
}

async function listenNotifications(userId, token) {
  log.info(`Écoute des notifications pour user ${userId}...`)

  const transmit = new Transmit({
    baseUrl: API_BASE,
    uidGenerator: () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    onAuthorize: async (request) => {
      request.url += (request.url.includes('?') ? '&' : '?') + `token=${encodeURIComponent(token)}`
      return request
    },
  })

  const channel = `notifications:user:${userId}`
  const subscription = transmit.subscription(channel)

  try {
    await subscription.create()
    log.success(`📡 Abonné au canal: ${channel}`)

    subscription.onMessage((data) => {
      log.notification('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      log.notification(`Notification reçue: ${data.title || data.type}`)
      console.log(JSON.stringify(data, null, 2))
      log.notification('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    })

    log.info('⏳ En attente de notifications... (Ctrl+C pour quitter)')
    log.info('')
    log.warning('Pour tester:')
    log.warning('1. Publiez une nouvelle mission (affreteur)')
    log.warning('2. Assignez une mission à ce transporteur (admin)')
    log.warning("3. Changez le statut d'une mission (admin)")
    log.info('')

    // Garder le script en vie
    await new Promise(() => {})
  } catch (error) {
    log.error(`Erreur Transmit: ${error.message}`)
    throw error
  }
}

async function main() {
  const email = process.argv[2] || 'transporteur@example.com'
  const password = process.argv[3] || 'password123'

  try {
    console.log('')
    log.info('🚀 Test du système de notifications SSE')
    log.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')

    const { token, user } = await login(email, password)

    if (user.role !== 'transporteur') {
      log.warning(
        `Utilisateur ${user.role} - les notifications de missions sont pour les transporteurs`
      )
    }

    await listenNotifications(user.id, token)
  } catch (error) {
    log.error(`Erreur: ${error.message}`)
    process.exit(1)
  }
}

main()
