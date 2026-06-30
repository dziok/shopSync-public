export type LoginInputs = {
    login: string
    password: string
}

export type UseLoginParams = {
    setIsLogged: React.Dispatch<React.SetStateAction<boolean>>
    setAuthToken: React.Dispatch<React.SetStateAction<string>>
}

export type LoginProps = UseLoginParams & {
    setLogin: React.Dispatch<React.SetStateAction<string>>
    setPassword: React.Dispatch<React.SetStateAction<string>>
}