import { ApiloLineSettings } from './apilo-settings.service';
import { ApiloOrderService } from './order.service';

describe('ApiloOrderService monthly computer rotation', () => {
    const service = new ApiloOrderService({} as any, {} as any, {} as any);

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

    it('previews the same A/B recipients as actual assignment on subsequent days', () => {
        const line = createLine([1, 2], {
            1: { mode: 'alternate_a' },
            2: { mode: 'alternate_b' },
        });
        const preview = service.getLineSchedulePreview(line, new Date('2026-08-03T12:00:00Z'), 7);

        expect(preview.map((day) => day.targetStatusIds)).toEqual([[1], [2], [1], [2], [1], [], []]);
        for (const day of preview) {
            expect(day.targetStatusIds).toEqual(getEffectiveTargets(line, day.date));
        }
    });

    it('updates the preview when A/B changes to A/B/C and excludes off targets', () => {
        const line = createLine([1, 2, 3, 4], {
            1: { mode: 'alternate_a' },
            2: { mode: 'alternate_b' },
            3: { mode: 'alternate_c' },
            4: { mode: 'off' },
        }, true);
        const preview = service.getLineSchedulePreview(line, new Date('2026-08-03T12:00:00Z'), 8);

        expect(preview.map((day) => day.targetStatusIds)).toEqual([
            [1, 2, 3], [1, 2], [2, 3], [1, 3], [1, 2], [], [], [1, 2, 3],
        ]);
    });

    it('does not show recipients when line 1 is disabled', () => {
        const line = createLine([1, 2], { 1: { mode: 'always' }, 2: { mode: 'always' } });
        line.active = false;
        expect(service.getLineSchedulePreview(line, new Date('2026-08-03T12:00:00Z'), 2)
            .map((day) => day.targetStatusIds)).toEqual([[], []]);
    });
});

describe('ApiloOrderService token source', () => {
    it('uses the current backend token instead of the workstation JWT', async () => {
        const get = jest.fn().mockResolvedValue({ data: { orders: [], totalCount: 0 } });
        const getAccessToken = jest.fn().mockResolvedValue('current-token');
        const service = new ApiloOrderService({ axiosRef: { get } } as any, {} as any, { getAccessToken } as any);

        await service.getOrdersByStatus(12, { shoperToken: 'shoper', apiloToken: 'stale-token' });

        expect(getAccessToken).toHaveBeenCalledTimes(1);
        expect(get).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
            headers: expect.objectContaining({ Authorization: 'Bearer current-token' }),
        }));
    });

    it('uses a newly refreshed token on the next order operation', async () => {
        const get = jest.fn().mockResolvedValue({ data: { orders: [], totalCount: 0 } });
        const put = jest.fn().mockResolvedValue({ data: { updates: 1 } });
        const getAccessToken = jest.fn()
            .mockResolvedValueOnce('before-refresh')
            .mockResolvedValueOnce('after-refresh');
        const service = new ApiloOrderService({ axiosRef: { get, put } } as any, {} as any, { getAccessToken } as any);

        await service.getOrdersByStatus(12, { shoperToken: 'shoper' });
        await service.updateOrderStatus(42, 13, { shoperToken: 'shoper' });

        expect(get).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
            headers: expect.objectContaining({ Authorization: 'Bearer before-refresh' }),
        }));
        expect(put).toHaveBeenCalledWith(expect.any(String), { status: 13 }, expect.objectContaining({
            headers: expect.objectContaining({ Authorization: 'Bearer after-refresh' }),
        }));
    });
});
