import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const trackProduct = mutation({
  args: {
    categoryId: v.number(),
    groupId: v.number(),
    productId: v.number(),
    productName: v.string(),
    groupName: v.string(),
    categoryName: v.string(),
    requestedPrice: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('trackedProducts', args)
  },
})

export const updateTrackedProduct = mutation({
  args: {
    id: v.id('trackedProducts'),
    requestedPrice: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { requestedPrice: args.requestedPrice })
  },
})

export const untrackProduct = mutation({
  args: {
    id: v.id('trackedProducts'),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
  },
})

export const getTrackedProducts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('trackedProducts').collect()
  },
})

export const getTrackedProductsByGroup = query({
  args: { groupId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('trackedProducts')
      .filter((q) => q.eq(q.field('groupId'), args.groupId))
      .collect()
  },
})
