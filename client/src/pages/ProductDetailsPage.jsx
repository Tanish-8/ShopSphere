import { useState } from "react";

const images = [
  "https://via.placeholder.com/900x700?text=Product+Image+1",
  "https://via.placeholder.com/900x700?text=Product+Image+2",
  "https://via.placeholder.com/900x700?text=Product+Image+3",
  "https://via.placeholder.com/900x700?text=Product+Image+4"
];

const reviews = [
  { id: 1, name: "Aarav M.", rating: 5, comment: "Excellent quality and quick delivery." },
  { id: 2, name: "Sanya R.", rating: 4, comment: "Good value for money. Looks premium." },
  { id: 3, name: "Dev K.", rating: 5, comment: "Works perfectly. Highly recommended." }
];

function ProductDetailsPage() {
  const [activeImage, setActiveImage] = useState(images[0]);
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="space-y-12">
      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <img src={activeImage} alt="Selected product" className="h-80 w-full object-cover sm:h-[26rem]" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {images.map((image) => (
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
          <p className="text-sm font-medium text-indigo-600">Electronics</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Premium Wireless Headphones</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Experience immersive audio, active noise cancellation, and all-day comfort in this modern wireless design.
          </p>

          <div className="mt-5 flex items-center gap-3">
            <span className="text-3xl font-bold text-gray-900">$129</span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">In Stock</span>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="text-amber-500">★★★★★</span>
            <span className="text-sm text-gray-600">4.8 (148 reviews)</span>
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
            className="mt-7 w-full rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Add to Cart
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
        <div className="mt-6 space-y-4">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{review.name}</h3>
                <span className="text-sm text-amber-500">{"★".repeat(review.rating)}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">{review.comment}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default ProductDetailsPage;
