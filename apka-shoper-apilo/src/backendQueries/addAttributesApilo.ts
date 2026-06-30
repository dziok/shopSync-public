import axios from "axios"
import { API_URL } from "../config"
import { toast } from "react-toastify"
type AddProductProps = {
    authToken: string
}

export const AddAttributesApilo = async (props: AddProductProps, attributes: {}) => {

    try {
        const apiloAttributesResponse = await axios.patch(`${API_URL}/product/attributes`, {
            "attributes": attributes
        }
            , {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${props.authToken}`
                }
            });
    }
    catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Błąd HTTP:", error.response?.status, error.response?.data);
            toast.error("Wystąpił błąd dodawania atrybutów do apilo");
        } else {
            console.error("Błąd aplikacji:", error);
            toast.error("Wystąpił błąd dodawania atrybutów do apilo");
        }
    };
}