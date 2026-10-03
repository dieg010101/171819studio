import {ListItemBuilder, StructureResolver} from 'sanity/structure'
import collections from './collectionStructure'
import products from './productStructure'
import sizeGuides from './sizeGuideStructure'

/**
 * Structure overrides
 *
 * Sanity Studio automatically lists document types out of the box.
 * With this custom structure we achieve things like grouping product details
 * and variants for easy editorial access.
 *
 * You can customize this even further as your schema types progress.
 * To learn more about structure builder, visit our docs:
 * https://www.sanity.io/docs/overview-structure-builder
 */

// If you add document types to structure manually, you can add them to this function to prevent duplicates in the root pane
const hiddenDocTypes = (listItem: ListItemBuilder) => {
  const id = listItem.getId()

  if (!id) {
    return false
  }

  return !['collection', 'media.tag', 'product', 'productVariant', 'sizeGuide'].includes(id)
}

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Content')
    .items([
      products(S, context),
      collections(S, context),
      S.divider(),
      sizeGuides(S, context),
      ...S.documentTypeListItems().filter(hiddenDocTypes),
    ])
