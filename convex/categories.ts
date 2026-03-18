import { v } from 'convex/values'
import { ActionCache } from '@convex-dev/action-cache'
import { components, internal } from './_generated/api'
import {
  action,
  internalAction,
  internalMutation,
  mutation,
  query,
} from './_generated/server'

export type Category = {
  categoryId: number
  name: string
  modifiedOn: string
  displayName: string
  seoCategoryName: string
  categoryDescription: string | null
  categoryPageTitle: string | null
  sealedLabel: string | null
  nonSealedLabel: string | null
  conditionGuideUrl: string
  isScannable: boolean
  popularity: number
  isDirect: boolean
}

const categoryValidator = {
  categoryId: v.number(),
  name: v.string(),
  modifiedOn: v.string(),
  displayName: v.string(),
  seoCategoryName: v.string(),
  categoryDescription: v.union(v.string(), v.null()),
  categoryPageTitle: v.union(v.string(), v.null()),
  sealedLabel: v.union(v.string(), v.null()),
  nonSealedLabel: v.union(v.string(), v.null()),
  conditionGuideUrl: v.string(),
  isScannable: v.boolean(),
  popularity: v.number(),
  isDirect: v.boolean(),
}

const categoriesCache = new ActionCache(components.actionCache, {
  action: internal.categories.internalFetchCategories,
  name: 'fetchCategories',
  ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
})

export const hasCategories = query({
  args: {},
  handler: async (ctx) => {
    const category = await ctx.db.query('categories').first()
    return category !== null
  },
})

export const saveCategory = mutation({
  args: categoryValidator,
  handler: async (ctx, args) => {
    await ctx.db.insert('categories', args)
  },
})

export const getCategories = query({
  args: {},
  handler: (ctx) => {
    return ctx.db.query('categories').collect()
  },
})

export const getCategory = query({
  args: { categoryId: v.number() },
  handler(ctx, args) {
    return ctx.db
      .query('categories')
      .filter((q) => q.eq(q.field('categoryId'), args.categoryId))
      .collect()
  },
})

export const fetchCategories = action({
  args: { forceRefresh: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (args.forceRefresh) {
      await categoriesCache.remove(ctx, {})
    }
    await categoriesCache.fetch(ctx, {}, {
      force: args.forceRefresh,
    })
  },
})

export const syncCategories = internalMutation({
  args: {
    categories: v.array(v.object(categoryValidator)),
  },
  handler: async (ctx, args) => {
    const existingCategories = await ctx.db.query('categories').collect()
    for (const category of existingCategories) {
      await ctx.db.delete(category._id)
    }
    for (const category of args.categories) {
      await ctx.db.insert('categories', category)
    }
    return args.categories.length
  },
})

export const internalFetchCategories = internalAction({
  args: {},
  handler: async (ctx) => {
    const response = await fetch('https://tcgcsv.com/tcgplayer/categories')
    const data = await response.json()
    const categories: Array<Category> = data.results

    const syncedCount: number = await ctx.runMutation(
      internal.categories.syncCategories,
      { categories },
    )

    console.log(`Synced ${syncedCount} categories`)
    return { syncedCount }
  },
})
