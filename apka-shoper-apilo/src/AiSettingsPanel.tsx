import { useState, useEffect } from 'react';
import axios from 'axios';
import { Autocomplete, Box, Button, Chip, Collapse, IconButton, Stack, TextField, Tooltip } from '@mui/material';
import { RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { API_URL } from './config';
import { getApiErrorMessage } from './backendQueries/apiErrorMessage';
type AiSettings = { configured: boolean; model: string; instructions: string };
export default function AiSettingsPanel({
    authToken,
    expanded = false,
    onConfigured,
}: {
    authToken: string;
    expanded?: boolean;
    onConfigured?: (v: boolean) => void;
}) {
    const [settings, setSettings] = useState<AiSettings>({
        configured: false,
        model: 'gpt-5.4-mini',
        instructions: '',
    });
    const [key, setKey] = useState('');
    const [savedModel, setSavedModel] = useState('');
    const [connection, setConnection] = useState('');
    const [connecting, setConnecting] = useState(false);
    const invalidKey = !!key.trim() && (!key.trim().startsWith('sk-') || /\.\.\.|…|\s/.test(key.trim()));
    const [showSettings, setShowSettings] = useState(expanded);
    const [models, setModels] = useState<string[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const [modelsError, setModelsError] = useState('');
    const [refresh, setRefresh] = useState(0);
    useEffect(() => {
        if (!showSettings || !settings.configured) return;
        const controller = new AbortController();
        setLoadingModels(true);
        setModelsError('');
        axios.get<string[]>(API_URL + '/bulk-ai/models', {
            signal: controller.signal, headers: { Authorization: 'Bearer ' + authToken },
        }).then(({ data }) => {
            if (!controller.signal.aborted) setModels(data);
        }).catch(error => {
            if (!controller.signal.aborted) setModelsError(getApiErrorMessage(error, 'Nie udało się pobrać modeli.'));
        }).finally(() => { if (!controller.signal.aborted) setLoadingModels(false); });
        return () => controller.abort();
    }, [authToken, settings.configured, showSettings, refresh]);
    const api = { headers: { Authorization: `Bearer ${authToken}` } };
    useEffect(() => {
        const controller = new AbortController();
        axios
            .get<AiSettings>(`${API_URL}/bulk-ai/settings`, {
                signal: controller.signal,
                headers: { Authorization: `Bearer ${authToken}` },
            })
            .then(({ data }) => {
                onConfigured?.(data.configured);
                setSettings(data);
                setSavedModel(data.model);
                if (!data.configured) setShowSettings(true);
            })
            .catch(() => {
                if (!controller.signal.aborted) toast.error('Nie udało się pobrać ustawień AI.');
            });
        return () => {
            controller.abort();
        };
    }, [authToken, onConfigured]);

    const saveSettings = async () => {
        setConnecting(true);
        setConnection('');
        try {
            const { data } = await axios.put<AiSettings>(
                `${API_URL}/bulk-ai/settings`,
                { model: settings.model, instructions: settings.instructions, apiKey: key },
                api,
            );
            onConfigured?.(data.configured);
            setSettings(data);
            setSavedModel(data.model);
            setKey('');
            if (key.trim()) { setModels([]); setRefresh(n => n + 1); }
            toast.success('Zapisano ustawienia AI.');
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Nie udało się zapisać ustawień AI.'));
        } finally {
            setConnecting(false);
        }
    };
    const testConnection = async () => {
        setConnecting(true);
        try {
            await axios.post(`${API_URL}/bulk-ai/test`, {}, api);
            setConnection('Model dostępny · limit analizy niesprawdzony');
        } catch (error) {
            setConnection('Błąd połączenia');
            toast.error(getApiErrorMessage(error, 'Połączenie z OpenAI nie działa.'));
        } finally {
            setConnecting(false);
        }
    };

    return (
        <Stack spacing={1}>
            <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                <Chip
                    size="small"
                    label={
                        key || (savedModel && settings.model !== savedModel)
                            ? 'Niezapisane zmiany'
                            : connection ||
                              (settings.configured ? 'Klucz zapisany' : savedModel ? 'Brak klucza' : 'Odczyt ustawień')
                    }
                />
                <Button
                    variant="outlined"
                    onClick={() => setShowSettings((value) => !value)}
                    aria-expanded={showSettings}
                >
                    Połączenie z OpenAI
                </Button>
            </Stack>
            <Collapse in={showSettings}>
                <Box sx={{ borderTop: '1px solid', borderColor: 'divider', py: 2, mb: 2 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} gap={1} sx={{ mb: 1 }}>
                        <TextField
                            size="small"
                            disabled={connecting}
                            label="Secret key (klucz API)"
                            type="password"
                            value={key}
                            autoComplete="new-password"
                            error={invalidKey}
                            onChange={(event) => setKey(event.target.value)}
                            InputLabelProps={{ shrink: true }}
                            placeholder={settings.configured ? 'Pozostaw puste, aby zachować klucz' : 'sk-…'}
                            helperText={
                                invalidKey ? (
                                    'Potrzebny jest pełny klucz sk-, nie jego zamaskowany podgląd ani identyfikator.'
                                ) : (
                                    <>
                                        Wklej pełny Secret key, nie Tracking ID ani Project ID. Masz tylko skrót?{' '}
                                        <a
                                            style={{ color: '#90caf9' }}
                                            href="https://platform.openai.com/api-keys"
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Utwórz nowy klucz API
                                        </a>
                                        .
                                    </>
                                )
                            }
                            sx={{ flex: 2 }}
                        />
                        <Autocomplete
                            disableClearable
                            size="small"
                            disabled={connecting}
                            options={Array.from(new Set([settings.model, ...models]))}
                            value={settings.model}
                            onChange={(_, model) => setSettings({ ...settings, model })}
                            renderInput={params => <TextField {...params} label="Model OpenAI"
                                error={!!modelsError} helperText={modelsError || (loadingModels ? 'Pobieranie modeli…' :
                                    !settings.configured ? 'Zapisz klucz, aby pobrać modele.' :
                                    `Modele z API: ${models.length}. Nie każdy obsługuje analizę formularzy.`)} />}
                            sx={{ flex: 1 }}
                        />
                        <Tooltip title="Odśwież listę modeli"><span><IconButton aria-label="Odśwież listę modeli"
                            disabled={connecting || loadingModels || !settings.configured || !!key}
                            onClick={() => setRefresh(n => n + 1)}><RefreshCw size={18}/></IconButton></span></Tooltip>
                    </Stack>
                    <TextField
                        size="small"
                        label="Dodatkowe instrukcje analizy"
                        multiline
                        minRows={2}
                        fullWidth
                        value={settings.instructions}
                        onChange={(event) => setSettings({ ...settings, instructions: event.target.value })}
                    />
                    <Stack direction="row" gap={1} sx={{ mt: 1 }}>
                        <Button
                            variant="contained"
                            disabled={connecting || invalidKey || (!key.trim() && !settings.configured)}
                            onClick={saveSettings}
                        >
                            Zapisz ustawienia
                        </Button>
                        <Button
                            onClick={testConnection}
                            disabled={connecting || !settings.configured || !!key || settings.model !== savedModel}
                        >
                            Sprawdź połączenie
                        </Button>
                    </Stack>
                </Box>
            </Collapse>
        </Stack>
    );
}
