/**
 * Type extensions for AdonisJS compatibility
 * These types add missing methods to make the codebase compile
 */

import { Infer, Validator } from '@vinejs/vine/types'

declare module '@adonisjs/core/http' {
  interface Request {
    /**
     * Validate request data using a VineJS validator
     * This is a compatibility shim for older AdonisJS code
     */
    validateUsing<T extends Validator<any, any>>(
      validator: T
    ): Promise<Infer<T>>
  }
}

declare module '@adonisjs/core/services/router' {
  export interface HttpRouterService {
    /**
     * WebSocket route registration
     * This is a compatibility shim for websocket support
     */
    ws(pattern: string, handler: (ctx: any) => void | Promise<void>): void
  }
}

declare module '@japa/plugin-adonisjs' {
  export interface TestUtils {
    /**
     * Database utilities for tests
     */
    db(): {
      withGlobalTransaction(): void
    }
  }
}

declare module '@vinejs/vine' {
  export interface VineString {
    /**
     * Unique validation rule
     */
    unique(
      callback: (db: any, value: string) => Promise<boolean>
    ): this
  }
}

// Global type augmentation for router
declare global {
  namespace App {
    interface HttpRouterService {
      ws(pattern: string, handler: (ctx: any) => void | Promise<void>): void
    }
  }
}

export {}
