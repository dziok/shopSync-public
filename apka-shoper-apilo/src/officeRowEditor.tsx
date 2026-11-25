import { useState } from 'react';
import { Box, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { previewOfficeRow, rowError, rowVariables, type OfficeRow } from './addProduct/officeSpecRows';
import { escapeCopy, sanitizeInlineCopy } from './templateCopy';

export default function OfficeRowEditor({ row, value, onChange }: { row:OfficeRow; value:string; onChange:(value:string)=>void }) {
    const [mode,setMode] = useState<'text'|'html'>('text');
    const doc = document.createElement('template');
    doc.innerHTML = sanitizeInlineCopy(value);
    const bold = new Set(Array.from(doc.content.querySelectorAll('b,strong')).flatMap(n => n.textContent?.match(/\{\{[a-z]+\}\}/g) ?? []));
    doc.content.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
    const plain = doc.content.textContent ?? '';
    const error = rowError(row,value);
    const fields = rowVariables(row);
    return <Stack spacing={1}>
        <ToggleButtonGroup size="small" exclusive value={mode} onChange={(_,next) => next && setMode(next)} aria-label="Format edycji">
            <ToggleButton value="text">Tekst</ToggleButton><ToggleButton value="html">HTML</ToggleButton>
        </ToggleButtonGroup>
        <TextField label={mode === 'text' ? 'Treść wiersza' : 'HTML wiersza'} multiline minRows={2} fullWidth
            inputProps={{maxLength:12000}} value={mode === 'text' ? plain : value}
            onChange={e => onChange(mode === 'html' ? e.target.value : escapeCopy(e.target.value)
                .replace(/\{\{[a-z]+\}\}/g, t => bold.has(t) ? '<b>' + t + '</b>' : t).replace(/\n/g,'<br>'))}
            error={!!error} helperText={error || (fields.length ? 'Pola: ' + fields.map(f => '{{' + f + '}}').join(', ') : undefined)} />
        <Box sx={{borderLeft:2,borderColor:'divider',pl:1.5}}>
            <Typography variant="caption" color="text.secondary">Podgląd na przykładowych danych</Typography>
            <Typography component="div" dangerouslySetInnerHTML={{__html:previewOfficeRow(row,value)}} />
        </Box>
    </Stack>;
}
