import { assert } from '@japa/assert'
import { apiClient } from '@japa/api-client'
import app from '@adonisjs/core/services/app'
import type { Config } from '@japa/runner/types'
import { pluginAdonisJS } from '@japa/plugin-adonisjs'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * This file is imported by the "bin/test.ts" entrypoint file
 */

/**
 * Configure Japa plugins in the plugins array.
 * Learn more - https://japa.dev/docs/runner-config#plugins-optional
 */
export const plugins: Config['plugins'] = [assert(), apiClient(), pluginAdonisJS(app)]

/**
 * Configure lifecycle function to run before and after all the
 * tests.
 *
 * The setup functions are executed before all the tests
 * The teardown functions are executed after all the tests
 */
export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
  setup: [
    async () => {
      console.log('🔧 Running migrations...')
      await testUtils.db().migrate()

      console.log('🌱 Seeding reference data (document_types, etc.)...')
      await testUtils.db().seed()

      console.log('✅ Test database initialized')
    },
  ],
  teardown: [
    async () => {
      console.log('🧹 Cleaning up test database...')
      await testUtils.db().truncate()
    },
  ],
}

/**
 * Configure suites by tapping into the test suite instance.
 * Learn more - https://japa.dev/docs/test-suites#lifecycle-hooks
 */
export const configureSuite: Config['configureSuite'] = (suite) => {
  if (['browser', 'functional', 'e2e'].includes(suite.name)) {
    return suite.setup(() => testUtils.httpServer().start())
    // Pas de truncate ici - on utilise les transactions par test
  }

  // Configuration pour les tests unitaires
  if (suite.name === 'unit') {
    return suite.setup(() => testUtils.httpServer().start())
    // Pas de truncate ici - on utilise les transactions par test
  }
}

/**
 * IMPORTANT: Dans chaque fichier de test, utilisez:
 *
 * group.each.setup(async () => {
 *   await Database.beginGlobalTransaction()
 * })
 *
 * group.each.teardown(async () => {
 *   await Database.rollbackGlobalTransaction()
 * })
 *
 * Cela garantit l'isolation complète entre chaque test.
 */
