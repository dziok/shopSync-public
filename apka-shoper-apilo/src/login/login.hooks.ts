import { SubmitHandler } from "react-hook-form";
import { LoginInputs, UseLoginParams } from "./login.types"
import axios from "axios";
import { toast } from "react-toastify";
import { API_URL } from "../config";
import { getApiErrorMessage } from "../backendQueries/apiErrorMessage";


export const useLoginSubmit = ({ setAuthToken, setIsLogged }: UseLoginParams) => {
    const onSubmit: SubmitHandler<LoginInputs> = async (data) => {
        try {
            const response = await axios.post<{ access_token: string; apilo_available: boolean }>(`${API_URL}/auth/login/shoper`, {
                login: data.login,
                password: data.password
            }, {
                headers: {
                    "Content-Type": "application/json",
                }
            });

            setIsLogged(true)
            setAuthToken(response.data.access_token)
            if (!response.data.apilo_available) {
                toast.warn("Zalogowano, ale Apilo jest niedostępne. Otwórz panel Apilo, aby ponowić autoryzację.");
            }
        } catch (error) {
            toast.error(axios.isAxiosError(error) && error.response?.status === 401
                ? "Nieprawidłowy login lub hasło aplikacji."
                : getApiErrorMessage(error, "Nie udało się zalogować. Sprawdź połączenie z backendem."))
            if (axios.isAxiosError(error)) {
                console.error("Błąd HTTP:", error.response?.status);
            } else {
                console.error("Błąd aplikacji podczas logowania.");

            }


        };
    }
    return onSubmit
}
