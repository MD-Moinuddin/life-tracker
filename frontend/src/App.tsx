import { LoginForm } from "./components/auth/LoginForm";
import { SignupForm } from "./components/auth/SignupForm";

function App() {
  return (
    <>
      <section>
        <h2>Sign up</h2>
        <SignupForm onSubmit={(values) => console.log("signup", values)} />
      </section>
      <section>
        <h2>Log in</h2>
        <LoginForm onSubmit={(values) => console.log("login", values)} />
      </section>
    </>
  );
}

export default App;
