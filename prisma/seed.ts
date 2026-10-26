import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const restaurants = [
  { id: "rest1", name: "Tjilaki", jastipFee: 35000, multiple: 1, taxService: 0, taxCharge: 0, isActive: true },
  { id: "rest2", name: "Tjitarum", jastipFee: 35000, multiple: 1, taxService: 0, taxCharge: 0, isActive: true },
  { id: "rest3", name: "Warisan", jastipFee: 35000, multiple: 1, taxService: 0, taxCharge: 0, isActive: true },
  { id: "rest4", name: "Toko Roti Merak", jastipFee: 45000, multiple: 3, taxService: 0, taxCharge: 0, isActive: true },
  { id: "rest5", name: "Roti Macan", jastipFee: 40000, multiple: 1, taxService: 0, taxCharge: 0, isActive: true },
  { id: "rest6", name: "Donat Subur Jaya", jastipFee: 35000, multiple: 6, taxService: 0, taxCharge: 0, isActive: true },
  { id: "rest7", name: "Rochi", jastipFee: 35000, multiple: 6, taxService: 0, taxCharge: 0, isActive: true },
  { id: "rest8", name: "Mochi Donat", jastipFee: 35000, multiple: 6, taxService: 0, taxCharge: 0, isActive: true },
  { id: "rest9", name: "Roti Canai Khas", jastipFee: 30000, multiple: 3, taxService: 0, taxCharge: 0, isActive: true },
  { id: "rest10", name: "Kue Ape & Serabi", jastipFee: 25000, multiple: 1, taxService: 0, taxCharge: 0, isActive: true },
  { id: "rest11", name: "Es Krim Potong", jastipFee: 20000, multiple: 1, taxService: 0, taxCharge: 0, isActive: true },
  { id: "rest12", name: "Mie Ayam Pak Kumis", jastipFee: 20000, multiple: 1, taxService: 0, taxCharge: 0, isActive: true },
  { id: "rest13", name: "Batagor Kahuripan", jastipFee: 20000, multiple: 3, taxService: 0, taxCharge: 0, isActive: true },
  { id: "rest14", name: "Batagor Kingsley", jastipFee: 15000, multiple: 3, taxService: 0, taxCharge: 0, isActive: true },
  { id: "rest15", name: "Tjuankie Stasion", jastipFee: 20000, multiple: 1, taxService: 0, taxCharge: 0, isActive: true },
  { id: "rest16", name: "Batagor & Bakso Cuankie Serayu", jastipFee: 20000, multiple: 1, taxService: 0, taxCharge: 0, isActive: true },
  { id: "rest17", name: "Cilok Goreng Setiabudi", jastipFee: 15000, multiple: 100, taxService: 0, taxCharge: 0, isActive: true },
  { id: "rest18", name: "Saltbread", jastipFee: 35000, multiple: 6, taxService: 10, taxCharge: 0, isActive: true },
  { id: "rest19", name: "The Deli Bakes", jastipFee: 15000, multiple: 3, taxService: 10, taxCharge: 5, isActive: true },
];

const menuItems = [
  // Tjilaki (rest1)
  { restaurantId: "rest1", externalId: "m1", name: "Nasi Goreng Spesial", description: "Nasi goreng dengan ayam, udang, dan telur", price: 25000, category: "Makanan", includeJastip: true, jastipFeeSpecial: null, addons: ["Telur", "Kerupuk"], imageUrl: null, isAvailable: true, sortOrder: 1 },
  { restaurantId: "rest1", externalId: "m2", name: "Mie Goreng Spesial", description: "Mie goreng dengan ayam, udang, dan telur", price: 25000, category: "Makanan", includeJastip: true, jastipFeeSpecial: null, addons: ["Telur", "Kerupuk"], imageUrl: null, isAvailable: true, sortOrder: 2 },
  { restaurantId: "rest1", externalId: "m3", name: "Kwetiau Goreng", description: "Kwetiau goreng dengan ayam dan sayuran", price: 25000, category: "Makanan", includeJastip: true, jastipFeeSpecial: null, addons: ["Telur", "Kerupuk"], imageUrl: null, isAvailable: true, sortOrder: 3 },
  { restaurantId: "rest1", externalId: "m4", name: "Nasi Goreng Seafood", description: "Nasi goreng dengan cumi, udang, dan kerang", price: 30000, category: "Makanan", includeJastip: true, jastipFeeSpecial: null, addons: ["Telur", "Kerupuk"], imageUrl: null, isAvailable: true, sortOrder: 4 },
  { restaurantId: "rest1", externalId: "m5", name: "Mie Goreng Seafood", description: "Mie goreng dengan cumi, udang, dan kerang", price: 30000, category: "Makanan", includeJastip: true, jastipFeeSpecial: null, addons: ["Telur", "Kerupuk"], imageUrl: null, isAvailable: true, sortOrder: 5 },
  { restaurantId: "rest1", externalId: "m6", name: "Kwetiau Goreng Seafood", description: "Kwetiau goreng dengan cumi, udang, dan kerang", price: 30000, category: "Makanan", includeJastip: true, jastipFeeSpecial: null, addons: ["Telur", "Kerupuk"], imageUrl: null, isAvailable: true, sortOrder: 6 },
  { restaurantId: "rest1", externalId: "m7", name: "Nasi Goreng Kampung", description: "Nasi goreng tradisional dengan ikan asin", price: 22000, category: "Makanan", includeJastip: true, jastipFeeSpecial: null, addons: ["Telur", "Kerupuk"], imageUrl: null, isAvailable: true, sortOrder: 7 },
  { restaurantId: "rest1", externalId: "m8", name: "Mie Goreng Kampung", description: "Mie goreng tradisional dengan ikan asin", price: 22000, category: "Makanan", includeJastip: true, jastipFeeSpecial: null, addons: ["Telur", "Kerupuk"], imageUrl: null, isAvailable: true, sortOrder: 8 },
  { restaurantId: "rest1", externalId: "m9", name: "Es Teh Manis", description: "Es teh manis segar", price: 5000, category: "Minuman", includeJastip: true, jastipFeeSpecial: null, addons: [], imageUrl: null, isAvailable: true, sortOrder: 9 },
  { restaurantId: "rest1", externalId: "m10", name: "Es Jeruk", description: "Es jeruk peras segar", price: 7000, category: "Minuman", includeJastip: true, jastipFeeSpecial: null, addons: [], imageUrl: null, isAvailable: true, sortOrder: 10 },
];

async function main() {
  console.log('Seeding database...');
  
  // Create restaurants
  for (const r of restaurants) {
    await prisma.restaurant.upsert({
      where: { id: r.id },
      update: r,
      create: r,
    });
    console.log(`Created/updated restaurant: ${r.name}`);
  }
  
  // Create menu items
  for (const item of menuItems) {
    await prisma.menuItem.create({
      data: {
        ...item,
        addons: JSON.stringify(item.addons),
      },
    });
    console.log(`Created menu item: ${item.name}`);
  }
  
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
