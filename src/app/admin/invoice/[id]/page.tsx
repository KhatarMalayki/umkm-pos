import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";
import { notFound } from "next/navigation";
import PrintButton from "./PrintButton";
import EditInvoiceItems from "./EditInvoiceItems";

const normalizeWhatsAppNumber = (raw?: string | null) => {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
};

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true, unit: true } },
      discount: true,
      invoice: true,
    },
  });

  if (!order || !order.invoice) return notFound();

  const inv = order.invoice;
  const settings = await prisma.storeSetting.findUnique({ where: { id: "main" } });

  const customerWa = normalizeWhatsAppNumber(order.customerPhone);
  const waText = [
    `Halo ${order.customerName},`,
    `Berikut detail invoice dari ${settings?.storeName || "Toko UMKM"}:`,
    `No Invoice: ${inv.invoiceNumber}`,
    `No Pesanan: ${order.orderNumber}`,
    `Total: ${formatRupiah(order.total)}`,
    order.paymentMethod === "transfer" && settings?.bankName && settings?.bankAccountNumber
      ? `Transfer ke ${settings.bankName} ${settings.bankAccountNumber} a.n ${settings.bankAccountHolder || settings.storeName || "Toko UMKM"}`
      : "",
    "Terima kasih 🙏",
  ]
    .filter(Boolean)
    .join("\n");
  const waHref = customerWa ? `https://wa.me/${customerWa}?text=${encodeURIComponent(waText)}` : null;

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Invoice Detail</h1>
          <div className="flex w-full sm:w-auto flex-wrap items-center gap-2 print:hidden">
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
              >
                Kirim WA
              </a>
            )}
            <PrintButton />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-none">
          {/* Header */}
          <div className="bg-emerald-600 text-white p-4 md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
              <div>
                <h2 className="text-xl md:text-2xl font-bold">INVOICE</h2>
                <p className="text-emerald-100 font-mono text-sm mt-1">{inv.invoiceNumber}</p>
              </div>
              <div className="text-left sm:text-right text-sm text-emerald-100">
                <p className="font-bold text-white text-lg">Toko UMKM</p>
                <p>Sistem Penjualan Digital</p>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-400 uppercase font-medium mb-1">Kepada</p>
              <p className="font-semibold text-gray-800">{order.customerName}</p>
              {order.customerPhone && <p className="text-sm text-gray-500">{order.customerPhone}</p>}
              {order.customerNote && <p className="text-sm text-gray-500 italic mt-1">&ldquo;{order.customerNote}&rdquo;</p>}
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-gray-400 uppercase font-medium mb-1">Detail Invoice</p>
              <p className="text-sm text-gray-700">No. Pesanan: <span className="font-mono">{order.orderNumber}</span></p>
              <p className="text-sm text-gray-700">
                Tanggal: {new Date(inv.issuedAt).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
              <p className="text-sm text-gray-700">
                Pembayaran: {order.paymentMethod === "cod" ? "Bayar di Tempat (COD)" : "Transfer Bank"}
              </p>
              {order.paymentMethod === "transfer" && settings?.bankName && settings?.bankAccountNumber && (
                <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-left">
                  <p className="text-xs text-emerald-700 font-semibold">Rekening Tujuan</p>
                  <p className="text-sm text-emerald-900 font-medium">
                    {settings.bankName} · {settings.bankAccountNumber}
                  </p>
                  <p className="text-xs text-emerald-700">
                    a.n. {settings.bankAccountHolder || settings.storeName || "Toko UMKM"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Items (editable to reduce qty) */}
          <EditInvoiceItems
            orderId={order.id}
            discountLabel={order.discount ? order.discount.code : null}
            discountValue={order.discountValue}
            subtotal={order.subtotal}
            total={order.total}
            items={order.items.map((item) => ({
              id: item.id,
              name: item.product.name,
              quantity: item.quantity,
              price: item.price,
              unitAbbr: item.unit.abbreviation,
              subtotal: item.subtotal,
            }))}
          />

          {/* Footer */}
          <div className="bg-gray-50 px-4 md:px-6 py-4 text-center text-xs text-gray-400">
            <p>Terima kasih telah berbelanja! Simpan invoice ini sebagai bukti pembayaran.</p>
            {order.paymentMethod === "transfer" && (
              <div className="mt-1 text-emerald-600 font-medium space-y-0.5">
                <p>Harap lakukan transfer sesuai total. Pesanan diproses setelah pembayaran dikonfirmasi.</p>
                {settings?.bankName && settings?.bankAccountNumber && (
                  <p className="text-emerald-700">
                    Rekening: {settings.bankName} {settings.bankAccountNumber} a.n. {settings.bankAccountHolder || settings.storeName || "Toko UMKM"}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
