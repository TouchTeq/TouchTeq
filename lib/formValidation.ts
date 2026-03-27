'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export const VALID_SERVICES = [
  "Fire and Gas Detection Systems",
  "Control and Instrumentation (C&I)",
  "Industrial Electrical Engineering",
  "Hazardous Area Classification",
  "Design and Engineering",
  "Installation and Commissioning",
  "Maintenance and Support",
  "Compliance Audit or Inspection",
  "Training",
  "Other"
];

export const VALID_TIMELINES = [
  "Immediate or urgent",
  "Within 1 month",
  "1 to 3 months",
  "3 to 6 months",
  "6 months or more",
  "Not yet defined"
];

export const VALID_PROJECT_STAGES = [
  "Early feasibility or concept",
  "FEED or front-end engineering",
  "Detail design",
  "Ready for construction or installation",
  "Operational facility requiring support",
  "Urgent or emergency requirement"
];

export const VALID_SERVICES_SHORT = [
  "Fire & Gas Detection",
  "Control & Instrumentation",
  "Electrical Engineering",
  "Hazardous Area Classification",
  "Emergency Support / Urgent Repair",
  "General Inquiry"
];

export function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

export function validateName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  
  if (!trimmed) {
    return { valid: false, error: "Please enter your full name" };
  }
  
  if (trimmed.length < 2) {
    return { valid: false, error: "Name must be at least 2 characters" };
  }
  
  if (trimmed.length > 80) {
    return { valid: false, error: "Name must not exceed 80 characters" };
  }
  
  const nameRegex = /^[\p{L}\s'-.]+$/u;
  if (!nameRegex.test(trimmed)) {
    return { valid: false, error: "Name can only contain letters, spaces, hyphens, and apostrophes" };
  }
  
  const letterCount = (trimmed.match(/[\p{L}]/gu) || []).length;
  if (letterCount < 2) {
    return { valid: false, error: "Name must contain at least two letters" };
  }
  
  return { valid: true };
}

export function validateCompanyName(company: string): { valid: boolean; error?: string } {
  const trimmed = company.trim();
  
  if (!trimmed) {
    return { valid: false, error: "Please enter your company name" };
  }
  
  if (trimmed.length < 2) {
    return { valid: false, error: "Company name must be at least 2 characters" };
  }
  
  if (trimmed.length > 120) {
    return { valid: false, error: "Company name must not exceed 120 characters" };
  }
  
  const companyRegex = /^[\p{L}\p{N}\s\-'.,&()/]+$/u;
  if (!companyRegex.test(trimmed)) {
    return { valid: false, error: "Please enter a valid company name" };
  }
  
  const letterCount = (trimmed.match(/[\p{L}]/gu) || []).length;
  if (letterCount < 2) {
    return { valid: false, error: "Please enter a valid company name" };
  }
  
  return { valid: true };
}

export function validateEmail(email: string): { valid: boolean; error?: string } {
  const trimmed = email.trim();
  
  if (!trimmed) {
    return { valid: false, error: "Please enter your email address" };
  }
  
  if (trimmed.length < 6) {
    return { valid: false, error: "Please enter a valid email address" };
  }
  
  if (trimmed.length > 254) {
    return { valid: false, error: "Please enter a valid email address" };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: "Please enter a valid email address (e.g., name@company.co.za)" };
  }
  
  if (trimmed.includes('..') || trimmed.startsWith('@') || trimmed.endsWith('@')) {
    return { valid: false, error: "Please enter a valid email address" };
  }
  
  return { valid: true };
}

export function validatePhone(phone: string): { valid: boolean; error?: string } {
  const trimmed = phone.trim();
  
  if (!trimmed) {
    return { valid: false, error: "Please enter your phone number" };
  }
  
  const digitsOnly = trimmed.replace(/[\s\-\(\)\+]/g, '');
  
  if (digitsOnly.length < 7) {
    return { valid: false, error: "Phone number must contain at least 7 digits" };
  }
  
  if (digitsOnly.length > 20) {
    return { valid: false, error: "Please enter a valid phone number" };
  }
  
  const phoneRegex = /^\+?[\d\s\-()]+$/;
  if (!phoneRegex.test(trimmed)) {
    return { valid: false, error: "Please enter a valid phone number using numbers only (e.g., +27 12 345 6789)" };
  }
  
  if (/^[0\s\-\(\)]+$/.test(trimmed)) {
    return { valid: false, error: "Please enter a valid phone number" };
  }
  
  return { valid: true };
}

export function validateMobileNumber(mobile: string): { valid: boolean; error?: string } {
  const trimmed = mobile.trim();
  
  if (!trimmed) {
    return { valid: false, error: "Please enter your mobile number" };
  }
  
  const digitsOnly = trimmed.replace(/[\s\-\(\)\+]/g, '');
  
  if (digitsOnly.length < 7) {
    return { valid: false, error: "Please enter a valid mobile number" };
  }
  
  if (digitsOnly.length > 20) {
    return { valid: false, error: "Please enter a valid mobile number" };
  }
  
  const allowedRegex = /^[\d\s\-\(\)\+]+$/;
  if (!allowedRegex.test(trimmed)) {
    return { valid: false, error: "Please enter a valid mobile number using numbers only" };
  }
  
  if (/^[0\s\-\(\)]+$/.test(trimmed)) {
    return { valid: false, error: "Please enter a valid mobile number" };
  }
  
  if (/^0{7,}$/.test(digitsOnly)) {
    return { valid: false, error: "Please enter a valid mobile number" };
  }
  
  const hasLetters = /[a-zA-Z]/.test(trimmed);
  if (hasLetters) {
    return { valid: false, error: "Please enter a valid mobile number using numbers only" };
  }
  
  return { valid: true };
}

export function validateOfficeNumber(office: string): { valid: boolean; error?: string } {
  const trimmed = office.trim();
  
  if (!trimmed) {
    return { valid: true };
  }
  
  const digitsOnly = trimmed.replace(/[\s\-\(\)\+]/g, '');
  
  if (digitsOnly.length < 7) {
    return { valid: false, error: "Please enter a valid office number using numbers only" };
  }
  
  if (digitsOnly.length > 20) {
    return { valid: false, error: "Please enter a valid office number using numbers only" };
  }
  
  const allowedRegex = /^[\d\s\-\(\)\+]+$/;
  if (!allowedRegex.test(trimmed)) {
    return { valid: false, error: "Please enter a valid office number using numbers only" };
  }
  
  const hasLetters = /[a-zA-Z]/.test(trimmed);
  if (hasLetters) {
    return { valid: false, error: "Please enter a valid office number using numbers only" };
  }
  
  return { valid: true };
}

export function validateExtension(ext: string): { valid: boolean; error?: string } {
  const trimmed = ext.trim();
  
  if (!trimmed) {
    return { valid: true };
  }
  
  const digitsOnly = trimmed.replace(/\D/g, '');
  
  if (digitsOnly.length < 1 || digitsOnly.length > 10) {
    return { valid: false, error: "Extension must contain numbers only" };
  }
  
  if (/^\d+$/.test(trimmed)) {
    return { valid: true };
  }
  
  return { valid: false, error: "Extension must contain numbers only" };
}

export function sanitizePhoneNumber(phone: string): string {
  const trimmed = phone.trim();
  return trimmed.replace(/[\s\-\(\)]/g, '');
}

export function validateService(service: string, validServices: string[]): { valid: boolean; error?: string } {
  if (!service || service === 'Select a service' || service === 'Select Service') {
    return { valid: false, error: "Please select the service you require" };
  }
  
  if (!validServices.includes(service)) {
    return { valid: false, error: "Please select a valid service" };
  }
  
  return { valid: true };
}

export function validateTimeline(timeline: string): { valid: boolean; error?: string } {
  if (!timeline || timeline === 'Select timeline' || timeline === 'Select Timeline') {
    return { valid: true };
  }
  
  if (!VALID_TIMELINES.includes(timeline)) {
    return { valid: false, error: "Please select a valid timeline" };
  }
  
  return { valid: true };
}

export function validateProjectStage(stage: string): { valid: boolean; error?: string } {
  if (!stage || stage === 'Select project stage' || stage === 'Select Project Stage') {
    return { valid: true };
  }
  
  if (!VALID_PROJECT_STAGES.includes(stage)) {
    return { valid: false, error: "Please select a valid project stage" };
  }
  
  return { valid: true };
}

export function validateMessage(message: string): { valid: boolean; error?: string } {
  const trimmed = message.trim();
  
  if (!trimmed) {
    return { valid: false, error: "Please describe your requirements" };
  }
  
  if (trimmed.length < 20) {
    return { valid: false, error: "Please provide at least 20 characters describing your requirements" };
  }
  
  if (trimmed.length > 3000) {
    return { valid: false, error: "Message must not exceed 3000 characters" };
  }
  
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 2) {
    return { valid: false, error: "Please provide at least 20 characters describing your requirements" };
  }
  
  return { valid: true };
}

export function validateJobTitle(jobTitle: string): { valid: boolean; error?: string } {
  if (!jobTitle || jobTitle.trim() === '') {
    return { valid: true };
  }
  
  const trimmed = jobTitle.trim();
  
  if (trimmed.length > 80) {
    return { valid: false, error: "Job title must not exceed 80 characters" };
  }
  
  const jobTitleRegex = /^[\p{L}\p{N}\s\-&.,/]+$/u;
  if (!jobTitleRegex.test(trimmed)) {
    return { valid: false, error: "Please enter a valid job title" };
  }
  
  const letterCount = (trimmed.match(/[\p{L}]/gu) || []).length;
  if (letterCount < 2) {
    return { valid: false, error: "Please enter a valid job title" };
  }
  
  return { valid: true };
}

export function validateLocation(location: string): { valid: boolean; error?: string } {
  if (!location || location.trim() === '') {
    return { valid: true };
  }
  
  const trimmed = location.trim();
  
  if (trimmed.length > 120) {
    return { valid: false, error: "Location must not exceed 120 characters" };
  }
  
  const locationRegex = /^[\p{L}\p{N}\s\-,\./]+$/u;
  if (!locationRegex.test(trimmed)) {
    return { valid: false, error: "Please enter a valid project location" };
  }
  
  const letterCount = (trimmed.match(/[\p{L}]/gu) || []).length;
  if (letterCount < 2) {
    return { valid: false, error: "Please enter a valid project location" };
  }
  
  return { valid: true };
}

export interface FormErrors {
  [key: string]: string;
}

export interface FormData {
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  jobTitle?: string;
  projectStage?: string;
  projectLocation?: string;
  timeline?: string;
}

export function useFormValidation(initialData: FormData, validServices: string[]) {
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitTime, setSubmitTime] = useState<number>(0);
  const formRef = useRef<HTMLFormElement>(null);
  const pageLoadTime = useRef<number>(0);
  
  // Initialize page load time on mount
  useEffect(() => {
    pageLoadTime.current = Date.now();
  }, []);

  const validateField = useCallback((name: string, value: string): string | undefined => {
    switch (name) {
      case 'fullName':
        return validateName(value).error;
      case 'companyName':
        return validateCompanyName(value).error;
      case 'email':
        return validateEmail(value).error;
      case 'phone':
        return validatePhone(value).error;
      case 'service':
        return validateService(value, validServices).error;
      case 'message':
        return validateMessage(value).error;
      case 'jobTitle':
        return validateJobTitle(value).error;
      case 'projectStage':
        return validateProjectStage(value).error;
      case 'projectLocation':
        return validateLocation(value).error;
      case 'timeline':
        return validateTimeline(value).error;
      default:
        return undefined;
    }
  }, [validServices]);

  const validateForm = useCallback((data: FormData): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;
    
    const fieldsToValidate = [
      'fullName', 'companyName', 'email', 'phone', 'service', 'message'
    ];
    
    if (data.jobTitle !== undefined) fieldsToValidate.push('jobTitle');
    if (data.projectStage !== undefined) fieldsToValidate.push('projectStage');
    if (data.projectLocation !== undefined) fieldsToValidate.push('projectLocation');
    if (data.timeline !== undefined) fieldsToValidate.push('timeline');
    
    for (const field of fieldsToValidate) {
      const error = validateField(field, data[field as keyof FormData] as string);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    }
    
    setErrors(newErrors);
    return isValid;
  }, [validateField]);

  const handleBlur = useCallback((fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    const fieldValue = String(initialData[fieldName as keyof FormData] || '');
    const error = validateField(fieldName, fieldValue);
    setErrors(prev => ({ ...prev, [fieldName]: error || '' }));
  }, [initialData, validateField]);

  const handleChange = useCallback((fieldName: string, value: string) => {
    if (touched[fieldName]) {
      const error = validateField(fieldName, value);
      setErrors(prev => ({ ...prev, [fieldName]: error || '' }));
    }
  }, [touched, validateField]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>, formData: FormData): Promise<boolean> => {
    e.preventDefault();
    
    const timeSinceLoad = Date.now() - pageLoadTime.current;
    if (timeSinceLoad < 3000) {
      console.log('Form submitted too quickly - potential bot');
      return false;
    }
    
    const honeypotField = (e.target as HTMLFormElement).querySelector('input[name="honeypot"]') as HTMLInputElement;
    if (honeypotField && honeypotField.value) {
      console.log('Honeypot field filled - potential bot');
      return false;
    }
    
    setIsSubmitting(true);
    
    const isValid = validateForm(formData);
    
    if (!isValid) {
      setIsSubmitting(false);
      const firstErrorField = Object.keys(errors)[0];
      const firstErrorElement = formRef.current?.querySelector(`[name="${firstErrorField}"]`);
      if (firstErrorElement) {
        (firstErrorElement as HTMLElement).focus();
      }
      return false;
    }
    
    setSubmitTime(Date.now());
    setIsSubmitted(true);
    setIsSubmitting(false);
    return true;
  }, [validateForm, errors]);

  const resetForm = useCallback(() => {
    setErrors({});
    setTouched({});
    setIsSubmitted(false);
    setIsSubmitting(false);
    pageLoadTime.current = Date.now();
  }, []);

  return {
    errors,
    touched,
    isSubmitting,
    isSubmitted,
    submitTime,
    formRef,
    validateField,
    validateForm,
    handleBlur,
    handleChange,
    handleSubmit,
    resetForm
  };
}
