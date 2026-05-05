import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  categoryId: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  productUnits: z.array(
    z.object({
      unitId: z.string(),
      price: z.number().positive(),
      stock: z.number().int().min(0),
      isDefault: z.boolean().optional().default(false),
    })
  ).min(1),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const search = searchParams.get("search");
  const activeOnly = searchParams.get("active") !== "false";

  const products = await prisma.product.findMany({
    where: {
      ...(activeOnly ? { isActive: true } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(search ? { name: { contains: search } } : {}),
    },
    include: {
      category: true,
      productUnits: { include: { unit: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = ProductSchema.parse(body);

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        categoryId: data.categoryId || null,
        isActive: data.isActive ?? true,
        productUnits: {
          create: data.productUnits.map((pu, idx) => ({
            unitId: pu.unitId,
            price: pu.price,
            stock: pu.stock,
            isDefault: idx === 0 ? true : (pu.isDefault ?? false),
          })),
        },
      },
      include: { productUnits: { include: { unit: true } }, category: true },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
}
