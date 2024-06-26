import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import Landing from "./Landing";
import { MemoryRouter } from "react-router-dom";
import {
  AuthContextProvider,
  AuthStateType,
  AuthContextType,
} from "../context/AuthContext";
import { ReactNode } from "react";
import { CartContextProvider } from "../context/CartContext";

const renderWithAuthContext = (component: ReactNode) => {
  render(
    <MemoryRouter>
      <AuthContextProvider>
        <CartContextProvider>{component}</CartContextProvider>
      </AuthContextProvider>
    </MemoryRouter>
  );
};

vi.mock("aws-amplify/api", () => {
  return {
    generateClient: () => ({
      graphql: vi.fn().mockResolvedValue({
        data: {
          listProducts: {
            items: [
              {
                id: 1,
                name: "Product 1",
                description: "Description 1",
                price: 10,
              },
              {
                id: 2,
                name: "Product 2",
                description: "Description 2",
                price: 20,
              },
            ],
          },
        },
      }),
    }),
  };
});

vi.mock("aws-amplify/auth");

const { useAuthContextMock } = vi.hoisted(() => {
  return {
    useAuthContextMock: vi.fn().mockReturnValue({
      signInStep: "",
      setSignInStep: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
      confirmSignUp: vi.fn(),
      confirmSignIn: vi.fn(),
      resetAuthState: vi.fn(),
      intendedPath: null,
      setIntendedPath: vi.fn(),
      authState: {
        isLoggedIn: true,
        isAuthStateKnown: true,
        user: { username: "testuser", userId: "123" },
        isAdmin: false,
        sessionId: "123",
      } as AuthStateType,
    } as AuthContextType),
  };
});

vi.mock("../context/AuthContext", async () => ({
  AuthContextProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  useAuthContext: useAuthContextMock,
}));

describe("Landing", () => {
  describe("when user is logged in", () => {
    beforeEach(async () => {
      vi.clearAllMocks();

      vi.mocked(useAuthContextMock).mockReturnValueOnce({
        ...useAuthContextMock(),
        authState: {
          ...useAuthContextMock().authState,
          isLoggedIn: true,
          isAdmin: false,
          user: { username: "testuser", userId: "123" },
        },
      });

      renderWithAuthContext(<Landing />);
      await waitFor(() => {});
    });

    test("renders 'Is logged in: yes' when user is logged in", async () => {
      const isLoggedInText = await screen.findByText(/Is logged in: yes/i);
      expect(isLoggedInText).toBeInTheDocument();
    });

    test("renders the ListProducts component when user is logged in", async () => {
      expect(
        await screen.findByRole("heading", { level: 1, name: /list products/i })
      ).toBeInTheDocument();
      const listProductsElement = screen.getByRole("list");
      expect(listProductsElement).toBeInTheDocument();
    });
  });

  describe("when user is not logged in", () => {
    beforeEach(async () => {
      vi.clearAllMocks();

      vi.mocked(useAuthContextMock).mockReturnValueOnce({
        ...useAuthContextMock(),
        authState: {
          ...useAuthContextMock().authState,
          isLoggedIn: false,
          isAdmin: false,
          user: null,
        },
      });

      renderWithAuthContext(<Landing />);
      await waitFor(() => {});
    });

    test("renders 'Is logged in: no' when user is not logged in", () => {
      const isLoggedInText = screen.getByText(/Is logged in: no/i);
      expect(isLoggedInText).toBeInTheDocument();
    });

    test("renders the ListProducts component when user is not logged in", async () => {
      expect(
        await screen.findByRole("heading", { level: 1, name: /list products/i })
      ).toBeInTheDocument();
      const listProductsElement = screen.getByRole("list");
      expect(listProductsElement).toBeInTheDocument();
    });
  });
});
