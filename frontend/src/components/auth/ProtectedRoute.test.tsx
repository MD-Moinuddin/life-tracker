import { act, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "../../store/auth-store";
import { ProtectedRoute } from "./ProtectedRoute";

function renderRoutes() {
  return render(
    <MemoryRouter initialEntries={["/secret"]}>
      <Routes>
        <Route path="/" element={<p>Homepage</p>} />
        <Route path="/login" element={<p>Login page</p>} />
        <Route
          path="/secret"
          element={
            <ProtectedRoute>
              <p>Secret page</p>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  useAuthStore.setState({
    user: null,
    accessToken: null,
    isInitialized: false,
  });
});

describe("ProtectedRoute", () => {
  it("waits for the session check before deciding", () => {
    renderRoutes();

    expect(screen.getByText("Loading…")).toBeDefined();
    expect(screen.queryByText("Homepage")).toBeNull();
  });

  it("shows the page to a signed-in visitor", () => {
    useAuthStore.setState({ accessToken: "token", isInitialized: true });
    renderRoutes();

    expect(screen.getByText("Secret page")).toBeDefined();
  });

  it("sends a visitor with no session to the homepage, not the login page", () => {
    useAuthStore.setState({ isInitialized: true });
    renderRoutes();

    expect(screen.getByText("Homepage")).toBeDefined();
    expect(screen.queryByText("Login page")).toBeNull();
  });

  it("sends a visitor to the homepage the moment they sign out", () => {
    useAuthStore.setState({ accessToken: "token", isInitialized: true });
    renderRoutes();

    act(() => useAuthStore.getState().clearAuth());

    expect(screen.getByText("Homepage")).toBeDefined();
  });

  it("sends a demo visitor to the homepage the moment they exit the demo", () => {
    useAuthStore.setState({ isInitialized: true });
    act(() =>
      useAuthStore.getState().startDemo({
        id: "demo-user",
        name: "Demo visitor",
        email: "",
        createdAt: "2026-01-01T00:00:00.000Z",
        isDemo: true,
      }),
    );
    renderRoutes();
    expect(screen.getByText("Secret page")).toBeDefined();

    act(() => useAuthStore.getState().exitDemo());

    expect(screen.getByText("Homepage")).toBeDefined();
  });
});
