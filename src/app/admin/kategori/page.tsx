"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Category = { id: string; name: string };

export default function KategoriPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const fetch_ = () =>
    fetch("/api/categories").then((r) => r.json()).then(setCategories);

  useEffect(() => { fetch_(); }, []);

  const handleAdd = async () => {
    if (!name.trim()) return toast.error("Nama kategori wajib diisi");
    setLoading(true);
    const res = await fetch("/api/categories", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setLoading(false);
    if (res.ok) { toast.success("Kategori ditambahkan"); setName(""); fetch_(); }
    else toast.error("Gagal / nama sudah ada");
  };

  const handleDelete = async (id: string, n: string) => {
    if (!confirm(`Hapus kategori "${n}"?`)) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Dihapus"); fetch_(); }
    else toast.error("Gagal menghapus");
  };

  return (
    <div className="p-6 space-y-5 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kategori</h1>
        <p className="text-sm text-gray-500">{categories.length} kategori</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-3">
        <Input placeholder="Nama kategori baru" value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
        <Button onClick={handleAdd} disabled={loading}><Plus size={16} /> Tambah</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {categories.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Layers className="mx-auto mb-2" size={28} /> Belum ada kategori
          </div>
        ) : categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
            <span className="text-sm font-medium text-gray-800">{c.name}</span>
            <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700"
              onClick={() => handleDelete(c.id, c.name)}>
              <Trash2 size={15} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
