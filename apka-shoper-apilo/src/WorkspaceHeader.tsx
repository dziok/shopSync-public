import { useEffect, useState, type ReactNode } from 'react';
import { Divider, ListSubheader, Menu, MenuItem, Tooltip, useMediaQuery } from '@mui/material';
import { ChevronDown, FileSpreadsheet, Layers, Menu as MenuIcon, Package, Settings, Wrench } from 'lucide-react';
import './workspaceHeader.css';

export type NavEntry = { id: string; label: string; shortLabel?: string; select: () => void; checked?: boolean };
type Props = {
    current: string | null; templates: NavEntry[]; tools: NavEntry[];
    orders: () => void; delivery: () => void; settings: () => void;
    children: ReactNode; error?: string;
};

export function WorkspaceHeader({ current, templates, tools, orders, delivery, settings, children, error }: Props) {
    const compact = useMediaQuery('(max-width: 900px)');
    const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
    useEffect(() => { setAnchor(null); }, [compact]);
    const main = [{ id: 'orders', label: 'Zamówienia', select: orders, Icon: Package },
        { id: 'csv', label: 'Dostawa CSV', select: delivery, Icon: FileSpreadsheet }];
    const currentTool = tools.find(entry => entry.id === current);
    const currentName = current === 'settings' ? 'Ustawienia szablonów'
        : [...templates, ...main, ...tools].find(entry => entry.id === current)?.label;
    const menuItem = (entry: NavEntry) => <MenuItem key={entry.id}
        role={entry.checked === undefined ? 'menuitem' : 'menuitemcheckbox'}
        aria-checked={entry.checked} aria-current={current === entry.id ? 'page' : undefined}
        selected={entry.checked ?? current === entry.id}
        onClick={() => { setAnchor(null); entry.select(); }}>{entry.label}</MenuItem>;
    const trigger = (mobile: boolean) => <button type="button" id="workspace-menu-trigger"
        className={mobile ? 'ws-icon' : 'ws-command'} data-current={!!currentTool}
        aria-label={mobile ? 'Otwórz menu nawigacji' : undefined}
        aria-haspopup="menu" aria-expanded={!!anchor} aria-controls={anchor ? 'workspace-menu' : undefined}
        onClick={e => setAnchor(e.currentTarget)}>
        {mobile ? <MenuIcon /> : <><Wrench /><span>{currentTool?.label ?? 'Narzędzia'}</span><ChevronDown className="ws-caret" /></>}
    </button>;
    return <header className="workspace-header">
        <div className="ws-bar">
            <div className="ws-brand">
                <img src="/favicon.png" alt="" width="32" height="32" />
                <div><span className="ws-wordmark">ShopSync</span>
                    {compact && currentName && <span className="ws-location">{currentName}</span>}</div>
            </div>
            {!compact && <nav className="ws-primary" aria-label="Nawigacja główna">
                {main.map(({ id, label, Icon, select }) => <button key={id} type="button" className="ws-command"
                    aria-current={current === id ? 'page' : undefined} onClick={select}><Icon />{label}</button>)}
                {trigger(false)}
            </nav>}
            <div className="ws-connections">{children}</div>
            <div className="ws-actions">
                <Tooltip title="Ustawienia szablonów"><button type="button" className="ws-icon"
                    aria-label="Ustawienia szablonów" aria-current={current === 'settings' ? 'page' : undefined}
                    onClick={settings}><Settings /></button></Tooltip>
                {compact && trigger(true)}
            </div>
        </div>
        {!compact && <nav className="ws-templates" aria-label="Szablony produktów">
            <span className="ws-nav-label"><Layers />Szablony</span>
            {templates.map(entry => <button type="button" key={entry.id} className="ws-tab" title={entry.label}
                aria-label={entry.label} aria-current={current === entry.id ? 'page' : undefined}
                onClick={entry.select}>{entry.shortLabel ?? entry.label}</button>)}
        </nav>}
        {error && <p className="ws-error" role="alert">{error}</p>}
        <Menu id="workspace-menu" open={!!anchor} anchorEl={anchor} onClose={() => setAnchor(null)}
            MenuListProps={{ 'aria-labelledby': 'workspace-menu-trigger', className: 'ws-menu-list' }}
            slotProps={{ paper: { className: 'ws-menu-paper' } }}>
            {compact && <ListSubheader disableSticky>Szablony produktów</ListSubheader>}
            {compact && templates.map(menuItem)}
            {compact && <Divider />}
            {compact && main.map(menuItem)}
            {compact && <ListSubheader disableSticky>Narzędzia</ListSubheader>}
            {tools.map(menuItem)}
        </Menu>
    </header>;
}
