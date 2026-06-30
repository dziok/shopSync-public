import { useForm } from "react-hook-form"
import { LoginInputs, LoginProps } from "./login.types"
import { useLoginSubmit } from "./login.hooks"

const Login = (props: LoginProps) => {
    const onSubmitRequest = useLoginSubmit(props)

    const onSubmit = (values: LoginInputs) => {
        props.setLogin(values.login)
        props.setPassword(values.password)
        onSubmitRequest(values)
    }

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginInputs>()



    return (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
            <form
                style={{ display: 'flex', flexDirection: 'column' }}
                onSubmit={(handleSubmit(onSubmit))}>

                <input placeholder="login" {...register("login")} />
                <input placeholder="hasło" type="password" {...register("password", { required: true })} />
                {errors.password && <span>This field is required</span>}

                <button type="submit" >zaloguj</button>
            </form>
        </div>
    )
}


export default Login;