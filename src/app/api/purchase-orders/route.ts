import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

function generatePONumber() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `PO-${y}${m}${d}-${rand}`;
}

const ItemSchema = z.object({
  itemName: z.string().min(1),
  quantity: z.number().positive(),
  unitId: z.string().optional().nullable(),
  customUnit: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  sortOrder: z.number().int().optional().default(0),
});

const POSchema = z.object({
  departmentId: z.string().min(1),
  orderDate: z.string().optional(),
  note: z.string().optional().nullable(),
  items: z.array(ItemSchema).min(1),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get("departmentId");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const orders = await prisma.purchaseOrder.findMany({
    where: {
      ...(departmentId ? { departmentId } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { poNumber: { contains: search } },
              { department: { name: { contains: search } } },
            ],
          }
        : {}),
    },
    include: {
      department: true,
      items: { include: { unit: true }, orderBy: { sortOrder: "asc" } },
    },
    orderBy: { orderDate: "desc" },
  });

  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = POSchema.parse(body);

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber: generatePONumber(),
        departmentId: data.departmentId,
        orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
        note: data.note,
        status: "draft",
        items: {
          create: data.items.map((item, idx) => ({
            itemName: item.itemName,
            quantity: item.quantity,
            unitId: item.unitId ?? null,
            customUnit: item.customUnit ?? null,
            note: item.note ?? null,
            sortOrder: item.sortOrder ?? idx,
          })),
        },
      },
      include: {
        department: true,
        items: { include: { unit: true }, orderBy: { sortOrder: "asc" } },
      },
    });

    return NextResponse.json(po, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }
}
