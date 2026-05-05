import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.storeSetting.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
      storeName: "Toko UMKM",
      bankName: "BCA",
      bankAccountNumber: "1234567890",
      bankAccountHolder: "TOKO UMKM",
      whatsappNumber: "6281234567890",
    },
  });

  // Admin user
  const hashedPw = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@toko.com" },
    update: {},
    create: { name: "Admin", email: "admin@toko.com", password: hashedPw, role: "admin" },
  });

  // Units — lengkap sesuai kebutuhan dapur & barista
  const allUnits = [
    { name: "Pcs",    abbreviation: "pcs"   },
    { name: "Kg",     abbreviation: "kg"    },
    { name: "Gram",   abbreviation: "gr"    },
    { name: "Lusin",  abbreviation: "lsn"   },
    { name: "Pack",   abbreviation: "pack"  },
    { name: "Liter",  abbreviation: "ltr"   },
    { name: "Botol",  abbreviation: "btl"   },
    { name: "Ikat",   abbreviation: "ikat"  },
    { name: "Sisir",  abbreviation: "sisir" },
    { name: "Butir",  abbreviation: "btr"   },
    { name: "Papan",  abbreviation: "papan" },
    { name: "Buah",   abbreviation: "bh"    },
    { name: "Bungkus",abbreviation: "bks"   },
    { name: "Kaleng", abbreviation: "klg"   },
    { name: "Kotak",  abbreviation: "ktk"   },
    { name: "Dus",    abbreviation: "dus"   },
    { name: "Lembar", abbreviation: "lbr"   },
    { name: "Porsi",  abbreviation: "porsi" },
    { name: "Liter",  abbreviation: "ltr"   },
  ];
  // dedupe by name
  const uniqueUnits = allUnits.filter((u, i, arr) => arr.findIndex(x => x.name === u.name) === i);
  const units = await Promise.all(
    uniqueUnits.map((u) =>
      prisma.unit.upsert({ where: { name: u.name }, update: {}, create: u })
    )
  );

  const pcs   = units.find((u) => u.name === "Pcs")!;
  const kg    = units.find((u) => u.name === "Kg")!;
  const gram  = units.find((u) => u.name === "Gram")!;
  const lusin = units.find((u) => u.name === "Lusin")!;
  const pack  = units.find((u) => u.name === "Pack")!;

  // Departments
  await prisma.department.upsert({ where: { name: "Kitchen" },  update: {}, create: { name: "Kitchen",  color: "#f59e0b" } });
  await prisma.department.upsert({ where: { name: "Barista" },  update: {}, create: { name: "Barista",  color: "#6366f1" } });
  await prisma.department.upsert({ where: { name: "Umum" },     update: {}, create: { name: "Umum",     color: "#10b981" } });
  await prisma.department.upsert({ where: { name: "Gudang" },   update: {}, create: { name: "Gudang",   color: "#64748b" } });

  // Categories — Kitchen & Barista
  const makanan   = await prisma.category.upsert({ where: { name: "Makanan" },       update: {}, create: { name: "Makanan" } });
  const minuman   = await prisma.category.upsert({ where: { name: "Minuman" },       update: {}, create: { name: "Minuman" } });
  const kopi      = await prisma.category.upsert({ where: { name: "Kopi" },          update: {}, create: { name: "Kopi" } });
  const nonCoffee = await prisma.category.upsert({ where: { name: "Non-Coffee" },    update: {}, create: { name: "Non-Coffee" } });
  const snack     = await prisma.category.upsert({ where: { name: "Snack" },         update: {}, create: { name: "Snack" } });

  // Helper untuk skip kalau produk sudah ada (cek by name)
  const upsertProduct = async (data: {
    name: string; description?: string; categoryId: string;
    units: { unitId: string; price: number; stock: number; isDefault?: boolean }[];
  }) => {
    const existing = await prisma.product.findFirst({ where: { name: data.name } });
    if (existing) return existing;
    return prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        productUnits: { create: data.units.map((u, i) => ({ ...u, isDefault: u.isDefault ?? i === 0 })) },
      },
    });
  };

  // ============== KITCHEN / MAKANAN ==============
  const kitchenItems: { name: string; desc: string; price: number; stock: number }[] = [
    { name: "Nasi Goreng Spesial",   desc: "Nasi goreng dengan telur, ayam, dan kerupuk",       price: 22000, stock: 50 },
    { name: "Nasi Goreng Seafood",   desc: "Nasi goreng dengan udang dan cumi",                  price: 28000, stock: 40 },
    { name: "Mie Goreng",            desc: "Mie goreng spesial dengan telur",                    price: 20000, stock: 50 },
    { name: "Mie Rebus",             desc: "Mie kuah segar dengan telur",                        price: 18000, stock: 40 },
    { name: "Ayam Geprek",           desc: "Ayam goreng tepung sambal pedas",                    price: 25000, stock: 40 },
    { name: "Ayam Bakar",            desc: "Ayam bakar bumbu kecap",                             price: 28000, stock: 30 },
    { name: "Nasi Ayam Penyet",      desc: "Nasi + ayam penyet + sambal + lalapan",              price: 24000, stock: 40 },
    { name: "Nasi Telur Ceplok",     desc: "Nasi + telur ceplok + kerupuk",                      price: 12000, stock: 60 },
    { name: "Indomie Telur",         desc: "Indomie rebus/goreng + telur",                       price: 13000, stock: 80 },
    { name: "Roti Bakar Coklat Keju",desc: "Roti bakar isi coklat dan keju",                     price: 15000, stock: 50 },
    { name: "Pisang Goreng",         desc: "Pisang goreng crispy (porsi)",                       price: 12000, stock: 40 },
    { name: "Kentang Goreng",        desc: "French fries dengan saus",                           price: 18000, stock: 50 },
    { name: "Tahu Crispy",           desc: "Tahu goreng tepung crispy",                          price: 12000, stock: 40 },
  ];
  for (const item of kitchenItems) {
    await upsertProduct({
      name: item.name, description: item.desc, categoryId: makanan.id,
      units: [{ unitId: pcs.id, price: item.price, stock: item.stock, isDefault: true }],
    });
  }

  // ============== BARISTA / KOPI ==============
  const coffeeItems: { name: string; desc: string; price: number; stock: number }[] = [
    { name: "Espresso",              desc: "Single shot espresso",                                price: 15000, stock: 100 },
    { name: "Americano",             desc: "Espresso + air panas",                                price: 18000, stock: 100 },
    { name: "Cappuccino",            desc: "Espresso + steamed milk + foam",                      price: 22000, stock: 80 },
    { name: "Cafe Latte",            desc: "Espresso + steamed milk",                             price: 22000, stock: 80 },
    { name: "Caramel Macchiato",     desc: "Latte dengan sirup caramel",                          price: 25000, stock: 60 },
    { name: "Vanilla Latte",         desc: "Latte dengan sirup vanilla",                          price: 25000, stock: 60 },
    { name: "Mocha",                 desc: "Espresso + coklat + susu",                            price: 25000, stock: 60 },
    { name: "Kopi Susu Gula Aren",   desc: "Kopi susu khas dengan gula aren",                     price: 20000, stock: 100 },
    { name: "Kopi Tubruk",           desc: "Kopi tubruk tradisional",                             price: 12000, stock: 80 },
    { name: "Es Kopi Susu",          desc: "Iced coffee with milk",                               price: 22000, stock: 80 },
  ];
  for (const item of coffeeItems) {
    await upsertProduct({
      name: item.name, description: item.desc, categoryId: kopi.id,
      units: [{ unitId: pcs.id, price: item.price, stock: item.stock, isDefault: true }],
    });
  }

  // ============== NON-COFFEE / MINUMAN ==============
  const nonCoffeeItems: { name: string; desc: string; price: number; stock: number }[] = [
    { name: "Matcha Latte",          desc: "Matcha + susu",                                       price: 25000, stock: 60 },
    { name: "Choco Latte",           desc: "Coklat + susu hangat",                                price: 22000, stock: 60 },
    { name: "Red Velvet",            desc: "Red velvet latte",                                    price: 24000, stock: 50 },
    { name: "Taro Latte",            desc: "Taro + susu",                                         price: 24000, stock: 50 },
    { name: "Thai Tea",              desc: "Es thai tea creamy",                                  price: 18000, stock: 80 },
    { name: "Lemon Tea",             desc: "Es lemon tea segar",                                  price: 15000, stock: 80 },
    { name: "Es Teh Manis",          desc: "Es teh manis",                                        price: 6000,  stock: 200 },
    { name: "Es Jeruk",              desc: "Es jeruk peras segar",                                price: 12000, stock: 80 },
    { name: "Air Mineral",           desc: "Air mineral kemasan",                                 price: 5000,  stock: 200 },
  ];
  for (const item of nonCoffeeItems) {
    await upsertProduct({
      name: item.name, description: item.desc, categoryId: nonCoffee.id,
      units: [{ unitId: pcs.id, price: item.price, stock: item.stock, isDefault: true }],
    });
  }

  // ============== SNACK ==============
  const snackItems: { name: string; desc: string; price: number; stock: number }[] = [
    { name: "Roti Bakar Original",   desc: "Roti bakar dengan butter",                            price: 10000, stock: 50 },
    { name: "Donat Coklat",          desc: "Donat topping coklat",                                price: 8000,  stock: 40 },
    { name: "Croissant",             desc: "Croissant butter",                                    price: 15000, stock: 30 },
    { name: "Kerupuk",               desc: "Kerupuk udang",                                       price: 5000,  stock: 100 },
  ];
  for (const item of snackItems) {
    await upsertProduct({
      name: item.name, description: item.desc, categoryId: snack.id,
      units: [{ unitId: pcs.id, price: item.price, stock: item.stock, isDefault: true }],
    });
  }

  // ============== BAHAN BAKU (untuk reference Purchase Order) ==============
  await upsertProduct({
    name: "Beras Premium", description: "Beras pulen kualitas premium", categoryId: makanan.id,
    units: [
      { unitId: kg.id,   price: 15000, stock: 100,    isDefault: true  },
      { unitId: gram.id, price: 15,    stock: 100000, isDefault: false },
    ],
  });
  await upsertProduct({
    name: "Minyak Goreng", description: "Minyak goreng kemasan", categoryId: makanan.id,
    units: [
      { unitId: pcs.id,   price: 18000,  stock: 50, isDefault: true  },
      { unitId: lusin.id, price: 200000, stock: 10, isDefault: false },
    ],
  });
  await upsertProduct({
    name: "Teh Botol Sosro", description: "Minuman teh segar", categoryId: minuman.id,
    units: [
      { unitId: pcs.id,  price: 5000,  stock: 200, isDefault: true  },
      { unitId: pack.id, price: 55000, stock: 30,  isDefault: false },
    ],
  });

  // Discounts
  await prisma.discount.upsert({
    where: { code: "HEMAT10" },
    update: {},
    create: { code: "HEMAT10", type: "percent", value: 10, minOrder: 50000, isActive: true },
  });
  await prisma.discount.upsert({
    where: { code: "DISKON20K" },
    update: {},
    create: { code: "DISKON20K", type: "nominal", value: 20000, minOrder: 100000, isActive: true },
  });

  console.log("✅ Seed selesai!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
