import { Route, Routes } from "react-router-dom";
import Footer from "./components/layout/Footer";
import Navbar from "./components/layout/Navbar";

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <Routes>
          <Route
            path="/"
            element={
              <section className="rounded-lg border bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-bold">Frontend foundation ready</h1>
                <p className="mt-3 text-gray-600">
                  Next step is creating actual pages and API integration.
                </p>
              </section>
            }
          />
          <Route
            path="/products"
            element={
              <section className="rounded-lg border bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold">Products page placeholder</h2>
              </section>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
