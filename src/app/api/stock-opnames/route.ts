import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type StockOpnameItemInput = {
  productId: string;
  unitId: string;
  systemStock: number;
  actualStock: number;
  note?: string | null;
};

type CreateStockOpnameBody = {
  date?: string;
  note?: string | null;
  items: StockOpnameItemInput[];
};

export async function GET() {
  const stockOpnames = await prisma.stockOpname.findMany({
    orderBy: { date: "desc" },
    include: {
      items: true,
    },
  });
  return NextResponse.json(stockOpnames);
}

export async function POST(req: NextRequest) {
  try {
    const { date, note, items } = (await req.json()) as CreateStockOpnameBody;

    const stockOpname = await prisma.stockOpname.create({
      data: {
        date: date ? new Date(date) : new Date(),
        note,
        status: "draft",
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            unitId: item.unitId,
            systemStock: item.systemStock,
            actualStock: item.actualStock,
            difference: item.actualStock - item.systemStock,
            note: item.note,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json(stockOpname);
  } catch (error) {
    console.error("Stock Opname Error:", error);
    return NextResponse.json({ error: "Failed to create stock opname" }, { status: 400 });
  }
}
