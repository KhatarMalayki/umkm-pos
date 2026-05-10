"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ToggleLeft, ToggleRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";
import Link from "next/link";

type Discount = {
  id: string; code: string; type: string; value: number;
  minOrder: number; isActive: boolean; expiredAt: string | null; createdAt: string;
};

const emptyForm = { code: "", type: "percent", value: "", minOrder: "0", expiredAt: "" };

export default function DiskonPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const fetch_ = () => fetch("/api/discounts").then((r) => r.json()).then(setDiscounts);
  useEffect(() => { fetch_(); }, []);

  const handleAdd = async () => {
    if (!form.code || !form.value) return toast.error("Lengkapi data diskon");
    setLoading(true);
    const res = await fetch("/api/discounts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code, type: form.type,
        value: Number(form.value), minOrder: Number(form.minOrder),
        expiredAt: form.expiredAt || null,
      }),
    });
    setLoading(false);
    if (res.ok) { toast.success("Diskon ditambahkan"); setForm(emptyForm); fetch_(); }
    else toast.error("Gagal / kode sudah ada");
  };

  const toggleActive = async (d: Discount) => {
    await fetch(`/api/discounts/${d.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !d.isActive }),
    });
    fetch_();
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Hapus diskon "${code}"?`)) return;
    const res = await fetch(`/api/discounts/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Diskon dihapus"); fetch_(); }
    else toast.error("Gagal menghapus");
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-1">
          <ArrowLeft size={14} /> Kembali
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Diskon</h1>
        <p className="text-sm text-gray-500">{discounts.length} kode diskon</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">Tambah Kode Diskon</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Kode *</label>
            <Input placeholder="HEMAT10" value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Tipe *</label>
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="percent">Persen (%)</option>
              <option value="nominal">Nominal (Rp)</option>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Nilai *</label>
            <Input type="number" placeholder={form.type === "percent" ? "10" : "20000"}
              value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Min. Order (Rp)</label>
            <Input type="number" placeholder="0" value={form.minOrder}
              onChange={(e) => setForm({ ...form, minOrder: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Kadaluarsa</label>
            <Input type="date" value={form.expiredAt}
              onChange={(e) => setForm({ ...form, expiredAt: e.target.value })} />
          </div>
        </div>
        <Button onClick={handleAdd} disabled={loading}><Plus size={16} /> Tambah Diskon</Button>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Kode</th>
              <th className="px-4 py-3 text-left">Tipe</th>
              <th className="px-4 py-3 text-left">Nilai</th>
              <th className="px-4 py-3 text-left">Min. Order</th>
              <th className="px-4 py-3 text-left">Kadaluarsa</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {discounts.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-semibold text-emerald-700">{d.code}</td>
                <td className="px-4 py-3 text-gray-600">{d.type === "percent" ? "Persen" : "Nominal"}</td>
                <td className="px-4 py-3">{d.type === "percent" ? `${d.value}%` : formatRupiah(d.value)}</td>
                <td className="px-4 py-3 text-gray-600">{d.minOrder > 0 ? formatRupiah(d.minOrder) : "-"}</td>
                <td className="px-4 py-3 text-gray-600">
                  {d.expiredAt ? new Date(d.expiredAt).toLocaleDateString("id-ID") : "Tidak ada"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={d.isActive ? "default" : "secondary"}>{d.isActive ? "Aktif" : "Nonaktif"}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <Button size="icon" variant="ghost" onClick={() => toggleActive(d)}>
                      {d.isActive ? <ToggleRight size={18} className="text-emerald-600" /> : <ToggleLeft size={18} className="text-gray-400" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDelete(d.id, d.code)}>
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
