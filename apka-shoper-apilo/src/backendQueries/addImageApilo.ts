import axios from "axios";
import { API_URL } from "../config";
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
        }
        return apiloPhotos
    } catch (error) {
        console.error("Image upload error:", error);
        throw error;
    }
}
