/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as categories from '../categories.js'
import type * as crons from '../crons.js'
import type * as notifications from '../notifications.js'
import type * as products from '../products.js'
import type * as sets from '../sets.js'
import type * as trackedProducts from '../trackedProducts.js'

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from 'convex/server'

declare const fullApi: ApiFromModules<{
  categories: typeof categories
  crons: typeof crons
  notifications: typeof notifications
  products: typeof products
  sets: typeof sets
  trackedProducts: typeof trackedProducts
}>

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, 'public'>
>

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, 'internal'>
>

export declare const components: {
  actionCache: {
    crons: {
      purge: FunctionReference<
        'mutation',
        'internal',
        { expiresAt?: number },
        null
      >
    }
    lib: {
      get: FunctionReference<
        'query',
        'internal',
        { args: any; name: string; ttl: number | null },
        { kind: 'hit'; value: any } | { expiredEntry?: string; kind: 'miss' }
      >
      put: FunctionReference<
        'mutation',
        'internal',
        {
          args: any
          expiredEntry?: string
          name: string
          ttl: number | null
          value: any
        },
        { cacheHit: boolean; deletedExpiredEntry: boolean }
      >
      remove: FunctionReference<
        'mutation',
        'internal',
        { args: any; name: string },
        null
      >
      removeAll: FunctionReference<
        'mutation',
        'internal',
        { batchSize?: number; before?: number; name?: string },
        null
      >
    }
  }
}
