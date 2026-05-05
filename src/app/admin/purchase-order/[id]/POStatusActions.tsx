"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const nextAction: Record<string, { label: string; next: string; icon: React.ReactNode; variant: "default" | "destructive" | "outline" | "secondary" }> = {
  draft:     { label: "Kirim",   next: "submitted", icon: <Send size={14} />,       variant: "default"     },
  submitted: { label: "Setujui", next: "approved",  icon: <CheckCircle size={14} />, variant: "default"    },
};

export default function POStatusActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();

  const updateStatus = async (next: string) => {
    const res = await fetch(`/api/purchase-orders/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) {
      toast.success("Status diperbarui");
      router.refresh();
    } else toast.error("Gagal update status");
  };

  const action = nextAction[status];

  return (
    <div className="flex flex-wrap gap-2">
      {action && (
        <Button size="sm" variant={action.variant} onClick={() => updateStatus(action.next)}>
          {action.icon} {action.label}
        </Button>
      )}
      {status === "draft" && (
        <Button size="sm" variant="destructive" onClick={() => updateStatus("cancelled")}>
          <XCircle size={14} /> Batalkan
        </Button>
      )}
    </div>
  );
}
