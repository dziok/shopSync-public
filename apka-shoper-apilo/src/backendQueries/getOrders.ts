// api/apilo/GetOrdersStatus5.ts
import axios from "axios";
import { API_URL } from "../config";
import { toast } from "react-toastify";

type GetOrdersProps = {
    authToken: string;
};

export const getOrdersStatus5 = async ({ authToken }: GetOrdersProps) => {
    try {
        const res = await axios.get(
            `${API_URL}/apilo-orders/status-5`, // ścieżka do Twojego endpointu w NestJS
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
            }
        );

        // Załóżmy, że backend zwraca { orders: [...] }
        return res.data.orders ?? res.data;

    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Błąd HTTP:", error.response?.status, error.response?.data);
            toast.error("Wystąpił błąd podczas pobierania zamówień z Apilo");
        } else {
            console.error("Błąd aplikacji:", error);
            toast.error("Wystąpił błąd podczas pobierania zamówień z Apilo");
        }
        return [];
    }
};
