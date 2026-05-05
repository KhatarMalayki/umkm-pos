import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNumber, generateOrderNumber } from "@/lib/utils";
import { z } from "zod";

const OrderSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().optional(),
  customerNote: z.string().optional(),
  paymentMethod: z.enum(["cod", "transfer"]),
  discountCode: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string(),
      productUnitId: z.string(),
      unitId: z.string().optional(),
      quantity: z.number().positive(),
      price: z.number().positive(),
    })
  ).min(1),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const orders = await prisma.order.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { orderNumber: { contains: search } },
              { customerName: { contains: search } },
            ],
          }
        : {}),
    },
    include: {
      items: { include: { product: true, unit: true } },
      discount: true,
      invoice: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = OrderSchema.parse(body);

    // Resolve real unitId (FK to Unit) from productUnitId — client only knows ProductUnit id
    const productUnits = await prisma.productUnit.findMany({
      where: { id: { in: data.items.map((i) => i.productUnitId) } },
      select: { id: true, unitId: true, productId: true },
    });
    const puMap = new Map(productUnits.map((pu) => [pu.id, pu]));

    const missing = data.items.find((i) => !puMap.has(i.productUnitId));
    if (missing) {
      return NextResponse.json(
        { error: `Produk tidak ditemukan (${missing.productUnitId})` },
        { status: 400 }
      );
    }

    let discountId: string | null = null;
    let discountValue = 0;
    let subtotal = 0;

    for (const item of data.items) {
      subtotal += item.price * item.quantity;
    }

    if (data.discountCode) {
      const discount = await prisma.discount.findUnique({
        where: { code: data.discountCode.toUpperCase() },
      });
      if (
        discount &&
        discount.isActive &&
        subtotal >= discount.minOrder &&
        (!discount.expiredAt || new Date() < discount.expiredAt)
      ) {
        discountId = discount.id;
        discountValue =
          discount.type === "percent"
            ? (subtotal * discount.value) / 100
            : discount.value;
      }
    }

    const total = Math.max(0, subtotal - discountValue);

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerNote: data.customerNote,
        paymentMethod: data.paymentMethod,
        discountId,
        discountValue,
        subtotal,
        total,
        items: {
          create: data.items.map((item) => {
            const pu = puMap.get(item.productUnitId)!;
            return {
              productId: pu.productId,
              unitId: pu.unitId,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.price * item.quantity,
            };
          }),
        },
        invoice: {
          create: {
            invoiceNumber: generateInvoiceNumber(),
          },
        },
      },
      include: {
        items: { include: { product: true, unit: true } },
        discount: true,
        invoice: true,
      },
    });

    for (const item of data.items) {
      await prisma.productUnit.updateMany({
        where: { id: item.productUnitId },
        data: { stock: { decrement: Math.ceil(item.quantity) } },
      });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (e) {
    console.error("[orders.POST]", e);
    const message = e instanceof Error ? e.message : "Gagal membuat pesanan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
