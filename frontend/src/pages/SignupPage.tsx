import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FormStatus } from "../components/auth/FormStatus";
import {
  SignupForm,
  type SignupFormValues,
} from "../components/auth/SignupForm";
import { AuthLayout } from "../components/layout/AuthLayout";
import { LINK_CLASSES } from "../components/ui/links";
import { ApiError } from "../lib/api-client";
import { login, signup } from "../lib/auth-api";
import { ROUTES } from "../lib/routes";
import { useAuthStore } from "../store/auth-store";

export function SignupPage() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  async function handleSignup(values: SignupFormValues) {
    setError(null);
    try {
      await signup(values);
      const result = await login(values);
      setAuth(result);
      navigate(ROUTES.dashboard);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      footer={
        <>
          Already have an account?{" "}
          <Link to={ROUTES.login} className={LINK_CLASSES}>
            Log in
          </Link>
        </>
      }
    >
      <FormStatus message={error} />
      <SignupForm onSubmit={handleSignup} />
    </AuthLayout>
  );
}
