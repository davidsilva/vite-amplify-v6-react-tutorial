import { useAuthContext } from "../context/AuthContext";
import { SignIn as SignInForm } from "../components";

const SignIn = () => {
  const { authState } = useAuthContext();
  const isLoggedIn = authState?.isLoggedIn;
  const isAdmin = authState?.isAdmin;

  if (isLoggedIn) {
    return <p>You are already signed in.</p>;
  }

  return (
    <>
      <h1>Sign In</h1>
      <p>Are you an admin? {isAdmin ? "yes" : "no"}</p>
      <SignInForm />
    </>
  );
};
export default SignIn;
