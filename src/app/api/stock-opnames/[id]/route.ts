import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type StockOpnameItemInput = {
  productId: string;
  unitId: string;
  systemStock: number;
  actualStock: number;
  note?: string | null;
};

type UpdateStockOpnameBody = {
  date?: string;
  note?: string | null;
  items?: StockOpnameItemInput[];
};

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const stockOpname = await prisma.stockOpname.findUnique({
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

  if (!stockOpname) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(stockOpname);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { date, note, items } = (await req.json()) as UpdateStockOpnameBody;

  try {
    const stockOpname = await prisma.stockOpname.update({
      where: { id },
      data: {
        date: date ? new Date(date) : undefined,
        note,
        items: items
          ? {
              deleteMany: {},
              create: items.map((item) => ({
                productId: item.productId,
                unitId: item.unitId,
                systemStock: item.systemStock,
                actualStock: item.actualStock,
                difference: item.actualStock - item.systemStock,
                note: item.note,
              })),
            }
          : undefined,
      },
      include: { items: true },
    });
    return NextResponse.json(stockOpname);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = await req.json();

  if (status !== "completed" && status !== "draft") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    // If completing the stock opname, we need to update the actual stock levels
    if (status === "completed") {
      const stockOpname = await prisma.stockOpname.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!stockOpname) return NextResponse.json({ error: "Not found" }, { status: 404 });
      if (stockOpname.status === "completed") {
         return NextResponse.json({ error: "Already completed" }, { status: 400 });
      }

      // Update product unit stocks
      await prisma.$transaction(
        stockOpname.items.map((item) =>
          prisma.productUnit.update({
            where: {
              productId_unitId: {
                productId: item.productId,
                unitId: item.unitId,
              },
            },
            data: {
              stock: item.actualStock,
            },
          })
        )
      );
    }

    const updated = await prisma.stockOpname.update({
      where: { id },
      data: { status },
      include: { items: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Stock Opname Completion Error:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.stockOpname.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
