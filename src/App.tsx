import React, { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-[#F7F6F2] text-[#191919] font-sans antialiased flex flex-col justify-between">
      {/* Restrained Editorial Header */}
      <header className="border-b border-[#DAD8D1] bg-[#F7F6F2]">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-5 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-lg tracking-wide text-[#191919] font-normal">
              Atelier
            </span>
            <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-[#77736D] hidden sm:inline">
              / Guest Relations
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono tracking-widest text-[#77736D] uppercase">
            <span>Private Event Enquiry</span>
            <span className="text-[#DAD8D1]">•</span>
            <span className="hidden sm:inline">Protocol 2026</span>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="max-w-6xl mx-auto px-6 sm:px-8 py-12 sm:py-16 w-full flex-1">
        {submissionResult ? (
          <div className="max-w-2xl mx-auto">
            <ConfirmationView data={submissionResult} onReset={handleResetForm} />
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-start">
            {/* Left Column: Context, Narrative & Editorial Protocol */}
            <aside className="lg:col-span-5 mb-12 lg:mb-0 lg:sticky lg:top-8 space-y-8">
              <div>
                <span className="inline-block text-[10px] tracking-[0.25em] font-mono uppercase text-[#806746] mb-3">
                  [ Private Inquiry ]
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-[2.65rem] font-serif font-normal text-[#191919] leading-[1.15] tracking-tight">
                  An Opportunity to Connect.
                </h1>
                <p className="mt-4 text-sm sm:text-base text-[#55524D] leading-relaxed font-sans">
                  Complete the form below to express your interest in a personal meet-and-greet experience. Please provide accurate information so your request can be reviewed.
                </p>
              </div>

              <div className="w-12 h-[1px] bg-[#DAD8D1]" />

              {/* Editorial Protocol Guidelines */}
              <div className="space-y-6 pt-2">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#806746] block">
                    01 / Evaluation
                  </span>
                  <p className="text-xs text-[#6B6760] leading-relaxed">
                    Submissions are assessed individually based on talent availability, logistical feasibility, and touring schedules.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#806746] block">
                    02 / Non-Guaranteed
                  </span>
                  <p className="text-xs text-[#6B6760] leading-relaxed">
                    This inquiry records your expression of interest. It does not constitute a booking commitment, ticket purchase, or guarantee of appearance.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#806746] block">
                    03 / Discretion &amp; Privacy
                  </span>
                  <p className="text-xs text-[#6B6760] leading-relaxed">
                    All participant records are handled with strict confidentiality by authorized guest relations representatives.
                  </p>
                </div>
              </div>

              {/* Discrete Location Marker */}
              <div className="pt-6 border-t border-[#DAD8D1] text-[11px] font-mono text-[#8C8880] tracking-wider uppercase">
                New York · London · Paris · Los Angeles
              </div>
            </aside>

            {/* Right Column: The Form */}
            <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#DAD8D1] p-6 sm:p-10 shadow-sm">
              {errors.general && (
                <div
                  className="mb-8 p-4 bg-[#FDF2F2] border border-[#F87171] text-[#991B1B] text-xs sm:text-sm flex items-start gap-3"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B91C1C]" />
                  <span>{errors.general}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-10">
                {/* Section 01: Personal Information */}
                <div>
                  <div className="flex items-baseline justify-between pb-3 mb-6 border-b border-[#DAD8D1]">
                    <h2 className="text-xs font-mono uppercase tracking-[0.18em] text-[#191919] font-medium">
                      Section 01 — Personal Information
                    </h2>
                    <span className="text-[10px] font-mono text-[#806746]">[ 01 / 03 ]</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
                    {/* Full Name */}
                    <div className="sm:col-span-2">
                      <label htmlFor="fullName" className="block text-xs font-mono uppercase tracking-wider text-[#191919] mb-1.5">
                        Full Name <span className="text-[#806746]">*</span>
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
                        className={`editorial-input ${errors.fullName && touched.fullName ? 'has-error' : ''}`}
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
                      <label htmlFor="email" className="block text-xs font-mono uppercase tracking-wider text-[#191919] mb-1.5">
                        Email Address <span className="text-[#806746]">*</span>
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
                        className={`editorial-input ${errors.email && touched.email ? 'has-error' : ''}`}
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
                      <label htmlFor="phone" className="block text-xs font-mono uppercase tracking-wider text-[#191919] mb-1.5">
                        Phone Number <span className="text-[#806746]">*</span>
                      </label>
                      <div className="flex gap-2">
                        <select
                          aria-label="Country dial code"
                          value={formData.countryCode}
                          onChange={(e) => handleChange('countryCode', e.target.value)}
                          className="editorial-input w-28 shrink-0 text-xs px-2"
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
                          placeholder="212 555 0192"
                          value={formData.phone}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          onBlur={() => handleBlur('phone')}
                          className={`editorial-input flex-1 ${errors.phone && touched.phone ? 'has-error' : ''}`}
                          aria-invalid={!!errors.phone && touched.phone}
                          aria-describedby={errors.phone ? 'phone-error' : undefined}
                        />
                      </div>
                      {errors.phone && touched.phone ? (
                        <p id="phone-error" className="mt-1.5 text-xs text-[#B91C1C]">
                          {errors.phone}
                        </p>
                      ) : (
                        <p className="mt-1 text-[11px] text-[#77736D]">Includes international country code.</p>
                      )}
                    </div>

                    {/* Country of Residence */}
                    <div className="sm:col-span-1">
                      <label htmlFor="country" className="block text-xs font-mono uppercase tracking-wider text-[#191919] mb-1.5">
                        Country of Residence <span className="text-[#806746]">*</span>
                      </label>
                      <select
                        id="country"
                        name="country"
                        required
                        value={formData.country}
                        onChange={(e) => handleChange('country', e.target.value)}
                        onBlur={() => handleBlur('country')}
                        className={`editorial-input ${errors.country && touched.country ? 'has-error' : ''}`}
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
                      <label htmlFor="city" className="block text-xs font-mono uppercase tracking-wider text-[#191919] mb-1.5">
                        City <span className="text-[#806746]">*</span>
                      </label>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        required
                        placeholder="e.g. London, Chicago"
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        onBlur={() => handleBlur('city')}
                        className={`editorial-input ${errors.city && touched.city ? 'has-error' : ''}`}
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
                  <div className="flex items-baseline justify-between pb-3 mb-6 border-b border-[#DAD8D1]">
                    <h2 className="text-xs font-mono uppercase tracking-[0.18em] text-[#191919] font-medium">
                      Section 02 — Meet &amp; Greet Preferences
                    </h2>
                    <span className="text-[10px] font-mono text-[#806746]">[ 02 / 03 ]</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
                    {/* Celebrity Name */}
                    <div className="sm:col-span-2">
                      <label htmlFor="celebrityName" className="block text-xs font-mono uppercase tracking-wider text-[#191919] mb-1.5">
                        Celebrity Name <span className="text-[#806746]">*</span>
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
                        className={`editorial-input ${errors.celebrityName && touched.celebrityName ? 'has-error' : ''}`}
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
                      <label htmlFor="meetingType" className="block text-xs font-mono uppercase tracking-wider text-[#191919] mb-1.5">
                        Preferred Meeting Type <span className="text-[#806746]">*</span>
                      </label>
                      <select
                        id="meetingType"
                        name="meetingType"
                        required
                        value={formData.meetingType}
                        onChange={(e) => handleChange('meetingType', e.target.value)}
                        onBlur={() => handleBlur('meetingType')}
                        className={`editorial-input ${errors.meetingType && touched.meetingType ? 'has-error' : ''}`}
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
                      <label htmlFor="attendees" className="block text-xs font-mono uppercase tracking-wider text-[#191919] mb-1.5">
                        Number of Attendees <span className="text-[#806746]">*</span>
                      </label>
                      <select
                        id="attendees"
                        name="attendees"
                        required
                        value={formData.attendees}
                        onChange={(e) => handleChange('attendees', e.target.value)}
                        onBlur={() => handleBlur('attendees')}
                        className={`editorial-input ${errors.attendees && touched.attendees ? 'has-error' : ''}`}
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
                        <label htmlFor="preferredDate" className="block text-xs font-mono uppercase tracking-wider text-[#191919]">
                          Preferred Date <span className="text-[#77736D] font-normal lowercase">(optional)</span>
                        </label>
                        <span className="text-[11px] text-[#77736D]">Subject to schedule feasibility</span>
                      </div>
                      <input
                        id="preferredDate"
                        name="preferredDate"
                        type="date"
                        min={todayDateString}
                        value={formData.preferredDate}
                        onChange={(e) => handleChange('preferredDate', e.target.value)}
                        className="editorial-input"
                      />
                    </div>

                    {/* Why Would You Like to Meet This Celebrity? */}
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="reason" className="block text-xs font-mono uppercase tracking-wider text-[#191919]">
                          Why Would You Like to Meet This Celebrity? <span className="text-[#77736D] font-normal lowercase">(optional)</span>
                        </label>
                        <span className="text-[11px] font-mono text-[#77736D]">{formData.reason.length} / 1000</span>
                      </div>
                      <textarea
                        id="reason"
                        name="reason"
                        rows={3}
                        maxLength={1000}
                        placeholder="Please share what inspires this request or the significance of the artist's work to you..."
                        value={formData.reason}
                        onChange={(e) => handleChange('reason', e.target.value)}
                        className="editorial-input resize-y"
                      />
                    </div>

                    {/* Additional Message */}
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="message" className="block text-xs font-mono uppercase tracking-wider text-[#191919]">
                          Additional Message <span className="text-[#77736D] font-normal lowercase">(optional)</span>
                        </label>
                        <span className="text-[11px] font-mono text-[#77736D]">{formData.message.length} / 1000</span>
                      </div>
                      <textarea
                        id="message"
                        name="message"
                        rows={2}
                        maxLength={1000}
                        placeholder="Any relevant logistical notes, preferred geographic region, or accessibility considerations..."
                        value={formData.message}
                        onChange={(e) => handleChange('message', e.target.value)}
                        className="editorial-input resize-y"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 03: Confirmation */}
                <div>
                  <div className="flex items-baseline justify-between pb-3 mb-6 border-b border-[#DAD8D1]">
                    <h2 className="text-xs font-mono uppercase tracking-[0.18em] text-[#191919] font-medium">
                      Section 03 — Confirmation
                    </h2>
                    <span className="text-[10px] font-mono text-[#806746]">[ 03 / 03 ]</span>
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
                          className={`editorial-checkbox ${errors.confirmedAccurate && touched.confirmedAccurate ? 'has-error' : ''}`}
                          aria-invalid={!!errors.confirmedAccurate && touched.confirmedAccurate}
                        />
                        <span className="text-xs sm:text-sm text-[#33312E] group-hover:text-[#191919] transition-colors leading-normal select-none">
                          I confirm that the submitted information is accurate and truthful. <span className="text-[#806746]">*</span>
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
                          className={`editorial-checkbox ${errors.acknowledgedPrivacy && touched.acknowledgedPrivacy ? 'has-error' : ''}`}
                          aria-invalid={!!errors.acknowledgedPrivacy && touched.acknowledgedPrivacy}
                        />
                        <span className="text-xs sm:text-sm text-[#33312E] group-hover:text-[#191919] transition-colors leading-normal select-none">
                          I acknowledge and agree to the{' '}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setIsPrivacyModalOpen(true);
                            }}
                            className="underline underline-offset-4 decoration-[#77736D] hover:decoration-[#191919] font-medium text-[#191919]"
                          >
                            Privacy Policy
                          </button>
                          {' '}regarding the confidential processing of my inquiry. <span className="text-[#806746]">*</span>
                        </span>
                      </label>
                      {errors.acknowledgedPrivacy && touched.acknowledgedPrivacy && (
                        <p className="mt-1 ml-7 text-xs text-[#B91C1C]">
                          {errors.acknowledgedPrivacy}
                        </p>
                      )}
                    </div>

                    {/* Clear Notice */}
                    <div className="pt-3 border-t border-[#EAE8E1] text-[11px] text-[#77736D] leading-relaxed">
                      Notice: Submitting this form expresses fan interest only and does not guarantee a meeting, booking, or celebrity appearance. All inquiries are subject to representation review.
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
                  <p className="text-center text-[11px] text-[#77736D] mt-3 font-mono">
                    Official Intake Portal — Encrypted Transmission
                  </p>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Understated Editorial Footer */}
      <footer className="border-t border-[#DAD8D1] bg-[#F7F6F2] py-8 text-xs text-[#77736D]">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px]">
          <div>
            &copy; {new Date().getFullYear()} Atelier Guest Relations. Confidential Intake Protocol.
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setIsPrivacyModalOpen(true)}
              className="hover:text-[#191919] underline underline-offset-2 transition-colors"
            >
              Privacy Policy
            </button>
            <span>All rights reserved.</span>
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
