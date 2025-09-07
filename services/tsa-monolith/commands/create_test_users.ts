import { BaseCommand } from '@adonisjs/core/ace'
import { UserRole, UserStatus } from '#models/user'
import { DateTime } from 'luxon'

export default class CreateTestUsers extends BaseCommand {
  static commandName = 'test:users'
  static description = 'Crée les utilisateurs de test pour Postman'

  async run() {
    this.logger.info('🧪 Création des utilisateurs de test...')

    const testUsers = [
      {
        email: 'admin@tsa-logistics.com',
        password: 'Admin123!',
        firstName: 'Admin',
        lastName: 'TSA',
        phone: '+33612345678',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
      {
        email: 'transporteur@tsa-logistics.com',
        password: 'Transport123!',
        firstName: 'Jean',
        lastName: 'Transporteur',
        phone: '+33612345679',
        role: UserRole.TRANSPORTEUR,
        status: UserStatus.ACTIVE,
      },
      {
        email: 'affreteur@tsa-logistics.com',
        password: 'Affret123!',
        firstName: 'Marie',
        lastName: 'Affreteur',
        phone: '+33612345680',
        role: UserRole.AFFRETEUR,
        status: UserStatus.ACTIVE,
      },
    ]

    for (const userData of testUsers) {
      try {
        // Import dynamique pour éviter les problèmes de contexte
        const { default: User } = await import('#models/user')

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findBy('email', userData.email)
        if (existingUser) {
          this.logger.info(`⚠️  Utilisateur ${userData.email} existe déjà, suppression...`)
          await existingUser.delete()
        }

        // Créer l'utilisateur
        const user = await User.create({
          ...userData,
          passwordHash: userData.password,
          emailVerifiedAt: DateTime.now(), // Marquer comme vérifié pour les tests
        })

        this.logger.info(`✅ Utilisateur créé: ${user.email} (${user.role}) - ID: ${user.id}`)
      } catch (error) {
        this.logger.error(`❌ Erreur création ${userData.email}: ${error.message}`)
        this.logger.error(`Stack: ${error.stack}`)
      }
    }

    this.logger.info('🎉 Création des utilisateurs de test terminée !')
    this.logger.info('')
    this.logger.info('📊 Utilisateurs créés:')
    this.logger.info('  👑 Admin: admin@tsa-logistics.com / Admin123!')
    this.logger.info('  🚛 Transporteur: transporteur@tsa-logistics.com / Transport123!')
    this.logger.info('  📦 Affreteur: affreteur@tsa-logistics.com / Affret123!')
    this.logger.info('')
    this.logger.info('🚀 Vous pouvez maintenant tester avec Postman !')
  }
}
