// app/types/email.ts

export interface EmailData {
  /** Destinataire */
  to: string

  /** Sujet de l’email */
  subject: string

  /** Template Edge à utiliser (chemin relatif dans resources/views/emails) */
  template: string

  /** Données à passer au template */
  data: Record<string, any>

  /** Optionnel : expéditeur personnalisé */
  from?: string

  /** Priorité de traitement dans la queue */
  priority?: 'high' | 'normal' | 'low'

  /** Timestamp de création */
  createdAt?: string
}
