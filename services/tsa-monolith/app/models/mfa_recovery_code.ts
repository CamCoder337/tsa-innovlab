import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import User from './user.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { createHash, randomBytes } from 'node:crypto'

export default class MfaRecoveryCode extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  @column()
  declare codeHash: string

  @column.dateTime()
  declare usedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  static async generateCodesFor(user: User, count: number = 10, trx?: any) {
    const plainCodes: string[] = []

    const codes = Array.from({ length: count }, () => {
      const plain = randomBytes(8).toString('hex') // ex: 'a3f9c4d8e1b2f0aa'
      plainCodes.push(plain)

      return {
        userId: user.id,
        codeHash: this.hashCode(plain),
      }
    })

    await this.createMany(codes, trx ? { client: trx } : undefined)

    return plainCodes
  }

  async verify(plainCode: string): Promise<boolean> {
    return this.codeHash === MfaRecoveryCode.hashCode(plainCode)
  }

  async markAsUsed() {
    this.usedAt = DateTime.now()
    await this.save()
  }

  /**
   * Hash utilitaire
   */
  private static hashCode(code: string): string {
    return createHash('sha256').update(code).digest('hex')
  }
}
