import { action, mutation, query } from './_generated/server'
import { api } from './_generated/api'
import { v } from 'convex/values'

export const fetchSet = action({
  args: { groupId: v.number() },
  handler: async (ctx, args) => {
    const set = await ctx.runQuery(api.sets.getSet, { groupId: args.groupId })

    if (set.length != 1) {
      const data = await fetch(
        `https://tcgcsv.com/tcgplayer/${args.groupId}/groups`,
      ).then((resp) => resp.blob())
      const storageId = await ctx.storage.store(data)
      await ctx.runMutation(api.sets.saveSet, {
        groupId: args.groupId,
        storageId,
      })
    } else {
      console.log({ set })
    }
  },
})

export const saveSet = mutation({
  args: { groupId: v.number(), storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    await ctx.db.insert('sets', {
      groupId: args.groupId,
      storageId: args.storageId,
    })
  },
})

export const getSet = query({
  args: { groupId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('sets')
      .filter((q) => q.eq(q.field('groupId'), args.groupId))
      .collect()
  },
})

export const getSetUrl = query({
  args: { groupId: v.number() },
  handler: async (ctx, args) => {
    let results = await ctx.db
      .query('sets')
      .filter((q) => q.eq(q.field('groupId'), args.groupId))
      .collect()

    let url = await ctx.storage.getUrl(results[0].storageId)

    return url
  },
})
