import React, { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { COUNTRIES } from './data/countries';
import { PrivacyModal } from './components/PrivacyModal';
import { ConfirmationView, SubmissionResult } from './components/ConfirmationView';

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
  celebrityName: '',
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
          return "Celebrity name is required.";
        }
        if (value.trim().length < 2) {
          return "Celebrity name must be at least 2 characters.";
        }
        return undefined;

      case 'meetingType':
        if (!value || !['In-person', 'Virtual', 'No preference'].includes(value)) {
          return 'Please select a preferred meeting type.';
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
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
    setTouched({});
    setSubmissionResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111111] font-sans antialiased flex flex-col justify-between">
      {/* Restrained WME Header */}
      <header className="border-b border-[#E5E5E5] bg-[#FFFFFF]">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-5 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="wme-wordmark text-2xl text-[#000000]">
              WME
            </span>
            <span className="text-xs font-mono tracking-wider uppercase text-[#737373] hidden sm:inline">
              / William Morris Endeavor
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono tracking-widest text-[#737373] uppercase">
            <span>Meet &amp; Greet Request</span>
            <span className="text-[#E5E5E5]">•</span>
            <span className="hidden sm:inline">Intake Protocol</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 sm:px-8 py-12 sm:py-16 w-full flex-1">
        {submissionResult ? (
          <div className="max-w-2xl mx-auto">
            <ConfirmationView data={submissionResult} onReset={handleResetForm} />
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-start">
            {/* Left Column: WME Agency Context & Guidelines */}
            <aside className="lg:col-span-5 mb-12 lg:mb-0 lg:sticky lg:top-8 space-y-8">
              <div>
                <span className="inline-block text-[11px] font-mono tracking-[0.2em] uppercase text-[#737373] mb-3">
                  WME Client Relations
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] font-serif font-normal text-[#111111] leading-[1.12] tracking-tight">
                  Meet &amp; Greet Request
                </h1>
                <p className="mt-4 text-sm sm:text-base text-[#555555] leading-relaxed font-sans">
                  Complete the form below to submit your request for consideration. Please ensure that all required information is accurate before submitting.
                </p>
              </div>

              <div className="w-12 h-[1px] bg-[#E5E5E5]" />

              {/* Agency Consideration Guidelines */}
              <div className="space-y-6 pt-2">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#111111] font-semibold block">
                    01 / Review Protocol
                  </span>
                  <p className="text-xs text-[#666666] leading-relaxed">
                    Requests are reviewed by WME representation and client management teams in accordance with client availability and scheduling commitments.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#111111] font-semibold block">
                    02 / Non-Approval Notice
                  </span>
                  <p className="text-xs text-[#666666] leading-relaxed">
                    Submission of this form conveys interest for evaluation only. It does not constitute approval, confirmation, or guarantee of a meeting or celebrity appearance.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#111111] font-semibold block">
                    03 / Confidentiality
                  </span>
                  <p className="text-xs text-[#666666] leading-relaxed">
                    All contact details and submission records are maintained under strict confidentiality standards by WME.
                  </p>
                </div>
              </div>

              {/* Agency Office Locations */}
              <div className="pt-6 border-t border-[#E5E5E5] text-[11px] font-mono text-[#888888] tracking-wider uppercase">
                Beverly Hills · New York · London · Nashville · Sydney
              </div>
            </aside>

            {/* Right Column: The Form */}
            <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#E5E5E5] p-6 sm:p-10 shadow-sm">
              {errors.general && (
                <div
                  className="mb-8 p-4 bg-[#FEF2F2] border border-[#F87171] text-[#991B1B] text-xs sm:text-sm flex items-start gap-3"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B91C1C]" />
                  <span>{errors.general}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-10">
                {/* Section 01: Personal Information */}
                <div>
                  <div className="flex items-baseline justify-between pb-3 mb-6 border-b border-[#E5E5E5]">
                    <h2 className="text-xs font-mono uppercase tracking-[0.16em] text-[#111111] font-semibold">
                      Section 01 — Personal Information
                    </h2>
                    <span className="text-[10px] font-mono text-[#888888]">[ 01 / 03 ]</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
                    {/* Full Name */}
                    <div className="sm:col-span-2">
                      <label htmlFor="fullName" className="block text-xs font-mono uppercase tracking-wider text-[#111111] mb-1.5">
                        Full Name <span className="text-[#888888]">*</span>
                      </label>
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        required
                        autoComplete="name"
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
                    <div className="sm:col-span-1">
                      <label htmlFor="email" className="block text-xs font-mono uppercase tracking-wider text-[#111111] mb-1.5">
                        Email Address <span className="text-[#888888]">*</span>
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
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

                    {/* Phone Number with Country Code */}
                    <div className="sm:col-span-1">
                      <label htmlFor="phone" className="block text-xs font-mono uppercase tracking-wider text-[#111111] mb-1.5">
                        Phone Number <span className="text-[#888888]">*</span>
                      </label>
                      <div
                        className={`flex items-stretch border bg-white transition-all ${
                          errors.phone && touched.phone
                            ? 'border-[#B91C1C] bg-[#FEF2F2]'
                            : 'border-[#E5E5E5] hover:border-[#A3A3A3] focus-within:border-[#000000] focus-within:ring-1 focus-within:ring-[#000000]'
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
                          placeholder="(212) 555-0192"
                          value={formData.phone}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          onBlur={() => handleBlur('phone')}
                          className="w-full bg-transparent border-0 px-3.5 py-3 text-[0.9375rem] text-[#111111] placeholder:text-[#888888] focus:outline-none focus:ring-0 font-sans"
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
                    <div className="sm:col-span-1">
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
                    <div className="sm:col-span-1">
                      <label htmlFor="city" className="block text-xs font-mono uppercase tracking-wider text-[#111111] mb-1.5">
                        City <span className="text-[#888888]">*</span>
                      </label>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        required
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
                <div>
                  <div className="flex items-baseline justify-between pb-3 mb-6 border-b border-[#E5E5E5]">
                    <h2 className="text-xs font-mono uppercase tracking-[0.16em] text-[#111111] font-semibold">
                      Section 02 — Meet &amp; Greet Preferences
                    </h2>
                    <span className="text-[10px] font-mono text-[#888888]">[ 02 / 03 ]</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
                    {/* Celebrity Name */}
                    <div className="sm:col-span-2">
                      <label htmlFor="celebrityName" className="block text-xs font-mono uppercase tracking-wider text-[#111111] mb-1.5">
                        Celebrity Name <span className="text-[#888888]">*</span>
                      </label>
                      <input
                        id="celebrityName"
                        name="celebrityName"
                        type="text"
                        required
                        placeholder="Artist, author, actor, or public figure"
                        value={formData.celebrityName}
                        onChange={(e) => handleChange('celebrityName', e.target.value)}
                        onBlur={() => handleBlur('celebrityName')}
                        className={`wme-input ${errors.celebrityName && touched.celebrityName ? 'has-error' : ''}`}
                        aria-invalid={!!errors.celebrityName && touched.celebrityName}
                        aria-describedby={errors.celebrityName ? 'celebrityName-error' : undefined}
                      />
                      {errors.celebrityName && touched.celebrityName && (
                        <p id="celebrityName-error" className="mt-1.5 text-xs text-[#B91C1C]">
                          {errors.celebrityName}
                        </p>
                      )}
                    </div>

                    {/* Preferred Meeting Type */}
                    <div className="sm:col-span-1">
                      <label htmlFor="meetingType" className="block text-xs font-mono uppercase tracking-wider text-[#111111] mb-1.5">
                        Preferred Meeting Type <span className="text-[#888888]">*</span>
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
                        <option value="">Select meeting type</option>
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
                    <div className="sm:col-span-1">
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
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
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

                    {/* Why Would You Like to Meet This Celebrity? */}
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="reason" className="block text-xs font-mono uppercase tracking-wider text-[#111111]">
                          Why Would You Like to Meet This Celebrity? <span className="text-[#737373] font-normal lowercase">(optional)</span>
                        </label>
                        <span className="text-[11px] font-mono text-[#737373]">{formData.reason.length} / 1000</span>
                      </div>
                      <textarea
                        id="reason"
                        name="reason"
                        rows={3}
                        maxLength={1000}
                        placeholder="Please share what inspires this request or the significance of the artist's work to you..."
                        value={formData.reason}
                        onChange={(e) => handleChange('reason', e.target.value)}
                        className="wme-input resize-y"
                      />
                    </div>

                    {/* Additional Message */}
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="message" className="block text-xs font-mono uppercase tracking-wider text-[#111111]">
                          Additional Message <span className="text-[#737373] font-normal lowercase">(optional)</span>
                        </label>
                        <span className="text-[11px] font-mono text-[#737373]">{formData.message.length} / 1000</span>
                      </div>
                      <textarea
                        id="message"
                        name="message"
                        rows={2}
                        maxLength={1000}
                        placeholder="Any relevant logistical notes, preferred geographic region, or accessibility considerations..."
                        value={formData.message}
                        onChange={(e) => handleChange('message', e.target.value)}
                        className="wme-input resize-y"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 03: Confirmation */}
                <div>
                  <div className="flex items-baseline justify-between pb-3 mb-6 border-b border-[#E5E5E5]">
                    <h2 className="text-xs font-mono uppercase tracking-[0.16em] text-[#111111] font-semibold">
                      Section 03 — Confirmation
                    </h2>
                    <span className="text-[10px] font-mono text-[#888888]">[ 03 / 03 ]</span>
                  </div>

                  <div className="space-y-4">
                    {/* Checkbox 1: Accurate Information */}
                    <div>
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          id="confirmedAccurate"
                          checked={formData.confirmedAccurate}
                          onChange={(e) => handleChange('confirmedAccurate', e.target.checked)}
                          onBlur={() => handleBlur('confirmedAccurate')}
                          className={`wme-checkbox ${errors.confirmedAccurate && touched.confirmedAccurate ? 'has-error' : ''}`}
                          aria-invalid={!!errors.confirmedAccurate && touched.confirmedAccurate}
                        />
                        <span className="text-xs sm:text-sm text-[#333333] group-hover:text-[#000000] transition-colors leading-normal select-none">
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
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          id="acknowledgedPrivacy"
                          checked={formData.acknowledgedPrivacy}
                          onChange={(e) => handleChange('acknowledgedPrivacy', e.target.checked)}
                          onBlur={() => handleBlur('acknowledgedPrivacy')}
                          className={`wme-checkbox ${errors.acknowledgedPrivacy && touched.acknowledgedPrivacy ? 'has-error' : ''}`}
                          aria-invalid={!!errors.acknowledgedPrivacy && touched.acknowledgedPrivacy}
                        />
                        <span className="text-xs sm:text-sm text-[#333333] group-hover:text-[#000000] transition-colors leading-normal select-none">
                          I acknowledge and agree to the{' '}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setIsPrivacyModalOpen(true);
                            }}
                            className="underline underline-offset-4 decoration-[#888888] hover:decoration-[#000000] font-medium text-[#000000]"
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
                      Notice: Submitting this form expresses fan interest for consideration only and does not guarantee a meeting, booking, or celebrity appearance. All inquiries are subject to review by WME and talent representation.
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
                    WME Official Intake Portal — Encrypted Transmission
                  </p>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Restrained WME Footer */}
      <footer className="border-t border-[#E5E5E5] bg-[#FFFFFF] py-8 text-xs text-[#737373]">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px]">
          <div>
            &copy; {new Date().getFullYear()} WME (William Morris Endeavor). All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setIsPrivacyModalOpen(true)}
              className="hover:text-[#000000] underline underline-offset-2 transition-colors"
            >
              Privacy Policy
            </button>
            <span>Confidential Intake Protocol</span>
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
