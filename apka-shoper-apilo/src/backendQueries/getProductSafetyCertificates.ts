import axios from "axios";
import { toast } from "react-toastify";
import { ProductSafetyCertificateResource } from "../types";

interface HandleGetProductSafetyCertificatesProps {
    API_URL: string;
    authToken: string;
    setProductSafetyCertificates: (certificates: ProductSafetyCertificateResource[]) => void;
}

export const handleGetProductSafetyCertificates = async ({
    API_URL,
    authToken,
    setProductSafetyCertificates,
}: HandleGetProductSafetyCertificatesProps): Promise<void> => {
    let allItems: ProductSafetyCertificateResource[] = [];
    let currentPage = 1;
    let totalPages = 1;

    try {
        while (currentPage <= totalPages) {
            const response = await axios.get<{ list: ProductSafetyCertificateResource[]; pages: number }>(
                `${API_URL}/categories/product-safety-certificates`,
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

        setProductSafetyCertificates(allItems);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Błąd podczas pobierania certyfikatów bezpieczeństwa:", error.response?.data || error.message);
            toast.error("Błąd podczas pobierania certyfikatów bezpieczeństwa.");
        } else {
            console.error("Błąd aplikacji:", error);
            toast.error("Wystąpił nieznany błąd.");
        }
    }
};
