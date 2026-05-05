# UMKM POS

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Project Notes

### Admin Dashboard Mobile Fix (2026-05-05)

- Fixed admin dashboard layout not responsive on phone screens.
- Refactored `src/app/admin/layout.tsx` to use:
  - Desktop-only fixed sidebar (`md:flex`)
  - Mobile top bar with menu button
  - Mobile slide-in drawer sidebar with backdrop overlay
  - Auto-close drawer on route change
- Updated main content container to avoid clipping (`min-w-0`, `h-dvh`, mobile-first layout).

### Invoice & Pesanan Mobile Fix (2026-05-05)

- Improved responsiveness for admin `Invoice` and `Pesanan` pages on phone screens.
- `src/app/admin/invoice/page.tsx`:
  - Added mobile card list for invoice items.
  - Kept desktop table on `md+` with safe horizontal scroll.
- `src/app/admin/pesanan/page.tsx`:
  - Search/filter bar now stacks on mobile.
  - Order header and action buttons now wrap safely.
  - Expanded item table now uses horizontal scroll container.
- `src/app/admin/invoice/[id]/page.tsx`:
  - Header/info sections made mobile-first.
  - Items table wrapped with horizontal scroll.
  - Totals/footer spacing adjusted for small screens.

### Change Log

- 2026-05-05: Improve admin mobile responsiveness and navigation behavior in admin layout.
- 2026-05-05: Improve invoice and pesanan responsiveness on mobile screens.
