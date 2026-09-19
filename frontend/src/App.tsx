import { SignupForm } from "./components/auth/SignupForm";

function App() {
  return <SignupForm onSubmit={(values) => console.log(values)} />;
}

export default App;
