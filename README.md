# seventeeneighteennineteen — Sanity Studio

Sanity Studio for the 171819 store (project `xeq84p11`, dataset `production`).

The storefront is a custom **Shopify Online Store 2.0 Liquid theme** (the sibling
`skeleton-theme-main` repo). It is not headless.

## Ownership

- **Shopify owns commerce:** products, variants, prices, inventory, collections,
  checkout, SEO, and ordinary pages/policies.
- **Sanity owns enriched/editorial content** that Shopify cannot model well, added
  to the synced documents as Sanity-authored fields.

## What is in the Studio

- **Products** → Details / Variants, and **Collections**, synced from Shopify by the
  [Sanity Connect](https://apps.shopify.com/sanity-connect) app.
- Synced Shopify data lives in each document's read-only `store` object. Never
  edit it here; Connect overwrites it on every sync.

See [docs/features.md](docs/features.md) for the Studio customizations.

## Commands

```sh
npm run dev       # local Studio
npm run build     # production build
npm run deploy    # deploy the hosted Studio
```

Validation:

```sh
npx --no-install tsc --noEmit --incremental false
npx --no-install sanity schema validate
npx --no-install eslint .
```
