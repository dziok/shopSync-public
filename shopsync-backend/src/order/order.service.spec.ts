import { ApiloLineSettings } from './apilo-settings.service';
import { ApiloOrderService } from './order.service';

describe('ApiloOrderService monthly computer rotation', () => {
    const service = new ApiloOrderService({} as any, {} as any);

    const createLine = (
        targetStatusIds: number[],
        targetSchedules: Record<number, { mode: any }>,
        mondayAllActive = false,
    ): ApiloLineSettings => ({
        active: true,
        sourceStatusId: 10,
        targetStatusIds,
        targetLimits: {},
        deliveryMethodPriority: [],
        maxLargeOrderItems: 9,
        monthlyComputerAssignment: {
            timezone: 'Europe/Warsaw',
            alternateAnchorDate: '2026-08-03',
            mondayAllActive,
            targetSchedules,
            weekdayTargets: {},
            monthlyCounts: {},
        },
    });

    const getEffectiveTargets = (line: ApiloLineSettings, isoDate: string): number[] =>
        (service as any).getEffectiveMonthlyComputerTargetStatusIds(line, new Date(`${isoDate}T12:00:00Z`));

    it('keeps the existing A/B rhythm when C is not configured', () => {
        const line = createLine([1, 2], {
            1: { mode: 'alternate_a' },
            2: { mode: 'alternate_b' },
        });

        expect(getEffectiveTargets(line, '2026-08-03')).toEqual([1]);
        expect(getEffectiveTargets(line, '2026-08-04')).toEqual([2]);
        expect(getEffectiveTargets(line, '2026-08-05')).toEqual([1]);
    });

    it('rotates adjacent A/B/C pairs when C is configured', () => {
        const line = createLine([1, 2, 3], {
            1: { mode: 'alternate_a' },
            2: { mode: 'alternate_b' },
            3: { mode: 'alternate_c' },
        });

        expect(getEffectiveTargets(line, '2026-08-03')).toEqual([1, 2]);
        expect(getEffectiveTargets(line, '2026-08-04')).toEqual([2, 3]);
        expect(getEffectiveTargets(line, '2026-08-05')).toEqual([1, 3]);
        expect(getEffectiveTargets(line, '2026-08-06')).toEqual([1, 2]);
    });

    it('enables all rotating users on Monday and continues the A/B/C pair cycle on Tuesday', () => {
        const line = createLine([159, 156, 228, 225], {
            159: { mode: 'alternate_a' },
            156: { mode: 'alternate_b' },
            228: { mode: 'alternate_c' },
            225: { mode: 'off' },
        }, true);

        expect(getEffectiveTargets(line, '2026-08-03')).toEqual([159, 156, 228]);
        expect(getEffectiveTargets(line, '2026-08-04')).toEqual([159, 156]);
        expect(getEffectiveTargets(line, '2026-08-05')).toEqual([156, 228]);
        expect(getEffectiveTargets(line, '2026-08-06')).toEqual([159, 228]);
        expect(getEffectiveTargets(line, '2026-08-07')).toEqual([159, 156]);
        expect(getEffectiveTargets(line, '2026-08-10')).toEqual([159, 156, 228]);
        expect(getEffectiveTargets(line, '2026-08-11')).toEqual([156, 228]);
    });
});
