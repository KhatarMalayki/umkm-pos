import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import StockOpnameActions from "./StockOpnameActions";

export const dynamic = "force-dynamic";

const statusCfg: Record<string, { label: string; bg: string; text: string }> = {
  draft:     { label: "Draft",     bg: "bg-yellow-100", text: "text-yellow-700" },
  completed: { label: "Selesai",   bg: "bg-green-100",  text: "text-green-700"  },
};

export default async function StockOpnameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const op = await prisma.stockOpname.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true,
          unit: true,
        },
      },
    },
  });

  if (!op) return notFound();

  const st = statusCfg[op.status] ?? statusCfg.draft;
  const surplus = op.items.reduce((s, it) => s + (it.difference > 0 ? it.difference : 0), 0);
  const deficit = op.items.reduce((s, it) => s + (it.difference < 0 ? Math.abs(it.difference) : 0), 0);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/admin/stock-opname"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={16} /> Kembali
        </Link>
        <StockOpnameActions id={op.id} status={op.status} />
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-100" style={{ borderTop: "4px solid #10b981" }}>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
            <div>
              <p className="text-xs text-slate-400 uppercase font-medium mb-1 flex items-center gap-1.5">
                <ClipboardCheck size={12} />
                Stock Opname
              </p>
              <h1 className="text-xl md:text-2xl font-bold font-mono text-slate-900 break-all">
                SO-{op.id.slice(-8).toUpperCase()}
              </h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.bg} ${st.text}`}>
                  {st.label}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-600">
                  {op.items.length} item
                </span>
              </div>
            </div>
            <div className="text-left sm:text-right text-sm text-slate-500">
              <p className="font-medium text-slate-800">
                {new Date(op.date).toLocaleDateString("id-ID", {
                  weekday: "long", day: "2-digit", month: "long", year: "numeric",
                })}
              </p>
            </div>
          </div>
          {op.note && (
            <p className="mt-3 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 italic">
              {op.note}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 border-b border-slate-100">
          <div className="p-3 md:p-4 text-center">
            <p className="text-[10px] uppercase font-semibold text-slate-400">Surplus</p>
            <p className="text-base md:text-lg font-bold text-emerald-600 tabular-nums">+{surplus}</p>
          </div>
          <div className="p-3 md:p-4 text-center border-x border-slate-100">
            <p className="text-[10px] uppercase font-semibold text-slate-400">Defisit</p>
            <p className="text-base md:text-lg font-bold text-red-600 tabular-nums">-{deficit}</p>
          </div>
          <div className="p-3 md:p-4 text-center">
            <p className="text-[10px] uppercase font-semibold text-slate-400">Net</p>
            <p className="text-base md:text-lg font-bold text-slate-700 tabular-nums">{surplus - deficit > 0 ? "+" : ""}{surplus - deficit}</p>
          </div>
        </div>

        {/* Items */}
        <div className="p-4 md:p-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-400 uppercase">
                  <th className="text-left pb-2 w-8">#</th>
                  <th className="text-left pb-2">Produk</th>
                  <th className="text-left pb-2 w-24">Satuan</th>
                  <th className="text-right pb-2 w-20">Sistem</th>
                  <th className="text-right pb-2 w-20">Fisik</th>
                  <th className="text-right pb-2 w-20">Selisih</th>
                  <th className="text-left pb-2 w-32 pl-3">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {op.items.map((it, idx) => (
                  <tr key={it.id} className="border-b border-slate-50">
                    <td className="py-2.5 text-slate-300 text-xs">{idx + 1}</td>
                    <td className="py-2.5 font-medium text-slate-800">{it.product.name}</td>
                    <td className="py-2.5 text-slate-500">{it.unit.name}</td>
                    <td className="py-2.5 text-right font-mono text-slate-700">{it.systemStock}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-900">{it.actualStock}</td>
                    <td
                      className={`py-2.5 text-right font-mono font-bold ${
                        it.difference > 0
                          ? "text-emerald-600"
                          : it.difference < 0
                          ? "text-red-600"
                          : "text-slate-400"
                      }`}
                    >
                      {it.difference > 0 ? "+" : ""}
                      {it.difference}
                    </td>
                    <td className="py-2.5 pl-3 text-slate-400 text-xs italic">{it.note ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-4 md:px-6 py-3 text-xs text-slate-400">
          {op.status === "completed"
            ? "Stok produk telah diperbarui sesuai opname ini."
            : "Status masih draft. Tekan tombol Selesaikan untuk mengupdate stok produk berdasarkan hasil opname."}
        </div>
      </div>
    </div>
  );
}
