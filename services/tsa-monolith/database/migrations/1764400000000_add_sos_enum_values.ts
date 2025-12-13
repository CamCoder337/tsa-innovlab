import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Ajouter les nouveaux types d'urgence SOS à l'enum issue_type
    await this.raw(`
      ALTER TYPE issue_type ADD VALUE IF NOT EXISTS 'medical';
    `)
    await this.raw(`
      ALTER TYPE issue_type ADD VALUE IF NOT EXISTS 'security';
    `)

    // Ajouter le statut 'in_progress' à l'enum issue_status
    await this.raw(`
      ALTER TYPE issue_status ADD VALUE IF NOT EXISTS 'in_progress' AFTER 'acknowledged';
    `)
  }

  async down() {
    // Note: PostgreSQL ne permet pas de supprimer des valeurs d'enum facilement
    // Cette migration est irréversible pour les enums
    // Si nécessaire, il faudrait recréer l'enum entièrement
    console.log('Warning: Enum values cannot be removed in PostgreSQL without recreating the type')
  }
}
