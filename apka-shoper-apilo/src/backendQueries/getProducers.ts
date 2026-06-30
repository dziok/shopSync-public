import axios from "axios";
import { toast } from "react-toastify";
import { ProducersResource } from "../types";


interface HandleGetProducersProps {
    API_URL: string;
    authToken: string;
    setProducers: (producers: ProducersResource[]) => void;
}

export const handleGetProducers = async ({
    API_URL,
    authToken,
    setProducers,
}: HandleGetProducersProps): Promise<void> => {
    let allProducers: ProducersResource[] = [];
    let currentPage = 1;
    let totalPages = 1;

    try {
        while (currentPage <= totalPages) {
            const response = await axios.get<{ list: ProducersResource[]; pages: number }>(
                `${API_URL}/categories/producers`,
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

            const normalized = response.data.list.map((producer) => ({
                ...producer,
                producer_id: Number((producer as any).producer_id),
            }));
            allProducers = allProducers.concat(normalized);
            totalPages = response.data.pages;
            currentPage++;
        }

        setProducers(allProducers);
        toast.success("Producenci zostali pomyślnie pobrani.");
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Błąd podczas pobierania producentów:", error.response?.data || error.message);
            toast.error("Błąd podczas pobierania producentów.");
        } else {
            console.error("Błąd aplikacji:", error);
            toast.error("Wystąpił nieznany błąd.");
        }
    }
};
