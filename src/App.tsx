import React from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import {
  HomeLayout,
  Landing,
  AddProduct,
  SignUp,
  SignIn,
  ChangePassword,
} from "./pages";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import Container from "react-bootstrap/Container";
import { AuthContextProvider } from "./context/AuthContext";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeLayout />,
    children: [
      {
        index: true,
        element: <Landing />,
      },
      {
        path: "add",
        element: (
          <Authenticator>
            <AddProduct />
          </Authenticator>
        ),
      },

      {
        path: "signup",
        element: <SignUp />,
      },
      {
        path: "signin",
        element: <SignIn />,
      },
      {
        path: "changepassword/:username",
        element: <ChangePassword />,
      },
    ],
  },
]);

const App = () => {
  return (
    <React.StrictMode>
      <AuthContextProvider>
        <Container className="p-3">
          <RouterProvider router={router} />
        </Container>
      </AuthContextProvider>
    </React.StrictMode>
  );
};

export default App;
