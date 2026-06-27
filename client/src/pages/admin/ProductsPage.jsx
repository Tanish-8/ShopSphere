import { useEffect, useMemo, useState } from "react";
import {
  fetchAllProductsAdmin,
  deleteProductAdmin,
  createProductAdmin,
  updateProductAdmin,
} from "../../services/productService";
import { FALLBACK_PRODUCT_IMAGE } from "../../utils/productImage";

function ProductForm({ initial, onCancel, onSave, saving }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    brand: "",
    price: "",
    stock: "",
    image: "",
    ...initial,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => setForm((f) => ({ ...f, ...initial })), [initial]);

  const validate = () => {
    const e = {};
    if (!form.name) e.name = "Name is required";
    if (!form.description) e.description = "Description is required";
    if (!form.category) e.category = "Category is required";
    if (form.price === "" || Number(form.price) < 0) e.price = "Price must be >= 0";
    if (form.stock === "" || Number(form.stock) < 0) e.stock = "Stock must be >= 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      name: form.name,
      description: form.description,
      category: form.category,
      brand: form.brand,
      price: Number(form.price),
      stock: Number(form.stock),
      image: form.image,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded px-2 py-1" />
        {errors.name && <div className="text-red-600 text-sm">{errors.name}</div>}
      </div>

      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded px-2 py-1" />
        {errors.description && <div className="text-red-600 text-sm">{errors.description}</div>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Category</label>
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border rounded px-2 py-1" />
          {errors.category && <div className="text-red-600 text-sm">{errors.category}</div>}
        </div>
        <div>
          <label className="block text-sm font-medium">Brand</label>
          <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="w-full border rounded px-2 py-1" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium">Price</label>
          <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full border rounded px-2 py-1" />
          {errors.price && <div className="text-red-600 text-sm">{errors.price}</div>}
        </div>
        <div>
          <label className="block text-sm font-medium">Stock</label>
          <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="w-full border rounded px-2 py-1" />
          {errors.stock && <div className="text-red-600 text-sm">{errors.stock}</div>}
        </div>
        <div>
          <label className="block text-sm font-medium">Image URL</label>
          <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="w-full border rounded px-2 py-1" />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-1 border rounded">Cancel</button>
        <button type="submit" disabled={saving} className="px-3 py-1 bg-blue-600 text-white rounded">{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const load = async (opts = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (opts.keyword ?? query) params.keyword = opts.keyword ?? query;
      if (opts.category ?? categoryFilter) params.category = opts.category ?? categoryFilter;
      if (opts.sort ?? sort) params.sort = opts.sort ?? sort;
      const list = await fetchAllProductsAdmin(params);
      setProducts(list);
    } catch (e) {
      setError(e?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category || 'General'));
    return Array.from(set).sort();
  }, [products]);

  const openCreate = () => { setEditing(null); setShowModal(true); };
  const openEdit = (product) => { setEditing(product); setShowModal(true); };

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editing) {
        await updateProductAdmin(editing._id, data);
        setMessage('Product updated');
      } else {
        await createProductAdmin(data);
        setMessage('Product created');
      }
      setShowModal(false);
      await load();
    } catch (e) {
      setMessage(e?.response?.data?.message || e?.message || 'Save failed');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await deleteProductAdmin(id);
      setMessage('Product deleted');
      await load();
    } catch (e) {
      setMessage(e?.response?.data?.message || e?.message || 'Delete failed');
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Manage Products</h1>
        <div className="flex items-center gap-2">
          <button onClick={openCreate} className="px-3 py-2 bg-green-600 text-white rounded">Create Product</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <input placeholder="Search by name..." value={query} onChange={(e) => setQuery(e.target.value)} className="border rounded px-2 py-1 col-span-1 md:col-span-2" />
        <div className="flex gap-2">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="border rounded px-2 py-1">
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="border rounded px-2 py-1">
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="rating">Rating</option>
          </select>
          <button onClick={() => load({ keyword: query, category: categoryFilter, sort })} className="px-3 py-1 bg-blue-600 text-white rounded">Apply</button>
        </div>
      </div>

      {message && <div className="mb-3 text-sm text-green-700">{message}</div>}
      {error && <div className="mb-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-6">No products found.</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded border">
          <table className="min-w-full">
            <thead>
              <tr className="text-left">
                <th className="px-4 py-2">Image</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Stock</th>
                <th className="px-4 py-2">Rating</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className="border-t">
                  <td className="px-4 py-2 w-24"><img src={p.image || FALLBACK_PRODUCT_IMAGE} alt="" className="h-12 w-12 object-cover rounded" /></td>
                  <td className="px-4 py-2">{p.name}</td>
                  <td className="px-4 py-2">{p.category}</td>
                  <td className="px-4 py-2">${p.price.toFixed(2)}</td>
                  <td className="px-4 py-2">{p.stock}</td>
                  <td className="px-4 py-2">{p.rating.toFixed(1)}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="px-2 py-1 border rounded">Edit</button>
                      <button onClick={() => handleDelete(p._id)} className="px-2 py-1 bg-red-600 text-white rounded">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg w-full max-w-2xl p-4">
            <h2 className="text-lg font-semibold mb-3">{editing ? 'Edit Product' : 'Create Product'}</h2>
            <ProductForm initial={editing || {}} onCancel={() => setShowModal(false)} onSave={handleSave} saving={saving} />
          </div>
        </div>
      )}
    </div>
  );
}
