import axios from "axios";
import { toast } from "react-toastify";
import { ProductSafetyProducerResource } from "../types";

interface HandleGetProductSafetyProducersProps {
    API_URL: string;
    authToken: string;
    setProductSafetyProducers: (producers: ProductSafetyProducerResource[]) => void;
}

export const handleGetProductSafetyProducers = async ({
    API_URL,
    authToken,
    setProductSafetyProducers,
}: HandleGetProductSafetyProducersProps): Promise<void> => {
    let allItems: ProductSafetyProducerResource[] = [];
    let currentPage = 1;
    let totalPages = 1;

    try {
        while (currentPage <= totalPages) {
            const response = await axios.get<{ list: ProductSafetyProducerResource[]; pages: number }>(
                `${API_URL}/categories/product-safety-producers`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${authToken}`,
                    },
                    params: {
                        limit: 50,
                        page: currentPage,
                    },
                }
            );

            allItems = allItems.concat(response.data.list ?? []);
            totalPages = response.data.pages;
            currentPage++;
        }

        setProductSafetyProducers(allItems);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Błąd podczas pobierania producentów bezpieczeństwa:", error.response?.data || error.message);
            toast.error("Błąd podczas pobierania producentów bezpieczeństwa.");
        } else {
            console.error("Błąd aplikacji:", error);
            toast.error("Wystąpił nieznany błąd.");
        }
    }
};
