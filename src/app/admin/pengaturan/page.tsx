"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Landmark, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type StoreSettings = {
  storeName: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  qrisImageUrl: string;
  whatsappNumber: string;
};

const initialForm: StoreSettings = {
  storeName: "Toko UMKM",
  bankName: "",
  bankAccountNumber: "",
  bankAccountHolder: "",
  qrisImageUrl: "",
  whatsappNumber: "",
};

export default function PengaturanPage() {
  const [form, setForm] = useState<StoreSettings>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/store-settings")
      .then((r) => r.json())
      .then((data) => {
        setForm({
          storeName: data.storeName ?? "Toko UMKM",
          bankName: data.bankName ?? "",
          bankAccountNumber: data.bankAccountNumber ?? "",
          bankAccountHolder: data.bankAccountHolder ?? "",
          qrisImageUrl: data.qrisImageUrl ?? "",
          whatsappNumber: data.whatsappNumber ?? "",
        });
      })
      .catch(() => toast.error("Gagal memuat pengaturan"))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!form.storeName.trim()) {
      toast.error("Nama toko wajib diisi");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/store-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error || "Gagal menyimpan pengaturan");
      return;
    }

    toast.success("Pengaturan berhasil disimpan");
  };

  if (loading) {
    return <div className="p-6 text-sm text-slate-500">Memuat pengaturan...</div>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pengaturan Toko</h1>
        <p className="text-sm text-slate-500 mt-1">
          Data ini dipakai untuk instruksi transfer, invoice, dan tombol kirim WhatsApp otomatis.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Profil Toko</h2>
        <div>
          <label className="text-xs text-slate-600 block mb-1">Nama Toko *</label>
          <Input
            value={form.storeName}
            onChange={(e) => setForm({ ...form, storeName: e.target.value })}
            placeholder="Nama toko"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-slate-700">
          <Landmark size={16} />
          <h2 className="text-sm font-semibold">Rekening Transfer</h2>
        </div>
        <div>
          <label className="text-xs text-slate-600 block mb-1">Nama Bank</label>
          <Input
            value={form.bankName}
            onChange={(e) => setForm({ ...form, bankName: e.target.value })}
            placeholder="BCA / BRI / Mandiri"
          />
        </div>
        <div>
          <label className="text-xs text-slate-600 block mb-1">Nomor Rekening</label>
          <Input
            value={form.bankAccountNumber}
            onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })}
            placeholder="1234567890"
          />
        </div>
        <div>
          <label className="text-xs text-slate-600 block mb-1">Atas Nama</label>
          <Input
            value={form.bankAccountHolder}
            onChange={(e) => setForm({ ...form, bankAccountHolder: e.target.value })}
            placeholder="TOKO UMKM"
          />
        </div>
        <div>
          <label className="text-xs text-slate-600 block mb-1">URL Gambar QRIS (opsional)</label>
          <Input
            value={form.qrisImageUrl}
            onChange={(e) => setForm({ ...form, qrisImageUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-slate-700">
          <MessageCircle size={16} />
          <h2 className="text-sm font-semibold">WhatsApp Admin</h2>
        </div>
        <div>
          <label className="text-xs text-slate-600 block mb-1">Nomor WhatsApp Admin</label>
          <Input
            value={form.whatsappNumber}
            onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
            placeholder="62812xxxxxx"
          />
          <p className="text-xs text-slate-400 mt-1">Format disarankan: 628xxxxxxxxxx</p>
        </div>
      </div>

      <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
        <Save size={14} /> {saving ? "Menyimpan..." : "Simpan Pengaturan"}
      </Button>
    </div>
  );
}
