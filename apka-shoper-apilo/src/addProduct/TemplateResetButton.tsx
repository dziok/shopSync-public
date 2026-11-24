import { createContext, useContext } from 'react';
import Button from '@mui/material/Button';

export const TemplateResetContext = createContext<(() => void) | null>(null);

export function TemplateResetButton({ disabled, beforeReset }: { disabled?: boolean; beforeReset?: () => void }) {
    const reset = useContext(TemplateResetContext);
    return <Button variant="outlined" type="button" disabled={!reset || disabled} onClick={() => {
        beforeReset?.();
        reset?.();
    }}>Wyczyść formularz</Button>;
}
