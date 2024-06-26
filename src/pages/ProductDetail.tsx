import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { generateClient, GraphQLResult } from "aws-amplify/api";
import { Button, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { archiveProduct, restoreProduct } from "../graphql/customMutations";
import { getProductWithReviews } from "../graphql/customQueries";
import { GetProductWithReviewsQuery } from "../API";
import { useAuthContext } from "../context/AuthContext";
import { useCartContext } from "../context/CartContext";
import { Review } from "../components";
import { S3_URL } from "../constants";

const client = generateClient();

function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<
    GetProductWithReviewsQuery["getProduct"] | null
  >(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { authState } = useAuthContext();
  const isLoggedIn = authState?.isLoggedIn;
  const isAdmin = authState?.isAdmin;
  const isAuthStateKnown = authState?.isAuthStateKnown;
  const { addToCart } = useCartContext();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        console.error("no product id provided");
        return;
      }

      try {
        const result = (await client.graphql({
          query: getProductWithReviews,
          variables: { id: productId },
          authMode: isLoggedIn ? "userPool" : "iam",
        })) as GraphQLResult<GetProductWithReviewsQuery>;

        const productData = result.data?.getProduct;

        console.log("productData: ", productData);
        if (!productData || result.errors) {
          setErrorMessage("Could not get product with ID: " + productId);
          return;
        }

        setProduct(productData);
      } catch (err) {
        console.error("error fetching product: ", err);
        setErrorMessage("Error fetching product with ID: " + productId);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthStateKnown) fetchProduct();
  }, [productId, isLoggedIn, isAuthStateKnown]);

  const handleEdit = () => {
    if (!product) return;

    navigate(`edit`);
  };

  const handleArchiveOrRestore = async () => {
    if (!product) return;

    try {
      if (product?.isArchived) {
        await client.graphql({
          query: restoreProduct,
          variables: { id: product.id },
        });
      } else {
        await client.graphql({
          query: archiveProduct,
          variables: { id: product.id },
        });
      }
      setProduct((prevProduct) => {
        if (!prevProduct) return null;
        return { ...prevProduct, isArchived: !prevProduct.isArchived };
      });
    } catch (err) {
      console.error("error updating product: ", err);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (errorMessage) {
    return <div>{errorMessage}</div>;
  }

  return (
    <>
      <Card>
        <Card.Body>
          {product?.image && (
            <Card.Img
              src={
                product.image.startsWith("http://") ||
                product.image.startsWith("https://")
                  ? product.image
                  : `${S3_URL}${product.image}`
              }
              alt={product.name}
              className="product-image"
            />
          )}

          <Card.Title>{product?.name}</Card.Title>
          <Card.Text>{product?.description}</Card.Text>
          <Card.Text>{product?.price && product.price / 100}</Card.Text>
          <p>{product?.reviews?.items?.length || 0} reviews</p>
          <div>
            {isAdmin && (
              <div>
                <Button onClick={handleEdit}>Edit</Button>
                <Button onClick={handleArchiveOrRestore}>
                  {product?.isArchived ? "Restore" : "Archive"}
                </Button>
              </div>
            )}
            {product && (
              <Button onClick={() => addToCart(product, 1)}>Add to Cart</Button>
            )}
          </div>
        </Card.Body>
      </Card>
      <h2>Reviews</h2>
      {product?.reviews?.items?.length === 0 && <p>No reviews yet</p>}
      {product?.reviews?.items
        ?.filter((review) => !review?.isArchived)
        .map((review) => (
          <Review reviewId={review?.id} key={review?.id} />
        ))}
    </>
  );
}

export default ProductDetail;
