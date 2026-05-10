import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";
import {
  ShoppingCart,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
} from "lucide-react";

export const dynamic = "force-dynamic";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

async function getStats() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // 6 month historical window (including current month)
  const startOfHistory = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // Anything that is not cancelled counts as omset (both COD and Transfer)
  const omsetWhere = { status: { not: "cancelled" } } as const;

  const [
    totalOrders,
    pendingOrders,
    doneOrders,
    totalProducts,
    omsetOrders,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "pending" } }),
    prisma.order.count({ where: { status: "done" } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.findMany({
      where: {
        ...omsetWhere,
        createdAt: { gte: startOfHistory },
      },
      select: { total: true, createdAt: true, paymentMethod: true },
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { items: true },
    }),
  ]);

  const todayRevenue = { total: 0, count: 0, cod: 0, transfer: 0 };
  const monthRevenue = { total: 0, count: 0, cod: 0, transfer: 0 };

  // Build monthly history buckets (oldest -> newest)
  const monthly: { key: string; label: string; total: number; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthly.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: `${MONTH_LABELS[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`,
      total: 0,
      count: 0,
    });
  }
  const bucketIndex = new Map(monthly.map((m, idx) => [m.key, idx]));
  for (const o of omsetOrders) {
    const d = new Date(o.createdAt);

    if (d >= startOfDay) {
      todayRevenue.total += o.total;
      todayRevenue.count += 1;
      if (o.paymentMethod === "cod") todayRevenue.cod += o.total;
      if (o.paymentMethod === "transfer") todayRevenue.transfer += o.total;
    }

    if (d >= startOfMonth) {
      monthRevenue.total += o.total;
      monthRevenue.count += 1;
      if (o.paymentMethod === "cod") monthRevenue.cod += o.total;
      if (o.paymentMethod === "transfer") monthRevenue.transfer += o.total;
    }

    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const idx = bucketIndex.get(key);
    if (idx !== undefined) {
      monthly[idx].total += o.total;
      monthly[idx].count += 1;
    }
  }

  return {
    totalOrders,
    pendingOrders,
    doneOrders,
    totalProducts,
    todayRevenue,
    monthRevenue,
    monthly,
    recentOrders,
  };
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending:    { label: "Pending",    color: "bg-yellow-100 text-yellow-700" },
  confirmed:  { label: "Dikonfirmasi", color: "bg-blue-100 text-blue-700" },
  processing: { label: "Diproses",   color: "bg-purple-100 text-purple-700" },
  done:       { label: "Selesai",    color: "bg-green-100 text-green-700" },
  cancelled:  { label: "Dibatalkan", color: "bg-red-100 text-red-700" },
};

export default async function AdminPage() {
  const {
    totalOrders,
    pendingOrders,
    doneOrders,
    totalProducts,
    todayRevenue,
    monthRevenue,
    monthly,
    recentOrders,
  } = await getStats();

  const todayCount = todayRevenue.count;
  const monthCount = monthRevenue.count;
  const maxMonthly = Math.max(1, ...monthly.map((m) => m.total));

  const cards = [
    {
      label: "Total Pesanan",
      value: totalOrders,
      icon: ShoppingCart,
      gradient: "from-blue-500 to-indigo-600",
      shadow: "shadow-blue-500/20",
      sub: `${pendingOrders} pending`,
    },
    {
      label: "Pesanan Selesai",
      value: doneOrders,
      icon: CheckCircle,
      gradient: "from-green-500 to-emerald-600",
      shadow: "shadow-green-500/20",
      sub: "semua waktu",
    },
    {
      label: "Produk Aktif",
      value: totalProducts,
      icon: Package,
      gradient: "from-purple-500 to-fuchsia-600",
      shadow: "shadow-purple-500/20",
      sub: "produk tersedia",
    },
    {
      label: "Omset Hari Ini",
      value: formatRupiah(todayRevenue.total),
      icon: TrendingUp,
      gradient: "from-emerald-500 to-teal-600",
      shadow: "shadow-emerald-500/20",
      sub: `${todayCount} pesanan · COD ${formatRupiah(todayRevenue.cod)} · Transfer ${formatRupiah(todayRevenue.transfer)}`,
    },
    {
      label: "Omset Bulan Ini",
      value: formatRupiah(monthRevenue.total),
      icon: Calendar,
      gradient: "from-amber-500 to-orange-600",
      shadow: "shadow-amber-500/20",
      sub: `${monthCount} pesanan · COD ${formatRupiah(monthRevenue.cod)} · Transfer ${formatRupiah(monthRevenue.transfer)}`,
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Ringkasan aktivitas toko Anda hari ini</p>
        </div>
        <div className="text-xs text-slate-500 bg-white border border-slate-200 rounded-full px-3 py-1.5 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map(({ label, value, icon: Icon, gradient, shadow, sub }) => (
          <div
            key={label}
            className="relative bg-white rounded-2xl border border-slate-200/60 p-5 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          >
            {/* decorative corner glow */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl`} />

            <div className="relative flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${shadow}`}>
                <Icon size={18} className="text-white" />
              </div>
            </div>
            <p className="relative text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
            <p className="relative text-xs text-slate-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Monthly Omset History */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <TrendingUp size={15} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-slate-900">Riwayat Omset</h2>
            <p className="text-xs text-slate-500">6 bulan terakhir (semua pesanan kecuali dibatalkan)</p>
          </div>
          <div className="text-right text-[11px] text-slate-500">
            <p>Bulan ini: COD {formatRupiah(monthRevenue.cod)}</p>
            <p>Transfer: {formatRupiah(monthRevenue.transfer)}</p>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-6 gap-2 sm:gap-3 items-end h-44">
            {monthly.map((m) => {
              const heightPct = (m.total / maxMonthly) * 100;
              return (
                <div key={m.key} className="flex flex-col items-center justify-end gap-1.5 h-full">
                  <span className="text-[10px] font-semibold text-slate-700 tabular-nums">
                    {m.total > 0 ? formatRupiah(m.total) : "-"}
                  </span>
                  <div
                    className="w-full bg-gradient-to-t from-amber-500 to-orange-400 rounded-t-md min-h-[4px] transition-all"
                    style={{ height: `${Math.max(2, heightPct)}%` }}
                    title={`${m.label}: ${formatRupiah(m.total)} (${m.count} pesanan)`}
                  />
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-6 gap-2 sm:gap-3 mt-2">
            {monthly.map((m) => (
              <div key={`${m.key}-label`} className="text-center">
                <p className="text-[11px] font-medium text-slate-600">{m.label}</p>
                <p className="text-[10px] text-slate-400">{m.count} pesanan</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <Clock size={15} className="text-slate-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-slate-900">Pesanan Terbaru</h2>
            <p className="text-xs text-slate-500">5 pesanan terakhir</p>
          </div>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
              <AlertCircle className="text-slate-400" size={24} />
            </div>
            <p className="text-slate-600 font-medium text-sm">Belum ada pesanan</p>
            <p className="text-slate-400 text-xs mt-1">Pesanan baru akan muncul di sini</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentOrders.map((order) => {
              const st = statusConfig[order.status] ?? statusConfig.pending;
              return (
                <div key={order.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-slate-900 font-mono">{order.orderNumber}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {order.customerName} &middot; {order.items.length} item &middot;{" "}
                      <span className="font-medium">
                        {order.paymentMethod === "cod" ? "COD" : "Transfer"}
                      </span>
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="font-bold text-sm text-slate-900">
                      {formatRupiah(order.total)}
                    </p>
                    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${st.color}`}>
                      {st.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
