import axios from "axios";
import { toast } from "react-toastify";
import { API_URL } from "./config";

export const handleImageUpload = async (selectedImages: File[]): Promise<string[] | undefined> => {
    const formData = new FormData();

    selectedImages.forEach((image: File) => {
        if (image instanceof File) {
            formData.append('images', image);
        } else {
            console.error('Niepoprawny typ pliku:', image);
        }
    });

    try {
        const response = await axios.post<{ fileUrls: string[] }>(`${API_URL}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        toast.success('Zdjęcia zostały poprawnie załadowane!');

        return response.data.fileUrls; // Zwracamy listę URL-i z Cloudinary
    } catch (error) {
        toast.error('Wystąpił błąd podczas ładowania zdjęć.');
        console.error('Błąd uploadu zdjęć.');
        return undefined;
    }
};
