import {
    Body,
    Controller,
    Get,
    Post,
    Patch,
    UseGuards,
    Headers,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { ApiloSettingsService, ApiloSettingsPatch, ApiloSettingsFile } from './apilo-settings.service';

@Controller('apilo-settings')
@UseGuards(JwtAuthGuard)
export class ApiloSettingsController {
    constructor(private readonly apiloSettingsService: ApiloSettingsService) { }

    @Get()
    async getSettings() {
        const settings = await this.apiloSettingsService.getSettings();

        // żeby stary frontend nie padł (jeśli coś jeszcze używa "targets")
        return {
            revision: settings.revision,
            updatedAt: settings.updatedAt,
            line1: settings.line1,
            line2: settings.line2,
            targets: settings.line1.targetStatusIds,
        };
    }

    /**
     * (opcjonalne) pełny zapis jak wcześniej, ale teraz zwraca revision itd.
     * Jeśli chcesz możesz usunąć to POST i zostawić tylko PATCH.
     */
    @Post()
    async replaceSettings(@Body() body: Partial<ApiloSettingsFile> & { targets?: number[]; targetStatusIds?: number[] }) {
        // obsługa starego formatu
        if (Array.isArray(body.targets) || Array.isArray(body.targetStatusIds)) {
            const raw = (body.targets ?? body.targetStatusIds) as any[];
            const targets = raw.map(Number).filter((n) => !Number.isNaN(n));

            const current = await this.apiloSettingsService.getSettings();
            const next = await this.apiloSettingsService.replaceSettings({
                line1: {
                    ...current.line1,
                    targetStatusIds: targets,
                    targetLimits: targets.reduce((acc: any, id: number) => {
                        acc[id] = current.line1.targetLimits?.[id] ?? 2;
                        return acc;
                    }, {}),
                },
                line2: current.line2,
            } as any);

            return { success: true, ...next };
        }

        // nowy format pełny
        if (!body.line1 || !body.line2) {
            throw new BadRequestException('Brakuje line1/line2');
        }

        const next = await this.apiloSettingsService.replaceSettings({
            line1: body.line1 as any,
            line2: body.line2 as any,
        } as any);

        return { success: true, ...next };
    }

    /**
     * Najważniejsze: PATCH + If-Match (revision)
     * body zawiera TYLKO zmienione pola (patch).
     */
    @Patch()
    async patchSettings(
        @Headers('if-match') ifMatch: string,
        @Body() patch: ApiloSettingsPatch,
    ) {
        const expectedRevision = Number(ifMatch);

        if (!Number.isFinite(expectedRevision)) {
            throw new BadRequestException('Missing/invalid If-Match header (must be number revision).');
        }

        const result = await this.apiloSettingsService.patchSettings(patch, expectedRevision);

        if (!result.ok) {
            // konflikt wersji — ktoś zmienił ustawienia w międzyczasie
            throw new ConflictException({
                message: 'Settings have changed on server. Refresh and try again.',
                currentRevision: result.settings.revision,
                updatedAt: result.settings.updatedAt,
                line1: result.settings.line1,
                line2: result.settings.line2,
            });
        }

        return { success: true, ...result.settings };
    }
}
