import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';
import { createOrderSchema, updateOrderStatusSchema } from '../schemas/index.js';
import { calculateOrderTotals, generateOrderNumber } from '../services/calculations.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const { status, customerId, page = '1', limit = '20' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        items: true,
        restaurantFees: true,
      },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({
    success: true,
    data: orders,
    pagination: { page: Number(page), limit: take, total, totalPages: Math.ceil(total / take) },
  });
});

router.get('/:id', async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      customer: true,
      items: true,
      restaurantFees: true,
    },
  });
  if (!order) throw new AppError(404, 'Order not found');
  res.json({ success: true, data: order });
});

// Preview calculation before creating order
router.post('/preview', async (req: Request, res: Response) => {
  const { items, jastipOverrides } = req.body as {
    items: Array<{
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

  const restaurantIds = [...new Set(items.map((i) => i.restaurantId))];
  const restaurants = await prisma.restaurant.findMany({
    where: { id: { in: restaurantIds } },
  });
  const restaurantMap = new Map(restaurants.map((r) => [r.id, r]));
  const overrideMap = new Map(Object.entries(jastipOverrides ?? {}));

  const totals = calculateOrderTotals(items, restaurantMap, overrideMap);
  res.json({ success: true, data: totals });
});

router.post('/', async (req: Request, res: Response) => {
  const data = createOrderSchema.parse(req.body);

  // Get restaurant data for calculations
  const restaurantIds = [...new Set(data.items.map((i) => i.restaurantId))];
  const restaurants = await prisma.restaurant.findMany({
    where: { id: { in: restaurantIds } },
  });
  const restaurantMap = new Map(restaurants.map((r) => [r.id, r]));
  const overrideMap = new Map(Object.entries(data.jastipOverrides ?? {}));

  // Calculate totals
  const totals = calculateOrderTotals(
    data.items,
    restaurantMap,
    overrideMap,
  );

  // Create order with items and fees in transaction
  const order = await prisma.$transaction(async (tx) => {
    // Create customer if not exists (or get existing)
    let customer = await tx.customer.findUnique({
      where: { id: data.customerId },
    });
    if (!customer) {
      customer = await tx.customer.create({
        data: { id: data.customerId, name: data.customerName },
      });
    }

    // Create order
    const newOrder = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerId: data.customerId,
        customerName: data.customerName,
        status: 'DRAFT',
        subtotal: totals.subtotalAll,
        jastipFeeTotal: totals.jastipFeeAll,
        taxServiceTotal: totals.taxServiceAll,
        taxChargeTotal: totals.taxChargeAll,
        grandTotal: totals.totalAll,
        ongkir: data.ongkir,
        destination: data.destination,
        notes: data.notes,
        items: {
          create: data.items.map((item) => ({
            ...item,
            subtotal: item.price * item.quantity,
          })),
        },
        restaurantFees: {
          create: totals.restaurants.map((rf) => ({
            restaurantId: rf.restaurantId,
            restaurantName: rf.restaurantName,
            subtotal: rf.subtotal,
            subtotalTaxable: rf.subtotalTaxable,
            subtotalNonTax: rf.subtotalNonTaxable,
            calculatedFee: rf.calculatedJastipFee,
            overrideFee: rf.hasJastipOverride ? rf.jastipFee : null,
            finalFee: rf.jastipFee,
            taxServiceAmount: rf.taxServiceAmount,
            taxChargeAmount: rf.taxChargeAmount,
            total: rf.total,
            totalQuantity: rf.totalQuantity,
            qtyIncludeJastip: rf.totalQuantityIncludeJastip,
            multiple: rf.multiple,
            batches: rf.batches,
            hasMultipleWarning: rf.hasMultipleWarning,
          })),
        },
      },
      include: { items: true, restaurantFees: true, customer: true },
    });

    return newOrder;
  });

  res.status(201).json({ success: true, data: order });
});

router.patch('/:id/status', async (req: Request, res: Response) => {
  const { status } = updateOrderStatusSchema.parse(req.body);
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status },
    include: { items: true, restaurantFees: true },
  });
  res.json({ success: true, data: order });
});

router.patch('/:id/payment', async (req: Request, res: Response) => {
  const { paymentStatus } = req.body as { paymentStatus: string };
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { paymentStatus },
  });
  res.json({ success: true, data: order });
});

router.delete('/:id', async (req: Request, res: Response) => {
  await prisma.order.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Order deleted' });
});

export default router;