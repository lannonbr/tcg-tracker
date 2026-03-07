import { v } from 'convex/values'
import { ActionCache } from '@convex-dev/action-cache'
import { api, components, internal } from './_generated/api'
import { action, internalAction, internalMutation, mutation, query } from './_generated/server'
import type { Doc } from './_generated/dataModel'

type PriceData = {
  productId: number
  lowPrice: number
  midPrice: number
  highPrice: number
  marketPrice: number
  directLowPrice: number | null
  subTypeName: string
}

export type ProductData = {
  productId: number
  name: string
  cleanName: string
  imageUrl: string
  categoryId: number
  groupId: number
  url: string
  modifiedOn: string
  imageCount: number
  presaleInfo: {
    isPresale: boolean
    releasedOn: string | null
    note: string | null
  }
  extendedData: Array<{
    name: string
    displayName: string
    value: string
  }>
  prices: PriceData | undefined
}

type Group = {
  groupId: number
  name: string
  abbreviation: string
  isSupplemental: boolean
  publishedOn: string
  modifiedOn: string
  categoryId: number
}

const productsCache = new ActionCache(components.actionCache, {
  action: internal.products.internalFetchProducts,
  name: 'fetchProducts',
  ttl: 24 * 60 * 60 * 1000, // 1 day
})

export const cleanupProductEntry = internalMutation({
  args: { groupId: v.number() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('products')
      .filter((q) => q.eq(q.field('groupId'), args.groupId))
      .first()
    if (existing) {
      await ctx.storage.delete(existing.storageId)
      await ctx.db.delete(existing._id)
    }
  },
})

export const internalFetchProducts = internalAction({
  args: { categoryId: v.number(), groupId: v.number() },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.products.cleanupProductEntry, {
      groupId: args.groupId,
    })

    const groupsData = await fetch(
      `https://tcgcsv.com/tcgplayer/${args.categoryId}/groups`,
    ).then((resp) => resp.json())

    const name = groupsData.results.find(
      (group: Group) => group.groupId === args.groupId,
    ).name

    const productsData = await fetch(
      `https://tcgcsv.com/tcgplayer/${args.categoryId}/${args.groupId}/products`,
    ).then((resp) => resp.json())
    const pricesData = await fetch(
      `https://tcgcsv.com/tcgplayer/${args.categoryId}/${args.groupId}/prices`,
    ).then((resp) => resp.json())

    const prices: Array<PriceData> = pricesData.results
    const pricesMap = new Map(prices.map((price) => [price.productId, price]))

    const products: Array<ProductData> = productsData.results.map((product: any) => ({
      ...product,
      prices: pricesMap.get(product.productId),
    }))

    const blob = new Blob([JSON.stringify(products)], {
      type: 'application/json',
    })

    const storageId = await ctx.storage.store(blob)

    await ctx.runMutation(api.products.saveProducts, {
      categoryId: args.categoryId,
      groupId: args.groupId,
      name,
      storageId,
    })

    return { storageId, name }
  },
})

export const saveProducts = mutation({
  args: {
    categoryId: v.number(),
    groupId: v.number(),
    name: v.string(),
    storageId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('products', {
      categoryId: args.categoryId,
      groupId: args.groupId,
      name: args.name,
      storageId: args.storageId,
    })
  },
})

export const fetchProducts = action({
  args: { categoryId: v.number(), groupId: v.number() },
  handler: async (ctx, args) => {
    await productsCache.fetch(ctx, {
      categoryId: args.categoryId,
      groupId: args.groupId,
    })

    const products: Array<Doc<'products'>> = await ctx.runQuery(
      api.products.getProduct,
      { groupId: args.groupId },
    )

    const blob = await ctx.storage.get(products[0].storageId)
    const data = blob ? JSON.parse(await blob.text()) : null
    return { product: products, data }
  },
})

export const getProduct = query({
  args: { groupId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('products')
      .filter((q) => q.eq(q.field('groupId'), args.groupId))
      .collect()
  },
})
