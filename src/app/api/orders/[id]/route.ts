import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true, unit: true } },
      discount: true,
      invoice: true,
    },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

const UpdateSchema = z.object({
  status: z.enum(["pending", "confirmed", "processing", "done", "cancelled"]).optional(),
  items: z
    .array(
      z.object({
        id: z.string(),
        quantity: z.number().positive(),
      })
    )
    .optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  const { status, items } = parsed.data;
  if (!status && !items) {
    return NextResponse.json({ error: "Tidak ada perubahan" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      discount: true,
      invoice: true,
    },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Prepare item updates (only allow reducing quantity)
  let newSubtotal = order.subtotal;
  let newDiscountValue = order.discountValue;
  const itemUpdates: { id: string; quantity: number; subtotal: number }[] = [];
  const restockMap = new Map<string, number>(); // productId-unitId -> delta

  if (items && items.length > 0) {
    const currentMap = new Map(order.items.map((it) => [it.id, it]));

    for (const upd of items) {
      const existing = currentMap.get(upd.id);
      if (!existing) return NextResponse.json({ error: "Item tidak ditemukan" }, { status: 400 });
      if (upd.quantity > existing.quantity) {
        return NextResponse.json({ error: "Hanya boleh mengurangi qty" }, { status: 400 });
      }
      const newSub = existing.price * upd.quantity;
      newSubtotal += newSub - existing.subtotal;
      itemUpdates.push({ id: existing.id, quantity: upd.quantity, subtotal: newSub });

      const diff = existing.quantity - upd.quantity;
      if (diff > 0) {
        const key = `${existing.productId}-${existing.unitId}`;
        restockMap.set(key, (restockMap.get(key) ?? 0) + diff);
      }
    }

    // Re-evaluate discount if still valid
    if (order.discountId) {
      const discount = await prisma.discount.findUnique({ where: { id: order.discountId } });
      if (
        discount &&
        discount.isActive &&
        newSubtotal >= discount.minOrder &&
        (!discount.expiredAt || new Date() < discount.expiredAt)
      ) {
        newDiscountValue =
          discount.type === "percent"
            ? (newSubtotal * discount.value) / 100
            : discount.value;
      } else {
        newDiscountValue = 0;
      }
    } else {
      newDiscountValue = 0;
    }
  }

  const newTotal = Math.max(0, newSubtotal - newDiscountValue);

  const updated = await prisma.$transaction(async (tx) => {
    // Restock diffs
    for (const [key, delta] of restockMap.entries()) {
      const [productId, unitId] = key.split("-");
      await tx.productUnit.update({
        where: { productId_unitId: { productId, unitId } },
        data: { stock: { increment: Math.ceil(delta) } },
      });
    }

    for (const it of itemUpdates) {
      await tx.orderItem.update({
        where: { id: it.id },
        data: { quantity: it.quantity, subtotal: it.subtotal },
      });
    }

    const updatedOrder = await tx.order.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(items && items.length > 0
          ? {
              subtotal: newSubtotal,
              discountValue: newDiscountValue,
              total: newTotal,
            }
          : {}),
      },
      include: {
        items: { include: { product: true, unit: true } },
        discount: true,
        invoice: true,
      },
    });

    return updatedOrder;
  });

  return NextResponse.json(updated);
}
