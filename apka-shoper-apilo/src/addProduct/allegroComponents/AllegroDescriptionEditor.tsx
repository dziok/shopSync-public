import { useEffect, useState } from "react";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import type {
    Template,
    TemplateItem,
    TemplateSection,
} from "../templatesAllegro/allegroDescriptionTemplate";

type AllegroDescriptionEditorProps = {
    template: Template;
    onChange: (template: Template) => void;
    availableImages?: string[];
    onRemoveAutoSection?: (sectionId: string) => void;
    onRestoreAutomaticSections?: () => void;
};

let userSectionCounter = 0;

const createUserSection = (items: TemplateItem[]): TemplateSection => ({
    id: `monitor-user-section-${Date.now()}-${++userSectionCounter}`,
    origin: "user",
    items,
});

const sectionLabel = (section: TemplateSection, index: number) => {
    const hasImage = section.items.some((item) => item.type === "IMAGE");
    const hasText = section.items.some((item) => item.type === "TEXT");
    if (hasImage && hasText) return `Sekcja ${index + 1}: zdjęcie + opis`;
    if (hasImage) return `Sekcja ${index + 1}: zdjęcie`;
    if (hasText) return `Sekcja ${index + 1}: tekst`;
    return `Sekcja ${index + 1}`;
};

const sectionSummary = (section: TemplateSection) => {
    const textItem = section.items.find((item) => item.type === "TEXT");
    if (textItem?.type === "TEXT") {
        const plainText = textItem.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
        if (plainText) return plainText.slice(0, 100);
    }
    return section.items.some((item) => item.type === "IMAGE")
        ? "Sekcja obrazkowa"
        : "Pusta sekcja";
};

const editorFieldSx = {
    mt: 0.75,
    "& .MuiInputBase-root": {
        backgroundColor: "#0f1218",
        color: "#f4f7fb",
        fontSize: 14,
        lineHeight: 1.55,
    },
    "& .MuiInputBase-input": {
        color: "#f4f7fb",
    },
    "& textarea": {
        color: "#f4f7fb",
        fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
        fontSize: 14,
        lineHeight: 1.6,
    },
    "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "#485364",
    },
    "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "#7d91ab",
    },
    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: "#64b5f6",
        borderWidth: 2,
    },
};

const moveButtonSx = {
    "&.Mui-disabled": {
        color: "rgba(226,232,240,0.35)",
        borderColor: "rgba(148,163,184,0.2)",
    },
};

type AllegroDescriptionPreviewProps = {
    template: Template;
    onChange?: (template: Template) => void;
    availableImages?: string[];
};

export function AllegroDescriptionPreview({
    template,
    onChange,
    availableImages = [],
}: AllegroDescriptionPreviewProps) {
    const [imageSlot, setImageSlot] = useState<{ sectionIndex: number; itemIndex: number } | null>(null);
    const [customImageUrl, setCustomImageUrl] = useState("");

    const selectableImages = Array.from(new Set([
        ...availableImages,
        ...template.sections.flatMap((section) =>
            section.items.flatMap((item) => item.type === "IMAGE" && item.url ? [item.url] : [])
        ),
    ])).filter(Boolean);

    const closeImagePicker = () => {
        setImageSlot(null);
        setCustomImageUrl("");
    };

    const chooseImage = (url: string) => {
        const normalizedUrl = url.trim();
        if (!imageSlot || !normalizedUrl || !onChange) return;
        onChange({
            ...template,
            sections: template.sections.map((section, sectionIndex) =>
                sectionIndex === imageSlot.sectionIndex
                    ? {
                        ...section,
                        items: section.items.map((item, itemIndex) =>
                            itemIndex === imageSlot.itemIndex && item.type === "IMAGE"
                                ? { ...item, url: normalizedUrl, locked: true }
                                : item
                        ),
                    }
                    : section
            ),
        });
        closeImagePicker();
    };

    const renderImage = (
        item: Extract<TemplateItem, { type: "IMAGE" }>,
        sectionIndex: number,
        itemIndex: number,
    ) => {
        const editable = Boolean(onChange);
        return (
            <Box
                key={itemIndex}
                onClick={editable ? () => setImageSlot({ sectionIndex, itemIndex }) : undefined}
                title={editable ? "Kliknij, aby wstawić lub zmienić zdjęcie" : undefined}
                sx={{
                    minHeight: item.url ? undefined : 120,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: editable ? "pointer" : "default",
                    overflow: "hidden",
                    borderRadius: 1,
                    border: editable ? "1px dashed #7891ac" : "none",
                    backgroundColor: item.url ? "transparent" : "#e8eef5",
                    transition: "border-color 160ms ease, box-shadow 160ms ease",
                    "&:hover": editable ? {
                        borderColor: "#1976d2",
                        boxShadow: "0 0 0 2px rgba(25,118,210,0.15)",
                    } : undefined,
                }}
            >
                {item.url ? (
                    <img
                        src={item.url}
                        alt=""
                        style={{ width: "100%", maxWidth: "100%", display: "block" }}
                    />
                ) : (
                    <Typography sx={{ p: 2, color: "#496079", textAlign: "center" }}>
                        Kliknij, aby wybrać zdjęcie
                    </Typography>
                )}
            </Box>
        );
    };

    if (!template.sections.length) {
        return <Typography sx={{ p: 2, opacity: 0.7 }}>Brak sekcji opisu Allegro.</Typography>;
    }

    return (
        <>
            <Box sx={{ p: 2, backgroundColor: "#fff", color: "#242424" }}>
                {template.sections.map((section, sectionIndex) => {
                    const images = section.items.filter((item) => item.type === "IMAGE");
                    const texts = section.items.filter((item) => item.type === "TEXT");
                    const sideBySide = images.length > 0 && texts.length > 0;
                    const twoImages = images.length === 2 && texts.length === 0;

                    return (
                        <Box
                            key={section.id || sectionIndex}
                            sx={{
                                mb: 2,
                                display: sideBySide || twoImages ? "grid" : "block",
                                gridTemplateColumns: sideBySide || twoImages ? "1fr 1fr" : undefined,
                                gap: 2,
                                alignItems: "center",
                            }}
                        >
                            {section.items.map((item, itemIndex) => item.type === "IMAGE"
                                ? renderImage(item, sectionIndex, itemIndex)
                                : (
                                    <Box
                                        key={itemIndex}
                                        dangerouslySetInnerHTML={{ __html: item.content }}
                                    />
                                ))}
                        </Box>
                    );
                })}
            </Box>

            <Dialog open={imageSlot !== null} onClose={closeImagePicker} maxWidth="md" fullWidth>
                <DialogTitle>Wybierz zdjęcie do opisu Allegro</DialogTitle>
                <DialogContent dividers>
                    {selectableImages.length ? (
                        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 2, mb: 2 }}>
                            {selectableImages.map((url) => (
                                <Box
                                    key={url}
                                    onClick={() => chooseImage(url)}
                                    sx={{ border: "1px solid rgba(0,0,0,0.18)", borderRadius: 1, overflow: "hidden", cursor: "pointer", "&:hover": { borderColor: "#1976d2" } }}
                                >
                                    <img src={url} alt="" style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
                                </Box>
                            ))}
                        </Box>
                    ) : (
                        <Typography sx={{ mb: 2 }}>Brak wgranych zdjęć. Dodaj zdjęcia produktu albo wpisz adres poniżej.</Typography>
                    )}
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <TextField
                            fullWidth
                            label="Adres URL nowego zdjęcia"
                            value={customImageUrl}
                            onChange={(event) => setCustomImageUrl(event.target.value)}
                        />
                        <Button variant="contained" disabled={!customImageUrl.trim()} onClick={() => chooseImage(customImageUrl)}>
                            Użyj adresu
                        </Button>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeImagePicker}>Zamknij</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default function AllegroDescriptionEditor({
    template,
    onChange,
    availableImages = [],
    onRemoveAutoSection,
    onRestoreAutomaticSections,
}: AllegroDescriptionEditorProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        setSelectedIndex((current) => Math.min(current, Math.max(0, template.sections.length - 1)));
    }, [template.sections.length]);

    const addSection = (items: TemplateItem[]) => {
        onChange({
            ...template,
            sections: [...template.sections, createUserSection(items)],
        });
        setSelectedIndex(template.sections.length);
    };

    const moveSection = (index: number, direction: "up" | "down") => {
        const target = direction === "up" ? index - 1 : index + 1;
        if (target < 0 || target >= template.sections.length) return;
        const sections = [...template.sections];
        [sections[index], sections[target]] = [sections[target], sections[index]];
        onChange({ ...template, sections });
        setSelectedIndex(target);
    };

    const removeSection = (index: number) => {
        const section = template.sections[index];
        if (section?.origin === "auto") onRemoveAutoSection?.(section.id);
        onChange({
            ...template,
            sections: template.sections.filter((_, itemIndex) => itemIndex !== index),
        });
    };

    const updateItem = (sectionIndex: number, itemIndex: number, item: TemplateItem) => {
        onChange({
            ...template,
            sections: template.sections.map((section, currentSectionIndex) =>
                currentSectionIndex === sectionIndex
                    ? {
                        ...section,
                        items: section.items.map((currentItem, currentItemIndex) =>
                            currentItemIndex === itemIndex ? item : currentItem
                        ),
                    }
                    : section
            ),
        });
    };

    const selectedSection = template.sections[selectedIndex];
    const selectableImages = Array.from(new Set([
        ...availableImages,
        ...template.sections.flatMap((section) =>
            section.items.flatMap((item) => item.type === "IMAGE" && item.url ? [item.url] : [])
        ),
    ])).filter(Boolean);

    return (
        <Box sx={{ mt: 2, mx: { xs: 0, md: 2 } }}>
            <Box sx={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 2.5, p: 2, backgroundColor: "rgba(20, 22, 28, 0.7)" }}>
                <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: 1.5, justifyContent: "space-between", mb: 2 }}>
                    <Box>
                        <Typography variant="h6">Zarządzanie sekcjami Allegro</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                            Liczba sekcji: {template.sections.length}
                        </Typography>
                    </Box>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap flexWrap="wrap">
                        <Button size="small" variant="contained" onClick={() => addSection([{ type: "TEXT", content: "<h2>Nagłówek</h2><p>Tekst</p>" }])}>
                            + Tekst
                        </Button>
                        <Button size="small" variant="outlined" onClick={() => addSection([{ type: "IMAGE", url: "" }, { type: "TEXT", content: "<h2>Nagłówek</h2><p>Tekst</p>" }])}>
                            + Zdjęcie i opis
                        </Button>
                        <Button size="small" variant="outlined" onClick={() => addSection([{ type: "IMAGE", url: "" }, { type: "IMAGE", url: "" }])}>
                            + Dwa zdjęcia
                        </Button>
                        <Button size="small" variant="outlined" onClick={() => addSection([{ type: "IMAGE", url: "" }])}>
                            + Zdjęcie
                        </Button>
                        {onRestoreAutomaticSections ? (
                            <Button size="small" variant="text" onClick={onRestoreAutomaticSections}>
                                Przywróć automatyczne
                            </Button>
                        ) : null}
                    </Stack>
                </Box>

                <Stack spacing={1} sx={{ maxHeight: 420, overflowY: "auto", pr: 0.5 }}>
                    {template.sections.length ? template.sections.map((section, index) => {
                        const selected = selectedIndex === index;
                        const image = section.items.find((item) => item.type === "IMAGE");
                        return (
                            <Box
                                key={section.id || index}
                                onClick={() => setSelectedIndex(index)}
                                sx={{
                                    cursor: "pointer",
                                    borderRadius: 1.5,
                                    border: selected ? "1px solid rgba(130,200,255,0.7)" : "1px solid rgba(255,255,255,0.1)",
                                    backgroundColor: selected ? "rgba(80,110,160,0.25)" : "rgba(36,38,44,0.6)",
                                    p: 1.2,
                                    display: "grid",
                                    gridTemplateColumns: "48px minmax(0, 1fr) auto",
                                    gap: 1,
                                    alignItems: "center",
                                }}
                            >
                                <Box sx={{ width: 44, height: 34, overflow: "hidden", borderRadius: 1, backgroundColor: "rgba(255,255,255,0.05)" }}>
                                    {image?.type === "IMAGE" && image.url ? (
                                        <img src={image.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : null}
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="subtitle2">{sectionLabel(section, index)}</Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.68, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {sectionSummary(section)}
                                    </Typography>
                                </Box>
                                <Typography variant="caption" sx={{ opacity: 0.6 }}>
                                    {section.origin === "auto" ? "Auto" : "Ręcznie"}
                                </Typography>
                            </Box>
                        );
                    }) : (
                        <Typography variant="body2" sx={{ opacity: 0.75 }}>
                            Brak sekcji. Dodaj pierwszą sekcję lub przywróć automatyczne.
                        </Typography>
                    )}
                </Stack>

                {selectedSection ? (
                    <Box sx={{ mt: 2, p: { xs: 1.5, md: 2 }, borderRadius: 1.8, border: "1px solid #3b4554", backgroundColor: "#181c25" }}>
                        <Stack spacing={1.5}>
                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center", pb: 1, borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
                                <Typography variant="subtitle1" sx={{ mr: "auto", color: "#f8fafc", fontWeight: 700 }}>
                                    {sectionLabel(selectedSection, selectedIndex)}
                                </Typography>
                                <Button sx={moveButtonSx} size="small" variant="outlined" disabled={selectedIndex === 0} onClick={() => moveSection(selectedIndex, "up")}>W górę</Button>
                                <Button sx={moveButtonSx} size="small" variant="outlined" disabled={selectedIndex === template.sections.length - 1} onClick={() => moveSection(selectedIndex, "down")}>W dół</Button>
                                <Button size="small" variant="outlined" color="error" onClick={() => removeSection(selectedIndex)}>Usuń</Button>
                            </Box>

                            {selectedSection.items.map((item, itemIndex) => item.type === "TEXT" ? (
                                <Box key={itemIndex}>
                                    <Typography variant="caption" sx={{ color: "#cbd5e1", fontWeight: 700 }}>Treść HTML sekcji</Typography>
                                    <TextField
                                        multiline
                                        minRows={9}
                                        fullWidth
                                        value={item.content}
                                        sx={editorFieldSx}
                                        onChange={(event) => updateItem(selectedIndex, itemIndex, { ...item, content: event.target.value })}
                                    />
                                </Box>
                            ) : (
                                <Box key={itemIndex}>
                                    <Typography variant="caption" sx={{ color: "#cbd5e1", fontWeight: 700 }}>Adres zdjęcia</Typography>
                                    <TextField
                                        fullWidth
                                        value={item.url}
                                        placeholder="Wklej adres zdjęcia lub wybierz miniaturę poniżej"
                                        sx={editorFieldSx}
                                        onChange={(event) => updateItem(selectedIndex, itemIndex, { ...item, url: event.target.value, locked: true })}
                                    />
                                    {selectableImages.length ? (
                                        <Box sx={{ display: "flex", gap: 1, overflowX: "auto", mt: 1, pb: 0.5 }}>
                                            {selectableImages.map((url) => (
                                                <Box
                                                    key={url}
                                                    onClick={() => updateItem(selectedIndex, itemIndex, { ...item, url, locked: true })}
                                                    sx={{ width: 76, height: 52, flex: "0 0 auto", cursor: "pointer", borderRadius: 1, overflow: "hidden", border: item.url === url ? "2px solid #79c8ff" : "1px solid rgba(255,255,255,0.2)" }}
                                                >
                                                    <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                </Box>
                                            ))}
                                        </Box>
                                    ) : null}
                                </Box>
                            ))}
                        </Stack>
                    </Box>
                ) : null}
            </Box>
        </Box>
    );
}
