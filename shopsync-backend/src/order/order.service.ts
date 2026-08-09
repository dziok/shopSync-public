import { HttpService } from '@nestjs/axios';
import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';
import { JwtPayload } from '../auth/auth.dto';
import {
    ApiloLineSettings,
    ApiloSettingsService,
    ROTATION_DAY_KEYS,
    RotationDayKey,
    TabRotationDayConfig,
} from './apilo-settings.service';
import { getApiloBaseUrl } from '../config/service-endpoints';

@Injectable()
export class ApiloOrderService {
    constructor(
        private httpService: HttpService,
        private readonly apiloSettingsService: ApiloSettingsService,
    ) { }

    private getApiloUrl(path: string) {
        return `${getApiloBaseUrl()}${path}`;
    }

    private readonly DEFAULT_TZ = "Europe/Warsaw";

    private getTimeInZoneHHmm(date: Date, timeZone: string): { hh: number; mm: number } {
        const parts = new Intl.DateTimeFormat("en-GB", {
            timeZone,
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        }).formatToParts(date);

        const hh = Number(parts.find(p => p.type === "hour")?.value ?? "0");
        const mm = Number(parts.find(p => p.type === "minute")?.value ?? "0");
        return { hh, mm };
    }

    private getWeekdayInZone(date: Date, timeZone: string): number {
        const parts = new Intl.DateTimeFormat("en-GB", {
            timeZone,
            weekday: "short",
        }).formatToParts(date);
        const weekday = parts.find(p => p.type === "weekday")?.value ?? "";
        const map: Record<string, number> = {
            Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7,
        };
        return map[weekday] ?? 0;
    }

    private isWeekendInZone(date: Date, timeZone: string): boolean {
        const day = this.getWeekdayInZone(date, timeZone);
        return day === 6 || day === 7;
    }

    private hhmmToMinutes(hhmm: string): number {
        const hh = Number(hhmm.slice(0, 2));
        const mm = Number(hhmm.slice(3, 5));
        return hh * 60 + mm;
    }

    private getDatePartsInZone(date: Date, timeZone: string): { year: number; month: number; day: number } {
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).formatToParts(date);

        const year = Number(parts.find((part) => part.type === 'year')?.value ?? '1970');
        const month = Number(parts.find((part) => part.type === 'month')?.value ?? '01');
        const day = Number(parts.find((part) => part.type === 'day')?.value ?? '01');

        return { year, month, day };
    }

    private getDateStringInZone(date: Date, timeZone: string): string {
        const { year, month, day } = this.getDatePartsInZone(date, timeZone);
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    private getMonthStringInZone(date: Date, timeZone: string): string {
        const { year, month } = this.getDatePartsInZone(date, timeZone);
        return `${year}-${String(month).padStart(2, '0')}`;
    }

    private diffDays(dateA: string, dateB: string): number {
        const [aYear, aMonth, aDay] = dateA.split('-').map(Number);
        const [bYear, bMonth, bDay] = dateB.split('-').map(Number);

        const utcA = Date.UTC(aYear, aMonth - 1, aDay);
        const utcB = Date.UTC(bYear, bMonth - 1, bDay);
        return Math.floor((utcA - utcB) / 86_400_000);
    }

    private addDays(dateString: string, days: number): string {
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day + days));
        return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
    }

    private getWeekdayFromDateString(dateString: string): number {
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        const weekday = date.getUTCDay();
        return weekday === 0 ? 7 : weekday;
    }

    private diffBusinessDays(dateA: string, dateB: string): number {
        const direction = this.diffDays(dateA, dateB) >= 0 ? 1 : -1;
        let current = dateB;
        let count = 0;

        while (current !== dateA) {
            current = this.addDays(current, direction);
            const weekday = this.getWeekdayFromDateString(current);
            if (weekday !== 6 && weekday !== 7) {
                count += direction;
            }
        }

        return count;
    }

    private getRotationDayKey(weekday: number): RotationDayKey {
        return ROTATION_DAY_KEYS[Math.max(0, Math.min(ROTATION_DAY_KEYS.length - 1, weekday - 1))];
    }

    private getRotationAllDayCount(dayConfig: Partial<TabRotationDayConfig> | undefined, participantCount: number): number {
        const startCount = Number.isFinite(Number(dayConfig?.enabledCount))
            ? Math.max(0, Math.min(Number(dayConfig?.enabledCount), participantCount))
            : 0;

        if (!dayConfig) return 0;
        if (dayConfig.mode === 'drop_one') {
            return Math.max(0, startCount - 1);
        }
        return startCount;
    }

    /**
     * okno aktywności:
     * - jeśli enableAt < disableAt => aktywne [enableAt, disableAt)
     * - jeśli enableAt > disableAt => okno przechodzi przez północ (np. 20:00 -> 06:00)
     * - jeśli enableAt == disableAt => traktujemy jako 24h aktywne (żeby nie wyłączyć przypadkiem wszystkiego)
     */
    private isWithinWindow(nowMin: number, startMin: number, endMin: number): boolean {
        if (startMin === endMin) return true;
        if (startMin < endMin) return nowMin >= startMin && nowMin < endMin;
        // przez północ
        return nowMin >= startMin || nowMin < endMin;
    }

    /**
     * Efektywna aktywność linii:
     * - jeśli line.active == false => zawsze off
     * - jeśli schedule disabled => działa normalnie
     * - jeśli schedule enabled => działa tylko w godzinach okna
     */
    public isLineEffectiveActiveNow(line: any, now: Date = new Date()): boolean {
        if (!line?.active) return false;

        const sched = line?.autoSchedule;
        const tz = sched?.timezone || this.DEFAULT_TZ;
        if (sched?.weekendOnly && this.isWeekendInZone(now, tz)) {
            return false;
        }
        if (!sched?.enabled) return true;
        const { hh, mm } = this.getTimeInZoneHHmm(now, tz);
        const nowMin = hh * 60 + mm;

        const startMin = this.hhmmToMinutes(String(sched.enableAt || "08:00"));
        const endMin = this.hhmmToMinutes(String(sched.disableAt || "16:00"));

        return this.isWithinWindow(nowMin, startMin, endMin);
    }

    private getEffectiveTargetStatusIds(line: ApiloLineSettings, now: Date = new Date()): number[] {
        const baseTargets = Array.isArray(line?.targetStatusIds)
            ? line.targetStatusIds.map((x: any) => Number(x)).filter((n: number) => !Number.isNaN(n))
            : [];
        const rotation = line?.tabRotation;
        if (!rotation?.enabled || baseTargets.length === 0) return baseTargets;

        const tz = rotation.timezone || line.autoSchedule?.timezone || this.DEFAULT_TZ;
        const orderRaw = Array.isArray(rotation.order)
            ? rotation.order.map((x: any) => Number(x)).filter((n: number) => !Number.isNaN(n))
            : [];
        const order = orderRaw.length
            ? [...orderRaw, ...baseTargets.filter((id) => !orderRaw.includes(id))]
            : [...baseTargets];
        const participantRaw = Array.isArray(rotation.participantIds)
            ? rotation.participantIds.map((x: any) => Number(x)).filter((n: number) => !Number.isNaN(n))
            : [];
        const participants = (participantRaw.length ? participantRaw : order)
            .filter((id, index, arr) => baseTargets.includes(id) && arr.indexOf(id) === index);
        if (!participants.length) return [];

        const days = rotation.days ?? {};
        const weekday = this.getWeekdayInZone(now, tz);
        const todayKey = this.getRotationDayKey(weekday);
        const todayConfig = days[todayKey];
        if (!todayConfig) return [];

        const anchorDate =
            typeof rotation.cycleAnchorDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rotation.cycleAnchorDate)
                ? rotation.cycleAnchorDate
                : this.getDateStringInZone(now, tz);
        const todayDate = this.getDateStringInZone(now, tz);
        const daysSinceAnchor = Math.max(0, this.diffDays(todayDate, anchorDate));

        let pointer = 0;
        for (let dayOffset = 0; dayOffset < daysSinceAnchor; dayOffset += 1) {
            const pastDate = new Date(now.getTime() - (daysSinceAnchor - dayOffset) * 86_400_000);
            const pastWeekday = this.getWeekdayInZone(pastDate, tz);
            const pastDayKey = this.getRotationDayKey(pastWeekday);
            const pastConfig = days[pastDayKey];
            pointer = (pointer + this.getRotationAllDayCount(pastConfig, participants.length)) % participants.length;
        }

        const startCount = Number.isFinite(Number(todayConfig.enabledCount))
            ? Math.max(0, Math.min(Number(todayConfig.enabledCount), participants.length))
            : 0;
        if (startCount <= 0) return [];

        const morningTargets = Array.from({ length: startCount }, (_, index) => participants[(pointer + index) % participants.length]);

        if (todayConfig.mode !== 'drop_one') {
            return morningTargets;
        }

        const disableAtMin = this.hhmmToMinutes(String(todayConfig.disableAt || '13:00'));
        const { hh, mm } = this.getTimeInZoneHHmm(now, tz);
        const nowMin = hh * 60 + mm;

        if (nowMin < disableAtMin) {
            return morningTargets;
        }

        return morningTargets.slice(0, Math.max(0, morningTargets.length - 1));
    }

    private getEffectiveMonthlyComputerTargetStatusIds(line: ApiloLineSettings, now: Date = new Date()): number[] {
        const baseTargets = Array.isArray(line?.targetStatusIds)
            ? line.targetStatusIds.map((x: any) => Number(x)).filter((n: number) => !Number.isNaN(n))
            : [];
        if (!baseTargets.length) return [];

        const assignment = line.monthlyComputerAssignment;
        const tz = assignment?.timezone || line.autoSchedule?.timezone || this.DEFAULT_TZ;
        const weekday = this.getWeekdayInZone(now, tz);
        const todayKey = this.getRotationDayKey(weekday);
        const todayDate = this.getDateStringInZone(now, tz);
        const anchorDate =
            typeof assignment?.alternateAnchorDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(assignment.alternateAnchorDate)
                ? assignment.alternateAnchorDate
                : todayDate;

        if (assignment?.targetSchedules) {
            if (todayKey === 'saturday' || todayKey === 'sunday') return [];
            const businessDayIndex = Math.max(0, this.diffBusinessDays(todayDate, anchorDate));
            const usesThreeDayCycle = baseTargets.some((targetId) => {
                const schedule = assignment.targetSchedules?.[targetId] ?? (assignment.targetSchedules as any)?.[String(targetId)];
                return schedule?.mode === 'alternate_c';
            });
            const cycleLength = usesThreeDayCycle ? 3 : 2;

            return baseTargets.filter((targetId) => {
                const schedule = assignment.targetSchedules?.[targetId] ?? (assignment.targetSchedules as any)?.[String(targetId)];
                const mode = schedule?.mode ?? 'always';
                if (mode === 'off') return false;
                if (assignment.mondayAllActive && todayKey === 'monday') return true;
                if (mode === 'alternate_a') return businessDayIndex % cycleLength === 0;
                if (mode === 'alternate_b') return businessDayIndex % cycleLength === 1;
                if (mode === 'alternate_c') return businessDayIndex % cycleLength === 2;
                return true;
            });
        }

        const configuredTargets = Array.isArray(assignment?.weekdayTargets?.[todayKey])
            ? assignment.weekdayTargets[todayKey] ?? []
            : (todayKey === 'saturday' || todayKey === 'sunday' ? [] : baseTargets);

        return configuredTargets
            .map((id: any) => Number(id))
            .filter((id: number, index: number, arr: number[]) => baseTargets.includes(id) && arr.indexOf(id) === index);
    }


    // Pula wylosowanych docelowych zakładek dla każdej linii (klucz: sourceStatusId)
    private shuffledTargetsBySource: Record<number, number[]> = {};
    // Ostatnio użyta zakładka docelowa dla każdej linii (klucz: sourceStatusId)
    private lastTargetBySource: Record<number, number | null> = {};

    /**
     * Zwraca docelowe statusy (zakładki) w ustalonej, losowej kolejności dla danej linii.
     * Dla każdej linii kolejność jest stała w trakcie działania aplikacji (nowo dodane statusy są dokładane na końcu).
     */
    private getStableRandomTargets(sourceStatusId: number, targetStatusIds: number[]): number[] {
        if (!this.shuffledTargetsBySource[sourceStatusId]) {
            // Inicjalizuj losową kolejność dla tej linii
            this.shuffledTargetsBySource[sourceStatusId] = [...targetStatusIds].sort(() => Math.random() - 0.5);
        } else {
            // Dodaj ewentualne nowe statusy docelowe na koniec zachowując kolejność
            const existingOrder = this.shuffledTargetsBySource[sourceStatusId];
            const newTargets = targetStatusIds.filter((id) => !existingOrder.includes(id));
            if (newTargets.length) {
                existingOrder.push(...newTargets);
            }
        }
        // Zwróć tylko te statusy, które są obecnie aktywne, w ramach wylosowanej kolejności
        return this.shuffledTargetsBySource[sourceStatusId].filter((id) => targetStatusIds.includes(id));
    }

    private normalizeStr(v: string): string {
        return (v ?? "")
            .toString()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // usuń znaki diakrytyczne
            .replace(/\s+/g, " ")
            .trim();
    }

    private pushStringCandidate(target: string[], value: any) {
        const text = typeof value === "string" || typeof value === "number"
            ? String(value).trim()
            : "";
        if (text) target.push(text);
    }

    private collectShippingCandidatesFromObject(target: string[], value: any, depth = 0) {
    if (!value || typeof value !== "object" || depth > 3) return;

    for (const [rawKey, rawValue] of Object.entries(value)) {
        const key = this.normalizeStr(rawKey);
        const keyLooksShippingRelated =
            key.includes("delivery") ||
            key.includes("shipping") ||
            key.includes("shipment") ||
            key.includes("carrier") ||
            key.includes("courier") ||
            key.includes("logistic");

        if (keyLooksShippingRelated) {
            if (typeof rawValue === "string" || typeof rawValue === "number") {
                this.pushStringCandidate(target, rawValue);
                continue;
            }
            this.collectShippingCandidatesFromObject(target, rawValue, depth + 1);
            continue;
        }

        if (rawValue && typeof rawValue === "object" && !Array.isArray(rawValue)) {
            this.collectShippingCandidatesFromObject(target, rawValue, depth + 1);
        }
    }
}

    /**
     * Zwraca listę kandydatów nazw wysyłki.
     * Apilo potrafi zwracać metodę w różnych miejscach, więc zbieramy jawne pola
     * zamówienia, zagnieżdżone obiekty dostawy oraz pozycje wysyłkowe z orderItems.
     */
    private getCandidateShippingNames(order: any): string[] {
    const names: string[] = [];

    [
        order?.deliveryMethod,
        order?.deliveryMethodName,
        order?.delivery_method,
        order?.delivery_method_name,
        order?.shippingMethod,
        order?.shippingMethodName,
        order?.shipping_method,
        order?.shipping_method_name,
        order?.shipmentMethod,
        order?.shipmentMethodName,
        order?.carrierName,
        order?.courierName,
        order?.delivery?.name,
        order?.delivery?.method,
        order?.delivery?.methodName,
        order?.delivery?.serviceName,
        order?.delivery?.shippingRates?.name,
        order?.shipping?.name,
        order?.shipping?.method,
        order?.shipping?.methodName,
        order?.shipping?.serviceName,
        order?.shipment?.name,
        order?.shipment?.method,
        order?.shipment?.methodName,
        order?.shipment?.serviceName,
        order?.logisticService?.name,
        order?.logisticService?.methodName,
    ].forEach((value) => this.pushStringCandidate(names, value));

    this.collectShippingCandidatesFromObject(names, order);

    const items = Array.isArray(order?.orderItems) ? order.orderItems : [];

    const preferred = items.filter((it: any) => {
        const sku = typeof it?.sku === "string" ? it.sku.toLowerCase() : "";
        const type = Number(it?.type);
        return type === 2 || sku.startsWith("ship");
    });

    const source = preferred.length ? preferred : items;

    for (const item of source) {
        [
            item?.originalName,
            item?.name,
            item?.productName,
            item?.deliveryMethod,
            item?.deliveryMethodName,
            item?.shippingMethod,
            item?.shippingMethodName,
        ].forEach((value) => this.pushStringCandidate(names, value));
    }

    // unikaty
    return Array.from(new Set(names));
}

    /**
     * Dopasowuje metodę dostawy do listy priorytetów (po "includes", case-insensitive).
     * Zwraca nazwę metody dokładnie taką, jak w priorityList (żeby indexOf działał).
     */
    private matchDeliveryMethod(order: any, priorityList: string[]): string | null {
    const normalizedPriority = (priorityList ?? []).map((m) => m?.toString() ?? "");
    const candidates = this.getCandidateShippingNames(order);
    if (!candidates.length || !normalizedPriority.length) return null;

    // metody do dopasowania (bez "Niezmapowane")
    const methods = normalizedPriority.filter((m) => this.normalizeStr(m) !== this.normalizeStr("Niezmapowane"));

    let best: { method: string; idx: number } | null = null;

    for (const cand of candidates) {
        const candNorm = this.normalizeStr(cand);

        for (const method of methods) {
            const idx = normalizedPriority.indexOf(method);
            if (idx === -1) continue;

            const methodNorm = this.normalizeStr(method);

            // dopasowanie po zawieraniu w obie strony:
            // Apilo czasem zwraca pełniejszą nazwę, a czasem krótszy wariant.
            if (candNorm.includes(methodNorm) || methodNorm.includes(candNorm)) {
                if (!best || idx < best.idx) {
                    best = { method, idx };
                }
            }
        }
    }

    return best?.method ?? null;
}

    /**
     * Zwraca rangę dla sortowania zamówień wg priorytetów.
     * Jeśli nie dopasowano metody => rangą jest index "Niezmapowane" (jeśli istnieje), w przeciwnym wypadku "na koniec".
     */
    private getDeliveryRank(order: any, priorityList: string[]): number {
    const list = (priorityList ?? []).map((m) => m?.toString() ?? "");
    const unmappedIdx = list.findIndex((m) => this.normalizeStr(m) === this.normalizeStr("Niezmapowane"));
    const fallbackRank = unmappedIdx !== -1 ? unmappedIdx : list.length;

    const matched = this.matchDeliveryMethod(order, list);
    if (!matched) return fallbackRank;

    const idx = list.indexOf(matched);
    return idx !== -1 ? idx : fallbackRank;
}

    private getItemSkuCandidates(item: any): string[] {
    const rawCandidates = [
        item?.sku,
        item?.SKU,
        item?.productSku,
        item?.productSKU,
        item?.product_sku,
        item?.code,
        item?.productCode,
        item?.product_code,
        item?.product?.sku,
        item?.product?.SKU,
        item?.product?.code,
        item?.product?.productSku,
        item?.offer?.sku,
        item?.offer?.code,
    ];

    return rawCandidates
        .filter((candidate) => typeof candidate === 'string' || typeof candidate === 'number')
        .map((candidate) => String(candidate).trim().toUpperCase())
        .filter((candidate) => candidate.length > 0);
}

    private getItemQuantity(item: any): number {
    const rawCandidates = [
        item?.quantity,
        item?.qty,
        item?.amount,
        item?.count,
        item?.quantityOrdered,
        item?.orderedQuantity,
    ];

    for (const candidate of rawCandidates) {
        const quantity = Number(candidate);
        if (Number.isFinite(quantity)) return quantity;
    }

    return 0;
}

    private getLineItemWorkloadCount(order: any, line: ApiloLineSettings): number {
    const items = Array.isArray(order?.orderItems) ? order.orderItems : [];
    let total = 0;

    for (const item of items) {
        const skus = this.getItemSkuCandidates(item);
        const quantity = this.getItemQuantity(item);

        if (line.sourceStatusId === 60) {
            if (skus.some((sku) => sku.startsWith("LAP"))) total += quantity;
            continue;
        }

        if (skus.some((sku) => sku.startsWith("ZKPC"))) {
            total += quantity * 2;
            continue;
        }
        if (skus.some((sku) => sku.startsWith("MAR") || sku.startsWith("IMAC"))) {
            total += quantity;
        }
    }

    return total;
}

    private getMonthlyComputerTotals(line: ApiloLineSettings, month: string, targetStatusIds: number[]): Record < number, number > {
    const monthCounts = line.monthlyComputerAssignment?.monthlyCounts?.[month] ?? {};
    return targetStatusIds.reduce((acc, targetId) => {
        const raw = monthCounts[targetId] ?? (monthCounts as any)[String(targetId)] ?? {};
        const auto = Number(raw?.auto);
        const manual = Number(raw?.manual);
        acc[targetId] = (Number.isFinite(auto) ? auto : 0) + (Number.isFinite(manual) ? manual : 0);
        return acc;
    }, {} as Record<number, number>);
}

    private chooseLeastLoadedTarget(targetStatusIds: number[], monthlyTotals: Record<number, number>): number | undefined {
    return targetStatusIds.reduce<number | undefined>((bestTarget, targetId) => {
        if (bestTarget === undefined) return targetId;
        return (monthlyTotals[targetId] ?? 0) < (monthlyTotals[bestTarget] ?? 0) ? targetId : bestTarget;
    }, undefined);
}

    private chooseLeastLoadedTargetWithCapacity(
    targetStatusIds: number[],
    monthlyTotals: Record<number, number>,
    currentOrderCounts: Record<number, number>,
    maxOrdersInTab: number,
): number | undefined {
    const candidates = targetStatusIds.filter((targetId) => (currentOrderCounts[targetId] ?? 0) < maxOrdersInTab);
    return this.chooseLeastLoadedTarget(candidates, monthlyTotals);
}


    /**
     * Pobiera zamówienia o danym statusie (Wersja dla endpointów HTTP – używa tokena z decodedTokens).
     */
    async getOrdersByStatus(
    statusId: number,
    decodedTokens: JwtPayload,
    limit = 100,
    offset = 0,
) {
    return this.getOrdersByStatusWithToken(
        statusId,
        decodedTokens.apiloToken,
        limit,
        offset,
    );
}

    /**
     * Wewnętrzna metoda pobierania zamówień po statusie (używa bezpośrednio tokena Apilo, do crona).
     */
    private async getOrdersByStatusWithToken(
    statusId: number,
    apiloToken: string,
    limit = 100,
    offset = 0,
) {
    try {
        const response = await this.httpService.axiosRef.get(
            this.getApiloUrl('/orders/'),
            {
                headers: {
                    Authorization: `Bearer ${apiloToken}`,
                    Accept: 'application/json',
                },
                params: {
                    orderStatusIds: [statusId],
                    limit,
                    offset,
                },
            },
        );
        return response.data; // { orders: [...], totalCount, ... }
    } catch (e) {
        if (axios.isAxiosError(e) && e.response) {
            throw new BadRequestException(e.response.data);
        }
        throw new InternalServerErrorException();
    }
}

    /**
     * Aktualizuje status pojedynczego zamówienia (Wersja z decodedTokens dla endpointów HTTP).
     */
    async updateOrderStatus(
    orderId: number | string,
    newStatusId: number,
    decodedTokens: JwtPayload,
) {
    return this.updateOrderStatusWithToken(
        orderId,
        newStatusId,
        decodedTokens.apiloToken,
    );
}

    /**
     * Wewnętrzna metoda aktualizacji statusu zamówienia (używa bezpośrednio tokena Apilo, do crona).
     */
    private async updateOrderStatusWithToken(
    orderId: number | string,
    newStatusId: number,
    apiloToken: string,
) {
    try {
        const response = await this.httpService.axiosRef.put(
            this.getApiloUrl(`/orders/${orderId}/status/`),
            { status: newStatusId },
            {
                headers: {
                    Authorization: `Bearer ${apiloToken}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
            },
        );
        return response.data; // np. { "updates": "1" }
    } catch (e) {
        if (axios.isAxiosError(e) && e.response) {
            throw new BadRequestException(e.response.data);
        }
        throw new InternalServerErrorException();
    }
}

    /**
     * Losowe przydzielanie zamówień – wersja używana przez endpoint HTTP (wykorzystuje JwtPayload).
     * (Uwaga: metoda zachowana dla kompatybilności wstecznej; obecnie używa nowych ustawień domyślnych)
     */
    async randomlyAssignFromStatus(
    sourceStatusId: number,
    targetStatusIds: number[],
    decodedTokens: JwtPayload,
) {
    return this.randomlyAssignFromStatusWithToken(
        sourceStatusId,
        targetStatusIds,
        decodedTokens.apiloToken,
    );
}

    /**
     * Losowe przydzielanie zamówień – wersja dla crona (używa bezpośrednio tokena).
     * (Uwaga: metoda zachowana dla kompatybilności; używa limitu domyślnego 2 i priorytetów domyślnych)
     */
    async randomlyAssignFromStatusWithToken(
    sourceStatusId: number,
    targetStatusIds: number[],
    apiloToken: string,
) {
    // Przygotuj domyślne ustawienia linii na podstawie parametrów
    const lineConfig: ApiloLineSettings = {
        active: true,
        sourceStatusId,
        targetStatusIds: targetStatusIds.slice(),
        targetLimits: {},
        deliveryMethodPriority: [],
        maxLargeOrderItems: 9,
    };
    for (const id of targetStatusIds) {
        lineConfig.targetLimits[id] = 2;
    }
    // Wykonaj przydzielanie zamówień za pomocą nowych ustawień
    return this.assignOrdersForLine(lineConfig, apiloToken);
}

    /**
     * Przydziela zamówienia z linii (źródłowy status line.sourceStatusId) do dostępnych statusów docelowych zgodnie z ustawieniami linii.
     * Zwraca listę rozpatrzonych zamówień oraz statystyki przydziału.
     */
    async assignOrdersForLine(line: ApiloLineSettings, apiloToken: string) {
    const sourceStatusId = line.sourceStatusId;
    const usesMonthlyComputerAssignment = !!line.monthlyComputerAssignment;
    const targetStatusIds = usesMonthlyComputerAssignment
        ? this.getEffectiveMonthlyComputerTargetStatusIds(line)
        : this.getEffectiveTargetStatusIds(line);
    // 0. Ustal kolejność docelowych statusów (round-robin startowy)
    const orderedTargets = usesMonthlyComputerAssignment
        ? targetStatusIds
        : this.getStableRandomTargets(sourceStatusId, targetStatusIds);
    if (!this.isLineEffectiveActiveNow(line)) {
        return {
            orders: [],
            assignedCount: 0,
            assignments: [],
            reason: "Linia nieaktywna (poza godzinami harmonogramu lub ręcznie wyłączona).",
        };
    }


    if (!orderedTargets.length) {
        return {
            orders: [],
            assignedCount: 0,
            assignments: [],
            reason: 'Brak włączonych docelowych statusów',
        };
    }

    // 1. Pobierz wszystkie zamówienia ze statusu źródłowego
    const data = await this.getOrdersByStatusWithToken(sourceStatusId, apiloToken);
    const allOrders = data.orders ?? [];
    // 1a. Odfiltruj zamówienia przekraczające limit dużych zamówień
    // Linia 1 liczy komputery (MAR, a ZKPC x2), linia 2 zostaje po LAP.
    const maxItems = line.maxLargeOrderItems;

    const orders = allOrders.filter((order: any) => {
        const totalLargeItems = this.getLineItemWorkloadCount(order, line);
        // jeśli w tym zamówieniu jest więcej niż maxItems takich pozycji – pomijamy je
        return totalLargeItems <= maxItems;
    });

    if (!orders.length) {
        return {
            orders: allOrders,
            assignedCount: 0,
            assignments: [],
            reason: `Brak zamówień do przydzielenia (wszystkie mają > ${maxItems} komputerów lub brak zamówień w statusie źródłowym)`,
        };
    }

    // 1b. Posortuj zamówienia wg priorytetów metod dostawy (jeśli zdefiniowane)
    // 1b. Posortuj zamówienia wg priorytetów metod dostawy
    if (line.deliveryMethodPriority && line.deliveryMethodPriority.length > 0) {
        const priorityList = line.deliveryMethodPriority.map((m: any) => String(m));

        const ranked = orders.map((order: any, i: number) => {
            const rank = this.getDeliveryRank(order, priorityList);
            return { order, rank, i };
        });

        ranked.sort((a, b) => (a.rank - b.rank) || (a.i - b.i));

        // nadpisz kolejność
        orders.splice(0, orders.length, ...ranked.map((x) => x.order));
    }

    if (usesMonthlyComputerAssignment) {
        const timezone = line.monthlyComputerAssignment?.timezone || line.autoSchedule?.timezone || this.DEFAULT_TZ;
        const month = this.getMonthStringInZone(new Date(), timezone);
        const monthlyTotals = this.getMonthlyComputerTotals(line, month, orderedTargets);
        const currentOrderCounts: Record<number, number> = {};
        for (const targetId of orderedTargets) {
            try {
                const targetData = await this.getOrdersByStatusWithToken(targetId, apiloToken, 100);
                currentOrderCounts[targetId] =
                    typeof targetData.totalCount === 'number'
                        ? targetData.totalCount
                        : (targetData.orders?.length ?? 0);
            } catch (e) {
                currentOrderCounts[targetId] = 0;
            }
        }
        const assignments: { orderId: any; from: number; to: number; computerCount: number }[] = [];

        for (const order of orders) {
            if (!order.id) continue;
            const computerCount = this.getLineItemWorkloadCount(order, line);
            if (computerCount <= 0) continue;

            const chosenStatus = this.chooseLeastLoadedTargetWithCapacity(orderedTargets, monthlyTotals, currentOrderCounts, 2);
            if (!chosenStatus) break;

            await this.updateOrderStatusWithToken(order.id, chosenStatus, apiloToken);
            order.orderStatus = chosenStatus;
            order.computerCount = computerCount;
            monthlyTotals[chosenStatus] = (monthlyTotals[chosenStatus] ?? 0) + computerCount;
            currentOrderCounts[chosenStatus] = (currentOrderCounts[chosenStatus] ?? 0) + 1;
            assignments.push({
                orderId: order.id,
                from: sourceStatusId,
                to: chosenStatus,
                computerCount,
            });
        }

        const updatedSettings = assignments.length
            ? await this.apiloSettingsService.recordLine1ComputerAssignments(
                assignments.map((assignment) => ({
                    orderId: assignment.orderId,
                    targetStatusId: assignment.to,
                    computerCount: assignment.computerCount,
                })),
                month,
            )
            : undefined;

        return {
            orders,
            assignedCount: assignments.length,
            assignments,
            settings: updatedSettings,
        };
    }


    // 2. Sprawdź liczbę zamówień w każdej docelowej zakładce (aktualne obłożenie)
    const currentCounts: Record<number, number> = {};
    for (const targetId of orderedTargets) {
        try {
            const targetData = await this.getOrdersByStatusWithToken(targetId, apiloToken, 100);
            const totalCount =
                typeof targetData.totalCount === 'number'
                    ? targetData.totalCount
                    : (targetData.orders?.length ?? 0);
            currentCounts[targetId] = totalCount;
        } catch (e) {
            // Jeśli wystąpił błąd pobierania zamówień dla zakładki, przyjmij 0
            currentCounts[targetId] = 0;
        }
    }

    // 3. Wybierz statusy docelowe, które nie przekroczyły limitów
    let availableTargets = orderedTargets.filter((id) => {
        const capacity = line.targetLimits[id] ?? 0;
        return (currentCounts[id] ?? 0) < capacity;
    });
    if (!availableTargets.length) {
        return {
            orders,
            assignedCount: 0,
            assignments: [],
            reason: 'Brak wolnych docelowych zakładek (wszystkie osiągnęły limity)',
        };
    }

    // 4. Przydzielaj zamówienia po kolei (round-robin) do dostępnych statusów
    const assignments: { orderId: any; from: number; to: number }[] = [];
    let targetIndex = 0;
    const lastTarget = this.lastTargetBySource[sourceStatusId] ?? null;
    if (lastTarget !== null) {
        const lastIdx = availableTargets.indexOf(lastTarget);
        if (lastIdx !== -1) {
            targetIndex = (lastIdx + 1) % availableTargets.length;
        }
    }
    for (const order of orders) {
        if (!order.id) continue;
        let chosenStatus: number | undefined;
        let tries = 0;
        while (tries < availableTargets.length) {
            const statusId = availableTargets[targetIndex];
            const count = currentCounts[statusId] ?? 0;
            const capacity = line.targetLimits[statusId] ?? 0;
            if (count < capacity) {
                chosenStatus = statusId;
                break;
            }
            targetIndex = (targetIndex + 1) % availableTargets.length;
            tries++;
        }
        if (!chosenStatus) {
            // Wszystkie zakładki zapełniły się w trakcie przydziału
            break;
        }
        // 5. Aktualizuj status zamówienia w Apilo
        await this.updateOrderStatusWithToken(order.id, chosenStatus, apiloToken);
        this.lastTargetBySource[sourceStatusId] = chosenStatus;
        order.orderStatus = chosenStatus; // zakładamy, że pole orderStatus reprezentuje status
        currentCounts[chosenStatus] = (currentCounts[chosenStatus] ?? 0) + 1;
        assignments.push({
            orderId: order.id,
            from: sourceStatusId,
            to: chosenStatus,
        });
        // Przygotuj indeks dla kolejnego zamówienia
        targetIndex = (targetIndex + 1) % availableTargets.length;
        // 6. Zaktualizuj listę dostępnych statusów (usuń te, które osiągnęły limit)
        availableTargets = availableTargets.filter((id) => (currentCounts[id] ?? 0) < (line.targetLimits[id] ?? 0));
        if (!availableTargets.length) {
            break;
        }
        targetIndex = targetIndex % availableTargets.length;
    }

    // 7. Zwróć rezultaty przydziału
    return {
        orders,
        assignedCount: assignments.length,
        assignments,
    };
}
}
