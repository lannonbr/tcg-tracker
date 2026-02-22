import { action, mutation, query } from './_generated/server'
import { api } from './_generated/api'
import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { Category } from './categories'

export const fetchSets = action({
  args: { categoryId: v.number() },
  handler: async (ctx, args) => {
    const categories = await fetch(
      `https://tcgcsv.com/tcgplayer/categories`,
    ).then((resp) => resp.json())

    let name = categories.results.find(
      (category: Category) => category.categoryId === args.categoryId,
    ).name

    const set = await ctx.runQuery(api.sets.getSets, {
      categoryId: args.categoryId,
    })

    if (set.length == 0) {
      const data = await fetch(
        `https://tcgcsv.com/tcgplayer/${args.categoryId}/groups`,
      ).then((resp) => resp.blob())
      const storageId = await ctx.storage.store(data)
      await ctx.runMutation(api.sets.saveSets, {
        name: name,
        categoryId: args.categoryId,
        storageId,
      })
    }
  },
})

export const fetchSetUrl = action({
  args: { categoryId: v.number() },
  handler: async (ctx, args) => {
    let sets: Doc<'sets'>[] = await ctx.runQuery(api.sets.getSets, {
      categoryId: args.categoryId,
    })

    // If no set exists yet, fetch and store it first
    if (sets.length === 0) {
      await ctx.runAction(api.sets.fetchSets, {
        categoryId: args.categoryId,
      })
      sets = await ctx.runQuery(api.sets.getSets, {
        categoryId: args.categoryId,
      })
    }

    const fileUrl = await ctx.storage.getUrl(sets[0].storageId)

    return { set: sets, fileUrl }
  },
})

export const saveSets = mutation({
  args: {
    categoryId: v.number(),
    storageId: v.id('_storage'),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    let id = await ctx.db.insert('sets', {
      name: args.name,
      categoryId: args.categoryId,
      storageId: args.storageId,
    })
    return id
  },
})

export const getSets = query({
  args: { categoryId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('sets')
      .filter((q) => q.eq(q.field('categoryId'), args.categoryId))
      .collect()
  },
})
