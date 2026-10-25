import { Request } from 'express';

export function getQueryString(req: Request, key: string): string | undefined {
  const value = req.query[key];
  if (Array.isArray(value)) return value[0] as string;
  if (typeof value === 'string') return value;
  return undefined;
}

export function getQueryNumber(req: Request, key: string): number | undefined {
  const value = getQueryString(req, key);
  if (value === undefined) return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}

export function getQueryBoolean(req: Request, key: string): boolean | undefined {
  const value = getQueryString(req, key);
  if (value === undefined) return undefined;
  return value === 'true';
}