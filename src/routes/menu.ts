import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';
import { createMenuItemSchema, updateMenuItemSchema } from '../schemas/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { getQueryString } from '../utils/query.js';

function serializeItem(item: { addons: string }): Record<string, unknown> {
  return {
    ...item,
    addons: JSON.parse(item.addons ?? '[]'),
  };
}

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const restaurantId: string | undefined = getQueryString(req, 'restaurantId');
  const category: string | undefined = getQueryString(req, 'category');
  const search: string | undefined = getQueryString(req, 'search');
  const available: string | undefined = getQueryString(req, 'available');

  const where: Record<string, unknown> = {};
  if (restaurantId) where.restaurantId = restaurantId;
  if (category) where.category = category;
  if (available !== undefined) where.isAvailable = available === 'true';
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
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
  const restaurantId: string | undefined = getQueryString(req, 'restaurantId');
  const categories = await prisma.menuItem.groupBy({
    by: ['category'],
    where: {
      restaurantId: restaurantId ?? undefined,
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
  const itemId: string = req.params.id as string;
  const item = await prisma.menuItem.findUnique({
    where: { id: itemId },
    include: { restaurant: true },
  });
  if (!item) throw new AppError(404, 'Menu item not found');
  res.json({ success: true, data: item });
});

router.post('/', async (req: Request, res: Response) => {
  const data = createMenuItemSchema.parse(req.body);
  const createData: Parameters<typeof prisma.menuItem.create>[0]['data'] = {
    ...data,
    addons: JSON.stringify(data.addons ?? []),
  };
  const item = await prisma.menuItem.create({ data: createData });
  res.status(201).json({ success: true, data: serializeItem(item) });
});

router.patch('/:id', async (req: Request, res: Response) => {
  const itemId: string = req.params.id as string;
  const data = updateMenuItemSchema.parse(req.body);
  const updateData: Parameters<typeof prisma.menuItem.update>[0]['data'] = {};
  if (data.restaurantId !== undefined) updateData.restaurantId = data.restaurantId;
  if (data.externalId !== undefined) updateData.externalId = data.externalId;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.includeJastip !== undefined) updateData.includeJastip = data.includeJastip;
  if (data.jastipFeeSpecial !== undefined) updateData.jastipFeeSpecial = data.jastipFeeSpecial;
  if (data.addons !== undefined) updateData.addons = JSON.stringify(data.addons);
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
  if (data.isAvailable !== undefined) updateData.isAvailable = data.isAvailable;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

  const item = await prisma.menuItem.update({
    where: { id: itemId },
    data: updateData,
  });
  res.json({ success: true, data: serializeItem(item) });
});

router.delete('/:id', async (req: Request, res: Response) => {
  const itemId: string = req.params.id as string;
  await prisma.menuItem.update({
    where: { id: itemId },
    data: { isAvailable: false },
  });
  res.json({ success: true, message: 'Menu item deactivated' });
});

// Bulk import (for initial migration)
router.post('/bulk', async (req: Request, res: Response) => {
  const { items } = req.body as { items: Array<{
    restaurantId: string;
    externalId?: string;
    name: string;
    description?: string;
    price: number;
    category: string;
    includeJastip?: boolean;
    jastipFeeSpecial?: number;
    addons?: string[];
    imageUrl?: string;
    isAvailable?: boolean;
    sortOrder?: number;
  }> };
  const data = items.map((item) => ({
    restaurantId: item.restaurantId,
    externalId: item.externalId,
    name: item.name,
    description: item.description,
    price: item.price,
    category: item.category,
    includeJastip: item.includeJastip ?? true,
    jastipFeeSpecial: item.jastipFeeSpecial,
    addons: JSON.stringify(item.addons ?? []),
    imageUrl: item.imageUrl,
    isAvailable: item.isAvailable ?? true,
    sortOrder: item.sortOrder ?? 0,
  }));
  const created = await prisma.menuItem.createMany({
    data: data as any,
  });
  res.json({ success: true, data: { count: created.count } });
});

export default router;