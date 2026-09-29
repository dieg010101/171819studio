import {collectionRuleType} from './objects/shopify/collectionRuleType'
import {inventoryType} from './objects/shopify/inventoryType'
import {optionType} from './objects/shopify/optionType'
import {priceRangeType} from './objects/shopify/priceRangeType'
import {proxyStringType} from './objects/shopify/proxyStringType'
import {shopifyCollectionType} from './objects/shopify/shopifyCollectionType'
import {shopifyMetafieldType} from './objects/shopify/shopifyMetafieldType'
import {shopifyProductType} from './objects/shopify/shopifyProductType'
import {shopifyProductVariantType} from './objects/shopify/shopifyProductVariantType'
import {shopType} from './objects/shopify/shopType'

const objects = [
  collectionRuleType,
  inventoryType,
  optionType,
  priceRangeType,
  proxyStringType,
  shopifyCollectionType,
  shopifyMetafieldType,
  shopifyProductType,
  shopifyProductVariantType,
  shopType,
]

import {collectionType} from './documents/collection'
import {productType} from './documents/product'
import {productVariantType} from './documents/productVariant'

const documents = [collectionType, productType, productVariantType]

export const schemaTypes = [...objects, ...documents]
