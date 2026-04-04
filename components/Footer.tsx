'use client';

import { motion } from 'motion/react';
import {
  ArrowUpRight,
  Phone,
  Mail,
  MapPin,
  Clock,
  Facebook,
  Linkedin,
  Twitter,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { openMap, COMPANY_ADDRESS } from '@/lib/maps';

export default function Footer() {
  return (
    <footer className="relative w-full bg-[#0A0F1A] text-white overflow-hidden">
      {/* Navigation Links Bar */}
      <div className="border-b border-white/5 py-8">
        <div className="container mx-auto px-4 md:px-8">
          <nav className="flex flex-wrap justify-center md:justify-between gap-6 md:gap-4">
            {[
              { name: 'Home', href: '/' },
              { name: 'About Us', href: '/about' },
              { name: 'Services', href: '/#services' },
              { name: 'Industries', href: '/industries' },
              { name: 'Insights', href: '/insights' },
              { name: 'Free Resources', href: '/downloads' },
              { name: 'Contact Us', href: '/contact' }
            ].map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-orange-500 transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 lg:gap-16">
            {/* Column 1: Logo & Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="space-y-8"
            >
              <div className="flex items-center space-x-3">
                <Image 
                  src="/TT-logo-orange-trans.png" 
                  alt="Touch Teq Engineering" 
                  width={180}
                  height={50}
                  className="h-12 w-auto"
                />
                <div className="flex flex-col">
                  <span className="text-white font-black text-xl leading-none tracking-normal uppercase">Touch Teq</span>
                  <span className="text-orange-500 text-[10px] font-bold tracking-[0.5em] uppercase">Engineering</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                Specialist fire & gas detection, control & instrumentation, and electrical engineering for industrial facilities across Southern Africa.
              </p>
              <div className="flex space-x-4">
                {[Facebook, Linkedin, Twitter].map((Icon, i) => (
                  <Link
                    key={i}
                    href="#"
                    className="w-10 h-10 bg-white/5 flex items-center justify-center text-white hover:bg-orange-500 transition-all"
                  >
                    <Icon size={18} />
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Column 2: Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="space-y-8"
            >
              <h4 className="text-orange-500 font-black text-xs uppercase tracking-[0.3em]">Address Company</h4>
              <ul className="space-y-6">
                <li className="flex items-start space-x-4 group">
                  <MapPin size={18} className="text-orange-500 mt-1 shrink-0" />
                  <button
                    onClick={() => openMap(COMPANY_ADDRESS)}
                    className="text-slate-400 text-sm font-medium group-hover:text-white transition-colors text-left"
                  >
                    91 Sir George Grey St<br />Horizon, Roodepoort, JHB. 1724
                  </button>
                </li>
                <li className="flex items-center space-x-4 group">
                  <Phone size={18} className="text-orange-500 shrink-0" />
                  <a href="tel:+27725522110" className="text-slate-400 text-sm font-medium group-hover:text-white transition-colors">
                    Call Us: +27 72 552 2110
                  </a>
                </li>
                <li className="flex items-center space-x-4 group">
                  <MessageSquare size={18} className="text-orange-500 shrink-0" />
                  <a href="https://wa.me/27725522110" target="_blank" className="text-slate-400 text-sm font-medium group-hover:text-white transition-colors">
                    WhatsApp: +27 72 552 2110
                  </a>
                </li>
                <li className="flex items-center space-x-4 group">
                  <Mail size={18} className="text-orange-500 shrink-0" />
                  <a href="mailto:info@touchteq.co.za" className="text-slate-400 text-sm font-medium group-hover:text-white transition-colors">
                    Mail: info@touchteq.co.za
                  </a>
                </li>
                <li className="flex items-start space-x-4 group">
                  <Clock size={18} className="text-orange-500 mt-1 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-sm font-medium group-hover:text-white transition-colors">
                      Hours: Mon-Fri 8AM-5PM
                    </span>
                    <span className="text-orange-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                      24/7 Emergency Support Available
                    </span>
                  </div>
                </li>
              </ul>
            </motion.div>

            {/* Column 3: Services */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="space-y-8"
            >
              <h4 className="text-orange-500 font-black text-xs uppercase tracking-[0.3em]">Our Services</h4>
              <ul className="space-y-4">
                {[
                  { name: 'Fire & Gas Detection', href: '/services/fire-and-gas-detection' },
                  { name: 'Control & Instrumentation', href: '/services/control-and-instrumentation' },
                  { name: 'Electrical Engineering', href: '/services/electrical-engineering' },
                  { name: 'Hazardous Area Classification', href: '/services/hazardous-area-classification' },
                  { name: 'Design & Engineering', href: '/services/design-and-engineering' },
                  { name: 'Installation & Commissioning', href: '/services/installation-and-commissioning' },
                  { name: 'Maintenance & Support', href: '/services/maintenance-and-support' }
                ].map((service) => (
                  <li key={service.name} className="flex items-center space-x-2 group">
                    <ChevronRight size={14} className="text-orange-500 group-hover:translate-x-1 transition-transform" />
                    <Link
                      href={service.href}
                      className="text-slate-400 text-sm font-medium group-hover:text-white transition-colors"
                    >
                      {service.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Column 4: Registrations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="space-y-8"
            >
              <h4 className="text-orange-500 font-black text-xs uppercase tracking-[0.3em]">Registrations</h4>
              <ul className="space-y-4 mb-8">
                {[
                  'ECSA Pr Tech Eng (Electrical)',
                  'SAQCC Fire Industry: DGS15/0130',
                  'B-BBEE Level 1 Contributor'
                ].map((reg) => (
                  <li key={reg} className="flex items-center space-x-2 group">
                    <ChevronRight size={14} className="text-orange-500" />
                    <span className="text-slate-400 text-sm font-medium group-hover:text-white transition-colors">
                      {reg}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="relative w-32 h-32 bg-white p-2 rounded-sm shadow-xl">
                <Image
                  src="/bbbee.jpeg"
                  alt="B-BBEE Level 1"
                  width={128}
                  height={128}
                  className="object-contain"
                />
                <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white text-[8px] font-black uppercase px-2 py-1">
                  Level 1
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="border-t border-white/5 py-8 bg-black/20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-2">
              <div className="w-1 h-1 bg-orange-500"></div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                Copyright © {new Date().getFullYear()} Touch Teq Engineering. All Rights Reserved. A <Link href="https://www.kreativereflow.com/" target="_blank" className="text-orange-500 hover:underline">Kreative Reflow</Link> Design.
              </p>
            </div>
            <div className="flex space-x-8">
              <Link
                href="/privacy"
                className="text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
