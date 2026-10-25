import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';
import { calculateOrderTotals } from '../services/calculations.js';
import { AppError } from '../middleware/errorHandler.js';
import { getQueryString } from '../utils/query.js';

const router = Router();

// Calculate totals for a set of items (used by frontend cart)
router.post('/preview', async (req: Request, res: Response) => {
  const { items, jastipOverrides } = req.body as {
    items: Array<{
      id?: string;
      restaurantId: string;
      name: string;
      price: number;
      quantity: number;
      includeJastip: boolean;
      jastipFeeSpecial?: number | null;
      category: string;
    }>;
    jastipOverrides?: Record<string, number>;
  };

  if (!items?.length) {
    throw new AppError(400, 'Items array required');
  }

  // Ensure each item has an id
  const itemsWithId = items.map((item, index): {
    id: string;
    restaurantId: string;
    name: string;
    price: number;
    quantity: number;
    includeJastip: boolean;
    jastipFeeSpecial?: number | null;
    category: string;
  } => ({
    ...item,
    id: item.id ?? `item-${Date.now()}-${index}`,
  }));

  const restaurantIds = [...new Set(itemsWithId.map((i) => i.restaurantId))];
  const restaurants = await prisma.restaurant.findMany({
    where: { id: { in: restaurantIds } },
  });
  const restaurantMap = new Map(restaurants.map((r) => [r.id, r]));
  const overrideMap = new Map(Object.entries(jastipOverrides ?? {}));

  const totals = calculateOrderTotals(itemsWithId, restaurantMap, overrideMap);
  res.json({ success: true, data: totals });
});

// Get jastip fee breakdown for a restaurant
router.get('/restaurant/:id/breakdown', async (req: Request, res: Response) => {
  const restaurantId: string = req.params.id as string;
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });
  if (!restaurant) throw new AppError(404, 'Restaurant not found');

  const override = await prisma.jastipOverride.findUnique({
    where: { restaurantId },
  });

  res.json({
    success: true,
    data: {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        jastipFee: restaurant.jastipFee,
        multiple: restaurant.multiple,
        taxService: restaurant.taxService,
        taxCharge: restaurant.taxCharge,
      },
      override: override?.fee ?? null,
    },
  });
});

export default router;