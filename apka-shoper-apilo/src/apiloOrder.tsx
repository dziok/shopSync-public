import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from "./config";
import { toast } from "react-toastify";

import {
    Box,
    Card,
    CardContent,
    CardHeader,
    Checkbox,
    Container,
    Divider,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputLabel,
    InputAdornment,
    List,
    ListItem,
    ListItemText,
    MenuItem,
    OutlinedInput,
    Stack,
    TextField,
    Tooltip,
    Typography,
    Button,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Select,
} from "@mui/material";


type OrdersPanelProps = { authToken: string };

type OrderRow = {
    id: string | number;
    orderStatus?: number;
    buyerName?: string;
    computerCount?: number;
};

type LimitsMap = Record<number, number>;
type RotationDayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
type RotationDayMode = "fixed" | "drop_one";
type RotationDayConfig = {
    mode: RotationDayMode;
    enabledCount: number;
    disableAt: string;
};
type MonthlyComputerCount = {
    auto: number;
    manual: number;
};
type MonthlyComputerTargetScheduleMode = "always" | "off" | "alternate_a" | "alternate_b" | "alternate_c";
type MonthlyComputerTargetSchedule = {
    mode: MonthlyComputerTargetScheduleMode;
};
type MonthlyComputerAssignment = {
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
};

const ROTATION_DAYS: { key: RotationDayKey; label: string }[] = [
    { key: "monday", label: "Poniedziałek" },
    { key: "tuesday", label: "Wtorek" },
    { key: "wednesday", label: "Środa" },
    { key: "thursday", label: "Czwartek" },
    { key: "friday", label: "Piątek" },
    { key: "saturday", label: "Sobota" },
    { key: "sunday", label: "Niedziela" },
];

const getTodayDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const getCurrentMonthString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
};

const createDefaultMonthlyComputerAssignment = (targetIds: number[]): MonthlyComputerAssignment => ({
    timezone: "Europe/Warsaw",
    alternateAnchorDate: getTodayDateString(),
    mondayAllActive: false,
    targetSchedules: targetIds.reduce((acc, id) => {
        acc[id] = { mode: "always" };
        return acc;
    }, {} as Record<number, MonthlyComputerTargetSchedule>),
    weekdayTargets: ROTATION_DAYS.reduce((acc, { key }) => {
        acc[key] = key === "saturday" || key === "sunday" ? [] : [...targetIds];
        return acc;
    }, {} as Record<RotationDayKey, number[]>),
    monthlyCounts: {},
    assignedOrders: {},
});

const normalizeMonthlyComputerAssignment = (raw: any, targetIds: number[]): MonthlyComputerAssignment => {
    const defaults = createDefaultMonthlyComputerAssignment(targetIds);
    const rawWeekdayTargets = raw?.weekdayTargets && typeof raw.weekdayTargets === "object" ? raw.weekdayTargets : {};
    const rawTargetSchedules = raw?.targetSchedules && typeof raw.targetSchedules === "object" ? raw.targetSchedules : {};

    const weekdayTargets = ROTATION_DAYS.reduce((acc, { key }) => {
        const source = Array.isArray(rawWeekdayTargets[key])
            ? rawWeekdayTargets[key]
            : defaults.weekdayTargets[key];
        acc[key] = (source ?? [])
            .map((entry: any) => Number(entry))
            .filter((entry: number, index: number, arr: number[]) => !Number.isNaN(entry) && targetIds.includes(entry) && arr.indexOf(entry) === index);
        return acc;
    }, {} as Record<RotationDayKey, number[]>);

    const monthlyCounts: MonthlyComputerAssignment["monthlyCounts"] = {};
    const rawMonthlyCounts = raw?.monthlyCounts && typeof raw.monthlyCounts === "object" ? raw.monthlyCounts : {};
    for (const [month, counts] of Object.entries(rawMonthlyCounts)) {
        if (!/^\d{4}-\d{2}$/.test(month) || !counts || typeof counts !== "object") continue;
        monthlyCounts[month] = {};
        for (const [statusId, count] of Object.entries(counts as Record<string, any>)) {
            const id = Number(statusId);
            const auto = Number(count?.auto);
            const manual = Number(count?.manual);
            if (!Number.isNaN(id)) {
                monthlyCounts[month][id] = {
                    auto: Number.isFinite(auto) ? auto : 0,
                    manual: Number.isFinite(manual) ? manual : 0,
                };
            }
        }
    }

    const targetSchedules = targetIds.reduce((acc, id) => {
        const rawSchedule = rawTargetSchedules[id] ?? rawTargetSchedules[String(id)];
        const mode = rawSchedule?.mode === "off"
            ? "off"
            : rawSchedule?.mode === "alternate_a"
                ? "alternate_a"
                : rawSchedule?.mode === "alternate_b"
                    ? "alternate_b"
                    : rawSchedule?.mode === "alternate_c"
                        ? "alternate_c"
                    : "always";
        acc[id] = { mode };
        return acc;
    }, {} as Record<number, MonthlyComputerTargetSchedule>);

    const assignedOrders = raw?.assignedOrders && typeof raw.assignedOrders === "object" ? raw.assignedOrders : {};
    for (const monthCounts of Object.values(monthlyCounts)) {
        for (const count of Object.values(monthCounts)) {
            count.auto = 0;
        }
    }
    for (const entry of Object.values(assignedOrders) as any[]) {
        const month = String(entry?.month || "");
        const targetStatusId = Number(entry?.targetStatusId);
        const computerCount = Number(entry?.computerCount);
        if (!/^\d{4}-\d{2}$/.test(month) || Number.isNaN(targetStatusId) || !Number.isFinite(computerCount)) continue;
        if (!monthlyCounts[month]) monthlyCounts[month] = {};
        const current = monthlyCounts[month][targetStatusId] ?? { auto: 0, manual: 0 };
        monthlyCounts[month][targetStatusId] = {
            auto: (Number(current.auto) || 0) + computerCount,
            manual: Number(current.manual) || 0,
        };
    }

    return {
        timezone: typeof raw?.timezone === "string" && raw.timezone.trim() ? raw.timezone.trim() : defaults.timezone,
        alternateAnchorDate: typeof raw?.alternateAnchorDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.alternateAnchorDate)
            ? raw.alternateAnchorDate
            : defaults.alternateAnchorDate,
        mondayAllActive: typeof raw?.mondayAllActive === "boolean" ? raw.mondayAllActive : false,
        targetSchedules,
        weekdayTargets,
        monthlyCounts,
        assignedOrders,
    };
};

const createDefaultRotationDays = (): Record<RotationDayKey, RotationDayConfig> => ({
    monday: { mode: "drop_one", enabledCount: 2, disableAt: "13:00" },
    tuesday: { mode: "drop_one", enabledCount: 2, disableAt: "13:00" },
    wednesday: { mode: "drop_one", enabledCount: 2, disableAt: "13:00" },
    thursday: { mode: "drop_one", enabledCount: 2, disableAt: "13:00" },
    friday: { mode: "drop_one", enabledCount: 2, disableAt: "13:00" },
    saturday: { mode: "fixed", enabledCount: 0, disableAt: "13:00" },
    sunday: { mode: "fixed", enabledCount: 0, disableAt: "13:00" },
});

const normalizeRotationDays = (
    rawDays: any,
    legacyRotation?: any,
    fallback?: Record<RotationDayKey, RotationDayConfig>,
): Record<RotationDayKey, RotationDayConfig> => {
    const defaults = fallback ?? createDefaultRotationDays();
    const legacyEnabledCount = Number(legacyRotation?.morningEnabledCount);
    const legacyDisableAt =
        typeof legacyRotation?.disableAt === "string" && /^\d{2}:\d{2}$/.test(legacyRotation.disableAt)
            ? legacyRotation.disableAt
            : defaults.monday.disableAt;
    const weekdaysOnly = legacyRotation?.weekdaysOnly == null ? true : !!legacyRotation.weekdaysOnly;

    const legacyDays: Record<RotationDayKey, RotationDayConfig> = {
        monday: {
            mode: "drop_one",
            enabledCount: Number.isFinite(legacyEnabledCount) ? Math.max(0, Math.floor(legacyEnabledCount)) : defaults.monday.enabledCount,
            disableAt: legacyDisableAt,
        },
        tuesday: {
            mode: "drop_one",
            enabledCount: Number.isFinite(legacyEnabledCount) ? Math.max(0, Math.floor(legacyEnabledCount)) : defaults.tuesday.enabledCount,
            disableAt: legacyDisableAt,
        },
        wednesday: {
            mode: "drop_one",
            enabledCount: Number.isFinite(legacyEnabledCount) ? Math.max(0, Math.floor(legacyEnabledCount)) : defaults.wednesday.enabledCount,
            disableAt: legacyDisableAt,
        },
        thursday: {
            mode: "drop_one",
            enabledCount: Number.isFinite(legacyEnabledCount) ? Math.max(0, Math.floor(legacyEnabledCount)) : defaults.thursday.enabledCount,
            disableAt: legacyDisableAt,
        },
        friday: {
            mode: "drop_one",
            enabledCount: Number.isFinite(legacyEnabledCount) ? Math.max(0, Math.floor(legacyEnabledCount)) : defaults.friday.enabledCount,
            disableAt: legacyDisableAt,
        },
        saturday: weekdaysOnly
            ? { mode: "fixed", enabledCount: 0, disableAt: legacyDisableAt }
            : {
                mode: "drop_one",
                enabledCount: Number.isFinite(legacyEnabledCount) ? Math.max(0, Math.floor(legacyEnabledCount)) : defaults.saturday.enabledCount,
                disableAt: legacyDisableAt,
            },
        sunday: weekdaysOnly
            ? { mode: "fixed", enabledCount: 0, disableAt: legacyDisableAt }
            : {
                mode: "drop_one",
                enabledCount: Number.isFinite(legacyEnabledCount) ? Math.max(0, Math.floor(legacyEnabledCount)) : defaults.sunday.enabledCount,
                disableAt: legacyDisableAt,
            },
    };

    return ROTATION_DAYS.reduce((acc, { key }) => {
        const source = rawDays?.[key] ?? legacyDays[key] ?? defaults[key];
        const fallbackDay = rawDays ? legacyDays[key] ?? defaults[key] : defaults[key];
        acc[key] = {
            mode: source?.mode === "fixed" ? "fixed" : source?.mode === "drop_one" ? "drop_one" : fallbackDay.mode,
            enabledCount: Number.isFinite(Number(source?.enabledCount))
                ? Math.max(0, Math.floor(Number(source.enabledCount)))
                : fallbackDay.enabledCount,
            disableAt:
                typeof source?.disableAt === "string" && /^\d{2}:\d{2}$/.test(source.disableAt)
                    ? source.disableAt
                    : fallbackDay.disableAt,
        };
        return acc;
    }, {} as Record<RotationDayKey, RotationDayConfig>);
};

type LineProps = {
    title: string;
    subtitle: string;
    active: boolean;
    setActive: (v: boolean) => void;

    targetIdsAll: number[];
    targetNames: Record<number, string>;
    selectedTargetIds: number[];
    toggleTarget: (id: number, checked: boolean) => void;

    limits: LimitsMap;
    setLimit: (id: number, v: string) => void;

    maxLargeLabel: string;
    maxLarge: number;
    setMaxLarge: (v: number) => void;

    methods: string[];
    setMethods: React.Dispatch<React.SetStateAction<string[]>>;
    newMethod: string;
    setNewMethod: (v: string) => void;

    onAssign: () => Promise<void>;
    loadingAssign: boolean;
    orders: OrderRow[];

    scheduleEnabled: boolean;
    setScheduleEnabled: (v: boolean) => void;
    weekendOnly: boolean;
    setWeekendOnly: (v: boolean) => void;
    enableAt: string;
    setEnableAt: (v: string) => void;
    disableAt: string;
    setDisableAt: (v: string) => void;

    rotationEnabled?: boolean;
    setRotationEnabled?: (v: boolean) => void;
    rotationParticipants?: number[];
    setRotationParticipants?: (v: number[]) => void;
    rotationDays?: Record<RotationDayKey, RotationDayConfig>;
    setRotationDayMode?: (day: RotationDayKey, v: RotationDayMode) => void;
    setRotationDayEnabledCount?: (day: RotationDayKey, v: number) => void;
    setRotationDayDisableAt?: (day: RotationDayKey, v: string) => void;
    rotationOrderLabel?: string;
    rotationMaxCount?: number;

    monthlyComputerAssignment?: MonthlyComputerAssignment;
    selectedMonth?: string;
    currentMonth?: string;
    setSelectedMonth?: (v: string) => void;
    setMonthlyManualCount?: (statusId: number, month: string, value: number) => void;
    adjustMonthlyManualCount?: (statusId: number, month: string, delta: number) => void;
    setMonthlyTargetScheduleMode?: (statusId: number, mode: MonthlyComputerTargetScheduleMode) => void;
    setMonthlyAlternateAnchorDate?: (date: string) => void;
    setMonthlyMondayAllActive?: (enabled: boolean) => void;
};

const isPlainObject = (v: any) => v !== null && typeof v === "object" && !Array.isArray(v);

const deepEqual = (a: any, b: any): boolean => {
    if (Object.is(a, b)) return true;
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
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
};

// Zwraca undefined gdy brak zmian; zwraca "patch" gdy są
const deepDiff = (base: any, current: any): any | undefined => {
    if (Array.isArray(base) || Array.isArray(current)) {
        return deepEqual(base, current) ? undefined : current;
    }

    if (isPlainObject(base) && isPlainObject(current)) {
        const out: any = {};
        const keys = new Set([...Object.keys(base), ...Object.keys(current)]);
        for (const k of keys) {
            const d = deepDiff(base?.[k], current?.[k]);
            if (d !== undefined) out[k] = d;
        }
        return Object.keys(out).length ? out : undefined;
    }

    return deepEqual(base, current) ? undefined : current;
};

const collectPaths = (obj: any, prefix = ""): string[] => {
    if (!isPlainObject(obj)) return prefix ? [prefix] : [];
    const paths: string[] = [];
    for (const [k, v] of Object.entries(obj)) {
        const nextPrefix = prefix ? `${prefix}.${k}` : k;
        if (isPlainObject(v)) paths.push(...collectPaths(v, nextPrefix));
        else paths.push(nextPrefix);
    }
    return paths;
};


const OrdersTable: React.FC<{ rows: OrderRow[] }> = ({ rows }) => {
    if (!rows?.length) return null;

    return (
        <Paper variant="outlined" sx={{ mt: 2, overflow: "hidden" }}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Komputery</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Klient</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((o) => (
                        <TableRow key={String(o.id)} hover>
                            <TableCell>{o.id}</TableCell>
                            <TableCell>{o.orderStatus ?? "-"}</TableCell>
                            <TableCell>{o.computerCount ?? "-"}</TableCell>
                            <TableCell>{o.buyerName ?? "-"}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Paper>
    );
};

const LineCard: React.FC<LineProps> = ({
    title,
    subtitle,
    active,
    setActive,
    targetIdsAll,
    targetNames,
    selectedTargetIds,
    toggleTarget,
    limits,
    setLimit,
    maxLargeLabel,
    maxLarge,
    setMaxLarge,
    methods,
    setMethods,
    newMethod,
    setNewMethod,
    onAssign,
    loadingAssign,
    orders,
    scheduleEnabled,
    setScheduleEnabled,
    weekendOnly,
    setWeekendOnly,
    enableAt,
    setEnableAt,
    disableAt,
    setDisableAt,
    rotationEnabled,
    setRotationEnabled,
    rotationParticipants,
    setRotationParticipants,
    rotationDays,
    setRotationDayMode,
    setRotationDayEnabledCount,
    setRotationDayDisableAt,
    rotationOrderLabel,
    rotationMaxCount,
    monthlyComputerAssignment,
    selectedMonth,
    currentMonth,
    setSelectedMonth,
    setMonthlyManualCount,
    adjustMonthlyManualCount,
    setMonthlyTargetScheduleMode,
    setMonthlyAlternateAnchorDate,
    setMonthlyMondayAllActive,

}) => {
    const disabled = !active;
    const rotationParticipantOptions = targetIdsAll.filter((id) => selectedTargetIds.includes(id));
    const monthlyStatsMonth = selectedMonth ?? currentMonth ?? getCurrentMonthString();
    const monthlyCounts = monthlyComputerAssignment?.monthlyCounts?.[monthlyStatsMonth] ?? {};
    const canEditManualMonth = !!monthlyComputerAssignment && monthlyStatsMonth === currentMonth;

    const moveUp = (index: number) => {
        if (index <= 0) return;
        setMethods((prev) => {
            const next = [...prev];
            [next[index - 1], next[index]] = [next[index], next[index - 1]];
            return next;
        });
    };

    const moveDown = (index: number) => {
        if (index >= methods.length - 1) return;
        setMethods((prev) => {
            const next = [...prev];
            [next[index], next[index + 1]] = [next[index + 1], next[index]];
            return next;
        });
    };

    const removeMethod = (index: number) => {
        setMethods((prev) => prev.filter((_, i) => i !== index));
    };

    const addMethod = () => {
        const m = newMethod.trim();
        if (!m) return;
        setMethods((prev) => (prev.includes(m) ? prev : [...prev, m]));
        setNewMethod("");
    };

    return (
        <Card variant="outlined" sx={{ height: "100%" }}>
            <CardHeader
                title={
                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                            {title}
                        </Typography>
                        <Chip
                            size="small"
                            label={active ? "Aktywna" : "Nieaktywna"}
                            color={active ? "success" : "default"}
                            variant={active ? "filled" : "outlined"}
                        />
                    </Stack>
                }
                subheader={subtitle}
                action={
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={active}
                                onChange={(e) => setActive(e.target.checked)}
                            />
                        }
                        label="Aktywuj"
                        sx={{ mr: 1 }}
                    />
                }
                sx={{
                    pb: 1,
                    "& .MuiCardHeader-action": { alignSelf: "center" },
                }}
            />

            <Divider />

            <CardContent >
                <Stack spacing={2}>
                    {/* Zakładki docelowe */}
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                            {monthlyComputerAssignment ? "Zakładki docelowe" : "Zakładki docelowe i limity"}
                        </Typography>

                        <Stack spacing={1}>
                            {targetIdsAll.map((id) => {
                                const checked = selectedTargetIds.includes(id);
                                return (
                                    <Paper
                                        key={id}
                                        variant="outlined"
                                        sx={{
                                            p: 1,
                                            opacity: disabled ? 0.6 : 1,
                                        }}
                                    >
                                        <Grid container spacing={1} alignItems="center">
                                            <Grid item xs={12} md={monthlyComputerAssignment ? 12 : 7}>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={checked}
                                                            disabled={disabled}
                                                            onChange={(e) => toggleTarget(id, e.target.checked)}
                                                        />
                                                    }
                                                    label={
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <Typography sx={{ fontWeight: 600 }}>
                                                                {targetNames[id] || `Status ${id}`}
                                                            </Typography>
                                                            <Chip
                                                                size="small"
                                                                variant="outlined"
                                                                label={`ID: ${id}`}
                                                            />
                                                        </Stack>
                                                    }
                                                />
                                            </Grid>

                                            {!monthlyComputerAssignment && (
                                                <Grid item xs={12} md={5}>
                                                    <TextField
                                                        size="small"
                                                        type="number"
                                                        label="Limit w zakładce"
                                                        value={limits[id] ?? 0}
                                                        disabled={disabled}
                                                        onChange={(e) => setLimit(id, e.target.value)}
                                                        inputProps={{ min: 0 }}
                                                        fullWidth
                                                    />
                                                </Grid>
                                            )}
                                        </Grid>
                                    </Paper>
                                );
                            })}
                        </Stack>
                    </Box>
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                            Harmonogram aktywności
                        </Typography>

                        <Paper variant="outlined" sx={{ p: 1, opacity: disabled ? 0.6 : 1 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={scheduleEnabled}
                                        disabled={disabled}
                                        onChange={(e) => setScheduleEnabled(e.target.checked)}
                                    />
                                }
                                label="Włącz automatyczne włączanie/wyłączanie"
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={weekendOnly}
                                        disabled={disabled}
                                        onChange={(e) => setWeekendOnly(e.target.checked)}
                                    />
                                }
                                label="Wyłącz w weekend (działa tylko pon–pt)"
                            />

                            <Grid container spacing={1} sx={{ mt: 0.5 }}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Włącz o"
                                        type="time"
                                        size="small"
                                        fullWidth
                                        disabled={disabled || !scheduleEnabled}
                                        value={enableAt}
                                        onChange={(e) => setEnableAt(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        inputProps={{ step: 60 }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Wyłącz o"
                                        type="time"
                                        size="small"
                                        fullWidth
                                        disabled={disabled || !scheduleEnabled}
                                        value={disableAt}
                                        onChange={(e) => setDisableAt(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        inputProps={{ step: 60 }}
                                    />
                                </Grid>
                            </Grid>

                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                                Jeśli godziny są równe (np. 08:00–08:00), traktujemy to jako aktywne 24h.
                            </Typography>
                        </Paper>
                    </Box>

                    {typeof rotationEnabled === "boolean" && setRotationEnabled && !monthlyComputerAssignment && (
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                                Tryb rotacji zakładek (linia 1)
                            </Typography>

                            <Paper variant="outlined" sx={{ p: 1, opacity: disabled ? 0.6 : 1 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={rotationEnabled}
                                            disabled={disabled}
                                            onChange={(e) => setRotationEnabled(e.target.checked)}
                                        />
                                    }
                                    label="Włącz rotację zakładek"
                                />

                                <FormControl
                                    fullWidth
                                    size="small"
                                    sx={{ mt: 1 }}
                                    disabled={disabled || !rotationEnabled || rotationParticipantOptions.length === 0}
                                >
                                    <InputLabel>Uczestnicy cyklu</InputLabel>
                                    <Select
                                        multiple
                                        value={rotationParticipants ?? []}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            const next = (Array.isArray(value) ? value : String(value).split(","))
                                                .map((entry) => Number(entry))
                                                .filter((entry) => !Number.isNaN(entry));
                                            setRotationParticipants?.(next);
                                        }}
                                        input={<OutlinedInput label="Uczestnicy cyklu" />}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                                {(selected as number[]).map((id) => (
                                                    <Chip key={id} size="small" label={targetNames[id] || `Status ${id}`} />
                                                ))}
                                            </Box>
                                        )}
                                    >
                                        {rotationParticipantOptions.map((id) => (
                                            <MenuItem key={id} value={id}>
                                                <Checkbox checked={(rotationParticipants ?? []).includes(id)} />
                                                <ListItemText primary={targetNames[id] || `Status ${id}`} />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                                    Uczestników cyklu wybierasz osobno. Samo zaznaczenie zakładki docelowej nie oznacza, że ma być ona otwierana w rotacji.
                                </Typography>

                                <Stack spacing={1} sx={{ mt: 1.5 }}>
                                    {ROTATION_DAYS.map(({ key, label }) => {
                                        const dayConfig = rotationDays?.[key] ?? createDefaultRotationDays()[key];
                                        const isDropOne = dayConfig.mode === "drop_one";

                                        return (
                                            <Paper key={key} variant="outlined" sx={{ p: 1.25 }}>
                                                <Grid container spacing={1} alignItems="center">
                                                    <Grid item xs={12} md={3}>
                                                        <Typography sx={{ fontWeight: 700 }}>{label}</Typography>
                                                    </Grid>

                                                    <Grid item xs={12} md={4}>
                                                        <FormControl fullWidth size="small">
                                                            <InputLabel>Tryb dnia</InputLabel>
                                                            <Select
                                                                label="Tryb dnia"
                                                                disabled={disabled || !rotationEnabled}
                                                                value={dayConfig.mode}
                                                                onChange={(e) => setRotationDayMode?.(key, e.target.value as RotationDayMode)}
                                                            >
                                                                <MenuItem value="fixed">Stała liczba zakładek</MenuItem>
                                                                <MenuItem value="drop_one">Wyłącz jedną o godzinie</MenuItem>
                                                            </Select>
                                                        </FormControl>
                                                    </Grid>

                                                    <Grid item xs={12} sm={6} md={2.5}>
                                                        <TextField
                                                            label="Otwarte rano"
                                                            type="number"
                                                            size="small"
                                                            fullWidth
                                                            disabled={disabled || !rotationEnabled}
                                                            value={dayConfig.enabledCount}
                                                            onChange={(e) => setRotationDayEnabledCount?.(key, Number(e.target.value) || 0)}
                                                            inputProps={{ min: 0, max: rotationMaxCount ?? undefined }}
                                                        />
                                                    </Grid>

                                                    <Grid item xs={12} sm={6} md={2.5}>
                                                        <TextField
                                                            label="Wyłącz jedną o"
                                                            type="time"
                                                            size="small"
                                                            fullWidth
                                                            disabled={disabled || !rotationEnabled || !isDropOne}
                                                            value={dayConfig.disableAt}
                                                            onChange={(e) => setRotationDayDisableAt?.(key, e.target.value)}
                                                            InputLabelProps={{ shrink: true }}
                                                            inputProps={{ step: 60 }}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </Paper>
                                        );
                                    })}
                                </Stack>

                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                                    Wpisz `0`, jeśli danego dnia nikt nie ma mieć otwartej zakładki. Maksymalnie {rotationMaxCount ?? 0} aktywnych rano.
                                </Typography>

                                {rotationOrderLabel ? (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                                        Kolejność cyklu: {rotationOrderLabel}
                                    </Typography>
                                ) : null}
                            </Paper>
                        </Box>
                    )}


                    {monthlyComputerAssignment && (
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                                Miesięczne liczenie komputerów (linia 1)
                            </Typography>

                            <Paper variant="outlined" sx={{ p: 1, opacity: disabled ? 0.6 : 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                                    Włączone osoby według dnia tygodnia
                                </Typography>
                                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} sx={{ mb: 1 }}>
                                    <TextField
                                        type="date"
                                        size="small"
                                        label="Start naprzemienności"
                                        value={monthlyComputerAssignment.alternateAnchorDate ?? getTodayDateString()}
                                        disabled={disabled}
                                        onChange={(e) => setMonthlyAlternateAnchorDate?.(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        sx={{ maxWidth: 260 }}
                                        fullWidth
                                    />
                                    <FormControlLabel
                                        control={(
                                            <Checkbox
                                                checked={!!monthlyComputerAssignment.mondayAllActive}
                                                disabled={disabled}
                                                onChange={(e) => setMonthlyMondayAllActive?.(e.target.checked)}
                                            />
                                        )}
                                        label="Poniedziałek aktywny dla wszystkich"
                                    />
                                </Stack>
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                                    Poniedziałek nie resetuje ani nie przesuwa cyklu A/B lub A/B/C. Tryb „Wyłączona codziennie” pozostaje wyłączony.
                                </Typography>
                                <Paper variant="outlined" sx={{ overflow: "hidden" }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700 }}>Osoba</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Tryb</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {targetIdsAll.map((id) => {
                                                const mode = monthlyComputerAssignment.targetSchedules?.[id]?.mode ?? "always";
                                                return (
                                                    <TableRow key={id} hover>
                                                        <TableCell>
                                                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                                                <Typography sx={{ fontWeight: 600 }}>{targetNames[id] || `Status ${id}`}</Typography>
                                                                <Chip size="small" variant="outlined" label={`ID: ${id}`} />
                                                            </Stack>
                                                        </TableCell>
                                                        <TableCell>
                                                            <FormControl size="small" fullWidth>
                                                                <InputLabel>Tryb</InputLabel>
                                                                <Select
                                                                    label="Tryb"
                                                                    value={mode}
                                                                    disabled={disabled || !selectedTargetIds.includes(id)}
                                                                    onChange={(e) => setMonthlyTargetScheduleMode?.(id, e.target.value as MonthlyComputerTargetScheduleMode)}
                                                                >
                                                                    <MenuItem value="always">Włączona codziennie</MenuItem>
                                                                    <MenuItem value="off">Wyłączona codziennie</MenuItem>
                                                                    <MenuItem value="alternate_a">Naprzemiennie A</MenuItem>
                                                                    <MenuItem value="alternate_b">Naprzemiennie B</MenuItem>
                                                                    <MenuItem value="alternate_c">Naprzemiennie C</MenuItem>
                                                                </Select>
                                                            </FormControl>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </Paper>

                                <Divider sx={{ my: 1.5 }} />

                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} justifyContent="space-between">
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                        Zestawienie miesięczne
                                    </Typography>
                                    <TextField
                                        type="month"
                                        size="small"
                                        label="Miesiąc"
                                        value={monthlyStatsMonth}
                                        onChange={(e) => setSelectedMonth?.(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Stack>

                                <Paper variant="outlined" sx={{ mt: 1, overflow: "hidden" }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700 }}>Osoba</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }} align="right">Auto</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }} align="center">Ręcznie</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }} align="right">Razem</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {targetIdsAll.map((id) => {
                                                const count = monthlyCounts[id] ?? { auto: 0, manual: 0 };
                                                const auto = Number(count.auto) || 0;
                                                const manual = Number(count.manual) || 0;
                                                return (
                                                    <TableRow key={id} hover>
                                                        <TableCell>
                                                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                                                <Typography sx={{ fontWeight: 600 }}>{targetNames[id] || `Status ${id}`}</Typography>
                                                                <Chip size="small" variant="outlined" label={`ID: ${id}`} />
                                                            </Stack>
                                                        </TableCell>
                                                        <TableCell align="right">{auto}</TableCell>
                                                        <TableCell align="right" sx={{ minWidth: 180 }}>
                                                            <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    disabled={disabled || !canEditManualMonth}
                                                                    onClick={() => adjustMonthlyManualCount?.(id, monthlyStatsMonth, -1)}
                                                                >
                                                                    -1
                                                                </Button>
                                                                <TextField
                                                                    size="small"
                                                                    type="number"
                                                                    value={manual}
                                                                    disabled={disabled || !canEditManualMonth}
                                                                    onChange={(e) => setMonthlyManualCount?.(id, monthlyStatsMonth, Number(e.target.value) || 0)}
                                                                    inputProps={{ style: { textAlign: "right" } }}
                                                                    sx={{ width: 80 }}
                                                                />
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    disabled={disabled || !canEditManualMonth}
                                                                    onClick={() => adjustMonthlyManualCount?.(id, monthlyStatsMonth, 1)}
                                                                >
                                                                    +1
                                                                </Button>
                                                            </Stack>
                                                        </TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 700 }}>{auto + manual}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </Paper>

                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                                    Zamówienie zwiększa licznik o liczbę komputerów w pozycjach. SKU zaczynające się od MAR lub IMAC liczą się pojedynczo, a ZKPC podwójnie. Ręczna korekta działa tylko dla aktualnego miesiąca.
                                </Typography>
                            </Paper>
                        </Box>
                    )}

                    {/* Limit dużego zamówienia */}
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                            Limit dużego zamówienia
                        </Typography>

                        <TextField
                            size="small"
                            type="number"
                            label={maxLargeLabel}
                            value={maxLarge}
                            disabled={disabled}
                            onChange={(e) => setMaxLarge(Number(e.target.value) || 0)}
                            inputProps={{ min: 0 }}
                            fullWidth
                            helperText="Zamówienia przekraczające ten limit nie będą automatycznie przerzucane."
                        />
                    </Box>

                    {/* Priorytety metod dostawy */}
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                            Priorytet metod dostawy
                        </Typography>

                        <Paper
                            variant="outlined"
                            sx={{ p: 1, opacity: disabled ? 0.6 : 1 }}
                        >
                            {methods.length ? (
                                <List dense disablePadding>
                                    {methods.map((m, idx) => (
                                        <ListItem
                                            key={`${m}-${idx}`}
                                            divider={idx !== methods.length - 1}
                                            secondaryAction={
                                                <Stack direction="row" spacing={0.5}>
                                                    <Tooltip title="W górę">
                                                        <span>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => moveUp(idx)}
                                                                disabled={disabled || idx === 0}
                                                            >
                                                                ↑
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>

                                                    <Tooltip title="W dół">
                                                        <span>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => moveDown(idx)}
                                                                disabled={disabled || idx === methods.length - 1}
                                                            >
                                                                ↓

                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>

                                                    <Tooltip title="Usuń">
                                                        <span>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => removeMethod(idx)}
                                                                disabled={disabled}
                                                            >
                                                                x
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>
                                                </Stack>
                                            }
                                        >
                                            <ListItemText
                                                primary={
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Chip
                                                            size="small"
                                                            label={`#${idx + 1}`}
                                                            variant="outlined"
                                                        />
                                                        <Typography sx={{ fontWeight: 600 }}>{m}</Typography>
                                                    </Stack>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography variant="body2" sx={{ px: 1, py: 1, color: "text.secondary" }}>
                                    Brak zdefiniowanych metod. Dodaj je poniżej (pamiętaj o pozycji <b>Niezmapowane</b>).
                                </Typography>
                            )}

                            <Divider sx={{ my: 1 }} />

                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                <TextField
                                    size="small"
                                    label="Dodaj metodę"
                                    value={newMethod}
                                    disabled={disabled}
                                    onChange={(e) => setNewMethod(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") addMethod();
                                    }}
                                    fullWidth
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <Tooltip title="Dodaj">
                                                    <span>
                                                        <IconButton
                                                            size="small"
                                                            onClick={addMethod}
                                                            disabled={disabled}
                                                        >
                                                            +
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Stack>
                        </Paper>
                    </Box>

                    {/* Akcje */}
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => onAssign()}
                            disabled={disabled || loadingAssign}
                            startIcon={loadingAssign ? <CircularProgress size={18} /> : undefined}
                            fullWidth
                        >
                            {loadingAssign ? "Przydzielam..." : "Przydziel zamówienia"}
                        </Button>
                    </Stack>

                    <OrdersTable rows={orders} />
                </Stack>
            </CardContent>
        </Card>
    );
};

const ApiloOrdersPanel: React.FC<OrdersPanelProps> = ({ authToken }) => {
    // line1 schedule
    const [line1SchedEnabled, setLine1SchedEnabled] = useState(false);
    const [line1EnableAt, setLine1EnableAt] = useState("08:00");
    const [line1DisableAt, setLine1DisableAt] = useState("16:00");
    const [line1WeekendOnly, setLine1WeekendOnly] = useState(false);
    const [line1RotationEnabled, setLine1RotationEnabled] = useState(false);
    const [line1RotationParticipants, setLine1RotationParticipants] = useState<number[]>([]);
    const [line1RotationDays, setLine1RotationDays] = useState<Record<RotationDayKey, RotationDayConfig>>(createDefaultRotationDays());
    const [line1RotationCycleAnchorDate, setLine1RotationCycleAnchorDate] = useState(getTodayDateString());
    const [line1MonthlyComputerAssignment, setLine1MonthlyComputerAssignment] = useState<MonthlyComputerAssignment>(
        createDefaultMonthlyComputerAssignment([159, 156, 228]),
    );
    const [line1SelectedMonth, setLine1SelectedMonth] = useState(getCurrentMonthString());

    // line2 schedule
    const [line2SchedEnabled, setLine2SchedEnabled] = useState(false);
    const [line2EnableAt, setLine2EnableAt] = useState("08:00");
    const [line2DisableAt, setLine2DisableAt] = useState("16:00");
    const [line2WeekendOnly, setLine2WeekendOnly] = useState(false);


    // L1
    const [line1Active, setLine1Active] = useState(true);
    const [line1SourceStatusId, setLine1SourceStatusId] = useState(63);
    const [line1TargetStatusIds, setLine1TargetStatusIds] = useState<number[]>([159, 156, 228]);
    const [line1TargetLimits, setLine1TargetLimits] = useState<LimitsMap>({ 159: 2, 156: 2, 228: 2 });
    const [line1MaxLarge, setLine1MaxLarge] = useState(9);
    const [line1Methods, setLine1Methods] = useState<string[]>([]);
    const [newMethod1, setNewMethod1] = useState("");

    // L2
    const [line2Active, setLine2Active] = useState(false);
    const [line2SourceStatusId, setLine2SourceStatusId] = useState(60);
    const [line2TargetStatusIds, setLine2TargetStatusIds] = useState<number[]>([170, 173, 176, 179, 207, 182, 211]);
    const [line2TargetLimits, setLine2TargetLimits] = useState<LimitsMap>({
        170: 2, 173: 2, 176: 2, 179: 2, 207: 2, 182: 2, 211: 2
    });
    const [line2MaxLarge, setLine2MaxLarge] = useState(9);
    const [line2Methods, setLine2Methods] = useState<string[]>([]);
    const [newMethod2, setNewMethod2] = useState("");

    // Wyniki / loading
    const [line1Orders, setLine1Orders] = useState<OrderRow[]>([]);
    const [line2Orders, setLine2Orders] = useState<OrderRow[]>([]);
    const [loadingSave, setLoadingSave] = useState(false);
    const [loading1, setLoading1] = useState(false);
    const [loading2, setLoading2] = useState(false);

    const line1Names: Record<number, string> = useMemo(() => ({
        159: "Mateusz Sabała",
        156: "Dariusz Sikora",
        228: "Mateusz Jania",
    }), []);

    const line2Names: Record<number, string> = useMemo(() => ({
        170: "Bartek Irzyk Serwis",
        173: "Andrzej Klimala Serwis",
        176: "Hubert Przetocki Serwis",
        179: "Kamil Rucki Serwis",
        207: "Krzysztof Ulman Serwis",
        182: "Kamil Spyrka Serwis",
        211: "Alan Janosz Serwis",
    }), []);

    const line1TargetsAll = useMemo(() => [159, 156, 228], []);
    const line2TargetsAll = useMemo(() => [170, 173, 176, 179, 207, 182, 211], []);
    const [serverSnapshot, setServerSnapshot] = useState<any | null>(null);
    const [serverRevision, setServerRevision] = useState<number | null>(null);

    const touchLine1RotationAnchor = () => {
        setLine1RotationCycleAnchorDate(getTodayDateString());
    };

    const getNormalizedLine1RotationParticipants = (targetIds: number[], tabRotation: any) => {
        const rotationOrder = Array.isArray(tabRotation?.order)
            ? tabRotation.order.map((x: any) => Number(x)).filter((x: number) => !Number.isNaN(x))
            : [];
        const fallbackParticipants = rotationOrder.length ? rotationOrder : targetIds;
        const participants = Array.isArray(tabRotation?.participantIds)
            ? tabRotation.participantIds
                .map((x: any) => Number(x))
                .filter((x: number) => !Number.isNaN(x) && targetIds.includes(x))
            : fallbackParticipants.filter((id: number) => targetIds.includes(id));

        return line1TargetsAll.filter((id) => participants.includes(id));
    };

    const updateLine1RotationParticipants = (ids: number[]) => {
        touchLine1RotationAnchor();
        setLine1RotationParticipants(
            line1TargetsAll.filter((id) => line1TargetStatusIds.includes(id) && ids.includes(id)),
        );
    };

    const updateLine1RotationDay = (day: RotationDayKey, patch: Partial<RotationDayConfig>) => {
        touchLine1RotationAnchor();
        setLine1RotationDays((prev) => ({
            ...prev,
            [day]: {
                ...prev[day],
                ...patch,
            },
        }));
    };

    const setLine1MonthlyTargetScheduleMode = (statusId: number, mode: MonthlyComputerTargetScheduleMode) => {
        setLine1MonthlyComputerAssignment((prev) => {
            return {
                ...prev,
                targetSchedules: {
                    ...(prev.targetSchedules ?? {}),
                    [statusId]: { mode },
                },
            };
        });
    };

    const setLine1MonthlyAlternateAnchorDate = (date: string) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
        setLine1MonthlyComputerAssignment((prev) => ({
            ...prev,
            alternateAnchorDate: date,
        }));
    };

    const setLine1MonthlyMondayAllActive = (enabled: boolean) => {
        setLine1MonthlyComputerAssignment((prev) => ({
            ...prev,
            mondayAllActive: enabled,
        }));
    };

    const setLine1MonthlyManualCount = (statusId: number, month: string, value: number) => {
        setLine1MonthlyComputerAssignment((prev) => {
            const monthCounts = prev.monthlyCounts[month] ?? {};
            const current = monthCounts[statusId] ?? { auto: 0, manual: 0 };
            return {
                ...prev,
                monthlyCounts: {
                    ...prev.monthlyCounts,
                    [month]: {
                        ...monthCounts,
                        [statusId]: {
                            auto: Number(current.auto) || 0,
                            manual: Number.isFinite(value) ? value : 0,
                        },
                    },
                },
            };
        });
    };

    const adjustLine1MonthlyManualCount = (statusId: number, month: string, delta: number) => {
        const current = line1MonthlyComputerAssignment.monthlyCounts[month]?.[statusId]?.manual ?? 0;
        setLine1MonthlyManualCount(statusId, month, current + delta);
    };

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await axios.get(`${API_URL}/apilo-settings`, {
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                const data = res.data;

                if (data?.line1 && data?.line2) {
                    const targetIds1: number[] = Array.isArray(data.line1.targetStatusIds)
                        ? data.line1.targetStatusIds.map((x: any) => Number(x)).filter((x: number) => !Number.isNaN(x))
                        : [];

                    setLine1SchedEnabled(!!data.line1?.autoSchedule?.enabled);
                    setLine1EnableAt(data.line1?.autoSchedule?.enableAt || "08:00");
                    setLine1DisableAt(data.line1?.autoSchedule?.disableAt || "16:00");
                    setLine1WeekendOnly(!!data.line1?.autoSchedule?.weekendOnly);
                    setLine1RotationEnabled(!!data.line1?.tabRotation?.enabled);
                    setLine1RotationParticipants(getNormalizedLine1RotationParticipants(targetIds1, data.line1?.tabRotation));
                    setLine1RotationDays(
                        normalizeRotationDays(
                            data.line1?.tabRotation?.days,
                            data.line1?.tabRotation,
                        ),
                    );
                    setLine1RotationCycleAnchorDate(
                        typeof data.line1?.tabRotation?.cycleAnchorDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data.line1.tabRotation.cycleAnchorDate)
                            ? data.line1.tabRotation.cycleAnchorDate
                            : getTodayDateString(),
                    );
                    setLine1MonthlyComputerAssignment(
                        normalizeMonthlyComputerAssignment(data.line1?.monthlyComputerAssignment, line1TargetsAll),
                    );

                    setLine2SchedEnabled(!!data.line2?.autoSchedule?.enabled);
                    setLine2EnableAt(data.line2?.autoSchedule?.enableAt || "08:00");
                    setLine2DisableAt(data.line2?.autoSchedule?.disableAt || "16:00");
                    setLine2WeekendOnly(!!data.line2?.autoSchedule?.weekendOnly);

                    // line1
                    setLine1Active(!!data.line1.active);
                    setLine1SourceStatusId(Number(data.line1.sourceStatusId) || 63);
                    setLine1TargetStatusIds(targetIds1);

                    const limits1: LimitsMap = {};
                    for (const id of line1TargetsAll) {
                        limits1[id] =
                            data.line1.targetLimits && data.line1.targetLimits[id] !== undefined
                                ? Number(data.line1.targetLimits[id])
                                : 2;
                    }
                    setLine1TargetLimits(limits1);

                    setLine1MaxLarge(Number(data.line1.maxLargeOrderItems) || 9);
                    setLine1Methods(Array.isArray(data.line1.deliveryMethodPriority) ? data.line1.deliveryMethodPriority.map(String) : []);

                    // line2
                    setLine2Active(!!data.line2.active);
                    setLine2SourceStatusId(Number(data.line2.sourceStatusId) || 60);

                    const targetIds2: number[] = Array.isArray(data.line2.targetStatusIds)
                        ? data.line2.targetStatusIds.map((x: any) => Number(x)).filter((x: number) => !Number.isNaN(x))
                        : [];
                    setLine2TargetStatusIds(targetIds2);

                    const limits2: LimitsMap = {};
                    for (const id of line2TargetsAll) {
                        limits2[id] =
                            data.line2.targetLimits && data.line2.targetLimits[id] !== undefined
                                ? Number(data.line2.targetLimits[id])
                                : 2;
                    }
                    setLine2TargetLimits(limits2);

                    setLine2MaxLarge(Number(data.line2.maxLargeOrderItems) || 9);
                    setLine2Methods(Array.isArray(data.line2.deliveryMethodPriority) ? data.line2.deliveryMethodPriority.map(String) : []);

                    setServerRevision(Number(data.revision));
                    setServerSnapshot({ line1: data.line1, line2: data.line2 });
                }
            } catch (err: any) {
                console.error("Błąd pobierania ustawień:", err.response?.data || err);
                toast.error("Błąd pobierania ustawień");
            }


        };

        if (authToken) fetchSettings();
    }, [authToken, line1TargetsAll, line2TargetsAll]);

    const buildCurrentSettings = () => ({
        line1: {
            active: line1Active,
            sourceStatusId: line1SourceStatusId,
            targetStatusIds: line1TargetStatusIds,
            targetLimits: line1TargetLimits,
            deliveryMethodPriority: line1Methods,
            maxLargeOrderItems: line1MaxLarge,
            autoSchedule: {
                enabled: line1SchedEnabled,
                enableAt: line1EnableAt,
                disableAt: line1DisableAt,
                timezone: "Europe/Warsaw",
                weekendOnly: line1WeekendOnly,
            },
            tabRotation: {
                enabled: line1RotationEnabled,
                timezone: "Europe/Warsaw",
                order: line1TargetsAll.filter((id) => line1TargetStatusIds.includes(id)),
                participantIds: line1TargetsAll.filter((id) => line1TargetStatusIds.includes(id) && line1RotationParticipants.includes(id)),
                cycleAnchorDate: line1RotationCycleAnchorDate,
                days: line1RotationDays,
                morningEnabledCount: line1RotationDays.monday.enabledCount,
                disableAt: line1RotationDays.monday.disableAt,
                weekdaysOnly: true,
            },
            monthlyComputerAssignment: line1MonthlyComputerAssignment,
        },
        line2: {
            active: line2Active,
            sourceStatusId: line2SourceStatusId,
            targetStatusIds: line2TargetStatusIds,
            targetLimits: line2TargetLimits,
            deliveryMethodPriority: line2Methods,
            maxLargeOrderItems: line2MaxLarge,
            autoSchedule: {
                enabled: line2SchedEnabled,
                enableAt: line2EnableAt,
                disableAt: line2DisableAt,
                timezone: "Europe/Warsaw",
                weekendOnly: line2WeekendOnly,
            },
        },
    });


    const saveSettings = async () => {
        try {
            if (!serverSnapshot || serverRevision === null) {
                toast.error("Brak danych z serwera – odśwież zakładkę i spróbuj ponownie.");
                return;
            }

            const current = buildCurrentSettings();
            const patch = deepDiff(serverSnapshot, current) ?? {};

            if (Object.keys(patch).length === 0) {
                toast.info("Brak zmian do zapisania.");
                return;
            }

            // próba zapisu na aktualnej revision (If-Match)
            const res = await axios.patch(`${API_URL}/apilo-settings`, patch, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    "If-Match": String(serverRevision),
                },
            });

            // sukces: aktualizuj snapshot i revision z odpowiedzi
            const saved = res.data;
            setServerRevision(Number(saved.revision));
            setServerSnapshot({ line1: saved.line1, line2: saved.line2 });
            toast.success("Zapisano tylko wprowadzone zmiany");
        } catch (err: any) {
            // konflikt wersji (ktoś zapisał w międzyczasie)
            if (err?.response?.status === 409) {
                const latest = err.response.data; // zwracamy aktualne line1/line2 + revision
                const latestRevision = Number(latest.currentRevision);
                const latestSettings = { line1: latest.line1, line2: latest.line2 };

                // wykryj konflikt na polach:
                const current = buildCurrentSettings();
                const userPatch = deepDiff(serverSnapshot, current) ?? {};
                const serverPatch = deepDiff(serverSnapshot, latestSettings) ?? {};

                const userPaths = new Set(collectPaths(userPatch));
                const serverPaths = new Set(collectPaths(serverPatch));
                const conflicts = [...userPaths].filter((p) => serverPaths.has(p));

                if (conflicts.length === 0) {
                    // wysyłamy WYŁĄCZNIE to co user zmienił (userPatch),
                    // dzięki temu nie cofamy cudzych zmian (np. limitów)
                    const res2 = await axios.patch(`${API_URL}/apilo-settings`, userPatch, {
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                            "If-Match": String(latestRevision),
                        },
                    });

                    const saved2 = res2.data;

                    // opcjonalnie: ustaw UI na najnowsze dane z serwera, żeby nie widzieć "starych limitów"
                    setLine1SchedEnabled(!!saved2.line1?.autoSchedule?.enabled);
                    setLine1EnableAt(saved2.line1?.autoSchedule?.enableAt || "08:00");
                    setLine1DisableAt(saved2.line1?.autoSchedule?.disableAt || "16:00");
                    setLine1WeekendOnly(!!saved2.line1?.autoSchedule?.weekendOnly);
                    setLine1RotationEnabled(!!saved2.line1?.tabRotation?.enabled);
                    setLine1RotationParticipants(
                        getNormalizedLine1RotationParticipants(
                            Array.isArray(saved2.line1?.targetStatusIds) ? saved2.line1.targetStatusIds.map(Number) : [],
                            saved2.line1?.tabRotation,
                        ),
                    );
                    setLine1RotationDays(normalizeRotationDays(saved2.line1?.tabRotation?.days, saved2.line1?.tabRotation));
                    setLine1RotationCycleAnchorDate(
                        typeof saved2.line1?.tabRotation?.cycleAnchorDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(saved2.line1.tabRotation.cycleAnchorDate)
                            ? saved2.line1.tabRotation.cycleAnchorDate
                            : getTodayDateString(),
                    );
                    setLine1MonthlyComputerAssignment(
                        normalizeMonthlyComputerAssignment(saved2.line1?.monthlyComputerAssignment, line1TargetsAll),
                    );

                    setLine2SchedEnabled(!!saved2.line2?.autoSchedule?.enabled);
                    setLine2EnableAt(saved2.line2?.autoSchedule?.enableAt || "08:00");
                    setLine2DisableAt(saved2.line2?.autoSchedule?.disableAt || "16:00");
                    setLine2WeekendOnly(!!saved2.line2?.autoSchedule?.weekendOnly);

                    setLine1Active(!!saved2.line1.active);
                    setLine1SourceStatusId(Number(saved2.line1.sourceStatusId) || 63);
                    setLine1TargetStatusIds(Array.isArray(saved2.line1.targetStatusIds) ? saved2.line1.targetStatusIds.map(Number) : []);
                    setLine1TargetLimits(saved2.line1.targetLimits || {});
                    setLine1MaxLarge(Number(saved2.line1.maxLargeOrderItems) || 9);
                    setLine1Methods(Array.isArray(saved2.line1.deliveryMethodPriority) ? saved2.line1.deliveryMethodPriority.map(String) : []);

                    setLine2Active(!!saved2.line2.active);
                    setLine2SourceStatusId(Number(saved2.line2.sourceStatusId) || 60);
                    setLine2TargetStatusIds(Array.isArray(saved2.line2.targetStatusIds) ? saved2.line2.targetStatusIds.map(Number) : []);
                    setLine2TargetLimits(saved2.line2.targetLimits || {});
                    setLine2MaxLarge(Number(saved2.line2.maxLargeOrderItems) || 9);
                    setLine2Methods(Array.isArray(saved2.line2.deliveryMethodPriority) ? saved2.line2.deliveryMethodPriority.map(String) : []);

                    // zawsze update snapshot+revision
                    setServerRevision(Number(saved2.revision));
                    setServerSnapshot({ line1: saved2.line1, line2: saved2.line2 });

                    toast.success("Wykryto zmianę na serwerze, ale zapisano Twoje zmiany bez nadpisywania innych");
                    return;
                }


                // konflikt na tych samych polach -> nie zapisujemy automatycznie
                toast.error(
                    `Ktoś zmienił ustawienia w międzyczasie. Konflikt pól: ${conflicts.slice(0, 5).join(", ")}${conflicts.length > 5 ? "..." : ""
                    }. Odśwież ustawienia i spróbuj ponownie.`
                );

                return;
            }

            console.error("Błąd zapisu ustawień:", err.response?.data || err);
            toast.error("Błąd zapisu: " + JSON.stringify(err.response?.data || err));
        }
    };


    const toggleLine1Target = (id: number, checked: boolean) => {
        touchLine1RotationAnchor();
        setLine1TargetStatusIds((prev) => {
            const next = checked ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((x) => x !== id);
            if (!checked) {
                setLine1RotationParticipants((current) => current.filter((entry) => entry !== id));
                setLine1MonthlyComputerAssignment((current) => ({
                    ...current,
                    targetSchedules: Object.fromEntries(
                        Object.entries(current.targetSchedules ?? {}).filter(([key]) => Number(key) !== id),
                    ) as Record<number, MonthlyComputerTargetSchedule>,
                    weekdayTargets: ROTATION_DAYS.reduce((acc, { key }) => {
                        acc[key] = (current.weekdayTargets[key] ?? []).filter((entry) => entry !== id);
                        return acc;
                    }, {} as Record<RotationDayKey, number[]>),
                }));
            } else {
                setLine1MonthlyComputerAssignment((current) => ({
                    ...current,
                    targetSchedules: {
                        ...(current.targetSchedules ?? {}),
                        [id]: current.targetSchedules?.[id] ?? { mode: "always" },
                    },
                    weekdayTargets: ROTATION_DAYS.reduce((acc, { key }) => {
                        const dayTargets = current.weekdayTargets[key] ?? [];
                        acc[key] = key === "saturday" || key === "sunday" || dayTargets.includes(id)
                            ? dayTargets
                            : [...dayTargets, id];
                        return acc;
                    }, {} as Record<RotationDayKey, number[]>),
                }));
            }
            return next;
        });
    };
    const changeLine1Limit = (id: number, value: string) => {
        const num = Number(value);
        setLine1TargetLimits((prev) => ({ ...prev, [id]: Number.isNaN(num) ? prev[id] : num }));
    };

    const toggleLine2Target = (id: number, checked: boolean) => {
        setLine2TargetStatusIds((prev) => (checked ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((x) => x !== id)));
    };
    const changeLine2Limit = (id: number, value: string) => {
        const num = Number(value);
        setLine2TargetLimits((prev) => ({ ...prev, [id]: Number.isNaN(num) ? prev[id] : num }));
    };

    const handleAssignLine1 = async () => {
        setLoading1(true);
        try {
            const res = await axios.get(`${API_URL}/apilo-orders/assign-line1`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setLine1Orders(res.data.orders || []);
            if (res.data.settings?.line1 && res.data.settings?.line2) {
                setLine1MonthlyComputerAssignment(
                    normalizeMonthlyComputerAssignment(res.data.settings.line1.monthlyComputerAssignment, line1TargetsAll),
                );
                setServerRevision(Number(res.data.settings.revision));
                setServerSnapshot({ line1: res.data.settings.line1, line2: res.data.settings.line2 });
            }
            toast.success("Linia 1: przydział wykonany");
        } catch (err: any) {
            console.error("Błąd przydziału zamówień (linia 1):", err.response?.data || err);
            toast.error(JSON.stringify(err.response?.data || err));
        } finally {
            setLoading1(false);
        }
    };

    const handleAssignLine2 = async () => {
        setLoading2(true);
        try {
            const res = await axios.get(`${API_URL}/apilo-orders/assign-line2`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setLine2Orders(res.data.orders || []);
            toast.success("Linia 2: przydział wykonany");
        } catch (err: any) {
            console.error("Błąd przydziału zamówień (linia 2):", err.response?.data || err);
            toast.error(JSON.stringify(err.response?.data || err));
        } finally {
            setLoading2(false);
        }
    };


    return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
            <Stack spacing={2}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} justifyContent="space-between">
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 900 }}>
                                Panel przydzielania zamówień
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Po wprowadzeniu zmian w konfiguracji należy kliknąć to gówno
                            </Typography>
                        </Box>

                        <Button
                            variant="contained"
                            onClick={saveSettings}
                            disabled={loadingSave}
                            startIcon={loadingSave ? <CircularProgress size={18} /> : undefined}

                        >
                            {loadingSave ? "Zapisuję..." : "Zapisz ustawienia"}
                        </Button>
                    </Stack>
                </Paper>

                <Grid sx={{ width: '100%' }} container spacing={2}>
                    <Grid item xs={12} md={6} sx={{ paddingLeft: '0px !important' }}>
                        <LineCard
                            title="Przydzielanie komputerów"
                            subtitle="Linia 1"
                            active={line1Active}
                            setActive={setLine1Active}
                            targetIdsAll={line1TargetsAll}
                            targetNames={line1Names}
                            selectedTargetIds={line1TargetStatusIds}
                            toggleTarget={toggleLine1Target}
                            limits={line1TargetLimits}
                            setLimit={changeLine1Limit}
                            maxLargeLabel="Limit dużego zamówienia (komputery)"
                            maxLarge={line1MaxLarge}
                            setMaxLarge={setLine1MaxLarge}
                            methods={line1Methods}
                            setMethods={setLine1Methods}
                            newMethod={newMethod1}
                            setNewMethod={setNewMethod1}
                            onAssign={handleAssignLine1}
                            loadingAssign={loading1}
                            orders={line1Orders}
                            scheduleEnabled={line1SchedEnabled}
                            setScheduleEnabled={setLine1SchedEnabled}
                            weekendOnly={line1WeekendOnly}
                            setWeekendOnly={setLine1WeekendOnly}
                            enableAt={line1EnableAt}
                            setEnableAt={setLine1EnableAt}
                            disableAt={line1DisableAt}
                            setDisableAt={setLine1DisableAt}
                            rotationEnabled={line1RotationEnabled}
                            setRotationEnabled={setLine1RotationEnabled}
                            rotationParticipants={line1RotationParticipants}
                            setRotationParticipants={updateLine1RotationParticipants}
                            rotationDays={line1RotationDays}
                            setRotationDayMode={(day, value) => updateLine1RotationDay(day, { mode: value })}
                            setRotationDayEnabledCount={(day, value) => updateLine1RotationDay(day, { enabledCount: Math.max(0, value) })}
                            setRotationDayDisableAt={(day, value) => updateLine1RotationDay(day, { disableAt: value })}
                            rotationOrderLabel={line1TargetsAll.filter((id) => line1RotationParticipants.includes(id)).map((id) => line1Names[id]).join(" → ")}
                            rotationMaxCount={line1TargetStatusIds.length}
                            monthlyComputerAssignment={line1MonthlyComputerAssignment}
                            selectedMonth={line1SelectedMonth}
                            currentMonth={getCurrentMonthString()}
                            setSelectedMonth={setLine1SelectedMonth}
                            setMonthlyManualCount={setLine1MonthlyManualCount}
                            adjustMonthlyManualCount={adjustLine1MonthlyManualCount}
                            setMonthlyTargetScheduleMode={setLine1MonthlyTargetScheduleMode}
                            setMonthlyAlternateAnchorDate={setLine1MonthlyAlternateAnchorDate}
                            setMonthlyMondayAllActive={setLine1MonthlyMondayAllActive}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <LineCard
                            title="Przydzielanie laptopów"
                            subtitle="Linia 2"
                            active={line2Active}
                            setActive={setLine2Active}
                            targetIdsAll={line2TargetsAll}
                            targetNames={line2Names}
                            selectedTargetIds={line2TargetStatusIds}
                            toggleTarget={toggleLine2Target}
                            limits={line2TargetLimits}
                            setLimit={changeLine2Limit}
                            maxLargeLabel="Limit dużego zamówienia (laptopy)"
                            maxLarge={line2MaxLarge}
                            setMaxLarge={setLine2MaxLarge}
                            methods={line2Methods}
                            setMethods={setLine2Methods}
                            newMethod={newMethod2}
                            setNewMethod={setNewMethod2}
                            onAssign={handleAssignLine2}
                            loadingAssign={loading2}
                            orders={line2Orders}
                            scheduleEnabled={line2SchedEnabled}
                            setScheduleEnabled={setLine2SchedEnabled}
                            weekendOnly={line2WeekendOnly}
                            setWeekendOnly={setLine2WeekendOnly}
                            enableAt={line2EnableAt}
                            setEnableAt={setLine2EnableAt}
                            disableAt={line2DisableAt}
                            setDisableAt={setLine2DisableAt}
                        />
                    </Grid>
                </Grid>
            </Stack>
        </Container>
    );
};

export default ApiloOrdersPanel;
