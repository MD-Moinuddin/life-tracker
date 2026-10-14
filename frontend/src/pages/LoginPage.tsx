import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FormStatus } from "../components/auth/FormStatus";
import { LoginForm, type LoginFormValues } from "../components/auth/LoginForm";
import { AuthLayout } from "../components/layout/AuthLayout";
import { LINK_CLASSES } from "../components/ui/links";
import { ApiError } from "../lib/api-client";
import { login } from "../lib/auth-api";
import { ROUTES } from "../lib/routes";
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
      navigate(ROUTES.dashboard);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link to={ROUTES.signup} className={LINK_CLASSES}>
            Sign up
          </Link>
        </>
      }
    >
      <FormStatus message={error} />
      <LoginForm onSubmit={handleLogin} />
    </AuthLayout>
  );
}
