import { FeaturedProducts } from './components/FeaturedProducts/FeaturedProducts';

export default function App() {
  return (
    <main className="min-h-screen bg-white selection:bg-black selection:text-white">
      {/* Mock Header for Context */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-neutral-100 px-8 py-4 flex items-center justify-between">
        <span className="font-black text-xl tracking-tighter">SHOPSPHERE</span>
        <nav className="hidden md:flex gap-8 text-sm font-medium">
          <a href="#" className="hover:text-blue-600 transition-colors">Men</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Women</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Tech</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Sale</a>
        </nav>
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-neutral-100" />
          <div className="w-8 h-8 rounded-full bg-neutral-100" />
        </div>
      </header>

      {/* Hero Section Mock */}
      <section className="pt-32 pb-16 px-8 text-center bg-white">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6">
          NEW ERA <br /> OF DESIGN.
        </h1>
        <p className="text-neutral-500 text-lg max-w-2xl mx-auto">
          ShopSphere is the ultimate destination for premium curated products. Experience a new way of shopping with our latest collections.
        </p>
      </section>

      {/* The Requested Featured Products Section */}
      <FeaturedProducts />

      {/* Simple Footer Mock */}
      <footer className="py-20 px-8 bg-neutral-900 text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <span className="font-black text-xl tracking-tighter">SHOPSPHERE</span>
            <p className="text-neutral-400 text-sm">Elevating your lifestyle through premium design.</p>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold uppercase text-xs tracking-widest">Shop</h4>
            <ul className="text-neutral-400 text-sm space-y-2">
              <li>New Arrivals</li>
              <li>Featured</li>
              <li>Trending</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold uppercase text-xs tracking-widest">Help</h4>
            <ul className="text-neutral-400 text-sm space-y-2">
              <li>Support</li>
              <li>Shipping</li>
              <li>Returns</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold uppercase text-xs tracking-widest">Social</h4>
            <ul className="text-neutral-400 text-sm space-y-2">
              <li>Instagram</li>
              <li>Twitter</li>
              <li>Facebook</li>
            </ul>
          </div>
        </div>
      </footer>
    </main>
  );
}
