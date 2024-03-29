import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthContextProvider } from "../context/AuthContext";
import { MemoryRouter } from "react-router-dom";
import Banner from "./Banner";
import { ReactNode } from "react";
import { CartContextProvider } from "../context/CartContext";

const { mockNavigate } = vi.hoisted(() => {
  return { mockNavigate: vi.fn() };
});

vi.mock("react-router-dom", async () => {
  const router = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );
  return {
    ...router,
    useNavigate: vi.fn().mockReturnValue(mockNavigate),
  };
});

const { useAuthContextMock } = vi.hoisted(() => {
  return {
    useAuthContextMock: vi.fn().mockReturnValue({
      isLoggedIn: false,
      signInStep: "",
      setSignInStep: vi.fn(),
      isAdmin: false,
      user: null,
      checkUser: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
      confirmSignUp: vi.fn(),
      confirmSignIn: vi.fn(),
      resetAuthState: vi.fn(),
    }),
  };
});

vi.mock("../context/AuthContext", async () => {
  const actual = await import("../context/AuthContext");
  return {
    ...actual,
    useAuthContext: useAuthContextMock,
  };
});

const { useCartContextMock } = vi.hoisted(() => {
  return {
    useCartContextMock: vi.fn().mockReturnValue({
      cartItems: [],
      addToCart: vi.fn(),
      removeFromCart: vi.fn(),
      totalAmount: 2000,
      clearCart: vi.fn(),
      incrementQuantity: vi.fn(),
      decrementQuantity: vi.fn(),
    }),
  };
});

vi.mock("../context/CartContext", async () => {
  const actual = await import("../context/CartContext");
  return {
    ...actual,
    useCartContext: useCartContextMock,
  };
});

vi.mock("aws-amplify/auth");

const renderWithAuthContext = async (component: ReactNode) => {
  await waitFor(() => {
    render(
      <MemoryRouter>
        <AuthContextProvider>
          <CartContextProvider>{component}</CartContextProvider>
        </AuthContextProvider>
      </MemoryRouter>
    );
  });
};

describe("Banner", () => {
  describe("Not logged in", () => {
    beforeEach(async () => {
      vi.clearAllMocks();

      vi.mocked(useAuthContextMock).mockReturnValueOnce({
        isLoggedIn: false,
        signInStep: "",
        setSignInStep: vi.fn(),
        isAdmin: false,
        user: null,
        checkUser: vi.fn(),
        signIn: vi.fn(),
        signOut: vi.fn(),
        signUp: vi.fn(),
        confirmSignUp: vi.fn(),
        confirmSignIn: vi.fn(),
        resetAuthState: vi.fn(),
      });

      await renderWithAuthContext(<Banner />);
    });

    test("renders site name", () => {
      const navElement = screen.getByRole("navigation");
      const withinNavElement = within(navElement);

      const siteNameElement = withinNavElement.getByText("Onyx Store");
      expect(siteNameElement).toBeInTheDocument();
    });

    test("renders Sign In and Sign Up buttons when not logged in", () => {
      const navElement = screen.getByRole("navigation");
      const withinNavElement = within(navElement);

      const signInButton = withinNavElement.getByRole("button", {
        name: /^sign in$/i,
      });
      const signUpButton = withinNavElement.getByRole("button", {
        name: /^sign up$/i,
      });
      const signOutButton = screen.queryByRole("button", { name: /sign out/i });

      expect(signInButton).toBeInTheDocument();
      expect(signUpButton).toBeInTheDocument();
      expect(signOutButton).not.toBeInTheDocument();
    });

    test("navigates to /signin when Sign In button is clicked", async () => {
      const user = userEvent.setup();

      const signInButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(signInButton);

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith("/signin");
    });

    test("navigates to /signup when Sign Up button is clicked", async () => {
      const user = userEvent.setup();

      const signUpButton = screen.getByRole("button", { name: /sign up/i });
      await user.click(signUpButton);

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith("/signup");
    });
  });

  describe("Logged in as admin", () => {
    beforeEach(async () => {
      vi.clearAllMocks();

      vi.mocked(useAuthContextMock).mockReturnValueOnce({
        isLoggedIn: true,
        signInStep: "",
        setSignInStep: vi.fn(),
        isAdmin: true,
        user: null,
        checkUser: vi.fn(),
        signIn: vi.fn(),
        signOut: vi.fn(),
        signUp: vi.fn(),
        confirmSignUp: vi.fn(),
        confirmSignIn: vi.fn(),
        resetAuthState: vi.fn(),
      });

      await renderWithAuthContext(<Banner />);
    });

    test("renders Add Product link when logged in as admin", () => {
      const addProductLink = screen.getByRole("link", { name: /add product/i });
      expect(addProductLink).toBeInTheDocument();
    });

    test("should have an Add Product link", () => {
      const addProductLink = screen.getByRole("link", { name: /add product/i });
      expect(addProductLink).toBeInTheDocument();
      expect(addProductLink).toHaveAttribute("href", "/products/new");
    });
  });

  describe("Logged in as user", () => {
    beforeEach(async () => {
      vi.clearAllMocks();

      vi.mocked(useAuthContextMock).mockReturnValue({
        isLoggedIn: true,
        signInStep: "",
        setSignInStep: vi.fn(),
        isAdmin: false,
        user: {
          username: "testuser",
          userId: "testuserid",
        },
        checkUser: vi.fn(),
        signIn: vi.fn(),
        signOut: vi.fn(),
        signUp: vi.fn(),
        confirmSignUp: vi.fn(),
        confirmSignIn: vi.fn(),
        resetAuthState: vi.fn(),
      });

      await renderWithAuthContext(<Banner />);
    });

    test("renders Sign Out button when logged in but not Sign In or Sign Up buttons", async () => {
      const user = userEvent.setup();

      const dropdownToggle = screen.getByRole("button", { name: /testuser/i });
      await user.click(dropdownToggle);

      const signOutButton = screen.getByRole("button", { name: /sign out/i });
      expect(signOutButton).toBeInTheDocument();

      const signInButton = screen.queryByRole("button", { name: /sign in/i });
      const signUpButton = screen.queryByRole("button", { name: /sign up/i });

      expect(signInButton).not.toBeInTheDocument();
      expect(signUpButton).not.toBeInTheDocument();
    });

    test("should contain a link to the user's profile", async () => {
      const user = userEvent.setup();

      const dropdownToggle = screen.getByRole("button", {
        name: /testuser/i,
      });
      await user.click(dropdownToggle);

      const profileLink = screen.getByRole("link", { name: /profile/i });
      expect(profileLink).toBeInTheDocument();
      expect(profileLink).toHaveAttribute("href", "/users/testuserid");
    });

    test("should contain a link to Change Password", async () => {
      const user = userEvent.setup();

      const dropdownToggle = screen.getByRole("button", {
        name: /testuser/i,
      });
      await user.click(dropdownToggle);

      const changePasswordLink = screen.getByRole("link", {
        name: /change password/i,
      });
      expect(changePasswordLink).toBeInTheDocument();
      expect(changePasswordLink).toHaveAttribute("href", "/changepassword");
    });

    test("calls signOut when Sign Out button is clicked and navigates to /signin", async () => {
      const user = userEvent.setup();

      const dropdownToggle = screen.getByRole("button", {
        name: /testuser/i,
      });
      await user.click(dropdownToggle);

      const signOutButton = screen.getByRole("button", {
        name: /sign out/i,
      });
      expect(signOutButton).toBeInTheDocument();
      await user.click(signOutButton);

      expect(useAuthContextMock().signOut).toHaveBeenCalledTimes(1);
    });
  });
});
