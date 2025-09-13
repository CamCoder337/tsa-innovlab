import env from '#start/env'

export default class EmailFilterService {
  /**
   * Liste des domaines/emails de test à ignorer
   */
  private static testEmailPatterns = [
    '@test.com',
    '@example.com',
    '@localhost',
    'admin@test',
    'user@test',
    'duplicate@test',
  ]

  /**
   * Liste blanche des emails autorisés même en test
   */
  private static allowedEmails = [
    env.get('ADMIN_EMAIL', ''),
    env.get('MAIL_FROM', ''),
    'fredtchiadeu@gmail.com',
    'camcoder337@gmail.com',
  ].filter(Boolean)

  /**
   * Vérifie si un email doit être ignoré
   */
  static shouldIgnoreEmail(email: string): boolean {
    return this.isTestEmail(email) && !this.allowedEmails.includes(email)
  }

  /**
   * Vérifie si un email est une adresse de test
   */
  private static isTestEmail(email: string): boolean {
    const lowerEmail = email.toLowerCase()
    return this.testEmailPatterns.some((pattern) => lowerEmail.includes(pattern))
  }
}
