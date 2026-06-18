import React, { useEffect, useState } from 'react';

export default function AddressForm({ initial = {}, onCancel, onSave }) {
  const [form, setForm] = useState({
    label: initial.label || 'Home',
    fullName: initial.fullName || '',
    phone: initial.phone || '',
    landmark: initial.landmark || '',
    street: initial.street || '',
    city: initial.city || '',
    state: initial.state || '',
    zipCode: initial.zipCode || '',
    country: initial.country || '',
    isDefault: initial.isDefault || false,
  });

  useEffect(() => setForm((f) => ({ ...f, ...initial })), [initial]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700">Label</label>
        <select name="label" value={form.label} onChange={handleChange} className="mt-1 w-full rounded-md border px-3 py-2 text-sm">
          <option>Home</option>
          <option>Work</option>
          <option>Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Full name</label>
        <input name="fullName" value={form.fullName} onChange={handleChange} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Phone</label>
        <input name="phone" value={form.phone} onChange={handleChange} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Street</label>
        <input name="street" value={form.street} onChange={handleChange} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">City</label>
          <input name="city" value={form.city} onChange={handleChange} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">State</label>
          <input name="state" value={form.state} onChange={handleChange} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Postal Code</label>
          <input name="zipCode" value={form.zipCode} onChange={handleChange} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Country</label>
          <input name="country" value={form.country} onChange={handleChange} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
        </div>
      </div>

      <div>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name="isDefault" checked={form.isDefault} onChange={handleChange} />
          <span className="text-sm text-gray-700">Set as default address</span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-sm text-white">Save</button>
        <button type="button" onClick={onCancel} className="rounded border px-4 py-2 text-sm">Cancel</button>
      </div>
    </form>
  );
}
