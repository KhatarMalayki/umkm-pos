import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ClipboardCheck, Plus, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

const statusCfg: Record<string, { label: string; bg: string; text: string }> = {
  draft:     { label: "Draft",     bg: "bg-yellow-100", text: "text-yellow-700" },
  completed: { label: "Selesai",   bg: "bg-green-100",  text: "text-green-700"  },
};

export default async function StockOpnameListPage() {
  const opnames = await prisma.stockOpname.findMany({
    orderBy: { date: "desc" },
    include: { items: true },
  });

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardCheck size={22} className="text-emerald-600" />
            Stock Opname
          </h1>
          <p className="text-sm text-slate-500 mt-1">Audit stok fisik vs sistem</p>
        </div>
        <Link
          href="/admin/stock-opname/buat"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm shadow-emerald-500/30"
        >
          <Plus size={16} /> Opname Baru
        </Link>
      </div>

      {/* List */}
      {opnames.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-10 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
            <ClipboardCheck className="text-slate-400" size={24} />
          </div>
          <p className="text-slate-700 font-medium">Belum ada stock opname</p>
          <p className="text-slate-400 text-xs mt-1">Mulai dengan membuat opname pertama Anda</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {opnames.map((op) => {
            const st = statusCfg[op.status] ?? statusCfg.draft;
            const totalDiff = op.items.reduce((sum, it) => sum + it.difference, 0);
            return (
              <Link
                key={op.id}
                href={`/admin/stock-opname/${op.id}`}
                className="group bg-white rounded-xl border border-slate-200/60 p-4 hover:shadow-md hover:border-emerald-200 transition-all"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-mono font-semibold text-slate-900 text-sm">
                        SO-{op.id.slice(-8).toUpperCase()}
                      </p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(op.date).toLocaleDateString("id-ID", {
                        weekday: "long", day: "2-digit", month: "long", year: "numeric",
                      })}
                    </p>
                    {op.note && (
                      <p className="text-xs text-slate-600 mt-1.5 italic line-clamp-1">{op.note}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-400">{op.items.length} item</p>
                    <p className={`text-sm font-bold ${totalDiff < 0 ? "text-red-600" : totalDiff > 0 ? "text-emerald-600" : "text-slate-700"}`}>
                      {totalDiff > 0 ? "+" : ""}{totalDiff}
                    </p>
                    <p className="text-[10px] text-slate-400">selisih</p>
                  </div>
                  <ArrowRight size={16} className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all self-center" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
