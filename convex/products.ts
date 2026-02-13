import { api } from './_generated/api'
import { action, mutation, query } from './_generated/server'
import { v } from 'convex/values'

type PriceData = {
  productId: number
  lowPrice: number
  midPrice: number
  highPrice: number
  marketPrice: number
  directLowPrice: number | null
  subTypeName: string
}

type ProductData = {
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

export const fetchProducts = action({
  args: { categoryId: v.number(), groupId: v.number() },
  handler: async (ctx, args) => {
    const productsData = await fetch(
      `https://tcgcsv.com/tcgplayer/${args.categoryId}/${args.groupId}/products`,
    ).then((resp) => resp.json())
    const pricesData = await fetch(
      `https://tcgcsv.com/tcgplayer/${args.categoryId}/${args.groupId}/prices`,
    ).then((resp) => resp.json())

    let prices: PriceData[] = pricesData.results

    const pricesMap = new Map(prices.map((price) => [price.productId, price]))

    let products: ProductData[] = productsData.results.map((product: any) => ({
      ...product,
      prices: pricesMap.get(product.productId),
    }))

    const blob = new Blob([JSON.stringify(products)], {
      type: 'application/json',
    })

    const storageId = await ctx.storage.store(blob)

    await ctx.runMutation(api.products.saveProducts, {
      groupId: args.groupId,
      storageId,
    })
  },
})

export const saveProducts = mutation({
  args: {
    groupId: v.number(),
    storageId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('products', {
      groupId: args.groupId,
      storageId: args.storageId,
    })
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

export const getProductUrl = query({
  args: { groupId: v.number() },
  handler: async (ctx, args) => {
    let results = await ctx.db
      .query('products')
      .filter((q) => q.eq(q.field('groupId'), args.groupId))
      .collect()

    let url = await ctx.storage.getUrl(results[0].storageId)

    return url
  },
})
