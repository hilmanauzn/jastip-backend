import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';
import { createCustomerSchema } from '../schemas/index.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const customers = await prisma.customer.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { orders: true } } },
  });
  res.json({ success: true, data: customers });
});

router.get('/:id', async (req: Request, res: Response) => {
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id },
    include: { orders: { orderBy: { createdAt: 'desc' }, take: 10 } },
  });
  if (!customer) throw new AppError(404, 'Customer not found');
  res.json({ success: true, data: customer });
});

router.post('/', async (req: Request, res: Response) => {
  const data = createCustomerSchema.parse(req.body);
  const customer = await prisma.customer.upsert({
    where: { name: data.name },
    update: data,
    create: data,
  });
  res.status(201).json({ success: true, data: customer });
});

router.patch('/:id', async (req: Request, res: Response) => {
  const data = createCustomerSchema.partial().parse(req.body);
  const customer = await prisma.customer.update({
    where: { id: req.params.id },
    data,
  });
  res.json({ success: true, data: customer });
});

router.delete('/:id', async (req: Request, res: Response) => {
  await prisma.customer.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Customer deleted' });
});

export default router;