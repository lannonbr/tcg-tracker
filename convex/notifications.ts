import { api } from './_generated/api'
import { internalAction } from './_generated/server'
import type { ProductData } from './products'

type DiscordEmbed = {
  title: string
  description: string
  color: number
  fields: Array<{ name: string; value: string; inline: boolean }>
}

async function sendDiscordNotification(
  webhookUrl: string,
  embeds: Array<DiscordEmbed>,
) {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds }),
  })
}

export const checkPricesAndNotify = internalAction({
  args: {},
  handler: async (ctx) => {
    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL
    if (!discordWebhookUrl) {
      console.log('DISCORD_WEBHOOK_URL not set, skipping notifications')
      return
    }

    const trackedProducts = await ctx.runQuery(
      api.trackedProducts.getTrackedProducts,
    )
    if (trackedProducts.length === 0) {
      console.log('No tracked products, skipping notifications')
      return
    }

    // Group by (categoryId, groupId) to minimize API calls
    const groupMap = new Map<
      string,
      {
        categoryId: number
        groupId: number
        products: typeof trackedProducts
      }
    >()
    for (const product of trackedProducts) {
      const key = `${product.categoryId}-${product.groupId}`
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          categoryId: product.categoryId,
          groupId: product.groupId,
          products: [],
        })
      }
      groupMap.get(key)!.products.push(product)
    }

    const alertEmbeds: Array<DiscordEmbed> = []

    for (const { categoryId, groupId, products } of groupMap.values()) {
      const { data } = await ctx.runAction(api.products.fetchProducts, {
        categoryId,
        groupId,
      })
      const productList: Array<ProductData> = data ?? []
      const productsMap = new Map(productList.map((p) => [p.productId, p]))

      for (const trackedProduct of products) {
        const productData = productsMap.get(trackedProduct.productId)
        const marketPrice = productData?.prices?.marketPrice
        if (marketPrice === undefined || marketPrice === null) continue
        if (marketPrice <= trackedProduct.requestedPrice) {
          alertEmbeds.push({
            title: trackedProduct.productName,
            description: `Price alert for **${trackedProduct.groupName}** (${trackedProduct.categoryName})`,
            color: 0x00b300,
            fields: [
              {
                name: 'Market Price',
                value: `$${marketPrice.toFixed(2)}`,
                inline: true,
              },
              {
                name: 'Target Price',
                value: `$${trackedProduct.requestedPrice.toFixed(2)}`,
                inline: true,
              },
            ],
          })
        }
      }
    }

    if (alertEmbeds.length === 0) {
      console.log('No price alerts to send')
      return
    }

    // Discord allows max 10 embeds per message, batch if needed
    for (let i = 0; i < alertEmbeds.length; i += 10) {
      await sendDiscordNotification(
        discordWebhookUrl,
        alertEmbeds.slice(i, i + 10),
      )
    }

    console.log(`Sent ${alertEmbeds.length} price alert(s) to Discord`)
  },
})
