import axios from "axios";
import { API_URL } from "../config";
import { toast } from "react-toastify";
import { IFormInput } from "../addProduct/addProduct";
type AddProductProps = {
    authToken: string
}
export const AddProductApilo = async (data: IFormInput, props: AddProductProps, apiloImageUUIDs: string[] | undefined) => {
    try {
        const apiloPrductsListResponse = await axios.get(`${API_URL}/product/apiloProductslist`, {
            params: {
                sku: data.SKU.toUpperCase()
            },
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${props.authToken}`
            }
        });
        if (apiloPrductsListResponse.data.totalCount != 0) {
            try {
                const apiloDeleteResponse = await axios.delete(
                    `${API_URL}/product/apiloProductDelete/${apiloPrductsListResponse.data.products[0].id}`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${props.authToken}`
                        }
                    }
                );
            } catch (error) {
                console.error("Product delete error:", error);
                toast.error("Wystąpił błąd podczas usuwania produktu");
                throw error;
            }
        }
        const apiloResponse = await axios.post(`${API_URL}/product/apilo`,
            [
                {
                    "sku": data.SKU,
                    "name": data.name,
                    "tax": 23,
                    "status": 1,
                    "quantity": Number(data.stock),
                    "priceWithTax": data.price,
                    "description": data.description,
                    "images": apiloImageUUIDs,
                }
            ]
            , {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${props.authToken}`
                }
            });
        return apiloResponse.data
    }
    catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Błąd HTTP:", error.response?.status, error.response?.data);
            toast.error("Wystąpił błąd podczas dodawania produktu do apilo");
        } else {
            console.error("Błąd aplikacji:", error);
            toast.error("Wystąpił błąd podczas dodawania produktu do apilo");
        }
    };
}