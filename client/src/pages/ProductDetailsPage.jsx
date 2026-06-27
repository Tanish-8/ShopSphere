import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import useCart from "../hooks/useCart";
import { addToWishlist as apiAddToWishlist, removeFromWishlist as apiRemoveFromWishlist, fetchWishlist } from '../services/wishlistService';
import useAuth from '../hooks/useAuth';
import useProducts from "../hooks/useProducts";
import { fetchProductDetails, postProductReview } from '../services/productService';

function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { product: hookProduct, loading, error } = useProducts(id);
  const [productOverride, setProductOverride] = useState(null);
  const product = productOverride ?? hookProduct;
  const { addItem } = useCart();
  const { user, isAuthenticated } = useAuth();

  const galleryImages = useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.images) && product.images.length > 0) return product.images;
    if (product.image) return [product.image];
    if (product.thumbnail) return [product.thumbnail];
    return ["https://via.placeholder.com/900x700?text=Product+Image"];
  }, [product]);

  const [activeImage, setActiveImage] = useState("https://via.placeholder.com/900x700?text=Product+Image");
  const [quantity, setQuantity] = useState(1);
  const [successMessage, setSuccessMessage] = useState("");
  const [wishlisted, setWishlisted] = useState(false);

  const displayName = product?.name || product?.title || "Product";
  const displayCategory = product?.category?.name || product?.category || "General";
  const displayDescription = product?.description || "No description available for this product yet.";
  const displayPrice = Number(product?.price || 0).toFixed(2);
  const displayRating = Math.max(0, Math.min(5, Math.round(Number(product?.rating || product?.averageRating || 0))));
  const displayStock = Number(product?.stock || product?.quantity || 0);

  // Reviews form state
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    setProductOverride(null);
  }, [id]);

  useEffect(() => {
    if (galleryImages.length > 0) {
      setActiveImage(galleryImages[0]);
    }
  }, [galleryImages]);

  useEffect(() => {
    if (!product) return;
    if (!isAuthenticated) {
      setWishlisted(false);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const list = await fetchWishlist();
        if (mounted) setWishlisted(list.some(p => (p._id || p.id) === (product._id || product.id)));
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [product, isAuthenticated]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = setTimeout(() => setSuccessMessage(""), 2500);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const handleAddToCart = () => {
    addItem(
      {
        productId: product._id || product.id,
        name: displayName,
        image: galleryImages[0],
        price: Number(product?.price || 0),
        countInStock: Math.max(0, displayStock)
      },
      quantity
    );

    setSuccessMessage("Item added to cart.");
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError('');
    setSubmittingReview(true);
    try {
      await postProductReview(product._id || product.id, { rating: ratingInput, comment: commentInput });
      const updated = await fetchProductDetails(product._id || product.id);
      setProductOverride(updated);
      setCommentInput("");
      setSuccessMessage('Review submitted.');
    } catch (err) {
      setReviewError(err?.response?.data?.message || err?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-600 shadow-sm">
        Loading product details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700 shadow-sm">{error}</div>
    );
  }

  if (!product) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-600 shadow-sm">
        Product not found.
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <img src={activeImage} alt="Selected product" className="h-80 w-full object-cover sm:h-[26rem]" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {galleryImages.map((image) => (
              <button
                key={image}
                type="button"
                className={`overflow-hidden rounded-lg border ${activeImage === image ? "border-indigo-500" : "border-gray-200"}`}
                onClick={() => setActiveImage(image)}
              >
                <img src={image} alt="Product thumbnail" className="h-20 w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-medium text-indigo-600">{displayCategory}</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">{displayName}</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            {displayDescription}
          </p>

          <div className="mt-5 flex items-center gap-3">
            <span className="text-3xl font-bold text-gray-900">${displayPrice}</span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              {displayStock > 0 ? "In Stock" : "Out of Stock"}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="text-amber-500">{"★".repeat(displayRating || 1)}</span>
            <span className="text-sm text-gray-600">{Number(product?.rating || product?.averageRating || 0).toFixed(1)} rating</span>
          </div>

          <div className="mt-7 flex items-center gap-4">
            <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
              Quantity
            </label>
            <div className="inline-flex items-center rounded-lg border border-gray-300">
              <button
                type="button"
                className="px-3 py-2 text-gray-700 hover:bg-gray-100"
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
              >
                -
              </button>
              <input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                className="w-14 border-x border-gray-300 py-2 text-center text-sm outline-none"
              />
              <button
                type="button"
                className="px-3 py-2 text-gray-700 hover:bg-gray-100"
                onClick={() => setQuantity((prev) => prev + 1)}
              >
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={displayStock <= 0}
            className="mt-7 w-full rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Add to Cart
          </button>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={async () => {
                if (!isAuthenticated) return navigate('/login');
                try {
                  if (wishlisted) {
                    await apiRemoveFromWishlist(product._id || product.id);
                    setWishlisted(false);
                  } else {
                    await apiAddToWishlist(product._id || product.id);
                    setWishlisted(true);
                  }
                  window.dispatchEvent(new Event("wishlist-updated"));
                } catch (e) { console.error(e) }
              }}
              className={`px-4 py-2 rounded-lg border ${wishlisted ? 'bg-pink-600 text-white' : 'bg-white text-gray-700'}`}>
              {wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            </button>
          </div>
          {successMessage && <p className="mt-3 text-sm font-medium text-emerald-600">{successMessage}</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
        <div className="mt-4 flex items-center gap-3">
          <div className="text-3xl font-bold text-gray-900">{Number(product?.rating || 0).toFixed(1)}</div>
          <div className="text-amber-500">{"★".repeat(Math.max(1, Math.round(Number(product?.rating || 0))))}</div>
          <div className="text-sm text-gray-600">{product?.numReviews || 0} reviews</div>
        </div>

        <div className="mt-6 space-y-4">
          {(Array.isArray(product?.reviews) ? [...product.reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : []).map((review) => (
            <article key={review._id || review.id} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{review.name}</h3>
                <span className="text-sm text-amber-500">{"★".repeat(Math.max(1, Math.round(review.rating || 0)))}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">{review.comment}</p>
              <div className="mt-2 text-xs text-gray-400">{new Date(review.createdAt).toLocaleString()}</div>
            </article>
          ))}
        </div>

        <div className="mt-6">
          {isAuthenticated ? (
            (product?.reviews || []).some(r => (r.user === user?._id) || (r.user?._id === user?._id)) ? (
              <div className="text-sm text-gray-600">You have already reviewed this product.</div>
            ) : (
              <form onSubmit={handleSubmitReview}>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700">Your Rating</label>
                  <select value={ratingInput} onChange={(e) => setRatingInput(Number(e.target.value))} className="mt-1 rounded border px-3 py-2">
                    {[5, 4, 3, 2, 1].map(v => <option key={v} value={v}>{v} star{v > 1 ? 's' : ''}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700">Comment</label>
                  <textarea value={commentInput} onChange={(e) => setCommentInput(e.target.value)} rows={4} className="mt-1 w-full rounded border px-3 py-2" />
                </div>
                {reviewError && <div className="text-sm text-red-600 mb-2">{reviewError}</div>}
                <button type="submit" disabled={submittingReview} className="rounded bg-indigo-600 px-4 py-2 text-white">{submittingReview ? 'Submitting...' : 'Submit Review'}</button>
              </form>
            )
          ) : (
            <div className="text-sm">Please <Link to="/login" className="text-indigo-600">login</Link> to write a review.</div>
          )}
        </div>
      </section>
    </div>
  );
}

export default ProductDetailsPage;
