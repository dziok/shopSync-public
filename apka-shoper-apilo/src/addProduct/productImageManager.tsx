import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography } from "@mui/material";
import { handleImageUpload } from "../image-host";
import { appendUniqueImages, imageFileKey, moveImageItem } from "./productImageOrder";

export function useProductImages() {
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imageLinks, setImageLinks] = useState<string[]>([]);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [uploadAttempt, setUploadAttempt] = useState(0);
    const currentImages = useRef(selectedImages);
    const uploadedUrls = useRef(new Map<string, string>());
    currentImages.current = selectedImages;
    const uploadKey = JSON.stringify(selectedImages.map(imageFileKey).sort());

    useEffect(() => {
        if (!selectedImages.length) {
            setImageLinks([]);
            setUploadingImages(false);
            return;
        }
        const files = selectedImages.filter(file => !uploadedUrls.current.has(imageFileKey(file)));
        if (!files.length) {
            setImageLinks(selectedImages.map(file => uploadedUrls.current.get(imageFileKey(file)) ?? ""));
            setUploadingImages(false);
            return;
        }
        let cancelled = false;
        setImageLinks(selectedImages.map(file => uploadedUrls.current.get(imageFileKey(file)) ?? ""));
        setUploadingImages(true);
        void handleImageUpload(files).then(urls => {
            if (cancelled) return;
            files.forEach((file, index) => {
                if (urls?.[index]) uploadedUrls.current.set(imageFileKey(file), urls[index]);
            });
            setImageLinks(currentImages.current.map(file => uploadedUrls.current.get(imageFileKey(file)) ?? ""));
        }).finally(() => {
            if (!cancelled) setUploadingImages(false);
        });
        return () => { cancelled = true; };
    }, [uploadKey, uploadAttempt]);

    const imagesReady = selectedImages.length === imageLinks.length && selectedImages.every((file, index) => {
        const url = uploadedUrls.current.get(imageFileKey(file));
        return Boolean(url) && imageLinks[index] === url;
    });

    const addImages = (files: File[]) => {
        setSelectedImages(previous => appendUniqueImages(previous, files));
    };

    const moveImage = (from: number, to: number) => {
        setSelectedImages(previous => moveImageItem(previous, from, to));
        setImageLinks(previous => moveImageItem(previous, from, to));
    };

    const removeImage = (index: number) => {
        setSelectedImages(previous => previous.filter((_, position) => position !== index));
        setImageLinks(previous => previous.filter((_, position) => position !== index));
    };

    const clearImages = () => {
        setSelectedImages([]);
        setImageLinks([]);
    };

    const retryImages = () => setUploadAttempt(previous => previous + 1);

    return { selectedImages, setSelectedImages, imageLinks, setImageLinks, uploadingImages, imagesReady, addImages, moveImage, removeImage, clearImages, retryImages };
}

type ImageManagerProps = {
    selectedImages: File[];
    uploadingImages: boolean;
    imagesReady: boolean;
    addImages: (files: File[]) => void;
    moveImage: (from: number, to: number) => void;
    removeImage: (index: number) => void;
    clearImages: () => void;
    retryImages: () => void;
};

export function ProductImageManager({ selectedImages, uploadingImages, imagesReady, addImages, moveImage, removeImage, clearImages, retryImages }: ImageManagerProps) {
    const [open, setOpen] = useState(false);
    const [previews, setPreviews] = useState<string[]>([]);
    const draggedIndex = useRef<number | null>(null);

    useEffect(() => {
        const urls = selectedImages.map(file => URL.createObjectURL(file));
        setPreviews(urls);
        return () => urls.forEach(url => URL.revokeObjectURL(url));
    }, [selectedImages]);

    const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        addImages(Array.from(event.target.files ?? []));
        event.target.value = "";
    };

    const onFileDrop = (event: DragEvent<HTMLDivElement>) => {
        if (!event.dataTransfer.files.length) return;
        event.preventDefault();
        addImages(Array.from(event.dataTransfer.files).filter(file => file.type.startsWith("image/")));
    };

    return <Box sx={{ display: "grid", gap: 1 }} onDragOver={event => {
        if (event.dataTransfer.types.includes("Files")) event.preventDefault();
    }} onDrop={onFileDrop}>
        <Box sx={{ border: "1px dashed", borderColor: "divider", borderRadius: 1, p: 2, display: "grid", gap: 1, justifyItems: "start" }}>
            <Button variant="outlined" component="label">
                Dodaj zdjęcia
                <input type="file" multiple accept="image/*" hidden onChange={onFileChange} />
            </Button>
            <Typography variant="body2" color="text.secondary">
                {uploadingImages ? "Przesyłanie zdjęć..." : selectedImages.length ? `Wybrano zdjęć: ${selectedImages.length}` : "Wybierz zdjęcia lub przeciągnij pliki"}
            </Typography>
            {selectedImages.length > 0 && <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button type="button" size="small" onClick={() => setOpen(true)}>Zarządzaj zdjęciami</Button>
                {!uploadingImages && !imagesReady && <Button type="button" size="small" onClick={retryImages}>Ponów przesyłanie</Button>}
                <Button type="button" size="small" color="error" onClick={clearImages}>Wyczyść</Button>
            </Box>}
        </Box>
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>Zarządzanie zdjęciami
                <IconButton aria-label="Zamknij" title="Zamknij" onClick={() => setOpen(false)} sx={{ position: "absolute", right: 8, top: 8 }}>×</IconButton>
            </DialogTitle>
            <DialogContent dividers>
                {previews.length === 0 ? <Typography variant="body2">Brak zdjęć.</Typography> :
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 2 }}>
                        {previews.map((preview, index) => <Box key={preview} draggable
                            onDragStart={() => { draggedIndex.current = index; }}
                            onDragOver={event => event.preventDefault()}
                            onDrop={event => {
                                event.preventDefault();
                                event.stopPropagation();
                                if (draggedIndex.current != null) moveImage(draggedIndex.current, index);
                                draggedIndex.current = null;
                            }}
                            onDragEnd={() => { draggedIndex.current = null; }}
                            sx={{ position: "relative", border: "1px solid", borderColor: "divider", borderRadius: 1, overflow: "hidden", cursor: "grab" }}>
                            <Box component="img" src={preview} alt={`Zdjęcie ${index + 1}`} sx={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
                            <Box sx={{ position: "absolute", top: 4, left: 4, bgcolor: "rgba(0,0,0,0.7)", color: "white", px: 0.75, borderRadius: 0.5, fontSize: 12 }}>{index + 1}</Box>
                            <IconButton size="small" aria-label={`Usuń zdjęcie ${index + 1}`} title="Usuń zdjęcie" onClick={() => removeImage(index)}
                                sx={{ position: "absolute", top: 4, right: 4, bgcolor: "rgba(0,0,0,0.7)", color: "white", "&:hover": { bgcolor: "rgba(0,0,0,0.9)" } }}>×</IconButton>
                        </Box>)}
                    </Box>}
            </DialogContent>
            <DialogActions><Button type="button" onClick={() => setOpen(false)}>Zamknij</Button></DialogActions>
        </Dialog>
    </Box>;
}
