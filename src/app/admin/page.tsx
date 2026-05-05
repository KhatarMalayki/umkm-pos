import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";
import {
  ShoppingCart,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

async function getStats() {
  const [
    totalOrders,
    pendingOrders,
    doneOrders,
    totalProducts,
    todayRevenue,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "pending" } }),
    prisma.order.count({ where: { status: "done" } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.aggregate({
      where: {
        status: "done",
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      _sum: { total: true },
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { items: true },
    }),
  ]);

  return { totalOrders, pendingOrders, doneOrders, totalProducts, todayRevenue, recentOrders };
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending:    { label: "Pending",    color: "bg-yellow-100 text-yellow-700" },
  confirmed:  { label: "Dikonfirmasi", color: "bg-blue-100 text-blue-700" },
  processing: { label: "Diproses",   color: "bg-purple-100 text-purple-700" },
  done:       { label: "Selesai",    color: "bg-green-100 text-green-700" },
  cancelled:  { label: "Dibatalkan", color: "bg-red-100 text-red-700" },
};

export default async function AdminPage() {
  const { totalOrders, pendingOrders, doneOrders, totalProducts, todayRevenue, recentOrders } =
    await getStats();

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
      label: "Omzet Hari Ini",
      value: formatRupiah(todayRevenue._sum.total ?? 0),
      icon: TrendingUp,
      gradient: "from-emerald-500 to-teal-600",
      shadow: "shadow-emerald-500/20",
      sub: "dari pesanan selesai",
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
