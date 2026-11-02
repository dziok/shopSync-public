import axios from "axios";
import { API_URL } from "../config";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "./apiErrorMessage";

type UpdateProductProps = {
    authToken: string;
};

type TranslationPayload = {
    name: string;
    description: string;
    active: boolean;
};

type UpdateProductShoperInput = {
    productId: number;
    basePayload: Record<string, unknown>;
    translations: Record<string, TranslationPayload | undefined>;
    props: UpdateProductProps;
    baseSuccessMessage?: string;
    finalAttributes?: Record<number, string>;
    verify?: () => Promise<void>;
};

const getLangLabel = (lang: string) => {
    if (lang === "pl_PL") return "PL";
    if (lang === "cs_CZ") return "CZ";
    if (lang === "sk_SK") return "SK";
    return lang;
};

export const UpdateProductShoper = async ({
    productId,
    basePayload,
    translations,
    props,
    baseSuccessMessage,
    finalAttributes,
    verify,
}: UpdateProductShoperInput) => {
    try {
        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${props.authToken}`,
        };
        const url = `${API_URL}/product/${productId}`;
        const response = await axios.put(url, basePayload, { headers });
        const entries = Object.entries(translations).filter(([, value]) => value);
        let failedTranslations = 0;
        for (const [lang, payload] of entries) {
            try {
                await axios.put(url, {
                    translations: {
                        [lang]: payload,
                    },
                }, { headers });
            } catch (error) {
                failedTranslations += 1;
                if (axios.isAxiosError(error)) {
                    console.error(`Błąd aktualizacji ${lang}:`, error.response?.data || error.message);
                } else {
                    console.error(`Błąd aktualizacji ${lang}:`, error);
                }
                toast.error(getApiErrorMessage(error, `Nie udało się zaktualizować opisu ${getLangLabel(lang)}.`));
            }
        }
        if (finalAttributes) {
            await axios.put(url, { attributes: finalAttributes }, { headers });
        }
        if (verify) await verify();
        if (failedTranslations) {
            toast.warning(`Produkt zaktualizowano częściowo. Nie zapisano ${failedTranslations} opisów.`);
        } else {
            toast.success(baseSuccessMessage || "Produkt w Shoperze został zaktualizowany.");
        }

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Błąd HTTP:", error.response?.status, error.response?.data);
        } else {
            console.error("Błąd aplikacji:", error);
        }
        throw error;
    }
};
