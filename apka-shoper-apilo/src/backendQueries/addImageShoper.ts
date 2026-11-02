import axios from "axios";
import { API_URL } from "../config";
type AddProductProps = {
    authToken: string
}
export const AddImageShoper = async (response: any, selectedImages: File[], imageLinks: string[], props: AddProductProps) => {

    try {
        const productId = await response;

        for (let index = 0; index < imageLinks.length; index += 1) {
            const image = imageLinks[index];
            try {
                const responseImg = await axios.post(`${API_URL}/product-image`, {
                    product_id: productId,
                    url: image,
                    translations: {
                        pl_PL: {
                            name: selectedImages[index]?.name || "zdjęcie"
                        }
                    }
                }, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${props.authToken}`
                    }
                });
                void responseImg.data;
            } catch (error) {
                console.error("Image upload error:", error);
                throw error;
            }
        }
    }
    catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Błąd HTTP:", error.response?.status, error.response?.data);
        } else {
            console.error("Błąd aplikacji:", error);
        }
        throw error;
    };

};
