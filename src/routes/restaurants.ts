import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';
import { createRestaurantSchema, updateRestaurantSchema } from '../schemas/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { getQueryString } from '../utils/query.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const restaurants = await prisma.restaurant.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { menus: true } },
      jastipOverrides: true,
    },
  });

  res.json({
    success: true,
    data: restaurants.map((r) => ({
      ...r,
      menuCount: r._count.menus,
      jastipOverride: r.jastipOverrides[0]?.fee ?? null,
    })),
  });
});

router.get('/:id', async (req: Request, res: Response) => {
  const restaurantId: string = req.params.id as string;
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      menus: {
        where: { isAvailable: true },
        orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      },
      jastipOverrides: true,
    },
  });

  if (!restaurant) throw new AppError(404, 'Restaurant not found');

  res.json({
    success: true,
    data: {
      ...restaurant,
      jastipOverride: restaurant.jastipOverrides[0]?.fee ?? null,
    },
  });
});

router.post('/', async (req: Request, res: Response) => {
  const data = createRestaurantSchema.parse(req.body);
  const restaurant = await prisma.restaurant.create({ data });
  res.status(201).json({ success: true, data: restaurant });
});

router.patch('/:id', async (req: Request, res: Response) => {
  const restaurantId: string = req.params.id as string;
  const data = updateRestaurantSchema.parse(req.body);
  const restaurant = await prisma.restaurant.update({
    where: { id: restaurantId },
    data,
  });
  res.json({ success: true, data: restaurant });
});

router.delete('/:id', async (req: Request, res: Response) => {
  const restaurantId: string = req.params.id as string;
  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: { isActive: false },
  });
  res.json({ success: true, message: 'Restaurant deactivated' });
});

// Jastip override
router.post('/:id/jastip-override', async (req: Request, res: Response) => {
  const restaurantId: string = req.params.id as string;
  const { fee, createdBy } = req.body;
  const override = await prisma.jastipOverride.upsert({
    where: { restaurantId },
    update: { fee, createdBy },
    create: { restaurantId, fee, createdBy },
  });
  res.json({ success: true, data: override });
});

router.delete('/:id/jastip-override', async (req: Request, res: Response) => {
  const restaurantId: string = req.params.id as string;
  await prisma.jastipOverride.delete({
    where: { restaurantId },
  });
  res.json({ success: true, message: 'Override removed' });
});

export default router;;