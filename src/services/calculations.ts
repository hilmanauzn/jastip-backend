import { Prisma, Restaurant, MenuItem } from '@prisma/client';

export interface MenuItemWithRestaurant extends MenuItem {
  restaurant: Restaurant;
}

export interface RestaurantBreakdown {
  restaurantId: string;
  restaurantName: string;
  subtotal: number;
  subtotalTaxable: number;
  subtotalNonTaxable: number;
  jastipFee: number;
  calculatedJastipFee: number;
  hasJastipOverride: boolean;
  taxServiceAmount: number;
  taxChargeAmount: number;
  taxRateService: number;
  taxRateCharge: number;
  total: number;
  totalQuantity: number;
  totalQuantityIncludeJastip: number;
  multiple: number;
  batches: number;
  hasMultipleWarning: boolean;
}

export interface CartTotals {
  restaurants: RestaurantBreakdown[];
  subtotalAll: number;
  jastipFeeAll: number;
  taxServiceAll: number;
  taxChargeAll: number;
  totalAll: number;
  totalQuantityAll: number;
  hasMultipleWarnings: boolean;
}

function isTaxExemptItem(item: { name: string; includeJastip: boolean }): boolean {
  return /\b(?:paperbag|dus|box)\b/i.test(item.name);
}

export function calculateOrderTotals(
  items: Array<{
    id: string;
    restaurantId: string;
    name: string;
    price: number;
    quantity: number;
    includeJastip: boolean;
    jastipFeeSpecial?: number | null;
    category: string;
  }>,
  restaurants: Map<string, Restaurant>,
  jastipOverrides: Map<string, number> = new Map(),
): CartTotals {
  const grouped = new Map<string, typeof items>();
  
  for (const item of items) {
    if (!grouped.has(item.restaurantId)) {
      grouped.set(item.restaurantId, []);
    }
    grouped.get(item.restaurantId)!.push(item);
  }

  const breakdowns: RestaurantBreakdown[] = [];
  let subtotalAll = 0;
  let jastipFeeAll = 0;
  let taxServiceAll = 0;
  let taxChargeAll = 0;
  let totalAll = 0;
  let totalQuantityAll = 0;
  let hasMultipleWarnings = false;

  for (const [restId, restItems] of grouped.entries()) {
    const restaurant = restaurants.get(restId);
    if (!restaurant) continue;

    const taxableItems = restItems.filter((item) => !isTaxExemptItem(item));
    const nonTaxableItems = restItems.filter(isTaxExemptItem);

    const subtotalTaxable = taxableItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const subtotalNonTaxable = nonTaxableItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const subtotal = subtotalTaxable + subtotalNonTaxable;

    const totalQuantity = restItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const totalQuantityIncludeJastip = restItems
      .filter((item) => item.includeJastip)
      .reduce((sum, item) => sum + item.quantity, 0);

    // Hitung fee jastip
    let calculatedJastipFee = 0;
    let qtyNormalInclude = 0;
    let specialFeeTotal = 0;

    for (const item of restItems) {
      if (item.includeJastip) {
        if (item.jastipFeeSpecial) {
          specialFeeTotal += item.jastipFeeSpecial * item.quantity;
        } else {
          qtyNormalInclude += item.quantity;
        }
      }
    }

    const multiple = restaurant.multiple;
    let batches = 0;
    if (qtyNormalInclude > 0) {
      batches = Math.ceil(qtyNormalInclude / multiple);
      calculatedJastipFee += batches * restaurant.jastipFee;
    }
    calculatedJastipFee += specialFeeTotal;

    const overrideFee = jastipOverrides.get(restId);
    const hasJastipOverride = overrideFee !== undefined;
    const jastipFee = hasJastipOverride ? overrideFee : calculatedJastipFee;

    const taxServiceAmount = Math.round(
      subtotalTaxable * (restaurant.taxService / 100),
    );
    const taxChargeAmount = Math.round(
      (subtotalTaxable + taxServiceAmount) * (restaurant.taxCharge / 100),
    );

    const total = subtotal + jastipFee + taxServiceAmount + taxChargeAmount;

    const hasMultipleWarning =
      multiple > 1 && totalQuantityIncludeJastip % multiple !== 0;
    if (hasMultipleWarning) hasMultipleWarnings = true;

    breakdowns.push({
      restaurantId: restId,
      restaurantName: restaurant.name,
      subtotal,
      subtotalTaxable,
      subtotalNonTaxable,
      jastipFee,
      calculatedJastipFee,
      hasJastipOverride,
      taxServiceAmount,
      taxChargeAmount,
      taxRateService: restaurant.taxService,
      taxRateCharge: restaurant.taxCharge,
      total,
      totalQuantity,
      multiple,
      batches,
      hasMultipleWarning,
      totalQuantityIncludeJastip,
    });

    subtotalAll += subtotal;
    jastipFeeAll += jastipFee;
    taxServiceAll += taxServiceAmount;
    taxChargeAll += taxChargeAmount;
    totalAll += total;
    totalQuantityAll += totalQuantity;
  }

  return {
    restaurants: breakdowns,
    subtotalAll,
    jastipFeeAll,
    taxServiceAll,
    taxChargeAll,
    totalAll,
    totalQuantityAll,
    hasMultipleWarnings,
  };
}

export function generateOrderNumber(): string {
  return `ORD-${Date.now().toString().slice(-6).padStart(6, '0')}`;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
}