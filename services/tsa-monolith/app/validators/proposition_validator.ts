import vine from '@vinejs/vine'

const createPropositionSchema = vine.object({
  prixPropose: vine.number().min(1000).max(10000000), // Entre 1000 et 10M FCFA
  delaiPropose: vine.number().min(1).max(240), // Entre 1h et 240h (10 jours)
  commentaire: vine.string().trim().maxLength(1000).optional(),
})

const propositionQuerySchema = vine.object({
  page: vine.number().min(1).optional(),
  limit: vine.number().min(1).max(100).optional(),
  status: vine.enum(['pending', 'accepted', 'rejected']).optional(),
  search: vine.string().trim().maxLength(255).optional(),
  missionId: vine.string().uuid().optional(),
  sortBy: vine.enum(['created_at', 'prix_propose', 'delai_propose']).optional(),
  sortOrder: vine.enum(['asc', 'desc']).optional(),
})

const updatePropositionStatusSchema = vine.object({
  status: vine.enum(['accepted', 'rejected']),
  commentaire: vine.string().trim().maxLength(500).optional(),
})

const propositionActionSchema = vine.object({
  commentaire: vine.string().trim().maxLength(500).optional(),
})

// Validateur pour localisation GPS
const locationUpdateSchema = vine.object({
  latitude: vine.number().min(-90).max(90),
  longitude: vine.number().min(-180).max(180),
  timestamp: vine.date({ formats: ['ISO'] }).optional(),
})

// Validateur pour preuve de livraison
const deliveryProofSchema = vine.object({
  proofType: vine.enum([
    'delivery_signature',
    'photo_delivery',
    'recipient_confirmation',
    'damage_report',
  ]),
  description: vine.string().trim().minLength(10).maxLength(500),
  imageUrl: vine.string().url().maxLength(500).optional(),
})

export const createPropositionValidator = vine.compile(createPropositionSchema)
export const propositionQueryValidator = vine.compile(propositionQuerySchema)
export const updatePropositionStatusValidator = vine.compile(updatePropositionStatusSchema)
export const propositionActionValidator = vine.compile(propositionActionSchema)
export const locationUpdateValidator = vine.compile(locationUpdateSchema)
export const deliveryProofValidator = vine.compile(deliveryProofSchema)
