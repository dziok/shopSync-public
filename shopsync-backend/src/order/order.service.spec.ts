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

    it('uses an A/B/C rhythm when C is configured', () => {
        const line = createLine([1, 2, 3], {
            1: { mode: 'alternate_a' },
            2: { mode: 'alternate_b' },
            3: { mode: 'alternate_c' },
        });

        expect(getEffectiveTargets(line, '2026-08-03')).toEqual([1]);
        expect(getEffectiveTargets(line, '2026-08-04')).toEqual([2]);
        expect(getEffectiveTargets(line, '2026-08-05')).toEqual([3]);
        expect(getEffectiveTargets(line, '2026-08-06')).toEqual([1]);
    });

    it('enables every rotating user on Monday without shifting the cycle', () => {
        const line = createLine([1, 2, 3, 4], {
            1: { mode: 'alternate_a' },
            2: { mode: 'alternate_b' },
            3: { mode: 'alternate_c' },
            4: { mode: 'off' },
        }, true);

        expect(getEffectiveTargets(line, '2026-08-03')).toEqual([1, 2, 3]);
        expect(getEffectiveTargets(line, '2026-08-04')).toEqual([2]);
        expect(getEffectiveTargets(line, '2026-08-10')).toEqual([1, 2, 3]);
        expect(getEffectiveTargets(line, '2026-08-11')).toEqual([1]);
    });
});
