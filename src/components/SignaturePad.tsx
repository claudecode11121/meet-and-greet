import React, { useRef, useState, useEffect, useCallback } from 'react';
import { PenTool, Type, RotateCcw, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

export interface SignatureData {
  signatureType: 'drawn' | 'typed';
  signatureData: string; // base64 PNG data URL
  signeeName: string;
  signedAt: string;
}

interface SignaturePadProps {
  fullName: string;
  value: SignatureData;
  onChange: (data: SignatureData) => void;
  error?: string;
  touched?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  fullName,
  value,
  onChange,
  error,
  touched
}) => {
  const [activeTab, setActiveTab] = useState<'drawn' | 'typed'>(value.signatureType || 'drawn');
  const [signeeName, setSigneeName] = useState(value.signeeName || fullName || '');
  const [isManuallyEdited, setIsManuallyEdited] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(Boolean(value.signatureType === 'drawn' && value.signatureData));
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Generate image data URL from typed text
  const generateTypedSignatureData = useCallback((nameText: string): string => {
    if (!nameText || !nameText.trim()) return '';
    try {
      const offscreen = document.createElement('canvas');
      offscreen.width = 600;
      offscreen.height = 180;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return '';

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, offscreen.width, offscreen.height);

      // Baseline guideline
      ctx.strokeStyle = '#E5E5E5';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, 130);
      ctx.lineTo(560, 130);
      ctx.stroke();

      // Cursive text
      ctx.fillStyle = '#111111';
      ctx.font = '64px Caveat, "Brush Script MT", cursive, sans-serif';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(nameText.trim(), 50, 115);

      return offscreen.toDataURL('image/png');
    } catch {
      return '';
    }
  }, []);

  // Keep signeeName synced with fullName if not manually edited
  useEffect(() => {
    if (!isManuallyEdited && fullName) {
      setSigneeName(fullName);
      if (activeTab === 'typed' && fullName.trim().length >= 2) {
        const dataUrl = generateTypedSignatureData(fullName.trim());
        onChange({
          signatureType: 'typed',
          signatureData: dataUrl,
          signeeName: fullName.trim(),
          signedAt: value.signedAt || new Date().toISOString()
        });
      }
    }
  }, [fullName, isManuallyEdited, activeTab, generateTypedSignatureData, onChange, value.signedAt]);

  // Initialize canvas
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 2.4;

    // Restore previous drawn signature if any
    if (value.signatureType === 'drawn' && value.signatureData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasDrawn(true);
      };
      img.src = value.signatureData;
    }
  }, [value.signatureType, value.signatureData]);

  useEffect(() => {
    if (activeTab === 'drawn') {
      const timer = setTimeout(setupCanvas, 60);
      window.addEventListener('resize', setupCanvas);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', setupCanvas);
      };
    }
  }, [activeTab, setupCanvas]);

  const getCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDraw = (clientX: number, clientY: number) => {
    isDrawingRef.current = true;
    const coords = getCoords(clientX, clientY);
    lastPosRef.current = coords;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.arc(coords.x, coords.y, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = '#111111';
    ctx.fill();
    setHasDrawn(true);
  };

  const moveDraw = (clientX: number, clientY: number) => {
    if (!isDrawingRef.current) return;
    const coords = getCoords(clientX, clientY);
    const lastPos = lastPosRef.current;
    if (!lastPos) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    lastPosRef.current = coords;
  };

  const endDraw = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPosRef.current = null;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const nameText = (signeeName || fullName).trim();
    onChange({
      signatureType: 'drawn',
      signatureData: dataUrl,
      signeeName: nameText,
      signedAt: new Date().toISOString()
    });
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);

    onChange({
      signatureType: 'drawn',
      signatureData: '',
      signeeName: signeeName.trim() || fullName.trim(),
      signedAt: ''
    });
  };

  const handleTabChange = (mode: 'drawn' | 'typed') => {
    setActiveTab(mode);
    if (mode === 'typed') {
      const nameText = (signeeName.trim().length >= 2 ? signeeName : fullName).trim();
      setSigneeName(nameText);
      const dataUrl = generateTypedSignatureData(nameText);
      onChange({
        signatureType: 'typed',
        signatureData: dataUrl,
        signeeName: nameText,
        signedAt: new Date().toISOString()
      });
    } else {
      setHasDrawn(false);
      onChange({
        signatureType: 'drawn',
        signatureData: '',
        signeeName: signeeName.trim() || fullName.trim(),
        signedAt: ''
      });
    }
  };

  const handleTypedNameChange = (val: string) => {
    setIsManuallyEdited(true);
    setSigneeName(val);
    const trimmed = val.trim();
    if (trimmed.length >= 2) {
      const dataUrl = generateTypedSignatureData(trimmed);
      onChange({
        signatureType: 'typed',
        signatureData: dataUrl,
        signeeName: trimmed,
        signedAt: new Date().toISOString()
      });
    } else {
      onChange({
        signatureType: 'typed',
        signatureData: '',
        signeeName: trimmed,
        signedAt: ''
      });
    }
  };

  const isComplete = Boolean(value.signatureData && value.signatureData.length > 50);

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* Tab Switcher & Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-1 p-1 bg-[#F5F5F5] border border-[#E5E5E5] rounded-[2px]">
          <button
            type="button"
            id="tab-draw-signature"
            onClick={() => handleTabChange('drawn')}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 rounded-[2px] ${
              activeTab === 'drawn'
                ? 'bg-white text-[#111111] font-semibold shadow-2xs border border-[#DDDDDD]'
                : 'text-[#666666] hover:text-[#111111]'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Draw Signature</span>
          </button>

          <button
            type="button"
            id="tab-type-signature"
            onClick={() => handleTabChange('typed')}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 rounded-[2px] ${
              activeTab === 'typed'
                ? 'bg-white text-[#111111] font-semibold shadow-2xs border border-[#DDDDDD]'
                : 'text-[#666666] hover:text-[#111111]'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Type Signature</span>
          </button>
        </div>

        {/* Completion status pill */}
        <div className="flex items-center gap-2">
          {isComplete ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#15803D] bg-[#F0FDF4] px-2.5 py-1 border border-[#BBF7D0] rounded-[2px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>Signature Affixed</span>
            </span>
          ) : (
            <span className="text-[11px] font-mono text-[#888888]">
              Awaiting signature
            </span>
          )}
        </div>
      </div>

      {/* DRAWN SIGNATURE CANVAS */}
      {activeTab === 'drawn' && (
        <div className="space-y-2">
          <div
            className={`relative w-full h-44 sm:h-48 bg-white border rounded-[2px] overflow-hidden transition-all touch-none select-none ${
              error && touched
                ? 'border-[#B91C1C] ring-1 ring-[#B91C1C]'
                : 'border-[#CCCCCC] hover:border-[#999999] focus-within:border-[#111111]'
            }`}
          >
            <canvas
              ref={canvasRef}
              onMouseDown={(e) => { e.preventDefault(); startDraw(e.clientX, e.clientY); }}
              onMouseMove={(e) => { e.preventDefault(); moveDraw(e.clientX, e.clientY); }}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={(e) => {
                if (e.touches[0]) {
                  e.preventDefault();
                  startDraw(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onTouchMove={(e) => {
                if (e.touches[0]) {
                  e.preventDefault();
                  moveDraw(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onTouchEnd={endDraw}
              className="w-full h-full cursor-crosshair block"
              style={{ touchAction: 'none' }}
              aria-label="Draw your digital signature with mouse or touch"
            />

            {/* Baseline guideline */}
            <div className="absolute left-6 right-6 bottom-10 border-b border-dashed border-[#D4D4D8] pointer-events-none flex items-center justify-between">
              <span className="text-[12px] font-mono text-[#999999] -mb-5 select-none">
                ✕ sign above line
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] -mb-5 select-none">
                Digital Signature Pad
              </span>
            </div>

            {/* Prompt when empty */}
            {!hasDrawn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs font-mono text-[#A3A3A3]">
                Draw your legal signature using your mouse, trackpad, or finger
              </div>
            )}

            {/* Clear Button */}
            {hasDrawn && (
              <button
                type="button"
                onClick={clearCanvas}
                className="absolute top-2.5 right-2.5 bg-white/90 hover:bg-white border border-[#E5E5E5] hover:border-[#111111] text-[#666666] hover:text-[#111111] px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider flex items-center gap-1 rounded-[2px] shadow-2xs transition-all"
                title="Clear and re-sign"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* TYPED SIGNATURE */}
      {activeTab === 'typed' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="signeeNameInput" className="block text-xs font-mono uppercase tracking-wider text-[#111111] mb-1.5">
                Type Legal Name to Generate Signature <span className="text-[#888888]">*</span>
              </label>
              <input
                id="signeeNameInput"
                type="text"
                placeholder="e.g. Eleanor Vance"
                value={signeeName}
                onChange={(e) => handleTypedNameChange(e.target.value)}
                className="wme-input"
              />
            </div>
          </div>

          {/* Styled Cursive Signature Display */}
          <div className="p-5 bg-white border border-[#CCCCCC] rounded-[2px] relative overflow-hidden">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#737373]">
                Generated Digital Signature Representation
              </span>
              <span className="text-[10px] font-mono text-[#6B1D2F]">
                WME Secure E-Sign
              </span>
            </div>

            <div className="min-h-[80px] flex items-center justify-center py-4 border-b border-dashed border-[#D4D4D8]">
              {signeeName.trim() ? (
                <span className="font-signature text-4xl sm:text-5xl text-[#111111] tracking-wide select-none">
                  {signeeName.trim()}
                </span>
              ) : (
                <span className="text-xs font-mono text-[#A3A3A3] italic">
                  Enter your legal name above to preview cursive signature
                </span>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 text-[10px] font-mono text-[#737373]">
              <span>✕ Authorized Legal Signee</span>
              <span>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && touched && (
        <div className="flex items-center gap-1.5 text-xs text-[#B91C1C]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Legal Declaration Box */}
      <div className="p-3 bg-[#FAF9F6] border border-[#E5E5E5] rounded-[2px] text-[11px] text-[#555555] leading-relaxed flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-[#6B1D2F] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#111111] block mb-0.5 font-medium">Digital Signature & Identity Declaration</strong>
          By affixing your signature (drawn or typed), you certify under penalty of false representation that you are the applicant named above, that the government-issued identification provided is genuine and valid, and that all statements are true and accurate.
        </div>
      </div>
    </div>
  );
};
