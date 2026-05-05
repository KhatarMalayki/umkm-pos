"use client";

import Link from "next/link";
import { ShoppingCart, Store, LogIn } from "lucide-react";
import { useCartStore } from "@/store/cart";

export default function TokoLayout({ children }: { children: React.ReactNode }) {
  const items = useCartStore((s) => s.items);
  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <header className="bg-white/70 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/toko" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 group-hover:scale-105 transition-all">
              <Store size={18} className="text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-slate-900 text-base">Toko UMKM</span>
              <span className="text-[10px] text-slate-500 font-medium">POS Digital</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/toko/checkout" className="relative inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-95 transition-all">
              <ShoppingCart size={16} />
              <span className="hidden sm:inline">Keranjang</span>
              {totalQty > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 px-1 flex items-center justify-center font-bold ring-2 ring-white animate-pulse">
                  {totalQty > 9 ? "9+" : totalQty}
                </span>
              )}
            </Link>
            <Link href="/login" className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all">
              <LogIn size={16} />
              <span className="hidden sm:inline">Login</span>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-white/50 border-t border-slate-200/60 py-5 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Toko UMKM &middot; Dibuat dengan &hearts; untuk UMKM Indonesia
      </footer>
    </div>
  );
}
