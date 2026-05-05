"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ShoppingCart, Eye, ChevronDown, Search, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";
import Link from "next/link";

type OrderItem = { id: string; quantity: number; price: number; subtotal: number; product: { name: string }; unit: { abbreviation: string } };
type Order = {
  id: string; orderNumber: string; customerName: string; customerPhone: string | null;
  paymentMethod: string; status: string; subtotal: number; discountValue: number; total: number;
  createdAt: string; items: OrderItem[]; invoice: { invoiceNumber: string } | null;
};

type StoreSettings = {
  storeName?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountHolder?: string | null;
};

const normalizeWhatsAppNumber = (raw?: string | null) => {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "warning" | "info" | "success" | "destructive" }> = {
  pending:    { label: "Pending",      variant: "warning" },
  confirmed:  { label: "Dikonfirmasi", variant: "info" },
  processing: { label: "Diproses",     variant: "info" },
  done:       { label: "Selesai",      variant: "success" },
  cancelled:  { label: "Dibatalkan",   variant: "destructive" },
};

const nextStatus: Record<string, string> = {
  pending: "confirmed", confirmed: "processing", processing: "done",
};

export default function PesananPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (search) params.set("search", search);
    const data = await fetch(`/api/orders?${params}`).then((r) => r.json());
    setOrders(data);
  }, [filterStatus, search]);

  useEffect(() => { fetch_(); }, [fetch_]);

  useEffect(() => {
    fetch("/api/store-settings")
      .then((r) => r.json())
      .then((data) => setSettings(data))
      .catch(() => {});
  }, []);

  const openWhatsAppByStatus = (order: Order, forcedStatus?: string) => {
    const wa = normalizeWhatsAppNumber(order.customerPhone);
    if (!wa) {
      toast.error("Nomor WhatsApp customer belum ada");
      return;
    }

    const status = forcedStatus ?? order.status;
    const statusLabel = statusConfig[status]?.label ?? status;
    const storeName = settings?.storeName || "Toko UMKM";

    const templates: Record<string, string[]> = {
      pending: [
        `Halo ${order.customerName},`,
        `Pesanan ${order.orderNumber} sudah kami terima ✅`,
        "Saat ini status: Pending (menunggu konfirmasi admin).",
      ],
      confirmed: [
        `Halo ${order.customerName},`,
        `Pesanan ${order.orderNumber} sudah kami KONFIRMASI ✅`,
        "Pesanan segera kami siapkan.",
      ],
      processing: [
        `Halo ${order.customerName},`,
        `Pesanan ${order.orderNumber} sedang DIPROSES 👨‍🍳`,
        "Mohon ditunggu sebentar ya.",
      ],
      done: [
        `Halo ${order.customerName},`,
        `Pesanan ${order.orderNumber} sudah SELESAI 🎉`,
        "Terima kasih sudah berbelanja.",
      ],
      cancelled: [
        `Halo ${order.customerName},`,
        `Mohon maaf, pesanan ${order.orderNumber} dibatalkan.`,
        "Jika ada pertanyaan, silakan balas chat ini.",
      ],
    };

    const lines = [
      ...(templates[status] ?? [
        `Halo ${order.customerName},`,
        `Status pesanan ${order.orderNumber}: ${statusLabel}`,
      ]),
      `Total: ${formatRupiah(order.total)}`,
      order.invoice ? `No Invoice: ${order.invoice.invoiceNumber}` : "",
      order.paymentMethod === "transfer" && settings?.bankName && settings?.bankAccountNumber
        ? `Pembayaran transfer ke ${settings.bankName} ${settings.bankAccountNumber} a.n ${settings.bankAccountHolder || storeName}`
        : "",
      `- ${storeName}`,
    ]
      .filter(Boolean)
      .join("\n");

    const href = `https://wa.me/${wa}?text=${encodeURIComponent(lines)}`;
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const updateStatus = async (id: string, status: string, sendWA = false) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updatedOrder: Order = await res.json();
      toast.success("Status diperbarui");
      if (sendWA) openWhatsAppByStatus(updatedOrder, status);
      fetch_();
    } else toast.error("Gagal update status");
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pesanan</h1>
        <p className="text-sm text-gray-500">{orders.length} pesanan ditemukan</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input className="pl-9" placeholder="Cari no. pesanan / nama..." value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select className="w-full sm:w-40" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Semua Status</option>
          {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </Select>
      </div>

      <div className="space-y-3">
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-gray-400">
            <ShoppingCart className="mx-auto mb-2" size={32} /> Belum ada pesanan
          </div>
        ) : orders.map((o) => {
          const st = statusConfig[o.status] ?? statusConfig.pending;
          const next = nextStatus[o.status];
          const isExpanded = expanded === o.id;

          return (
            <div key={o.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <button onClick={() => setExpanded(isExpanded ? null : o.id)} className="text-gray-400 hover:text-gray-700 pt-0.5">
                      <ChevronDown size={18} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                    <div className="min-w-0">
                      <p className="font-mono font-semibold text-sm text-gray-800 break-all">{o.orderNumber}</p>
                      <p className="text-xs text-gray-500 leading-relaxed break-words">
                        {o.customerName} · {o.paymentMethod === "cod" ? "COD" : "Transfer"} ·{" "}
                        {new Date(o.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-emerald-700 text-sm md:text-base">{formatRupiah(o.total)}</p>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {next && (
                    <Button size="sm" onClick={() => updateStatus(o.id, next)}>
                      {statusConfig[next].label} →
                    </Button>
                  )}
                  {next && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(o.id, next, true)}>
                      <MessageCircle size={14} /> Update + WA
                    </Button>
                  )}
                  {o.status === "pending" && (
                    <Button size="sm" variant="destructive" onClick={() => updateStatus(o.id, "cancelled")}>Batalkan</Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => openWhatsAppByStatus(o)}>
                    <MessageCircle size={14} /> WA
                  </Button>
                  {o.invoice && (
                    <Link href={`/admin/invoice/${o.id}`}>
                      <Button size="sm" variant="outline"><Eye size={14} /> Invoice</Button>
                    </Link>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-100 p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-sm">
                      <thead className="text-xs text-gray-500">
                        <tr>
                          <th className="text-left pb-2">Produk</th>
                          <th className="text-right pb-2">Qty</th>
                          <th className="text-right pb-2">Harga</th>
                          <th className="text-right pb-2">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {o.items.map((item) => (
                          <tr key={item.id}>
                            <td className="py-1.5 text-gray-700">{item.product.name}</td>
                            <td className="py-1.5 text-right text-gray-600">{item.quantity} {item.unit.abbreviation}</td>
                            <td className="py-1.5 text-right text-gray-600">{formatRupiah(item.price)}</td>
                            <td className="py-1.5 text-right font-medium">{formatRupiah(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="border-t border-gray-200 text-sm">
                        <tr>
                          <td colSpan={3} className="pt-2 text-gray-500">Subtotal</td>
                          <td className="pt-2 text-right">{formatRupiah(o.subtotal)}</td>
                        </tr>
                        {o.discountValue > 0 && (
                          <tr>
                            <td colSpan={3} className="text-red-500">Diskon</td>
                            <td className="text-right text-red-500">- {formatRupiah(o.discountValue)}</td>
                          </tr>
                        )}
                        <tr className="font-bold text-emerald-700">
                          <td colSpan={3} className="pt-1">Total</td>
                          <td className="pt-1 text-right">{formatRupiah(o.total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
