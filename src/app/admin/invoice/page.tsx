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
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Invoice</h1>
        <p className="text-sm text-gray-500">{invoices.length} invoice</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">No. Invoice</th>
              <th className="px-4 py-3 text-left">No. Pesanan</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Tanggal</th>
              <th className="px-4 py-3 text-left">Total</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {invoices.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                <FileText className="mx-auto mb-2" size={28} /> Belum ada invoice
              </td></tr>
            ) : invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-semibold text-emerald-700">{inv.invoiceNumber}</td>
                <td className="px-4 py-3 font-mono text-gray-600">{inv.order.orderNumber}</td>
                <td className="px-4 py-3 text-gray-700">{inv.order.customerName}</td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(inv.issuedAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3 font-semibold text-emerald-700">{formatRupiah(inv.order.total)}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/invoice/${inv.order.id}`}
                    className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline">
                    <Eye size={13} /> Lihat
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
