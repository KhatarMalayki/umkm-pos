"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck, Save, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ProductUnit = {
  id: string;
  unitId: string;
  price: number;
  stock: number;
  isDefault: boolean;
  unit: { id: string; name: string; abbreviation: string };
};

type Product = {
  id: string;
  name: string;
  productUnits: ProductUnit[];
};

type OpnameRow = {
  productId: string;
  productName: string;
  unitId: string;
  unitLabel: string;
  productUnitKey: string; // productId-unitId for unique key
  systemStock: number;
  actualStock: number;
  note: string;
};

export default function CreateStockOpnamePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [rows, setRows] = useState<OpnameRow[]>([]);

  useEffect(() => {
    fetch("/api/products?active=true")
      .then((r) => r.json())
      .then((data: Product[]) => {
        setProducts(data);
        // Initialize rows from all product units
        const initialRows: OpnameRow[] = [];
        data.forEach((p) => {
          p.productUnits.forEach((pu) => {
            initialRows.push({
              productId: p.id,
              productName: p.name,
              unitId: pu.unitId,
              unitLabel: pu.unit.name,
              productUnitKey: `${p.id}-${pu.unitId}`,
              systemStock: pu.stock,
              actualStock: pu.stock,
              note: "",
            });
          });
        });
        setRows(initialRows);
      })
      .catch(() => toast.error("Gagal memuat produk"))
      .finally(() => setLoading(false));
  }, []);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => r.productName.toLowerCase().includes(q));
  }, [rows, search]);

  const updateRow = (key: string, field: "actualStock" | "note", value: string | number) => {
    setRows((prev) =>
      prev.map((r) => (r.productUnitKey === key ? { ...r, [field]: value } : r))
    );
  };

  const removeRow = (key: string) => {
    setRows((prev) => prev.filter((r) => r.productUnitKey !== key));
  };

  const stats = useMemo(() => {
    let surplus = 0;
    let deficit = 0;
    let unchanged = 0;
    rows.forEach((r) => {
      const diff = Number(r.actualStock) - r.systemStock;
      if (diff > 0) surplus += diff;
      else if (diff < 0) deficit += Math.abs(diff);
      else unchanged++;
    });
    return { surplus, deficit, unchanged, total: rows.length };
  }, [rows]);

  const handleSubmit = async () => {
    if (rows.length === 0) {
      toast.error("Tidak ada item untuk diopname");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/stock-opnames", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          note: note.trim() || null,
          items: rows.map((r) => ({
            productId: r.productId,
            unitId: r.unitId,
            systemStock: r.systemStock,
            actualStock: Number(r.actualStock) || 0,
            note: r.note.trim() || null,
          })),
        }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      const created = await res.json();
      toast.success("Stock opname tersimpan sebagai draft");
      router.push(`/admin/stock-opname/${created.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/stock-opname"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-1"
          >
            <ArrowLeft size={14} /> Kembali
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardCheck size={22} className="text-emerald-600" />
            Opname Baru
          </h1>
        </div>
        <Button onClick={handleSubmit} disabled={saving || loading}>
          <Save size={16} /> {saving ? "Menyimpan..." : "Simpan Draft"}
        </Button>
      </div>

      {/* Meta */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-4 md:p-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600">Tanggal Opname</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Catatan (opsional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Misal: Opname akhir bulan"
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          <Stat label="Item" value={stats.total} color="text-slate-700" />
          <Stat label="Surplus" value={`+${stats.surplus}`} color="text-emerald-600" />
          <Stat label="Defisit" value={`-${stats.deficit}`} color="text-red-600" />
          <Stat label="Sama" value={stats.unchanged} color="text-slate-500" />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Cari produk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none"
        />
      </div>

      {/* Rows */}
      {loading ? (
        <div className="bg-white rounded-2xl p-10 text-center text-sm text-slate-500 border border-slate-200/60">
          Memuat produk...
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200/60">
          <p className="text-sm text-slate-600 font-medium">Tidak ada produk</p>
          <p className="text-xs text-slate-400 mt-1">Coba kata kunci lain atau tambah produk dulu</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRows.map((r) => {
            const diff = Number(r.actualStock) - r.systemStock;
            return (
              <div key={r.productUnitKey} className="bg-white rounded-xl border border-slate-200/60 p-3 md:p-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                  <div className="md:col-span-4">
                    <p className="font-medium text-sm text-slate-900">{r.productName}</p>
                    <p className="text-[11px] text-slate-500">Satuan: {r.unitLabel}</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] uppercase font-semibold text-slate-400">Sistem</label>
                    <div className="mt-1 px-3 py-2 bg-slate-50 rounded-lg text-sm font-mono text-slate-700 border border-slate-100">
                      {r.systemStock}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] uppercase font-semibold text-slate-400">Fisik</label>
                    <input
                      type="number"
                      min={0}
                      value={r.actualStock}
                      onChange={(e) => updateRow(r.productUnitKey, "actualStock", e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="text-[10px] uppercase font-semibold text-slate-400">Selisih</label>
                    <div
                      className={`mt-1 px-2 py-2 rounded-lg text-sm font-bold text-center ${
                        diff > 0
                          ? "bg-emerald-50 text-emerald-700"
                          : diff < 0
                          ? "bg-red-50 text-red-700"
                          : "bg-slate-50 text-slate-500"
                      }`}
                    >
                      {diff > 0 ? "+" : ""}
                      {diff}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] uppercase font-semibold text-slate-400">Catatan</label>
                    <input
                      type="text"
                      value={r.note}
                      onChange={(e) => updateRow(r.productUnitKey, "note", e.target.value)}
                      placeholder="-"
                      className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none"
                    />
                  </div>

                  <div className="md:col-span-1 flex md:justify-end">
                    <button
                      onClick={() => removeRow(r.productUnitKey)}
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Hapus dari opname"
                    >
                      <Trash2 size={15} />
                    </button>
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

function Stat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-slate-50 rounded-lg px-3 py-2 text-center">
      <p className="text-[10px] uppercase font-semibold text-slate-400">{label}</p>
      <p className={`text-sm font-bold ${color} tabular-nums`}>{value}</p>
    </div>
  );
}
