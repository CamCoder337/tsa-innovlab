import vine from '@vinejs/vine'

const createMissionSchema = vine.object({
  title: vine.string().trim().minLength(5).maxLength(255),
  description: vine.string().trim().optional(),
  typeMarchandise: vine.string().trim().maxLength(100).optional(),
  poids: vine.number().min(0).optional(),
  volume: vine.number().min(0).optional(),
  dateDepartEstime: vine
    .date({ formats: ['YYYY-MM-DDTHH:mm:ss', 'YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD'] })
    .optional(),
  dateArriveePrevue: vine
    .date({ formats: ['YYYY-MM-DDTHH:mm:ss', 'YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD'] })
    .optional(),
  budgetMin: vine.number().min(0).optional(),
  budgetMax: vine.number().min(0).optional(),

  // Adresses - données complètes ou IDs existants
  adresseDepart: vine
    .object({
      id: vine.string().uuid().optional(),
      street: vine.string().trim().optional(),
      city: vine.string().trim().optional(),
      region: vine.string().trim().optional(),
      country: vine.string().trim().optional(),
      postalCode: vine.string().trim().optional(),
      latitude: vine.number().optional(),
      longitude: vine.number().optional(),
      label: vine.string().trim().optional(),
    })
    .optional(),

  adresseArrivee: vine
    .object({
      id: vine.string().uuid().optional(),
      street: vine.string().trim().optional(),
      city: vine.string().trim().optional(),
      region: vine.string().trim().optional(),
      country: vine.string().trim().optional(),
      postalCode: vine.string().trim().optional(),
      latitude: vine.number().optional(),
      longitude: vine.number().optional(),
      label: vine.string().trim().optional(),
    })
    .optional(),

  affreteurId: vine.string().uuid().optional(), // Pour les admins
})

const updateMissionSchema = vine.object({
  title: vine.string().trim().minLength(5).maxLength(255).optional(),
  description: vine.string().trim().optional(),
  typeMarchandise: vine.string().trim().maxLength(100).optional(),
  poids: vine.number().min(0).optional(),
  volume: vine.number().min(0).optional(),
  dateDepartEstime: vine
    .date({ formats: ['YYYY-MM-DDTHH:mm:ss', 'YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD'] })
    .optional(),
  dateArriveePrevue: vine
    .date({ formats: ['YYYY-MM-DDTHH:mm:ss', 'YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD'] })
    .optional(),
  budgetMin: vine.number().min(0).optional(),
  budgetMax: vine.number().min(0).optional(),
  status: vine.enum(['draft', 'published', 'assigned', 'completed', 'cancelled']).optional(),

  // Adresses pour mise à jour
  adresseDepart: vine
    .object({
      id: vine.string().uuid().optional(),
      street: vine.string().trim().optional(),
      city: vine.string().trim().optional(),
      region: vine.string().trim().optional(),
      country: vine.string().trim().optional(),
      postalCode: vine.string().trim().optional(),
      latitude: vine.number().optional(),
      longitude: vine.number().optional(),
      label: vine.string().trim().optional(),
    })
    .optional(),

  adresseArrivee: vine
    .object({
      id: vine.string().uuid().optional(),
      street: vine.string().trim().optional(),
      city: vine.string().trim().optional(),
      region: vine.string().trim().optional(),
      country: vine.string().trim().optional(),
      postalCode: vine.string().trim().optional(),
      latitude: vine.number().optional(),
      longitude: vine.number().optional(),
      label: vine.string().trim().optional(),
    })
    .optional(),

  affreteurId: vine.string().uuid().optional(), // Pour les admins
})

const updateStatusSchema = vine.object({
  status: vine.enum(['draft', 'published', 'assigned', 'completed', 'cancelled']),
  commentaire: vine.string().trim().maxLength(500).optional(),
  transporteurId: vine.string().uuid().optional(), // Pour assigner un transporteur
})

const missionQuerySchema = vine.object({
  page: vine.number().min(1).optional(),
  limit: vine.number().min(1).max(100).optional(),
  status: vine.enum(['draft', 'published', 'assigned', 'completed', 'cancelled']).optional(),
  search: vine.string().trim().maxLength(255).optional(),
  sortBy: vine.enum(['created_at', 'updated_at', 'title', 'budget_min', 'budget_max']).optional(),
  sortOrder: vine.enum(['asc', 'desc']).optional(),
  city: vine.string().trim().optional(),
  budgetMin: vine.number().min(0).optional(),
  budgetMax: vine.number().min(0).optional(),
  typeMarchandise: vine.string().trim().optional(),
})

export const createMissionValidator = vine.compile(createMissionSchema)
export const updateMissionValidator = vine.compile(updateMissionSchema)
export const updateStatusValidator = vine.compile(updateStatusSchema)
export const missionQueryValidator = vine.compile(missionQuerySchema)
