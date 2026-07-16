import { useState, useRef, useEffect } from 'react';
import { Search, Mic, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

export const SearchBar = () => {
  const [isFocused, setIsFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <motion.div 
      className={cn(
        "relative flex items-center h-10 px-3 transition-all duration-300 ease-out rounded-full border border-black/5 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md",
        isFocused ? "w-full max-w-md ring-2 ring-blue-500/20 border-blue-500/30" : "w-64 border-transparent"
      )}
      animate={{ width: isFocused ? 448 : 256 }}
    >
      <motion.div
        animate={{ rotate: isFocused ? 90 : 0 }}
        className="mr-2 text-zinc-400"
      >
        <Search size={18} />
      </motion.div>
      
      <input
        ref={inputRef}
        type="text"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Search products..."
        className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-zinc-400"
        aria-label="Search"
      />

      <AnimatePresence>
        {!isFocused && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-black/10 bg-black/5 text-[10px] font-medium text-zinc-400"
          >
            <Command size={10} />
            <span>K</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="ml-2 text-zinc-400 hover:text-blue-500 transition-colors"
        title="Voice Search"
      >
        <Mic size={18} />
      </motion.button>
    </motion.div>
  );
};
