import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { API_URL } from "./config";

type TokenState = "valid" | "expiring" | "expired" | "not_initialized";

type ApiloTokenStatusResponse = {
  status: TokenState;
};

type ApiloTokenStatusProps = {
  authToken: string;
};

function ApiloTokenStatus({ authToken }: ApiloTokenStatusProps) {
  const [status, setStatus] = useState<ApiloTokenStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      setHasError(false);
      const response = await axios.get<ApiloTokenStatusResponse>(
        `${API_URL}/auth/apilo-token/status`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
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
    const interval = window.setInterval(
      () => {
        void loadStatus();
      },
      5 * 60 * 1000,
    );

    return () => window.clearInterval(interval);
  }, [loadStatus]);

  const isActive =
    !hasError && (status?.status === "valid" || status?.status === "expiring");
  const visualState = isLoading ? "loading" : isActive ? "valid" : "inactive";

  return (
    <div
      className={`apilo-token-status apilo-token-status--${visualState}`}
      aria-live="polite"
    >
      <span className="apilo-token-status__dot" aria-hidden="true" />
      <strong>Apilo: {isActive ? "aktywny" : "nieaktywny"}</strong>

      <button
        className="apilo-token-status__refresh"
        type="button"
        onClick={() => void loadStatus()}
        disabled={isLoading}
      >
        Sprawdź
      </button>
    </div>
  );
}

export default ApiloTokenStatus;
