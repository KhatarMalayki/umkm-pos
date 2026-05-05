import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  categoryId: z.string().optional(),
  isActive: z.boolean().optional(),
  productUnits: z.array(
    z.object({
      id: z.string().optional(),
      unitId: z.string(),
      price: z.number().positive(),
      stock: z.number().int().min(0),
      isDefault: z.boolean().optional().default(false),
    })
  ).optional(),
});

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { productUnits: { include: { unit: true } }, category: true },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const data = UpdateSchema.parse(body);

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.productUnits && {
          productUnits: {
            deleteMany: {},
            create: data.productUnits.map((pu, idx) => ({
              unitId: pu.unitId,
              price: pu.price,
              stock: pu.stock,
              isDefault: idx === 0 ? true : (pu.isDefault ?? false),
            })),
          },
        }),
      },
      include: { productUnits: { include: { unit: true } }, category: true },
    });

    return NextResponse.json(product);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
