import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

async function requireAdmin() {
  const session = await getSession();
  if (!session) return { ok: false as const, status: 401, error: "Unauthorized" };
  if (session.role !== "admin") return { ok: false as const, status: 403, error: "Forbidden" };
  return { ok: true as const, session };
}

const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(["admin", "kasir"]).optional(),
  password: z.string().min(6).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;

  try {
    const data = UpdateUserSchema.parse(await req.json());

    if (data.email) {
      const exists = await prisma.user.findFirst({ where: { email: data.email, NOT: { id } } });
      if (exists) return NextResponse.json({ error: "Email sudah dipakai" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.password !== undefined && { password: await bcrypt.hash(data.password, 10) }),
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return NextResponse.json(updated);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Data tidak valid";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;

  if (auth.session.userId === id) {
    return NextResponse.json({ error: "Tidak bisa menghapus akun sendiri" }, { status: 400 });
  }

  // Pastikan minimal 1 admin tersisa
  const adminCount = await prisma.user.count({ where: { role: "admin" } });
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  if (target.role === "admin" && adminCount <= 1) {
    return NextResponse.json({ error: "Minimal harus ada 1 admin" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
