import { useEffect, useState } from 'react';
import AddressCard from '../components/address/AddressCard';
import AddressForm from '../components/address/AddressForm';
import * as addressService from '../services/addressService';

function AddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await addressService.getAddresses();
      setAddresses(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleEdit = (addr) => {
    setEditing(addr);
    setShowForm(true);
  };

  const handleDelete = async (addr) => {
    if (!confirm('Delete this address?')) return;
    try {
      await addressService.deleteAddress(addr._id);
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Delete failed');
    }
  };

  const handleSetDefault = async (addr) => {
    try {
      await addressService.setDefaultAddress(addr._id);
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Failed to set default');
    }
  };

  const handleSave = async (form) => {
    try {
      if (editing && editing._id) {
        await addressService.updateAddress(editing._id, form);
      } else {
        await addressService.addAddress(form);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Save failed');
    }
  };

  if (loading) return <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">Loading addresses...</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Your Addresses</h1>
        <p className="mt-2 text-sm text-gray-600">Manage your saved shipping addresses.</p>
      </header>

      <section>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {addresses.map((a) => (
            <AddressCard key={a._id} address={a} onEdit={handleEdit} onDelete={handleDelete} onSetDefault={handleSetDefault} />
          ))}

          <article className="flex items-center justify-center rounded-xl border p-6 text-center text-sm text-gray-600 shadow-sm bg-white">
            {!showForm ? (
              <button onClick={handleAdd} className="flex flex-col items-center gap-2">
                <span className="text-2xl">＋</span>
                <span>Add new address</span>
              </button>
            ) : (
              <div className="w-full">
                <AddressForm initial={editing || {}} onCancel={() => setShowForm(false)} onSave={handleSave} />
              </div>
            )}
          </article>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    </div>
  );
}

export default AddressesPage;
