import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
    Box,
    Button,
    Checkbox,
    FormControlLabel,
    TextField,
    Typography,
} from "@mui/material";
import { API_URL } from "./config";
import { RelatedProductPack } from "./relatedProductsSelect";

type RelatedProductsPanelProps = {
    authToken: string;
};

type RelatedProductAssignment = {
    productId: number;
    packId: string;
    packRevision: number;
    lastSyncedAt?: string;
    lastSyncStatus?: "pending" | "success" | "failed";
};

type RelatedProductsState = {
    revision: number;
    packs: RelatedProductPack[];
    assignments: RelatedProductAssignment[];
    dueAssignmentsCount: number;
    autoRun: {
        enabled: boolean;
        runAt: string;
        timezone: string;
        lastRunDate?: string;
        lastStatus?: "started" | "completed" | "failed";
        lastFinishedAt?: string;
        lastUpdatedCount?: number;
        lastFailedCount?: number;
    };
};

const panelStyle = {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "24px",
    color: "#111827",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
};

const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "#ffffff",
    color: "#111827",
    border: "1px solid #e5e7eb",
};

const cellStyle: React.CSSProperties = {
    borderBottom: "1px solid #e5e7eb",
    padding: "10px",
    textAlign: "left",
    verticalAlign: "top",
    color: "#111827",
};

const fieldSx = {
    "& .MuiInputBase-root": {
        backgroundColor: "#ffffff",
        color: "#111827",
    },
    "& .MuiInputLabel-root": {
        color: "#374151",
    },
    "& .MuiInputLabel-root.Mui-focused": {
        color: "#1976d2",
    },
    "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "#cbd5e1",
    },
    "& .MuiFormHelperText-root": {
        color: "#4b5563",
    },
    "& input": {
        color: "#111827",
    },
    "& textarea": {
        color: "#111827",
    },
    "& input[type='time']::-webkit-calendar-picker-indicator": {
        filter: "invert(0)",
    },
};

const parseIds = (value: string) =>
    value
        .split(/[\s,;]+/)
        .map((part) => Number(part.trim()))
        .filter((id) => Number.isFinite(id) && id > 0)
        .filter((id, index, list) => list.indexOf(id) === index);

function RelatedProductsPanel({ authToken }: RelatedProductsPanelProps) {
    const [state, setState] = useState<RelatedProductsState | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [productIdsText, setProductIdsText] = useState("");
    const [autoRunAt, setAutoRunAt] = useState("03:00");
    const [autoRunEnabled, setAutoRunEnabled] = useState(true);

    const productIds = useMemo(() => parseIds(productIdsText), [productIdsText]);

    const headers = {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
    };

    const loadState = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/related-products`, { headers });
            setState(response.data);
            setAutoRunAt(response.data?.autoRun?.runAt ?? "03:00");
            setAutoRunEnabled(response.data?.autoRun?.enabled !== false);
        } catch (error) {
            console.error("Błąd pobierania produktów powiązanych:", error);
            toast.error("Nie udało się pobrać produktów powiązanych.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadState();
    }, []);

    const resetForm = () => {
        setEditingId(null);
        setName("");
        setProductIdsText("");
    };

    const editPack = (pack: RelatedProductPack) => {
        setEditingId(pack.id);
        setName(pack.name);
        setProductIdsText(pack.productIds.join("\n"));
    };

    const savePack = async () => {
        if (!name.trim()) {
            toast.error("Podaj nazwę paczki.");
            return;
        }
        if (!productIds.length) {
            toast.error("Dodaj co najmniej jeden ID produktu.");
            return;
        }

        setSaving(true);
        try {
            const payload = { name: name.trim(), productIds };
            const response = editingId
                ? await axios.patch(`${API_URL}/related-products/packs/${editingId}`, payload, { headers })
                : await axios.post(`${API_URL}/related-products/packs`, payload, { headers });
            setState(response.data);
            resetForm();
            toast.success(editingId ? "Zapisano paczkę." : "Dodano paczkę.");
        } catch (error) {
            console.error("Błąd zapisu paczki produktów powiązanych:", error);
            toast.error("Nie udało się zapisać paczki.");
        } finally {
            setSaving(false);
        }
    };

    const deletePack = async (pack: RelatedProductPack) => {
        if (!window.confirm(`Usunąć paczkę "${pack.name}"?`)) return;

        setSaving(true);
        try {
            const response = await axios.delete(`${API_URL}/related-products/packs/${pack.id}`, { headers });
            setState(response.data);
            if (editingId === pack.id) resetForm();
            toast.success("Usunięto paczkę.");
        } catch (error) {
            console.error("Błąd usuwania paczki produktów powiązanych:", error);
            toast.error("Nie udało się usunąć paczki.");
        } finally {
            setSaving(false);
        }
    };

    const saveAutoRun = async () => {
        setSaving(true);
        try {
            const response = await axios.patch(
                `${API_URL}/related-products/autorun`,
                { enabled: autoRunEnabled, runAt: autoRunAt, timezone: "Europe/Warsaw" },
                { headers },
            );
            setState(response.data);
            toast.success("Zapisano ustawienia automatycznej aktualizacji.");
        } catch (error) {
            console.error("Błąd zapisu crona produktów powiązanych:", error);
            toast.error("Nie udało się zapisać automatycznej aktualizacji.");
        } finally {
            setSaving(false);
        }
    };

    const syncDue = async () => {
        setSaving(true);
        try {
            const response = await axios.post(`${API_URL}/related-products/sync-due`, {}, { headers });
            toast.success(`Zaktualizowano: ${response.data.updated.length}, błędy: ${response.data.failed.length}.`);
            await loadState();
        } catch (error) {
            console.error("Błąd ręcznej synchronizacji produktów powiązanych:", error);
            toast.error("Nie udało się uruchomić synchronizacji.");
        } finally {
            setSaving(false);
        }
    };

    const assignmentCountForPack = (packId: string) =>
        state?.assignments.filter((assignment) => assignment.packId === packId).length ?? 0;

    return (
        <Box sx={panelStyle}>
            <Typography variant="h4" sx={{ mb: 2, color: "#111827" }}>
                Produkty powiązane
            </Typography>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "360px 1fr" }, gap: 3 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <TextField
                        label="Nazwa paczki"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        sx={fieldSx}
                    />
                    <TextField
                        label="ID produktów"
                        value={productIdsText}
                        onChange={(event) => setProductIdsText(event.target.value)}
                        multiline
                        minRows={8}
                        helperText="Wpisz ID po przecinku, spacji albo w nowych liniach."
                        sx={fieldSx}
                    />
                    <Typography variant="body2" sx={{ color: "#1f2937" }}>Rozpoznane ID: {productIds.length ? productIds.join(", ") : "brak"}</Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Button variant="contained" onClick={savePack} disabled={saving}>
                            {editingId ? "Zapisz paczkę" : "Dodaj paczkę"}
                        </Button>
                        {editingId && (
                            <Button variant="outlined" onClick={resetForm} disabled={saving}>
                                Anuluj
                            </Button>
                        )}
                    </Box>
                </Box>

                <Box>
                    <Box sx={{ mb: 2, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={autoRunEnabled}
                                    onChange={(event) => setAutoRunEnabled(event.target.checked)}
                                    sx={{ color: "#374151" }}
                                />
                            }
                            label={<Typography sx={{ color: "#111827" }}>Automatyczna aktualizacja raz dziennie</Typography>}
                        />
                        <TextField
                            label="Godzina"
                            type="time"
                            size="small"
                            value={autoRunAt}
                            onChange={(event) => setAutoRunAt(event.target.value)}
                            sx={fieldSx}
                        />
                        <Button variant="outlined" onClick={saveAutoRun} disabled={saving}>
                            Zapisz automat
                        </Button>
                        <Button variant="outlined" onClick={syncDue} disabled={saving || !state?.dueAssignmentsCount}>
                            Aktualizuj zmienione teraz
                        </Button>
                    </Box>

                    <Typography variant="body2" sx={{ mb: 2, color: "#1f2937" }}>
                        Do aktualizacji po edycji paczek: {state?.dueAssignmentsCount ?? 0}. Ostatni automat:{" "}
                        {state?.autoRun.lastFinishedAt
                            ? `${state.autoRun.lastFinishedAt} (${state.autoRun.lastStatus})`
                            : "brak"}.
                    </Typography>

                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={cellStyle}>Paczka</th>
                                <th style={cellStyle}>Produkty</th>
                                <th style={cellStyle}>Przypisane</th>
                                <th style={cellStyle}>Akcje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {state?.packs.map((pack) => (
                                <tr key={pack.id}>
                                    <td style={cellStyle}>
                                        <strong>{pack.name}</strong>
                                        <br />
                                        <span>rewizja {pack.revision}</span>
                                    </td>
                                    <td style={cellStyle}>{pack.productIds.join(", ")}</td>
                                    <td style={cellStyle}>{assignmentCountForPack(pack.id)}</td>
                                    <td style={cellStyle}>
                                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                                            <Button size="small" variant="outlined" onClick={() => editPack(pack)}>
                                                Edytuj
                                            </Button>
                                            <Button
                                                size="small"
                                                color="error"
                                                variant="outlined"
                                                onClick={() => deletePack(pack)}
                                            >
                                                Usuń
                                            </Button>
                                        </Box>
                                    </td>
                                </tr>
                            ))}
                            {!loading && state?.packs.length === 0 && (
                                <tr>
                                    <td style={cellStyle} colSpan={4}>
                                        Brak paczek produktów powiązanych.
                                    </td>
                                </tr>
                            )}
                            {loading && (
                                <tr>
                                    <td style={cellStyle} colSpan={4}>
                                        Ładowanie...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </Box>
            </Box>
        </Box>
    );
}

export default RelatedProductsPanel;
