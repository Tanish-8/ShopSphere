import { useState } from "react";

const faqs = [
  {
    q: "How do I track my order?",
    a: "To track your delivery progress, navigate to the 'My Orders' history page in the account dropdown menu, then click the 'Track Order' button next to the desired purchase. This opens the tracking timeline displaying order placed, payment, processing, packing, shipping, and delivery progress status changes in real-time."
  },
  {
    q: "What is your refund policy?",
    a: "We offer a 30-day money back guarantee on all unused catalog items. Once we receive your return collection, your refund will be processed back to the original payment method within 5-7 business days."
  },
  {
    q: "Do you support international shipping?",
    a: "Currently, ShopSphere supports shipping to domestic destinations. International shipping expansion choices are planned for later platform upgrades."
  },
  {
    q: "How do I apply coupons?",
    a: "During the checkout process, enter your unique promotional coupon code in the discount field on the Checkout page. Click apply, and the total billing price will be recalculated immediately."
  }
];

export default function HelpPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [supportSuccess, setSupportSuccess] = useState(false);
  const [problemText, setProblemText] = useState("");
  const [problemSuccess, setProblemSuccess] = useState(false);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSupportSuccess(true);
    setName("");
    setEmail("");
    setMessage("");
    setTimeout(() => setSupportSuccess(false), 4000);
  };

  const handleProblemSubmit = (e) => {
    e.preventDefault();
    if (!problemText) return;
    setProblemSuccess(true);
    setProblemText("");
    setTimeout(() => setProblemSuccess(false), 4000);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-12">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">Help & Support</h1>
        <p className="mt-1 text-xs text-gray-500">Find quick answers, contact our service staff, or report platform issues.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Left Side: General Info tabs */}
        <div className="md:col-span-1 space-y-6">
          {/* Contact Details */}
          <div className="rounded-2xl border border-gray-150 bg-white p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Contact Us</h3>
            <div className="space-y-2 text-[10px] text-gray-600 leading-relaxed">
              <p>📞 Phone: +1 (800) 555-0199</p>
              <p>📧 Email: support@shopsphere.example.com</p>
              <p>⏰ Hours: Mon-Fri 9:00 AM - 6:00 PM EST</p>
            </div>
          </div>

          {/* Quick Policy details */}
          <div className="rounded-2xl border border-gray-150 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Quick Policies</h3>
            <div className="space-y-3 text-[10px] text-gray-500 leading-normal">
              <div>
                <strong className="block text-gray-800 text-xs">Shipping Policy</strong>
                <p>Deliveries are shipped via major mail carriers. Handling time spans 1-2 business days.</p>
              </div>
              <div>
                <strong className="block text-gray-800 text-xs">Returns & Refunds</strong>
                <p>Return collection picks are free within 30 days. Items must be returned unused in original box packaging.</p>
              </div>
              <div>
                <strong className="block text-gray-800 text-xs">Payment Security</strong>
                <p>Checkout payments are processed securely via Razorpay checkout, supporting UPI, cards, and netbanking details.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive FAQ and forms */}
        <div className="md:col-span-2 space-y-8">
          {/* FAQs section */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Frequently Asked Questions</h2>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-gray-150 bg-white">
                  <button
                    onClick={() => toggleFaq(i)}
                    className="flex w-full items-center justify-between px-4 py-3.5 text-xs font-bold text-gray-800 hover:bg-gray-50/50 transition cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className={`text-xs transition-transform duration-200 ${openFaqIndex === i ? "rotate-180" : ""}`}>
                      ▼
                    </span>
                  </button>
                  {openFaqIndex === i && (
                    <div className="border-t border-gray-50 px-4 py-3 text-xs text-gray-600 leading-relaxed bg-gray-50/30">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Contact Support form */}
          <section className="rounded-2xl border border-gray-150 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-gray-800 border-b border-gray-50 pb-2">Submit Support Ticket</h2>
            
            {supportSuccess && (
              <p className="text-xs text-emerald-600 font-semibold animate-fade-in">
                🎉 Ticket submitted successfully! A support agent will email you shortly.
              </p>
            )}

            <form onSubmit={handleSupportSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Your Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Message / Inquiry Details</label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Detail your request..."
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 cursor-pointer"
              >
                Submit Ticket
              </button>
            </form>
          </section>

          {/* Report problem form */}
          <section className="rounded-2xl border border-gray-150 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-gray-800 border-b border-gray-50 pb-2">Report a Problem</h2>

            {problemSuccess && (
              <p className="text-xs text-emerald-600 font-semibold animate-fade-in">
                👍 Problem report registered. Thank you for making ShopSphere better!
              </p>
            )}

            <form onSubmit={handleProblemSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">What happened?</label>
                <textarea
                  rows={2}
                  value={problemText}
                  onChange={(e) => setProblemText(e.target.value)}
                  placeholder="Describe the bug or layout overlap..."
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white transition hover:bg-red-700 cursor-pointer"
              >
                Submit Bug Report
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
