import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { COUNTRIES } from './data/countries';
import { PrivacyModal } from './components/PrivacyModal';
import { ConfirmationView, SubmissionResult } from './components/ConfirmationView';
import { AdminLogin } from './admin/AdminLogin';
import { AdminLayout } from './admin/AdminLayout';

interface AdminUser {
  id?: string;
  email: string;
  fullName: string;
  role: string;
  lastLoginAt?: string;
}

interface FormData {
  fullName: string;
  email: string;
  phoneCountryCode: string;
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
  phoneCountryCode: 'US',
  countryCode: '+1',
  phone: '',
  country: 'United States',
  city: '',
  celebrityName: 'Keanu Reeves',
  meetingType: '',
  preferredDate: '',
  attendees: '1 attendee',
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

  // Administrative Portal & Session State
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname.startsWith('/admin');
    }
    return false;
  });
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isCheckingAdminAuth, setIsCheckingAdminAuth] = useState<boolean>(true);

  // Check admin session on mount
  useEffect(() => {
    const token = localStorage.getItem('wme_admin_token');
    if (!token) {
      setIsCheckingAdminAuth(false);
      return;
    }

    fetch('/api/admin/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data) => {
        if (data.success && data.admin) {
          setAdminUser(data.admin);
        } else {
          localStorage.removeItem('wme_admin_token');
          setAdminUser(null);
        }
      })
      .catch(() => {
        localStorage.removeItem('wme_admin_token');
        setAdminUser(null);
      })
      .finally(() => {
        setIsCheckingAdminAuth(false);
      });
  }, []);

  // Listen to browser navigation (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setIsAdminMode(window.location.pathname.startsWith('/admin'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToAdmin = () => {
    window.history.pushState(null, '', '/admin');
    setIsAdminMode(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToPublicForm = () => {
    window.history.pushState(null, '', '/');
    setIsAdminMode(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminLogout = async () => {
    const token = localStorage.getItem('wme_admin_token');
    if (token) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch {}
    }
    localStorage.removeItem('wme_admin_token');
    setAdminUser(null);
  };

  // Minimum selectable date: today in YYYY-MM-DD
  const todayDateString = new Date().toISOString().split('T')[0];

  // Standard email format validation regex
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
          return 'Please provide a valid email address (e.g. name@domain.com).';
        }
        return undefined;

      case 'phone':
        if (!value || typeof value !== 'string' || !value.trim()) {
          return 'Phone number is required, including country code.';
        }
        const cleanDigits = value.replace(/\D/g, '');
        if (cleanDigits.length < 6) {
          return 'Please enter a valid telephone number with area code.';
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
          return 'Celebrity name is required.';
        }
        return undefined;

      case 'meetingType':
        if (!value || !['In-person', 'Virtual', 'No preference'].includes(value)) {
          return 'Please select a preferred meeting format.';
        }
        return undefined;

      case 'attendees':
        if (!value || typeof value !== 'string' || !value.trim()) {
          return 'Please indicate the number of attendees.';
        }
        return undefined;

      case 'confirmedAccurate':
        if (!value) {
          return 'You must confirm that the submitted information is accurate.';
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
      if (field === 'country') {
        const found = COUNTRIES.find((c) => c.name === value);
        if (found) {
          updated.countryCode = found.dialCode;
          updated.phoneCountryCode = found.code;
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

  const handlePhoneCountryChange = (isoCode: string) => {
    const found = COUNTRIES.find((c) => c.code === isoCode);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        phoneCountryCode: found.code,
        countryCode: found.dialCode,
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
      const firstError = document.querySelector('.has-error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, general: undefined }));

    const trimmedPhone = formData.phone.trim();
    const fullPhone = trimmedPhone.startsWith('+')
      ? trimmedPhone
      : `${formData.countryCode} ${trimmedPhone}`;

    const payload = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: fullPhone,
      country: formData.country.trim(),
      city: formData.city.trim(),
      celebrityName: 'Keanu Reeves',
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
          setErrors({ general: data.message || 'Unable to submit request. Please check your information.' });
        }
        setIsSubmitting(false);
        return;
      }

      setSubmissionResult(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Request submission failed:', err);
      setErrors({
        general: 'Unable to communicate with the intake service. Please check your network connection and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setFormData({
      ...INITIAL_FORM_DATA,
      celebrityName: 'Keanu Reeves',
    });
    setErrors({});
    setTouched({});
    setSubmissionResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Render Admin View if on /admin route or Admin Mode active
  if (isAdminMode) {
    if (isCheckingAdminAuth) {
      return (
        <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-4">
          <div className="text-center space-y-3">
            <span className="wme-wordmark text-3xl text-[#111111] block">WME</span>
            <span className="text-xs font-mono tracking-wider uppercase text-[#737373] block">
              William Morris Endeavor
            </span>
            <div className="pt-4 flex items-center justify-center gap-2 text-xs font-mono text-[#666666]">
              <Loader2 className="w-4 h-4 animate-spin text-[#6B1D2F]" />
              <span>Verifying administrative session...</span>
            </div>
          </div>
        </div>
      );
    }

    if (!adminUser) {
      return (
        <AdminLogin
          onLoginSuccess={(token, admin) => {
            localStorage.setItem('wme_admin_token', token);
            setAdminUser(admin);
          }}
          onBackToPublicForm={navigateToPublicForm}
        />
      );
    }

    return (
      <AdminLayout
        adminUser={adminUser}
        onLogout={handleAdminLogout}
        onReturnToPublicForm={navigateToPublicForm}
      />
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] text-[#111111] font-sans antialiased flex flex-col justify-between overflow-x-clip">
      {/* Restrained WME Header */}
      <header className="border-b border-[#E5E5E5] bg-[#FFFFFF] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-3.5 sm:py-5 flex flex-wrap items-center justify-between gap-y-2 gap-x-4">
          <div className="flex items-baseline gap-2 sm:gap-3 shrink-0">
            <span className="wme-wordmark text-xl sm:text-2xl text-[#111111]">
              WME
            </span>
            <span className="text-[11px] sm:text-xs font-mono tracking-wider uppercase text-[#737373]">
              / William Morris Endeavor
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-[11px] font-mono tracking-wider text-[#737373] uppercase shrink-0">
            <span className="hidden sm:inline">Talent Inquiry</span>
            <span className="hidden sm:inline text-[#E5E5E5]">•</span>
            <span className="text-[#6B1D2F] font-semibold bg-[#6B1D2F]/5 px-2 py-0.5 rounded-[2px] border border-[#6B1D2F]/20 text-[10px] sm:text-[11px]">
              Keanu Reeves
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-10 lg:py-14 w-full flex-1 min-w-0">
        {submissionResult ? (
          <div className="max-w-2xl mx-auto w-full min-w-0">
            <ConfirmationView data={submissionResult} onReset={handleResetForm} />
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 xl:gap-16 items-start w-full min-w-0">
            {/* Left Column: Context & Guidelines for Keanu Reeves Inquiry */}
            <aside className="lg:col-span-5 mb-8 lg:mb-0 lg:sticky lg:top-24 space-y-6 sm:space-y-8 w-full min-w-0">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#6B1D2F]/5 border border-[#6B1D2F]/20 text-[10px] font-mono uppercase tracking-[0.2em] text-[#6B1D2F] font-semibold mb-3 rounded-[2px]">
                  <span>WME Client Relations</span>
                </div>
                <h1 className="fluid-title font-serif font-normal text-[#111111]">
                  A Moment with Keanu Reeves
                </h1>
                <p className="mt-3 sm:mt-4 fluid-subtitle text-[#555555] font-sans">
                  Express your interest in a meet-and-greet experience with Keanu Reeves by completing the request form below. Please provide accurate information so your request can be reviewed.
                </p>
              </div>

              <div className="w-12 h-[1px] bg-[#E5E5E5]" />

              {/* Guidelines */}
              <div className="space-y-4 sm:space-y-5 pt-1">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B1D2F] font-semibold block">
                    01 / Evaluation Protocol
                  </span>
                  <p className="text-xs sm:text-[13px] text-[#666666] leading-relaxed">
                    Inquiries are reviewed in sequence by talent management representatives based on schedule feasibility and touring commitments.
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B1D2F] font-semibold block">
                    02 / Non-Guaranteed Consideration
                  </span>
                  <p className="text-xs sm:text-[13px] text-[#666666] leading-relaxed">
                    Submission conveys interest for consideration only. It does not constitute approval, a booking contract, ticket reservation, or confirmed appearance.
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B1D2F] font-semibold block">
                    03 / Discretion &amp; Confidentiality
                  </span>
                  <p className="text-xs sm:text-[13px] text-[#666666] leading-relaxed">
                    All fan information and submission records are maintained under strict non-disclosure protocol and are not shared with third parties.
                  </p>
                </div>
              </div>

              {/* Disclaimer Notice Box */}
              <div className="p-3.5 bg-[#FFFFFF] border border-[#E5E5E5] text-[11px] text-[#737373] leading-relaxed rounded-[2px]">
                <strong className="text-[#111111] block mb-0.5 font-medium">Inquiry Notice</strong>
                This fan-interest inquiry form is designed for talent management consideration. Submission does not imply an official partnership, authorization, or guarantee of a meeting with Keanu Reeves.
              </div>

              {/* Agency Office Locations */}
              <div className="pt-2 text-[11px] font-mono text-[#888888] tracking-wider uppercase">
                Beverly Hills · New York · London · Nashville · Sydney
              </div>
            </aside>

            {/* Right Column: The Form Card */}
            <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#E5E5E5] p-4 sm:p-7 md:p-9 shadow-sm rounded-[2px] w-full min-w-0">
              {errors.general && (
                <div
                  className="mb-6 sm:mb-8 p-3.5 sm:p-4 bg-[#FEF2F2] border border-[#F87171] text-[#991B1B] text-xs sm:text-sm flex items-start gap-2.5 sm:gap-3 rounded-[2px]"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B91C1C]" />
                  <span>{errors.general}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-8 sm:space-y-10 w-full min-w-0">
                {/* Section 01: Personal Information */}
                <div className="w-full min-w-0">
                  <div className="flex items-baseline justify-between pb-2.5 sm:pb-3 mb-5 sm:mb-6 border-b border-[#E5E5E5]">
                    <h2 className="text-xs font-mono uppercase tracking-[0.16em] text-[#111111] font-semibold">
                      Section 01 — Personal Information
                    </h2>
                    <span className="text-[10px] font-mono text-[#6B1D2F] font-semibold shrink-0">[ 01 / 03 ]</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full min-w-0">
                    {/* Full Name */}
                    <div className="sm:col-span-2 min-w-0">
                      <label htmlFor="fullName" className="block text-xs font-mono uppercase tracking-wider text-[#111111] mb-1.5">
                        Full Name <span className="text-[#888888]">*</span>
                      </label>
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        required
                        autoComplete="name"
                        inputMode="text"
                        autoCapitalize="words"
                        placeholder="e.g. Eleanor Vance"
                        value={formData.fullName}
                        onChange={(e) => handleChange('fullName', e.target.value)}
                        onBlur={() => handleBlur('fullName')}
                        className={`wme-input ${errors.fullName && touched.fullName ? 'has-error' : ''}`}
                        aria-invalid={!!errors.fullName && touched.fullName}
                        aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                      />
                      {errors.fullName && touched.fullName && (
                        <p id="fullName-error" className="mt-1.5 text-xs text-[#B91C1C]">
                          {errors.fullName}
                        </p>
                      )}
                    </div>

                    {/* Email Address */}
                    <div className="sm:col-span-1 min-w-0">
                      <label htmlFor="email" className="block text-xs font-mono uppercase tracking-wider text-[#111111] mb-1.5">
                        Email Address <span className="text-[#888888]">*</span>
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        inputMode="email"
                        autoCapitalize="none"
                        autoCorrect="off"
                        placeholder="eleanor@domain.com"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        onBlur={() => handleBlur('email')}
                        className={`wme-input ${errors.email && touched.email ? 'has-error' : ''}`}
                        aria-invalid={!!errors.email && touched.email}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                      />
                      {errors.email && touched.email && (
                        <p id="email-error" className="mt-1.5 text-xs text-[#B91C1C]">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    {/* Phone Number with Integrated Prefix */}
                    <div className="sm:col-span-1 min-w-0">
                      <label htmlFor="phone" className="block text-xs font-mono uppercase tracking-wider text-[#111111] mb-1.5">
                        Phone Number <span className="text-[#888888]">*</span>
                      </label>
                      <div
                        className={`flex items-stretch border bg-white rounded-[2px] transition-all w-full min-w-0 ${
                          errors.phone && touched.phone
                            ? 'border-[#B91C1C] bg-[#FEF2F2]'
                            : 'border-[#E5E5E5] hover:border-[#A3A3A3] focus-within:border-[#111111] focus-within:ring-1 focus-within:ring-[#111111]'
                        }`}
                      >
                        <select
                          aria-label="Country dial code"
                          value={formData.phoneCountryCode}
                          onChange={(e) => handlePhoneCountryChange(e.target.value)}
                          className="phone-prefix-select shrink-0"
                        >
                          {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.code} ({c.dialCode}) — {c.name}
                            </option>
                          ))}
                        </select>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          required
                          autoComplete="tel"
                          inputMode="tel"
                          placeholder="(212) 555-0192"
                          value={formData.phone}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          onBlur={() => handleBlur('phone')}
                          className="w-full min-w-0 bg-transparent border-0 px-3 py-2.5 text-base sm:text-[0.9375rem] text-[#111111] placeholder:text-[#888888] focus:outline-none focus:ring-0 font-sans"
                          aria-invalid={!!errors.phone && touched.phone}
                          aria-describedby={errors.phone ? 'phone-error' : undefined}
                        />
                      </div>
                      {errors.phone && touched.phone && (
                        <p id="phone-error" className="mt-1.5 text-xs text-[#B91C1C]">
                          {errors.phone}
                        </p>
                      )}
                    </div>

                    {/* Country of Residence */}
                    <div className="sm:col-span-1 min-w-0">
                      <label htmlFor="country" className="block text-xs font-mono uppercase tracking-wider text-[#111111] mb-1.5">
                        Country of Residence <span className="text-[#888888]">*</span>
                      </label>
                      <select
                        id="country"
                        name="country"
                        required
                        value={formData.country}
                        onChange={(e) => handleChange('country', e.target.value)}
                        onBlur={() => handleBlur('country')}
                        className={`wme-input ${errors.country && touched.country ? 'has-error' : ''}`}
                        aria-invalid={!!errors.country && touched.country}
                        aria-describedby={errors.country ? 'country-error' : undefined}
                      >
                        <option value="">Select country</option>
                        {COUNTRIES.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      {errors.country && touched.country && (
                        <p id="country-error" className="mt-1.5 text-xs text-[#B91C1C]">
                          {errors.country}
                        </p>
                      )}
                    </div>

                    {/* City */}
                    <div className="sm:col-span-1 min-w-0">
                      <label htmlFor="city" className="block text-xs font-mono uppercase tracking-wider text-[#111111] mb-1.5">
                        City <span className="text-[#888888]">*</span>
                      </label>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        required
                        autoComplete="address-level2"
                        inputMode="text"
                        autoCapitalize="words"
                        placeholder="e.g. London, Los Angeles"
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        onBlur={() => handleBlur('city')}
                        className={`wme-input ${errors.city && touched.city ? 'has-error' : ''}`}
                        aria-invalid={!!errors.city && touched.city}
                        aria-describedby={errors.city ? 'city-error' : undefined}
                      />
                      {errors.city && touched.city && (
                        <p id="city-error" className="mt-1.5 text-xs text-[#B91C1C]">
                          {errors.city}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 02: Meet & Greet Preferences */}
                <div className="w-full min-w-0">
                  <div className="flex items-baseline justify-between pb-2.5 sm:pb-3 mb-5 sm:mb-6 border-b border-[#E5E5E5]">
                    <h2 className="text-xs font-mono uppercase tracking-[0.16em] text-[#111111] font-semibold">
                      Section 02 — Meet &amp; Greet Preferences
                    </h2>
                    <span className="text-[10px] font-mono text-[#6B1D2F] font-semibold shrink-0">[ 02 / 03 ]</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full min-w-0">
                    {/* Fixed Designated Celebrity */}
                    <div className="sm:col-span-2 min-w-0">
                      <label className="block text-xs font-mono uppercase tracking-wider text-[#111111] mb-1.5">
                        Celebrity
                      </label>
                      <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-3.5 bg-[#F7F7F6] border border-[#E5E5E5] rounded-[2px] w-full min-w-0">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <span className="font-serif text-lg sm:text-xl text-[#111111] font-normal tracking-wide">
                            Keanu Reeves
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono tracking-wider uppercase bg-[#6B1D2F]/10 text-[#6B1D2F] px-2 py-0.5 border border-[#6B1D2F]/20 font-semibold rounded-[2px]">
                            <CheckCircle2 className="w-3 h-3 text-[#6B1D2F] shrink-0" />
                            <span>Designated Talent</span>
                          </span>
                        </div>
                        <span className="text-[11px] text-[#737373] font-mono">
                          Pre-selected
                        </span>
                      </div>
                      <input type="hidden" name="celebrityName" value="Keanu Reeves" />
                    </div>

                    {/* Preferred Meeting Format */}
                    <div className="sm:col-span-1 min-w-0">
                      <label htmlFor="meetingType" className="block text-xs font-mono uppercase tracking-wider text-[#111111] mb-1.5">
                        Preferred Meeting Format <span className="text-[#888888]">*</span>
                      </label>
                      <select
                        id="meetingType"
                        name="meetingType"
                        required
                        value={formData.meetingType}
                        onChange={(e) => handleChange('meetingType', e.target.value)}
                        onBlur={() => handleBlur('meetingType')}
                        className={`wme-input ${errors.meetingType && touched.meetingType ? 'has-error' : ''}`}
                        aria-invalid={!!errors.meetingType && touched.meetingType}
                        aria-describedby={errors.meetingType ? 'meetingType-error' : undefined}
                      >
                        <option value="">Select meeting format</option>
                        <option value="In-person">In-person</option>
                        <option value="Virtual">Virtual</option>
                        <option value="No preference">No preference</option>
                      </select>
                      {errors.meetingType && touched.meetingType && (
                        <p id="meetingType-error" className="mt-1.5 text-xs text-[#B91C1C]">
                          {errors.meetingType}
                        </p>
                      )}
                    </div>

                    {/* Number of Attendees */}
                    <div className="sm:col-span-1 min-w-0">
                      <label htmlFor="attendees" className="block text-xs font-mono uppercase tracking-wider text-[#111111] mb-1.5">
                        Number of Attendees <span className="text-[#888888]">*</span>
                      </label>
                      <select
                        id="attendees"
                        name="attendees"
                        required
                        value={formData.attendees}
                        onChange={(e) => handleChange('attendees', e.target.value)}
                        onBlur={() => handleBlur('attendees')}
                        className={`wme-input ${errors.attendees && touched.attendees ? 'has-error' : ''}`}
                        aria-invalid={!!errors.attendees && touched.attendees}
                        aria-describedby={errors.attendees ? 'attendees-error' : undefined}
                      >
                        <option value="1 attendee">1 attendee</option>
                        <option value="2 attendees">2 attendees</option>
                        <option value="3 attendees">3 attendees</option>
                        <option value="4 attendees">4 attendees</option>
                        <option value="5+ attendees (group)">5+ attendees (group request)</option>
                      </select>
                      {errors.attendees && touched.attendees && (
                        <p id="attendees-error" className="mt-1.5 text-xs text-[#B91C1C]">
                          {errors.attendees}
                        </p>
                      )}
                    </div>

                    {/* Preferred Date */}
                    <div className="sm:col-span-2 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
                        <label htmlFor="preferredDate" className="block text-xs font-mono uppercase tracking-wider text-[#111111]">
                          Preferred Date <span className="text-[#737373] font-normal lowercase">(optional)</span>
                        </label>
                        <span className="text-[11px] text-[#737373]">Subject to schedule feasibility</span>
                      </div>
                      <input
                        id="preferredDate"
                        name="preferredDate"
                        type="date"
                        min={todayDateString}
                        value={formData.preferredDate}
                        onChange={(e) => handleChange('preferredDate', e.target.value)}
                        className="wme-input"
                      />
                    </div>

                    {/* Why Would You Like to Meet Keanu Reeves? */}
                    <div className="sm:col-span-2 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <label htmlFor="reason" className="block text-xs font-mono uppercase tracking-wider text-[#111111]">
                          Why Would You Like to Meet Keanu Reeves? <span className="text-[#737373] font-normal lowercase">(optional)</span>
                        </label>
                        <span className="text-[11px] font-mono text-[#737373] shrink-0">{formData.reason.length} / 1000</span>
                      </div>
                      <textarea
                        id="reason"
                        name="reason"
                        rows={3}
                        maxLength={1000}
                        placeholder="Please share what inspires this request or the personal significance of Keanu Reeves' work and philanthropy to you..."
                        value={formData.reason}
                        onChange={(e) => handleChange('reason', e.target.value)}
                        className="wme-input resize-y min-h-[90px]"
                      />
                    </div>

                    {/* Additional Message */}
                    <div className="sm:col-span-2 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <label htmlFor="message" className="block text-xs font-mono uppercase tracking-wider text-[#111111]">
                          Additional Message <span className="text-[#737373] font-normal lowercase">(optional)</span>
                        </label>
                        <span className="text-[11px] font-mono text-[#737373] shrink-0">{formData.message.length} / 1000</span>
                      </div>
                      <textarea
                        id="message"
                        name="message"
                        rows={2}
                        maxLength={1000}
                        placeholder="Any relevant logistical notes, proposed geographic region, or accessibility considerations..."
                        value={formData.message}
                        onChange={(e) => handleChange('message', e.target.value)}
                        className="wme-input resize-y min-h-[72px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 03: Confirmation */}
                <div className="w-full min-w-0">
                  <div className="flex items-baseline justify-between pb-2.5 sm:pb-3 mb-5 sm:mb-6 border-b border-[#E5E5E5]">
                    <h2 className="text-xs font-mono uppercase tracking-[0.16em] text-[#111111] font-semibold">
                      Section 03 — Confirmation
                    </h2>
                    <span className="text-[10px] font-mono text-[#6B1D2F] font-semibold shrink-0">[ 03 / 03 ]</span>
                  </div>

                  <div className="space-y-4">
                    {/* Checkbox 1: Accurate Information */}
                    <div>
                      <label className="flex items-start gap-3 cursor-pointer group py-1">
                        <input
                          type="checkbox"
                          id="confirmedAccurate"
                          checked={formData.confirmedAccurate}
                          onChange={(e) => handleChange('confirmedAccurate', e.target.checked)}
                          onBlur={() => handleBlur('confirmedAccurate')}
                          className={`wme-checkbox ${errors.confirmedAccurate && touched.confirmedAccurate ? 'has-error' : ''}`}
                          aria-invalid={!!errors.confirmedAccurate && touched.confirmedAccurate}
                        />
                        <span className="text-xs sm:text-sm text-[#333333] group-hover:text-[#111111] transition-colors leading-normal select-none">
                          I confirm that the submitted information is accurate and truthful. <span className="text-[#888888]">*</span>
                        </span>
                      </label>
                      {errors.confirmedAccurate && touched.confirmedAccurate && (
                        <p className="mt-1 ml-7 text-xs text-[#B91C1C]">
                          {errors.confirmedAccurate}
                        </p>
                      )}
                    </div>

                    {/* Checkbox 2: Privacy Policy */}
                    <div>
                      <label className="flex items-start gap-3 cursor-pointer group py-1">
                        <input
                          type="checkbox"
                          id="acknowledgedPrivacy"
                          checked={formData.acknowledgedPrivacy}
                          onChange={(e) => handleChange('acknowledgedPrivacy', e.target.checked)}
                          onBlur={() => handleBlur('acknowledgedPrivacy')}
                          className={`wme-checkbox ${errors.acknowledgedPrivacy && touched.acknowledgedPrivacy ? 'has-error' : ''}`}
                          aria-invalid={!!errors.acknowledgedPrivacy && touched.acknowledgedPrivacy}
                        />
                        <span className="text-xs sm:text-sm text-[#333333] group-hover:text-[#111111] transition-colors leading-normal select-none">
                          I acknowledge and agree to the{' '}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setIsPrivacyModalOpen(true);
                            }}
                            className="underline underline-offset-4 decoration-[#888888] hover:decoration-[#6B1D2F] font-medium text-[#111111] hover:text-[#6B1D2F] transition-colors"
                          >
                            Privacy Policy
                          </button>
                          {' '}regarding the confidential processing of my inquiry. <span className="text-[#888888]">*</span>
                        </span>
                      </label>
                      {errors.acknowledgedPrivacy && touched.acknowledgedPrivacy && (
                        <p className="mt-1 ml-7 text-xs text-[#B91C1C]">
                          {errors.acknowledgedPrivacy}
                        </p>
                      )}
                    </div>

                    {/* Notice */}
                    <div className="pt-3 border-t border-[#F0F0F0] text-[11px] text-[#737373] leading-relaxed">
                      Notice: Submitting this form expresses fan interest for consideration only and does not guarantee a meeting, booking, or reservation with Keanu Reeves. All inquiries are subject to review by WME and talent management.
                    </div>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Request...</span>
                      </>
                    ) : (
                      <span>Submit Request</span>
                    )}
                  </button>
                  <p className="text-center text-[11px] text-[#737373] mt-3 font-mono">
                    WME Intake Portal — Encrypted Transmission
                  </p>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Restrained WME Footer */}
      <footer className="border-t border-[#E5E5E5] bg-[#FFFFFF] py-6 sm:py-8 text-xs text-[#737373]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 font-mono text-[11px] text-center sm:text-left">
          <div>
            &copy; {new Date().getFullYear()} WME (William Morris Endeavor). All rights reserved.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <button
              type="button"
              onClick={() => setIsPrivacyModalOpen(true)}
              className="hover:text-[#6B1D2F] underline underline-offset-2 transition-colors py-1"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={navigateToAdmin}
              className="hover:text-[#6B1D2F] underline underline-offset-2 transition-colors py-1 inline-flex items-center gap-1.5"
            >
              <Lock className="w-3 h-3 text-[#888888]" />
              <span>Staff Portal</span>
            </button>
            <span>Talent Inquiry · Keanu Reeves</span>
          </div>
        </div>
      </footer>

      {/* Privacy Policy Modal */}
      <PrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />
    </div>
  );
};

export default App;
