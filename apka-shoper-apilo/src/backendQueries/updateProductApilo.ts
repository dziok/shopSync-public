import axios from "axios";
import { API_URL } from "../config";
import { toast } from "react-toastify";
import { IFormInput } from "../addProduct/addProduct";

type UpdateProductProps = {
    authToken: string
}

export const UpdateProductApilo = async (
    data: IFormInput,
    props: UpdateProductProps,
    apiloImageUUIDs: string[] | undefined
) => {
    try {
        const response = await axios.put(`${API_URL}/product/apilo`, {
            sku: data.SKU,
            name: data.name,
            tax: 23,
            status: 1,
            quantity: Number(data.stock),
            priceWithTax: data.price,
            description: data.description,
            images: apiloImageUUIDs,
        }, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${props.authToken}`
            }
        });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Błąd HTTP:", error.response?.status, error.response?.data);
            toast.error("Wystąpił błąd podczas aktualizacji produktu w apilo");
        } else {
            console.error("Błąd aplikacji:", error);
            toast.error("Wystąpił błąd podczas aktualizacji produktu w apilo");
        }
        throw error;
    }
};
