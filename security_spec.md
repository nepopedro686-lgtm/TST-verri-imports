# Security Specification — Loja de Celulares

## 1. Data Invariants
1. **Default Deny**: No Firestore collection is readable or writable unless explicitly permitted.
2. **Draft & Archive Isolation**: Products with `publishStatus` equal to `'rascunho'` or `'arquivado'` MUST NEVER be readable (`get` or `list`) by unauthenticated visitors or non-admin users.
3. **Price & Stock Integrity**: Product `price` must be a finite number `>= 0`. If `quantity` is a number and `quantity == 0`, `availability` MUST NOT be `'disponivel'`.
4. **Admin-Only Mutations**: Only verified admins (`request.auth.token.email_verified == true` and bootstrapped owner email or `/admins/{uid}` document) can create, update, or delete products, media assets, store settings, or taxonomy metadata.
5. **Immutable Ownership & Timestamps**: `ownerId` and `createdAt` cannot be modified after creation; `createdAt` and `updatedAt` must match `request.time`.
6. **Payload Bounding**: All strings, arrays (`images <= 12`, `brands <= 40`, `categories <= 40`, `commercialHighlights <= 6`), and uploaded media (`sizeBytes <= 700000`) are strictly bounded to prevent resource exhaustion.

## 2. "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. Unauthenticated visitor creates a product in `/products/p1`.
2. Authenticated non-admin user creates a product in `/products/p2`.
3. Unauthenticated visitor lists `/products` without filtering `publishStatus == 'publicado'` (trying to scrape drafts).
4. Unauthenticated visitor reads `/products/draft-1` where `publishStatus == 'rascunho'`.
5. Unauthenticated visitor updates `price` on `/products/p1` to `1`.
6. Admin attempts to create a product with negative price (`price: -50`).
7. Admin attempts to create a product with `quantity: 0` and `availability: 'disponivel'`.
8. Authenticated non-admin attempts to write a shadow field `isAdmin: true` in `/admins/{uid}`.
9. Authenticated user with `email_verified: false` spoofs admin email to update `/storeSettings/main`.
10. Admin attempts to upload an unsupported MIME type (`image/svg+xml`) or oversized payload (`> 900KB`) to `/media/m1`.
11. Unauthenticated visitor attempts to `list` `/media` or `/admins`.
12. Admin attempts to backdate `createdAt` or mutate `ownerId` on an existing product.
