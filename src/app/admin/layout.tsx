"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
  Layers,
  FileText,
  ChevronRight,
  Store,
  ClipboardList,
  LogOut,
  User,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    title: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Katalog",
    items: [
      { href: "/admin/produk", label: "Produk", icon: Package },
      { href: "/admin/kategori", label: "Kategori", icon: Layers },
      { href: "/admin/satuan", label: "Satuan", icon: Tag },
    ],
  },
  {
    title: "Transaksi",
    items: [
      { href: "/admin/pesanan", label: "Pesanan", icon: ShoppingCart },
      {
        href: "/admin/purchase-order",
        label: "Purchase Order",
        icon: ClipboardList,
      },
      { href: "/admin/invoice", label: "Invoice", icon: FileText },
    ],
  },
  {
    title: "Promosi",
    items: [{ href: "/admin/diskon", label: "Diskon", icon: Tag }],
  },
  {
    title: "Sistem",
    items: [{ href: "/admin/pengaturan", label: "Pengaturan", icon: Settings }],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setUser(d.user);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Berhasil logout");
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-50 md:h-screen">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white md:flex flex-col shrink-0 border-r border-slate-800">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Store size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-base leading-none">UMKM POS</p>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">
                PANEL ADMIN
              </p>
            </div>
          </div>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto scrollbar-hide">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-3 mb-1.5">
                {group.title}
              </p>
              {group.items.map(({ href, label, icon: Icon }) => {
                const active =
                  pathname === href ||
                  (href !== "/admin" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                      active
                        ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-300 shadow-sm"
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-white",
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-r-full" />
                    )}
                    <Icon
                      size={17}
                      className={cn(
                        "transition-colors",
                        active
                          ? "text-emerald-400"
                          : "text-slate-500 group-hover:text-slate-300",
                      )}
                    />
                    <span className="flex-1">{label}</span>
                    {active && (
                      <ChevronRight size={14} className="text-emerald-400" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User card + logout */}
        <div className="p-3 border-t border-slate-800/60 space-y-2">
          {user && (
            <div className="flex items-center gap-2.5 bg-slate-800/40 rounded-xl p-2.5 ring-1 ring-slate-700/50">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                <User size={15} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate leading-tight">
                  {user.name}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors p-1.5 rounded-lg shrink-0"
                title="Logout"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-slate-800/40"
          >
            <Store size={14} />
            Lihat Halaman Toko
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="md:hidden h-14 shrink-0 bg-white border-b border-slate-200 px-4 flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="w-9 h-9 rounded-lg border border-slate-200 text-slate-700 flex items-center justify-center"
            aria-label="Buka menu admin"
          >
            <Menu size={18} />
          </button>
          <p className="font-semibold text-slate-900">Panel Admin</p>
          <div className="w-9 h-9" />
        </header>
        <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
      </div>

      {/* Sidebar mobile */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/50 transition-opacity md:hidden",
          mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileMenuOpen(false)}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white flex flex-col border-r border-slate-800 transition-transform md:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="px-4 h-14 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <Store size={16} className="text-white" />
            </div>
            <p className="font-semibold text-sm">UMKM POS</p>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 flex items-center justify-center"
            aria-label="Tutup menu admin"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto scrollbar-hide">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-3 mb-1.5">
                {group.title}
              </p>
              {group.items.map(({ href, label, icon: Icon }) => {
                const active =
                  pathname === href ||
                  (href !== "/admin" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                      active
                        ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-300 shadow-sm"
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-white",
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-r-full" />
                    )}
                    <Icon
                      size={17}
                      className={cn(
                        "transition-colors",
                        active
                          ? "text-emerald-400"
                          : "text-slate-500 group-hover:text-slate-300",
                      )}
                    />
                    <span className="flex-1">{label}</span>
                    {active && (
                      <ChevronRight size={14} className="text-emerald-400" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800/60 space-y-2">
          {user && (
            <div className="flex items-center gap-2.5 bg-slate-800/40 rounded-xl p-2.5 ring-1 ring-slate-700/50">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                <User size={15} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate leading-tight">
                  {user.name}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors p-1.5 rounded-lg shrink-0"
                title="Logout"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-slate-800/40"
          >
            <Store size={14} />
            Lihat Halaman Toko
          </Link>
        </div>
      </aside>
    </div>
  );
}
