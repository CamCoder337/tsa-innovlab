import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User, { UserRole, UserStatus } from '#models/user'
import env from '#start/env'
import { DateTime } from 'luxon'

export default class DefaultUsersSeeder extends BaseSeeder {
  async run() {
    // Récupérer le mot de passe admin (même password pour tous les users par défaut)
    const defaultPassword = env.get('ADMIN_PASSWORD', 'Admin123!')

    // Liste des utilisateurs par défaut à créer
    const defaultUsers = [
      {
        email: 'affreteur@tsa-logistics.com',
        firstName: 'Jean',
        lastName: 'Affreteur',
        phone: '+237600000001',
        role: UserRole.AFFRETEUR,
      },
      {
        email: 'transporteur@tsa-logistics.com',
        firstName: 'Pierre',
        lastName: 'Transporteur',
        phone: '+237600000002',
        role: UserRole.TRANSPORTEUR,
      },
      {
        email: 'client@tsa-logistics.com',
        firstName: 'Emma',
        lastName: 'Nzui',
        phone: '+237600090002',
        role: UserRole.CLIENT,
      },
    ]

    for (const userData of defaultUsers) {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findBy('email', userData.email)
      if (existingUser) {
        console.log(`✅ User already exists: ${userData.email}`)
        continue
      }

      try {
        // Créer l'utilisateur
        const user = await User.create({
          email: userData.email.toLowerCase(),
          passwordHash: defaultPassword, // Le modèle fait le hashage automatiquement
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          role: userData.role,
          status: UserStatus.ACTIVE,
          emailVerifiedAt: DateTime.now(), // Compte vérifié directement
          mfaEnabled: false, // MFA désactivé par défaut pour affreteur/transporteur
          failedLoginAttempts: 0,
          lastLoginAt: null,
          lockedUntil: null,
        })

        console.log(`✅ ${userData.role} user created successfully: ${user.email}`)
        console.log(`📧 Email: ${user.email}`)
        console.log(`🔑 Password: ${defaultPassword}`)
      } catch (error) {
        console.error(`❌ Error creating ${userData.role} user:`, error.message)
      }
    }
  }
}
