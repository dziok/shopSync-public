import { createContext, useContext } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Eraser } from 'lucide-react';

export const TemplateResetContext = createContext<(() => void) | null>(null);

export function TemplateResetButton({ disabled, beforeReset }: { disabled?: boolean; beforeReset?: () => void }) {
    const reset = useContext(TemplateResetContext);
    return <Tooltip title="Wyczyść formularz"><span><IconButton size="small" color="inherit" aria-label="Wyczyść formularz" type="button" disabled={!reset || disabled} onClick={() => {
        beforeReset?.();
        reset?.();
    }}><Eraser size={18} /></IconButton></span></Tooltip>;
}
