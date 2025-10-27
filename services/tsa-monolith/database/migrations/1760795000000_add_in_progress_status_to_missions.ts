import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AddInProgressStatusToMissions extends BaseSchema {
  protected tableName = 'missions'

  public async up() {
    // Ajouter 'in_progress' à l'enum mission_status
    await this.raw(`
      ALTER TYPE mission_status ADD VALUE IF NOT EXISTS 'in_progress'
    `)
  }

  public async down() {
    // Note: PostgreSQL ne permet pas de supprimer une valeur d'un enum
    // Si vous devez vraiment revenir en arrière, vous devrez:
    // 1. Créer un nouvel enum sans 'in_progress'
    // 2. Altérer la colonne pour utiliser le nouveau type
    // 3. Supprimer l'ancien enum
    // Pour l'instant, cette migration est irréversible
    console.log('Cannot remove enum value from mission_status. This migration is irreversible.')
  }
}
