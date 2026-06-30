// utils/handleGetAttributeList.ts
import axios from "axios";
import { toast } from "react-toastify";
import { Attribute } from "../types";

interface HandleGetAttributeListProps {
    API_URL: string;
    authToken: string;
    setAttributeList: (data: Attribute[]) => void;
    attributeGroupId: string;
}

export const handleGetAttributeList = async ({
    API_URL,
    authToken,
    setAttributeList,
    attributeGroupId,
}: HandleGetAttributeListProps): Promise<Attribute[]> => {
    let allAttributes: Attribute[] = [];
    const limit = 50;

    const fetchPaged = async (url: string, params: Record<string, unknown>) => {
        const results: Attribute[] = [];
        const seenIds = new Set<number>();
        let offset = 0;
        let totalCount: number | null = null;
        while (true) {
            const response = await axios.get<{
                list?: Attribute[];
                count?: number | string;
                pages?: number | string;
            }>(url, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                params: {
                    limit,
                    offset,
                    ...params,
                },
            });
            const list = response.data.list ?? [];
            list.forEach((attr) => {
                const id = Number((attr as any).attribute_id);
                if (!Number.isFinite(id)) return;
                if (seenIds.has(id)) return;
                seenIds.add(id);
                results.push(attr);
            });
            const parsedCount = Number(response.data.count);
            if (Number.isFinite(parsedCount) && parsedCount > 0) {
                totalCount = parsedCount;
            }
            if (list.length === 0) {
                break;
            }
            offset += limit;
            if (totalCount !== null && offset >= totalCount) {
                break;
            }
            if (list.length < limit) {
                break;
            }
        }
        return results;
    };

    try {
        allAttributes = await fetchPaged(`${API_URL}/attributes`, {
            filters: JSON.stringify({
                attribute_group_id: attributeGroupId,
            }),
        });

        setAttributeList(allAttributes);
        toast.success("Atrybuty zostały pomyślnie pobrane.");
        return allAttributes;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Błąd podczas pobierania listy atrybutów:", error.response?.data || error.message);
            toast.error("Błąd podczas pobierania listy atrybutów.");
        } else {
            console.error("Błąd aplikacji:", error);
            toast.error("Wystąpił nieznany błąd.");
        }
        return [];
    }
};
