"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function StockOpnameActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const complete = async () => {
    if (!confirm("Selesaikan opname ini? Stok produk akan diupdate sesuai jumlah fisik.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/stock-opnames/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Gagal");
      toast.success("Opname selesai. Stok produk diperbarui.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyelesaikan");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm("Hapus opname ini? Tindakan ini tidak bisa dibatalkan.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/stock-opnames/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      toast.success("Opname dihapus");
      router.push("/admin/stock-opname");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {status === "draft" && (
        <>
          <Button size="sm" onClick={complete} disabled={busy}>
            <CheckCircle size={14} /> Selesaikan
          </Button>
          <Button size="sm" variant="destructive" onClick={remove} disabled={busy}>
            <Trash2 size={14} /> Hapus
          </Button>
        </>
      )}
    </div>
  );
}
