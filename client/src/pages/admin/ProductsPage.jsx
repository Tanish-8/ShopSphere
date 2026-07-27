import { useEffect, useMemo, useState } from "react";
import {
  fetchAllProductsAdmin,
  deleteProductAdmin,
  createProductAdmin,
  updateProductAdmin,
} from "../../services/productService";
import { FALLBACK_PRODUCT_IMAGE } from "../../utils/productImage";
import { CATEGORIES } from "../../../../shared/categories.js";

function ProductForm({ initial, onCancel, onSave, saving }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    brand: "",
    price: "",
    stock: "",
    image: "",
    sku: "",
    featuresString: "",
    ...initial,
  });

  // Prefill helper
  useEffect(() => {
    if (initial) {
      setForm((f) => ({
        ...f,
        ...initial,
        featuresString: Array.isArray(initial.features) ? initial.features.join("\n") : "",
      }));
    }
  }, [initial]);

  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.category.trim()) e.category = "Category is required";
    if (form.price === "" || Number(form.price) < 0) e.price = "Price must be >= 0";
    if (form.stock === "" || Number(form.stock) < 0) e.stock = "Stock must be >= 0";
    if (!form.sku.trim()) e.sku = "SKU code is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      brand: form.brand.trim() || "Unbranded",
      price: Number(form.price),
      stock: Number(form.stock),
      image: form.image.trim() || FALLBACK_PRODUCT_IMAGE,
      sku: form.sku.trim().toUpperCase(),
      features: form.featuresString.split("\n").map(f => f.trim()).filter(Boolean),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4 text-left">
      <div>
        <label className="block text-xs font-extrabold text-gray-400 uppercase mb-1">Product Name</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full h-10 rounded-xl border border-gray-300 bg-gray-50 px-3 text-xs outline-none focus:border-indigo-500"
        />
        {errors.name && <p className="text-xs font-bold text-red-600 mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-xs font-extrabold text-gray-400 uppercase mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-xs outline-none focus:border-indigo-500"
        />
        {errors.description && <p className="text-xs font-bold text-red-600 mt-1">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-extrabold text-gray-400 uppercase mb-1">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full h-10 rounded-xl border border-gray-300 bg-white px-3 text-xs outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">Select Category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {errors.category && <p className="text-xs font-bold text-red-600 mt-1">{errors.category}</p>}
        </div>
        <div>
          <label className="block text-xs font-extrabold text-gray-400 uppercase mb-1">Brand</label>
          <input
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
            className="w-full h-10 rounded-xl border border-gray-300 bg-gray-50 px-3 text-xs outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-extrabold text-gray-400 uppercase mb-1">SKU Code</label>
          <input
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            placeholder="e.g. SKU-ELEC-181"
            className="w-full h-10 rounded-xl border border-gray-300 bg-gray-50 px-3 text-xs outline-none focus:border-indigo-500"
          />
          {errors.sku && <p className="text-xs font-bold text-red-600 mt-1">{errors.sku}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-extrabold text-gray-400 uppercase mb-1">Price ($)</label>
          <input
            type="number"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="w-full h-10 rounded-xl border border-gray-300 bg-gray-50 px-3 text-xs outline-none focus:border-indigo-500"
          />
          {errors.price && <p className="text-xs font-bold text-red-600 mt-1">{errors.price}</p>}
        </div>
        <div>
          <label className="block text-xs font-extrabold text-gray-400 uppercase mb-1">Stock Count</label>
          <input
            type="number"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            className="w-full h-10 rounded-xl border border-gray-300 bg-gray-50 px-3 text-xs outline-none focus:border-indigo-500"
          />
          {errors.stock && <p className="text-xs font-bold text-red-600 mt-1">{errors.stock}</p>}
        </div>
      </div>

      <div>
        <label className="block text-xs font-extrabold text-gray-400 uppercase mb-1">Key Highlights (One per line)</label>
        <textarea
          value={form.featuresString}
          onChange={(e) => setForm({ ...form, featuresString: e.target.value })}
          rows={3}
          placeholder="e.g. Titanium build&#10;5.3K Video&#10;Waterproof"
          className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-xs outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-xs font-extrabold text-gray-400 uppercase mb-1">Image URL</label>
        <input
          value={form.image}
          onChange={(e) => setForm({ ...form, image: e.target.value })}
          placeholder="https://images.unsplash.com/..."
          className="w-full h-10 rounded-xl border border-gray-300 bg-gray-50 px-3 text-xs outline-none focus:border-indigo-500"
        />
      </div>

      <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 px-4 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="h-10 px-5 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer shadow-sm"
        >
          {saving ? "Saving..." : "Save Product"}
        </button>
      </div>
    </form>
  );
}

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState("all"); // "all" | "inventory" | "bulk"
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sort, setSort] = useState("newest");

  // Modals & Messages
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Bulk import state
  const [bulkImportText, setBulkImportText] = useState("");
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Stock Adjustment Modal
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [adjustValue, setAdjustValue] = useState(0);
  const [adjustmentLogs, setAdjustmentLogs] = useState([]); // local history logs

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
      setError(e?.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [categoryFilter, sort]);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category || "General"));
    return Array.from(set).sort();
  }, [products]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    load();
  };

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editing && editing._id) {
        await updateProductAdmin(editing._id, data);
        setMessage("Product updated successfully.");
      } else {
        await createProductAdmin(data);
        setMessage("Product created successfully.");
      }
      setShowModal(false);
      await load();
    } catch (e) {
      setMessage(e?.response?.data?.message || e?.message || "Save failed.");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProductAdmin(id);
      setMessage("Product deleted successfully.");
      await load();
    } catch (e) {
      setMessage(e?.response?.data?.message || e?.message || "Delete failed.");
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDuplicate = (p) => {
    setEditing({
      name: `${p.name} (Copy)`,
      description: p.description,
      category: p.category,
      brand: p.brand,
      price: p.price,
      stock: p.stock,
      image: p.image,
      sku: `${p.sku || "SKU"}-COPY`,
      features: p.features || [],
    });
    setShowModal(true);
  };

  // Stock Adjustment Submit
  const handleStockAdjustSave = async () => {
    if (!adjustingProduct) return;
    setSaving(true);
    try {
      const newStock = Number(adjustValue);
      await updateProductAdmin(adjustingProduct._id, { stock: newStock });
      
      // Log history locally
      const change = newStock - adjustingProduct.stock;
      setAdjustmentLogs(prev => [
        {
          sku: adjustingProduct.sku || "N/A",
          name: adjustingProduct.name,
          change: change >= 0 ? `+${change}` : `${change}`,
          newStock: newStock,
          at: new Date().toLocaleTimeString(),
        },
        ...prev
      ]);

      setAdjustingProduct(null);
      setMessage("Stock inventory updated.");
      await load();
    } catch (e) {
      alert("Failed to adjust stock.");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Bulk Export
  const handleBulkExport = () => {
    const headers = "Name,Category,Brand,Price,Stock,Rating,SKU\n";
    const rows = products.map((p) => (
      `"${p.name.replace(/"/g, '""')}",` +
      `"${p.category.replace(/"/g, '""')}",` +
      `"${p.brand.replace(/"/g, '""')}",` +
      `${p.price},` +
      `${p.stock},` +
      `${p.rating},` +
      `"${p.sku || ""}"`
    )).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `product_catalog_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Bulk Import Parser (JSON Array format)
  const handleBulkImportSubmit = async (e) => {
    e.preventDefault();
    if (!bulkImportText.trim()) return;
    setBulkProcessing(true);
    setError(null);
    try {
      const array = JSON.parse(bulkImportText.trim());
      if (!Array.isArray(array)) {
        throw new Error("Input must be a valid JSON array of product objects.");
      }

      let importedCount = 0;
      for (const item of array) {
        await createProductAdmin({
          name: item.name || "Bulk Product",
          description: item.description || "Bulk imported description.",
          category: item.category || "General",
          brand: item.brand || "Unbranded",
          price: Number(item.price || 0),
          stock: Number(item.stock || 0),
          image: item.image || FALLBACK_PRODUCT_IMAGE,
          sku: item.sku || `SKU-BULK-${Math.floor(Math.random() * 1000)}`,
          features: Array.isArray(item.features) ? item.features : []
        });
        importedCount++;
      }

      setMessage(`Successfully imported ${importedCount} products.`);
      setBulkImportText("");
      await load();
    } catch (err) {
      setError(err.message || "Failed to parse import JSON list.");
    } finally {
      setBulkProcessing(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Calculations for inventory overview
  const inventoryStats = useMemo(() => {
    let totalStock = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalVal = 0;

    products.forEach((p) => {
      totalStock += p.stock;
      totalVal += p.stock * p.price;
      if (p.stock === 0) outOfStockCount++;
      else if (p.stock <= 5) lowStockCount++;
    });

    return { totalStock, lowStockCount, outOfStockCount, totalVal };
  }, [products]);

  return (
    <div className="space-y-6 text-left pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Product Catalog Hub</h1>
          <p className="text-xs text-gray-500 mt-1">Manage listings, adjust inventory stocks, and export/import csv data logs.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setEditing(null); setShowModal(true); }}
            className="px-4 py-2 bg-indigo-600 text-xs font-bold text-white rounded-xl hover:bg-indigo-700 transition cursor-pointer shadow-sm"
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-gray-200">
        {[
          { key: "all", label: "Manage Products" },
          { key: "inventory", label: "Manage Inventory" },
          { key: "bulk", label: "Bulk Actions" }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === tab.key
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {message && <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-100">{message}</div>}
      {error && <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100">{error}</div>}

      {/* VIEW 1: MANAGE PRODUCTS */}
      {activeTab === "all" && (
        <div className="space-y-4">
          {/* Advanced Search/Filter Bar */}
          <form onSubmit={handleSearchSubmit} className="grid gap-3 sm:grid-cols-12 bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
            <input
              placeholder="Search by name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 rounded-xl border border-gray-300 bg-gray-50 px-3 text-xs outline-none focus:border-indigo-500 sm:col-span-6"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 rounded-xl border border-gray-300 bg-white px-2.5 text-xs font-bold text-gray-600 outline-none cursor-pointer sm:col-span-3"
            >
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-10 rounded-xl border border-gray-300 bg-white px-2.5 text-xs font-bold text-gray-600 outline-none cursor-pointer sm:col-span-3"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Rating</option>
            </select>
          </form>

          {/* Table list */}
          {loading ? (
            <div className="text-center text-xs font-bold text-gray-400 py-10">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="text-center text-xs font-bold text-gray-400 py-10">No products found.</div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-2xl border border-gray-200 shadow-sm">
              <table className="min-w-full text-xs text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 font-extrabold text-gray-400 uppercase tracking-wider">Product Info</th>
                    <th className="px-4 py-3 font-extrabold text-gray-400 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 font-extrabold text-gray-400 uppercase tracking-wider text-right">Price</th>
                    <th className="px-4 py-3 font-extrabold text-gray-400 uppercase tracking-wider text-right">Stock</th>
                    <th className="px-4 py-3 font-extrabold text-gray-400 uppercase tracking-wider text-right">Rating</th>
                    <th className="px-4 py-3 font-extrabold text-gray-400 uppercase tracking-wider text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                      <td className="px-4 py-3 flex items-center gap-3">
                        <img src={p.image || FALLBACK_PRODUCT_IMAGE} alt="" className="h-10 w-10 object-cover rounded-lg border border-gray-200" />
                        <div>
                          <p className="font-bold text-gray-900 line-clamp-1">{p.name}</p>
                          <p className="text-[10px] text-gray-400 font-semibold">{p.sku || "N/A"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-700">{p.category}</td>
                      <td className="px-4 py-3 font-bold text-gray-900 text-right">${p.price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-black ${p.stock === 0 ? "text-red-600" : p.stock <= 5 ? "text-amber-700" : "text-gray-700"}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-600 text-right">★ {(p.rating || 0).toFixed(1)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex gap-1.5">
                          <button
                            onClick={() => openEdit(p)}
                            className="px-2.5 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 font-bold text-gray-600 cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDuplicate(p)}
                            className="px-2.5 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 font-bold text-gray-600 cursor-pointer"
                          >
                            Clone
                          </button>
                          <button
                            onClick={() => handleDelete(p._id)}
                            className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg font-bold cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: MANAGE INVENTORY */}
      {activeTab === "inventory" && (
        <div className="space-y-6">
          {/* Inventory overview counts */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm text-left">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Total Stock Count</span>
              <span className="text-lg font-black text-gray-900">{inventoryStats.totalStock.toLocaleString()} units</span>
            </div>
            <div className="bg-white border border-gray-300 p-4 rounded-2xl shadow-sm text-left">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Inventory Valuation</span>
              <span className="text-lg font-black text-gray-900">${inventoryStats.totalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className={`p-4 rounded-2xl border text-left shadow-sm ${inventoryStats.lowStockCount > 0 ? "border-amber-200 bg-amber-50/20" : "border-gray-200 bg-white"}`}>
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Low Stock Warnings</span>
              <span className="text-lg font-black text-gray-900">{inventoryStats.lowStockCount} items</span>
            </div>
            <div className={`p-4 rounded-2xl border text-left shadow-sm ${inventoryStats.outOfStockCount > 0 ? "border-red-200 bg-red-50/20" : "border-gray-200 bg-white"}`}>
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Out of Stock Alert</span>
              <span className="text-lg font-black text-gray-900">{inventoryStats.outOfStockCount} items</span>
            </div>
          </div>

          {/* Table */}
          <div className="grid gap-6 lg:grid-cols-3 items-start">
            <div className="lg:col-span-2 overflow-x-auto bg-white rounded-2xl border border-gray-200 shadow-sm">
              <table className="min-w-full text-xs text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 font-extrabold text-gray-400 uppercase tracking-wider">Product Description</th>
                    <th className="px-4 py-3 font-extrabold text-gray-400 uppercase tracking-wider text-right font-mono">Current Stock</th>
                    <th className="px-4 py-3 font-extrabold text-gray-400 uppercase tracking-wider text-right font-mono">Reserved Stock</th>
                    <th className="px-4 py-3 font-extrabold text-gray-400 uppercase tracking-wider text-right font-mono">Available</th>
                    <th className="px-4 py-3 font-extrabold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const reserved = Math.round(p.stock * 0.15); // simulate reserved stock
                    const available = p.stock - reserved;
                    return (
                      <tr key={p._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <div className="font-bold text-gray-900 line-clamp-1">{p.name}</div>
                          <div className="text-[10px] text-gray-400 font-bold">{p.sku || "N/A"}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-700">{p.stock}</td>
                        <td className="px-4 py-3 text-right text-gray-400 font-semibold">{reserved}</td>
                        <td className="px-4 py-3 text-right font-black text-indigo-600">{available}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => { setAdjustingProduct(p); setAdjustValue(p.stock); }}
                            className="px-2.5 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 font-bold text-gray-600 cursor-pointer"
                          >
                            Adjust Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Adjustments log sidebar history */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Adjustment Logs</h3>
              <p className="text-[10px] font-bold text-gray-400">History log of corrections completed during this workspace session</p>
              
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {adjustmentLogs.map((log, idx) => (
                  <div key={idx} className="border-b border-gray-100 pb-2 text-xs space-y-0.5 text-left">
                    <p className="font-bold text-gray-800">{log.name}</p>
                    <p className="text-[10px] text-gray-500">
                      SKU: <span className="font-mono font-bold text-gray-600">{log.sku}</span> | Change:{" "}
                      <span className={`font-black ${log.change.startsWith("+") ? "text-emerald-700" : "text-rose-600"}`}>
                        {log.change}
                      </span>
                    </p>
                    <p className="text-[9px] text-gray-400 font-bold">{log.at} &bull; Admin Adjusted</p>
                  </div>
                ))}
                {adjustmentLogs.length === 0 && (
                  <p className="text-xs text-gray-400 font-semibold py-8 text-center">No adjustment records yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: BULK ACTIONS */}
      {activeTab === "bulk" && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Bulk Export Card */}
          <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm text-left space-y-4">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Export Product Catalog</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Export all currently loaded database products and metadata configurations into a spreadsheet-compatible CSV file format.
            </p>
            <button
              onClick={handleBulkExport}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              📥 Download CSV Catalog
            </button>
          </div>

          {/* Bulk Import Card */}
          <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm text-left space-y-4">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Bulk Import Catalog (JSON Format)</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Paste a valid JSON array of product objects to import them into the database in bulk.
            </p>
            <form onSubmit={handleBulkImportSubmit} className="space-y-3">
              <textarea
                value={bulkImportText}
                onChange={(e) => setBulkImportText(e.target.value)}
                placeholder='[{"name":"Product A","price":99,"stock":10,"category":"Electronics"}]'
                rows={5}
                required
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-mono outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={bulkProcessing}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white rounded-xl transition disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {bulkProcessing ? "Processing list..." : "🚀 Trigger Bulk Import"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Product Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 border border-gray-200 animate-scale-up max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-black text-gray-900 mb-4 text-left">
              {editing && editing._id ? "Edit Product Listing" : "Add Product Listing"}
            </h2>
            <ProductForm
              initial={editing || {}}
              onCancel={() => setShowModal(false)}
              onSave={handleSave}
              saving={saving}
            />
          </div>
        </div>
      )}

      {/* Stock Adjustment Popover Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 border border-gray-200 text-left space-y-4">
            <h3 className="text-sm font-black text-gray-900">Adjust Inventory Stock</h3>
            <div>
              <p className="text-xs font-bold text-gray-700">{adjustingProduct.name}</p>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5">SKU: {adjustingProduct.sku}</p>
            </div>
            <div>
              <label className="block text-xs font-extrabold text-gray-400 uppercase mb-1">New Stock Count</label>
              <input
                type="number"
                value={adjustValue}
                onChange={(e) => setAdjustValue(Math.max(0, Number(e.target.value) || 0))}
                className="w-full h-10 rounded-xl border border-gray-300 bg-gray-50 px-3 text-xs outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 pt-3">
              <button
                type="button"
                onClick={() => setAdjustingProduct(null)}
                className="h-9 px-3 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStockAdjustSave}
                disabled={saving}
                className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {saving ? "Saving..." : "Apply Adjust"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function openEdit(product) {
  // handled inside component state
}
