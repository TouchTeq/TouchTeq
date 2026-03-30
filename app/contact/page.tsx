'use client';

import { motion, AnimatePresence } from 'motion/react';
import {
  Phone, Mail, MapPin, Clock, ChevronRight, ArrowRight,
  Check, ChevronDown, Globe, ShieldCheck, MessageSquare,
  Headphones, AlertCircle, Building2, Plus, Minus, FileUp,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import FAQJsonLd from '@/components/seo/FAQJsonLd';
import { 
  validateName, 
  validateCompanyName, 
  validateEmail, 
  validatePhone, 
  validateMobileNumber,
  validateOfficeNumber,
  validateExtension,
  validateService, 
  validateMessage,
  validateTimeline,
  validateJobTitle,
  validateLocation,
  sanitizeInput,
  sanitizePhoneNumber,
  VALID_SERVICES,
  VALID_TIMELINES,
  VALID_PROJECT_STAGES,
  FormErrors
} from '@/lib/formValidation';
import { sendGAEvent } from '@next/third-parties/google';
import { Turnstile } from '@marsidev/react-turnstile';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { openMap, COMPANY_ADDRESS } from '@/lib/maps';

// SEO Metadata would typically be in a separate file or exported from page.tsx (Next.js 13+ App Router)
// Since this is a client component, we'll handle the content here.

const services = VALID_SERVICES;

const projectStages = VALID_PROJECT_STAGES;

const timelines = VALID_TIMELINES;

const faqs = [
  { q: "How quickly can you mobilise to a site?", a: "For clients on active maintenance agreements, we can typically mobilise to sites in the Gauteng, Mpumalanga, and KwaZulu-Natal regions within 24 to 48 hours for emergency callouts. For planned project work, mobilisation is scheduled as part of the project programme. Cross-border mobilisation timelines depend on permit and travel logistics, which we manage as part of our project delivery scope." },
  { q: "Do you respond to formal tenders and RFQs?", a: "Yes. We regularly participate in formal procurement and tender processes for large industrial projects. We provide fully compliant quotations with detailed technical proposals, project programmes, resource plans, and all required commercial and legal documentation. If you have a specific tender format or compliance checklist, send it through and we will work to your requirements." },
  { q: "Can we visit your office to discuss a project in person?", a: "Absolutely. We welcome face-to-face meetings, especially for larger or more complex projects where a detailed discussion is valuable. Contact us to arrange a time so we can make sure the right engineers are available when you visit." },
  { q: "Do you provide services to small and medium-sized facilities, or only large refineries and plants?", a: "We work across the full range. While a significant portion of our work is for large industrial clients in oil and gas, petrochemicals, and mining, we also support smaller facilities such as fuel depots, manufacturing plants, food processing operations, and pharmaceutical sites. The size of the facility does not change the standard of engineering we apply. If you have a hazardous area, a fire and gas requirement, or an electrical and instrumentation need, we can help." },
  { q: "What information should I have ready before contacting you?", a: "The more detail you can provide upfront, the faster and more accurately we can respond. Useful information includes the type of facility, the service you require, any relevant drawings or specifications, the project location, your preferred timeline, and any specific standards or client specifications that apply. If you do not have all of this, do not let that stop you from reaching out. We can work through the scoping process together." },
  { q: "Are you registered as a vendor with major industrial clients?", a: "Yes. We are registered as an approved vendor and service provider with several major industrial organisations across Southern Africa. If you require vendor registration as part of your procurement process, we can provide all necessary documentation including company registration, tax clearance, B-BBEE certification, insurance certificates, and health and safety records." },
  { q: "Do you offer maintenance agreements or ongoing support contracts?", a: "Yes. We provide ongoing maintenance and support agreements that cover scheduled maintenance, emergency callouts, and technical support for fire and gas detection systems, control and instrumentation installations, and electrical systems. These agreements are tailored to the specific requirements of each client and can include 24/7 emergency cover. Contact us to discuss the options." },
  { q: "Can you support projects that are already underway with another contractor?", a: "Yes. We regularly provide specialist engineering support to projects that are being delivered by other contractors or EPC firms. This can include design review, hazardous area classification, fire and gas detection expertise, commissioning support, or as-built documentation. We work collaboratively with your existing project team and integrate into the project structure." }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0
  }
};

export default function ContactPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [selectedService, setSelectedService] = useState("");
  const [selectedTimeline, setSelectedTimeline] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileInstance>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    email: '',
    mobileNumber: '',
    officeNumber: '',
    extension: '',
    service: '',
    timeline: '',
    message: ''
  });

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
      case 'companyName':
        error = validateCompanyName(value).error;
        break;
      case 'email':
        error = validateEmail(value).error;
        break;
      case 'mobileNumber':
        error = validateMobileNumber(value).error;
        break;
      case 'officeNumber':
        error = validateOfficeNumber(value).error;
        break;
      case 'extension':
        error = validateExtension(value).error;
        break;
      case 'service':
        error = validateService(value, services).error;
        break;
      case 'timeline':
        error = validateTimeline(value).error;
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

  const getFieldError = (field: string) => {
    if (field === 'request') return errors.request || '';
    return touched[field] && errors[field] ? errors[field] : '';
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
    
    const companyResult = validateCompanyName(formData.companyName);
    if (!companyResult.valid) newErrors.companyName = companyResult.error!;
    
    const emailResult = validateEmail(formData.email);
    if (!emailResult.valid) newErrors.email = emailResult.error!;
    
    const mobileResult = validateMobileNumber(formData.mobileNumber);
    if (!mobileResult.valid) newErrors.mobileNumber = mobileResult.error!;
    
    const officeResult = validateOfficeNumber(formData.officeNumber);
    if (!officeResult.valid) newErrors.officeNumber = officeResult.error!;
    
    const extResult = validateExtension(formData.extension);
    if (!extResult.valid) newErrors.extension = extResult.error!;
    
    const serviceResult = validateService(formData.service, services);
    if (!serviceResult.valid) newErrors.service = serviceResult.error!;
    
    const messageResult = validateMessage(formData.message);
    if (!messageResult.valid) newErrors.message = messageResult.error!;

    setTouched({
      fullName: true,
      companyName: true,
      email: true,
      mobileNumber: true,
      officeNumber: true,
      extension: true,
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
      companyName: sanitizeInput(formData.companyName),
      email: sanitizeInput(formData.email),
      mobileNumber: sanitizePhoneNumber(formData.mobileNumber),
      officeNumber: formData.officeNumber ? sanitizePhoneNumber(formData.officeNumber) : '',
      extension: formData.extension.replace(/\D/g, ''),
      service: formData.service,
      timeline: formData.timeline,
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
        companyName: '',
        email: '',
        mobileNumber: '',
        officeNumber: '',
        extension: '',
        service: '',
        timeline: '',
        message: ''
      });
      setSelectedService('');
      setSelectedTimeline('');
      setAgreed(false);
      setErrors({});
      setTouched({});
    } catch (err: any) {
      setErrors({ ...errors, request: err.message || "An unexpected error occurred." });
      setIsSubmitting(false);
    }
  };

  return (
    <main className="bg-white min-h-screen font-sans">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://touchteq.co.za' },
          { name: 'Contact Us', url: 'https://touchteq.co.za/contact' },
        ]}
      />
      <FAQJsonLd
        faqs={faqs.map((faq) => ({
          question: faq.q,
          answer: faq.a,
        }))}
      />
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 bg-[#1A2B4C] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://picsum.photos/seed/contact-industrial/1920/1080"
            alt="Contact Touch Teq"
            fill
            className="object-cover opacity-30"
            priority
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A2B4C] via-[#1A2B4C]/90 to-[#1A2B4C]/40"></div>
          
          {/* Animated Particles */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.3, 0.1]
              }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-500/20 rounded-full blur-[100px]"
            ></motion.div>
            <motion.div 
              animate={{ 
                scale: [1.2, 1, 1.2],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{ duration: 10, repeat: Infinity }}
              className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]"
            ></motion.div>
          </div>
        </div>

        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <motion.nav 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-8"
          >
            <Link href="/" className="hover:text-orange-500 transition-colors">Home</Link>
            <ChevronRight size={12} />
            <span className="text-white">Contact Us</span>
          </motion.nav>

          <div className="max-w-4xl">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }}
              className="text-4xl md:text-7xl font-black text-white uppercase tracking-tight mb-8 leading-[0.9]"
            >
              Get in Touch With Our <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-400 to-orange-300 tracking-normal">
                Engineering Team
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-slate-300 text-lg md:text-xl max-w-2xl leading-relaxed font-medium mb-10"
            >
              Whether you are scoping a new project, need a compliance audit, or require urgent technical support, our engineers are ready to talk. We support industrial operations across the Southern African region.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="flex flex-wrap gap-4"
            >
              <Link href="#request-quote" className="group flex items-stretch bg-white hover:bg-slate-100 transition-all rounded-md overflow-hidden shadow-xl max-w-full">
                <span className="px-6 md:px-8 py-3 flex items-center text-[#0A1120] group-hover:text-orange-500 font-black text-[11px] md:text-sm uppercase tracking-widest text-left transition-colors">
                  REQUEST A QUOTE
                </span>
                <div className="bg-[#ff6900] px-4 md:px-5 flex items-center justify-center group-hover:bg-orange-600 transition-colors shrink-0">
                  <ArrowRight className="text-white w-4 h-4 -rotate-45 group-hover:rotate-0 transition-all duration-300" />
                </div>
              </Link>
              <a href="tel:+27725522110" className="group flex items-stretch bg-orange-500 hover:bg-orange-600 transition-all rounded-md overflow-hidden shadow-xl shadow-orange-500/20 max-w-full">
                <span className="px-6 md:px-8 py-3 flex items-center text-white font-black text-[11px] md:text-sm uppercase tracking-widest text-left">
                  <Phone size={16} className="mr-3" />
                  CALL US NOW
                </span>
                <div className="bg-[#1A2B4C] px-5 flex items-center justify-center group-hover:bg-black transition-colors shrink-0">
                  <ArrowRight className="text-white w-4 h-4 -rotate-45 group-hover:rotate-0 group-hover:text-orange-500 transition-all duration-300" />
                </div>
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 1: How to Reach Us */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50/50 -skew-x-12 translate-x-32 pointer-events-none"></div>
        
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="max-w-3xl mb-20">
            <motion.span 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-6"
            >
              GET IN TOUCH
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-[#1A2B4C] text-3xl md:text-6xl font-black uppercase tracking-normal mb-8 leading-tight"
            >
              Direct Access to <span className="text-orange-500">Specialist Engineering</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-slate-600 text-base md:text-lg leading-relaxed font-medium max-w-xl"
            >
              We route every inquiry directly to our engineering team, not a generic call centre. When you contact Touch Teq, you speak to people who understand the technical complexities of your facility.
            </motion.p>
          </div>
          
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {/* Call */}
              <motion.div 
                variants={itemVariants} 
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="group bg-white p-6 md:p-8 rounded-xl border border-slate-200 hover:border-orange-500/50 hover:shadow-2xl hover:shadow-slate-200/50 transition-all cursor-default"
              >
                <motion.div 
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mb-6 group-hover:bg-orange-500 transition-colors"
                >
                  <Headphones className="text-[#1A2B4C] group-hover:text-white transition-colors" size={24} />
                </motion.div>
                <h3 className="text-[#1A2B4C] font-black text-base md:text-lg mb-4 uppercase tracking-normal">Speak to an Engineer</h3>
                <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-6">For project discussions, technical questions, or site support requirements.</p>
                <div className="space-y-1">
                  <a href="tel:+27725522110" className="text-[#1A2B4C] font-black text-lg hover:text-orange-500 transition-colors">+27 72 552 2110</a>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Mon - Fri: 07:00 - 17:00 (SAST)</p>
                </div>
              </motion.div>

              {/* Email */}
              <motion.div 
                variants={itemVariants} 
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                className="group bg-white p-6 md:p-8 rounded-xl border border-slate-200 hover:border-orange-500/50 hover:shadow-2xl hover:shadow-slate-200/50 transition-all cursor-default"
              >
                <motion.div 
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mb-6 group-hover:bg-orange-500 transition-colors"
                >
                  <Mail className="text-[#1A2B4C] group-hover:text-white transition-colors" size={24} />
                </motion.div>
                <h3 className="text-[#1A2B4C] font-black text-base md:text-lg mb-4 uppercase tracking-normal">Send Requirements</h3>
                <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-6">Send formal RFQs, project specs, or general inquiries. 24h response time.</p>
                <div className="space-y-2">
                  <a href="mailto:info@touchteq.co.za" className="text-orange-500 font-black text-sm block hover:underline transition-all">info@touchteq.co.za</a>
                  <a href="mailto:engineering@touchteq.co.za" className="text-orange-500 font-black text-sm block hover:underline transition-all">engineering@touchteq.co.za</a>
                </div>
              </motion.div>

              {/* Visit */}
              <motion.div 
                variants={itemVariants} 
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                className="group bg-white p-6 md:p-8 rounded-xl border border-slate-200 hover:border-orange-500/50 hover:shadow-2xl hover:shadow-slate-200/50 transition-all cursor-default"
              >
                <motion.div 
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mb-6 group-hover:bg-orange-500 transition-colors"
                >
                  <MapPin className="text-[#1A2B4C] group-hover:text-white transition-colors" size={24} />
                </motion.div>
                <h3 className="text-[#1A2B4C] font-black text-base md:text-lg mb-4 uppercase tracking-normal">Our Head Office</h3>
                <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-6">91 Sir George Grey St, Horizon, Roodepoort, 1724, South Africa.</p>
                <button onClick={() => openMap(COMPANY_ADDRESS)} className="flex items-center text-orange-500 font-black text-sm group/link">
                  <span>OPEN IN MAPS</span>
                  <ArrowUpRight size={14} className="ml-1 group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
                </button>
              </motion.div>

              {/* Regional */}
              <motion.div 
                variants={itemVariants} 
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
                className="group p-10 bg-[#1A2B4C] rounded-3xl border border-transparent hover:border-orange-500/50 hover:shadow-2xl hover:shadow-blue-900/20 transition-all duration-500"
              >
                <div className="w-14 h-14 bg-white/10 text-orange-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                  <Globe size={28} />
                </div>
                <h3 className="text-white text-xl font-black uppercase tracking-normal mb-4">Regional Coverage</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">We mobilise engineering teams to industrial sites across Southern Africa.</p>
                <p className="text-white font-black text-sm uppercase tracking-widest">SADC REGION</p>
              </motion.div>
            </motion.div>
        </div>
      </section>

      {/* Section 2: Request a Quote or Consultation */}
      <section id="request-quote" className="py-32 bg-slate-50 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-500/5 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px]"></div>
        
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white p-6 md:p-12 lg:p-20 rounded-2xl md:rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-100">
              <div className="max-w-2xl mb-10 md:mb-16">
                <motion.span 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-orange-500 font-black text-[10px] md:text-xs uppercase tracking-[0.3em] md:tracking-[0.4em] block mb-4 md:mb-6"
                >
                  START A CONVERSATION
                </motion.span>
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="text-[#1A2B4C] text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black uppercase tracking-normal mb-6 md:mb-8 leading-tight"
                >
                  Project Scoping & Consultation
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="text-slate-500 text-base md:text-lg"
                >
                  Provide as much detail as possible. A qualified engineer will review your submission and contact you within one business day.
                </motion.p>
              </div>
              
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
                      type="button"
                      onClick={() => setShowSuccess(false)}
                      className="mt-8 text-orange-500 font-black text-sm uppercase tracking-widest hover:underline"
                    >
                      Send Another Message
                    </button>
                  </motion.div>
                ) : (
                  <form ref={formRef} className="space-y-8" onSubmit={onSubmit}>
                    <input type="text" name="honeypot" className="hidden" tabIndex={-1} autoComplete="off" />
                    
                    <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 md:ml-4">Full Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. John Smith" 
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      onBlur={() => handleBlur('fullName')}
                      className={`w-full px-4 md:px-6 py-3 md:py-4 bg-slate-50 border ${getFieldError('fullName') ? 'border-red-500' : 'border-slate-100'} focus:border-orange-500 focus:bg-white outline-none transition-all font-medium text-sm md:text-base`} 
                    />
                    {getFieldError('fullName') && (
                      <p className="text-red-500 text-xs flex items-center gap-1 ml-2 md:ml-4">
                        <AlertCircle size={12} /> {getFieldError('fullName')}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 md:ml-4">Company Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Global Refineries Ltd" 
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      onBlur={() => handleBlur('companyName')}
                      className={`w-full px-4 md:px-6 py-3 md:py-4 bg-slate-50 border ${getFieldError('companyName') ? 'border-red-500' : 'border-slate-100'} focus:border-orange-500 focus:bg-white outline-none transition-all font-medium text-sm md:text-base`}
                    />
                    {getFieldError('companyName') && (
                      <p className="text-red-500 text-xs flex items-center gap-1 ml-2 md:ml-4">
                        <AlertCircle size={12} /> {getFieldError('companyName')}
                      </p>
                    )}
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 md:ml-4">Email Address *</label>
                    <input 
                      type="email" 
                      placeholder="john@company.co.za" 
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      className={`w-full px-4 md:px-6 py-3 md:py-4 bg-slate-50 border ${getFieldError('email') ? 'border-red-500' : 'border-slate-100'} focus:border-orange-500 focus:bg-white outline-none transition-all font-medium text-sm md:text-base`}
                    />
                    {getFieldError('email') && (
                      <p className="text-red-500 text-xs flex items-center gap-1 ml-2 md:ml-4">
                        <AlertCircle size={12} /> {getFieldError('email')}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 md:ml-4">Mobile Number *</label>
                    <input 
                      type="tel" 
                      placeholder="+27 82 123 4567" 
                      value={formData.mobileNumber}
                      onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                      onBlur={() => handleBlur('mobileNumber')}
                      className={`w-full px-4 md:px-6 py-3 md:py-4 bg-slate-50 border ${getFieldError('mobileNumber') ? 'border-red-500' : 'border-slate-100'} focus:border-orange-500 focus:bg-white outline-none transition-all font-medium text-sm md:text-base`}
                    />
                    {getFieldError('mobileNumber') && (
                      <p className="text-red-500 text-xs flex items-center gap-1 ml-2 md:ml-4">
                        <AlertCircle size={12} /> {getFieldError('mobileNumber')}
                      </p>
                    )}
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 md:ml-4">Office / Landline Number</label>
                    <input 
                      type="tel" 
                      placeholder="+27 11 234 5678" 
                      value={formData.officeNumber}
                      onChange={(e) => handleInputChange('officeNumber', e.target.value)}
                      onBlur={() => handleBlur('officeNumber')}
                      className={`w-full px-4 md:px-6 py-3 md:py-4 bg-slate-50 border ${getFieldError('officeNumber') ? 'border-red-500' : 'border-slate-100'} focus:border-orange-500 focus:bg-white outline-none transition-all font-medium text-sm md:text-base`}
                    />
                    {getFieldError('officeNumber') && (
                      <p className="text-red-500 text-xs flex items-center gap-1 ml-2 md:ml-4">
                        <AlertCircle size={12} /> {getFieldError('officeNumber')}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Ext.</label>
                    <input 
                      type="tel" 
                      placeholder="4012" 
                      value={formData.extension}
                      onChange={(e) => handleInputChange('extension', e.target.value)}
                      onBlur={() => handleBlur('extension')}
                      className={`w-full px-6 py-4 bg-slate-50 border ${getFieldError('extension') ? 'border-red-500' : 'border-slate-100'} focus:border-orange-500 focus:bg-white outline-none transition-all font-medium`}
                    />
                    {getFieldError('extension') && (
                      <p className="text-red-500 text-xs flex items-center gap-1 ml-4">
                        <AlertCircle size={12} /> {getFieldError('extension')}
                      </p>
                    )}
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Service Required *</label>
                    <button
                      type="button"
                      onClick={() => setIsOpen(!isOpen)}
                      className={`w-full px-6 py-4 bg-slate-50 border flex items-center justify-between transition-all font-medium text-left ${isOpen ? 'border-orange-500 bg-white' : 'border-slate-100'}`}
                    >
                      <span className={selectedService ? 'text-[#1A2B4C]' : 'text-slate-400'}>
                        {selectedService || 'Select Service'}
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
                              setSelectedService(service);
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
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Estimated Timeline</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsTimelineOpen(!isTimelineOpen)}
                        className={`w-full px-6 py-4 bg-slate-50 border flex items-center justify-between transition-all font-medium text-left ${isTimelineOpen ? 'border-orange-500 bg-white' : 'border-slate-100'}`}
                      >
                        <span className={selectedTimeline ? 'text-[#1A2B4C]' : 'text-slate-400'}>
                          {selectedTimeline || 'Select Timeline'}
                        </span>
                        <ChevronDown size={18} className={`text-orange-500 transition-transform ${isTimelineOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isTimelineOpen && (
                        <div 
                          className="absolute top-full left-0 w-full bg-white border border-slate-100 shadow-2xl z-50 mt-1 max-h-60 overflow-y-auto"
                          onWheel={(e) => e.stopPropagation()}
                        >
                          {timelines.map((timeline) => (
                            <button
                              key={timeline}
                              type="button"
                              onClick={() => {
                                setSelectedTimeline(timeline);
                                handleInputChange('timeline', timeline);
                                setIsTimelineOpen(false);
                              }}
                              className="w-full px-6 py-3 text-left hover:bg-slate-50 text-slate-600 hover:text-orange-500 font-medium transition-colors border-b border-slate-50 last:border-0"
                            >
                              {timeline}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                  className="space-y-2"
                >
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Message / Project Details *</label>
                  <textarea 
                    rows={6} 
                    placeholder="Describe your project requirements, site conditions, and specific challenges..." 
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    onBlur={() => handleBlur('message')}
                    className={`w-full px-6 py-4 bg-slate-50 border ${getFieldError('message') ? 'border-red-500' : 'border-slate-100'} focus:border-orange-500 focus:bg-white outline-none transition-all font-medium resize-none`}
                  ></textarea>
                  <div className="flex justify-between items-center">
                    {getFieldError('message') && (
                      <p className="text-red-500 text-xs flex items-center gap-1 ml-4">
                        <AlertCircle size={12} /> {getFieldError('message')}
                      </p>
                    )}
                    <p className="text-slate-400 text-xs ml-auto">
                      {formData.message.length} / 3000 characters
                    </p>
                  </div>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.7 }}
                  className="group border-2 border-dashed border-slate-200 p-8 md:p-12 text-center rounded-xl hover:border-orange-500/50 hover:bg-orange-50/30 transition-all cursor-pointer"
                >
                  <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-100 group-hover:text-orange-500 transition-colors">
                    <FileUp size={24} />
                  </div>
                  <h4 className="text-[#1A2B4C] font-black uppercase tracking-tight mb-2">Upload Project Documentation</h4>
                  <p className="text-slate-400 text-sm max-w-md mx-auto">Upload specs, drawings, or RFQ documents (PDF, DWG, DOC, max 25MB)</p>
                </motion.div>

                {getFieldError('request') && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 text-red-600 text-sm font-bold px-6 py-4 rounded-md text-left border border-red-100"
                  >
                    {getFieldError('request')}
                  </motion.div>
                )}

                {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8 }}
                  >
                    <Turnstile 
                      ref={turnstileRef}
                      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} 
                      onSuccess={(t) => setTurnstileToken(t)} 
                      options={{ size: "invisible" }}
                    />
                  </motion.div>
                )}

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.9 }}
                  className="flex flex-col md:flex-row items-center justify-between gap-8 pt-4"
                >
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div 
                      onClick={() => setAgreed(!agreed)}
                      className={`w-6 h-6 border-2 flex items-center justify-center transition-all ${agreed ? 'bg-orange-500 border-orange-500' : 'border-slate-200 group-hover:border-orange-300'}`}
                    >
                      {agreed && <Check size={14} className="text-white" />}
                    </div>
                    <span className="text-slate-500 text-sm font-medium">
                      Accept terms and conditions from Touch Teq.
                    </span>
                  </label>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="group relative flex items-center bg-orange-500 hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="px-10 py-4 text-white font-black text-xs uppercase tracking-[0.2em]">
                      {isSubmitting ? 'Sending...' : 'Send Request'}
                    </span>
                    <div className="bg-[#1A2B4C] p-4 flex items-center justify-center group-hover:bg-black transition-colors">
                      <ArrowRight className="text-white w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                  </button>
                </motion.div>
              </form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Response Process */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-6"
            >
              OUR WORKFLOW
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-[#1A2B4C] text-3xl md:text-6xl font-black uppercase tracking-tight mb-8"
            >
              What to Expect Next
            </motion.h2>
          </div>
          
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Acknowledgement", body: "Confirmation receipt and initial routing within 4 hours." },
              { title: "Technical Review", body: "Requirements reviewed by a lead discipline engineer." },
              { title: "Clarification", body: "Direct follow-up call if additional scoping is needed." },
              { title: "Formal Proposal", body: "Delivery of technical proposal and commercial quotation." }
            ].map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }}
                className="relative p-6 md:p-8 bg-white rounded-xl border border-slate-200 hover:border-orange-500/50 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500"
              >
                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center font-black text-sm mb-6">
                  {i + 1}
                </div>
                <h3 className="text-[#1A2B4C] font-black uppercase tracking-tight mb-4">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.body}</p>
                {i < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 translate-x-1/2 -translate-y-1/2 z-10">
                    <ChevronRight size={24} className="text-slate-200" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Emergency Support */}
      <section className="py-24 bg-[#1A2B4C] relative overflow-hidden">
        {/* Animated Background Element */}
        <motion.div 
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.1),transparent_70%)]"
        ></motion.div>
        
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-12 md:p-24 rounded-[3.5rem] bg-[#1A2B4C] relative"
          >
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1">
                <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-8 flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping"></div>
                  EMERGENCY SUPPORT
                </span>
                <h2 className="text-white text-3xl md:text-6xl font-black uppercase tracking-tight mb-10 leading-none">
                  Critical Fault? <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">24/7 Rapid Response</span>
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed mb-12 max-w-2xl">
                  For clients on active maintenance agreements, our emergency engineering line is available around the clock. We specialise in rapid mobilisation for critical system failures and unplanned shutdowns.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-12">
                  <div className="space-y-2">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">EMERGENCY LINE</p>
                    <a href="tel:+27725522110" className="text-white text-2xl font-black hover:text-orange-500 transition-colors">+27 72 552 2110</a>
                  </div>
                  <div className="space-y-2">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">AVAILABILITY</p>
                    <p className="text-orange-500 text-2xl font-black">24/7/365</p>
                  </div>
                </div>
              </div>
              
              <div className="w-full lg:w-1/3 aspect-square relative">
                <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-[100px] animate-pulse"></div>
                <div className="relative w-full h-full border border-orange-500/20 rounded-[3rem] flex items-center justify-center bg-white/5 backdrop-blur-xl">
                  <div className="text-center p-12">
                    <ShieldCheck size={80} className="text-orange-500 mx-auto mb-8" />
                    <p className="text-white font-black uppercase tracking-widest text-sm mb-2">SADC Regional Coverage</p>
                    <p className="text-slate-400 text-xs">Response times subject to site location and logistics.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 5: Regional Reach */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col lg:flex-row gap-24">
            <div className="lg:w-1/2">
              <motion.span 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-8"
              >
                WHERE WE OPERATE
              </motion.span>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-[#1A2B4C] text-3xl md:text-6xl font-black uppercase tracking-tight mb-12 leading-[0.9]"
              >
                Engineering Across <br />
                <span className="text-slate-400">Southern Africa</span>
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-slate-600 text-lg leading-relaxed mb-8"
              >
                Headquartered in Roodepoort, South Africa, our project footprint extends across the SADC region. We manage all cross-border logistics, work permits, and equipment compliance as a standard part of our project delivery.
              </motion.p>
              
              <div className="grid grid-cols-2 gap-8 pt-8">
                <div>
                  <p className="text-[#1A2B4C] text-4xl font-black mb-2">05+</p>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Countries Served</p>
                </div>
                <div>
                  <p className="text-orange-500 text-4xl font-black mb-2">24h</p>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Avg Mobilisation</p>
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/2">
              <div className="space-y-2">
                {[
                  { country: "South Africa", regions: "Gauteng, Mpumalanga, KZN, Limpopo, Cape Regions & North West." },
                  { country: "Mozambique", regions: "Maputo, Matola, and Northern Gas Infrastructure hubs." },
                  { country: "Botswana", regions: "Gaborone, Francistown, and Selebi-Phikwe mining regions." },
                  { country: "Namibia", regions: "Erongo, Otjozondjupa, Windhoek and Walvis Bay industrial ops." },
                  { country: "Zimbabwe", regions: "Harare, Bulawayo, and regional mining operations." }
                ].map((r, i) => (
                  <motion.div 
                    key={r.country} 
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="group p-8 border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[#1A2B4C] font-black uppercase tracking-tight text-xl">{r.country}</h4>
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all">
                        <ArrowRight size={14} />
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm">{r.regions}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: FAQ */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4">Before You Reach Out</span>
              <h2 className="text-[#1A2B4C] text-3xl md:text-5xl font-black uppercase tracking-normal">Questions We Get Asked First</h2>
            </div>
            
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="border border-slate-100 rounded-2xl overflow-hidden"
                >
                  <button 
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
                  >
                    <span className={`font-black text-sm md:text-base uppercase tracking-normal transition-colors ${openFaq === index ? 'text-orange-500' : 'text-[#1A2B4C] hover:text-orange-500'}`}>{faq.q}</span>
                    {openFaq === index ? <Minus className="text-orange-500" /> : <Plus className="text-orange-500" />}
                  </button>
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 pt-0 text-slate-500 text-sm md:text-base leading-relaxed font-medium border-t border-slate-50">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: CTA */}
      <section className="relative w-full bg-[#0A0F1A] text-white overflow-hidden py-32">
        <div className="absolute inset-0 z-0">
          <Image
            src="/f-bg.jpg"
            alt="Industrial Background"
            fill
            className="object-cover opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F1A] via-transparent to-[#0A0F1A]"></div>
          <div className="absolute inset-0 bg-[#0A0F1A]/40"></div>
        </div>

        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="max-w-5xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center space-x-3 mb-6"
            >
              <div className="w-12 h-[1px] bg-orange-500"></div>
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em]">Ready to Move Forward</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl md:text-7xl font-black text-white uppercase tracking-tight leading-[0.85] mb-10"
            >
              Let&apos;s Build a <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Safer Industrial Future</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-slate-400 text-lg md:text-xl max-w-2xl mb-12 font-medium leading-relaxed"
            >
              Join the major industrial organisations that trust Touch Teq for their most critical safety and engineering requirements.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-6"
            >
              <Link href="#request-quote" className="group flex items-stretch bg-white hover:bg-slate-100 transition-all rounded-md overflow-hidden shadow-xl max-w-full sm:w-auto">
                <span className="px-6 md:px-8 py-3 flex items-center text-[#0A1120] group-hover:text-orange-500 font-black text-[11px] md:text-sm uppercase tracking-widest text-left transition-colors">
                  REQUEST CONSULTATION
                </span>
                <div className="bg-[#ff6900] px-4 md:px-5 flex items-center justify-center group-hover:bg-orange-600 transition-colors shrink-0">
                  <ArrowRight className="text-white w-4 h-4 -rotate-45 group-hover:rotate-0 transition-all duration-300" />
                </div>
              </Link>

              <a href="tel:+27725522110" className="group flex items-stretch bg-orange-500 hover:bg-orange-600 transition-all rounded-md overflow-hidden shadow-xl shadow-orange-500/20 max-w-full sm:w-auto">
                <span className="px-6 md:px-8 py-3 flex items-center text-white font-black text-[11px] md:text-sm uppercase tracking-widest text-left">
                  <Phone size={16} className="mr-3" />
                  CALL US DIRECTLY
                </span>
                <div className="bg-[#1A2B4C] px-5 flex items-center justify-center group-hover:bg-black transition-colors shrink-0">
                  <ArrowRight className="text-white w-4 h-4 -rotate-45 group-hover:rotate-0 group-hover:text-orange-500 transition-all duration-300" />
                </div>
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      <BackToTop />

      <Footer />
    </main>
  );
}
