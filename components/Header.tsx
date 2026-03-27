'use client';

import { useState, useEffect, useRef } from 'react';
import { Phone, Mail, MapPin, Search, Menu, X, ChevronDown, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react';
import { usePathname } from 'next/navigation';
import { openMap, COMPANY_ADDRESS } from '@/lib/maps';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const pathname = usePathname();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const lastScrollY = useRef(0);
  const scrollThreshold = 100;
  const hasHiddenOnce = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      setIsScrolled(currentScrollY > 50);

      if (currentScrollY < scrollThreshold) {
        setIsVisible(true);
        hasHiddenOnce.current = false;
      } else if (currentScrollY > lastScrollY.current && !hasHiddenOnce.current) {
        setIsVisible(false);
        hasHiddenOnce.current = true;
        setTimeout(() => {
          setIsVisible(true);
        }, 950);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'About Us', href: '/about' },
    { 
      name: 'Services', 
      href: '/#services',
      dropdownId: 'services',
      dropdown: [
        { name: 'Fire & Gas Detection', href: '/services/fire-and-gas-detection' },
        { name: 'Control & Instrumentation', href: '/services/control-and-instrumentation' },
        { name: 'Electrical Engineering', href: '/services/electrical-engineering' },
        { name: 'Hazardous Area Classification', href: '/services/hazardous-area-classification' },
        { name: 'Design & Engineering', href: '/services/design-and-engineering' },
        { name: 'Installation & Commissioning', href: '/services/installation-and-commissioning' },
        { name: 'Maintenance & Support', href: '/services/maintenance-and-support' },
      ]
    },
    { name: 'Industries', href: '/industries' },
    { name: 'Insights', href: '/insights' },
    { 
      name: 'Free Resources', 
      href: '/downloads',
      dropdownId: 'freeResources',
      dropdown: [
        { name: 'Free Risk Assessment', href: '/risk-assessment' },
        { name: 'Downloadable Resources', href: '/downloads' },
      ]
    },
    { name: 'Contact Us', href: '/contact' },
  ];

  return (
    <header 
      className={`w-full fixed top-0 z-50 transition-transform duration-[950ms] ease-out ${
        isVisible ? 'translate-y-0' : '-translate-y-[110%]'
      }`}
    >
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-orange-500 origin-left z-[60]"
        style={{ scaleX }}
      />

      {/* Top Bar */}
      <div 
        className={`bg-[#1A2B4C] text-white border-b border-white/10 overflow-hidden transition-all duration-300 ease-in-out ${
          isScrolled ? 'h-0 opacity-0' : 'h-9 md:h-9 opacity-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center text-[10px] md:text-xs h-full">
          <div className="flex items-center space-x-4 md:space-x-6 -ml-[10%]">
            <a href="tel:+27725522110" className="flex items-center hover:text-orange-400 transition-colors">
              <Phone size={12} className="mr-1.5 text-orange-400" />
              <span className="hidden xs:inline">24/7 Emergency Support</span>
              <span className="xs:hidden">24/7 Emergency Support</span>
            </a>
            <a href="mailto:info@touchteq.co.za" className="hidden sm:flex items-center hover:text-orange-400 transition-colors">
              <Mail size={12} className="mr-1.5 text-orange-400" />
              info@touchteq.co.za
            </a>
            <div className="hidden lg:flex items-center cursor-pointer hover:text-orange-400 transition-colors" onClick={() => openMap(COMPANY_ADDRESS)}>
              <MapPin size={12} className="mr-1.5 text-orange-400" />
              91 Sir George Grey St, Horison, Roodepoort, 1724
            </div>
          </div>
          <div className="flex items-center space-x-3 md:space-x-4 ml-auto -mr-[7%]">
            <div className="flex items-center space-x-2 md:space-x-3 border-r border-white/20 pr-3 md:pr-4">
              <a href="https://www.linkedin.com/company/touch-teqniques-engineering-services/" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors">
                LinkedIn
              </a>
              <a href="https://www.facebook.com/TouchTeqniques" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors">
                Facebook
              </a>
              <a href="https://x.com/TouchTeqniques" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors">
                X
              </a>
            </div>
            <div className="flex items-center cursor-pointer hover:text-orange-400 transition-colors">
              <span className="mr-1 uppercase tracking-wider">EN</span>
              <ChevronDown size={12} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className={`transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg py-3' : 'bg-white/90 backdrop-blur-sm py-4'} border-b border-slate-200 h-20 md:h-24`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex justify-between items-center h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group flex-shrink-0">
            <Image 
              src="/TT-logo-orange-trans.png" 
              alt="Touch Teq Engineering" 
              width={180}
              height={50}
              className="h-10 w-auto md:h-12"
              priority
            />
            <div className="flex flex-col">
              <span className="text-[#1A2B4C] font-black text-lg md:text-xl leading-none tracking-normal uppercase group-hover:text-orange-500 transition-colors whitespace-nowrap">Touch Teq</span>
              <span className="text-orange-500 text-[8px] md:text-[10px] font-bold tracking-[0.5em] uppercase whitespace-nowrap">Engineering</span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-8 ml-12">
            {navItems.map((item) => (
              <div key={item.name} className="relative group/item flex items-center h-full">
                {item.dropdown ? (
                  <div 
                    className="flex items-center space-x-1 cursor-pointer text-[#1A2B4C] font-bold text-xs uppercase tracking-widest hover:text-orange-500 transition-colors py-4 whitespace-nowrap"
                    onMouseEnter={() => setActiveDropdown(item.dropdownId || item.name)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <span>{item.name}</span>
                    <ChevronDown size={14} className={`transition-transform duration-300 ${activeDropdown === (item.dropdownId || item.name) ? 'rotate-180' : ''}`} />
                    
                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {activeDropdown === (item.dropdownId || item.name) && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full left-0 w-64 bg-white shadow-2xl rounded-xl border border-slate-100 py-4 z-50 overflow-hidden"
                        >
                          {item.dropdown.map((subItem) => (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              className="block px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[#1A2B4C] hover:bg-slate-50 hover:text-orange-500 transition-all border-l-4 border-transparent hover:border-orange-500 whitespace-nowrap"
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link 
                    href={item.href}
                    className={`font-bold text-xs uppercase tracking-widest transition-colors relative group py-4 whitespace-nowrap flex items-center h-full ${
                      pathname === item.href || 
                      (item.href === '/#services' && pathname.startsWith('/services/')) ||
                      (item.href !== '/' && pathname.startsWith(item.href)) 
                        ? 'text-orange-500' 
                        : 'text-[#1A2B4C] hover:text-orange-500'
                    }`}
                  >
                    {item.name}
                    <span className={`absolute bottom-2 left-0 h-0.5 bg-orange-500 transition-all duration-300 ${
                      pathname === item.href || 
                      (item.href === '/#services' && pathname.startsWith('/services/')) ||
                      (item.href !== '/' && pathname.startsWith(item.href)) 
                        ? 'w-full' 
                        : 'w-0 group-hover:w-full'
                    }`}></span>
                  </Link>
                )}
              </div>
            ))}
            <div className="flex items-center space-x-4 ml-8">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 text-[#1A2B4C] hover:text-orange-500 transition-colors flex-shrink-0"
              >
                <Search size={18} />
              </motion.button>
              <Link 
                href="/contact" 
                className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-md font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 active:scale-95 whitespace-nowrap flex-shrink-0"
              >
                Request a Consultation
              </Link>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center space-x-4 lg:hidden">
            <button className="p-2 text-[#1A2B4C] hover:text-orange-500 transition-colors">
              <Search size={20} />
            </button>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-[#1A2B4C] hover:text-orange-500 transition-colors"
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-40 bg-white lg:hidden flex flex-col pt-24 px-8"
          >
            <div className="flex flex-col space-y-6">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {item.dropdown ? (
                    <div className="space-y-4">
                      <div className="text-2xl font-black text-[#1A2B4C] uppercase tracking-normal flex items-center justify-between">
                        {item.name}
                        <ChevronDown size={20} className="text-orange-500" />
                      </div>
                      <div className="pl-4 space-y-3 border-l-2 border-slate-100">
                        {item.dropdown.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block text-sm font-bold text-slate-500 uppercase tracking-widest hover:text-orange-500 transition-colors"
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Link 
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`text-2xl font-black uppercase tracking-normal transition-colors flex items-center justify-between group ${
                        pathname === item.href || 
                        (item.href === '/#services' && pathname.startsWith('/services/')) ||
                        (item.href !== '/' && pathname.startsWith(item.href))
                          ? 'text-orange-500' 
                          : 'text-[#1A2B4C] hover:text-orange-500'
                      }`}
                    >
                      {item.name}
                      <ArrowRight size={20} className="opacity-0 group-hover:opacity-100 transition-opacity text-orange-500" />
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-auto mb-12 space-y-8"
            >
              <Link 
                href="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full bg-orange-500 text-white text-center py-4 rounded-xl font-black uppercase tracking-widest shadow-xl shadow-orange-500/20"
              >
                Request a Consultation
              </Link>
              
              <div className="flex flex-col space-y-4 text-slate-500">
                <a href="tel:+27725522110" className="flex items-center text-sm font-bold">
                  <Phone size={16} className="mr-3 text-orange-500" />
                  +27 72 552 2110
                </a>
                <a href="mailto:info@touchteq.co.za" className="flex items-center text-sm font-bold">
                  <Mail size={16} className="mr-3 text-orange-500" />
                  info@touchteq.co.za
                </a>
              </div>
              
               <div className="flex space-x-6">
                 <a href="https://www.linkedin.com/company/touch-teqniques-engineering-services/" target="_blank" rel="noopener noreferrer" className="text-[#1A2B4C] hover:text-orange-400 transition-colors">
                   LinkedIn
                 </a>
                 <a href="https://www.facebook.com/TouchTeqniques" target="_blank" rel="noopener noreferrer" className="text-[#1A2B4C] hover:text-orange-400 transition-colors">
                   Facebook
                 </a>
                 <a href="https://x.com/TouchTeqniques" target="_blank" rel="noopener noreferrer" className="text-[#1A2B4C] hover:text-orange-400 transition-colors">
                   X
                 </a>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
