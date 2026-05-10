import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";
import { FileText, Eye } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function InvoiceListPage() {
  const invoices = await prisma.invoice.findMany({
    include: { order: { include: { items: true } } },
    orderBy: { issuedAt: "desc" },
  });

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Invoice</h1>
        <p className="text-sm text-gray-500">{invoices.length} invoice</p>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-gray-400">
          <FileText className="mx-auto mb-2" size={28} /> Belum ada invoice
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {invoices.map((inv) => (
              <div key={inv.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wide text-gray-400">No. Invoice</p>
                    <p className="font-mono font-semibold text-sm text-emerald-700 break-all">{inv.invoiceNumber}</p>
                  </div>
                  <Link
                    href={`/admin/invoice/${inv.order.id}`}
                    className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium whitespace-nowrap"
                  >
                    <Eye size={13} /> Lihat
                  </Link>
                </div>
                <div className="text-xs text-gray-600 space-y-1.5">
                  <p>
                    <span className="text-gray-400">Pesanan:</span>{" "}
                    <span className="font-mono">{inv.order.orderNumber}</span>
                  </p>
                  <p className="truncate"><span className="text-gray-400">Customer:</span> {inv.order.customerName}</p>
                  <p>
                    <span className="text-gray-400">Pembayaran:</span>{" "}
                    <span className={inv.order.paymentMethod === "cod" ? "font-medium text-blue-600" : "font-medium text-amber-600"}>
                      {inv.order.paymentMethod === "cod" ? "COD" : "Transfer"}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-400">Tanggal:</span>{" "}
                    {new Date(inv.issuedAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                <p className="font-semibold text-emerald-700">{formatRupiah(inv.order.total)}</p>
              </div>
            ))}
          </div>

          <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[760px]">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">No. Invoice</th>
                    <th className="px-4 py-3 text-left">No. Pesanan</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Pembayaran</th>
                    <th className="px-4 py-3 text-left">Tanggal</th>
                    <th className="px-4 py-3 text-left">Total</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-semibold text-emerald-700">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 font-mono text-gray-600">{inv.order.orderNumber}</td>
                      <td className="px-4 py-3 text-gray-700">{inv.order.customerName}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${inv.order.paymentMethod === "cod" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>
                          {inv.order.paymentMethod === "cod" ? "COD" : "Transfer"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(inv.issuedAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-700">{formatRupiah(inv.order.total)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/invoice/${inv.order.id}`}
                          className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline"
                        >
                          <Eye size={13} /> Lihat
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
