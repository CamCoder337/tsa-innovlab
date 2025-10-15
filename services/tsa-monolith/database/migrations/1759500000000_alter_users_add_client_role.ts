import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AlterUsersAddClientRole extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    // Ajouter 'client' au type enum user_role
    this.schema.raw("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'client'")
  }

  public async down() {
    // PostgreSQL ne permet pas de supprimer une valeur d'un enum directement
    // On doit recréer l'enum complet, ce qui nécessite de supprimer et recréer la colonne
    // Pour cette migration, on laisse le down vide car c'est une opération complexe
    // et peu probable d'être utilisée en production
    this.schema.raw('-- Cannot easily remove enum value in PostgreSQL')
  }
}
