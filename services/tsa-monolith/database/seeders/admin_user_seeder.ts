import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User, { UserRole, UserStatus } from '#models/user'
import env from '#start/env'
import { DateTime } from 'luxon'
import MFAService from '#services/mfa_service'
import EmailService from '#services/email_service'

export default class AdminUserSeeder extends BaseSeeder {
  async run() {
    // Récupérer les variables d'environnement
    const adminEmail = env.get('ADMIN_EMAIL', 'admin@tsa-logistics.com')
    const adminPassword = env.get('ADMIN_PASSWORD', 'Admin123!')

    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findBy('email', adminEmail)
    if (existingAdmin) {
      console.log(`✅ Admin user already exists: ${adminEmail}`)
      return
    }

    // Créer l'utilisateur admin directement (plus simple pour les seeders)
    try {
      const adminUser = await User.create({
        email: adminEmail.toLowerCase(),
        passwordHash: adminPassword, // Le modèle fait le hashage automatiquement
        firstName: 'Administrator',
        lastName: 'System',
        phone: '+237600000000',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: DateTime.now(), // Compte vérifié directement
        mfaEnabled: false,
        failedLoginAttempts: 0,
        lastLoginAt: null,
        lockedUntil: null,
      })

      // Générer MFA secret et codes de récupération
      const mfaService = new MFAService()
      const mfaData = await mfaService.generateSecret(adminUser)

      // Activer MFA pour l'admin
      adminUser.mfaEnabled = true
      await adminUser.save()

      // Envoyer l'email avec les informations MFA
      const resendServiceModule = await import('#services/resend_service')
      const ResendService = resendServiceModule.default
      const resendService = new ResendService()
      const emailService = new EmailService(resendService)
      await emailService.sendAdminMFASetupEmail(
        adminUser,
        mfaData.manualEntryKey,
        mfaData.recoveryCodes,
        `TSA Admin (${adminUser.email})`,
        'TSA Logistics'
      )

      console.log(`✅ Admin user created successfully: ${adminUser.email}`)
      console.log(`📧 Email: ${adminUser.email}`)
      console.log(`🔑 Password: ${adminPassword}`)
      console.log(`📧 MFA setup email sent with secret key and recovery codes`)
      console.log(`🔐 Manual Entry Key: ${mfaData.manualEntryKey}`)
      console.log(`🔓 Recovery Codes: ${mfaData.recoveryCodes.join(', ')}`)
    } catch (error) {
      console.error('❌ Error creating admin user:', error.message)
    }
  }
}
