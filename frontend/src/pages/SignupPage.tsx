import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FormStatus } from "../components/auth/FormStatus";
import {
  SignupForm,
  type SignupFormValues,
} from "../components/auth/SignupForm";
import { ApiError } from "../lib/api-client";
import { login, signup } from "../lib/auth-api";
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
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <section>
      <h2>Sign up</h2>
      <FormStatus message={error} />
      <SignupForm onSubmit={handleSignup} />
      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </section>
  );
}
