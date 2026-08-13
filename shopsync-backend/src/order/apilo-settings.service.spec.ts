import { ApiloSettingsService } from './apilo-settings.service';

describe('ApiloSettingsService', () => {
    it('removes retired line 1 statuses from assignment configuration', () => {
        const service = new ApiloSettingsService();
        const defaults = (service as any).defaults();
        const normalized = (service as any).normalize({
            ...defaults,
            line1: {
                ...defaults.line1,
                targetStatusIds: [159, 156, 228, 225],
                targetLimits: { 159: 2, 156: 2, 228: 2, 225: 2 },
                tabRotation: {
                    ...defaults.line1.tabRotation,
                    order: [159, 156, 228, 225],
                    participantIds: [159, 156, 228, 225],
                },
                monthlyComputerAssignment: {
                    ...defaults.line1.monthlyComputerAssignment,
                    targetSchedules: {
                        ...defaults.line1.monthlyComputerAssignment.targetSchedules,
                        225: { mode: 'always' },
                    },
                    weekdayTargets: {
                        ...defaults.line1.monthlyComputerAssignment.weekdayTargets,
                        monday: [159, 156, 228, 225],
                    },
                },
            },
        });

        expect(normalized.line1.targetStatusIds).toEqual([159, 156, 228]);
        expect(normalized.line1.targetLimits[225]).toBeUndefined();
        expect(normalized.line1.tabRotation.order).not.toContain(225);
        expect(normalized.line1.tabRotation.participantIds).not.toContain(225);
        expect(normalized.line1.monthlyComputerAssignment.weekdayTargets.monday).not.toContain(225);
        expect(normalized.line1.monthlyComputerAssignment.targetSchedules[225]).toBeUndefined();
    });
});
