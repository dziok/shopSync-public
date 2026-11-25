import { useForm } from "react-hook-form"
import { LoginInputs, LoginProps } from "./login.types"
import { useLoginSubmit } from "./login.hooks"

const Login = (props: LoginProps) => {
    const onSubmitRequest = useLoginSubmit(props)

    const onSubmit = async (values: LoginInputs) => {
        props.setLogin(values.login)
        props.setPassword(values.password)
        await onSubmitRequest(values)
    }

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginInputs>()



    return (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
            <form
                style={{ display: 'flex', flexDirection: 'column' }}
                onSubmit={(handleSubmit(onSubmit))}>

                <input placeholder="login" autoComplete="username" aria-label="Login" {...register("login", { required: "Wpisz login.", setValueAs: value => value.trim() })} />
                {errors.login && <span role="alert">{errors.login.message}</span>}
                <input placeholder="hasło" type="password" autoComplete="current-password" aria-label="Hasło" {...register("password", { required: "Wpisz hasło." })} />
                {errors.password && <span role="alert">{errors.password.message}</span>}

                <button type="submit" disabled={isSubmitting}>Zaloguj</button>
            </form>
        </div>
    )
}


export default Login;
