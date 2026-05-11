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

### Produk Mobile Fix (2026-05-05)

- Improved responsiveness for admin `Produk` page on mobile devices.
- `src/app/admin/produk/page.tsx`:
  - Header action (`Tambah Produk`) now mobile-friendly.
  - Added dedicated mobile card layout (`md:hidden`) for product list.
  - Desktop table is now `md+` only with horizontal safety wrapper.
  - Product modal form fields now stack properly on small screens.
  - Product unit rows (`satuan/harga/stok`) use responsive grid layout.
  - Modal footer buttons now stack on mobile and align on desktop.

### Purchase Order Mobile Fix (2026-05-05)

- Improved responsiveness for admin `Purchase Order` module on mobile devices.
- `src/app/admin/purchase-order/page.tsx`:
  - Header and filter controls now stack on mobile.
  - PO action buttons now split mobile/desktop layout to avoid overflow.
  - Card note text no longer truncates badly on narrow screens.
- `src/app/admin/purchase-order/buat/page.tsx`:
  - Create form spacing/header/actions are mobile-friendly.
  - Item rows use responsive grid/card behavior on mobile.
  - Primary/secondary actions now stack properly on small screens.
- `src/app/admin/purchase-order/[id]/page.tsx`:
  - Detail toolbar now wraps and stacks safely on mobile.
  - PO table wrapped with horizontal scroll for small screens.
  - Header and footer spacing adjusted for mobile.
- `src/app/admin/purchase-order/[id]/POStatusActions.tsx`:
  - Status buttons now wrap (`flex-wrap`) to prevent clipping.

### Purchase Order Detail Stabilization (2026-05-05)

- Fixed runtime error when viewing a PO detail with no department assigned.
- `src/app/admin/purchase-order/[id]/page.tsx`:
  - Added safe fallbacks for department badge color and name.
  - Ensured header border color has a safe default.
- `src/app/admin/purchase-order/[id]/PrintButton.tsx`:
  - Added a client-only print button component to avoid SSR issues.
- `src/app/api/purchase-orders/[id]/route.ts`:
  - Corrected Next.js route handler `params` typing and removed unnecessary `await` usage.

### Change Log

- 2026-05-05: Improve admin mobile responsiveness and navigation behavior in admin layout.
- 2026-05-05: Improve invoice and pesanan responsiveness on mobile screens.
- 2026-05-05: Improve produk page responsiveness on mobile screens.
- 2026-05-05: Improve purchase-order pages responsiveness on mobile screens.
- 2026-05-05: Stabilize purchase-order detail page (params typing fix, client PrintButton, safe fallbacks for department fields).
- 2026-05-10: Add initial Stock Opname backend foundation (Prisma models + API endpoints) and DB sync.
- 2026-05-10: Fix Railway build for Next.js 16 by using Promise-based `params` typing in `stock-opnames/[id]` route handlers.

### Stock Opname Progress (2026-05-10)

- Added Prisma models:
  - `StockOpname`
  - `StockOpnameItem`
- Added API endpoints:
  - `src/app/api/stock-opnames/route.ts` (GET, POST)
  - `src/app/api/stock-opnames/[id]/route.ts` (GET, PUT, PATCH, DELETE)
- Implemented stock finalization flow:
  - On `status = completed`, stock values are written to `ProductUnit.stock` via transaction.

### Dashboard & Navigasi Improvement (2026-05-10)

- `src/app/admin/page.tsx`:
  - Perhitungan omzet diperbarui agar mencakup pesanan COD + Transfer (semua selain `cancelled`).
  - Menambahkan kartu `Omset Bulan Ini`.
  - Menambahkan grafik riwayat omset 6 bulan terakhir beserta jumlah pesanan per bulan.
- `src/app/admin/layout.tsx`:
  - Menambahkan bubble merah jumlah pesanan `pending` pada menu `Pesanan` (desktop + mobile), auto-refresh setiap 30 detik.
- Menambahkan tombol `Kembali` pada halaman:
  - `src/app/admin/kategori/page.tsx`
  - `src/app/admin/satuan/page.tsx`
  - `src/app/admin/diskon/page.tsx`
  - `src/app/admin/pengaturan/page.tsx`

### Stock Opname Admin UI (2026-05-10)

- Menambahkan modul admin stock opname:
  - `src/app/admin/stock-opname/page.tsx` (list)
  - `src/app/admin/stock-opname/buat/page.tsx` (buat draft)
  - `src/app/admin/stock-opname/[id]/page.tsx` (detail)
  - `src/app/admin/stock-opname/[id]/StockOpnameActions.tsx` (selesaikan/hapus)
- Menambahkan menu `Stock Opname` di sidebar admin.

### Order & Invoice Update (2026-05-11)

- `src/app/admin/pesanan/page.tsx`: menampilkan `customerNote` langsung di daftar ORD.
- `src/app/api/orders/[id]/route.ts`: PATCH sekarang mendukung pengurangan qty item, otomatis hitung ulang subtotal/discount/total dan mengembalikan stok selisih.
- `src/app/admin/invoice/[id]/page.tsx` + `EditInvoiceItems.tsx`: admin bisa mengurangi qty item invoice (dan memicu penyesuaian total + stok) via UI.

### Edit Draft PO & Manajemen Pengguna (2026-05-11)

- **Edit Draft Purchase Order**:
  - `src/app/admin/purchase-order/buat/page.tsx` mendukung query `?edit=<id>` untuk memuat dan menyimpan ulang draft via PUT.
  - Tombol `Edit Draft` ditambahkan di list (`src/app/admin/purchase-order/page.tsx`) dan detail (`src/app/admin/purchase-order/[id]/page.tsx`) untuk status `draft`.
- **Manajemen Pengguna**:
  - API baru `src/app/api/users/route.ts` (GET list, POST create) & `src/app/api/users/[id]/route.ts` (PATCH update, DELETE) dengan validasi role admin.
  - Aturan keamanan: tidak boleh hapus akun sendiri, dan minimal 1 admin harus tersisa.
  - Halaman admin baru `src/app/admin/pengguna/page.tsx` (list + modal tambah/edit, role admin/kasir, ganti password).
  - Menu `Pengguna` ditambahkan ke sidebar admin (`src/app/admin/layout.tsx`).

### Invoice List & Omset Fix (2026-05-11)

- `src/app/admin/invoice/page.tsx`:
  - Menambahkan keterangan metode pembayaran `COD` / `Transfer` pada tampilan mobile dan desktop.
- `src/app/admin/page.tsx`:
  - Mengubah perhitungan omset menjadi perhitungan manual dari semua order non-`cancelled` agar `Transfer` ikut terbaca konsisten.
  - Menambahkan breakdown `COD` dan `Transfer` pada kartu omset harian/bulanan dan header grafik riwayat omset.

### QRIS Upload & Checkout Label (2026-05-11)

- `src/app/api/uploads/qris/route.ts`:
  - Menambahkan endpoint upload gambar QRIS (`POST`) untuk admin.
  - File gambar disimpan ke `public/uploads/qris` dan API mengembalikan URL relatif file.
- `src/app/admin/pengaturan/page.tsx`:
  - Menambahkan upload file QRIS langsung dari komputer (tidak wajib URL).
  - Menambahkan preview QRIS setelah upload / isi URL.
- `src/app/toko/checkout/page.tsx`:
  - Opsi metode pembayaran menampilkan `Transfer Bank` dan `QRIS` secara terpisah.
  - Untuk kompatibilitas backend saat ini, pilihan `QRIS` dipetakan ke value internal `transfer` saat submit order.
  - Saat pilih QRIS, checkout menampilkan gambar QRIS dari pengaturan.
  - Jika gambar QRIS belum ada, checkout fallback ke info transfer bank.

### Change Log (Tambahan)

- 2026-05-10: Fix dashboard omzet agar transfer ikut terhitung, tambah omset bulanan + riwayat 6 bulan.
- 2026-05-10: Tambah modul UI Stock Opname di admin (list, buat, detail, aksi).
- 2026-05-10: Tambah tombol kembali di beberapa halaman pengelolaan admin.
- 2026-05-10: Tambah bubble notifikasi merah jumlah pesanan pending di sidebar admin.
