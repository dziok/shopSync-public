import axios from "axios";
import { API_URL } from "../config";

export const handleTranslateCZ = async (text: string): Promise<string> => {
    try {
        const response = await axios.post(`${API_URL}/translate`, {
            text,
            targetLang: "CS",
        });

        return response.data.translated;
    } catch (err) {
        console.error("Translation error:", err);
        return "";
    }
};

export const handleTranslateSK = async (text: string): Promise<string> => {
    try {
        const response = await axios.post(`${API_URL}/translate`, {
            text,
            targetLang: 'SK',
        });

        return response.data.translated;
    } catch (err) {
        console.error('Translation error:', err);
        return "";
    }
};