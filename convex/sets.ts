import { action, mutation, query } from './_generated/server'
import { api } from './_generated/api'
import { v } from 'convex/values'
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

    if (set.length != 1) {
      const data = await fetch(
        `https://tcgcsv.com/tcgplayer/${args.categoryId}/groups`,
      ).then((resp) => resp.blob())
      const storageId = await ctx.storage.store(data)
      await ctx.runMutation(api.sets.saveSets, {
        name: name,
        categoryId: args.categoryId,
        storageId,
      })
    } else {
      console.log({ set })
    }
  },
})

export const saveSets = mutation({
  args: {
    categoryId: v.number(),
    storageId: v.id('_storage'),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('sets', {
      name: args.name,
      categoryId: args.categoryId,
      storageId: args.storageId,
    })
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

export const getSetsUrl = query({
  args: { categoryId: v.number() },
  handler: async (ctx, args) => {
    let results = await ctx.db
      .query('sets')
      .filter((q) => q.eq(q.field('categoryId'), args.categoryId))
      .collect()

    let url = await ctx.storage.getUrl(results[0].storageId)

    return url
  },
})
