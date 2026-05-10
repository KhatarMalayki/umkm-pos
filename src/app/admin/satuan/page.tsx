"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Tag, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

type Unit = { id: string; name: string; abbreviation: string };

export default function SatuanPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [form, setForm] = useState({ name: "", abbreviation: "" });
  const [loading, setLoading] = useState(false);

  const fetch_ = () => fetch("/api/units").then((r) => r.json()).then(setUnits);
  useEffect(() => { fetch_(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.abbreviation) return toast.error("Semua field wajib diisi");
    setLoading(true);
    const res = await fetch("/api/units", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) { toast.success("Satuan ditambahkan"); setForm({ name: "", abbreviation: "" }); fetch_(); }
    else toast.error("Gagal / nama sudah ada");
  };

  const handleDelete = async (id: string, n: string) => {
    if (!confirm(`Hapus satuan "${n}"?`)) return;
    const res = await fetch(`/api/units/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Dihapus"); fetch_(); }
    else toast.error("Gagal menghapus");
  };

  return (
    <div className="p-6 space-y-5 max-w-lg">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-1">
          <ArrowLeft size={14} /> Kembali
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Satuan</h1>
        <p className="text-sm text-gray-500">{units.length} satuan terdaftar</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Nama Satuan</label>
            <Input placeholder="cth: Kilogram" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Singkatan</label>
            <Input placeholder="cth: kg" value={form.abbreviation} onChange={(e) => setForm({ ...form, abbreviation: e.target.value })} />
          </div>
        </div>
        <Button className="w-full" onClick={handleAdd} disabled={loading}><Plus size={16} /> Tambah Satuan</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Nama</th>
              <th className="px-4 py-3 text-left">Singkatan</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {units.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                <Tag className="mx-auto mb-2" size={24} /> Belum ada satuan
              </td></tr>
            ) : units.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                <td className="px-4 py-3 text-gray-500">{u.abbreviation}</td>
                <td className="px-4 py-3 text-right">
                  <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDelete(u.id, u.name)}>
                    <Trash2 size={14} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
