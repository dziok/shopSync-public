import axios from "axios";
import { Attribute } from "../types";
import { API_URL } from "../config";
import { toast } from "react-toastify";

export const handleGetAttributeList = async (id: string, authToken: string) => {
    try {
        const response = await axios.get<{ list: Attribute[] }>(`${API_URL}/attribute-groups`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
            },
            params: {
                limit: 50,
                filters: JSON.stringify({
                    attribute_group_id: id,
                }),
            },
        });

        return response.data.list; // Zwracamy listę atrybutów
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Błąd podczas pobierania listy atrybutów:", error.response?.data || error.message);
            toast.error("Błąd podczas pobierania listy atrybutów.");
        } else {
            console.error("Błąd aplikacji:", error);
            toast.error("Wystąpił nieznany błąd.");
        }
        return []; // Zwracamy pustą tablicę w przypadku błędu
    }
};