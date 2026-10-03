import {ThLargeIcon} from '@sanity/icons/ThLarge'
import pluralize from 'pluralize-esm'
import {
  defineArrayMember,
  defineField,
  defineType,
  getDraftId,
  getPublishedId,
  type Path,
  type ReferenceFilterResolverContext,
  type SanityClient,
  type ValidationContext,
} from 'sanity'
import {SIZE_GUIDE_API_VERSION} from '../../constants'

type ProductReference = {_key?: string; _ref?: string}

// Every other size guide that can claim a product: published and draft
// documents, never this guide's own published/draft pair. Content Release
// versions (`versions.*`) are left out: until a release is published, the
// published and draft guides are what the storefront and editors work from.
// Shared by the product picker and the validator so both agree on what a claim is.
const OTHER_GUIDES = `*[
  _type == "sizeGuide"
  && !(_id in $ownIds)
  && !(_id in path("versions.**"))
]`

// A raw-perspective, uncached client, so drafts count as claims and a product
// removed from another guide becomes available as soon as that edit saves.
function claimClient(getClient: (options: {apiVersion: string}) => SanityClient) {
  return getClient({apiVersion: SIZE_GUIDE_API_VERSION}).withConfig({
    perspective: 'raw',
    useCdn: false,
  })
}

// This guide's own IDs, whether it is open as published, draft or a release version.
function ownIds(documentId: string) {
  const id = getPublishedId(documentId)
  return [id, getDraftId(id)]
}

// Synced to Shopify by Sanity Connect as the `sizeGuide` metaobject: `products`
// becomes a list of Product references (used by the theme to find a product's
// guide) and `data` becomes one JSON field (what the theme renders).
export const sizeGuideType = defineType({
  name: 'sizeGuide',
  title: 'Size Guide',
  type: 'document',
  icon: ThLargeIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Internal title',
      type: 'string',
      description: 'For editors only, not shown on the storefront. For example "Trouser Block A".',
      validation: (rule) =>
        rule.custom((title) => {
          if (typeof title !== 'string' || title.trim() === '') {
            return 'Give this size guide a title.'
          }
          if (title !== title.trim()) {
            return 'Remove the spaces at the start or end of the title.'
          }
          return true
        }),
    }),
    defineField({
      name: 'products',
      title: 'Products',
      type: 'array',
      description:
        'Every product that uses this guide. A product can belong to only one size guide.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'product'}],
          // Weak: products belong to Shopify, and a strong reference would stop
          // Sanity Connect from deleting or unpublishing a product that is
          // assigned here.
          weak: true,
          options: {
            // Products are created by Sanity Connect only.
            disableNew: true,
            filter: filterAvailableProducts,
          },
          validation: (rule) => [
            rule.custom(validateNotInOtherGuide),
            rule.custom(validateProductAvailable).warning(),
          ],
        }),
      ],
      validation: (rule) => [
        rule.required().min(1).error('Assign at least one product.'),
        rule.unique().error('Each product can only be added once.'),
      ],
    }),
    defineField({
      name: 'data',
      title: 'Size guide',
      type: 'object',
      description:
        'Enter garment measurements in centimetres. Inches are calculated automatically on the storefront.',
      options: {collapsible: false},
      fields: [
        defineField({
          name: 'sizes',
          title: 'Sizes',
          type: 'array',
          description:
            'The column headings, in order. For example 28, 30, 32 or S, M, L. Independent of the product’s variants.',
          of: [
            defineArrayMember({
              type: 'string',
              validation: (rule) =>
                rule.custom((size) => {
                  if (typeof size !== 'string' || size.trim() === '') {
                    return 'Enter a size, or remove this one.'
                  }
                  if (size !== size.trim()) {
                    return 'Remove the spaces at the start or end of this size.'
                  }
                  return true
                }),
            }),
          ],
          validation: (rule) => [
            rule.required().min(1).error('Add at least one size.'),
            rule.custom((sizes: unknown[] | undefined) =>
              findDuplicates(
                (sizes ?? []).map((size, index) => ({name: size, path: [index]})),
                (size) => `Size "${size}" is listed more than once.`,
              ),
            ),
          ],
        }),
        defineField({
          name: 'measurements',
          title: 'Measurements',
          type: 'array',
          description:
            'One row per measurement, in centimetres. Each row needs exactly one value per size.',
          of: [defineArrayMember({type: 'sizeGuideMeasurement'})],
          validation: (rule) => [
            rule.required().min(1).error('Add at least one measurement.'),
            rule.custom((rows: {_key: string; label?: unknown}[] | undefined) =>
              findDuplicates(
                (rows ?? []).map((row) => ({name: row.label, path: [{_key: row._key}]})),
                (label) => `Measurement "${label}" is listed more than once.`,
              ),
            ),
          ],
        }),
        defineField({
          name: 'note',
          title: 'Note',
          type: 'text',
          rows: 2,
          description:
            'Optional. Shown under the measurements, e.g. "Measurements taken with garment laid flat."',
        }),
      ],
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      products: 'products',
      sizes: 'data.sizes',
    },
    prepare({title, products, sizes}) {
      const productCount = Array.isArray(products) ? products.length : 0
      const sizeList: unknown[] = Array.isArray(sizes) ? sizes : []
      return {
        title: title || 'Untitled size guide',
        subtitle: [
          productCount ? pluralize('product', productCount, true) : 'No products',
          sizeList.length ? sizeList.join(' / ') : 'No sizes',
        ].join(' · '),
      }
    },
  },
})

// Case- and whitespace-insensitive, so "M" and "m " count as the same label.
// Each repeat is marked on its own item.
function findDuplicates(items: {name: unknown; path: Path}[], message: (name: string) => string) {
  const seen = new Set<string>()
  const errors = []
  for (const {name, path} of items) {
    if (typeof name !== 'string' || name.trim() === '') continue
    const key = name.trim().toLowerCase()
    if (seen.has(key)) {
      errors.push({message: message(name.trim()), path})
    }
    seen.add(key)
  }
  return errors.length ? errors : true
}

// Picker search only: hides products deleted from Shopify, products already in
// this list, and products claimed by another guide (see OTHER_GUIDES). Selected
// products still render. Filters do not enforce anything, so
// validateNotInOtherGuide below remains the real check.
async function filterAvailableProducts({
  document,
  parent,
  getClient,
}: ReferenceFilterResolverContext) {
  const selected = ((parent as ProductReference[] | undefined) ?? [])
    .map((item) => item?._ref)
    .filter((ref): ref is string => typeof ref === 'string')

  let claimed: string[] = []
  try {
    claimed = await claimClient(getClient).fetch<string[]>(
      `array::compact(${OTHER_GUIDES}.products[]._ref)`,
      {ownIds: ownIds(document._id)},
    )
  } catch (error) {
    // Still offer the other products; the validator rejects a claimed one.
    console.warn('Size guide: could not load products assigned to other guides.', error)
  }

  // Both ID forms, in case search returns a product's draft.
  const hidden = [...new Set([...selected, ...claimed].map(getPublishedId))]
  return {
    filter: 'store.isDeleted != true && !(_id in $hidden)',
    params: {hidden: hidden.flatMap((id) => [id, getDraftId(id)])},
  }
}

// One size guide per product, so the storefront never has to choose.
async function validateNotInOtherGuide(value: unknown, context: ValidationContext) {
  const ref = (value as ProductReference | undefined)?._ref
  const documentId = context.document?._id
  if (!ref || !documentId) return true

  const {productTitle, guides} = await claimClient(context.getClient).fetch<{
    productTitle: string | null
    guides: {_id: string; title?: string}[]
  }>(
    `{
      "productTitle": *[_id == $ref][0].store.title,
      "guides": ${OTHER_GUIDES}[$ref in products[]._ref]{_id, title}
    }`,
    {ref, ownIds: ownIds(documentId)},
  )
  if (!guides.length) return true

  // A guide with both a draft and a published version is the same guide.
  const titles = new Map<string, string>()
  for (const guide of guides) {
    const guideId = getPublishedId(guide._id)
    if (!titles.has(guideId) || guide._id === guideId) {
      titles.set(guideId, guide.title?.trim() || 'Untitled size guide')
    }
  }
  const names = [...titles.values()].map((title) => `"${title}"`).join(', ')
  const product = productTitle ?? 'This product'
  return titles.size === 1
    ? `${product} is already assigned to ${names}. Remove it from that guide before assigning it here.`
    : `${product} is already assigned to ${names}. Remove it from those guides before assigning it here.`
}

// Weak references survive their product: say so rather than fail.
async function validateProductAvailable(value: unknown, context: ValidationContext) {
  const ref = (value as ProductReference | undefined)?._ref
  if (!ref) return true

  const product = await claimClient(context.getClient).fetch<{
    title?: string
    isDeleted?: boolean
  } | null>(`*[_id == $ref][0]{"title": store.title, "isDeleted": store.isDeleted}`, {ref})
  if (!product) {
    return 'This product no longer exists in Sanity. Remove it from this guide.'
  }
  if (product.isDeleted) {
    return `${product.title ?? 'This product'} has been deleted from Shopify. Remove it from this guide.`
  }
  return true
}
