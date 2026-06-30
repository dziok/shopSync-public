import { SubmitHandler } from "react-hook-form";
import { LoginInputs, LoginProps, UseLoginParams } from "./login.types"
import axios from "axios";
import { toast } from "react-toastify";
import { API_URL } from "../config";


export const useLoginSubmit = ({ setAuthToken, setIsLogged }: UseLoginParams) => {
    const onSubmit: SubmitHandler<LoginInputs> = async (data) => {
        try {
            const response = await axios.post(`${API_URL}/auth/login/shoper`, {
                login: data.login,
                password: data.password
            }, {
                headers: {
                    "Content-Type": "application/json",
                }
            });

            setIsLogged(true)
            setAuthToken(response.data.access_token)
        } catch (error) {
            toast.error("Błąd autoryzacji")
            if (axios.isAxiosError(error)) {
                console.error("Błąd HTTP:", error.response?.status);
            } else {
                console.error("Błąd aplikacji podczas logowania.");

            }


        };
    }
    return onSubmit
}
