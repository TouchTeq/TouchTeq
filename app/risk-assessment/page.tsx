'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, AlertTriangle, AlertCircle, CheckCircle2, Lock, ArrowRight, Check, Phone } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';
import Link from 'next/link';
import Image from 'next/image';
import { sendGAEvent } from '@next/third-parties/google';
import { Turnstile } from '@marsidev/react-turnstile';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import ServiceJsonLd from '@/components/seo/ServiceJsonLd';

const questions = [
  {
    id: 1,
    title: "Industry",
    question: "What best describes your facility?",
    options: [
      "Oil & Gas / Petrochemical",
      "Mining & Minerals Processing",
      "Chemical & Pharmaceutical",
      "Power Generation & Utilities",
      "Food & Beverage / General Manufacturing",
      "Other Industrial"
    ]
  },
  {
    id: 2,
    title: "Hazardous Materials",
    question: "Does your facility handle, store, or process flammable gases, volatile liquids, or combustible dusts?",
    options: [
      "Yes — continuously or frequently",
      "Yes — occasionally",
      "No / Unsure"
    ]
  },
  {
    id: 3,
    title: "Last F&G Audit",
    question: "When was your fire and gas detection system last formally audited?",
    options: [
      "Within the last 12 months",
      "1 to 3 years ago",
      "More than 3 years ago",
      "Never / No formal audit has been done"
    ]
  },
  {
    id: 4,
    title: "Hazardous Area Classification",
    question: "Does your facility have a current, approved Hazardous Area Classification study?",
    options: [
      "Yes — reviewed within the last 3 years",
      "Yes — but it has not been reviewed recently",
      "No — or we are unsure",
      "We are a new facility still in design"
    ]
  },
  {
    id: 5,
    title: "Safety Instrumented Systems",
    question: "Do you have a Safety Instrumented System (SIS) or Emergency Shutdown System (ESD) in place?",
    options: [
      "Yes — with a current SIL assessment",
      "Yes — but no formal SIL assessment has been done",
      "No",
      "Not applicable to our facility"
    ]
  }
];

export default function RiskAssessment() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(5).fill(''));
  const [showResults, setShowResults] = useState(false);
  const [formState, setFormState] = useState({
    firstName: '',
    email: '',
    company: '',
    agreed: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileInstance>(null);

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers];
    newAnswers[currentStep] = answer;
    setAnswers(newAnswers);

    if (currentStep < questions.length - 1) {
      setTimeout(() => setCurrentStep(prev => prev + 1), 300);
    } else {
      sendGAEvent('event', 'risk_assessment_complete');
      setTimeout(() => setShowResults(true), 300);
    }
  };

  const calculateRisk = () => {
    let score = 0;
    const [ind, haz, audit, hac, sis] = answers;

    if (haz?.includes("continuously")) score += 2;
    if (haz?.includes("occasionally")) score += 1;

    if (audit?.includes("More than 3 years")) score += 2;
    if (audit?.includes("Never")) score += 3;
    if (audit?.includes("1 to 3 years")) score += 1;

    if (hac?.includes("not been reviewed")) score += 1;
    if (hac?.includes("No — or we are unsure")) score += 2;

    if (sis?.includes("no formal SIL")) score += 1;
    if (sis?.includes("No") && !sis?.includes("unsure")) score += 2;

    if (score >= 5) return 'High';
    if (score >= 3) return 'Medium';
    return 'Low';
  };

  const generateObservations = () => {
    const obs = [];
    const [ind, haz, audit, hac, sis] = answers;

    if (audit?.includes("More than 3 years") || audit?.includes("Never")) {
      obs.push(`Your F&G detection system has not been formally audited in over 3 years. IEC 61511 and good engineering practice recommend periodic proof testing — gaps here can affect both safety and regulatory compliance.`);
    } else if (audit?.includes("1 to 3 years")) {
      obs.push(`Your baseline F&G audit is becoming dated. Routine verification ensures your detectors are still positioned optimally despite any process or structural changes.`);
    } else if (audit?.includes("12 months")) {
      obs.push(`Your F&G systems are frequently audited, which is excellent for maintaining a high level of operational safety and early fault detection.`);
    }

    if (hac?.includes("not been reviewed") || hac?.includes("No —")) {
      obs.push(`Without a current Hazardous Area Classification (HAC) study, you risk installing incorrect Ex-rated equipment, which can serve as an ignition source in explosive atmospheres.`);
    }

    if (sis?.includes("no formal SIL") || sis === "No") {
      obs.push(`You operate without a formally verified Safety Instrumented System (SIS). Best practice dictates that protective functions be assessed for the required Safety Integrity Level (SIL).`);
    }

    if (haz?.includes("continuously") || haz?.includes("occasionally")) {
      if (obs.length < 4) {
        obs.push(`Because your facility handles flammable or volatile materials, rigorous hazardous area management and continuous fire & gas detection are critical to preventing escalation incidents.`);
      }
    }

    if (obs.length < 3) {
      obs.push(`Based on your responses, your facility appears to be managing the core safety documentation well, maintaining good compliance foundations.`);
    }

    return obs.slice(0, 4);
  };

  const riskLevel = calculateRisk();
  const observations = generateObservations();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.firstName || !formState.email || !formState.company || !formState.agreed) return;

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      let token = turnstileToken;

      if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !token) {
        turnstileRef.current?.execute();
        await new Promise(resolve => setTimeout(resolve, 1500));
        token = turnstileToken;
      }

      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formState.firstName,
          email: formState.email,
          company: formState.company,
          source: "Risk Assessment",
          token
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit. Please try again.");
      }

      setIsSuccess(true);
      sendGAEvent('event', 'risk_assessment_lead');
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="bg-[#0A1120] min-h-screen font-sans flex flex-col items-center">
      <BreadcrumbJsonLd 
        items={[
          { name: 'Home', url: 'https://touchteq.co.za' },
          { name: 'Solutions', url: 'https://touchteq.co.za' },
          { name: 'Industrial Risk Assessment', url: 'https://touchteq.co.za/risk-assessment' }
        ]}
      />
      <ServiceJsonLd 
        name="Industrial Fire & Gas Risk Assessment"
        description="A comprehensive assessment tool for industrial facilities to evaluate their fire and gas detection system readiness and regulatory compliance level."
        url="https://touchteq.co.za/risk-assessment"
        serviceType={[
          'Risk Assessment', 
          'Compliance Audit', 
          'Safety System Evaluation'
        ]}
      />
      <Header />

      <section className="w-full max-w-4xl mx-auto px-4 pt-32 pb-24 md:pt-48 md:pb-32 flex-grow flex flex-col justify-center">
        {!showResults ? (
          <div className="w-full">
            {/* Progress Bar */}
            <div className="mb-12">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                <span>Phase 1 — Questions</span>
                <span>{Math.round((currentStep / questions.length) * 100)}% Complete</span>
              </div>
              <div className="w-full bg-[#1A2B4C] h-2 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-orange-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentStep / questions.length) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              </div>
            </div>

            {/* Questions Tracker */}
            <div className="flex space-x-2 mb-8">
              {questions.map((q, i) => (
                <div 
                  key={q.id} 
                  className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= currentStep ? 'bg-orange-500' : 'bg-[#1A2B4C]'}`}
                />
              ))}
            </div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-[#111A2C] rounded-2xl p-6 md:p-10 border border-slate-800 shadow-2xl"
              >
                <div className="mb-8">
                  <span className="text-orange-500 font-black text-xs uppercase tracking-[0.2em] block mb-2">
                    Step {currentStep + 1} of 5
                  </span>
                  <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">
                    {questions[currentStep].question}
                  </h2>
                </div>

                <div className="space-y-3">
                  {questions[currentStep].options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(option)}
                      className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 group flex items-center justify-between
                        ${answers[currentStep] === option 
                          ? 'border-orange-500 bg-orange-500/10' 
                          : 'border-slate-700 bg-slate-800/50 hover:border-orange-500/50 hover:bg-slate-800'
                        }`}
                    >
                      <span className="text-slate-200 font-medium text-lg pr-4">{option}</span>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
                        ${answers[currentStep] === option 
                          ? 'border-orange-500 bg-orange-500' 
                          : 'border-slate-600 group-hover:border-orange-500/50'
                        }`}
                      >
                        {answers[currentStep] === option && <Check size={14} className="text-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            {/* Phase 2: Results Screen */}
            <div className="text-center mb-12">
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4">
                Phase 2 — Results
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight mb-4">
                Your Mini Risk Report
              </h1>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                Based on your inputs, we've analysed your facility's safety and regulatory stance.
              </p>
            </div>

            <div className="bg-[#111A2C] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl mb-12">
              {/* Risk Badge Header */}
              <div className={`p-8 md:p-10 border-b border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6
                ${riskLevel === 'High' ? 'bg-red-950/30' : riskLevel === 'Medium' ? 'bg-amber-950/30' : 'bg-green-950/30'}
              `}>
                <div>
                  <h3 className="text-slate-400 text-sm font-black uppercase tracking-[0.2em] mb-2">Estimated Risk Profile</h3>
                  <div className="flex items-center space-x-3">
                    {riskLevel === 'High' && <AlertTriangle className="text-red-500 w-8 h-8" />}
                    {riskLevel === 'Medium' && <AlertCircle className="text-amber-500 w-8 h-8" />}
                    {riskLevel === 'Low' && <CheckCircle2 className="text-green-500 w-8 h-8" />}
                    
                    <span className={`text-3xl md:text-4xl font-black uppercase tracking-tight
                      ${riskLevel === 'High' ? 'text-red-500' : riskLevel === 'Medium' ? 'text-amber-500' : 'text-green-500'}
                    `}>
                      {riskLevel} Risk
                    </span>
                  </div>
                </div>
                <div className="text-right max-w-sm hidden md:block">
                  <p className="text-slate-300 text-sm font-medium leading-relaxed">
                    This profile is estimated from typical compliance requirements in relation to your stated audit periods, hazard levels, and SIS deployment.
                  </p>
                </div>
              </div>

              {/* Personalised Observations */}
              <div className="p-8 md:p-10">
                <h3 className="text-white text-xl font-bold mb-6 flex items-center">
                  <span className="bg-orange-500 w-2 h-6 mr-3 block rounded-sm"></span>
                  Key Observations
                </h3>
                <div className="space-y-4">
                  {observations.map((obs, idx) => (
                    <div key={idx} className="flex items-start space-x-4 bg-[#1A2B4C]/50 p-5 rounded-xl border border-slate-800/50">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-slate-400 font-bold text-sm">{idx + 1}</span>
                      </div>
                      <p className="text-slate-300 font-medium leading-relaxed">
                        {obs}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Locked Section Preview */}
              <div className="relative border-t border-slate-800 bg-[#0A1120] p-8 md:p-10 overflow-hidden">
                <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-[#0A1120]/80 to-[#0A1120] backdrop-blur-sm pointer-events-none flex flex-col items-center justify-end pb-12">
                  <div className="bg-[#111A2C] border border-slate-700 rounded-2xl p-6 px-10 flex flex-col items-center shadow-2xl mb-8 transform translate-y-8">
                    <Lock className="text-orange-500 w-10 h-10 mb-4" />
                    <h4 className="text-white text-xl font-black uppercase tracking-wider mb-2">Full Facility Risk Report</h4>
                    <p className="text-slate-400 text-center text-sm max-w-xs">
                      Enter your details below to receive your completely detailed report by email.
                    </p>
                  </div>
                </div>
                
                {/* Dummy blurred content */}
                <div className="select-none blur-[4px] opacity-40">
                  <h3 className="text-white text-xl font-bold mb-4">Detailed Remediation Steps</h3>
                  <div className="h-4 bg-slate-700 rounded w-full mb-3"></div>
                  <div className="h-4 bg-slate-700 rounded w-11/12 mb-3"></div>
                  <div className="h-4 bg-slate-700 rounded w-4/5 mb-8"></div>
                  
                  <h3 className="text-white text-xl font-bold mb-4">Compliance Checklist</h3>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-4 h-4 rounded bg-slate-700"></div>
                    <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded bg-slate-700"></div>
                    <div className="h-4 bg-slate-700 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 3: Lead Capture */}
            <div className="text-center mb-8">
              <span className="text-orange-500 font-black text-xs uppercase tracking-[0.4em] block mb-4">
                Phase 3 — Get Your Report
              </span>
            </div>

            <div className="max-w-2xl mx-auto">
              {!isSuccess ? (
                <form onSubmit={handleSubscribe} className="bg-[#111A2C] p-8 md:p-10 rounded-2xl shadow-2xl border border-slate-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <input
                        type="text"
                        placeholder="First Name *"
                        value={formState.firstName}
                        onChange={(e) => setFormState({...formState, firstName: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-800/50 border border-slate-700 rounded-xl focus:border-orange-500 focus:bg-[#1A2B4C] outline-none transition-all font-medium text-white placeholder:text-slate-500"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="Email Address *"
                        value={formState.email}
                        onChange={(e) => setFormState({...formState, email: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-800/50 border border-slate-700 rounded-xl focus:border-orange-500 focus:bg-[#1A2B4C] outline-none transition-all font-medium text-white placeholder:text-slate-500"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        placeholder="Company Name *"
                        value={formState.company}
                        onChange={(e) => setFormState({...formState, company: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-800/50 border border-slate-700 rounded-xl focus:border-orange-500 focus:bg-[#1A2B4C] outline-none transition-all font-medium text-white placeholder:text-slate-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-8 flex items-start space-x-3 text-left">
                    <button
                      type="button"
                      onClick={() => setFormState({...formState, agreed: !formState.agreed})}
                      className={`shrink-0 w-6 h-6 mt-0.5 border-2 rounded-md flex items-center justify-center transition-colors ${
                        formState.agreed ? "bg-orange-500 border-orange-500" : "border-slate-600 hover:border-orange-500 bg-slate-800/50"
                      }`}
                    >
                      {formState.agreed && <Check size={16} className="text-white" />}
                    </button>
                    <label className="text-slate-400 text-sm leading-relaxed cursor-pointer" onClick={() => setFormState({...formState, agreed: !formState.agreed})}>
                      I agree to receive my risk report and relevant industry updates from Touch Teq Engineering. You can unsubscribe at any time.
                    </label>
                  </div>

                  {errorMsg && (
                    <div className="mb-6 bg-red-950/50 text-red-500 text-sm font-bold px-4 py-3 rounded-md border border-red-900/50">
                      {errorMsg}
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

                  <button
                    type="submit"
                    disabled={!formState.agreed || isSubmitting}
                    className={`w-full text-white px-8 py-5 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-xl flex items-center justify-center
                      ${formState.agreed && !isSubmitting
                        ? "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20"
                        : "bg-slate-700 cursor-not-allowed shadow-none text-slate-400"
                      }`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        Send My Full Report
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </span>
                    )}
                  </button>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-950/20 border border-green-900/50 rounded-2xl p-10 text-center shadow-2xl"
                >
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} className="text-green-500" />
                  </div>
                  <h3 className="text-white text-2xl font-black uppercase tracking-tight mb-4">
                    Report Sent
                  </h3>
                  <p className="text-slate-300 font-medium text-lg leading-relaxed max-w-lg mx-auto">
                    Your full report is on its way. One of our engineers may also be in touch if your assessment highlights areas we can help with.
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </section>

      {/* Ready to Move Forward CTA */}
      <section className="relative w-full bg-[#0A0F1A] text-white overflow-hidden py-24">
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
          <div className="max-w-4xl">
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
              Ready to Address <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6900] to-orange-300">Your Facility Risks?</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-slate-400 text-lg md:text-xl max-w-2xl mb-12 font-medium leading-relaxed"
            >
              This assessment is just the starting point. Our engineers can help you implement the recommendations and close the gaps in your safety systems.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-6"
            >
              <Link 
                href="/contact"
                className="group flex items-stretch bg-white hover:bg-slate-100 transition-all rounded-md overflow-hidden shadow-xl max-w-full sm:w-auto"
              >
                <span className="px-6 md:px-8 py-3 flex items-center text-[#0A1120] group-hover:text-orange-500 font-black text-[11px] md:text-sm uppercase tracking-widest text-left transition-colors">
                  DISCUSS YOUR RESULTS
                </span>
                <div className="bg-[#ff6900] px-4 md:px-5 flex items-center justify-center group-hover:bg-orange-600 transition-colors shrink-0">
                  <ArrowRight className="text-white w-4 h-4 -rotate-45 group-hover:rotate-0 transition-all duration-300" />
                </div>
              </Link>

              <a 
                href="tel:+27725522110"
                className="group flex items-stretch bg-orange-500 hover:bg-orange-600 transition-all rounded-md overflow-hidden shadow-xl shadow-orange-500/20 max-w-full sm:w-auto"
              >
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

      <Footer />
      <BackToTop />
    </main>
  );
}
