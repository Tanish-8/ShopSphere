import { useEffect, useState } from "react";
import { fetchAllOrders, updateOrderStatus, downloadInvoice } from "../../services/orderService";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = async () => {
    try {
      const resp = await fetchAllOrders();
      setOrders(resp.data || resp);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load(); }, []);

  const applyFilter = (o) => {
    if (q && !o._id.includes(q)) return false;
    if (statusFilter && o.status !== statusFilter) return false;
    return true;
  };

  const handleUpdate = async (orderId, toStatus) => {
    try {
      await updateOrderStatus(orderId, toStatus, `Updated via admin UI`);
      load();
    } catch (e) { alert(e?.response?.data?.message || e.message); }
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      const data = await downloadInvoice(orderId);
      const blob = new Blob([data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice_${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download invoice PDF.");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage Orders</h1>
      <div className="flex gap-2 mb-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order id" className="rounded border px-3 py-2" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded border px-3 py-2">
          <option value="">All</option>
          <option value="ordered">ordered</option>
          <option value="processing">processing</option>
          <option value="shipped">shipped</option>
          <option value="delivered">delivered</option>
        </select>
      </div>

      <div className="space-y-3">
        {orders.filter(applyFilter).map((o) => (
          <div key={o._id} className="rounded border bg-white p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{o._id}</div>
              <div className="text-sm text-gray-500">{o.user} • {o.status}</div>
            </div>
            <div className="flex gap-2">
              {o.status === 'ordered' && <button onClick={() => handleUpdate(o._id, 'processing')} className="px-3 py-1 rounded bg-indigo-600 text-white">Mark Processing</button>}
              {o.status === 'processing' && <button onClick={() => handleUpdate(o._id, 'shipped')} className="px-3 py-1 rounded bg-indigo-600 text-white">Mark Shipped</button>}
              {o.status === 'shipped' && <button onClick={() => handleUpdate(o._id, 'delivered')} className="px-3 py-1 rounded bg-indigo-600 text-white">Mark Delivered</button>}
              <button onClick={() => handleDownloadInvoice(o._id)} className="px-3 py-1 rounded border hover:bg-gray-50">Invoice</button>
              <a href={`/orders/${o._id}`} className="px-3 py-1 rounded border">Open</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
