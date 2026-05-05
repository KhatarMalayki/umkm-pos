"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Package, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";

type Unit = { id: string; name: string; abbreviation: string };
type Category = { id: string; name: string };
type ProductUnit = { id: string; unitId: string; unit: Unit; price: number; stock: number; isDefault: boolean };
type Product = {
  id: string; name: string; description?: string; isActive: boolean;
  category?: Category; productUnits: ProductUnit[];
};

const emptyForm = { name: "", description: "", categoryId: "", isActive: true };

export default function ProdukPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [puRows, setPuRows] = useState([{ unitId: "", price: "", stock: "", isDefault: true }]);
  const [loading, setLoading] = useState(false);

  const fetch_ = async () => {
    const [p, u, c] = await Promise.all([
      fetch("/api/products?active=false").then((r) => r.json()),
      fetch("/api/units").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]);
    setProducts(p); setUnits(u); setCategories(c);
  };

  useEffect(() => { fetch_(); }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setPuRows([{ unitId: "", price: "", stock: "", isDefault: true }]);
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description ?? "", categoryId: p.category?.id ?? "", isActive: p.isActive });
    setPuRows(p.productUnits.map((pu) => ({
      unitId: pu.unitId, price: String(pu.price), stock: String(pu.stock), isDefault: pu.isDefault,
    })));
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name || puRows.some((r) => !r.unitId || !r.price)) {
      toast.error("Lengkapi semua field wajib"); return;
    }
    setLoading(true);
    const payload = {
      ...form, categoryId: form.categoryId || undefined,
      productUnits: puRows.map((r, i) => ({
        unitId: r.unitId, price: Number(r.price), stock: Number(r.stock), isDefault: i === 0,
      })),
    };
    const url = editing ? `/api/products/${editing.id}` : "/api/products";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setLoading(false);
    if (res.ok) {
      toast.success(editing ? "Produk diperbarui" : "Produk ditambahkan");
      setShowModal(false); fetch_();
    } else toast.error("Gagal menyimpan");
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus produk "${name}"?`)) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Produk dihapus"); fetch_(); }
    else toast.error("Gagal menghapus");
  };

  const addPuRow = () => setPuRows([...puRows, { unitId: "", price: "", stock: "", isDefault: false }]);
  const removePuRow = (i: number) => setPuRows(puRows.filter((_, idx) => idx !== i));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produk</h1>
          <p className="text-sm text-gray-500">{products.length} produk terdaftar</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} /> Tambah Produk</Button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input className="pl-9" placeholder="Cari produk..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Produk</th>
              <th className="px-4 py-3 text-left">Kategori</th>
              <th className="px-4 py-3 text-left">Harga & Satuan</th>
              <th className="px-4 py-3 text-left">Stok</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                <Package className="mx-auto mb-2" size={28} /> Belum ada produk
              </td></tr>
            ) : filtered.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{p.name}</p>
                  {p.description && <p className="text-xs text-gray-400 truncate max-w-[180px]">{p.description}</p>}
                </td>
                <td className="px-4 py-3 text-gray-600">{p.category?.name ?? "-"}</td>
                <td className="px-4 py-3">
                  {p.productUnits.map((pu) => (
                    <div key={pu.id} className="text-xs">
                      {formatRupiah(pu.price)} / {pu.unit.abbreviation}
                      {pu.isDefault && <span className="ml-1 text-emerald-600">(default)</span>}
                    </div>
                  ))}
                </td>
                <td className="px-4 py-3">
                  {p.productUnits.map((pu) => (
                    <div key={pu.id} className="text-xs text-gray-600">
                      {pu.stock} {pu.unit.abbreviation}
                    </div>
                  ))}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={p.isActive ? "default" : "secondary"}>
                    {p.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil size={15} /></Button>
                    <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(p.id, p.name)}><Trash2 size={15} /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-bold text-lg">{editing ? "Edit Produk" : "Tambah Produk"}</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Nama Produk *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama produk" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Deskripsi</label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi singkat" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Kategori</label>
                  <Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                    <option value="">Tanpa Kategori</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Status</label>
                  <Select value={form.isActive ? "1" : "0"} onChange={(e) => setForm({ ...form, isActive: e.target.value === "1" })}>
                    <option value="1">Aktif</option>
                    <option value="0">Nonaktif</option>
                  </Select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Harga & Satuan *</label>
                  <Button size="sm" variant="outline" onClick={addPuRow}><Plus size={13} /> Tambah</Button>
                </div>
                <div className="space-y-2">
                  {puRows.map((row, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Select className="flex-1" value={row.unitId} onChange={(e) => setPuRows(puRows.map((r, idx) => idx === i ? { ...r, unitId: e.target.value } : r))}>
                        <option value="">Pilih satuan</option>
                        {units.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>)}
                      </Select>
                      <Input className="w-28" type="number" placeholder="Harga" value={row.price} onChange={(e) => setPuRows(puRows.map((r, idx) => idx === i ? { ...r, price: e.target.value } : r))} />
                      <Input className="w-20" type="number" placeholder="Stok" value={row.stock} onChange={(e) => setPuRows(puRows.map((r, idx) => idx === i ? { ...r, stock: e.target.value } : r))} />
                      {i > 0 && <Button size="icon" variant="ghost" className="text-red-500" onClick={() => removePuRow(i)}><Trash2 size={14} /></Button>}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">Baris pertama otomatis jadi satuan default</p>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
              <Button onClick={handleSubmit} disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
