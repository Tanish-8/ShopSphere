import { useEffect, useState } from "react";
import { fetchProductById, fetchProducts } from "../services/productService";

function useProducts(productId) {
  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        if (productId) {
          const singleProduct = await fetchProductById(productId);
          if (mounted) {
            setProduct(singleProduct || null);
            setProducts([]);
          }
          return;
        }

        const allProducts = await fetchProducts();
        if (mounted) {
          setProducts(Array.isArray(allProducts) ? allProducts : []);
          setProduct(null);
        }
      } catch (requestError) {
        if (mounted) {
          setError(requestError?.response?.data?.message || requestError?.message || "Failed to load products.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [productId]);

  return { products, product, loading, error };
}

export default useProducts;
