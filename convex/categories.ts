import { v } from 'convex/values'
import { action, mutation, query } from './_generated/server'
import { api } from './_generated/api'

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

export const hasCategories = query({
  args: {},
  handler: async (ctx) => {
    const category = await ctx.db.query('categories').first()
    return category !== null
  },
})

export const saveCategory = mutation({
  args: {
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
  },
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
  args: {},
  handler: async (ctx) => {
    // Check if categories already exist
    const exists = await ctx.runQuery(api.categories.hasCategories)

    if (exists) {
      console.log('Categories already exist, skipping fetch')
      return
    }

    const data = await fetch(`https://tcgcsv.com/tcgplayer/categories`).then(
      (resp) => resp.json(),
    )

    const categories: Array<Category> = data.results

    // Insert each category into the database
    for (const category of categories) {
      await ctx.runMutation(api.categories.saveCategory, category)
    }

    console.log(`Saved ${categories.length} categories`)
  },
})
