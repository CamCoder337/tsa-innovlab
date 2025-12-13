import fs from 'node:fs/promises'
import path from 'node:path'
import { DateTime } from 'luxon'
import User, { UserRole, UserStatus } from '#models/user'
import DocumentType, { DocumentApplicableTo } from '#models/document_type'
import Vehicle from '#models/vehicle'

/**
 * Utilitaires de test pour le système KYC/Documents
 */
export class TestHelpers {
  /**
   * Créer un buffer de fichier factice pour tests d'upload
   */
  static async createFakeFileBuffer(fileName: string): Promise<Buffer> {
    const fixturePath = path.join(process.cwd(), 'tests/fixtures', fileName)
    return await fs.readFile(fixturePath)
  }

  /**
   * Créer un objet MultipartFile factice
   */
  static async createFakeMultipartFile(fileName: string, mimeType: string = 'image/jpeg') {
    const fixturePath = path.join(process.cwd(), 'tests/fixtures', fileName)
    const buffer = await fs.readFile(fixturePath)

    return {
      tmpPath: fixturePath,
      clientName: fileName,
      size: buffer.length,
      type: mimeType,
      subtype: mimeType.split('/')[1],
      extname: fileName.split('.').pop(),
      isValid: true,
      hasErrors: false,
      validated: true,
      errors: [],
      fieldName: 'file',
      meta: {},
    }
  }

  /**
   * Mock AIService pour éviter appels réels au service AI
   */
  static createMockAIService() {
    return {
      extractKYCDocument: async () => {
        return {
          status: 'success',
          confidence_score: 0.95,
          extraction_method: 'mock',
          extraction_cost_usd: 0,
          data: {
            nom: 'DUPONT',
            prenom: 'Jean',
            date_naissance: '1990-01-01',
            numero_cni: 'ABC123456',
            lieu_naissance: 'Douala',
            adresse: '123 Rue Test',
            numero_permis: 'PM123456',
          },
        }
      },
      checkKYCHealth: async () => true,
      getKYCStats: async () => ({
        total_extractions: 0,
        total_cost_usd: 0,
        average_confidence: 0.95,
        success_rate: 1.0,
      }),
    }
  }

  /**
   * Mock EmailService pour éviter envois d'emails réels
   */
  static createMockEmailService() {
    return {
      sendEmail: async () => ({
        success: true,
        messageId: 'mock-message-id',
      }),
      queueEmail: async () => true,
    }
  }

  /**
   * Mock DocumentNotificationService
   */
  static createMockNotificationService() {
    return {
      sendDocumentExpiringNotification: async () => ({
        success: true,
      }),
      sendDocumentExpiredNotification: async () => ({ success: true }),
      sendDocumentValidatedNotification: async () => ({ success: true }),
      sendDocumentRejectedNotification: async () => ({
        success: true,
      }),
      sendKycCompletedNotification: async () => ({ success: true }),
      sendVehicleVerifiedNotification: async () => ({ success: true }),
    }
  }

  /**
   * Créer un utilisateur de test
   */
  static async createTestUser(
    role: UserRole = UserRole.TRANSPORTEUR,
    overrides: Partial<User> = {}
  ): Promise<User> {
    return await User.create({
      email: `test-${Date.now()}-${Math.random()}@example.com`,
      passwordHash: 'hashed-password',
      firstName: 'Test',
      lastName: 'User',
      phone: `+237${Math.floor(Math.random() * 1000000000)}`,
      role,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: DateTime.now(),
      mfaEnabled: false,
      failedLoginAttempts: 0,
      ...overrides,
    })
  }

  /**
   * Créer un type de document de test
   */
  static async createTestDocumentType(
    code: string,
    applicableTo: DocumentApplicableTo,
    requiredForRoles?: string[],
    requiredForVehicleTypes?: string[]
  ): Promise<DocumentType> {
    return await DocumentType.create({
      code,
      labelFr: `Document ${code}`,
      labelEn: `Document ${code}`,
      applicableTo,
      requiredForRoles,
      requiredForVehicleTypes,
      hasExpiration: true,
      defaultValidityDays: 365,
      fileFormatRestrictions: {
        allowed: ['image/jpeg', 'image/png', 'application/pdf'],
        max_size_mb: 10,
      },
      isActive: true,
      displayOrder: 1,
    })
  }

  /**
   * Créer un véhicule de test
   */
  static async createTestVehicle(userId: string, type = 'CAMION'): Promise<Vehicle> {
    return await Vehicle.create({
      userId,
      type: type as any,
      registration: `TEST-${Math.floor(Math.random() * 10000)}`,
    } as any)
  }

  /**
   * Attendre X millisecondes (pour tests asynchrones)
   */
  static async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Générer un token d'accès pour un utilisateur
   */
  static async generateAccessToken(user: User): Promise<string> {
    return await user.generateAccessToken('test-token')
  }
}
