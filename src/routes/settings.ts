import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';
import { settingsSchema } from '../schemas/index.js';

const router = Router();

function parseBankAccounts(bankAccounts: string): string[] {
  try {
    return JSON.parse(bankAccounts);
  } catch {
    return [];
  }
}

function serializeSettings(settings: { bankAccounts: string }) {
  return { ...settings, bankAccounts: parseBankAccounts(settings.bankAccounts) };
}

router.get('/', async (_req: Request, res: Response) => {
  let settings = await prisma.settings.findUnique({ where: { id: 'singleton' } });
  if (!settings) {
    settings = await prisma.settings.create({ data: { id: 'singleton' } });
  }
  res.json({ success: true, data: serializeSettings(settings) });
});

router.patch('/', async (req: Request, res: Response) => {
  const data = settingsSchema.parse(req.body);
  const updateData: Record<string, unknown> = {};
  if (data.shopName !== undefined) updateData.shopName = data.shopName;
  if (data.tagline !== undefined) updateData.tagline = data.tagline;
  if (data.bankAccounts !== undefined) updateData.bankAccounts = JSON.stringify(data.bankAccounts);
  if (data.qrisImageUrl !== undefined) updateData.qrisImageUrl = data.qrisImageUrl;
  if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;

  const createData: Record<string, unknown> = { id: 'singleton', ...updateData };

  const settings = await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: updateData as Parameters<typeof prisma.settings.upsert>[0]['update'],
    create: createData as Parameters<typeof prisma.settings.upsert>[0]['create'],
  });
  res.json({ success: true, data: serializeSettings(settings) });
});

export default router;