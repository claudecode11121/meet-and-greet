import React, { useState } from 'react';
import {
  Sparkles,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Star,
  Users,
  Calendar,
  MessageSquare,
  AlertCircle,
  Loader2,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { COUNTRIES } from './data/countries';
import { PrivacyModal } from './components/PrivacyModal';
import { ConfirmationView, SubmissionResult } from './components/ConfirmationView';

interface FormData {
  fullName: string;
  email: string;
  countryCode: string;
  phone: string;
  country: string;
  city: string;
  celebrityName: string;
  meetingType: string;
  preferredDate: string;
  attendees: string;
  reason: string;
  message: string;
  confirmedAccurate: boolean;
  acknowledgedPrivacy: boolean;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  celebrityName?: string;
  meetingType?: string;
  attendees?: string;
  preferredDate?: string;
  confirmedAccurate?: string;
  acknowledgedPrivacy?: string;
  general?: string;
}

const INITIAL_FORM_DATA: FormData = {
  fullName: '',
  email: '',
  countryCode: '+1',
  phone: '',
  country: 'United States',
  city: '',
  celebrityName: '',
  meetingType: '',
  preferredDate: '',
  attendees: '1 Person',
  reason: '',
  message: '',
  confirmedAccurate: false,
  acknowledgedPrivacy: false,
};

export const App: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // Minimum selectable date: today's date in YYYY-MM-DD
  const todayDateString = new Date().toISOString().split('T')[0];

  // Email format validation regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  const validateField = (name: keyof FormData, value: any): string | undefined => {
    switch (name) {
      case 'fullName':
        if (!value || typeof value !== 'string' || !value.trim()) {
          return 'Full name is required.';
        }
        if (value.trim().length < 2) {
          return 'Full name must be at least 2 characters.';
        }
        return undefined;

      case 'email':
        if (!value || typeof value !== 'string' || !value.trim()) {
          return 'Email address is required.';
        }
        if (!emailRegex.test(value.trim())) {
          return 'Please enter a valid email address (e.g. name@example.com).';
        }
        return undefined;

      case 'phone':
        if (!value || typeof value !== 'string' || !value.trim()) {
          return 'Phone number is required, including country code.';
        }
        // At least 6 digits/characters excluding symbols
        const cleanDigits = value.replace(/\D/g, '');
        if (cleanDigits.length < 6) {
          return 'Please enter a valid phone number with your area/country code.';
        }
        return undefined;

      case 'country':
        if (!value || typeof value !== 'string' || !value.trim()) {
          return 'Country of residence is required.';
        }
        return undefined;

      case 'city':
        if (!value || typeof value !== 'string' || !value.trim()) {
          return 'City is required.';
        }
        if (value.trim().length < 2) {
          return 'City name must be at least 2 characters.';
        }
        return undefined;

      case 'celebrityName':
        if (!value || typeof value !== 'string' || !value.trim()) {
          return "Celebrity's name is required.";
        }
        if (value.trim().length < 2) {
          return "Celebrity's name must be at least 2 characters.";
        }
        return undefined;

      case 'meetingType':
        if (!value || !['In-person Meet & Greet', 'Virtual Meet & Greet', 'No Preference'].includes(value)) {
          return 'Please select a preferred meeting type.';
        }
        return undefined;

      case 'attendees':
        if (!value || typeof value !== 'string' || !value.trim()) {
          return 'Please select the number of attendees.';
        }
        return undefined;

      case 'confirmedAccurate':
        if (!value) {
          return 'You must confirm that the information provided is accurate.';
        }
        return undefined;

      case 'acknowledgedPrivacy':
        if (!value) {
          return 'You must acknowledge the privacy policy.';
        }
        return undefined;

      default:
        return undefined;
    }
  };

  const handleBlur = (field: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errorMsg = validateField(field, formData[field]);
    setErrors((prev) => ({
      ...prev,
      [field]: errorMsg,
    }));
  };

  const handleChange = (
    field: keyof FormData,
    value: string | boolean
  ) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // If user updates Country, automatically sync the country code if not customized
      if (field === 'country') {
        const found = COUNTRIES.find((c) => c.name === value);
        if (found) {
          updated.countryCode = found.dialCode;
        }
      }
      return updated;
    });

    if (touched[field]) {
      const errorMsg = validateField(field, value);
      setErrors((prev) => ({
        ...prev,
        [field]: errorMsg,
      }));
    }
  };

  const validateAll = (): boolean => {
    const newErrors: FormErrors = {};
    const fieldsToValidate: (keyof FormData)[] = [
      'fullName',
      'email',
      'phone',
      'country',
      'city',
      'celebrityName',
      'meetingType',
      'attendees',
      'confirmedAccurate',
      'acknowledgedPrivacy',
    ];

    fieldsToValidate.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    // Mark all fields as touched
    const touchedMap: Record<string, boolean> = {};
    fieldsToValidate.forEach((field) => {
      touchedMap[field] = true;
    });
    setTouched(touchedMap);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAll()) {
      // Scroll to the first error
      const firstErrorElement = document.querySelector('.has-error');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, general: undefined }));

    // Format phone with dial code if not already included
    const fullPhone = formData.phone.startsWith('+')
      ? formData.phone
      : `${formData.countryCode} ${formData.phone}`.trim();

    const payload = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: fullPhone,
      country: formData.country.trim(),
      city: formData.city.trim(),
      celebrityName: formData.celebrityName.trim(),
      meetingType: formData.meetingType,
      preferredDate: formData.preferredDate || null,
      attendees: formData.attendees,
      reason: formData.reason.trim(),
      message: formData.message.trim(),
      confirmedAccurate: formData.confirmedAccurate,
      acknowledgedPrivacy: formData.acknowledgedPrivacy,
    };

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setErrors({ general: data.message || 'Submission failed. Please check your information and try again.' });
        }
        setIsSubmitting(false);
        return;
      }

      // Success
      setSubmissionResult(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Submission request failed:', err);
      setErrors({
        general: 'Unable to connect to the intake server. Please verify your connection or try again shortly.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
    setTouched({});
    setSubmissionResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-between items-center text-zinc-100 font-sans">
      {/* Background Decorative Accent */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#c5a059]/10 rounded-full blur-[140px]" />
      </div>

      <div className="w-full max-w-2xl mx-auto">
        {/* Simple Professional Header */}
        <header className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-[#c5a059]/30 text-xs tracking-[0.2em] uppercase text-[#e0be7a] mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
            <span>Vanguard Talent Relations</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
            Celebrity Meet &amp; Greet Request
          </h1>
          <p className="mt-3 text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Submit a private inquiry to express your interest in an exclusive in-person or virtual meet &amp; greet with your preferred celebrity or public figure.
          </p>
          <div className="mt-4 gold-divider mx-auto max-w-xs" />
        </header>

        {/* Conditional Rendering: Form OR Submission Confirmation View */}
        {submissionResult ? (
          <ConfirmationView data={submissionResult} onReset={handleResetForm} />
        ) : (
          <main className="luxury-card rounded-2xl p-6 sm:p-10 border border-white/10 shadow-2xl">
            {/* General Submission Error Banner */}
            {errors.general && (
              <div
                className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-sm flex items-start gap-3"
                role="alert"
              >
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <span>{errors.general}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-8">
              {/* SECTION 1: Personal Information */}
              <div>
                <div className="flex items-center gap-2 pb-2 mb-4 border-b border-white/10">
                  <User className="w-4 h-4 text-[#c5a059]" />
                  <h2 className="text-sm font-semibold tracking-wider uppercase text-zinc-300">
                    1. Personal Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Full Name */}
                  <div className="sm:col-span-2">
                    <label htmlFor="fullName" className="block text-xs font-medium text-zinc-300 mb-1.5 uppercase tracking-wide">
                      Full Name <span className="text-[#c5a059]">*</span>
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="e.g. Victoria Sterling"
                      value={formData.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      onBlur={() => handleBlur('fullName')}
                      className={`luxury-input ${errors.fullName && touched.fullName ? 'has-error' : ''}`}
                      aria-invalid={!!errors.fullName && touched.fullName}
                      aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                    />
                    {errors.fullName && touched.fullName && (
                      <p id="fullName-error" className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {errors.fullName}
                      </p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div className="sm:col-span-1">
                    <label htmlFor="email" className="block text-xs font-medium text-zinc-300 mb-1.5 uppercase tracking-wide">
                      Email Address <span className="text-[#c5a059]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="v.sterling@domain.com"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        onBlur={() => handleBlur('email')}
                        className={`luxury-input ${errors.email && touched.email ? 'has-error' : ''}`}
                        aria-invalid={!!errors.email && touched.email}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                      />
                    </div>
                    {errors.email && touched.email && (
                      <p id="email-error" className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone Number with Country Code */}
                  <div className="sm:col-span-1">
                    <label htmlFor="phone" className="block text-xs font-medium text-zinc-300 mb-1.5 uppercase tracking-wide">
                      Phone Number <span className="text-[#c5a059]">*</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        aria-label="Country dial code"
                        value={formData.countryCode}
                        onChange={(e) => handleChange('countryCode', e.target.value)}
                        className="luxury-input w-28 shrink-0 text-xs sm:text-sm px-2.5"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.dialCode}>
                            {c.code} ({c.dialCode})
                          </option>
                        ))}
                      </select>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        autoComplete="tel"
                        placeholder="(555) 234-5678"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        onBlur={() => handleBlur('phone')}
                        className={`luxury-input flex-1 ${errors.phone && touched.phone ? 'has-error' : ''}`}
                        aria-invalid={!!errors.phone && touched.phone}
                        aria-describedby={errors.phone ? 'phone-error' : undefined}
                      />
                    </div>
                    {errors.phone && touched.phone ? (
                      <p id="phone-error" className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {errors.phone}
                      </p>
                    ) : (
                      <p className="mt-1 text-[11px] text-zinc-500">Includes international country code.</p>
                    )}
                  </div>

                  {/* Country of Residence */}
                  <div className="sm:col-span-1">
                    <label htmlFor="country" className="block text-xs font-medium text-zinc-300 mb-1.5 uppercase tracking-wide">
                      Country of Residence <span className="text-[#c5a059]">*</span>
                    </label>
                    <select
                      id="country"
                      name="country"
                      required
                      value={formData.country}
                      onChange={(e) => handleChange('country', e.target.value)}
                      onBlur={() => handleBlur('country')}
                      className={`luxury-input ${errors.country && touched.country ? 'has-error' : ''}`}
                      aria-invalid={!!errors.country && touched.country}
                      aria-describedby={errors.country ? 'country-error' : undefined}
                    >
                      <option value="">Select your country</option>
                      {COUNTRIES.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {errors.country && touched.country && (
                      <p id="country-error" className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {errors.country}
                      </p>
                    )}
                  </div>

                  {/* City */}
                  <div className="sm:col-span-1">
                    <label htmlFor="city" className="block text-xs font-medium text-zinc-300 mb-1.5 uppercase tracking-wide">
                      City <span className="text-[#c5a059]">*</span>
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      required
                      placeholder="e.g. Los Angeles, London"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      onBlur={() => handleBlur('city')}
                      className={`luxury-input ${errors.city && touched.city ? 'has-error' : ''}`}
                      aria-invalid={!!errors.city && touched.city}
                      aria-describedby={errors.city ? 'city-error' : undefined}
                    />
                    {errors.city && touched.city && (
                      <p id="city-error" className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {errors.city}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 2: Meet & Greet Information */}
              <div>
                <div className="flex items-center gap-2 pb-2 mb-4 border-b border-white/10">
                  <Star className="w-4 h-4 text-[#c5a059]" />
                  <h2 className="text-sm font-semibold tracking-wider uppercase text-zinc-300">
                    2. Meet &amp; Greet Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Celebrity's Name */}
                  <div className="sm:col-span-2">
                    <label htmlFor="celebrityName" className="block text-xs font-medium text-zinc-300 mb-1.5 uppercase tracking-wide">
                      Celebrity's Name <span className="text-[#c5a059]">*</span>
                    </label>
                    <input
                      id="celebrityName"
                      name="celebrityName"
                      type="text"
                      required
                      placeholder="e.g. Keanu Reeves, Zendaya, Adele"
                      value={formData.celebrityName}
                      onChange={(e) => handleChange('celebrityName', e.target.value)}
                      onBlur={() => handleBlur('celebrityName')}
                      className={`luxury-input ${errors.celebrityName && touched.celebrityName ? 'has-error' : ''}`}
                      aria-invalid={!!errors.celebrityName && touched.celebrityName}
                      aria-describedby={errors.celebrityName ? 'celebrityName-error' : undefined}
                    />
                    {errors.celebrityName && touched.celebrityName && (
                      <p id="celebrityName-error" className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {errors.celebrityName}
                      </p>
                    )}
                  </div>

                  {/* Preferred Meeting Type */}
                  <div className="sm:col-span-1">
                    <label htmlFor="meetingType" className="block text-xs font-medium text-zinc-300 mb-1.5 uppercase tracking-wide">
                      Preferred Meeting Type <span className="text-[#c5a059]">*</span>
                    </label>
                    <select
                      id="meetingType"
                      name="meetingType"
                      required
                      value={formData.meetingType}
                      onChange={(e) => handleChange('meetingType', e.target.value)}
                      onBlur={() => handleBlur('meetingType')}
                      className={`luxury-input ${errors.meetingType && touched.meetingType ? 'has-error' : ''}`}
                      aria-invalid={!!errors.meetingType && touched.meetingType}
                      aria-describedby={errors.meetingType ? 'meetingType-error' : undefined}
                    >
                      <option value="">Select meeting type</option>
                      <option value="In-person Meet & Greet">In-person Meet &amp; Greet</option>
                      <option value="Virtual Meet & Greet">Virtual Meet &amp; Greet</option>
                      <option value="No Preference">No Preference</option>
                    </select>
                    {errors.meetingType && touched.meetingType && (
                      <p id="meetingType-error" className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {errors.meetingType}
                      </p>
                    )}
                  </div>

                  {/* Number of People Attending */}
                  <div className="sm:col-span-1">
                    <label htmlFor="attendees" className="block text-xs font-medium text-zinc-300 mb-1.5 uppercase tracking-wide">
                      Number of People Attending <span className="text-[#c5a059]">*</span>
                    </label>
                    <select
                      id="attendees"
                      name="attendees"
                      required
                      value={formData.attendees}
                      onChange={(e) => handleChange('attendees', e.target.value)}
                      onBlur={() => handleBlur('attendees')}
                      className={`luxury-input ${errors.attendees && touched.attendees ? 'has-error' : ''}`}
                      aria-invalid={!!errors.attendees && touched.attendees}
                      aria-describedby={errors.attendees ? 'attendees-error' : undefined}
                    >
                      <option value="1 Person">1 Person (Individual)</option>
                      <option value="2 People">2 People</option>
                      <option value="3 People">3 People</option>
                      <option value="4 People">4 People</option>
                      <option value="5+ People (Group Request)">5+ People (Group Request)</option>
                    </select>
                    {errors.attendees && touched.attendees && (
                      <p id="attendees-error" className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {errors.attendees}
                      </p>
                    )}
                  </div>

                  {/* Preferred Date (Optional) */}
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="preferredDate" className="block text-xs font-medium text-zinc-300 uppercase tracking-wide">
                        Preferred Date <span className="text-zinc-500 font-normal lowercase">(optional)</span>
                      </label>
                      <span className="text-[11px] text-zinc-500">Subject to talent availability</span>
                    </div>
                    <input
                      id="preferredDate"
                      name="preferredDate"
                      type="date"
                      min={todayDateString}
                      value={formData.preferredDate}
                      onChange={(e) => handleChange('preferredDate', e.target.value)}
                      className="luxury-input"
                    />
                  </div>

                  {/* Why Would You Like to Meet This Celebrity? (Optional) */}
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="reason" className="block text-xs font-medium text-zinc-300 uppercase tracking-wide">
                        Why Would You Like to Meet This Celebrity? <span className="text-zinc-500 font-normal lowercase">(optional)</span>
                      </label>
                      <span className="text-[11px] text-zinc-500">{formData.reason.length}/1000</span>
                    </div>
                    <textarea
                      id="reason"
                      name="reason"
                      rows={3}
                      maxLength={1000}
                      placeholder="Share a brief message about what this artist or public figure's work means to you..."
                      value={formData.reason}
                      onChange={(e) => handleChange('reason', e.target.value)}
                      className="luxury-input resize-y"
                    />
                  </div>

                  {/* Additional Message (Optional) */}
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="message" className="block text-xs font-medium text-zinc-300 uppercase tracking-wide">
                        Additional Message <span className="text-zinc-500 font-normal lowercase">(optional)</span>
                      </label>
                      <span className="text-[11px] text-zinc-500">{formData.message.length}/1000</span>
                    </div>
                    <textarea
                      id="message"
                      name="message"
                      rows={2}
                      maxLength={1000}
                      placeholder="Any specific location suggestions, accessibility accommodations, or special notes..."
                      value={formData.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                      className="luxury-input resize-y"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Confirmations & Disclaimers */}
              <div className="pt-2 border-t border-white/10 space-y-4">
                {/* Notice banner */}
                <div className="p-3.5 rounded-lg bg-[#c5a059]/5 border border-[#c5a059]/20 text-xs text-zinc-300 leading-relaxed font-sans">
                  <span className="text-[#c5a059] font-semibold">Important Disclaimer: </span>
                  Submitting this request form expresses fan interest only and does not guarantee a meet &amp; greet, attendance, or celebrity availability. All requests are subject to talent management review and authorization.
                </div>

                {/* Checkbox 1: Accurate Information */}
                <div>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      id="confirmedAccurate"
                      checked={formData.confirmedAccurate}
                      onChange={(e) => handleChange('confirmedAccurate', e.target.checked)}
                      onBlur={() => handleBlur('confirmedAccurate')}
                      className={`luxury-checkbox ${errors.confirmedAccurate && touched.confirmedAccurate ? 'has-error' : ''}`}
                      aria-invalid={!!errors.confirmedAccurate && touched.confirmedAccurate}
                    />
                    <span className="text-xs sm:text-sm text-zinc-300 group-hover:text-white transition-colors leading-normal select-none">
                      I confirm that all information provided in this request is accurate and truthful. <span className="text-[#c5a059]">*</span>
                    </span>
                  </label>
                  {errors.confirmedAccurate && touched.confirmedAccurate && (
                    <p className="mt-1 ml-8 text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errors.confirmedAccurate}
                    </p>
                  )}
                </div>

                {/* Checkbox 2: Privacy Policy */}
                <div>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      id="acknowledgedPrivacy"
                      checked={formData.acknowledgedPrivacy}
                      onChange={(e) => handleChange('acknowledgedPrivacy', e.target.checked)}
                      onBlur={() => handleBlur('acknowledgedPrivacy')}
                      className={`luxury-checkbox ${errors.acknowledgedPrivacy && touched.acknowledgedPrivacy ? 'has-error' : ''}`}
                      aria-invalid={!!errors.acknowledgedPrivacy && touched.acknowledgedPrivacy}
                    />
                    <span className="text-xs sm:text-sm text-zinc-300 group-hover:text-white transition-colors leading-normal select-none">
                      I acknowledge and agree to the{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsPrivacyModalOpen(true);
                        }}
                        className="text-[#c5a059] hover:text-[#e0be7a] underline underline-offset-2 transition-colors font-medium"
                      >
                        Privacy Policy
                      </button>
                      {' '}regarding the confidential processing of my details. <span className="text-[#c5a059]">*</span>
                    </span>
                  </label>
                  {errors.acknowledgedPrivacy && touched.acknowledgedPrivacy && (
                    <p className="mt-1 ml-8 text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errors.acknowledgedPrivacy}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-submit"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Request</span>
                    </>
                  )}
                </button>
                <p className="text-center text-[11px] text-zinc-500 mt-3 font-sans">
                  Submissions are transmitted securely and evaluated confidentially by talent management.
                </p>
              </div>
            </form>
          </main>
        )}

        {/* Minimal Footer */}
        <footer className="mt-12 text-center text-xs text-zinc-500 font-sans pb-6">
          <p className="tracking-wide">
            &copy; {new Date().getFullYear()} Vanguard Talent Relations. All rights reserved.
          </p>
          <p className="mt-1 text-[11px] text-zinc-600">
            Official Fan Engagement &amp; Guest Inquiry Protocol
          </p>
        </footer>
      </div>

      {/* Privacy Policy Modal */}
      <PrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />
    </div>
  );
};

export default App;
