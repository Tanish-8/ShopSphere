import { Navbar } from './components/navbar/Navbar';

export default function App() {
  return (
    <div className="min-h-[200vh] bg-zinc-50 selection:bg-blue-100">
      <Navbar />
      
      {/* Hero Section */}
      <main className="pt-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-zinc-900 aspect-[21/9] flex items-center px-12 md:px-20">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
            <div className="absolute top-0 right-0 w-1/2 h-full">
              <img 
                src="https://images.unsplash.com/photo-1611186871348-b1ec696e52c9?q=80&w=2070&auto=format&fit=crop" 
                alt="Product"
                className="w-full h-full object-cover opacity-60"
              />
            </div>
            
            <div className="relative z-10 max-w-xl space-y-6">
              <span className="inline-block px-4 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-semibold border border-blue-500/20">
                New Collection 2024
              </span>
              <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
                Premium Essentials <br />
                <span className="text-zinc-400">for Everyday.</span>
              </h1>
              <p className="text-lg text-zinc-400 max-w-md">
                Experience the next generation of lifestyle products with ShopSphere's curated selection.
              </p>
              <div className="flex items-center gap-4 pt-4">
                <button className="px-8 py-4 bg-white text-zinc-950 rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                  Shop Now
                </button>
                <button className="px-8 py-4 bg-zinc-800 text-white rounded-2xl font-bold hover:bg-zinc-700 transition-all cursor-pointer">
                  View Lookbook
                </button>
              </div>
            </div>
          </div>

          {/* Dummy content for scrolling */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 pb-24">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="group cursor-pointer">
                <div className="aspect-[4/5] rounded-[2rem] bg-zinc-200 overflow-hidden mb-6">
                  <img 
                    src={`https://images.unsplash.com/photo-${1523275335684 + i}-f11837bc8b69?q=80&w=1000&auto=format&fit=crop`} 
                    alt="Product"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="text-xl font-semibold text-zinc-900">Premium Product {i}</h3>
                <p className="text-zinc-500 mt-2">$299.00</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer / Extra height for scrolling */}
      <footer className="py-20 bg-zinc-100 text-center text-zinc-400 text-sm border-t border-zinc-200">
        <p>© 2024 ShopSphere. Premium E-commerce Experience.</p>
      </footer>
    </div>
  );
}
