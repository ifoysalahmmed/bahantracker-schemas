import { z } from 'zod';
import { Id } from './common.js';
import { DayDistance } from './vehicles.js';

export const DASHBOARD_DAYS = 7;

export const DashboardQuery = z.object({
  objectId: Id.optional(),
});

export type DashboardQuery = z.infer<typeof DashboardQuery>;

export const DashboardSummary = z.object({
  days: z.array(DayDistance).length(DASHBOARD_DAYS),
  alarmsToday: z.int().min(0),
});

export type DashboardSummary = z.infer<typeof DashboardSummary>;
