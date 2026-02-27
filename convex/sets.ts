import { v } from 'convex/values'
import { ActionCache } from '@convex-dev/action-cache'
import { action, internalAction, internalMutation, mutation, query } from './_generated/server'
import { api, components, internal } from './_generated/api'
import type { Doc } from './_generated/dataModel'
import type { Category } from './categories'

const setsCache = new ActionCache(components.actionCache, {
  action: internal.sets.internalFetchSets,
  name: 'fetchSets',
  ttl: 7 * 24 * 60 * 60 * 1000, // 1 week
})

export const cleanupSetsEntry = internalMutation({
  args: { categoryId: v.number() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('sets')
      .filter((q) => q.eq(q.field('categoryId'), args.categoryId))
      .first()
    if (existing) {
      await ctx.storage.delete(existing.storageId)
      await ctx.db.delete(existing._id)
    }
  },
})

export const internalFetchSets = internalAction({
  args: { categoryId: v.number() },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.sets.cleanupSetsEntry, {
      categoryId: args.categoryId,
    })

    const categories = await fetch(
      `https://tcgcsv.com/tcgplayer/categories`,
    ).then((resp) => resp.json())

    const name = categories.results.find(
      (category: Category) => category.categoryId === args.categoryId,
    ).name

    const data = await fetch(
      `https://tcgcsv.com/tcgplayer/${args.categoryId}/groups`,
    ).then((resp) => resp.blob())
    const storageId = await ctx.storage.store(data)
    await ctx.runMutation(api.sets.saveSets, {
      name,
      categoryId: args.categoryId,
      storageId,
    })

    return { storageId, name }
  },
})

export const fetchSetUrl = action({
  args: { categoryId: v.number() },
  handler: async (ctx, args) => {
    await setsCache.fetch(ctx, { categoryId: args.categoryId })

    const sets: Array<Doc<'sets'>> = await ctx.runQuery(api.sets.getSets, {
      categoryId: args.categoryId,
    })

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
    const id = await ctx.db.insert('sets', {
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
