import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  sets: defineTable({
    categoryId: v.number(),
    name: v.string(),
    storageId: v.id('_storage'),
  }),
  products: defineTable({
    categoryId: v.number(),
    groupId: v.number(),
    name: v.string(),
    storageId: v.id('_storage'),
  }),
  categories: defineTable({
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
  }),
  trackedProducts: defineTable({
    categoryId: v.number(),
    groupId: v.number(),
    productId: v.number(),
    productName: v.string(),
    groupName: v.string(),
    categoryName: v.string(),
    requestedPrice: v.number(),
  }),
})
