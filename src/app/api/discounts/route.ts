import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const DiscountSchema = z.object({
  code: z.string().min(1),
  type: z.enum(["percent", "nominal"]),
  value: z.number().positive(),
  minOrder: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
  expiredAt: z.string().nullable().optional(),
});

export async function GET() {
  const discounts = await prisma.discount.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(discounts);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = DiscountSchema.parse(body);
    const discount = await prisma.discount.create({
      data: {
        code: data.code.toUpperCase(),
        type: data.type,
        value: data.value,
        minOrder: data.minOrder,
        isActive: data.isActive,
        expiredAt: data.expiredAt ? new Date(data.expiredAt) : null,
      },
    });
    return NextResponse.json(discount, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }
}
