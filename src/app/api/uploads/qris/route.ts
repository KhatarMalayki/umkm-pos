import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

async function requireAdmin() {
  const session = await getSession();
  if (!session) return { ok: false as const, status: 401, error: "Unauthorized" };
  if (session.role !== "admin") return { ok: false as const, status: 403, error: "Forbidden" };
  return { ok: true as const };
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File gambar wajib diisi" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File harus berupa gambar" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Ukuran gambar maksimal 2MB" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "qris");
    await mkdir(uploadsDir, { recursive: true });

    const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
    const safeExt = ext || "png";
    const fileName = `qris-${Date.now()}-${randomUUID()}.${safeExt}`;
    const filePath = path.join(uploadsDir, fileName);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    return NextResponse.json({ url: `/uploads/qris/${fileName}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal upload gambar QRIS";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
