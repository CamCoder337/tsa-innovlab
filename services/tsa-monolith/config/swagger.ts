import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default {
  path: join(__dirname, '../'), // Chemin racine pour chercher les fichiers
  title: 'TSA Logistics API',
  version: '1.0.0',
  tagIndex: 3,
  info: {
    title: 'TSA Logistics API',
    version: '1.0.0',
    description: 'API de la plateforme de logistique TSA Contest 2025 - Uber pour la logistique',
    contact: {
      name: 'TSA InnovLab',
      email: 'support@tsa-logistics.com'
    }
  },
  snakeCase: true,
  debug: false, // Mettre à true en développement
  ignore: ['**/node_modules/**'],
  preferredPutPatch: 'PUT',
  common: {
    parameters: {},
    headers: {}
  },
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT'
    }
  },
  authMiddlewares: ['auth', 'role'],
  defaultSecurity: 'bearerAuth',
  persistAuthorization: true,
  showFullPath: false
}
