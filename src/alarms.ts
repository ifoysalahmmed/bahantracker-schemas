import { z } from 'zod';
import { Id, UtcTime } from './common.js';
import { AlarmType } from './history.js';
import { SpeedLimit } from './vehicles.js';

export const ALARM_TYPES = AlarmType.options;

export const DeviceAlarm = AlarmType.extract([
  'sos',
  'power_cut',
  'vibration',
  'low_battery',
]);

export type DeviceAlarm = z.infer<typeof DeviceAlarm>;

export const DEFAULT_ALARMS: readonly AlarmType[] = [
  'sos',
  'power_cut',
  'overspeed',
  'excessive_idling',
  'zone_in',
  'zone_out',
];

export const DEFAULT_IDLE_MINUTES = 10;

export const LATE_ALARM_S = 600;

export const ALARM_LIST_MAX_DAYS = 7;

export const ALARM_PAGE_SIZE = 100;

export const UNSEEN_ALARMS_CAP = 100;

export const IdleMinutes = z.int().min(1).max(240);

export type IdleMinutes = z.infer<typeof IdleMinutes>;

export const Alarm = z.object({
  objectId: z.string(),
  type: AlarmType,
  time: UtcTime,
  end: UtcTime.nullable(),
  receivedAt: UtcTime,
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  speedKmh: z.number().min(0),
  value: z.number().nullable(),
  limitValue: z.number().nullable(),
  zoneId: z.string().nullable(),
  zoneName: z.string().nullable(),
  estimated: z.boolean(),
});

export type Alarm = z.infer<typeof Alarm>;

export const AlarmMessage = z.object({
  v: z.literal(1),
  alarms: z.array(Alarm).min(1),
});

export type AlarmMessage = z.infer<typeof AlarmMessage>;

export const AlarmCursor = z
  .string()
  .regex(
    /^[0-9]{1,15}_[1-9][0-9]{0,17}_(?:0|[1-9][0-9]{0,17})_(?:overspeed|ignition_on|ignition_off|power_cut|low_battery|sos|zone_in|zone_out|excessive_idling|vibration)$/,
  );

export type AlarmCursor = z.infer<typeof AlarmCursor>;

export const AlarmQuery = z
  .object({
    from: UtcTime,
    to: UtcTime,
    objectId: Id.optional(),
    type: AlarmType.optional(),
    cursor: AlarmCursor.optional(),
  })
  .refine((value) => Date.parse(value.to) > Date.parse(value.from), {
    path: ['to'],
  })
  .refine(
    (value) =>
      Date.parse(value.to) - Date.parse(value.from) <=
      ALARM_LIST_MAX_DAYS * 24 * 60 * 60 * 1000,
    {
      path: ['to'],
    },
  );

export type AlarmQuery = z.infer<typeof AlarmQuery>;

export const AlarmPage = z.object({
  items: z.array(Alarm),
  next: AlarmCursor.nullable(),
});

export type AlarmPage = z.infer<typeof AlarmPage>;

export const UnseenAlarms = z.object({
  count: z.int().min(0).max(UNSEEN_ALARMS_CAP),
});

export type UnseenAlarms = z.infer<typeof UnseenAlarms>;

export const AlarmPreferences = z.object({
  notifications: z.boolean(),
  sound: z.boolean(),
});

export type AlarmPreferences = z.infer<typeof AlarmPreferences>;

export const AlarmPreferencesRequest = AlarmPreferences.partial().refine(
  (value) => value.notifications !== undefined || value.sound !== undefined,
);

export type AlarmPreferencesRequest = z.infer<typeof AlarmPreferencesRequest>;

export const ObjectAlarmSettings = z.object({
  objectId: z.string(),
  enabled: z.array(AlarmType),
  speedLimitKmh: SpeedLimit,
  idleMinutes: IdleMinutes,
});

export type ObjectAlarmSettings = z.infer<typeof ObjectAlarmSettings>;

export const AlarmSettingsList = z.object({
  sold: z.array(AlarmType),
  objects: z.array(ObjectAlarmSettings),
});

export type AlarmSettingsList = z.infer<typeof AlarmSettingsList>;

export const AlarmSettingsRequest = z
  .object({
    objectIds: z.array(Id).min(1).max(1000),
    turnOn: z.array(AlarmType).default([]),
    turnOff: z.array(AlarmType).default([]),
    speedLimitKmh: SpeedLimit.optional(),
    idleMinutes: IdleMinutes.optional(),
  })
  .refine(
    (value) => !value.turnOn.some((type) => value.turnOff.includes(type)),
    {
      path: ['turnOff'],
    },
  )
  .refine(
    (value) =>
      value.turnOn.length > 0 ||
      value.turnOff.length > 0 ||
      value.speedLimitKmh !== undefined ||
      value.idleMinutes !== undefined,
  );

export type AlarmSettingsRequest = z.infer<typeof AlarmSettingsRequest>;
