import axios from "axios";
import { API_URL } from "../config";
import { toast } from "react-toastify";

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
}: UpdateProductShoperInput) => {
    try {
        const response = await axios.put(`${API_URL}/product/${productId}`, basePayload, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${props.authToken}`
            }
        });
        if (baseSuccessMessage) {
            toast.success(baseSuccessMessage);
        }

        const entries = Object.entries(translations).filter(([, value]) => value);
        for (const [lang, payload] of entries) {
            try {
                await axios.put(`${API_URL}/product/${productId}`, {
                    translations: {
                        [lang]: payload,
                    },
                }, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${props.authToken}`
                    }
                });
                toast.success(`Zaktualizowano opis ${getLangLabel(lang)}.`);
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    console.error(`Błąd aktualizacji ${lang}:`, error.response?.data || error.message);
                } else {
                    console.error(`Błąd aktualizacji ${lang}:`, error);
                }
                toast.error(`Błąd aktualizacji opisu ${getLangLabel(lang)}.`);
            }
        }

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Błąd HTTP:", error.response?.status, error.response?.data);
            toast.error("Wystąpił błąd podczas aktualizacji produktu w Shoper");
        } else {
            console.error("Błąd aplikacji:", error);
            toast.error("Wystąpił błąd podczas aktualizacji produktu w Shoper");
        }
        throw error;
    }
};
