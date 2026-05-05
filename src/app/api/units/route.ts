import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const units = await prisma.unit.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(units);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, abbreviation } = body;
  if (!name || !abbreviation)
    return NextResponse.json({ error: "Nama & singkatan wajib diisi" }, { status: 400 });
  const unit = await prisma.unit.create({ data: { name, abbreviation } });
  return NextResponse.json(unit, { status: 201 });
}
