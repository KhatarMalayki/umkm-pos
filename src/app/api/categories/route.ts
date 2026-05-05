import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name } = body;
  if (!name) return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
  const category = await prisma.category.create({ data: { name } });
  return NextResponse.json(category, { status: 201 });
}
