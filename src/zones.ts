import { z } from 'zod';
import { Name } from './accounts.js';
import { Id } from './common.js';
import { Latitude, Longitude } from './history.js';

export const ZONES_PER_CLIENT_MAX = 500;

export const ZONE_RADIUS_MIN_M = 50;

export const ZONE_RADIUS_MAX_M = 50_000;

export const ZONE_POINTS_MIN = 3;

export const ZONE_POINTS_MAX = 100;

export const ZONE_OBJECTS_MAX = 5000;

export const ZonePoint = z.object({
  lat: Latitude,
  lon: Longitude,
});

export type ZonePoint = z.infer<typeof ZonePoint>;

const turn = (a: ZonePoint, b: ZonePoint, c: ZonePoint): number =>
  Math.sign(
    (b.lon - a.lon) * (c.lat - a.lat) - (b.lat - a.lat) * (c.lon - a.lon),
  );

const within = (a: ZonePoint, b: ZonePoint, c: ZonePoint): boolean =>
  c.lat >= Math.min(a.lat, b.lat) &&
  c.lat <= Math.max(a.lat, b.lat) &&
  c.lon >= Math.min(a.lon, b.lon) &&
  c.lon <= Math.max(a.lon, b.lon);

const segmentsMeet = (
  p1: ZonePoint,
  p2: ZonePoint,
  q1: ZonePoint,
  q2: ZonePoint,
): boolean => {
  const o1 = turn(p1, p2, q1);
  const o2 = turn(p1, p2, q2);
  const o3 = turn(q1, q2, p1);
  const o4 = turn(q1, q2, p2);

  if (o1 !== o2 && o3 !== o4) {
    return true;
  }

  return (
    (o1 === 0 && within(p1, p2, q1)) ||
    (o2 === 0 && within(p1, p2, q2)) ||
    (o3 === 0 && within(q1, q2, p1)) ||
    (o4 === 0 && within(q1, q2, p2))
  );
};

const turnsBack = (a: ZonePoint, b: ZonePoint, c: ZonePoint): boolean =>
  turn(a, b, c) === 0 &&
  (a.lat - b.lat) * (c.lat - b.lat) + (a.lon - b.lon) * (c.lon - b.lon) >= 0;

export const isSimplePolygon = (points: readonly ZonePoint[]): boolean => {
  const count = points.length;

  if (count < ZONE_POINTS_MIN) {
    return false;
  }

  const at = (index: number): ZonePoint => {
    const point = points[index % count];

    if (point === undefined) {
      throw new RangeError('polygon point missing');
    }

    return point;
  };

  for (let i = 0; i < count; i += 1) {
    if (turnsBack(at(i), at(i + 1), at(i + 2))) {
      return false;
    }
  }

  for (let i = 0; i < count; i += 1) {
    for (let j = i + 2; j < count; j += 1) {
      if (i === 0 && j === count - 1) {
        continue;
      }

      if (segmentsMeet(at(i), at(i + 1), at(j), at(j + 1))) {
        return false;
      }
    }
  }

  return true;
};

export const ZoneKind = z.enum(['circle', 'polygon']);

export type ZoneKind = z.infer<typeof ZoneKind>;

export const CircleShape = z.object({
  kind: z.literal('circle'),
  center: ZonePoint,
  radiusM: z.int().min(ZONE_RADIUS_MIN_M).max(ZONE_RADIUS_MAX_M),
});

export type CircleShape = z.infer<typeof CircleShape>;

export const PolygonShape = z.object({
  kind: z.literal('polygon'),
  points: z
    .array(ZonePoint)
    .min(ZONE_POINTS_MIN)
    .max(ZONE_POINTS_MAX)
    .refine(isSimplePolygon),
});

export type PolygonShape = z.infer<typeof PolygonShape>;

export const ZoneShape = z.discriminatedUnion('kind', [
  CircleShape,
  PolygonShape,
]);

export type ZoneShape = z.infer<typeof ZoneShape>;

export const Zone = z.object({
  id: z.string(),
  name: z.string(),
  shape: ZoneShape,
  alarmOnEnter: z.boolean(),
  alarmOnExit: z.boolean(),
  objectIds: z.array(z.string()),
});

export type Zone = z.infer<typeof Zone>;

export const Zones = z.array(Zone);

export type Zones = z.infer<typeof Zones>;

export const ZoneRequest = z.object({
  name: Name,
  shape: ZoneShape,
  alarmOnEnter: z.boolean(),
  alarmOnExit: z.boolean(),
  objectIds: z
    .array(Id)
    .max(ZONE_OBJECTS_MAX)
    .refine((ids) => new Set(ids).size === ids.length),
});

export type ZoneRequest = z.infer<typeof ZoneRequest>;
