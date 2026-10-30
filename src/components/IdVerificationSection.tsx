import React, { useRef, useState } from 'react';
import {
  ShieldCheck,
  Upload,
  FileCheck,
  X,
  CreditCard,
  AlertCircle,
  Eye,
  CheckCircle2,
  Lock,
  Sparkles
} from 'lucide-react';
import { COUNTRIES } from '../data/countries';

export interface IdentificationData {
  idType: string;
  idNumber: string;
  idCountry: string;
  idDocumentData: string; // base64
  idFileName: string;
  idFileSize: string;
}

export interface IdentificationErrors {
  idType?: string;
  idNumber?: string;
  idCountry?: string;
  idDocument?: string;
}

interface IdVerificationSectionProps {
  data: IdentificationData;
  onChange: (data: Partial<IdentificationData>) => void;
  errors: IdentificationErrors;
  touched: Record<string, boolean>;
  onBlur: (field: string) => void;
}

export const ID_TYPES = [
  "Driver's License",
  'Passport',
  'National Identity Card',
  'State Issued ID',
  'Military / Government Official ID'
];

export const IdVerificationSection: React.FC<IdVerificationSectionProps> = ({
  data,
  onChange,
  errors,
  touched,
  onBlur
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const handleFile = (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPG, PNG, or WebP).');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please provide an image under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const formattedSize = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      onChange({
        idDocumentData: base64,
        idFileName: file.name,
        idFileSize: formattedSize
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveFile = () => {
    onChange({
      idDocumentData: '',
      idFileName: '',
      idFileSize: ''
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Helper to create a realistic sample ID card for testing without uploading personal data
  const handleGenerateSampleId = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Card background with subtle gradient
    const grad = ctx.createLinearGradient(0, 0, 640, 400);
    grad.addColorStop(0, '#1E293B');
    grad.addColorStop(1, '#0F172A');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 400);

    // Decorative header bar
    ctx.fillStyle = '#6B1D2F';
    ctx.fillRect(0, 0, 640, 50);

    // Top text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText('GOVERNMENT ISSUED IDENTIFICATION CARD', 30, 32);

    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('OFFICIAL IDENTITY SPECIMEN — FOR INTAKE VERIFICATION', 30, 85);

    // Photo placeholder box
    ctx.fillStyle = '#334155';
    ctx.fillRect(40, 110, 140, 175);
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 110, 140, 175);

    // Silhouette icon
    ctx.fillStyle = '#94A3B8';
    ctx.beginPath();
    ctx.arc(110, 175, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(110, 260, 55, Math.PI, 0);
    ctx.fill();

    // ID Details
    ctx.fillStyle = '#CBD5E1';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('DOCUMENT TYPE:', 210, 130);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '15px Inter, sans-serif';
    ctx.fillText(data.idType || "Driver's License", 210, 150);

    ctx.fillStyle = '#CBD5E1';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('IDENTIFICATION NO:', 210, 185);
    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(data.idNumber || 'ID-SPECIMEN-2026', 210, 205);

    ctx.fillStyle = '#CBD5E1';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('ISSUING AUTHORITY:', 210, 240);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(data.idCountry || 'United States', 210, 260);

    // Chip / Hologram simulation
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(520, 120, 70, 50);
    ctx.strokeStyle = '#94A3B8';
    ctx.strokeRect(520, 120, 70, 50);

    // Security watermark footer
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 345, 640, 55);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '11px monospace';
    ctx.fillText('AUTHENTICATED SAMPLE • WME TALENT SECURITY CLEARANCE • CONFIDENTIAL', 30, 377);

    const sampleDataUrl = canvas.toDataURL('image/png');
    onChange({
      idType: data.idType || "Driver's License",
      idNumber: data.idNumber || 'DL-92847291',
      idDocumentData: sampleDataUrl,
      idFileName: 'government_id_specimen.png',
      idFileSize: '184 KB'
    });
  };

  return (
    <div className="space-y-5 w-full min-w-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        {/* ID Document Type */}
        <div className="sm:col-span-1 min-w-0">
          <label htmlFor="idType" className="block text-xs font-mono uppercase tracking-wider text-[#111111] mb-1.5">
            Government ID Type <span className="text-[#888888]">*</span>
          </label>
          <select
            id="idType"
            name="idType"
            value={data.idType}
            onChange={(e) => onChange({ idType: e.target.value })}
            onBlur={() => onBlur('idType')}
            className={`wme-input ${errors.idType && touched.idType ? 'has-error' : ''}`}
            aria-invalid={!!errors.idType && touched.idType}
          >
            <option value="">Select ID document type</option>
            {ID_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {errors.idType && touched.idType && (
            <p className="mt-1.5 text-xs text-[#B91C1C]">
              {errors.idType}
            </p>
          )}
        </div>

        {/* ID Document Number */}
        <div className="sm:col-span-1 min-w-0">
          <label htmlFor="idNumber" className="block text-xs font-mono uppercase tracking-wider text-[#111111] mb-1.5">
            ID Document Number <span className="text-[#888888]">*</span>
          </label>
          <input
            id="idNumber"
            name="idNumber"
            type="text"
            placeholder="e.g. D1234567 or passport number"
            value={data.idNumber}
            onChange={(e) => onChange({ idNumber: e.target.value })}
            onBlur={() => onBlur('idNumber')}
            className={`wme-input ${errors.idNumber && touched.idNumber ? 'has-error' : ''}`}
            aria-invalid={!!errors.idNumber && touched.idNumber}
          />
          {errors.idNumber && touched.idNumber && (
            <p className="mt-1.5 text-xs text-[#B91C1C]">
              {errors.idNumber}
            </p>
          )}
        </div>

        {/* Issuing Country / State */}
        <div className="sm:col-span-2 min-w-0">
          <label htmlFor="idCountry" className="block text-xs font-mono uppercase tracking-wider text-[#111111] mb-1.5">
            Issuing Country / Jurisdiction <span className="text-[#888888]">*</span>
          </label>
          <select
            id="idCountry"
            name="idCountry"
            value={data.idCountry}
            onChange={(e) => onChange({ idCountry: e.target.value })}
            onBlur={() => onBlur('idCountry')}
            className={`wme-input ${errors.idCountry && touched.idCountry ? 'has-error' : ''}`}
            aria-invalid={!!errors.idCountry && touched.idCountry}
          >
            <option value="">Select issuing country</option>
            {COUNTRIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.idCountry && touched.idCountry && (
            <p className="mt-1.5 text-xs text-[#B91C1C]">
              {errors.idCountry}
            </p>
          )}
        </div>
      </div>

      {/* ID Card Document Upload Area */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-1">
          <label className="block text-xs font-mono uppercase tracking-wider text-[#111111]">
            Upload Government-Issued ID Card / Document <span className="text-[#888888]">*</span>
          </label>
          <span className="text-[11px] text-[#737373]">
            JPG, PNG or WebP up to 5MB
          </span>
        </div>

        {data.idDocumentData ? (
          /* Uploaded File Preview Card */
          <div className="border border-[#BBF7D0] bg-[#F0FDF4] p-3.5 sm:p-4 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Thumbnail */}
              <div
                onClick={() => setPreviewModalOpen(true)}
                className="w-14 h-11 bg-white border border-[#86EFAC] rounded-[2px] overflow-hidden shrink-0 cursor-pointer relative group shadow-2xs"
                title="Click to inspect"
              >
                <img
                  src={data.idDocumentData}
                  alt="Government ID Preview"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Eye className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
                  <span className="text-xs font-semibold text-[#166534] truncate">
                    {data.idFileName || 'Government ID Card'}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-[#15803D] flex items-center gap-2 mt-0.5">
                  <span>{data.idFileSize || 'Uploaded'}</span>
                  <span>•</span>
                  <span>Encrypted Intake Ready</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                id="btn-inspect-id"
                onClick={() => setPreviewModalOpen(true)}
                className="btn-outline text-[11px] px-2.5 py-1.5 h-auto min-h-0 text-[#111111] hover:text-[#6B1D2F]"
              >
                <Eye className="w-3 h-3" />
                <span>Inspect</span>
              </button>
              <button
                type="button"
                id="btn-remove-id"
                onClick={handleRemoveFile}
                className="btn-outline text-[11px] px-2.5 py-1.5 h-auto min-h-0 text-[#B91C1C] border-[#B91C1C]/40 hover:bg-[#FEF2F2] hover:border-[#B91C1C]"
              >
                <X className="w-3 h-3" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        ) : (
          /* Drag & Drop Upload Zone */
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed p-6 sm:p-8 rounded-[2px] text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-[#6B1D2F] bg-[#6B1D2F]/5'
                : errors.idDocument && touched.idDocument
                ? 'border-[#B91C1C] bg-[#FEF2F2]'
                : 'border-[#CCCCCC] hover:border-[#888888] bg-[#FAFAFA] hover:bg-[#F5F5F5]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-white border border-[#E5E5E5] flex items-center justify-center shadow-2xs text-[#6B1D2F]">
                <CreditCard className="w-5 h-5" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-[#111111]">
                Drop your photo ID here, or <span className="text-[#6B1D2F] underline underline-offset-2">browse files</span>
              </p>
              <p className="text-[11px] text-[#737373] max-w-sm">
                Driver's license, passport photo page, or national identity card. Ensure photo and text are clearly legible.
              </p>
            </div>
          </div>
        )}

        {errors.idDocument && touched.idDocument && (
          <div className="flex items-center gap-1.5 text-xs text-[#B91C1C]">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errors.idDocument}</span>
          </div>
        )}

        {/* Demo Specimen Helper for smooth testing */}
        {!data.idDocumentData && (
          <div className="pt-1 flex items-center justify-between text-[11px]">
            <span className="text-[#737373]">Testing or evaluating the form?</span>
            <button
              type="button"
              id="btn-sample-id"
              onClick={handleGenerateSampleId}
              className="text-[#6B1D2F] hover:text-[#521624] font-mono text-[11px] underline underline-offset-2 inline-flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-[#6B1D2F]" />
              <span>Use Verified Sample ID Card</span>
            </button>
          </div>
        )}
      </div>

      {/* Security & Confidentiality Box */}
      <div className="p-3 bg-[#FAF9F6] border border-[#E5E5E5] rounded-[2px] text-[11px] text-[#555555] leading-relaxed flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-[#6B1D2F] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#111111] block mb-0.5 font-medium">Talent Security & Accreditation Notice</strong>
          To ensure personal safety for Keanu Reeves and satisfy VIP venue accreditation protocols, all attendees must provide certified government-issued identification prior to consideration. All files are encrypted using AES-256 standard and retained strictly under WME non-disclosure agreements.
        </div>
      </div>

      {/* Preview Modal */}
      {previewModalOpen && data.idDocumentData && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white border border-[#E5E5E5] rounded-[2px] max-w-xl w-full p-4 sm:p-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E5E5E5]">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#6B1D2F]" />
                <span className="text-xs font-mono uppercase tracking-wider text-[#111111] font-semibold">
                  Government ID Document Inspection
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="text-[#888888] hover:text-[#111111] p-1"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto rounded-[2px] bg-[#111111] flex items-center justify-center p-2">
              <img
                src={data.idDocumentData}
                alt="Government ID Full Document"
                className="max-h-[60vh] max-w-full object-contain"
              />
            </div>

            <div className="mt-3 pt-3 border-t border-[#F0F0F0] flex items-center justify-between text-[11px] font-mono text-[#666666]">
              <span>{data.idType || 'ID Document'} — {data.idNumber || 'No ID Number'}</span>
              <button
                type="button"
                id="btn-close-id-preview"
                onClick={() => setPreviewModalOpen(false)}
                className="btn-primary text-xs py-1.5 px-4 h-auto min-h-0"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
