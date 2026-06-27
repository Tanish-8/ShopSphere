import { Link, Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-white border-r hidden md:block">
        <div className="p-4 text-xl font-bold">Admin</div>
        <nav className="p-4 space-y-2">
          <Link to="/admin" className="block rounded px-3 py-2 hover:bg-gray-100">Dashboard</Link>
          <Link to="/admin/products" className="block rounded px-3 py-2 hover:bg-gray-100">Products</Link>
          <Link to="/admin/orders" className="block rounded px-3 py-2 hover:bg-gray-100">Orders</Link>
          <Link to="/admin/users" className="block rounded px-3 py-2 hover:bg-gray-100">Users</Link>
          <Link to="/admin/coupons" className="block rounded px-3 py-2 hover:bg-gray-100">Coupons</Link>
        </nav>
      </aside>

      <div className="flex-1 p-6">
        <Outlet />
      </div>
    </div>
  );
}
