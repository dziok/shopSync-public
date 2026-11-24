import axios from "axios";
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { API_URL } from "./config";

type TokenState = "valid" | "expiring" | "expired" | "not_initialized";

type ApiloTokenStatusResponse = {
  status: TokenState;
  accessTokenExpireAt: string | null;
  refreshTokenExpireAt: string | null;
  automaticRefresh: boolean;
  lastRefreshedAt: string | null;
  credentialsConfigured: boolean;
};

type ApiloTokenStatusProps = {
  authToken: string;
  onSessionUpdated: (token: string) => void;
};

const statusLabels: Record<TokenState, string> = {
  valid: "Połączono",
  expiring: "Wkrótce wygaśnie",
  expired: "Token wygasł",
  not_initialized: "Nie połączono",
};

const credentialFieldSx = {
  "& .MuiInputBase-input": { color: "#f4f4f4" },
  "& .MuiInputLabel-root": { color: "#bdbdbd" },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#606060" },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#a4a4a4" },
};

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString("pl-PL") : "—";
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data?.message === "string") return data.message;
    if (Array.isArray(data?.message)) return data.message.join(" ");
  }
  return "Nie udało się połączyć z Apilo. Sprawdź połączenie z backendem.";
}

function ApiloTokenStatus({ authToken, onSessionUpdated }: ApiloTokenStatusProps) {
  const [status, setStatus] = useState<ApiloTokenStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [open, setOpen] = useState(false);
  const [authorizationCode, setAuthorizationCode] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [pendingAction, setPendingAction] = useState<"connect" | "refresh" | null>(null);
  const [actionError, setActionError] = useState("");

  const loadStatus = useCallback(async () => {
    try {
      setHasError(false);
      const response = await axios.get<ApiloTokenStatusResponse>(
        `${API_URL}/auth/apilo-token/status`,
        { headers: { Authorization: `Bearer ${authToken}` } },
      );
      setStatus(response.data);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    void loadStatus();
    const interval = window.setInterval(() => void loadStatus(), 5 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [loadStatus]);

  const runAction = async (action: "connect" | "refresh") => {
    setPendingAction(action);
    setActionError("");
    try {
      const response = await axios.post<{ access_token: string }>(
        `${API_URL}/auth/apilo-token/${action}`,
        action === "connect" ? { authorizationCode, clientId, clientSecret } : {},
        { headers: { Authorization: `Bearer ${authToken}` } },
      );
      onSessionUpdated(response.data.access_token);
      setAuthorizationCode("");
      setClientId("");
      setClientSecret("");
      await loadStatus();
      toast.success(action === "connect" ? "Apilo połączone. Token został wygenerowany." : "Token Apilo został odświeżony.");
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  };

  const isActive = !hasError && (status?.status === "valid" || status?.status === "expiring");
  const visualState = isLoading ? "loading" : isActive ? "valid" : "inactive";
  const statusText = hasError ? "Błąd połączenia" : status ? statusLabels[status.status] : "Sprawdzanie";

  return (
    <>
      <button
        className={`apilo-token-status apilo-token-status--${visualState}`}
        type="button"
        onClick={() => { setOpen(true); setActionError(""); void loadStatus(); }}
        aria-label={`Zarządzaj połączeniem Apilo. ${statusText}`}
      >
        <span className="apilo-token-status__dot" aria-hidden="true" />
        <strong>Apilo: {statusText}</strong>
      </button>

      <Dialog
        open={open}
        onClose={() => { if (!pendingAction) setOpen(false); }}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { bgcolor: "#242424", color: "#f4f4f4", border: "1px solid #454545" } }}
      >
        <DialogTitle>Zarządzanie Apilo</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2">Stan: <strong>{statusText}</strong></Typography>
            {status && <Box sx={{ color: "#bdbdbd", fontSize: ".85rem", lineHeight: 1.8 }}>
              <div>Token ważny do: {formatDate(status.accessTokenExpireAt)}</div>
              <div>Odświeżanie możliwe do: {formatDate(status.refreshTokenExpireAt)}</div>
              <div>Ostatnie odnowienie: {formatDate(status.lastRefreshedAt)}</div>
            </Box>}
            {hasError && <Alert severity="error">Nie można pobrać statusu Apilo z backendu.</Alert>}
            {actionError && <Alert severity="error">{actionError}</Alert>}
            <Button variant="outlined" onClick={() => void runAction("refresh")} disabled={Boolean(pendingAction) || !status?.automaticRefresh}>
              {pendingAction === "refresh" ? <CircularProgress size={20} /> : "Odśwież token"}
            </Button>
            <Typography variant="subtitle2">Nowe połączenie</Typography>
            <Typography variant="body2" sx={{ color: "#bdbdbd" }}>
              Kod znajdziesz w Apilo: Administracja → Klucze API Apilo. ID i sekret podaj razem, gdy zmieniono aplikację API.
            </Typography>
            <TextField label="Kod autoryzacyjny" type="password" value={authorizationCode} onChange={(event) => setAuthorizationCode(event.target.value)} fullWidth autoComplete="off" sx={credentialFieldSx} />
            <TextField label="ID klienta (opcjonalnie)" value={clientId} onChange={(event) => setClientId(event.target.value)} fullWidth autoComplete="off" sx={credentialFieldSx} />
            <TextField label="Sekret klienta (opcjonalnie)" type="password" value={clientSecret} onChange={(event) => setClientSecret(event.target.value)} fullWidth autoComplete="off" sx={credentialFieldSx} />
            {!status?.credentialsConfigured && <Alert severity="info">Podaj ID i sekret klienta wraz z kodem autoryzacyjnym.</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => void loadStatus()} disabled={isLoading}>Sprawdź stan</Button>
          <Button onClick={() => setOpen(false)} disabled={Boolean(pendingAction)}>Zamknij</Button>
          <Button variant="contained" onClick={() => void runAction("connect")} disabled={Boolean(pendingAction) || !authorizationCode.trim() || Boolean(clientId.trim()) !== Boolean(clientSecret.trim())}>
            {pendingAction === "connect" ? <CircularProgress size={20} /> : "Połącz Apilo"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ApiloTokenStatus;
