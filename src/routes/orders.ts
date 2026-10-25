import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';
import { createOrderSchema, updateOrderStatusSchema } from '../schemas/index.js';
import { calculateOrderTotals, generateOrderNumber } from '../services/calculations.js';
import { AppError } from '../middleware/errorHandler.js';
import { getQueryString } from '../utils/query.js';

interface OrderItemInput {
  id?: string;
  menuItemId?: string;
  restaurantId: string;
  name: string;
  description?: string;
  price: number;
  basePrice?: number;
  quantity: number;
  category: string;
  includeJastip: boolean;
  jastipFeeSpecial?: number | null;
  selectedAddon?: string;
  isManual: boolean;
}

interface OrderItemWithId extends OrderItemInput {
  id: string;
}

function ensureItemId(items: OrderItemInput[]): OrderItemWithId[] {
  return items.map((item, index) => ({
    ...item,
    id: item.id ?? `item-${Date.now()}-${index}`,
  })) as OrderItemWithId[];
}

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const status: string | undefined = getQueryString(req, 'status');
  const customerId: string | undefined = getQueryString(req, 'customerId');
  const page = Number(getQueryString(req, 'page') ?? '1');
  const limit = Number(getQueryString(req, 'limit') ?? '20');
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
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
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

router.get('/:id', async (req: Request, res: Response) => {
  const orderId: string = req.params.id as string;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
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
      id?: string;
      restaurantId: string;
      name: string;
      price: number;
      quantity: number;
      includeJastip: boolean;
      jastipFeeSpecial?: number | null;
      category: string;
      isManual?: boolean;
    }>;
    jastipOverrides?: Record<string, number>;
  };

  const itemsWithId = ensureItemId(
    items.map((item) => ({
      ...item,
      isManual: item.isManual ?? false,
      restaurantId: item.restaurantId,
    })) as OrderItemInput[],
  );

  const restaurantIds = [...new Set(itemsWithId.map((i) => i.restaurantId))];
  const restaurants = await prisma.restaurant.findMany({
    where: { id: { in: restaurantIds } },
  });
  const restaurantMap = new Map(restaurants.map((r) => [r.id, r]));
  const overrideMap = new Map(Object.entries(jastipOverrides ?? {}));

  const totals = calculateOrderTotals(itemsWithId, restaurantMap, overrideMap);
  res.json({ success: true, data: totals });
});

router.post('/', async (req: Request, res: Response) => {
  const data = createOrderSchema.parse(req.body);
  const itemsWithId = data.items.map((item, index): {
    id: string;
    menuItemId?: string;
    restaurantId: string;
    name: string;
    description?: string;
    price: number;
    basePrice?: number;
    quantity: number;
    category: string;
    includeJastip: boolean;
    jastipFeeSpecial?: number | null;
    selectedAddon?: string;
    isManual: boolean;
  } => ({
    ...item,
    id: item.id ?? `item-${Date.now()}-${index}`,
  }));

  // Get restaurant data for calculations
  const restaurantIds = [...new Set(itemsWithId.map((i) => i.restaurantId))];
  const restaurants = await prisma.restaurant.findMany({
    where: { id: { in: restaurantIds } },
  });
  const restaurantMap = new Map(restaurants.map((r) => [r.id, r]));
  const overrideMap = new Map(Object.entries(data.jastipOverrides ?? {}));

  // Calculate totals
  const totals = calculateOrderTotals(itemsWithId, restaurantMap, overrideMap);

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
          create: itemsWithId.map((item) => ({
            id: item.id,
            menuItemId: item.menuItemId,
            restaurantId: item.restaurantId,
            name: item.name,
            description: item.description,
            price: item.price,
            basePrice: item.basePrice,
            quantity: item.quantity,
            category: item.category,
            includeJastip: item.includeJastip,
            jastipFeeSpecial: item.jastipFeeSpecial,
            selectedAddon: item.selectedAddon,
            isManual: item.isManual,
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
  const orderId: string = req.params.id as string;
  const { status } = updateOrderStatusSchema.parse(req.body);
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: { items: true, restaurantFees: true },
  });
  res.json({ success: true, data: order });
});

router.patch('/:id/payment', async (req: Request, res: Response) => {
  const orderId: string = req.params.id as string;
  const { paymentStatus } = req.body as { paymentStatus: string };
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus },
  });
  res.json({ success: true, data: order });
});

router.delete('/:id', async (req: Request, res: Response) => {
  const orderId: string = req.params.id as string;
  await prisma.order.delete({ where: { id: orderId } });
  res.json({ success: true, message: 'Order deleted' });
});

export default router;