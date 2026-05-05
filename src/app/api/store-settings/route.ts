import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const UpdateStoreSettingsSchema = z.object({
  storeName: z.string().min(1).max(100),
  bankName: z.string().max(100).optional().nullable(),
  bankAccountNumber: z.string().max(100).optional().nullable(),
  bankAccountHolder: z.string().max(100).optional().nullable(),
  qrisImageUrl: z.string().max(500).optional().nullable(),
  whatsappNumber: z.string().max(30).optional().nullable(),
});

export async function GET() {
  const settings = await prisma.storeSetting.upsert({
    where: { id: "main" },
    update: {},
    create: { id: "main", storeName: "Toko UMKM" },
  });

  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = UpdateStoreSettingsSchema.parse(body);

    const settings = await prisma.storeSetting.upsert({
      where: { id: "main" },
      update: {
        storeName: data.storeName,
        bankName: data.bankName || null,
        bankAccountNumber: data.bankAccountNumber || null,
        bankAccountHolder: data.bankAccountHolder || null,
        qrisImageUrl: data.qrisImageUrl || null,
        whatsappNumber: data.whatsappNumber || null,
      },
      create: {
        id: "main",
        storeName: data.storeName,
        bankName: data.bankName || null,
        bankAccountNumber: data.bankAccountNumber || null,
        bankAccountHolder: data.bankAccountHolder || null,
        qrisImageUrl: data.qrisImageUrl || null,
        whatsappNumber: data.whatsappNumber || null,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Data tidak valid";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
