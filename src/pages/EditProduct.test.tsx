import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useParams } from "react-router-dom";
import { updateProduct } from "../graphql/mutations";
import EditProduct from "./EditProduct";
import useGetProduct from "../hooks/useGetProduct";
import { toast } from "react-toastify";

vi.mock("react-router-dom", async () => {
  const router = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );
  return {
    ...router,
    useParams: vi
      .fn()
      .mockReturnValue({ productId: "372db325-5f72-49fa-ba8c-ab628c0ed470" }),
  };
});

vi.mock("../hooks/useGetProduct", () => {
  const actual = vi.importActual<typeof import("../hooks/useGetProduct")>(
    "../hooks/useGetProduct"
  );
  return {
    ...actual,
    default: vi.fn().mockReturnValue({
      product: {
        name: "Test Product",
        description: "Test Description",
        price: 1099,
        id: "372db325-5f72-49fa-ba8c-ab628c0ed470",
        image: "chucknorris.jpg",
      },
      errorMessage: null,
      isLoading: false,
    }),
  };
});

const { graphqlMock } = vi.hoisted(() => {
  return {
    graphqlMock: vi.fn().mockImplementation((query) => {
      if (query === updateProduct) {
        return Promise.resolve({
          data: {
            updateProduct: {
              name: "Test Product",
              description: "New Test Description",
              price: 1099,
              id: "372db325-5f72-49fa-ba8c-ab628c0ed470",
              image: "chucknorris.jpg",
            },
          },
        });
      }
    }),
  };
});

const { patchMock } = vi.hoisted(() => {
  return { patchMock: vi.fn() };
});

vi.mock("aws-amplify/api", () => ({
  generateClient: vi.fn(() => ({
    graphql: graphqlMock,
  })),
  patch: patchMock,
}));

vi.mock("aws-amplify/auth");

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

const mockProduct = {
  name: "Test Product",
  description: "Test Description",
  price: 1099,
  id: "372db325-5f72-49fa-ba8c-ab628c0ed470",
};

const newValues = {
  name: "Test Product",
  description: "New Test Description",
  price: 1099,
};

const fillInForm = async (
  productName: string,
  description: string,
  price: string
) => {
  const user = userEvent.setup();

  const productNameInput = screen.getByRole("textbox", {
    name: /product name/i,
  });
  const descriptionInput = screen.getByRole("textbox", {
    name: /description/i,
  });
  const priceInput = screen.getByRole("spinbutton", { name: /price/i });

  await user.clear(productNameInput);
  await user.type(productNameInput, productName);
  await user.clear(descriptionInput);
  await user.type(descriptionInput, description);
  await user.clear(priceInput);
  await user.type(priceInput, price);
};

const renderEditProduct = () => {
  render(
    <MemoryRouter>
      <EditProduct />
    </MemoryRouter>
  );
};

describe("EditProduct", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    vi.mocked(useParams).mockReturnValue({
      productId: mockProduct.id,
    });

    vi.mocked(useGetProduct).mockReturnValue({
      product: {
        __typename: "Product",
        id: "some-id",
        name: "some-name",
        description: "some-description",
        price: 1099,
        isArchived: false,
        reviews: null,
        image: undefined,
        createdAt: "2022-01-01T00:00:00Z",
        updatedAt: "2022-01-01T00:00:00Z",
        owner: undefined,
      },
      errorMessage: "",
      isLoading: false,
    });

    const response = {
      statusCode: 200,
      body: JSON.stringify({
        message: "Product created successfully",
        product: {
          ...mockProduct,
          stripeProductId: "stripeProduct1",
          stripePriceId: "stripePrice1",
        },
      }),
    };

    patchMock.mockResolvedValue(response);

    renderEditProduct();
    await waitFor(() => {});
  });

  test("renders EditProduct page, showing form containing test data", async () => {
    await waitFor(async () => {
      expect(
        await screen.findByRole("form", { name: /product form/i })
      ).toBeInTheDocument();
    });

    expect(useGetProduct).toHaveBeenCalledWith(mockProduct.id);
  });

  test("calls ProductAPI with updated product data when form is submitted", async () => {
    const user = userEvent.setup();

    const form = await screen.findByRole("form", {
      name: /^product form$/i,
    });

    expect(form).toBeInTheDocument();

    await fillInForm("Test Product", "New Test Description", "10.99");

    // Submit the form
    await user.click(screen.getByRole("button", { name: /submit/i }));

    // Assert that graphql() was called with the updated product data
    await waitFor(() => {
      expect(patchMock).toHaveBeenCalledWith({
        apiName: "ProductAPI",
        path: `/product/${mockProduct.id}`,
        options: {
          body: {
            operation: "update",
            payload: {
              Item: {
                id: mockProduct.id,
                ...newValues,
              },
            },
          },
        },
      });
    });
  });
});

describe("EditProduct error handling: can't get product", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    vi.mocked(useParams).mockReturnValue({
      productId: mockProduct.id,
    });

    vi.mocked(useGetProduct).mockReturnValueOnce({
      product: null,
      errorMessage: "Error getting product",
      isLoading: false,
    });

    const response = {
      statusCode: 200,
      body: JSON.stringify({
        message: "Product created successfully",
        product: {
          ...mockProduct,
          stripeProductId: "stripeProduct1",
          stripePriceId: "stripePrice1",
        },
      }),
    };

    patchMock.mockResolvedValue(response);

    renderEditProduct();
    await waitFor(() => {});
  });

  test("displays an alert message if getting the product fails, e.g., the product doesn't exist", async () => {
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringMatching(/error getting product/i)
      );
    });
  });
});

describe("EditProduct error handling: can't update product", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    vi.mocked(useParams).mockReturnValue({
      productId: mockProduct.id,
    });

    vi.mocked(useGetProduct).mockReturnValueOnce({
      product: {
        __typename: "Product",
        id: "some-id",
        name: "some-name",
        description: "some-description",
        price: 1099,
        isArchived: false,
        reviews: null,
        image: undefined,
        createdAt: "2022-01-01T00:00:00Z",
        updatedAt: "2022-01-01T00:00:00Z",
        owner: undefined,
      },
      errorMessage: "",
      isLoading: false,
    });

    patchMock.mockRejectedValue(new Error("An error occurred"));

    renderEditProduct();
    await waitFor(() => {});
  });

  test("displays an alert message if updating the product fails", async () => {
    const user = userEvent.setup();

    const form = await screen.findByRole("form", {
      name: /^product form$/i,
    });

    expect(form).toBeInTheDocument();

    await fillInForm("Test Product", "New Test Description", "10.99");

    // Submit the form
    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringMatching(/error updating product/i)
      );
      expect(toast.error).toHaveBeenCalledTimes(1);
    });
  });
});
