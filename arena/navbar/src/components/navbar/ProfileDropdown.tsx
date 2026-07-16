import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Package, 
  Heart, 
  MapPin, 
  Ticket, 
  Settings, 
  LogOut,
  ChevronDown
} from 'lucide-react';
import { cn } from '../../utils/cn';

const menuItems = [
  { icon: User, label: 'My Profile', href: '#' },
  { icon: Package, label: 'Orders', href: '#' },
  { icon: Heart, label: 'Wishlist', href: '#' },
  { icon: MapPin, label: 'Addresses', href: '#' },
  { icon: Ticket, label: 'Coupons', href: '#' },
  { icon: Settings, label: 'Settings', href: '#' },
  { icon: LogOut, label: 'Logout', href: '#', color: 'text-red-500' },
];

export const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button 
        className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-black/5 transition-all group"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[1px]">
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
              alt="Avatar" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <ChevronDown 
          size={16} 
          className={cn("text-zinc-500 transition-transform duration-300", isOpen && "rotate-180")} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-56 p-2 rounded-2xl border border-black/5 bg-white/80 backdrop-blur-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-black/5 mb-2">
              <p className="text-sm font-semibold text-zinc-900">John Doe</p>
              <p className="text-xs text-zinc-500">premium member</p>
            </div>
            
            <div className="space-y-1">
              {menuItems.map((item, index) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all hover:bg-black/5 group",
                    item.color || "text-zinc-600 hover:text-zinc-900"
                  )}
                >
                  <item.icon size={18} className="group-hover:scale-110 transition-transform" />
                  <span>{item.label}</span>
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
