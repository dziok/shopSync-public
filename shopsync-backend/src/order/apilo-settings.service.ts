import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

const CONFIG_PATH = path.resolve(__dirname, '..', '..', 'apilo-settings.json');
const RETIRED_LINE1_STATUS_IDS = new Set([225]);

export const ROTATION_DAY_KEYS = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
] as const;

export type RotationDayKey = typeof ROTATION_DAY_KEYS[number];
export type RotationDayMode = 'fixed' | 'drop_one';

/**
 * Harmonogram auto-włączania/wyłączania dla linii.
 * enableAt/disableAt w formacie "HH:mm"
 */
export interface AutoActiveSchedule {
    enabled: boolean;
    enableAt: string;
    disableAt: string;
    timezone?: string;
    weekendOnly?: boolean;
}

export interface TabRotationDayConfig {
    mode: RotationDayMode;
    enabledCount: number;
    disableAt: string;
}

/**
 * Rotacja zakładek docelowych dla linii.
 * participantIds = którzy użytkownicy biorą udział w cyklu
 * days = ustawienia dla każdego dnia tygodnia
 * cycleAnchorDate = data, od której liczymy cykl bez resetu co tydzień
 *
 * Pola legacy są zostawione tylko po to, żeby bezpiecznie migrować stare JSON-y.
 */
export interface TabRotationSchedule {
    enabled: boolean;
    timezone?: string;
    order?: number[];
    participantIds?: number[];
    cycleAnchorDate?: string; // YYYY-MM-DD
    days?: Partial<Record<RotationDayKey, Partial<TabRotationDayConfig>>>;
    morningEnabledCount?: number;
    disableAt?: string;
    weekdaysOnly?: boolean;
}

export interface MonthlyComputerCount {
    auto: number;
    manual: number;
}

export type MonthlyComputerTargetScheduleMode = 'always' | 'off' | 'alternate_a' | 'alternate_b' | 'alternate_c';

export interface MonthlyComputerTargetSchedule {
    mode: MonthlyComputerTargetScheduleMode;
}

export interface MonthlyComputerAssignment {
    timezone?: string;
    alternateAnchorDate?: string;
    mondayAllActive?: boolean;
    targetSchedules?: Record<number, MonthlyComputerTargetSchedule>;
    weekdayTargets: Partial<Record<RotationDayKey, number[]>>;
    monthlyCounts: Record<string, Record<number, MonthlyComputerCount>>;
    assignedOrders?: Record<string, {
        month: string;
        targetStatusId: number;
        computerCount: number;
        assignedAt: string;
    }>;
}

export interface ApiloLineSettings {
    active: boolean;
    sourceStatusId: number;
    targetStatusIds: number[];
    targetNames?: Record<number, string>;
    targetLimits: Record<number, number>;
    deliveryMethodPriority: string[];
    maxLargeOrderItems: number;
    autoSchedule?: AutoActiveSchedule;
    tabRotation?: TabRotationSchedule;
    monthlyComputerAssignment?: MonthlyComputerAssignment;
}

export interface ApiloSettingsFile {
    revision: number;
    updatedAt: string;
    line1: ApiloLineSettings;
    line2: ApiloLineSettings;
}

export type ApiloSettingsPatch = Partial<{
    line1: Partial<ApiloLineSettings>;
    line2: Partial<ApiloLineSettings>;
}>;

function isPlainObject(v: any): v is Record<string, any> {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function deepEqual(a: any, b: any): boolean {
    if (Object.is(a, b)) return true;

    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i += 1) {
            if (!deepEqual(a[i], b[i])) return false;
        }
        return true;
    }

    if (isPlainObject(a) && isPlainObject(b)) {
        const ak = Object.keys(a);
        const bk = Object.keys(b);
        if (ak.length !== bk.length) return false;
        for (const k of ak) {
            if (!bk.includes(k)) return false;
            if (!deepEqual(a[k], b[k])) return false;
        }
        return true;
    }

    return false;
}

function mergeDeep(target: any, patch: any): any {
    if (!isPlainObject(patch)) return patch;

    const out = isPlainObject(target) ? { ...target } : {};
    for (const [key, patchVal] of Object.entries(patch)) {
        const targetVal = (out as any)[key];

        if (isPlainObject(patchVal) && isPlainObject(targetVal)) {
            (out as any)[key] = mergeDeep(targetVal, patchVal);
        } else {
            (out as any)[key] = patchVal;
        }
    }
    return out;
}

@Injectable()
export class ApiloSettingsService {
    private isValidTime(value: any): value is string {
        return (
            typeof value === 'string' &&
            /^\d{2}:\d{2}$/.test(value) &&
            Number(value.slice(0, 2)) >= 0 &&
            Number(value.slice(0, 2)) <= 23 &&
            Number(value.slice(3, 5)) >= 0 &&
            Number(value.slice(3, 5)) <= 59
        );
    }

    private isValidDate(value: any): value is string {
        return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
    }

    private normalizeIdList(value: any): number[] {
        if (!Array.isArray(value)) return [];
        return value
            .map((entry: any) => Number(entry))
            .filter((entry: number) => !Number.isNaN(entry));
    }

    private createDefaultRotationDays(): Record<RotationDayKey, TabRotationDayConfig> {
        return {
            monday: { mode: 'drop_one', enabledCount: 2, disableAt: '13:00' },
            tuesday: { mode: 'drop_one', enabledCount: 2, disableAt: '13:00' },
            wednesday: { mode: 'drop_one', enabledCount: 2, disableAt: '13:00' },
            thursday: { mode: 'drop_one', enabledCount: 2, disableAt: '13:00' },
            friday: { mode: 'drop_one', enabledCount: 2, disableAt: '13:00' },
            saturday: { mode: 'fixed', enabledCount: 0, disableAt: '13:00' },
            sunday: { mode: 'fixed', enabledCount: 0, disableAt: '13:00' },
        };
    }

    private createDefaultMonthlyAssignment(targetStatusIds: number[] = []): MonthlyComputerAssignment {
        const weekdays = ROTATION_DAY_KEYS.reduce((acc, dayKey) => {
            acc[dayKey] = dayKey === 'saturday' || dayKey === 'sunday' ? [] : [...targetStatusIds];
            return acc;
        }, {} as Record<RotationDayKey, number[]>);
        const targetSchedules = targetStatusIds.reduce((acc, statusId) => {
            acc[statusId] = { mode: 'always' };
            return acc;
        }, {} as Record<number, MonthlyComputerTargetSchedule>);

        return {
            timezone: 'Europe/Warsaw',
            alternateAnchorDate: new Date().toISOString().slice(0, 10),
            mondayAllActive: false,
            targetSchedules,
            weekdayTargets: weekdays,
            monthlyCounts: {},
            assignedOrders: {},
        };
    }

    private normalizeMonthlyCount(raw: any): MonthlyComputerCount {
        const auto = Number(raw?.auto);
        const manual = Number(raw?.manual);
        return {
            auto: Number.isFinite(auto) ? auto : 0,
            manual: Number.isFinite(manual) ? manual : 0,
        };
    }

    private normalizeMonthlyTargetSchedule(raw: any): MonthlyComputerTargetSchedule {
        const mode: MonthlyComputerTargetScheduleMode =
            raw?.mode === 'off'
                ? 'off'
                : raw?.mode === 'alternate_a'
                    ? 'alternate_a'
                    : raw?.mode === 'alternate_b'
                        ? 'alternate_b'
                        : raw?.mode === 'alternate_c'
                            ? 'alternate_c'
                        : 'always';
        return { mode };
    }

    private inferMonthlyTargetScheduleFromWeekdays(targetId: number, weekdayTargets: Record<RotationDayKey, number[]>): MonthlyComputerTargetSchedule {
        const weekdayKeys = ROTATION_DAY_KEYS.filter((dayKey) => dayKey !== 'saturday' && dayKey !== 'sunday');
        const enabledCount = weekdayKeys.filter((dayKey) => weekdayTargets[dayKey]?.includes(targetId)).length;
        if (enabledCount === 0) return { mode: 'off' };
        if (enabledCount === weekdayKeys.length) return { mode: 'always' };
        return { mode: 'always' };
    }

    private normalizeMonthlyAssignment(raw: any, targetStatusIds: number[], fallback?: MonthlyComputerAssignment): MonthlyComputerAssignment {
        const fallbackAssignment = fallback ?? this.createDefaultMonthlyAssignment(targetStatusIds);
        const rawWeekdayTargets = isPlainObject(raw?.weekdayTargets) ? raw.weekdayTargets : {};
        const fallbackWeekdayTargets = isPlainObject(fallbackAssignment.weekdayTargets) ? fallbackAssignment.weekdayTargets : {};

        const weekdayTargets = ROTATION_DAY_KEYS.reduce((acc, dayKey) => {
            const rawIds = this.normalizeIdList(rawWeekdayTargets[dayKey]);
            const fallbackIds = this.normalizeIdList(fallbackWeekdayTargets[dayKey]);
            const baseIds = rawIds.length || dayKey in rawWeekdayTargets
                ? rawIds
                : fallbackIds.length || dayKey in fallbackWeekdayTargets
                    ? fallbackIds
                    : (dayKey === 'saturday' || dayKey === 'sunday' ? [] : targetStatusIds);

            acc[dayKey] = baseIds.filter((id, index, arr) =>
                targetStatusIds.includes(id) && arr.indexOf(id) === index
            );
            return acc;
        }, {} as Record<RotationDayKey, number[]>);

        const rawTargetSchedules = isPlainObject(raw?.targetSchedules) ? raw.targetSchedules : undefined;
        const fallbackTargetSchedules = isPlainObject(fallbackAssignment.targetSchedules) ? fallbackAssignment.targetSchedules : {};
        const targetSchedules = targetStatusIds.reduce((acc, targetId) => {
            const rawSchedule = rawTargetSchedules?.[targetId] ?? rawTargetSchedules?.[String(targetId)];
            const fallbackSchedule = fallbackTargetSchedules?.[targetId] ?? fallbackTargetSchedules?.[String(targetId)];
            acc[targetId] = rawSchedule
                ? this.normalizeMonthlyTargetSchedule(rawSchedule)
                : fallbackSchedule
                    ? this.normalizeMonthlyTargetSchedule(fallbackSchedule)
                    : this.inferMonthlyTargetScheduleFromWeekdays(targetId, weekdayTargets);
            return acc;
        }, {} as Record<number, MonthlyComputerTargetSchedule>);

        const monthlyCounts: Record<string, Record<number, MonthlyComputerCount>> = {};
        const rawMonthlyCounts = isPlainObject(raw?.monthlyCounts) ? raw.monthlyCounts : fallbackAssignment.monthlyCounts;
        if (isPlainObject(rawMonthlyCounts)) {
            for (const [month, monthCounts] of Object.entries(rawMonthlyCounts)) {
                if (!/^\d{4}-\d{2}$/.test(month) || !isPlainObject(monthCounts)) continue;
                monthlyCounts[month] = {};
                for (const [statusId, count] of Object.entries(monthCounts)) {
                    const id = Number(statusId);
                    if (!Number.isNaN(id)) {
                        monthlyCounts[month][id] = this.normalizeMonthlyCount(count);
                    }
                }
            }
        }

        const assignedOrders: MonthlyComputerAssignment['assignedOrders'] = {};
        const rawAssignedOrders = isPlainObject(raw?.assignedOrders) ? raw.assignedOrders : fallbackAssignment.assignedOrders;
        if (isPlainObject(rawAssignedOrders)) {
            for (const [orderId, entry] of Object.entries(rawAssignedOrders)) {
                if (!isPlainObject(entry)) continue;
                const month = String(entry.month || '');
                const targetStatusId = Number(entry.targetStatusId);
                const computerCount = Number(entry.computerCount);
                const assignedAt = typeof entry.assignedAt === 'string' && entry.assignedAt ? entry.assignedAt : new Date().toISOString();
                if (/^\d{4}-\d{2}$/.test(month) && !Number.isNaN(targetStatusId) && Number.isFinite(computerCount)) {
                    assignedOrders[String(orderId)] = {
                        month,
                        targetStatusId,
                        computerCount,
                        assignedAt,
                    };
                }
            }
        }

        const normalizedAssignment: MonthlyComputerAssignment = {
            timezone:
                typeof raw?.timezone === 'string' && raw.timezone.trim()
                    ? raw.timezone.trim()
                    : (fallbackAssignment.timezone ?? 'Europe/Warsaw'),
            alternateAnchorDate: this.isValidDate(raw?.alternateAnchorDate)
                ? String(raw.alternateAnchorDate)
                : this.isValidDate(fallbackAssignment.alternateAnchorDate)
                    ? String(fallbackAssignment.alternateAnchorDate)
                    : new Date().toISOString().slice(0, 10),
            mondayAllActive: typeof raw?.mondayAllActive === 'boolean'
                ? raw.mondayAllActive
                : !!fallbackAssignment.mondayAllActive,
            targetSchedules,
            weekdayTargets,
            monthlyCounts,
            assignedOrders,
        };

        this.rebuildMonthlyAutoCountsFromAssignedOrders(normalizedAssignment);
        return normalizedAssignment;
    }

    private rebuildMonthlyAutoCountsFromAssignedOrders(assignment: MonthlyComputerAssignment) {
        for (const monthCounts of Object.values(assignment.monthlyCounts)) {
            for (const count of Object.values(monthCounts)) {
                count.auto = 0;
            }
        }

        for (const entry of Object.values(assignment.assignedOrders ?? {})) {
            const month = String(entry.month || '');
            const targetStatusId = Number(entry.targetStatusId);
            const computerCount = Number(entry.computerCount);
            if (!/^\d{4}-\d{2}$/.test(month) || Number.isNaN(targetStatusId) || !Number.isFinite(computerCount)) {
                continue;
            }

            if (!assignment.monthlyCounts[month]) {
                assignment.monthlyCounts[month] = {};
            }

            const current = assignment.monthlyCounts[month][targetStatusId] ?? { auto: 0, manual: 0 };
            assignment.monthlyCounts[month][targetStatusId] = {
                auto: (Number(current.auto) || 0) + computerCount,
                manual: Number(current.manual) || 0,
            };
        }
    }

    private normalizeRotationDay(
        rawDay: any,
        fallback: TabRotationDayConfig,
    ): TabRotationDayConfig {
        const mode: RotationDayMode = rawDay?.mode === 'fixed' ? 'fixed' : rawDay?.mode === 'drop_one' ? 'drop_one' : fallback.mode;
        const enabledCountRaw = Number(rawDay?.enabledCount);
        return {
            mode,
            enabledCount: Number.isFinite(enabledCountRaw) ? Math.max(0, Math.floor(enabledCountRaw)) : fallback.enabledCount,
            disableAt: this.isValidTime(rawDay?.disableAt) ? String(rawDay.disableAt) : fallback.disableAt,
        };
    }

    private buildLegacyRotationDays(rawRotation: any, fallbackDays: Record<RotationDayKey, TabRotationDayConfig>) {
        const enabledCountRaw = Number(rawRotation?.morningEnabledCount);
        const enabledCount = Number.isFinite(enabledCountRaw)
            ? Math.max(0, Math.floor(enabledCountRaw))
            : fallbackDays.monday.enabledCount;
        const disableAt = this.isValidTime(rawRotation?.disableAt)
            ? String(rawRotation.disableAt)
            : fallbackDays.monday.disableAt;
        const weekdaysOnly = rawRotation?.weekdaysOnly == null ? true : !!rawRotation.weekdaysOnly;

        const weekdaysConfig: TabRotationDayConfig = {
            mode: 'drop_one',
            enabledCount,
            disableAt,
        };
        const weekendConfig: TabRotationDayConfig = weekdaysOnly
            ? { mode: 'fixed', enabledCount: 0, disableAt }
            : weekdaysConfig;

        return {
            monday: weekdaysConfig,
            tuesday: weekdaysConfig,
            wednesday: weekdaysConfig,
            thursday: weekdaysConfig,
            friday: weekdaysConfig,
            saturday: weekendConfig,
            sunday: weekendConfig,
        };
    }

    private defaults(): ApiloSettingsFile {
        const now = new Date().toISOString();
        const defaultRotationDays = this.createDefaultRotationDays();

        return {
            revision: 1,
            updatedAt: now,
            line1: {
                active: true,
                sourceStatusId: 63,
                targetStatusIds: [159, 156, 228],
                targetNames: {
                    159: 'Mateusz Sabała',
                    156: 'Dariusz Sikora',
                    228: 'Mateusz Jania',
                },
                targetLimits: { 159: 2, 156: 2, 228: 2 },
                deliveryMethodPriority: [],
                maxLargeOrderItems: 9,
                autoSchedule: {
                    enabled: false,
                    enableAt: '08:00',
                    disableAt: '16:00',
                    timezone: 'Europe/Warsaw',
                    weekendOnly: false,
                },
                tabRotation: {
                    enabled: false,
                    timezone: 'Europe/Warsaw',
                    order: [159, 156, 228],
                    participantIds: [159, 156, 228],
                    cycleAnchorDate: now.slice(0, 10),
                    days: defaultRotationDays,
                    morningEnabledCount: 2,
                    disableAt: '13:00',
                    weekdaysOnly: true,
                },
                monthlyComputerAssignment: this.createDefaultMonthlyAssignment([159, 156, 228]),
            },
            line2: {
                active: false,
                sourceStatusId: 60,
                targetStatusIds: [170, 173, 176, 179, 207, 182, 211, 201],
                targetNames: {
                    170: 'Bartek Irzyk Serwis',
                    173: 'Andrzej Klimala Serwis',
                    176: 'Hubert Przetocki Serwis',
                    179: 'Kamil Rucki Serwis',
                    207: 'Krzysztof Ulman Serwis',
                    182: 'Kamil Spyrka Serwis',
                    211: 'Alan Janosz Serwis',
                    201: 'Status 201',
                },
                targetLimits: {
                    170: 2,
                    173: 2,
                    176: 2,
                    179: 2,
                    207: 2,
                    182: 2,
                    211: 2,
                    201: 2,
                },
                deliveryMethodPriority: [],
                maxLargeOrderItems: 9,
                autoSchedule: {
                    enabled: false,
                    enableAt: '08:00',
                    disableAt: '16:00',
                    timezone: 'Europe/Warsaw',
                    weekendOnly: false,
                },
                tabRotation: {
                    enabled: false,
                    timezone: 'Europe/Warsaw',
                    order: [170, 173, 176, 179, 207, 182, 211, 201],
                    participantIds: [170, 173, 176, 179, 207, 182, 211, 201],
                    cycleAnchorDate: now.slice(0, 10),
                    days: defaultRotationDays,
                    morningEnabledCount: 2,
                    disableAt: '13:00',
                    weekdaysOnly: true,
                },
            },
        };
    }

    private normalize(cfg: ApiloSettingsFile): ApiloSettingsFile {
        const def = this.defaults();
        const out: ApiloSettingsFile = { ...def, ...cfg };

        out.revision = Number(out.revision) || def.revision;
        out.updatedAt = typeof out.updatedAt === 'string' && out.updatedAt ? out.updatedAt : new Date().toISOString();

        const normLine = (line: any, fallback: ApiloLineSettings): ApiloLineSettings => {
            const normalized: ApiloLineSettings = {
                active: !!line?.active,
                sourceStatusId: Number(line?.sourceStatusId) || fallback.sourceStatusId,
                targetStatusIds: this.normalizeIdList(line?.targetStatusIds),
                targetNames: {},
                targetLimits: {},
                deliveryMethodPriority: Array.isArray(line?.deliveryMethodPriority)
                    ? line.deliveryMethodPriority.map((entry: any) => String(entry))
                    : [...fallback.deliveryMethodPriority],
                maxLargeOrderItems: Number(line?.maxLargeOrderItems),
                autoSchedule: undefined,
                tabRotation: undefined,
                monthlyComputerAssignment: undefined,
            };

            if (!normalized.targetStatusIds.length) {
                normalized.targetStatusIds = [...fallback.targetStatusIds];
            }

            const rawTargetNames = isPlainObject(line?.targetNames) ? line.targetNames : undefined;
            const targetNameIds = Array.from(new Set([
                ...normalized.targetStatusIds,
                ...(rawTargetNames
                    ? Object.keys(rawTargetNames)
                    : Object.keys(fallback.targetNames ?? {})
                ).map(Number).filter((id) => !Number.isNaN(id)),
            ]));

            for (const id of targetNameIds) {
                const rawName = rawTargetNames?.[id] ?? rawTargetNames?.[String(id)];
                const fallbackName = fallback.targetNames?.[id] ?? fallback.targetNames?.[String(id)];
                normalized.targetNames![id] =
                    typeof rawName === 'string' && rawName.trim()
                        ? rawName.trim()
                        : typeof fallbackName === 'string' && fallbackName.trim()
                            ? fallbackName.trim()
                            : `Status ${id}`;
            }

            if (!Number.isFinite(normalized.maxLargeOrderItems)) {
                normalized.maxLargeOrderItems = fallback.maxLargeOrderItems;
            }

            const rawLimits = line?.targetLimits;
            if (rawLimits && typeof rawLimits === 'object') {
                for (const [key, value] of Object.entries(rawLimits)) {
                    const keyNum = Number(key);
                    const valueNum = Number(value);
                    if (
                        !Number.isNaN(keyNum)
                        && Number.isFinite(valueNum)
                        && targetNameIds.includes(keyNum)
                    ) {
                        normalized.targetLimits[keyNum] = valueNum;
                    }
                }
            }

            for (const id of targetNameIds) {
                if (!(id in normalized.targetLimits)) {
                    normalized.targetLimits[id] = fallback.targetLimits?.[id] ?? 2;
                }
            }

            const fallbackSchedule = fallback.autoSchedule ?? {
                enabled: false,
                enableAt: '08:00',
                disableAt: '16:00',
                timezone: 'Europe/Warsaw',
                weekendOnly: false,
            };

            const rawSchedule = line?.autoSchedule ?? {};
            normalized.autoSchedule = {
                enabled: !!rawSchedule.enabled,
                enableAt: this.isValidTime(rawSchedule.enableAt) ? String(rawSchedule.enableAt) : fallbackSchedule.enableAt,
                disableAt: this.isValidTime(rawSchedule.disableAt) ? String(rawSchedule.disableAt) : fallbackSchedule.disableAt,
                timezone:
                    typeof rawSchedule.timezone === 'string' && rawSchedule.timezone.trim()
                        ? rawSchedule.timezone.trim()
                        : (fallbackSchedule.timezone ?? 'Europe/Warsaw'),
                weekendOnly: !!rawSchedule.weekendOnly,
            };

            const fallbackRotationDays = fallback.tabRotation?.days
                ? ROTATION_DAY_KEYS.reduce((acc, dayKey) => {
                    acc[dayKey] = this.normalizeRotationDay(fallback.tabRotation?.days?.[dayKey], this.createDefaultRotationDays()[dayKey]);
                    return acc;
                }, {} as Record<RotationDayKey, TabRotationDayConfig>)
                : this.createDefaultRotationDays();

            const rawRotation = line?.tabRotation ?? {};
            const legacyDays = this.buildLegacyRotationDays(rawRotation, fallbackRotationDays);
            const rawRotationDays = isPlainObject(rawRotation.days) ? rawRotation.days : undefined;

            const rotationDays = ROTATION_DAY_KEYS.reduce((acc, dayKey) => {
                const dayFallback = rawRotationDays ? legacyDays[dayKey] : fallbackRotationDays[dayKey];
                acc[dayKey] = this.normalizeRotationDay(rawRotationDays?.[dayKey], dayFallback);
                return acc;
            }, {} as Record<RotationDayKey, TabRotationDayConfig>);

            const rotationOrderRaw = this.normalizeIdList(rawRotation.order);
            const fallbackOrder = this.normalizeIdList(fallback.tabRotation?.order);
            const baseOrder = rotationOrderRaw.length
                ? rotationOrderRaw
                : fallbackOrder.length
                    ? fallbackOrder
                    : normalized.targetStatusIds;

            const order = [...baseOrder, ...normalized.targetStatusIds.filter((id) => !baseOrder.includes(id))]
                .filter((id, index, arr) => normalized.targetStatusIds.includes(id) && arr.indexOf(id) === index);

            const participantIdsRaw = this.normalizeIdList(rawRotation.participantIds);
            const fallbackParticipants = this.normalizeIdList(fallback.tabRotation?.participantIds);
            const participantBase = participantIdsRaw.length
                ? participantIdsRaw
                : fallbackParticipants.length
                    ? fallbackParticipants
                    : order;
            const participantIds = participantBase.filter((id, index, arr) =>
                normalized.targetStatusIds.includes(id) && arr.indexOf(id) === index
            );

            const anchorFallback = this.isValidDate(fallback.tabRotation?.cycleAnchorDate)
                ? String(fallback.tabRotation?.cycleAnchorDate)
                : out.updatedAt.slice(0, 10);
            const cycleAnchorDate = this.isValidDate(rawRotation.cycleAnchorDate)
                ? String(rawRotation.cycleAnchorDate)
                : anchorFallback;

            const timezone =
                typeof rawRotation.timezone === 'string' && rawRotation.timezone.trim()
                    ? rawRotation.timezone.trim()
                    : (fallback.tabRotation?.timezone ?? normalized.autoSchedule.timezone ?? 'Europe/Warsaw');

            const legacyCount = Number(rawRotation.morningEnabledCount);
            normalized.tabRotation = {
                enabled: !!rawRotation.enabled,
                timezone,
                order,
                participantIds,
                cycleAnchorDate,
                days: rotationDays,
                morningEnabledCount: Number.isFinite(legacyCount)
                    ? Math.max(0, Math.floor(legacyCount))
                    : fallback.tabRotation?.morningEnabledCount,
                disableAt: this.isValidTime(rawRotation.disableAt)
                    ? String(rawRotation.disableAt)
                    : (fallback.tabRotation?.disableAt ?? '13:00'),
                weekdaysOnly:
                    rawRotation.weekdaysOnly == null
                        ? !!fallback.tabRotation?.weekdaysOnly
                        : !!rawRotation.weekdaysOnly,
            };

            if (fallback.monthlyComputerAssignment || line?.monthlyComputerAssignment) {
                normalized.monthlyComputerAssignment = this.normalizeMonthlyAssignment(
                    line?.monthlyComputerAssignment,
                    normalized.targetStatusIds,
                    fallback.monthlyComputerAssignment,
                );
            }

            return normalized;
        };

        out.line1 = normLine({
            ...out.line1,
            targetStatusIds: this.normalizeIdList(out.line1?.targetStatusIds)
                .filter((id) => !RETIRED_LINE1_STATUS_IDS.has(id)),
        }, def.line1);
        out.line2 = normLine(out.line2, def.line2);

        return out;
    }

    private async readFileOrDefault(): Promise<ApiloSettingsFile> {
        let raw: string;

        try {
            raw = await fs.readFile(CONFIG_PATH, 'utf8');
        } catch (error: any) {
            if (error?.code !== 'ENOENT') {
                throw error;
            }
            const def = this.defaults();
            await fs.writeFile(CONFIG_PATH, JSON.stringify(def, null, 2), 'utf8');
            return def;
        }

        let data: any;
        try {
            data = JSON.parse(raw);
        } catch (error) {
            throw new Error(`Nieprawidłowy JSON w ${CONFIG_PATH}. Nie nadpisuję ustawień domyślnymi.`);
        }

        if (data && Array.isArray(data.targets) && (!data.line1 || !data.line2)) {
            const def = this.defaults();
            const targets = data.targets.map(Number).filter((entry: number) => !Number.isNaN(entry));

            const migrated: ApiloSettingsFile = this.normalize({
                ...def,
                revision: Number(data.revision) || 1,
                updatedAt: data.updatedAt || new Date().toISOString(),
                line1: {
                    ...def.line1,
                    targetStatusIds: targets,
                    targetLimits: targets.reduce((acc: Record<number, number>, id: number) => {
                        acc[id] = 2;
                        return acc;
                    }, {}),
                    tabRotation: {
                        ...def.line1.tabRotation,
                        order: targets,
                        participantIds: targets,
                    },
                },
            } as any);

            await fs.writeFile(CONFIG_PATH, JSON.stringify(migrated, null, 2), 'utf8');
            return migrated;
        }

        return this.normalize({ ...this.defaults(), ...data });
    }

    async getSettings(): Promise<ApiloSettingsFile> {
        return this.readFileOrDefault();
    }

    async recordLine1ComputerAssignments(
        assignments: { orderId: number | string; targetStatusId: number; computerCount: number; assignedAt?: string }[],
        month: string,
    ): Promise<ApiloSettingsFile> {
        const current = await this.readFileOrDefault();
        const line1 = current.line1;
        const monthlyComputerAssignment = this.normalizeMonthlyAssignment(
            line1.monthlyComputerAssignment,
            line1.targetStatusIds,
            this.defaults().line1.monthlyComputerAssignment,
        );

        if (!monthlyComputerAssignment.monthlyCounts[month]) {
            monthlyComputerAssignment.monthlyCounts[month] = {};
        }
        if (!monthlyComputerAssignment.assignedOrders) {
            monthlyComputerAssignment.assignedOrders = {};
        }

        let changed = false;
        for (const assignment of assignments) {
            const orderKey = String(assignment.orderId);
            const computerCount = Number(assignment.computerCount);
            const targetStatusId = Number(assignment.targetStatusId);
            if (!orderKey || Number.isNaN(targetStatusId) || !Number.isFinite(computerCount)) continue;
            if (monthlyComputerAssignment.assignedOrders[orderKey]) continue;

            const currentCount = monthlyComputerAssignment.monthlyCounts[month][targetStatusId] ?? { auto: 0, manual: 0 };
            monthlyComputerAssignment.monthlyCounts[month][targetStatusId] = {
                auto: currentCount.auto + computerCount,
                manual: currentCount.manual,
            };
            monthlyComputerAssignment.assignedOrders[orderKey] = {
                month,
                targetStatusId,
                computerCount,
                assignedAt: assignment.assignedAt ?? new Date().toISOString(),
            };
            changed = true;
        }

        if (!changed) return current;

        const next = this.normalize({
            ...current,
            revision: current.revision + 1,
            updatedAt: new Date().toISOString(),
            line1: {
                ...line1,
                monthlyComputerAssignment,
            },
        } as any);

        await fs.writeFile(CONFIG_PATH, JSON.stringify(next, null, 2), 'utf8');
        return next;
    }

    async replaceSettings(full: Omit<ApiloSettingsFile, 'revision' | 'updatedAt'>): Promise<ApiloSettingsFile> {
        const current = await this.readFileOrDefault();
        const next = this.normalize({
            ...current,
            ...full,
            revision: current.revision + 1,
            updatedAt: new Date().toISOString(),
        } as any);

        await fs.writeFile(CONFIG_PATH, JSON.stringify(next, null, 2), 'utf8');
        return next;
    }

    async patchSettings(
        patch: ApiloSettingsPatch,
        expectedRevision: number,
    ): Promise<{ ok: true; settings: ApiloSettingsFile } | { ok: false; settings: ApiloSettingsFile }> {
        const current = await this.readFileOrDefault();

        if (!Number.isFinite(expectedRevision)) {
            throw new Error('expectedRevision is required (use If-Match header).');
        }

        if (expectedRevision !== current.revision) {
            return { ok: false, settings: current };
        }

        const merged = this.normalize(mergeDeep(current, patch) as any);

        if (deepEqual(merged, current)) {
            return { ok: true, settings: current };
        }

        const next: ApiloSettingsFile = {
            ...merged,
            revision: current.revision + 1,
            updatedAt: new Date().toISOString(),
        };

        await fs.writeFile(CONFIG_PATH, JSON.stringify(next, null, 2), 'utf8');
        return { ok: true, settings: next };
    }

    private getHHmmInTimeZone(date: Date, timeZone: string): string {
        const parts = new Intl.DateTimeFormat('en-GB', {
            timeZone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).formatToParts(date);

        const hh = parts.find((part) => part.type === 'hour')?.value ?? '00';
        const mm = parts.find((part) => part.type === 'minute')?.value ?? '00';
        return `${hh}:${mm}`;
    }

    async applyAutoScheduleTick(now: Date = new Date()): Promise<{ changed: boolean; settings: ApiloSettingsFile }> {
        const current = await this.getSettings();

        const applyForLine = (lineKey: 'line1' | 'line2') => {
            const line = (current as any)[lineKey] as ApiloLineSettings;
            const schedule = line?.autoSchedule;

            if (!schedule?.enabled) return;

            const timeZone = schedule.timezone || 'Europe/Warsaw';
            const hhmmNow = this.getHHmmInTimeZone(now, timeZone);
            const enableAt = String(schedule.enableAt || '08:00');
            const disableAt = String(schedule.disableAt || '16:00');

            if (enableAt === disableAt) {
                if (line.active !== true) line.active = true;
                return;
            }

            if (hhmmNow === enableAt && line.active !== true) {
                line.active = true;
                return;
            }

            if (hhmmNow === disableAt && line.active !== false) {
                line.active = false;
            }
        };

        const before = JSON.stringify(current);

        applyForLine('line1');
        applyForLine('line2');

        if (before === JSON.stringify(current)) {
            return { changed: false, settings: current };
        }

        const next: ApiloSettingsFile = {
            ...current,
            revision: (current.revision || 1) + 1,
            updatedAt: new Date().toISOString(),
        };

        await fs.writeFile(CONFIG_PATH, JSON.stringify(next, null, 2), 'utf8');
        return { changed: true, settings: next };
    }
}
