import { useEffect, useState } from "react";
import {
  fetchAdminCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "../../services/couponService";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form Modal States
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: 0,
    minimumOrderAmount: 0,
    maximumDiscount: 0,
    usageLimit: 0,
    perUserLimit: 1,
    startDate: new Date().toISOString().substring(0, 10),
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadCoupons = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminCoupons({
        search,
        page,
        limit: 10,
      });
      setCoupons(data.coupons || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load coupons.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, [search, page]);

  const handleOpenCreate = () => {
    setEditId(null);
    setForm({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: 0,
      minimumOrderAmount: 0,
      maximumDiscount: 0,
      usageLimit: 0,
      perUserLimit: 1,
      startDate: new Date().toISOString().substring(0, 10),
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      isActive: true,
    });
    setFormError("");
    setIsOpen(true);
  };

  const handleOpenEdit = (coupon) => {
    setEditId(coupon._id || coupon.id);
    setForm({
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minimumOrderAmount: coupon.minimumOrderAmount || 0,
      maximumDiscount: coupon.maximumDiscount || 0,
      usageLimit: coupon.usageLimit || 0,
      perUserLimit: coupon.perUserLimit || 1,
      startDate: new Date(coupon.startDate).toISOString().substring(0, 10),
      expiryDate: new Date(coupon.expiryDate).toISOString().substring(0, 10),
      isActive: coupon.isActive,
    });
    setFormError("");
    setIsOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await deleteCoupon(id);
      loadCoupons();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Failed to delete coupon");
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      const id = coupon._id || coupon.id;
      await updateCoupon(id, { isActive: !coupon.isActive });
      loadCoupons();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Failed to update active state");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) {
      setFormError("Coupon code is required");
      return;
    }
    if (!form.description.trim()) {
      setFormError("Description is required");
      return;
    }
    if (Number(form.discountValue) <= 0) {
      setFormError("Discount value must be greater than zero");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const payload = {
        ...form,
        discountValue: Number(form.discountValue),
        minimumOrderAmount: Number(form.minimumOrderAmount),
        maximumDiscount: Number(form.maximumDiscount),
        usageLimit: Number(form.usageLimit),
        perUserLimit: Number(form.perUserLimit),
      };

      if (editId) {
        await updateCoupon(editId, payload);
      } else {
        await createCoupon(payload);
      }
      setIsOpen(false);
      loadCoupons();
    } catch (err) {
      setFormError(err?.response?.data?.message || err.message || "Failed to save coupon.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Manage Coupons</h1>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
        >
          Create Coupon
        </button>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex max-w-md gap-2">
          <input
            type="text"
            placeholder="Search coupon codes..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            <span className="text-sm text-gray-500">Loading coupons...</span>
          </div>
        ) : error ? (
          <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
        ) : coupons.length === 0 ? (
          <p className="mt-6 text-center text-sm text-gray-500">No coupons found.</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">Min Order</th>
                  <th className="px-4 py-3">Usage</th>
                  <th className="px-4 py-3">Expiry</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {coupons.map((coupon) => (
                  <tr key={coupon._id || coupon.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{coupon.code}</td>
                    <td className="px-4 py-3">
                      {coupon.discountType === "percentage"
                        ? `${coupon.discountValue}%`
                        : `$${coupon.discountValue}`}
                    </td>
                    <td className="px-4 py-3">${(coupon.minimumOrderAmount || 0).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {coupon.usedCount} / {coupon.usageLimit > 0 ? coupon.usageLimit : "∞"}
                    </td>
                    <td className="px-4 py-3">{new Date(coupon.expiryDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(coupon)}
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          coupon.isActive
                            ? "bg-green-50 text-green-700 ring-green-600/20"
                            : "bg-red-50 text-red-700 ring-red-600/20"
                        }`}
                      >
                        {coupon.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(coupon)}
                        className="text-indigo-600 hover:text-indigo-900 font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(coupon._id || coupon.id)}
                        className="text-red-600 hover:text-red-900 font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-sm self-center">Page {page} of {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </section>

      {/* Form Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              {editId ? "Edit Coupon" : "Create Coupon"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium">Coupon Code</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="e.g. SAVE20"
                    disabled={!!editId}
                    className="w-full rounded border border-gray-300 px-2 py-1 outline-none uppercase text-gray-900"
                  />
                </div>
                <div>
                  <label className="block font-medium">Description</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="e.g. 20% off items"
                    className="w-full rounded border border-gray-300 px-2 py-1 outline-none text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium">Discount Type</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                    className="w-full rounded border border-gray-300 px-2 py-1 outline-none bg-white text-gray-900"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium">Discount Value</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    className="w-full rounded border border-gray-300 px-2 py-1 outline-none text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium">Min Order Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.minimumOrderAmount}
                    onChange={(e) => setForm({ ...form, minimumOrderAmount: e.target.value })}
                    className="w-full rounded border border-gray-300 px-2 py-1 outline-none text-gray-900"
                  />
                </div>
                <div>
                  <label className="block font-medium">Max Discount Limit ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.maximumDiscount}
                    onChange={(e) => setForm({ ...form, maximumDiscount: e.target.value })}
                    placeholder="0 for unlimited"
                    className="w-full rounded border border-gray-300 px-2 py-1 outline-none text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium">Global Usage Limit</label>
                  <input
                    type="number"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    placeholder="0 for unlimited"
                    className="w-full rounded border border-gray-300 px-2 py-1 outline-none text-gray-900"
                  />
                </div>
                <div>
                  <label className="block font-medium">Per User Usage Limit</label>
                  <input
                    type="number"
                    value={form.perUserLimit}
                    onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })}
                    className="w-full rounded border border-gray-300 px-2 py-1 outline-none text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full rounded border border-gray-300 px-2 py-1 outline-none text-gray-900"
                  />
                </div>
                <div>
                  <label className="block font-medium">Expiry Date</label>
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                    className="w-full rounded border border-gray-300 px-2 py-1 outline-none text-gray-900"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-gray-300 focus:ring-indigo-500 h-4 w-4 text-indigo-600"
                />
                <label htmlFor="isActive" className="font-medium text-gray-700">Coupon is Active</label>
              </div>

              {formError && (
                <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mt-2">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded border px-4 py-1.5 font-semibold text-gray-700 bg-white hover:bg-gray-50 border-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded bg-indigo-600 px-4 py-1.5 font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
