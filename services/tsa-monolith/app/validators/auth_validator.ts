import vine from '@vinejs/vine'
import { UserRole } from '#models/user'

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail().maxLength(255),

    password: vine.string().minLength(8).maxLength(255),

    mfaCode: vine.string().optional(),
  })
)

export const registerValidator = vine.compile(
  vine.object({
    email: vine
      .string()
      .email()
      .normalizeEmail()
      .maxLength(255)
      .unique(async (db, value) => {
        const user = await db.from('users').where('email', value).first()
        return !user
      }),

    password: vine.string().minLength(8).maxLength(255),

    firstName: vine.string().trim().minLength(2).maxLength(100).optional(),

    lastName: vine.string().trim().minLength(2).maxLength(100).optional(),

    phone: vine.string().mobile().optional(),

    role: vine.enum(Object.values(UserRole)),
  })
)

export const forgotPasswordValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail().maxLength(255),
  })
)

export const resetPasswordValidator = vine.compile(
  vine.object({
    token: vine.string().fixedLength(32).alphaNumeric(),

    password: vine
      .string()
      .minLength(8)
      .maxLength(255)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .confirmed(),
  })
)

export const refreshTokenValidator = vine.compile(
  vine.object({
    refreshToken: vine.string().fixedLength(64).alphaNumeric(),
  })
)

export const enableMFAValidator = vine.compile(
  vine.object({
    code: vine.string(),
  })
)

export const verifyMFAValidator = vine.compile(
  vine.object({
    code: vine.string(),
  })
)

export const mfaRecoveryCodeValidator = vine.compile(
  vine.object({
    recoveryCode: vine.string().fixedLength(16).alphaNumeric(),
  })
)

export const changePasswordValidator = vine.compile(
  vine.object({
    currentPassword: vine.string().minLength(8).maxLength(255),

    newPassword: vine
      .string()
      .minLength(8)
      .maxLength(255)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .confirmed(),
  })
)

export const updateProfileValidator = vine.compile(
  vine.object({
    firstName: vine.string().trim().minLength(2).maxLength(100).optional(),

    lastName: vine.string().trim().minLength(2).maxLength(100).optional(),

    phone: vine.string().mobile().optional(),
  })
)
