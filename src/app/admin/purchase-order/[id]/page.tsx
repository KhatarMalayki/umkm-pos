import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import POStatusActions from "./POStatusActions";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

const statusCfg: Record<string, { label: string; bg: string; text: string }> = {
  draft:     { label: "Draft",      bg: "bg-gray-100",   text: "text-gray-700"   },
  submitted: { label: "Dikirim",    bg: "bg-yellow-100", text: "text-yellow-700" },
  approved:  { label: "Disetujui", bg: "bg-green-100",  text: "text-green-700"  },
  cancelled: { label: "Dibatalkan", bg: "bg-red-100",    text: "text-red-700"    },
};

export default async function PODetailPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      department: true,
      items: { include: { unit: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  if (!po) return notFound();

  const st = statusCfg[po.status] ?? statusCfg.draft;

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <Link href="/admin/purchase-order"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
            <ArrowLeft size={16} /> Kembali
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <POStatusActions id={po.id} status={po.status} />
            <PrintButton />
            {(po.status === "approved" || po.status === "cancelled") && (
              <Link href={`/admin/purchase-order/buat?reorder=${po.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                Reorder
              </Link>
            )}
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-none">
          {/* Header */}
          <div className="p-4 md:p-6 border-b border-gray-100" style={{ borderTop: `4px solid ${po.department?.color || "#22c55e"}` }}>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
              <div>
                <p className="text-xs text-gray-400 uppercase font-medium mb-1">Purchase Order</p>
                <h1 className="text-xl md:text-2xl font-bold font-mono text-gray-900 break-all">{po.poNumber}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-white px-2.5 py-1 rounded-full font-medium"
                    style={{ backgroundColor: po.department?.color || "#22c55e" }}>
                    {po.department?.name ?? "Umum"}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.bg} ${st.text}`}>
                    {st.label}
                  </span>
                </div>
              </div>
              <div className="text-left sm:text-right text-sm text-gray-500">
                <p className="font-medium text-gray-800">
                  {new Date(po.orderDate).toLocaleDateString("id-ID", {
                    weekday: "long", day: "2-digit", month: "long", year: "numeric",
                  })}
                </p>
                <p className="text-xs mt-0.5">{po.items.length} item</p>
              </div>
            </div>
            {po.note && (
              <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 italic">
                {po.note}
              </p>
            )}
          </div>

          {/* Items list */}
          <div className="p-4 md:p-6">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs text-gray-400 uppercase">
                    <th className="text-left pb-2 w-8">#</th>
                    <th className="text-left pb-2">Nama Item</th>
                    <th className="text-right pb-2 w-24">Qty</th>
                    <th className="text-left pb-2 w-24 pl-3">Satuan</th>
                    <th className="text-left pb-2 w-32 pl-3">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {po.items.map((item: { id: string; itemName: string; quantity: number; unit: { name: string } | null; customUnit: string | null; note: string | null }, idx: number) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 text-gray-300 text-xs">{idx + 1}</td>
                      <td className="py-2.5 font-medium text-gray-800">{item.itemName}</td>
                      <td className="py-2.5 text-right font-bold text-gray-900">
                        {item.quantity % 1 === 0
                          ? item.quantity
                          : item.quantity === 0.5 ? "½"
                          : item.quantity === 0.25 ? "¼"
                          : item.quantity === 0.75 ? "¾"
                          : item.quantity}
                      </td>
                      <td className="py-2.5 pl-3 text-gray-500">
                        {item.unit?.name ?? item.customUnit ?? "-"}
                      </td>
                      <td className="py-2.5 pl-3 text-gray-400 text-xs italic">
                        {item.note ?? ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 md:px-6 py-3 text-xs text-gray-400 text-center print:block">
            Dicetak: {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>
    </div>
  );
}
