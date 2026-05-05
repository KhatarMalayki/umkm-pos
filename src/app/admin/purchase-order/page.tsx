"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus, Search, Eye, Trash2, CheckCircle,
  Send, RotateCcw, ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type Department = { id: string; name: string; color: string };
type POItem = { id: string; itemName: string; quantity: number; customUnit?: string; unit?: { abbreviation: string } };
type PO = {
  id: string; poNumber: string; orderDate: string; status: string; note?: string;
  department: Department; items: POItem[];
};

const statusCfg: Record<string, { label: string; variant: "default"|"secondary"|"warning"|"info"|"success"|"destructive" }> = {
  draft:      { label: "Draft",        variant: "secondary" },
  submitted:  { label: "Dikirim",      variant: "warning"   },
  approved:   { label: "Disetujui",    variant: "success"   },
  cancelled:  { label: "Dibatalkan",   variant: "destructive"},
};

const nextAction: Record<string, { label: string; next: string; icon: React.ReactNode }> = {
  draft:     { label: "Kirim",    next: "submitted", icon: <Send size={14} /> },
  submitted: { label: "Setujui",  next: "approved",  icon: <CheckCircle size={14} /> },
};

export default function PurchaseOrderPage() {
  const [pos, setPOs] = useState<PO[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const fetchPOs = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterDept) params.set("departmentId", filterDept);
    if (filterStatus) params.set("status", filterStatus);
    if (search) params.set("search", search);
    const data = await fetch(`/api/purchase-orders?${params}`).then((r) => r.json());
    setPOs(data);
  }, [filterDept, filterStatus, search]);

  useEffect(() => {
    fetch("/api/departments").then((r) => r.json()).then(setDepartments);
  }, []);

  useEffect(() => { fetchPOs(); }, [fetchPOs]);

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/purchase-orders/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) { toast.success("Status diperbarui"); fetchPOs(); }
    else toast.error("Gagal update status");
  };

  const handleDelete = async (id: string, num: string) => {
    if (!confirm(`Hapus PO "${num}"?`)) return;
    const res = await fetch(`/api/purchase-orders/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("PO dihapus"); fetchPOs(); }
    else toast.error("Gagal menghapus");
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Order</h1>
          <p className="text-sm text-gray-500">Orderan belanja harian per departemen</p>
        </div>
        <Link href="/admin/purchase-order/buat">
          <Button className="w-full sm:w-auto"><Plus size={16} /> Buat Orderan</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input className="pl-9" placeholder="Cari no. PO..." value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select className="w-full sm:w-40" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
          <option value="">Semua Dept.</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
        <Select className="w-full sm:w-40" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Semua Status</option>
          {Object.entries(statusCfg).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </Select>
      </div>

      {/* List */}
      <div className="space-y-3">
        {pos.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
            <ClipboardList className="mx-auto mb-2" size={36} />
            <p className="font-medium">Belum ada purchase order</p>
            <p className="text-sm mt-1">Klik &ldquo;Buat Orderan&rdquo; untuk membuat orderan baru</p>
          </div>
        ) : pos.map((po) => {
          const st = statusCfg[po.status];
          const action = nextAction[po.status];
          return (
            <div key={po.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 flex items-start gap-3 md:gap-4">
                {/* Dept color bar */}
                <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: po.department.color }} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-semibold text-sm text-gray-800">{po.poNumber}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                      style={{ backgroundColor: po.department.color }}>
                      {po.department.name}
                    </span>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(po.orderDate).toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                    {" · "}{po.items.length} item
                  </p>
                  {po.note && <p className="text-xs text-gray-400 italic mt-0.5 break-words">{po.note}</p>}

                  <div className="flex flex-wrap items-center gap-2 mt-3 md:hidden">
                    {action && (
                      <Button size="sm" onClick={() => updateStatus(po.id, action.next)}>
                        {action.icon} {action.label}
                      </Button>
                    )}
                    {po.status === "draft" && (
                      <Button size="sm" variant="destructive" onClick={() => updateStatus(po.id, "cancelled")}>
                        Batalkan
                      </Button>
                    )}
                    <Link href={`/admin/purchase-order/${po.id}`}>
                      <Button size="sm" variant="outline"><Eye size={14} /> Lihat</Button>
                    </Link>
                    {(po.status === "approved" || po.status === "cancelled") && (
                      <Link href={`/admin/purchase-order/buat?reorder=${po.id}`}>
                        <Button size="sm" variant="ghost" title="Reorder"><RotateCcw size={14} /></Button>
                      </Link>
                    )}
                    {po.status === "draft" && (
                      <Button size="icon" variant="ghost" className="text-red-500"
                        onClick={() => handleDelete(po.id, po.poNumber)}>
                        <Trash2 size={15} />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-2 shrink-0">
                  {action && (
                    <Button size="sm" onClick={() => updateStatus(po.id, action.next)}>
                      {action.icon} {action.label}
                    </Button>
                  )}
                  {po.status === "draft" && (
                    <Button size="sm" variant="destructive" onClick={() => updateStatus(po.id, "cancelled")}>
                      Batalkan
                    </Button>
                  )}
                  <Link href={`/admin/purchase-order/${po.id}`}>
                    <Button size="sm" variant="outline"><Eye size={14} /> Lihat</Button>
                  </Link>
                  {(po.status === "approved" || po.status === "cancelled") && (
                    <Link href={`/admin/purchase-order/buat?reorder=${po.id}`}>
                      <Button size="sm" variant="ghost" title="Reorder"><RotateCcw size={14} /></Button>
                    </Link>
                  )}
                  {po.status === "draft" && (
                    <Button size="icon" variant="ghost" className="text-red-500"
                      onClick={() => handleDelete(po.id, po.poNumber)}>
                      <Trash2 size={15} />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
