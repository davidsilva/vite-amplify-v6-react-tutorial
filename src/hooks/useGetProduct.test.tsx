import { renderHook, waitFor } from "@testing-library/react";
import {
  AuthContextProvider,
  AuthStateType,
  AuthContextType,
} from "../context/AuthContext";
import useGetProduct from "./useGetProduct";
import { ReactNode } from "react";

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

const { graphqlMock } = vi.hoisted(() => {
  return { graphqlMock: vi.fn() };
});

vi.mock("aws-amplify/api", () => ({
  generateClient: vi.fn(() => ({
    graphql: graphqlMock,
  })),
}));

const mockProduct = {
  name: "Test Product",
  description: "Test Description",
  price: "10.99",
  id: "372db325-5f72-49fa-ba8c-ab628c0ed470",
};

describe("useGetProduct", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should return product when getProduct resolves for logged in user", async () => {
    vi.mocked(graphqlMock).mockResolvedValueOnce({
      data: {
        getProduct: mockProduct,
      },
    });

    const wrapper = ({ children }: { children?: ReactNode }) => (
      <AuthContextProvider>{children}</AuthContextProvider>
    );

    const { result } = renderHook(
      () => useGetProduct("372db325-5f72-49fa-ba8c-ab628c0ed470"),
      { wrapper }
    );

    await waitFor(() => result.current.product !== null);

    expect(result.current.product).toEqual(mockProduct);
  });

  test("should return error message when getProduct rejects", async () => {
    vi.mocked(graphqlMock).mockResolvedValueOnce({
      data: {
        getProduct: null,
      },
      errors: ["error fetching product"],
    });

    const wrapper = ({ children }: { children?: ReactNode }) => (
      <AuthContextProvider>{children}</AuthContextProvider>
    );

    const { result } = renderHook(
      () => useGetProduct("372db325-5f72-49fa-ba8c-ab628c0ed470"),
      { wrapper }
    );

    await waitFor(() => result.current.errorMessage !== "");

    expect(result.current.errorMessage).toBe(
      "Error fetching product with ID: 372db325-5f72-49fa-ba8c-ab628c0ed470"
    );
  });

  test("should return product even for anonymous user", async () => {
    vi.mocked(useAuthContextMock).mockReturnValueOnce({
      ...useAuthContextMock(),
      authState: {
        ...useAuthContextMock().authState,
        isLoggedIn: false,
        isAuthStateKnown: true,
        user: null,
        isAdmin: false,
      } as AuthStateType,
    } as AuthContextType);

    vi.mocked(graphqlMock).mockResolvedValueOnce({
      data: {
        getProduct: mockProduct,
      },
    });

    const wrapper = ({ children }: { children?: ReactNode }) => (
      <AuthContextProvider>{children}</AuthContextProvider>
    );

    const { result } = renderHook(
      () => useGetProduct("372db325-5f72-49fa-ba8c-ab628c0ed470"),
      { wrapper }
    );

    await waitFor(() => result.current.product !== null);

    expect(result.current.product).toEqual(mockProduct);
  });
});
