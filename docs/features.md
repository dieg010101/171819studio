# Studio features

## Schema

- `schemaTypes/documents/`: `product`, `productVariant`, `collection`, the document
  types Sanity Connect syncs into.
- `schemaTypes/objects/shopify/`: the read-only `store` objects Connect writes.

Sanity-authored fields belong on the document types, outside `store`.

## Size guides

`schemaTypes/documents/sizeGuide.ts`, listed under **Size Guides**. A guide holds
weak references to the products that use it (`products`) and its measurements
(`data`: `sizes`, `measurements` rows of `label` + `values` in centimetres, and
`note`). Validation blocks publishing when a product is in another guide or a
row's value count differs from the number of sizes. Sanity Connect syncs it to
the `app--6007307--sanity-documents-sizeGuide` metaobject, which
`sections/product.liquid` in the theme reads.

## Shopify metafields

If metafield namespaces are selected for import in Sanity Connect, product and
collection metafields are synced to `store.metafields` and shown under a
**Metafields** fieldset. Each entry holds `namespace`, `key`, Shopify `type` and
`value`:

```json
{
  "_key": "custom.snowboard_length",
  "namespace": "custom",
  "key": "snowboard_length",
  "type": "dimension",
  "value": {"value": 180, "unit": "CENTIMETERS"}
}
```

`value` isn't declared on the `shopifyMetafield` schema type, because its shape
follows the metafield type and no single Sanity field type accepts all of them.
`components/inputs/ShopifyMetafield.tsx` reads it from the raw value, and
`utils/formatMetafieldValue.ts` formats it by type, falling back to the raw value.
Shopify's [list of data types](https://shopify.dev/docs/apps/build/custom-data/metafields/list-of-data-types)
gives the shape of every value.

Metafields are read-only and the whole array is replaced on every sync. Variant
metafields and metaobjects aren't synced.

## Structure

`structure/` groups each product's details and its variants under **Products**,
next to **Collections**.

## Document actions

In `plugins/customDocumentActions/`. Synced types can't be created or duplicated
in the Studio.

- **Delete** (`shopifyDelete.tsx`) is offered only when Shopify reports the
  product or collection as deleted (`store.isDeleted`). It removes the Sanity
  document, its draft, and (for products) its variant documents. Nothing in
  Shopify is deleted.
- **Edit in Shopify** (`shopifyLink.ts`) opens the resource in Shopify admin. It,
  the navbar Shopify button, and the "View this product on Shopify" link only
  appear once `SHOPIFY_STORE_ID` is set in `constants.ts`.

## Inputs and previews

- `components/inputs/*Hidden.tsx` are display-only banners shown when a document is
  deleted from Shopify or not `active` there.
- `components/inputs/ProxyString.tsx` shows a nested `store` value (title, handle)
  as a locked field.
- `components/media/ShopifyDocumentStatus.tsx` is the list preview. It uses the
  Shopify CDN image and marks deleted or inactive documents.
