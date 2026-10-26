import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Restaurant data from invoice-generator/data/index.ts
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

// Menu items from invoice-generator/data/index.ts
const menuItems: Array<{
  externalId: string;
  restaurantId: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  includeJastip: boolean;
  jastipFeeSpecial?: number;
  addon?: string[];
  imageUrl?: string;
  isAvailable?: boolean;
  sortOrder?: number;
}> = [
  // Tjilaki (rest1)
  { externalId: "m1", restaurantId: "rest1", name: "Bolu Pisang Kacang", description: "Bolu pisang dengan topping kacang", price: 140000, category: "Bolu Loyang", includeJastip: true, jastipFeeSpecial: undefined, addon: undefined, imageUrl: undefined, isAvailable: true, sortOrder: 1 },
  { externalId: "m2", restaurantId: "rest1", name: "Bolu Pisang Strawberry", description: "Bolu pisang dengan topping strawberry", price: 140000, category: "Bolu Loyang", includeJastip: true, jastipFeeSpecial: undefined, addon: undefined, imageUrl: undefined, isAvailable: true, sortOrder: 2 },
  { externalId: "m3", restaurantId: "rest1", name: "Bolu Pisang Coklat", description: "Bolu pisang dengan topping coklat", price: 140000, category: "Bolu Loyang", includeJastip: true, jastipFeeSpecial: undefined, addon: undefined, imageUrl: undefined, isAvailable: true, sortOrder: 3 },
  { externalId: "m4", restaurantId: "rest1", name: "Bolu Pisang Keju", description: "Bolu pisang dengan topping keju", price: 140000, category: "Bolu Loyang", includeJastip: true, jastipFeeSpecial: undefined, addon: undefined, imageUrl: undefined, isAvailable: true, sortOrder: 4 },
  { externalId: "m5", restaurantId: "rest1", name: "Bolu Potong Cinnamon", description: "Bolu potong varian cinnamon", price: 25000, category: "Bolu Potong", includeJastip: true, jastipFeeSpecial: 20000, addon: ["Butter Cinnamon", "Butter Vanilla", "Butter Strawberry"], imageUrl: undefined, isAvailable: true, sortOrder: 5 },
  { externalId: "m6", restaurantId: "rest1", name: "Bolu Potong Vanilla", description: "Bolu potong varian vanilla", price: 25000, category: "Bolu Potong", includeJastip: true, jastipFeeSpecial: 20000, addon: ["Butter Cinnamon", "Butter Vanilla", "Butter Strawberry"], imageUrl: undefined, isAvailable: true, sortOrder: 6 },
  { externalId: "m7", restaurantId: "rest1", name: "Bolu Potong Strawberry", description: "Bolu potong varian strawberry", price: 25000, category: "Bolu Potong", includeJastip: true, jastipFeeSpecial: 20000, addon: ["Butter Cinnamon", "Butter Vanilla", "Butter Strawberry"], imageUrl: undefined, isAvailable: true, sortOrder: 7 },
  { externalId: "m8", restaurantId: "rest1", name: "Kue Ngeprul Roombutter", description: "Kue ngeprul varian roombutter", price: 75000, category: "Kue Ngeprul", includeJastip: true, jastipFeeSpecial: undefined, addon: undefined, imageUrl: undefined, isAvailable: true, sortOrder: 8 },
  { externalId: "m9", restaurantId: "rest1", name: "Kue Ngeprul Cashew Nut", description: "Kue ngeprul varian cashew nut", price: 75000, category: "Kue Ngeprul", includeJastip: true, jastipFeeSpecial: undefined, addon: undefined, imageUrl: undefined, isAvailable: true, sortOrder: 9 },
  { externalId: "m10", restaurantId: "rest1", name: "Kue Ngeprul Almond", description: "Kue ngeprul varian almond", price: 75000, category: "Kue Ngeprul", includeJastip: true, jastipFeeSpecial: undefined, addon: undefined, imageUrl: undefined, isAvailable: true, sortOrder: 10 },
  { externalId: "m11", restaurantId: "rest1", name: "Kue Ngeprul Hazelnut", description: "Kue ngeprul varian hazelnut", price: 75000, category: "Kue Ngeprul", includeJastip: true, jastipFeeSpecial: undefined, addon: undefined, imageUrl: undefined, isAvailable: true, sortOrder: 11 },
  { externalId: "m12", restaurantId: "rest1", name: "Kue Ngeprul Kacang", description: "Kue ngeprul varian kacang", price: 75000, category: "Kue Ngeprul", includeJastip: true, jastipFeeSpecial: undefined, addon: undefined, imageUrl: undefined, isAvailable: true, sortOrder: 12 },
  { externalId: "m13", restaurantId: "rest1", name: "Kue Ngeprul Pandan", description: "Kue ngeprul varian pandan", price: 75000, category: "Kue Ngeprul", includeJastip: true, jastipFeeSpecial: undefined, addon: undefined, imageUrl: undefined, isAvailable: true, sortOrder: 13 },
  { externalId: "m14", restaurantId: "rest1", name: "Kue Ngeprul Coklat", description: "Kue ngeprul varian coklat", price: 75000, category: "Kue Ngeprul", includeJastip: true, jastipFeeSpecial: undefined, addon: undefined, imageUrl: undefined, isAvailable: true, sortOrder: 14 },
  { externalId: "m15", restaurantId: "rest1", name: "Brownies Coklat", description: "Brownies klasik coklat", price: 35000, category: "Brownies", includeJastip: true, jastipFeeSpecial: undefined, addon: undefined, imageUrl: undefined, isAvailable: true, sortOrder: 15 },
  { externalId: "m16", restaurantId: "rest1", name: "Brownies Keju", description: "Brownies dengan topping keju", price: 35000, category: "Brownies", includeJastip: true, jastipFeeSpecial: undefined, addon: undefined, imageUrl: undefined, isAvailable: true, sortOrder: 16 },
  { externalId: "m17", restaurantId: "rest1", name: "Brownies Kacang", description: "Brownies dengan topping kacang", price: 35000, category: "Brownies", includeJastip: true, jastipFeeSpecial: undefined, addon: undefined, imageUrl: undefined, isAvailable: true, sortOrder: 17 },
  { externalId: "m18", restaurantId: "rest1", name: "Brownies Almond", description: "Brownies dengan topping almond", price: 35000, category: "Brownies", includeJastip: true, jastipFeeSpecial: undefined, addon: undefined, imageUrl: undefined, isAvailable: true, sortOrder: 18 },
  { externalId: "m19", restaurantId: "rest1", name: "Brownie
