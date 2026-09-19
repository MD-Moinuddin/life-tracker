import { useEffect, useState } from "react";
import { FormStatus } from "./components/auth/FormStatus";
import { LoginForm, type LoginFormValues } from "./components/auth/LoginForm";
import {
  SignupForm,
  type SignupFormValues,
} from "./components/auth/SignupForm";
import { ApiError } from "./lib/api-client";
import { login, refresh, signup } from "./lib/auth-api";
import { useAuthStore } from "./store/auth-store";

function App() {
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const setAuth = useAuthStore((state) => state.setAuth);
  const setInitialized = useAuthStore((state) => state.setInitialized);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    refresh()
      .then(setAuth)
      .catch(() => {
        // No valid refresh cookie (new visitor or expired session) — stay logged out silently.
      })
      .finally(setInitialized);
  }, [setAuth, setInitialized]);

  async function handleSignup(values: SignupFormValues) {
    setSignupError(null);
    try {
      await signup(values);
      const result = await login(values);
      setAuth(result);
    } catch (error) {
      setSignupError(
        error instanceof ApiError ? error.message : "Something went wrong",
      );
    }
  }

  async function handleLogin(values: LoginFormValues) {
    setLoginError(null);
    try {
      const result = await login(values);
      setAuth(result);
    } catch (error) {
      setLoginError(
        error instanceof ApiError ? error.message : "Something went wrong",
      );
    }
  }

  if (!isInitialized) {
    return <p>Loading…</p>;
  }

  if (user) {
    return <p>Logged in as {user.email}</p>;
  }

  return (
    <>
      <section>
        <h2>Sign up</h2>
        <FormStatus message={signupError} />
        <SignupForm onSubmit={handleSignup} />
      </section>
      <section>
        <h2>Log in</h2>
        <FormStatus message={loginError} />
        <LoginForm onSubmit={handleLogin} />
      </section>
    </>
  );
}

export default App;
