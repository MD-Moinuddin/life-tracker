import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FormStatus } from "../components/auth/FormStatus";
import { LoginForm, type LoginFormValues } from "../components/auth/LoginForm";
import { ApiError } from "../lib/api-client";
import { login } from "../lib/auth-api";
import { useAuthStore } from "../store/auth-store";

export function LoginPage() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(values: LoginFormValues) {
    setError(null);
    try {
      const result = await login(values);
      setAuth(result);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <section>
      <h2>Log in</h2>
      <FormStatus message={error} />
      <LoginForm onSubmit={handleLogin} />
      <p>
        Don&apos;t have an account? <Link to="/signup">Sign up</Link>
      </p>
    </section>
  );
}
