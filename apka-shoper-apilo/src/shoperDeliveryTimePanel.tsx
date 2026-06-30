import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
    Autocomplete,
    Box,
    Button,
    Checkbox,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from "@mui/material";
import { API_URL } from "./config";

type ShoperDeliveryTimePanelProps = {
    authToken: string;
};

type CategoryResource = {
    category_id: number;
    name?: string;
    translation?: {
        name?: string;
        items?: string | number;
    };
    translations?: {
        pl_PL?: {
            name?: string;
            items?: string | number;
        };
    };
};

type DeliveryResource = {
    id?: number;
    delivery_id?: number;
    name?: string;
    duration?: string | { value?: string };
    translations?: {
        pl_PL?: {
            name?: string;
        };
    };
};

type WeekdayKey = "0" | "1" | "2" | "3" | "4" | "5" | "6";
type Schedule = Record<WeekdayKey, string>;
type DeliveryUpdateJob = {
    jobId: string;
    status: "running" | "completed" | "failed";
    categoryIds?: number[];
    currentCategoryId?: number;
    phase?: "fetching-products" | "updating-products" | "completed";
    source?: "rest-category-tree" | "storefront-category";
    currentPage: number;
    totalPages: number | null;
    scannedCount: number;
    matchedCount: number;
    skippedOutOfStockCount?: number;
    updatedCount: number;
    failedCount: number;
    categoryResults?: Array<{
        categoryId: number;
        status: "completed" | "failed";
        source?: "rest-category-tree" | "storefront-category";
        scannedCount: number;
        matchedCount: number;
        skippedOutOfStockCount: number;
        updatedCount: number;
        failedCount: number;
        error?: unknown;
    }>;
    failed?: unknown[];
    error?: unknown;
};

type ShoperDeliverySettings = {
    revision: number;
    updatedAt: string;
    enabled: boolean;
    categoryId?: number | null;
    categoryIds?: number[];
    schedule: Schedule;
    autoRun: {
        enabled: boolean;
        runAt: string;
        timezone: string;
        lastRunDate?: string;
        lastJobId?: string;
        lastStatus?: "started" | "completed" | "failed";
        lastFinishedAt?: string;
    };
    includeInactive: boolean;
    onlyInStock: boolean;
};

const WEEKDAYS: Array<{ key: WeekdayKey; label: string }> = [
    { key: "1", label: "Poniedziałek" },
    { key: "2", label: "Wtorek" },
    { key: "3", label: "Środa" },
    { key: "4", label: "Czwartek" },
    { key: "5", label: "Piątek" },
    { key: "6", label: "Sobota" },
    { key: "0", label: "Niedziela" },
];

const CATEGORY_GROUP_IDS = [311, 29, 140, 141, 334, 187, 188, 264];

const defaultSchedule: Schedule = {
    "0": "2",
    "1": "2",
    "2": "1",
    "3": "1",
    "4": "1",
    "5": "1",
    "6": "1",
};

const getDeliveryId = (delivery: DeliveryResource) => Number(delivery.delivery_id ?? delivery.id ?? 0);

const getDeliveryName = (delivery: DeliveryResource) => {
    const id = getDeliveryId(delivery);
    const name = delivery.translations?.pl_PL?.name ?? delivery.name ?? `ID ${id}`;
    const duration = typeof delivery.duration === "string" ? delivery.duration : delivery.duration?.value;
    return duration ? `${name} (${duration})` : name;
};

const getCategoryName = (category: CategoryResource) =>
    category.translations?.pl_PL?.name ??
    category.translation?.name ??
    category.name ??
    `Kategoria ${category.category_id}`;

const getCategoryItems = (category: CategoryResource) =>
    category.translations?.pl_PL?.items ?? category.translation?.items;

const normalizeList = <T,>(payload: unknown): T[] => {
    if (Array.isArray(payload)) return payload as T[];
    if (payload && typeof payload === "object" && Array.isArray((payload as any).list)) {
        return (payload as any).list as T[];
    }
    return [];
};

const fieldSx = {
    "& .MuiInputBase-root": {
        backgroundColor: "#f7f8fb",
        color: "#111827",
    },
    "& .MuiInputLabel-root": {
        color: "#4b5563",
    },
    "& .MuiInputLabel-root.Mui-focused": {
        color: "#1976d2",
    },
    "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "#cbd5e1",
    },
    "& .MuiSvgIcon-root": {
        color: "#111827",
    },
    "& input": {
        color: "#111827",
    },
};

const menuProps = {
    PaperProps: {
        sx: {
            backgroundColor: "#ffffff",
            color: "#111827",
        },
    },
};

function ShoperDeliveryTimePanel({ authToken }: ShoperDeliveryTimePanelProps) {
    const [categories, setCategories] = useState<CategoryResource[]>([]);
    const [deliveryTimes, setDeliveryTimes] = useState<DeliveryResource[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<CategoryResource[]>([]);
    const [schedule, setSchedule] = useState<Schedule>(defaultSchedule);
    const [selectedDay, setSelectedDay] = useState<WeekdayKey>(String(new Date().getDay()) as WeekdayKey);
    const [settingsEnabled, setSettingsEnabled] = useState(false);
    const [autoRunEnabled, setAutoRunEnabled] = useState(false);
    const [autoRunAt, setAutoRunAt] = useState("07:00");
    const [lastAutoRun, setLastAutoRun] = useState<ShoperDeliverySettings["autoRun"] | null>(null);
    const [serverRevision, setServerRevision] = useState<number | null>(null);
    const [includeInactive, setIncludeInactive] = useState(false);
    const [onlyInStock, setOnlyInStock] = useState(true);
    const [loadingSettings, setLoadingSettings] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [loadingDeliveries, setLoadingDeliveries] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeJobId, setActiveJobId] = useState<string | null>(null);
    const [result, setResult] = useState<DeliveryUpdateJob | null>(null);

    const todayKey = String(new Date().getDay()) as WeekdayKey;
    const selectedDeliveryId = schedule[selectedDay];
    const selectedDelivery = useMemo(
        () => deliveryTimes.find((delivery) => String(getDeliveryId(delivery)) === selectedDeliveryId),
        [deliveryTimes, selectedDeliveryId],
    );
    const todayDeliveryId = schedule[todayKey];
    const todayDelivery = useMemo(
        () => deliveryTimes.find((delivery) => String(getDeliveryId(delivery)) === todayDeliveryId),
        [deliveryTimes, todayDeliveryId],
    );
    useEffect(() => {
        handleGetSettings();
        handleGetCategories();
        handleGetDeliveryTimes();
    }, []);

    useEffect(() => {
        if (!selectedCategories.length || !categories.length) return;
        setSelectedCategories((current) =>
            current.map((selected) => {
                const matchingCategory = categories.find((category) => category.category_id === selected.category_id);
                return matchingCategory ?? selected;
            }),
        );
    }, [categories, selectedCategories.length]);

    useEffect(() => {
        if (!activeJobId) return;

        const pollJob = async () => {
            try {
                const response = await axios.get<DeliveryUpdateJob>(
                    `${API_URL}/product/shoper-delivery-time/jobs/${activeJobId}`,
                    { headers: authHeaders },
                );
                setResult(response.data);

                if (response.data.status === "completed") {
                    setSaving(false);
                    setActiveJobId(null);
                    toast.success(`Zakończono aktualizację. Zmieniono ${response.data.updatedCount ?? 0} produktów.`);
                }

                if (response.data.status === "failed") {
                    setSaving(false);
                    setActiveJobId(null);
                    toast.error("Zadanie aktualizacji zakończyło się błędem.");
                }
            } catch (error) {
                setSaving(false);
                setActiveJobId(null);
                console.error("Błąd sprawdzania statusu aktualizacji:", error);
                toast.error("Nie udało się sprawdzić statusu aktualizacji.");
            }
        };

        pollJob();
        const intervalId = window.setInterval(pollJob, 3000);
        return () => window.clearInterval(intervalId);
    }, [activeJobId]);

    const authHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
    };

    const applySettings = (settings: ShoperDeliverySettings) => {
        setServerRevision(Number(settings.revision));
        setSettingsEnabled(!!settings.enabled);
        setAutoRunEnabled(!!settings.autoRun?.enabled);
        setAutoRunAt(settings.autoRun?.runAt || "07:00");
        setLastAutoRun(settings.autoRun ?? null);
        setIncludeInactive(!!settings.includeInactive);
        setOnlyInStock(settings.onlyInStock !== false);
        setSchedule({ ...defaultSchedule, ...(settings.schedule ?? {}) });
        const ids = (settings.categoryIds?.length ? settings.categoryIds : settings.categoryId ? [settings.categoryId] : [])
            .map((entry) => Number(entry))
            .filter((entry) => Number.isFinite(entry) && entry > 0);
        setSelectedCategories(
            ids.map((categoryId) => {
                const matchingCategory = categories.find((category) => category.category_id === categoryId);
                return matchingCategory ?? {
                    category_id: categoryId,
                    translations: {
                        pl_PL: {
                            name: "Kategoria",
                        },
                    },
                };
            }),
        );
    };

    const handleGetSettings = async () => {
        setLoadingSettings(true);
        try {
            const response = await axios.get<ShoperDeliverySettings>(`${API_URL}/shoper-delivery-settings`, {
                headers: authHeaders,
            });
            applySettings(response.data);
        } catch (error) {
            console.error("Błąd pobierania ustawień czasu wysyłki:", error);
            toast.error("Nie udało się pobrać ustawień czasu wysyłki.");
        } finally {
            setLoadingSettings(false);
        }
    };

    const handleSaveSettings = async () => {
        if (serverRevision === null) {
            toast.error("Brak wersji ustawień z serwera. Odśwież ustawienia.");
            return;
        }

        setSavingSettings(true);
        try {
            const response = await axios.patch<ShoperDeliverySettings>(
                `${API_URL}/shoper-delivery-settings`,
                {
                    enabled: settingsEnabled,
                    categoryId: selectedCategories[0]?.category_id ?? null,
                    categoryIds: selectedCategories.map((category) => category.category_id),
                    schedule,
                    autoRun: {
                        enabled: autoRunEnabled,
                        runAt: autoRunAt,
                        timezone: "Europe/Warsaw",
                    },
                    includeInactive,
                    onlyInStock,
                },
                {
                    headers: {
                        ...authHeaders,
                        "If-Match": String(serverRevision),
                    },
                },
            );
            applySettings(response.data);
            toast.success("Zapisano ustawienia czasu wysyłki.");
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 409) {
                const latest = error.response.data?.settings;
                if (latest) {
                    applySettings(latest);
                }
                toast.error("Ustawienia zmieniły się na serwerze. Wczytałem aktualną wersję.");
            } else {
                console.error("Błąd zapisu ustawień czasu wysyłki:", error);
                toast.error("Nie udało się zapisać ustawień czasu wysyłki.");
            }
        } finally {
            setSavingSettings(false);
        }
    };

    const handleGetCategories = async () => {
        setLoadingCategories(true);
        try {
            let page = 1;
            let pages = 1;
            const allCategories: CategoryResource[] = [];

            do {
                const response = await axios.get<{ list: CategoryResource[]; pages: number }>(`${API_URL}/categories/shoper`, {
                    headers: authHeaders,
                    params: {
                        limit: 100,
                        page,
                        include: "translations",
                        filters: JSON.stringify({ "translations.pl_PL.active": 1 }),
                    },
                });
                allCategories.push(...normalizeList<CategoryResource>(response.data));
                pages = Number(response.data.pages ?? page) || page;
                page += 1;
            } while (page <= pages);

            setCategories(allCategories);
        } catch (error) {
            console.error("Błąd pobierania kategorii Shoper:", error);
            toast.error("Nie udało się pobrać kategorii Shoper.");
        } finally {
            setLoadingCategories(false);
        }
    };

    const handleGetDeliveryTimes = async () => {
        setLoadingDeliveries(true);
        try {
            const response = await axios.get(`${API_URL}/product/shoper-deliveries`, {
                headers: authHeaders,
            });
            const deliveries = normalizeList<DeliveryResource>(response.data).filter((delivery) => getDeliveryId(delivery) > 0);
            setDeliveryTimes(deliveries);
        } catch (error) {
            console.error("Błąd pobierania czasów wysyłki Shoper:", error);
            toast.error("Nie udało się pobrać czasów wysyłki Shoper. Możesz wpisać ID ręcznie.");
        } finally {
            setLoadingDeliveries(false);
        }
    };

    const handleScheduleChange = (day: WeekdayKey, deliveryId: string) => {
        setSchedule((current) => ({
            ...current,
            [day]: deliveryId,
        }));
    };

    const handleAddCategoryGroup = () => {
        setSelectedCategories((current) => {
            const byId = new Map(current.map((category) => [category.category_id, category]));
            for (const categoryId of CATEGORY_GROUP_IDS) {
                const matchingCategory = categories.find((category) => category.category_id === categoryId);
                byId.set(
                    categoryId,
                    matchingCategory ?? {
                        category_id: categoryId,
                        translations: {
                            pl_PL: {
                                name: "Kategoria",
                            },
                        },
                    },
                );
            }
            return [...byId.values()];
        });
    };

    const handleApply = async (day: WeekdayKey = selectedDay) => {
        const deliveryId = Number(schedule[day]);
        const categoryIds = selectedCategories.map((category) => category.category_id);
        if (!categoryIds.length) {
            toast.error("Dodaj przynajmniej jedną kategorię Shoper.");
            return;
        }
        if (!Number.isFinite(deliveryId) || deliveryId <= 0) {
            toast.error("Wybierz albo wpisz ID czasu wysyłki.");
            return;
        }

        setSaving(true);
        setResult(null);
        try {
            const response = await axios.post<DeliveryUpdateJob>(
                `${API_URL}/product/shoper-delivery-time/bulk-update`,
                {
                    categoryIds,
                    deliveryId,
                    includeInactive,
                    onlyInStock,
                    limit: 100,
                },
                { headers: authHeaders },
            );
            setResult(response.data);
            setActiveJobId(response.data.jobId);
            toast.info(`Uruchomiono aktualizację w tle dla ${categoryIds.length} kategorii.`);
        } catch (error) {
            setSaving(false);
            if (axios.isAxiosError(error)) {
                console.error("Błąd masowej aktualizacji czasu wysyłki:", error.response?.data || error.message);
                toast.error("Nie udało się zaktualizować czasu wysyłki.");
            } else {
                console.error("Błąd masowej aktualizacji czasu wysyłki:", error);
                toast.error("Nie udało się zaktualizować czasu wysyłki.");
            }
        }
    };

    return (
        <Box sx={{ maxWidth: 1180, margin: "0 auto", padding: { xs: 2, md: 3 }, color: "#f8fafc" }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#f8fafc" }}>
                    Czas wysyłki Shoper
                </Typography>
                <Typography sx={{ color: "#cbd5e1", mt: 0.5 }}>
                    Wybierz kategorię, ustaw harmonogram i zapisz go na backendzie, żeby działał bez otwartej aplikacji.
                </Typography>
            </Box>

            <Box
                sx={{
                    backgroundColor: "#232323",
                    border: "1px solid #3a3a3a",
                    borderRadius: "8px",
                    padding: { xs: 2, md: 3 },
                    mb: 3,
                }}
            >
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 280px" }, gap: 2, mb: 2 }}>
                    <Autocomplete
                        multiple
                        options={categories}
                        loading={loadingCategories}
                        value={selectedCategories}
                        onChange={(_, value) => setSelectedCategories(value)}
                        isOptionEqualToValue={(option, value) => option.category_id === value.category_id}
                        getOptionLabel={(option) => {
                            const items = getCategoryItems(option);
                            const suffix = items != null ? `, produkty: ${items}` : "";
                            return `${getCategoryName(option)} (${option.category_id}${suffix})`;
                        }}
                        slotProps={{
                            paper: {
                                sx: { backgroundColor: "#ffffff", color: "#111827" },
                            },
                        }}
                        renderInput={(params) => <TextField {...params} label="Kategorie Shoper" sx={fieldSx} />}
                    />

                    <FormControl fullWidth sx={fieldSx}>
                        <InputLabel>Dzień do ręcznej aktualizacji</InputLabel>
                        <Select
                            value={selectedDay}
                            label="Dzień do ręcznej aktualizacji"
                            onChange={(event) => setSelectedDay(event.target.value as WeekdayKey)}
                            MenuProps={menuProps}
                        >
                            {WEEKDAYS.map((day) => (
                                <MenuItem key={day.key} value={day.key}>
                                    {day.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 180px" },
                        gap: 1.5,
                        mt: 2,
                        alignItems: "center",
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#e5e7eb" }}>
                        <Checkbox
                            checked={settingsEnabled}
                            onChange={(event) => setSettingsEnabled(event.target.checked)}
                            sx={{ color: "#94a3b8", "&.Mui-checked": { color: "#2f80ed" } }}
                        />
                        <Typography>Harmonogram aktywny</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#e5e7eb" }}>
                        <Checkbox
                            checked={autoRunEnabled}
                            onChange={(event) => setAutoRunEnabled(event.target.checked)}
                            sx={{ color: "#94a3b8", "&.Mui-checked": { color: "#2f80ed" } }}
                        />
                        <Typography>Uruchamiaj automatycznie codziennie</Typography>
                    </Box>
                    <TextField
                        size="small"
                        label="Godzina crona"
                        type="time"
                        value={autoRunAt}
                        onChange={(event) => setAutoRunAt(event.target.value)}
                        sx={fieldSx}
                        InputLabelProps={{ shrink: true }}
                    />
                </Box>

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                        gap: 1.25,
                        mt: 3,
                    }}
                >
                    {WEEKDAYS.map((day) => {
                        const isToday = day.key === todayKey;
                        return (
                            <Box
                                key={day.key}
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: { xs: "1fr", sm: "150px minmax(190px, 1fr) 96px" },
                                    gap: 1,
                                    alignItems: "center",
                                    backgroundColor: isToday ? "#12345a" : "#191919",
                                    border: `1px solid ${isToday ? "#2f80ed" : "#333333"}`,
                                    borderRadius: "8px",
                                    padding: 1.25,
                                }}
                            >
                                <Box>
                                    <Typography sx={{ fontWeight: 800, color: "#f8fafc", lineHeight: 1.2 }}>
                                        {day.label}
                                    </Typography>
                                    {isToday && (
                                        <Typography sx={{ color: "#bfdbfe", fontSize: 12, mt: 0.25 }}>
                                            dzisiaj
                                        </Typography>
                                    )}
                                </Box>
                                <FormControl size="small" fullWidth disabled={loadingDeliveries || deliveryTimes.length === 0} sx={fieldSx}>
                                    <InputLabel>Czas wysyłki</InputLabel>
                                    <Select
                                        value={deliveryTimes.some((delivery) => String(getDeliveryId(delivery)) === schedule[day.key]) ? schedule[day.key] : ""}
                                        label="Czas wysyłki"
                                        onChange={(event) => handleScheduleChange(day.key, event.target.value)}
                                        MenuProps={menuProps}
                                    >
                                        {deliveryTimes.map((delivery) => {
                                            const id = getDeliveryId(delivery);
                                            return (
                                                <MenuItem key={id} value={String(id)}>
                                                    {getDeliveryName(delivery)}
                                                </MenuItem>
                                            );
                                        })}
                                    </Select>
                                </FormControl>
                                <TextField
                                    size="small"
                                    label="ID"
                                    type="number"
                                    value={schedule[day.key]}
                                    onChange={(event) => handleScheduleChange(day.key, event.target.value)}
                                    sx={fieldSx}
                                />
                            </Box>
                        );
                    })}
                </Box>

                <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, mt: 3 }}>
                    <Button variant="outlined" onClick={handleGetDeliveryTimes} disabled={loadingDeliveries}>
                        {loadingDeliveries ? "Pobieram..." : "Odśwież czasy"}
                    </Button>
                    <Button variant="outlined" onClick={handleGetSettings} disabled={loadingSettings}>
                        {loadingSettings ? "Wczytuję..." : "Odśwież ustawienia"}
                    </Button>
                    <Button variant="outlined" onClick={handleAddCategoryGroup}>
                        Dodaj zespół kategorii
                    </Button>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#e5e7eb" }}>
                        <Checkbox
                            checked={onlyInStock}
                            onChange={(event) => setOnlyInStock(event.target.checked)}
                            sx={{ color: "#94a3b8", "&.Mui-checked": { color: "#2f80ed" } }}
                        />
                        <Typography>Tylko produkty ze stanem większym od 0</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#e5e7eb" }}>
                        <Checkbox
                            checked={includeInactive}
                            onChange={(event) => setIncludeInactive(event.target.checked)}
                            disabled
                            sx={{ color: "#94a3b8", "&.Mui-checked": { color: "#2f80ed" } }}
                        />
                        <Typography sx={{ color: "#94a3b8" }}>Nieaktywne produkty zostaną dodane po potwierdzeniu filtra aktywności REST</Typography>
                    </Box>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={() => handleApply(todayKey)}
                        disabled={saving}
                        sx={{ fontWeight: 800 }}
                    >
                        {saving ? "Aktualizacja w tle..." : "Aktualizuj teraz"}
                    </Button>
                    <Button variant="contained" onClick={() => handleApply(selectedDay)} disabled={saving}>
                        Zastosuj wybrany dzień
                    </Button>
                    <Button
                        variant="contained"
                        color="warning"
                        onClick={handleSaveSettings}
                        disabled={savingSettings}
                        sx={{ fontWeight: 800 }}
                    >
                        {savingSettings ? "Zapisuję..." : "Zapisz harmonogram"}
                    </Button>
                </Box>
                <Typography sx={{ color: "#fbbf24", mt: 2, fontSize: 13 }}>
                    Program najpierw próbuje pobrać ID produktów przez REST po category_tree_id; Storefront jest używany tylko awaryjnie
                    {selectedCategories.length
                        ? `; w harmonogramie zapiszesz ${selectedCategories.length} kategorii.`
                        : "."}
                </Typography>
                <Typography sx={{ color: "#cbd5e1", mt: 1, fontSize: 13 }}>
                    Ustawienia są zapisywane w pliku backendu shoper-delivery-settings.json. Ostatni cron:{" "}
                    {lastAutoRun?.lastRunDate
                        ? `${lastAutoRun.lastRunDate}, status: ${lastAutoRun.lastStatus ?? "-"}`
                        : "brak wykonania"}
                    .
                </Typography>
            </Box>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 2,
                    mb: 2,
                }}
            >
                <Box sx={{ backgroundColor: "#191919", border: "1px solid #333", borderRadius: "8px", padding: 2 }}>
                    <Typography sx={{ color: "#94a3b8", fontSize: 13 }}>Aktualizuj teraz według</Typography>
                    <Typography sx={{ fontWeight: 800, color: "#f8fafc" }}>
                        {WEEKDAYS.find((day) => day.key === todayKey)?.label}:{" "}
                        {todayDelivery ? getDeliveryName(todayDelivery) : `ID ${todayDeliveryId || "-"}`}
                    </Typography>
                </Box>
                <Box sx={{ backgroundColor: "#191919", border: "1px solid #333", borderRadius: "8px", padding: 2 }}>
                    <Typography sx={{ color: "#94a3b8", fontSize: 13 }}>Ręcznie wybrany dzień</Typography>
                    <Typography sx={{ fontWeight: 800, color: "#f8fafc" }}>
                        {WEEKDAYS.find((day) => day.key === selectedDay)?.label}:{" "}
                        {selectedDelivery ? getDeliveryName(selectedDelivery) : `ID ${selectedDeliveryId || "-"}`}
                    </Typography>
                </Box>
            </Box>

            {result && (
                <Box sx={{ background: "#f8fafc", color: "#111827", borderRadius: "8px", padding: 2, whiteSpace: "pre-wrap" }}>
                    <Typography sx={{ fontWeight: 800, mb: 1 }}>
                        Status: {result.status === "running" ? "w trakcie" : result.status === "completed" ? "zakończone" : "błąd"}
                    </Typography>
                    <Typography sx={{ mb: 0.5 }}>
                        Etap: {result.phase === "fetching-products" ? "pobieranie produktów z kategorii" : result.phase === "updating-products" ? "aktualizacja produktów" : "zakończone"}
                    </Typography>
                    <Typography sx={{ mb: 0.5 }}>
                        Kategorie: {result.categoryIds?.length ? result.categoryIds.join(", ") : "-"}
                        {result.currentCategoryId ? `; aktualnie: ${result.currentCategoryId}` : ""}
                    </Typography>
                    <Typography sx={{ mb: 0.5 }}>
                        Źródło produktów: {result.source === "rest-category-tree" ? "REST category_tree_id" : result.source === "storefront-category" ? "Storefront kategoria" : "-"}
                    </Typography>
                    <Typography sx={{ mb: 0.5 }}>
                        Strona / produkt: {result.currentPage || 0}/{result.totalPages ?? "?"}, znalezione ID produktów: {result.scannedCount ?? 0}
                    </Typography>
                    <Typography sx={{ mb: 0.5 }}>
                        Pasujące produkty: {result.matchedCount ?? 0}, pominięto bez stanu: {result.skippedOutOfStockCount ?? 0}, zaktualizowano: {result.updatedCount ?? 0}, błędy: {result.failedCount ?? 0}
                    </Typography>
                    {Array.isArray(result.categoryResults) && result.categoryResults.length > 0 && (
                        <Box sx={{ mt: 1, display: "grid", gap: 0.5 }}>
                            {result.categoryResults.map((categoryResult) => (
                                <Typography key={categoryResult.categoryId} sx={{ fontSize: 13 }}>
                                    Kategoria {categoryResult.categoryId}: {categoryResult.status === "completed" ? "OK" : "błąd"}, znaleziono{" "}
                                    {categoryResult.matchedCount}, zaktualizowano {categoryResult.updatedCount}, błędy {categoryResult.failedCount}
                                </Typography>
                            ))}
                        </Box>
                    )}
                    {Array.isArray(result.failed) && result.failed.length > 0 && (
                        <pre style={{ margin: 0, overflowX: "auto" }}>{JSON.stringify(result.failed.slice(0, 10), null, 2)}</pre>
                    )}
                    {result.error ? (
                        <pre style={{ margin: "8px 0 0", overflowX: "auto" }}>{JSON.stringify(result.error, null, 2)}</pre>
                    ) : null}
                </Box>
            )}
        </Box>
    );
}

export default ShoperDeliveryTimePanel;
