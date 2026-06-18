import React from 'react';

export default function AddressCard({ address, onEdit, onDelete, onSetDefault, isSelected }) {
  return (
    <article className={`rounded-xl border p-4 shadow-sm bg-white ${isSelected ? 'ring-2 ring-indigo-200' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-gray-800">{address.label || 'Other'}</h3>
            {address.isDefault && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Default</span>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-700">{address.fullName}</p>
          <p className="mt-1 text-sm text-gray-600">{address.street}</p>
          <p className="text-sm text-gray-600">{address.city}, {address.state} {address.zipCode}</p>
          <p className="text-sm text-gray-600">{address.country}</p>
          {address.phone && <p className="mt-1 text-sm text-gray-600">Phone: {address.phone}</p>}
          {address.landmark && <p className="mt-1 text-xs text-gray-500">Landmark: {address.landmark}</p>}
        </div>

        <div className="ml-4 flex flex-col items-end gap-2">
          <button onClick={() => onEdit(address)} className="text-sm text-indigo-600">Edit</button>
          <button onClick={() => onDelete(address)} className="text-sm text-red-600">Delete</button>
          {!address.isDefault && (
            <button onClick={() => onSetDefault(address)} className="text-sm text-gray-600">Set as default</button>
          )}
        </div>
      </div>
    </article>
  );
}
