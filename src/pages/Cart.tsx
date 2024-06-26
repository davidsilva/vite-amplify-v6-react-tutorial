import { useCartContext } from "../context/CartContext";
import { CartItem } from "../API";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import { useEffect } from "react";

const Cart = () => {
  const {
    cartItemsProcess,
    removeFromCart,
    clearCart,
    incrementQuantity,
    decrementQuantity,
    totalAmount,
    fetchCartItems,
  } = useCartContext();

  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  const handleIncrementQuantity = (item: CartItem) => {
    console.log("increment", item);
    incrementQuantity(item);
  };

  const HandleDecrementQuantity = (item: CartItem) => {
    console.log("decrement", item);
    decrementQuantity(item);
  };

  const handleRemoveItem = (item: CartItem) => {
    console.log("remove", item);
    removeFromCart(item);
  };

  const handleCheckout = () => {
    console.log("checkout");
  };

  const handleClearCart = () => {
    console.log("clear");
    clearCart();
  };

  if (cartItemsProcess.status !== "SUCCESS") {
    return <div>Loading...</div>;
  }

  return (
    <>
      <h1>Cart</h1>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Subtotal</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {cartItemsProcess.value.items.map(
            (item) =>
              item.product && (
                <tr key={item.id}>
                  <td>{item.product.name}</td>
                  <td>
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(item.product.price / 100)}
                  </td>
                  <td>{item.quantity}</td>
                  <td>
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format((item.product.price * item.quantity) / 100)}
                  </td>
                  <td>
                    <Button
                      onClick={() => handleIncrementQuantity(item)}
                      aria-label="increment quantity"
                    >
                      +
                    </Button>
                    <Button
                      onClick={() => HandleDecrementQuantity(item)}
                      aria-label="decrement quantity"
                    >
                      -
                    </Button>
                    <Button
                      onClick={() => handleRemoveItem(item)}
                      aria-label="remove from cart"
                    >
                      X
                    </Button>
                  </td>
                </tr>
              )
          )}
          <tr>
            <td colSpan={3}>Total</td>
            <td>
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(totalAmount)}
            </td>
            <td>
              <Button onClick={() => handleClearCart()}>Clear Cart</Button>
              <Button onClick={() => handleCheckout()}>Checkout</Button>
            </td>
          </tr>
        </tbody>
      </Table>
    </>
  );
};
export default Cart;
