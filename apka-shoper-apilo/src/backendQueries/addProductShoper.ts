import axios from "axios";
import { IFormInput } from "../addProduct/addProduct";
import { API_URL } from "../config";
type AddProductProps = {
    authToken: string
}
export const AddProductShoper = async (data: IFormInput, attributes: {}, nameCZ: string, nameSK: string, gaugeId: number, props: AddProductProps, category_id: string, relatedPackId?: string) => {
    try {
        const normalizeIdValue = (value: unknown) => {
            if (value == null) return null;
            if (typeof value === "number" && Number.isFinite(value)) return value;
            if (typeof value === "string") {
                const trimmed = value.trim();
                if (!trimmed) return null;
                const numeric = Number(trimmed);
                return Number.isFinite(numeric) ? numeric : trimmed;
            }
            return null;
        };
        const safetyProducerId = normalizeIdValue((data as any).productSafetyProducerId) ?? 0;
        const safetyCertificateIds = Array.isArray((data as any).productSafetyCertificateIds)
            ? (data as any).productSafetyCertificateIds
            : [];
        const safetyInformation: Record<string, unknown> = {};
        if (safetyProducerId) safetyInformation.gpsr_producer_id = safetyProducerId;
        if (safetyCertificateIds.length) safetyInformation.gpsr_certificates = safetyCertificateIds;
        const response = await axios.post(`${API_URL}/product/shoper`, {
            producer_id: data.producer,
            category_id: category_id,
            code: data.SKU,
            pkwiu: "-",
            translations: {
                pl_PL: {
                    name: data.name,
                    active: data.active,
                    description: data.description,
                },
                cs_CZ: {
                    name: nameCZ,
                    active: data.active,
                    description: data.descriptionCZ,
                },
                sk_SK: {
                    name: nameSK,
                    active: data.active,
                    description: data.descriptionSK,
                }
            },

            stock: {
                price: data.price,
                active: 1,
                stock: data.stock,
                gfx_id: 103221,
                delivery_id: 1
            },
            attributes: attributes,
            gauge_id: gaugeId,
            ...(Object.keys(safetyInformation).length
                ? { safety_information: safetyInformation }
                : {}),
            ...(relatedPackId ? { related_pack_id: relatedPackId } : {}),
        }, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${props.authToken}`
            }
        });
        return response.data
    }
    catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Błąd HTTP:", error.response?.status, error.response?.data);
        } else {
            console.error("Błąd aplikacji:", error);
        }
        throw error;
    };
}
