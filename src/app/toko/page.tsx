"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShoppingCart, Search, Plus, Minus, Sparkles, PackageX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatRupiah } from "@/lib/utils";
import { useCartStore } from "@/store/cart";

// Emoji mapping per kategori
const categoryEmoji: Record<string, string> = {
  makanan: "🍛",
  kopi: "☕",
  "non-coffee": "🥤",
  minuman: "🧃",
  snack: "🍪",
};

const categoryGradient: Record<string, string> = {
  makanan: "from-orange-100 to-amber-100",
  kopi: "from-amber-100 to-yellow-100",
  "non-coffee": "from-pink-100 to-rose-100",
  minuman: "from-sky-100 to-blue-100",
  snack: "from-purple-100 to-fuchsia-100",
};

const getEmoji = (cat?: string) =>
  cat ? categoryEmoji[cat.toLowerCase()] ?? "🛍️" : "🛍️";
const getGradient = (cat?: string) =>
  cat ? categoryGradient[cat.toLowerCase()] ?? "from-emerald-50 to-teal-100" : "from-emerald-50 to-teal-100";

type Unit = { id: string; name: string; abbreviation: string };
type Category = { id: string; name: string };
type ProductUnit = { id: string; unitId: string; unit: Unit; price: number; stock: number; isDefault: boolean };
type Product = { id: string; name: string; description?: string; category?: Category; productUnits: ProductUnit[] };

export default function TokoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<Record<string, string>>({});
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([p, c]) => { setProducts(p); setCategories(c); });
  }, []);

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat ? p.category?.id === filterCat : true;
    return matchSearch && matchCat;
  });

  const getSelectedPU = (p: Product) => {
    const puId = selectedUnit[p.id];
    return puId ? p.productUnits.find((pu) => pu.id === puId) : p.productUnits.find((pu) => pu.isDefault) ?? p.productUnits[0];
  };

  const cartQty = (productUnitId: string) =>
    cartItems.find((i) => i.productUnitId === productUnitId)?.quantity ?? 0;

  const handleAdd = (p: Product) => {
    const pu = getSelectedPU(p);
    if (!pu) return;
    if (pu.stock <= 0) { toast.error("Stok habis"); return; }
    addItem({
      productId: p.id, productUnitId: pu.id,
      productName: p.name, unitName: pu.unit.name, unitAbbr: pu.unit.abbreviation,
      price: pu.price, quantity: 1,
    });
    toast.success(`${p.name} ditambahkan ke keranjang`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-8 text-white shadow-xl shadow-emerald-500/20">
        {/* Decorative blobs */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-10 w-56 h-56 bg-teal-300/20 rounded-full blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium mb-3 ring-1 ring-white/20">
            <Sparkles size={12} /> Produk segar setiap hari
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight">Selamat Datang! 👋</h1>
          <p className="text-emerald-50/90 mt-2 max-w-md">
            Pilih produk favoritmu, masukkan keranjang, lalu checkout. Praktis!
          </p>
        </div>
      </div>

      {/* Search + Category pills */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-11 h-12 bg-white border-slate-200 shadow-sm rounded-xl text-sm"
            placeholder="Cari produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          <button
            onClick={() => setFilterCat("")}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filterCat === ""
                ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
            }`}
          >
            Semua
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilterCat(c.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filterCat === c.id
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
              }`}
            >
              <span>{getEmoji(c.name)}</span>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <PackageX className="text-slate-400" size={28} />
          </div>
          <p className="text-slate-600 font-medium">Produk tidak ditemukan</p>
          <p className="text-slate-400 text-sm mt-1">Coba kata kunci atau kategori lain</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map((p) => {
            const pu = getSelectedPU(p);
            const qty = pu ? cartQty(pu.id) : 0;
            const catName = p.category?.name;
            return (
              <div
                key={p.id}
                className="group bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-xl hover:shadow-slate-200 hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Image/Emoji header */}
                <div className={`relative h-32 bg-gradient-to-br ${getGradient(catName)} flex items-center justify-center overflow-hidden`}>
                  <span className="text-5xl group-hover:scale-110 transition-transform duration-300">
                    {getEmoji(catName)}
                  </span>
                  {catName && (
                    <span className="absolute top-2 right-2 text-[10px] font-semibold bg-white/80 backdrop-blur-md text-slate-700 px-2 py-0.5 rounded-full ring-1 ring-slate-200/50">
                      {catName}
                    </span>
                  )}
                  {pu && pu.stock <= 0 && (
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center">
                      <span className="text-white text-xs font-bold bg-red-500 px-3 py-1 rounded-full">
                        STOK HABIS
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-3.5 space-y-2.5">
                  <div className="min-h-[2.5rem]">
                    <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">
                      {p.name}
                    </h3>
                    {p.description && (
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{p.description}</p>
                    )}
                  </div>

                  {/* Unit selector */}
                  {p.productUnits.length > 1 && (
                    <Select
                      className="text-xs h-8 border-slate-200"
                      value={
                        selectedUnit[p.id] ??
                        (p.productUnits.find((x) => x.isDefault)?.id ?? p.productUnits[0].id)
                      }
                      onChange={(e) => setSelectedUnit({ ...selectedUnit, [p.id]: e.target.value })}
                    >
                      {p.productUnits.map((pu_) => (
                        <option key={pu_.id} value={pu_.id}>
                          {pu_.unit.name} — {formatRupiah(pu_.price)}
                        </option>
                      ))}
                    </Select>
                  )}

                  {/* Price + CTA */}
                  <div className="flex items-end justify-between gap-2 pt-1">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-base leading-tight">
                        {pu ? formatRupiah(pu.price) : "-"}
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
                        per {pu?.unit.abbreviation}
                      </p>
                    </div>

                    {qty > 0 ? (
                      <div className="flex items-center gap-1 bg-slate-50 rounded-full p-1 ring-1 ring-slate-200">
                        <button
                          onClick={() => {
                            const { updateQty, removeItem } = useCartStore.getState();
                            if (pu) {
                              if (qty > 1) updateQty(pu.id, qty - 1);
                              else removeItem(pu.id);
                            }
                          }}
                          className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-slate-100 text-slate-700 active:scale-90 transition"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-sm font-bold w-5 text-center text-slate-900">{qty}</span>
                        <button
                          onClick={() => handleAdd(p)}
                          className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow flex items-center justify-center hover:shadow-md text-white active:scale-90 transition"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAdd(p)}
                        disabled={!pu || pu.stock <= 0}
                        className="inline-flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-2 rounded-xl text-xs font-semibold shadow hover:shadow-lg hover:shadow-emerald-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all"
                      >
                        <ShoppingCart size={13} />
                        {pu && pu.stock <= 0 ? "Habis" : "Tambah"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
