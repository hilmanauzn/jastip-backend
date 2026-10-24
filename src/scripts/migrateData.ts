import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read data from frontend project
const frontendDataPath = join(__dirname, '..', '..', '..', 'invoice-generator', 'data', 'index.ts');
const dataSource = readFileSync(frontendDataPath, 'utf-8');

// Extract menuData and restaurantData using regex (simple approach)
// The file exports: export const menuData: MenuItem[] = [...]
// and export const restaurantData: RestaurantItem[] = [...]

function extractArray(source: string, name: string): unknown[] {
  const regex = new RegExp(`export const ${name}:\\s*.*?=\\s*(\\[[\\s\\S]*?\\])\\s*;`, 'm');
  const match = source.match(regex);
  if (!match) throw new Error(`Could not find ${name}`);
  // Use eval in a safe way - the data is from our own codebase
  // eslint-disable-next-line no-eval
  return eval(`(${match[1]})`);
}

const menuData = extractArray(dataSource, 'menuData');
const restaurantData = extractArray(dataSource, 'restaurantData');

const prisma = new PrismaClient();

async function migrate() {
  console.log('🔄 Starting data migration...');

  // 1. Migrate restaurants
  console.log('📦 Migrating restaurants...');
  for (const rest of restaurantData as Array<{ id: string; name: string; jastipFee: number; multiple: number; taxService?: number; taxCharge?: number; available: boolean }>) {
    await prisma.restaurant.upsert({
      where: { name: rest.name },
      update: {
        jastipFee: rest.jastipFee,
        multiple: rest.multiple,
        taxService: rest.taxService ?? 0,
        taxCharge: rest.taxCharge ?? 0,
        isActive: rest.available,
      },
      create: {
        name: rest.name,
        jastipFee: rest.jastipFee,
        multiple: rest.multiple,
        taxService: rest.taxService ?? 0,
        taxCharge: rest.taxCharge ?? 0,
        isActive: rest.available,
      },
    });
  }
  console.log(`✅ ${restaurantData.length} restaurants migrated`);

  // 2. Build restaurant map
  const restaurants = await prisma.restaurant.findMany();
  const restaurantMap = new Map(restaurants.map((r) => [r.name, r.id]));

  // 3. Migrate menu items
  console.log('📦 Migrating menu items...');
  let migrated = 0;
  let skipped = 0;

  for (const item of menuData as Array<{ id: string; idRestaurant: string; name: string; description?: string; price: number; category: string; includeJastip: boolean; jastipFeeSpecial?: number; addon?: string[]; available: boolean }>) {
    const restName = (restaurantData as Array<{ id: string; name: string }>).find((r) => r.id === item.idRestaurant)?.name;
    const restaurantId = restName ? restaurantMap.get(restName) : undefined;

    if (!restaurantId) {
      console.warn(`⚠️  Restaurant not found for item ${item.name} (${item.idRestaurant})`);
      skipped++;
      continue;
    }

    try {
      await prisma.menuItem.upsert({
        where: { externalId: item.id },
        update: {
          restaurantId,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          includeJastip: item.includeJastip,
          jastipFeeSpecial: item.jastipFeeSpecial ?? null,
          addons: JSON.stringify(item.addon ?? []),
          isAvailable: item.available,
        },
        create: {
          externalId: item.id,
          restaurantId,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          includeJastip: item.includeJastip,
          jastipFeeSpecial: item.jastipFeeSpecial ?? null,
          addons: JSON.stringify(item.addon ?? []),
          isAvailable: item.available,
        },
      });
      migrated++;
    } catch (err) {
      console.error(`❌ Failed to migrate ${item.name}:`, err);
      skipped++;
    }
  }

  console.log(`✅ ${migrated} menu items migrated, ${skipped} skipped`);

  // 4. Create default settings
  await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      shopName: 'Titipmarinceu',
      tagline: 'Jasa Titip Makanan Viral Bandung',
      bankAccounts: JSON.stringify(['BCA - 5151120173']),
      logoUrl: '/logo.jpg',
      qrisImageUrl: '/qris.jpeg',
    },
  });
  console.log('✅ Default settings created');

  await prisma.$disconnect();
  console.log('🎉 Migration completed!');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});