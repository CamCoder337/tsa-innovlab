import { defineConfig } from '@adonisjs/cors'

/**
 * Configuration options to tweak the CORS policy. The following
 * options are documented on the official documentation website.
 *
 * https://docs.adonisjs.com/guides/security/cors
 */

//TODO (camcoder): Improve CORS security by restraining some domains and applying permissions
const corsConfig = defineConfig({
  enabled: true,
  origin: true, // Autoriser toutes les origines
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  headers: [
    'Content-Type',
    'Authorization',
    'X-Tracking-Token',
    'X-Tracking-Pin',
    'X-Requested-With',
  ],
  exposeHeaders: [],
  credentials: true,
  maxAge: 90,
})

export default corsConfig
