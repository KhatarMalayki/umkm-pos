"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Save, Undo2 } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type EditableItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  unitAbbr: string;
  subtotal: number;
};

type Props = {
  orderId: string;
  items: EditableItem[];
  discountLabel: string | null;
  discountValue: number;
  subtotal: number;
  total: number;
};

export default function EditInvoiceItems({ orderId, items, discountLabel, discountValue, subtotal, total }: Props) {
  const [draft, setDraft] = useState(() => items.map((i) => ({ ...i })));
  const [isPending, startTransition] = useTransition();

  const handleQtyChange = (id: string, qty: number) => {
    const safe = Math.max(0, qty);
    setDraft((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: safe, subtotal: safe * i.price } : i)));
  };

  const handleReset = () => setDraft(items.map((i) => ({ ...i })));

  const handleSave = () => {
    startTransition(async () => {
      const changed = draft
        .filter((d) => {
          const original = items.find((o) => o.id === d.id);
          return original && d.quantity !== original.quantity;
        })
        .map((d) => ({ id: d.id, quantity: Number(d.quantity) || 0 }));

      if (changed.length === 0) {
        toast.info("Tidak ada perubahan qty");
        return;
      }

      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: changed }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Gagal menyimpan perubahan");
        return;
      }

      toast.success("Invoice diperbarui");
      window.location.reload();
    });
  };

  const draftSubtotal = draft.reduce((acc, i) => acc + i.subtotal, 0);
  const draftTotal = Math.max(0, draftSubtotal - discountValue);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase">
              <th className="text-left pb-3">Produk</th>
              <th className="text-right pb-3">Qty</th>
              <th className="text-right pb-3">Harga</th>
              <th className="text-right pb-3">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {draft.map((item) => (
              <tr key={item.id} className="border-b border-gray-50">
                <td className="py-3 text-gray-800">{item.name}</td>
                <td className="py-3 text-right text-gray-600">
                  <div className="flex items-center justify-end gap-2">
                    <input
                      type="number"
                      min={0}
                      max={items.find((o) => o.id === item.id)?.quantity ?? item.quantity}
                      value={item.quantity}
                      onChange={(e) => handleQtyChange(item.id, Number(e.target.value))}
                      className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-right text-sm"
                    />
                    <span className="text-xs text-gray-500">{item.unitAbbr}</span>
                  </div>
                </td>
                <td className="py-3 text-right text-gray-600">{formatRupiah(item.price)}</td>
                <td className="py-3 text-right font-medium">{formatRupiah(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={isPending}>
            <Undo2 size={16} /> Reset
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Simpan
          </Button>
        </div>
        <div className="w-full md:w-auto">
          <div className="w-full max-w-72 ml-auto space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatRupiah(draftSubtotal)}</span>
            </div>
            {discountValue > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Diskon {discountLabel ? `(${discountLabel})` : ""}</span>
                <span>- {formatRupiah(discountValue)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-emerald-700 border-t border-gray-200 pt-2">
              <span>Total</span>
              <span>{formatRupiah(draftTotal)}</span>
            </div>
            {(draftSubtotal !== subtotal || draftTotal !== total) && (
              <p className="text-[11px] text-amber-600">Perubahan akan menyesuaikan total & stok.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
