import { z } from 'zod';

export const createRestaurantSchema = z.object({
  name: z.string().min(1).max(100),
  jastipFee: z.number().int().nonnegative(),
  multiple: z.number().int().positive().default(1),
  taxService: z.number().int().min(0).max(100).default(0),
  taxCharge: z.number().int().min(0).max(100).default(0),
  isActive: z.boolean().default(true),
});

export const updateRestaurantSchema = createRestaurantSchema.partial();

export const createMenuItemSchema = z.object({
  restaurantId: z.string().cuid(),
  externalId: z.string().optional(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().int().positive(),
  category: z.string().min(1).max(50),
  includeJastip: z.boolean().default(true),
  jastipFeeSpecial: z.number().int().nonnegative().optional(),
  addons: z.array(z.string()).default([]),
  imageUrl: z.string().url().optional(),
  isAvailable: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export const createCustomerSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

export const createOrderSchema = z.object({
  customerId: z.string().cuid(),
  customerName: z.string().min(1).max(100),
  items: z.array(z.object({
    menuItemId: z.string().cuid().optional(),
    name: z.string().min(1).max(200),
    description: z.string().optional(),
    price: z.number().int().positive(),
    basePrice: z.number().int().positive().optional(),
    quantity: z.number().int().positive().default(1),
    category: z.string().min(1).max(50),
    includeJastip: z.boolean().default(true),
    jastipFeeSpecial: z.number().int().nonnegative().optional(),
    selectedAddon: z.string().optional(),
    isManual: z.boolean().default(false),
  })).min(1, 'Minimal 1 item'),
  ongkir: z.number().int().nonnegative().default(0),
  destination: z.string().optional(),
  notes: z.string().optional(),
  jastipOverrides: z.record(z.string(), z.number().int().nonnegative()).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['DRAFT', 'CONFIRMED', 'PAID', 'CANCELLED']),
});

export const jastipOverrideSchema = z.object({
  restaurantId: z.string().cuid(),
  fee: z.number().int().nonnegative(),
  createdBy: z.string().optional(),
});

export const settingsSchema = z.object({
  shopName: z.string().optional(),
  tagline: z.string().optional(),
  bankAccounts: z.array(z.string()).optional(),
  qrisImageUrl: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
});