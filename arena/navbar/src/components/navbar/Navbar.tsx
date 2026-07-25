import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Bell, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { SearchBar } from './SearchBar';
import { ProfileDropdown } from './ProfileDropdown';
import { CartButton } from './CartButton';
import { WishlistButton } from './WishlistButton';
import { MobileMenu } from './MobileMenu';

const navLinks = [
  { label: 'New Arrivals', href: '#' },
  { label: 'Collections', href: '#' },
  { label: 'Men', href: '#' },
  { label: 'Women', href: '#' },
  { label: 'Sale', href: '#', highlighted: true },
  { label: 'Categories', href: '#', highlighted: false }, // Added Categories link
];

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  const navigate = useNavigate();
  const location = useLocation();

  // Animations based on scroll
  const height = useTransform(scrollY, [0, 100], [88, 64]);
  const backgroundColor = useTransform(
    scrollY,
    [0, 100],
    ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.8)']
  );
  const shadow = useTransform(
    scrollY,
    [0, 100],
    ['none', '0 4px 20px -5px rgba(0, 0, 0, 0.1)']
  );

  useEffect(() => {
    const updateScrolled = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', updateScrolled);
    return () => window.removeEventListener('scroll', updateScrolled);
  }, []);

  const handleCategoriesClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    const { pathname } = location;
    if (pathname === '/') {
      // Already on home page, scroll to categories
      scrollToCategories();
    } else {
      // Not on home page, navigate home and then scroll
      navigate('/', { state: { scrollToCategories: true } });
    }
  };

  const scrollToCategories = () => {
    const element = document.getElementById('categories');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (location.pathname === '/' && location.state?.scrollToCategories) {
      scrollToCategories();
    }
  }, [location]);

  return (
    <motion.header
      style={{ height, backgroundColor, boxShadow: shadow }}
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] flex items-center px-6 transition-all duration-300 border-b border-transparent backdrop-blur-0",
        isScrolled && "border-white/20 backdrop-blur-xl"
      )}
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        
        {/* Left: Logo and Nav Links */}
        <div className="flex items-center gap-8">
          <motion.a 
            href="/"
            className="flex items-center gap-2 group"
            whileHover={{ scale: 1.02 }}
          >
            <div className="relative w-10 h-10 flex items-center justify-center bg-zinc-900 rounded-xl overflow-hidden shadow-lg group-hover:shadow-blue-500/20 transition-all">
              <motion.div
                animate={{ 
                  rotate: [0, 90, 180, 270, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 opacity-20"
              />
              <Sparkles className="text-white relative z-10" size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 bg-clip-text text-transparent">
              ShopSphere
            </span>
          </motion.a>

          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => {
              if (link.label === 'Categories') {
                return (
                  <a
                    key={link.label}
                    href="#" // Keep href for accessibility, but we handle click
                    onClick={handleCategoriesClick}
                    className={cn(
                      "relative py-2 text-sm font-medium transition-colors hover:text-blue-600",
                      link.highlighted ? "text-red-500" : "text-zinc-600"
                    )}
                  >
                    {link.label}
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 origin-left"
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </a>
                );
              }
              return (
                <a
                  key={link.label}
                  href={link.href}
                  className={cn(
                    "relative py-2 text-sm font-medium transition-colors hover:text-blue-600",
                    link.highlighted ? "text-red-500" : "text-zinc-600"
                  )}
                >
                  {link.label}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 origin-left"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </a>
              );
            })}
          </nav>
        </div>

        {/* Center: Search Bar */}
        <div className="hidden md:block">
          <SearchBar />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 md:gap-3">
          <div className="hidden sm:flex items-center gap-1 md:gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-2.5 rounded-full hover:bg-black/5 transition-colors group"
              aria-label="Notifications"
            >
              <Bell size={22} className="text-zinc-600 group-hover:text-zinc-900 transition-colors" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white animate-pulse" />
            </motion.button>

            <WishlistButton />
            <CartButton />
          </div>

          <div className="w-px h-6 bg-zinc-200 mx-2 hidden sm:block" />

          <ProfileDropdown />
          <MobileMenu />
        </div>

      </div>
    </motion.header>
  );
};