import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ItemSchema = z.object({
  itemName: z.string().min(1),
  quantity: z.number().positive(),
  unitId: z.string().optional().nullable(),
  customUnit: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  sortOrder: z.number().int().optional().default(0),
});

const UpdateSchema = z.object({
  departmentId: z.string().optional(),
  orderDate: z.string().optional(),
  note: z.string().optional().nullable(),
  status: z.enum(["draft", "submitted", "approved", "cancelled"]).optional(),
  items: z.array(ItemSchema).optional(),
});

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      department: true,
      items: { include: { unit: true }, orderBy: { sortOrder: "asc" } },
    },
  });
  if (!po) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(po);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const data = UpdateSchema.parse(body);

    const po = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        ...(data.departmentId && { departmentId: data.departmentId }),
        ...(data.orderDate && { orderDate: new Date(data.orderDate) }),
        ...(data.note !== undefined && { note: data.note }),
        ...(data.status && { status: data.status }),
        ...(data.items && {
          items: {
            deleteMany: {},
            create: data.items.map((item, idx) => ({
              itemName: item.itemName,
              quantity: item.quantity,
              unitId: item.unitId ?? null,
              customUnit: item.customUnit ?? null,
              note: item.note ?? null,
              sortOrder: item.sortOrder ?? idx,
            })),
          },
        }),
      },
      include: {
        department: true,
        items: { include: { unit: true }, orderBy: { sortOrder: "asc" } },
      },
    });

    return NextResponse.json(po);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update gagal" }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = await req.json();
  const valid = ["draft", "submitted", "approved", "cancelled"];
  if (!valid.includes(status)) return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });

  const po = await prisma.purchaseOrder.update({
    where: { id },
    data: { status },
    include: { department: true, items: { include: { unit: true } } },
  });
  return NextResponse.json(po);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.purchaseOrder.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
