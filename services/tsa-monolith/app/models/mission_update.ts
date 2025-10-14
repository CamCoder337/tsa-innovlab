import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Mission from './mission.js'
import User from './user.js'

export enum MissionUpdateType {
  STATUS_CHANGE = 'status_change', // Changement de statut
  LOCATION_UPDATE = 'location_update', // Mise à jour géolocalisation
  PROOF_UPLOAD = 'proof_upload', // Upload preuve de livraison
  NOTE = 'note', // Note du transporteur
  ISSUE = 'issue', // Problème signalé
}

export default class MissionUpdate extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare missionId: string

  @column()
  declare transporteurId: string

  @column()
  declare type: MissionUpdateType

  @column()
  declare title: string

  @column()
  declare description: string

  @column()
  declare oldStatus: string | null

  @column()
  declare newStatus: string | null

  @column()
  declare latitude: number | null

  @column()
  declare longitude: number | null

  @column()
  declare address: string | null

  @column()
  declare attachments: string[] | null

  @column()
  declare isPublic: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => Mission)
  declare mission: BelongsTo<typeof Mission>

  @belongsTo(() => User, {
    foreignKey: 'transporteurId',
  })
  declare transporteur: BelongsTo<typeof User>

  // Helpers
  public get hasLocation(): boolean {
    return !!(this.latitude && this.longitude)
  }

  public get hasAttachments(): boolean {
    return !!(this.attachments && this.attachments.length > 0)
  }

  // Factory methods
  public static async createStatusUpdate(
    missionId: string,
    transporteurId: string,
    oldStatus: string,
    newStatus: string,
    description: string = ''
  ): Promise<MissionUpdate> {
    return await MissionUpdate.create({
      missionId,
      transporteurId,
      type: MissionUpdateType.STATUS_CHANGE,
      title: `Statut changé: ${oldStatus} → ${newStatus}`,
      description,
      oldStatus,
      newStatus,
      isPublic: true,
    })
  }

  public static async createLocationUpdate(
    missionId: string,
    transporteurId: string,
    latitude: number,
    longitude: number,
    address?: string
  ): Promise<MissionUpdate> {
    return await MissionUpdate.create({
      missionId,
      transporteurId,
      type: MissionUpdateType.LOCATION_UPDATE,
      title: 'Position mise à jour',
      description: address || `Position: ${latitude}, ${longitude}`,
      latitude,
      longitude,
      address,
      isPublic: true,
    })
  }

  public static async createProofUpload(
    missionId: string,
    transporteurId: string,
    attachments: string[],
    description: string = 'Preuve de livraison uploadée'
  ): Promise<MissionUpdate> {
    return await MissionUpdate.create({
      missionId,
      transporteurId,
      type: MissionUpdateType.PROOF_UPLOAD,
      title: 'Preuve de livraison',
      description,
      attachments,
      isPublic: true,
    })
  }

  // Serializer pour l'API
  public serialize() {
    return {
      id: this.id,
      missionId: this.missionId,
      transporteurId: this.transporteurId,
      type: this.type,
      title: this.title,
      description: this.description,
      oldStatus: this.oldStatus,
      newStatus: this.newStatus,
      location: this.hasLocation
        ? {
            latitude: this.latitude,
            longitude: this.longitude,
            address: this.address,
          }
        : null,
      attachments: this.attachments,
      isPublic: this.isPublic,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
