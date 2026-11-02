import type { ReactNode } from "react";
import { Box, Checkbox, FormControlLabel } from "@mui/material";

export function ApiloSubmitControls({ addToApilo, onChange, children }: {
    addToApilo: boolean;
    onChange: (enabled: boolean) => void;
    children: ReactNode;
}) {
    return <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        {children}
        <FormControlLabel
            control={<Checkbox checked={addToApilo} onChange={event => onChange(event.target.checked)} />}
            label="Dodaj też do Apilo"
        />
    </Box>;
}
