'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, Mail, MapPin, ArrowUpRight, ChevronDown, Check, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { sendGAEvent } from '@next/third-parties/google';
import { Turnstile } from '@marsidev/react-turnstile';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import {
  validateName,
  validateEmail,
  validatePhone,
  validateService,
  validateMessage,
  sanitizeInput,
  VALID_SERVICES_SHORT,
  FormErrors
} from '@/lib/formValidation';
import { openMap, COMPANY_ADDRESS } from '@/lib/maps';

const services = VALID_SERVICES_SHORT;

export default function ContactSection() {
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileInstance>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    service: services[0],
    message: ''
  });

  const [isOpen, setIsOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const pageLoadTime = useRef<number>(0);
  const formRef = useRef<HTMLFormElement>(null);

  // Initialize page load time on mount
  useEffect(() => {
    pageLoadTime.current = Date.now();
  }, []);

  const validateField = (field: string, value: string) => {
    let error: string | undefined;

    switch (field) {
      case 'fullName':
        error = validateName(value).error;
        break;
      case 'email':
        error = validateEmail(value).error;
        break;
      case 'phone':
        error = validatePhone(value).error;
        break;
      case 'service':
        error = validateService(value, services).error;
        break;
      case 'message':
        error = validateMessage(value).error;
        break;
    }

    setErrors(prev => ({ ...prev, [field]: error || '' }));
    return !error;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field as keyof typeof formData]);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const timeSinceLoad = Date.now() - pageLoadTime.current;
    if (timeSinceLoad < 3000) {
      return;
    }

    const form = e.target as HTMLFormElement;
    const honeypot = form.querySelector('input[name="honeypot"]') as HTMLInputElement;
    if (honeypot?.value) {
      return;
    }

    const newErrors: FormErrors = {};

    const nameResult = validateName(formData.fullName);
    if (!nameResult.valid) newErrors.fullName = nameResult.error!;

    const emailResult = validateEmail(formData.email);
    if (!emailResult.valid) newErrors.email = emailResult.error!;

    const phoneResult = validatePhone(formData.phone);
    if (!phoneResult.valid) newErrors.phone = phoneResult.error!;

    const serviceResult = validateService(formData.service, services);
    if (!serviceResult.valid) newErrors.service = serviceResult.error!;

    const messageResult = validateMessage(formData.message);
    if (!messageResult.valid) newErrors.message = messageResult.error!;

    setTouched({
      fullName: true,
      email: true,
      phone: true,
      service: true,
      message: true
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!agreed) {
      setErrors({ ...newErrors, agreed: 'Please accept the terms and conditions' });
      return;
    }

    setIsSubmitting(true);

    let token = turnstileToken;

    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !token) {
      turnstileRef.current?.execute();
      await new Promise(resolve => setTimeout(resolve, 1500));
      token = turnstileToken;
    }

    const sanitizedData = {
      fullName: sanitizeInput(formData.fullName),
      email: sanitizeInput(formData.email),
      phone: sanitizeInput(formData.phone),
      service: formData.service,
      message: sanitizeInput(formData.message),
      token
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitizedData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit. Please try again.");
      }

      setIsSubmitting(false);
      setShowSuccess(true);
      sendGAEvent('event', 'contact_form_submit');
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        service: services[0],
        message: ''
      });
      setAgreed(false);
      setErrors({});
      setTouched({});
    } catch (err: any) {
      setErrors({ ...errors, request: err.message || "An unexpected error occurred." });
      setIsSubmitting(false);
    }
  };

  const [scrollY, setScrollY] = useState(0);
  const [textColor, setTextColor] = useState('text-white');

  useEffect(() => {
    const handleScroll = () => {
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        const rect = contactSection.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          setScrollY(-rect.top * 0.3);
          // Change text color based on scroll position
          const scrollProgress = Math.abs(rect.top) / 400;
          if (scrollProgress > 0.3) {
            setTextColor('text-[#1A2B4C]');
          } else {
            setTextColor('text-white');
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getFieldError = (field: string) => {
    if (field === 'request') return errors.request || '';
    return touched[field] && errors[field] ? errors[field] : '';
  };

  return (
    <section id="contact" className="relative bg-white overflow-hidden">
      <div className="relative h-[250px] md:h-[300px] lg:h-[400px] w-full overflow-hidden">
        <div 
          className="absolute inset-0 will-change-transform"
          style={{ transform: `translateY(${scrollY}px)` }}
        >
          <Image
            src="/git.jpeg"
            alt="Industrial Refinery"
            fill
            className="object-cover brightness-75"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/20"></div>
      </div>

      <div className="container mx-auto px-4 md:px-8 -mt-16 md:-mt-24 relative z-10 pb-16 md:pb-24">
        <div className="flex flex-col lg:flex-row gap-8 md:gap-12 items-stretch">

          <div className="lg:w-1/3 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-2 h-2 bg-orange-500"></div>
                <span className={`${textColor} font-black text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em]`}>
                  Let&apos;s Work Together
                </span>
              </div>
              <h2 className="text-[#ff6900] text-3xl sm:text-4xl md:text-5xl lg:text-[65px] font-black uppercase tracking-normal leading-none mb-6">
                Get In Touch <br />
                With Us
              </h2>
              <p className="text-slate-500 text-lg mb-12 font-medium leading-relaxed max-w-md">
                Need fire & gas detection, control & instrumentation, or electrical engineering for your industrial facility? Get a free consultation from a qualified engineer.
              </p>

              <div className="space-y-10">
                <div className="group">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Call support center 24/7</p>
                  <a href="tel:+27725522110" className="text-2xl md:text-3xl font-black text-orange-500 hover:text-[#1A2B4C] transition-colors">
                    +27 72 552 2110
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                      <MapPin size={14} className="text-orange-500" /> Office Location
                    </p>
                    <button onClick={() => openMap(COMPANY_ADDRESS)} className="text-[#1A2B4C] font-black uppercase text-sm leading-tight hover:text-orange-500 transition-colors text-left">
                      91 Sir George Grey St <br />
                      Horizon, Roodepoort, 1724
                    </button>
                  </div>

                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Mail size={14} className="text-orange-500" /> Write to us
                    </p>
                    <a href="mailto:info@touchteq.co.za" className="text-[#1A2B4C] font-black uppercase text-sm hover:text-orange-500 transition-colors">
                      info@touchteq.co.za
                    </a>
                  </div>
                </div>

                <div className="pt-4">
                  <Link href="/contact#request-quote" className="text-orange-500 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                    <span>View Full Contact Details</span>
                    <ArrowUpRight size={16} />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="lg:w-2/3">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white p-8 md:p-12 shadow-[0_30px_60px_-15px_rgba(26,43,76,0.15)] border-t-4 border-orange-500 h-full"
            >
              <AnimatePresence mode="wait">
                {showSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Check size={40} className="text-green-600" />
                    </div>
                    <h3 className="text-[#1A2B4C] text-2xl font-black uppercase tracking-normal mb-4">
                      Thank You!
                    </h3>
                    <p className="text-slate-600 mb-6">
                      Your inquiry has been submitted successfully. A member of our engineering team will review your submission and respond within one business day.
                    </p>
                    <p className="text-slate-500 text-sm">
                      If your request is urgent, please call us directly on +27 72 552 2110
                    </p>
                    <button
                      onClick={() => setShowSuccess(false)}
                      className="mt-8 text-orange-500 font-black text-sm uppercase tracking-widest hover:underline"
                    >
                      Send Another Message
                    </button>
                  </motion.div>
                ) : (
                  <form ref={formRef} className="space-y-6" onSubmit={onSubmit}>
                    <input type="text" name="honeypot" className="hidden" tabIndex={-1} autoComplete="off" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="relative">
                        <input
                          type="text"
                          name="fullName"
                          placeholder="*Full Name"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                          onBlur={() => handleBlur('fullName')}
                          className={`w-full px-6 py-4 bg-slate-50 border ${getFieldError('fullName') ? 'border-red-500' : 'border-slate-100'} focus:border-orange-500 focus:bg-white outline-none transition-all font-medium text-[#1A2B4C] placeholder:text-slate-400`}
                        />
                        {getFieldError('fullName') && (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {getFieldError('fullName')}
                          </p>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="email"
                          name="email"
                          placeholder="*Email Address"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          onBlur={() => handleBlur('email')}
                          className={`w-full px-6 py-4 bg-slate-50 border ${getFieldError('email') ? 'border-red-500' : 'border-slate-100'} focus:border-orange-500 focus:bg-white outline-none transition-all font-medium text-[#1A2B4C] placeholder:text-slate-400`}
                        />
                        {getFieldError('email') && (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {getFieldError('email')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="relative">
                        <input
                          type="tel"
                          name="phone"
                          placeholder="*Phone Number"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          onBlur={() => handleBlur('phone')}
                          className={`w-full px-6 py-4 bg-slate-50 border ${getFieldError('phone') ? 'border-red-500' : 'border-slate-100'} focus:border-orange-500 focus:bg-white outline-none transition-all font-medium text-[#1A2B4C] placeholder:text-slate-400`}
                        />
                        {getFieldError('phone') && (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {getFieldError('phone')}
                          </p>
                        )}
                      </div>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsOpen(!isOpen)}
                          className={`w-full px-6 py-4 bg-slate-50 border flex items-center justify-between transition-all font-medium text-left ${getFieldError('service') ? 'border-red-500' : ''} ${isOpen ? 'border-orange-500 bg-white' : 'border-slate-100'}`}
                        >
                          <span className={formData.service ? 'text-[#1A2B4C]' : 'text-slate-400'}>
                            {formData.service || 'Select Service'}
                          </span>
                          <ChevronDown size={18} className={`text-orange-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isOpen && (
                          <div
                            className="absolute top-full left-0 w-full bg-white border border-slate-100 shadow-2xl z-50 mt-1 max-h-60 overflow-y-auto"
                            onWheel={(e) => e.stopPropagation()}
                          >
                            {services.map((service) => (
                              <button
                                key={service}
                                type="button"
                                onClick={() => {
                                  handleInputChange('service', service);
                                  setIsOpen(false);
                                }}
                                className="w-full px-6 py-3 text-left hover:bg-slate-50 text-slate-600 hover:text-orange-500 font-medium transition-colors border-b border-slate-50 last:border-0"
                              >
                                {service}
                              </button>
                            ))}
                          </div>
                        )}
                        {getFieldError('service') && (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle size={12} /> {getFieldError('service')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="relative">
                      <textarea
                        name="message"
                        rows={6}
                        placeholder="Write Message...."
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        onBlur={() => handleBlur('message')}
                        className={`w-full px-6 py-4 bg-slate-50 border ${getFieldError('message') ? 'border-red-500' : 'border-slate-100'} focus:border-orange-500 focus:bg-white outline-none transition-all font-medium text-[#1A2B4C] placeholder:text-slate-400 resize-none`}
                      ></textarea>
                      <div className="flex justify-between items-center mt-1">
                        {getFieldError('message') && (
                          <p className="text-red-500 text-xs flex items-center gap-1">
                            <AlertCircle size={12} /> {getFieldError('message')}
                          </p>
                        )}
                        <p className="text-slate-400 text-xs ml-auto">
                          {formData.message.length} / 3000 characters
                        </p>
                      </div>
                    </div>

                    {getFieldError('request') && (
                      <div className="mb-6 bg-red-50 text-red-600 text-sm font-bold px-4 py-3 rounded-md text-left border border-red-100">
                        {getFieldError('request')}
                      </div>
                    )}

                    {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                      <div className="mb-6">
                        <Turnstile 
                          ref={turnstileRef}
                          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} 
                          onSuccess={(t) => setTurnstileToken(t)} 
                          options={{ size: "invisible" }}
                        />
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-4">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div
                          onClick={() => setAgreed(!agreed)}
                          className={`w-6 h-6 border-2 flex items-center justify-center transition-all ${agreed ? 'bg-orange-500 border-orange-500' : 'border-slate-200 group-hover:border-orange-300'}`}
                        >
                          {agreed && <Check size={14} className="text-white" />}
                        </div>
                        <span className="text-slate-500 text-sm font-medium">
                          I accept the <Link href="#" className="text-orange-500 hover:underline">Terms & Conditions</Link> and <Link href="#" className="text-orange-500 hover:underline">Privacy Policy</Link> of Touch Teq Engineering.
                        </span>
                      </label>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="group relative flex items-center bg-orange-500 hover:bg-orange-600 transition-all rounded-sm overflow-hidden shadow-xl shadow-orange-500/20 w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="px-10 py-4 text-white font-black text-xs uppercase tracking-[0.2em]">
                          {isSubmitting ? 'Sending...' : 'Send Message'}
                        </span>
                        <div className="bg-[#1A2B4C] p-4 flex items-center justify-center group-hover:bg-black transition-colors">
                          <ArrowUpRight className="text-white w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                      </button>
                    </div>
                  </form>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
