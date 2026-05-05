"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical, ArrowLeft, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import Link from "next/link";

type Department = { id: string; name: string; color: string };
type Unit = { id: string; name: string; abbreviation: string };
type POItem = {
  itemName: string; quantity: string; unitId: string; customUnit: string; note: string;
};

const emptyItem = (): POItem => ({ itemName: "", quantity: "", unitId: "", customUnit: "", note: "" });

function BuatPOForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reorderId = searchParams.get("reorder");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [items, setItems] = useState<POItem[]>([emptyItem()]);
  const [loading, setLoading] = useState(false);
  const [loadingReorder, setLoadingReorder] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/departments").then((r) => r.json()),
      fetch("/api/units").then((r) => r.json()),
    ]).then(([d, u]) => { setDepartments(d); setUnits(u); });
  }, []);

  // Reorder: load previous PO items
  useEffect(() => {
    if (!reorderId) return;
    setLoadingReorder(true);
    fetch(`/api/purchase-orders/${reorderId}`)
      .then((r) => r.json())
      .then((po) => {
        setDepartmentId(po.departmentId);
        setNote(po.note ?? "");
        setItems(
          po.items.map((i: { itemName: string; quantity: number; unitId?: string; customUnit?: string; note?: string }) => ({
            itemName: i.itemName,
            quantity: String(i.quantity),
            unitId: i.unitId ?? "",
            customUnit: i.customUnit ?? "",
            note: i.note ?? "",
          }))
        );
        toast.success("Data dari PO sebelumnya berhasil dimuat");
      })
      .finally(() => setLoadingReorder(false));
  }, [reorderId]);

  const updateItem = (i: number, field: keyof POItem, value: string) => {
    setItems((prev) => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  // Quick-paste multi-line items (like from WA message)
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text");
    const lines = text.split("\n")
      .map((l) => l.replace(/^[-•·*]\s*/, "").trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    const parsed: POItem[] = lines.map((line) => {
      // Try to parse "Nama produk qty satuan" format
      // e.g. "Daun selada ½", "Tempe 2 kg", "Bayam 4 Ikat"
      const match = line.match(/^(.+?)\s+([\d½¼¾⅓⅔⅛⅜⅝⅞]+\.?\d*)\s*(.*)$/);
      if (match) {
        const rawQty = match[2]
          .replace("½", "0.5").replace("¼", "0.25").replace("¾", "0.75")
          .replace("⅓", "0.33").replace("⅔", "0.67");
        const unitName = match[3].trim();
        const unit = units.find((u) =>
          u.name.toLowerCase() === unitName.toLowerCase() ||
          u.abbreviation.toLowerCase() === unitName.toLowerCase()
        );
        return {
          itemName: match[1].trim(),
          quantity: rawQty,
          unitId: unit?.id ?? "",
          customUnit: unit ? "" : unitName,
          note: "",
        };
      }
      return { ...emptyItem(), itemName: line };
    });

    setItems((prev) => {
      const filtered = prev.filter((i) => i.itemName.trim() !== "");
      return [...filtered, ...parsed];
    });
    toast.success(`${parsed.length} item berhasil di-paste`);
  };

  const handleSubmit = async (asDraft = true) => {
    if (!departmentId) { toast.error("Pilih departemen"); return; }
    const validItems = items.filter((i) => i.itemName.trim() && i.quantity);
    if (validItems.length === 0) { toast.error("Minimal 1 item"); return; }

    setLoading(true);
    const res = await fetch("/api/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        departmentId, orderDate, note,
        items: validItems.map((i, idx) => ({
          itemName: i.itemName.trim(),
          quantity: parseFloat(i.quantity) || 0,
          unitId: i.unitId || null,
          customUnit: !i.unitId && i.customUnit ? i.customUnit : null,
          note: i.note || null,
          sortOrder: idx,
        })),
      }),
    });
    setLoading(false);

    if (res.ok) {
      const po = await res.json();
      if (!asDraft) {
        await fetch(`/api/purchase-orders/${po.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "submitted" }),
        });
      }
      toast.success(asDraft ? "PO tersimpan sebagai draft" : "PO dikirim!");
      router.push("/admin/purchase-order");
    } else toast.error("Gagal menyimpan PO");
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-start gap-3">
        <Link href="/admin/purchase-order">
          <Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {reorderId ? "Reorder — Buat PO Baru" : "Buat Purchase Order"}
          </h1>
          <p className="text-sm text-gray-500">Orderan belanja harian</p>
        </div>
      </div>

      {loadingReorder && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-700">
          Memuat data PO sebelumnya...
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Departemen *</label>
          <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
            <option value="">Pilih departemen...</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Tanggal Order *</label>
          <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Catatan</label>
          <Input placeholder="Catatan tambahan..." value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>

      {/* Quick Paste Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
          ⚡ Quick Paste dari WA / Catatan
        </p>
        <p className="text-xs text-amber-600">
          Paste list orderan langsung dari WA. Format: <code>Nama produk qty satuan</code> (1 baris = 1 item)
        </p>
        <textarea
          className="w-full h-24 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
          placeholder={"- Daun selada ½\n- Bayam 4 Ikat\n- Tomat 1 kg\n(paste list WA di sini lalu tekan Ctrl+V)"}
          onPaste={handlePaste}
          readOnly
        />
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 md:px-5 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="font-semibold text-gray-800 text-sm">Daftar Item ({items.filter(i => i.itemName).length})</h2>
          <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={addItem}><Plus size={14} /> Tambah Baris</Button>
        </div>

        <div className="p-3 space-y-2">
          {/* Header */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-2 text-xs font-medium text-gray-400 uppercase">
            <div className="sm:col-span-1" />
            <div className="sm:col-span-4">Nama Item</div>
            <div className="sm:col-span-2">Qty</div>
            <div className="sm:col-span-3">Satuan</div>
            <div className="sm:col-span-2">Catatan</div>
          </div>

          {items.map((row, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center group border border-gray-100 rounded-xl p-3 sm:p-0 sm:border-0 sm:rounded-none">
              <div className="hidden sm:flex sm:col-span-1 items-center justify-center text-gray-300 group-hover:text-gray-400">
                <GripVertical size={14} />
              </div>
              <div className="sm:col-span-4">
                <Input
                  placeholder="Nama produk..."
                  value={row.itemName}
                  onChange={(e) => updateItem(i, "itemName", e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  type="number" step="0.25" min="0"
                  placeholder="0"
                  value={row.quantity}
                  onChange={(e) => updateItem(i, "quantity", e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="sm:col-span-3">
                {row.unitId || !row.customUnit ? (
                  <Select
                    value={row.unitId}
                    onChange={(e) => updateItem(i, "unitId", e.target.value)}
                    className="text-sm"
                  >
                    <option value="">Satuan...</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>
                    ))}
                    <option value="__custom">+ Custom</option>
                  </Select>
                ) : (
                  <div className="flex gap-1">
                    <Input
                      placeholder="Satuan custom"
                      value={row.customUnit}
                      onChange={(e) => updateItem(i, "customUnit", e.target.value)}
                      className="text-sm"
                    />
                    <button onClick={() => updateItem(i, "customUnit", "")} className="text-xs text-gray-400 hover:text-gray-600 px-1">×</button>
                  </div>
                )}
              </div>
              <div className="sm:col-span-1">
                <Input
                  placeholder="Catatan"
                  value={row.note}
                  onChange={(e) => updateItem(i, "note", e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="sm:col-span-1 flex justify-end">
                {items.length > 1 && (
                  <button onClick={() => removeItem(i)}
                    className="text-red-400 hover:text-red-600 p-1 rounded">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
        <Link href="/admin/purchase-order">
          <Button variant="outline" className="w-full sm:w-auto">Batal</Button>
        </Link>
        <Button className="w-full sm:w-auto" variant="secondary" onClick={() => handleSubmit(true)} disabled={loading}>
          <Save size={15} /> Simpan Draft
        </Button>
        <Button className="w-full sm:w-auto" onClick={() => handleSubmit(false)} disabled={loading}>
          <Send size={15} /> {loading ? "Menyimpan..." : "Simpan & Kirim"}
        </Button>
      </div>
    </div>
  );
}

export default function BuatPOPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">Memuat...</div>}>
      <BuatPOForm />
    </Suspense>
  );
}
