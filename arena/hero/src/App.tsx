import NavBar from "./components/NavBar";
import Hero from "./components/Hero";
import FeaturesSection from "./components/FeaturesSection";

export default function App() {
  return (
    <div className="min-h-screen bg-[#0a0a12]">
      <NavBar />
      <main>
        <Hero />
        <FeaturesSection />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-[#0a0a12] px-4 py-8 text-center sm:px-6 lg:px-8">
        <p className="text-xs text-slate-600">
          © 2025 ShopSphere Inc. All rights reserved. Crafted with ♥ for premium shoppers.
        </p>
      </footer>
    </div>
  );
}
