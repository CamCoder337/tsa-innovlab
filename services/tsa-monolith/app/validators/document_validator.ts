import vine from '@vinejs/vine'

/**
 * Validateur pour l'upload d'un document
 */
export const uploadDocumentValidator = vine.compile(
  vine.object({
    documentTypeId: vine.string().uuid({ version: [4] }),
    vehicleId: vine
      .string()
      .uuid({ version: [4] })
      .optional()
      .nullable(),
    fileUrl: vine.string().url(),
    fileName: vine.string().maxLength(500),
    fileSizeBytes: vine.number().positive(),
    mimeType: vine.string().maxLength(100),
    issueDate: vine.date().optional().nullable(),
    expirationDate: vine.date().optional().nullable(),
    metadata: vine.record(vine.any()).optional(),
  })
)

/**
 * Validateur pour la validation d'un document par un admin
 */
export const validateDocumentValidator = vine.compile(
  vine.object({
    notes: vine.string().maxLength(1000).optional(),
  })
)

/**
 * Validateur pour le rejet d'un document par un admin
 */
export const rejectDocumentValidator = vine.compile(
  vine.object({
    reason: vine.string().minLength(10).maxLength(1000),
  })
)

/**
 * Validateur pour la mise à jour des métadonnées d'un document
 */
export const updateDocumentValidator = vine.compile(
  vine.object({
    metadata: vine.record(vine.any()).optional(),
    issueDate: vine.date().optional().nullable(),
    expirationDate: vine.date().optional().nullable(),
  })
)

/**
 * Validateur pour les filtres de recherche de documents
 */
export const searchDocumentsValidator = vine.compile(
  vine.object({
    status: vine.enum(['pending', 'validated', 'rejected', 'expired', 'replaced']).optional(),
    documentTypeId: vine.string().uuid({ version: [4] }).optional(),
    userId: vine.string().uuid({ version: [4] }).optional(),
    vehicleId: vine.string().uuid({ version: [4] }).optional(),
    page: vine.number().positive().optional(),
    limit: vine.number().positive().max(100).optional(),
  })
)
