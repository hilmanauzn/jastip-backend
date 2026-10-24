import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';
import { settingsSchema } from '../schemas/index.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  let settings = await prisma.settings.findUnique({ where: { id: 'singleton' } });
  if (!settings) {
    settings = await prisma.settings.create({ data: { id: 'singleton' } });
  }
  res.json({ success: true, data: settings });
});

router.patch('/', async (req: Request, res: Response) => {
  const data = settingsSchema.parse(req.body);
  const settings = await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: data,
    create: { id: 'singleton', ...data },
  });
  res.json({ success: true, data: settings });
});

export default router;