import { Request } from 'express';

export function getQueryString(req: Request, key: string): string | undefined {
  const value = req.query[key];
  if (Array.isArray(value)) return value[0] as string | undefined;
  return value as string | undefined;
}

export function getQueryStrings(req: Request, key: string): string[] {
  const value = req.query[key];
  if (Array.isArray(value)) return value as string[];
  return value ? [value as string] : [];
}