import axios from "axios";
import { API_URL } from "../config";
import { toast } from "react-toastify";
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
                toast.success("Zdjęcie produktu poprawnie dodane");
                void responseImg.data;
            } catch (error) {
                console.error("Image upload error:", error);
                toast.error("Wystąpił błąd podczas dodawania zdjęcia");
                throw error;
            }
        }
    }
    catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Błąd HTTP:", error.response?.status, error.response?.data);
            toast.error("Wystąpił błąd dodawania zdjecia do shopera");
        } else {
            console.error("Błąd aplikacji:", error);
            toast.error("Wystąpił błąd dodawania zdjecia do shopera");
        }
    };

};
