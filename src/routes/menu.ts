import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';
import { createMenuItemSchema, updateMenuItemSchema } from '../schemas/index.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const { restaurantId, category, search, available } = req.query;
  
  const where: Record<string, unknown> = {};
  if (restaurantId) where.restaurantId = restaurantId;
  if (category) where.category = category;
  if (available !== undefined) where.isAvailable = available === 'true';
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } },
      { category: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const items = await prisma.menuItem.findMany({
    where,
    include: { restaurant: true },
    orderBy: [
      { restaurant: { name: 'asc' } },
      { category: 'asc' },
      { sortOrder: 'asc' },
      { name: 'asc' },
    ],
  });

  res.json({ success: true, data: items });
});

router.get('/categories', async (req: Request, res: Response) => {
  const { restaurantId } = req.query;
  const categories = await prisma.menuItem.groupBy({
    by: ['category'],
    where: { 
      restaurantId: restaurantId as string,
      isAvailable: true,
    },
    _count: { category: true },
  });

  res.json({
    success: true,
    data: categories.map((c) => ({
      name: c.category,
      count: c._count.category,
    })),
  });
});

router.get('/:id', async (req: Request, res: Response) => {
  const item = await prisma.menuItem.findUnique({
    where: { id: req.params.id },
    include: { restaurant: true },
  });
  if (!item) throw new AppError(404, 'Menu item not found');
  res.json({ success: true, data: item });
});

router.post('/', async (req: Request, res: Response) => {
  const data = createMenuItemSchema.parse(req.body);
  const item = await prisma.menuItem.create({ data });
  res.status(201).json({ success: true, data: item });
});

router.patch('/:id', async (req: Request, res: Response) => {
  const data = updateMenuItemSchema.parse(req.body);
  const item = await prisma.menuItem.update({
    where: { id: req.params.id },
    data,
  });
  res.json({ success: true, data: item });
});

router.delete('/:id', async (req: Request, res: Response) => {
  await prisma.menuItem.update({
    where: { id: req.params.id },
    data: { isAvailable: false },
  });
  res.json({ success: true, message: 'Menu item deactivated' });
});

// Bulk import (for initial migration)
router.post('/bulk', async (req: Request, res: Response) => {
  const { items } = req.body as { items: unknown[] };
  const created = await prisma.menuItem.createMany({
    data: items,
    skipDuplicates: true,
  });
  res.json({ success: true, data: created });
});

export default router;