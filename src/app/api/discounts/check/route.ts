import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { code, subtotal } = await req.json();
  if (!code) return NextResponse.json({ error: "Kode kosong" }, { status: 400 });

  const discount = await prisma.discount.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!discount || !discount.isActive)
    return NextResponse.json({ error: "Kode diskon tidak valid" }, { status: 404 });

  if (discount.expiredAt && new Date() > discount.expiredAt)
    return NextResponse.json({ error: "Kode diskon sudah kadaluarsa" }, { status: 400 });

  if (subtotal < discount.minOrder)
    return NextResponse.json(
      { error: `Minimum order ${discount.minOrder.toLocaleString("id-ID")} untuk kode ini` },
      { status: 400 }
    );

  const discountValue =
    discount.type === "percent"
      ? (subtotal * discount.value) / 100
      : discount.value;

  return NextResponse.json({ discount, discountValue });
}
