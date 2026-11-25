import type { ReactNode } from "react";
import { Button, IconButton, Tooltip } from "@mui/material";
import { ImagePlus, Images } from "lucide-react";
import "./templateActionBar.css";

export function TemplateActionBar({ children, onAddPhotos, onManagePhotos, photoCount }: {
    children: ReactNode; onAddPhotos: () => void; onManagePhotos: () => void; photoCount: number;
}) {
    return <div className="template-action-bar" role="group" aria-label="Akcje produktu">
        <div className="template-action-photos" role="group" aria-label="Zdjęcia produktu">
        <Tooltip title={photoCount ? 'Zarządzaj zdjęciami' : 'Brak zdjęć'}><span><Button type="button" size="small" color="inherit"
            aria-label={`Zarządzaj zdjęciami (${photoCount})`} aria-haspopup="dialog" disabled={!photoCount} onClick={onManagePhotos}>
            <Images size={16} aria-hidden="true" /> Zdjęcia <span className="template-photo-count">{photoCount}</span>
        </Button></span></Tooltip>
        <Tooltip title="Dodaj zdjęcia"><IconButton type="button" size="small" color="inherit" aria-label="Dodaj zdjęcia" onClick={onAddPhotos}>
            <ImagePlus size={18} />
        </IconButton></Tooltip>
        </div>
        {children}
    </div>;
}
