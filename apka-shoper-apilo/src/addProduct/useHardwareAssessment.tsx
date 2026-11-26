import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Alert, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, Typography } from '@mui/material';
import { BarChart3 } from 'lucide-react';
import { API_URL } from '../config';
import { getApiErrorMessage } from '../backendQueries/apiErrorMessage';
import { type Assessment, type ChartTheme, assessmentChart, assessmentNote, formatAssessment, shoperAssessmentDescription } from './hardwareAssessment';

export function useHardwareAssessment(template:ChartTheme, token:string, values:Record<string,unknown>) {
    const hardware = Object.fromEntries(Object.entries(values).flatMap(([key,value]) => {
        const text = String(value ?? '').trim();
        return text ? [[key,text]] : [];
    }));
    const snapshot = JSON.stringify([template,hardware]);
    const [open, setOpen] = useState(false);
    const [result,setResult] = useState<{ snapshot:string; rows:Assessment[] }>();
    const [channels,setChannels] = useState({shoper:true,allegro:template !== 'damaged-laptop'});
    const [busy,setBusy] = useState(false);
    const [error,setError] = useState('');
    const request = useRef<AbortController>();
    useEffect(() => {
        setResult(undefined); setChannels({shoper:true,allegro:template !== 'damaged-laptop'}); setBusy(false); setError('');
        return () => request.current?.abort();
    }, [snapshot,token,template]);
    const rows = result?.snapshot === snapshot ? result.rows : [];
    const ready = !!(hardware.cpu || hardware.series || hardware.gpu);
    async function evaluate() {
        if (busy || !ready) return;
        const controller = new AbortController();
        request.current = controller;
        setBusy(true); setError('');
        try {
            const {data} = await axios.post<Assessment[]>(API_URL+'/bulk-ai/suitability',{template,hardware},{
                headers:{Authorization:'Bearer '+token}, signal:controller.signal,
            });
            if (!controller.signal.aborted) {
                setResult({snapshot,rows:data});
            }
        } catch (e) {
            if (!controller.signal.aborted) setError(getApiErrorMessage(e,'Nie udało się ocenić konfiguracji.'));
        } finally { if (!controller.signal.aborted) setBusy(false); }
    }
    const allegroHtml = channels.allegro ? formatAssessment(rows,'allegro') : '';
    return {
        shoperDescription: (base:string) => shoperAssessmentDescription(base, rows, channels.shoper, template),
        allegroSections: allegroHtml ? [{items:[{type:'TEXT' as const,content:allegroHtml}]}] : [],
        allegroHtml,
        panel:<>
            <Button type="button" variant="outlined" startIcon={<BarChart3 size={15}/>} onClick={() => setOpen(true)}>Ocena AI</Button>
            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth={rows.length ? 'md' : 'sm'}>
                <DialogTitle>Ocena zastosowań</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={1.5}>
                        {!rows.length && <Typography variant="body2" color="text.secondary">{assessmentNote}</Typography>}
                        <Typography variant="body2">{[hardware.series,hardware.cpu,hardware.gpu,hardware.ram].filter(Boolean).join(' · ')}</Typography>
                        {!ready && <Alert severity="info">Uzupełnij procesor lub kartę graficzną w formularzu.</Alert>}
                        {error && <Alert severity="error">{error}</Alert>}
                        {!!rows.length && <div dangerouslySetInnerHTML={{__html:assessmentChart(rows,template)}} />}
                        {!!rows.length && <Box><Typography variant="subtitle2">Dołącz do opisu oferty</Typography>
                            {(['shoper','allegro'] as const).filter(k => k !== 'allegro' || template !== 'damaged-laptop').map(k =>
                                <FormControlLabel key={k} label={k === 'shoper' ? 'Shoper (PL)' : 'Allegro'} control={<Checkbox
                                    checked={channels[k]} onChange={(_,v) => setChannels(c => ({...c,[k]:v}))}/>} />)}
                        </Box>}
                    </Stack>
                </DialogContent>
                <DialogActions><Button onClick={() => setOpen(false)}>Zamknij</Button>
                    <Button variant="contained" disabled={busy || !ready} onClick={evaluate}>{busy?'Ocenianie…':rows.length?'Oceń ponownie':'Oceń konfigurację'}</Button>
                </DialogActions>
            </Dialog>
        </>,
    };
}
