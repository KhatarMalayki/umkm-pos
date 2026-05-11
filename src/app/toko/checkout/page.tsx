"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Trash2, Tag, ShoppingCart, CheckCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatRupiah } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import Link from "next/link";
import Image from "next/image";

type StoreSettings = {
  storeName: string;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountHolder?: string | null;
  qrisImageUrl?: string | null;
  whatsappNumber?: string | null;
};

const normalizeWhatsAppNumber = (raw?: string | null) => {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
};

export default function CheckoutPage() {
  const { items, updateQty, removeItem, clearCart, subtotal } = useCartStore();
  const [form, setForm] = useState({ customerName: "", customerPhone: "", customerNote: "", paymentMethod: "cod" });
  const [discountCode, setDiscountCode] = useState("");
  const [discount, setDiscount] = useState<{ id: string; code: string; type: string; value: number } | null>(null);
  const [discountValue, setDiscountValue] = useState(0);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  const sub = subtotal();
  const total = Math.max(0, sub - discountValue);

  useEffect(() => {
    fetch("/api/store-settings")
      .then((r) => r.json())
      .then((data) => setSettings(data))
      .catch(() => {});
  }, []);

  const adminWaLink = useMemo(() => {
    const wa = normalizeWhatsAppNumber(settings?.whatsappNumber);
    if (!wa) return null;

    const lines = [
      `Halo admin ${settings?.storeName ?? "Toko UMKM"},`,
      `Saya sudah buat pesanan ${orderId ? `#${orderId}` : ""}`.trim(),
      `Nama: ${form.customerName || "-"}`,
      `No HP: ${form.customerPhone || "-"}`,
      `Total: ${formatRupiah(total)}`,
      "Mohon konfirmasi pesanan ya.",
    ];

    return `https://wa.me/${wa}?text=${encodeURIComponent(lines.join("\n"))}`;
  }, [settings?.whatsappNumber, settings?.storeName, orderId, form.customerName, form.customerPhone, total]);

  const checkDiscount = async () => {
    if (!discountCode.trim()) return;
    setDiscountLoading(true);
    const res = await fetch("/api/discounts/check", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: discountCode, subtotal: sub }),
    });
    setDiscountLoading(false);
    const data = await res.json();
    if (res.ok) {
      setDiscount(data.discount);
      setDiscountValue(data.discountValue);
      toast.success(`Diskon ${data.discount.code} berhasil diterapkan!`);
    } else toast.error(data.error ?? "Kode tidak valid");
  };

  const handleSubmit = async () => {
    if (!form.customerName.trim()) { toast.error("Nama wajib diisi"); return; }
    if (items.length === 0) { toast.error("Keranjang kosong"); return; }
    setLoading(true);
    const res = await fetch("/api/orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        discountCode: discount?.code,
        items: items.map((i) => ({
          productId: i.productId, productUnitId: i.productUnitId,
          quantity: i.quantity, price: i.price,
        })),
      }),
    });
    setLoading(false);
    if (res.ok) {
      const order = await res.json();
      clearCart();
      setOrderId(order.id);
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Gagal membuat pesanan, coba lagi");
    }
  };

  if (orderId) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="text-emerald-600" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Pesanan Berhasil!</h2>
        <p className="text-gray-500 text-sm">Pesanan Anda telah kami terima. Kami akan segera memproses pesanan Anda.</p>
        <div className="flex flex-col gap-3 pt-4">
          <Link href={`/admin/invoice/${orderId}`}>
            <Button className="w-full">Lihat Invoice</Button>
          </Link>
          {adminWaLink && (
            <a href={adminWaLink} target="_blank" rel="noreferrer">
              <Button variant="outline" className="w-full">
                <MessageCircle size={14} /> Chat Admin via WhatsApp
              </Button>
            </a>
          )}
          <Link href="/toko">
            <Button variant="outline" className="w-full">Lanjut Belanja</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <ShoppingCart className="mx-auto text-gray-300" size={48} />
        <h2 className="text-xl font-semibold text-gray-600">Keranjang Kosong</h2>
        <Link href="/toko"><Button>Mulai Belanja</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Keranjang & Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        {/* Cart items */}
        <div className="md:col-span-3 space-y-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {items.map((item) => (
              <div key={item.productUnitId} className="p-4 flex gap-3 items-center">
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-800">{item.productName}</p>
                  <p className="text-xs text-gray-400">{formatRupiah(item.price)} / {item.unitAbbr}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.productUnitId, item.quantity - 1)}
                    className="w-7 h-7 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center hover:bg-gray-200 text-sm font-bold">−</button>
                  <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                  <button onClick={() => updateQty(item.productUnitId, item.quantity + 1)}
                    className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 text-sm font-bold">+</button>
                </div>
                <p className="w-24 text-right text-sm font-semibold text-emerald-700">
                  {formatRupiah(item.price * item.quantity)}
                </p>
                <button onClick={() => removeItem(item.productUnitId)} className="text-red-400 hover:text-red-600">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {/* Discount */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1"><Tag size={14} /> Kode Diskon</p>
            <div className="flex gap-2">
              <Input placeholder="Masukkan kode diskon" value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                disabled={!!discount} />
              {discount ? (
                <Button variant="outline" onClick={() => { setDiscount(null); setDiscountValue(0); setDiscountCode(""); }}>Hapus</Button>
              ) : (
                <Button variant="outline" onClick={checkDiscount} disabled={discountLoading}>
                  {discountLoading ? "..." : "Pakai"}
                </Button>
              )}
            </div>
            {discount && (
              <p className="text-xs text-emerald-600 mt-1">✓ Diskon {discount.code} diterapkan — hemat {formatRupiah(discountValue)}</p>
            )}
          </div>
        </div>

        {/* Form + summary */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <h2 className="font-semibold text-gray-800 text-sm">Data Pemesan</h2>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Nama *</label>
              <Input placeholder="Nama lengkap" value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">No. HP</label>
              <Input placeholder="08xx-xxxx-xxxx" value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Catatan</label>
              <Input placeholder="Catatan untuk penjual" value={form.customerNote}
                onChange={(e) => setForm({ ...form, customerNote: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Metode Pembayaran *</label>
              <Select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                <option value="cod">Bayar di Tempat (COD)</option>
                <option value="transfer">QRIS</option>
              </Select>
            </div>
            {form.paymentMethod === "transfer" && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-1">
                <p className="text-xs font-semibold text-emerald-700">Info Pembayaran QRIS</p>
                {settings?.qrisImageUrl ? (
                  <div className="space-y-2">
                    <Image
                      src={settings.qrisImageUrl}
                      alt="QRIS"
                      width={208}
                      height={208}
                      className="w-52 max-w-full rounded-lg border border-emerald-200 bg-white"
                    />
                    <p className="text-xs text-emerald-700">Silakan scan QRIS di atas.</p>
                    <p className="text-xs text-emerald-700">Nominal: {formatRupiah(total)}</p>
                  </div>
                ) : settings?.bankName && settings?.bankAccountNumber ? (
                  <>
                    <p className="text-xs text-emerald-700">QRIS belum diatur, gunakan transfer bank:</p>
                    <p className="text-sm text-emerald-900 font-medium">
                      {settings.bankName} · {settings.bankAccountNumber}
                    </p>
                    <p className="text-xs text-emerald-700">a.n. {settings.bankAccountHolder || settings.storeName || "Toko UMKM"}</p>
                    <p className="text-xs text-emerald-700">Nominal: {formatRupiah(total)}</p>
                  </>
                ) : (
                  <p className="text-xs text-amber-700">QRIS belum diset. Hubungi admin untuk instruksi pembayaran.</p>
                )}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
            <h2 className="font-semibold text-gray-800 text-sm">Ringkasan</h2>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal ({items.length} item)</span>
              <span>{formatRupiah(sub)}</span>
            </div>
            {discountValue > 0 && (
              <div className="flex justify-between text-sm text-red-500">
                <span>Diskon</span>
                <span>- {formatRupiah(discountValue)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-emerald-700 border-t border-gray-100 pt-2">
              <span>Total</span>
              <span>{formatRupiah(total)}</span>
            </div>
            <Button className="w-full mt-1" onClick={handleSubmit} disabled={loading}>
              {loading ? "Memproses..." : "Pesan Sekarang"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
