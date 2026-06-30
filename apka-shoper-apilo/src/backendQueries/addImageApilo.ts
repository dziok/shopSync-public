import axios from "axios";
import { API_URL } from "../config";
import { toast } from "react-toastify";
type AddProductProps = {
    authToken: string
}

export const AddImageApilo = async (props: AddProductProps, selectedImages: File[]) => {
    let apiloPhotos: string[] = []
    try {
        for (let i = 0; i < selectedImages.length; i++) {
            const formData = new FormData();
            formData.append("file", selectedImages[i]);

            const apiloImageResponse = await axios.post(
                `${API_URL}/product-image/apilo`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        "Authorization": `Bearer ${props.authToken}`,
                    },
                }
            );
            apiloPhotos.push(apiloImageResponse.data.uuid);
            toast.success(`Zdjęcie ${i + 1} poprawnie dodane!`);
        }
        return apiloPhotos
    } catch (error) {
        console.error("Image upload error:", error);
        toast.error("Błąd podczas dodawania zdjęcia do apilo");
    }
}