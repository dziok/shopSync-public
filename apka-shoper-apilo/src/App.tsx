import React, { useEffect, useState } from 'react';
import './App.css';
import Login from './login/login';
import CategorySelection from './categorySelection';
import { useLoginSubmit } from './login/login.hooks';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [isLogged, setIsLogged] = useState(false)
  const [authToken, setAuthToken] = useState("")
  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")



  const onSubmit = useLoginSubmit({ setIsLogged: setIsLogged, setAuthToken: setAuthToken })

  useEffect(() => {
    const interval = setInterval(() => {
      if (isLogged) {
        onSubmit({ login: login, password: password })
      }
    }, 50 * 60 * 1000); // 50 minut w milisekundach
    return () => clearInterval(interval); // Czyszczenie interwału przy odmontowaniu
  }, [isLogged, login, password]);

  return (
    <>
      {
        isLogged
          ? (<CategorySelection authToken={authToken} />)
          : (<Login
            setLogin={setLogin}
            setPassword={setPassword}
            setAuthToken={setAuthToken}
            setIsLogged={setIsLogged} />)
      }
      <ToastContainer position="top-right" autoClose={5500} limit={3} newestOnTop
        pauseOnHover closeOnClick={false} theme="dark" className="app-toasts" />

    </>
  );
}

export default App;
