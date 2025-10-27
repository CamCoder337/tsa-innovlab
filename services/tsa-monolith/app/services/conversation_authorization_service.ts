import User, { UserRole } from '#models/user'
import Mission from '#models/mission'

/**
 * Service de validation des autorisations de conversations
 * Implémente les règles métier pour les conversations entre utilisateurs
 */
export class ConversationAuthorizationService {
  /**
   * Vérifie si deux utilisateurs peuvent engager une conversation directe
   *
   * Règles métier :
   * - Admin ↔ Affreteur : ✅ Autorisé
   * - Admin ↔ Transporteur : ✅ Autorisé
   * - Affreteur ↔ Transporteur : ❌ Non autorisé (doit passer par une mission)
   * - Même rôle : ✅ Autorisé (ex: admin avec admin)
   *
   * @param user1 Premier utilisateur
   * @param user2 Deuxième utilisateur
   * @returns true si la conversation est autorisée
   */
  public static canConverseDirect(user1: User, user2: User): boolean {
    const role1 = user1.role
    const role2 = user2.role

    // Admin peut parler à tout le monde
    if (role1 === UserRole.ADMIN || role2 === UserRole.ADMIN) {
      return true
    }

    // Même rôle : autorisé
    if (role1 === role2) {
      return true
    }

    // Affreteur ↔ Transporteur : interdit (doit passer par mission)
    if (
      (role1 === UserRole.AFFRETEUR && role2 === UserRole.TRANSPORTEUR) ||
      (role1 === UserRole.TRANSPORTEUR && role2 === UserRole.AFFRETEUR)
    ) {
      return false
    }

    // Par défaut, autoriser
    return true
  }

  /**
   * Vérifie si deux utilisateurs peuvent engager une conversation liée à une mission
   *
   * Règles métier :
   * - Admin : ✅ Peut toujours créer des conversations mission
   * - Affreteur : ✅ Peut créer conversation si c'est SA mission
   * - Transporteur : ✅ Peut créer conversation si assigné à la mission
   * - Les deux participants doivent être liés à la mission
   *
   * @param user1 Premier utilisateur
   * @param user2 Deuxième utilisateur
   * @param mission Mission liée à la conversation
   * @returns true si la conversation mission est autorisée
   */
  public static async canConverseMission(
    user1: User,
    user2: User,
    mission: Mission
  ): Promise<{
    authorized: boolean
    reason?: string
  }> {
    // Admin peut toujours créer des conversations mission
    if (user1.role === UserRole.ADMIN || user2.role === UserRole.ADMIN) {
      return { authorized: true }
    }

    // Vérifier que les utilisateurs sont liés à la mission
    const user1IsAffreteur = mission.affreteurId === user1.id
    const user2IsAffreteur = mission.affreteurId === user2.id
    const user1IsTransporteur = mission.transporteurId === user1.id
    const user2IsTransporteur = mission.transporteurId === user2.id

    const user1IsLinked = user1IsAffreteur || user1IsTransporteur
    const user2IsLinked = user2IsAffreteur || user2IsTransporteur

    // Les deux utilisateurs doivent être liés à la mission
    if (!user1IsLinked) {
      return {
        authorized: false,
        reason: `${user1.firstName} ${user1.lastName} n'est pas lié à cette mission`,
      }
    }

    if (!user2IsLinked) {
      return {
        authorized: false,
        reason: `${user2.firstName} ${user2.lastName} n'est pas lié à cette mission`,
      }
    }

    // Vérifier qu'ils ont des rôles différents (affreteur-transporteur)
    const isAffreteurTransporteurPair =
      (user1IsAffreteur && user2IsTransporteur) || (user1IsTransporteur && user2IsAffreteur)

    if (!isAffreteurTransporteurPair) {
      return {
        authorized: false,
        reason: 'Les conversations mission doivent être entre affreteur et transporteur',
      }
    }

    return { authorized: true }
  }

  /**
   * Obtient un message d'erreur explicite pour une conversation non autorisée
   *
   * @param user1 Premier utilisateur
   * @param user2 Deuxième utilisateur
   * @returns Message d'erreur explicatif
   */
  public static getDirectConversationDenialReason(user1: User, user2: User): string {
    const role1 = user1.role
    const role2 = user2.role

    // Cas spécifique : Affreteur ↔ Transporteur
    if (
      (role1 === UserRole.AFFRETEUR && role2 === UserRole.TRANSPORTEUR) ||
      (role1 === UserRole.TRANSPORTEUR && role2 === UserRole.AFFRETEUR)
    ) {
      return 'Les conversations directes entre affreteurs et transporteurs ne sont pas autorisées. Veuillez créer une conversation liée à une mission spécifique.'
    }

    return "Cette conversation n'est pas autorisée"
  }

  /**
   * Vérifie si un utilisateur peut accéder à une conversation existante
   *
   * @param userId ID de l'utilisateur
   * @param participantIds IDs des participants de la conversation
   * @returns true si l'utilisateur peut accéder à la conversation
   */
  public static canAccessConversation(userId: string, participantIds: string[]): boolean {
    return participantIds.includes(userId)
  }
}

export default ConversationAuthorizationService
