/**
 * WME VIP Meet & Greet Access Card - Interactive Script
 * Passholder: Brenda Wright | Talent: Keanu Reeves
 */

document.addEventListener('DOMContentLoaded', () => {
  const card = document.getElementById('cardContainer');
  const flipBtn = document.getElementById('flipBtn');
  const printBtn = document.getElementById('printBtn');
  const inspectIdBtn = document.getElementById('inspectIdBtn');
  const exportBtn = document.getElementById('exportBtn');
  const idModal = document.getElementById('idModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const hologram = document.getElementById('hologramOverlay');

  let isFlipped = false;

  // Toggle Flip
  function toggleFlip() {
    isFlipped = !isFlipped;
    card.classList.toggle('is-flipped', isFlipped);
  }

  flipBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFlip();
  });

  card?.addEventListener('click', (e) => {
    // Avoid flipping if user clicks a link or interactive element inside
    if (e.target.closest('a') || e.target.closest('button')) return;
    toggleFlip();
  });

  // Keyboard accessibility (Space or Enter flips card)
  window.addEventListener('keydown', (e) => {
    const isModalOpen = idModal?.classList.contains('is-active') || document.getElementById('authModal')?.classList.contains('is-active');
    if ((e.code === 'Space' || e.key === ' ') && !isModalOpen) {
      if (e.target === document.body || e.target === card) {
        e.preventDefault();
        toggleFlip();
      }
    } else if (e.key === 'Escape') {
      if (idModal?.classList.contains('is-active')) closeModal();
      const authM = document.getElementById('authModal');
      if (authM?.classList.contains('is-active')) authM.classList.remove('is-active');
    }
  });

  // 3D Parallax Tilt Effect on Hover
  let bounds;
  function updateBounds() {
    if (card) bounds = card.getBoundingClientRect();
  }
  updateBounds();
  window.addEventListener('resize', updateBounds);
  window.addEventListener('scroll', updateBounds);

  card?.addEventListener('mouseenter', updateBounds);

  card?.addEventListener('mousemove', (e) => {
    if (!bounds) return;
    const mouseX = e.clientX - bounds.left;
    const mouseY = e.clientY - bounds.top;
    const xPct = mouseX / bounds.width;
    const yPct = mouseY / bounds.height;

    const tiltX = (0.5 - yPct) * 16; // -8deg to +8deg
    const tiltY = (xPct - 0.5) * 16; // -8deg to +8deg

    // If flipped, invert Y tilt
    const baseRotationY = isFlipped ? 180 : 0;
    const currentRotY = baseRotationY + (isFlipped ? -tiltY : tiltY);

    card.style.transform = `perspective(1400px) rotateX(${tiltX}deg) rotateY(${currentRotY}deg) scale3d(1.02, 1.02, 1.02)`;

    if (hologram) {
      const holoX = xPct * 100;
      const holoY = yPct * 100;
      hologram.style.background = `radial-gradient(circle at ${holoX}% ${holoY}%, rgba(255, 230, 150, 0.22) 0%, rgba(255, 90, 160, 0.12) 35%, rgba(90, 200, 255, 0.12) 60%, transparent 80%)`;
    }
  });

  card?.addEventListener('mouseleave', () => {
    const baseRotationY = isFlipped ? 180 : 0;
    card.style.transform = `perspective(1400px) rotateX(0deg) rotateY(${baseRotationY}deg) scale3d(1, 1, 1)`;
    if (hologram) {
      hologram.style.background = '';
    }
  });

  // Print Badge
  printBtn?.addEventListener('click', () => {
    window.print();
  });

  // Reliable File Downloader (Direct Blob / In-Memory Stream)
  function downloadBlob(blob, filename) {
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 250);
  }

  function downloadBase64(base64Data, filename, mimeType = 'application/octet-stream') {
    try {
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      downloadBlob(blob, filename);
    } catch (err) {
      console.warn('Base64 decode fallback:', err);
      // Fallback data-url download WITHOUT target="_blank"
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = `data:${mimeType};base64,${base64Data}`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 250);
    }
  }

  function triggerDownload(key, fallbackUrl, filename, mimeType = 'application/octet-stream') {
    // 1. If pre-bundled offline data is present (works 100% on file://, no CORS, no new tab)
    if (window.PASS_DOWNLOADS && window.PASS_DOWNLOADS[key]) {
      downloadBase64(window.PASS_DOWNLOADS[key], filename, mimeType);
      return;
    }

    // 2. If running under HTTP server, try fetch
    fetch(fallbackUrl)
      .then(res => {
        if (!res.ok) throw new Error('Network error: ' + res.status);
        return res.blob();
      })
      .then(blob => {
        downloadBlob(blob, filename);
      })
      .catch(() => {
        // Direct download link WITHOUT target="_blank"
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = fallbackUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => document.body.removeChild(a), 250);
      });
  }

  // Download Front PNG
  const downloadFrontBtn = document.getElementById('downloadFrontBtn');
  downloadFrontBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    triggerDownload('frontPng', 'brenda-wright-vip-pass-front.png', 'Brenda-Wright-VIP-Pass-Front.png', 'image/png');
  });

  // Download Back PNG
  const downloadBackBtn = document.getElementById('downloadBackBtn');
  downloadBackBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    triggerDownload('backPng', 'brenda-wright-vip-pass-back.png', 'Brenda-Wright-VIP-Pass-Back.png', 'image/png');
  });

  // Download Complete Presentation PNG
  const downloadCompleteBtn = document.getElementById('downloadCompleteBtn');
  downloadCompleteBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    triggerDownload('completePng', 'brenda-wright-vip-pass-complete.png', 'Brenda-Wright-VIP-Pass-Complete.png', 'image/png');
  });

  // Download PDF
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  downloadPdfBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    triggerDownload('pdf', 'brenda-wright-vip-pass.pdf', 'Brenda-Wright-VIP-Meet-Greet-Pass.pdf', 'application/pdf');
  });

  // Toggle Photo Style (VIP Portrait Photo vs Security Emblem)
  const photoToggleBtn = document.getElementById('photoToggleBtn');
  const passholderPhoto = document.getElementById('passholderPhoto');
  const photoVerifiedBadge = document.getElementById('photoVerifiedBadge');
  let isAvatarMode = false;

  photoToggleBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    isAvatarMode = !isAvatarMode;
    if (isAvatarMode) {
      passholderPhoto.src = 'assets/brenda_badge_avatar.png';
      if (photoVerifiedBadge) photoVerifiedBadge.textContent = 'SECURITY EMBLEM';
    } else {
      passholderPhoto.src = 'assets/brenda_badge_photo.png';
      if (photoVerifiedBadge) photoVerifiedBadge.textContent = 'VIP PHOTO VERIFIED';
    }
  });

  // Modal: Inspect Florida Driver's License
  function openModal() {
    if (idModal) idModal.classList.add('is-active');
  }

  function closeModal() {
    if (idModal) idModal.classList.remove('is-active');
  }

  inspectIdBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    openModal();
  });

  modalCloseBtn?.addEventListener('click', closeModal);

  idModal?.addEventListener('click', (e) => {
    if (e.target === idModal) closeModal();
  });

  // Download Manifest JSON
  exportBtn?.addEventListener('click', () => {
    fetch('pass-data.json')
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'WME-KR26-0813-VIP-Brenda-Wright.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch(() => {
        alert('Could not download manifest directly. The pass-data.json file is available in the directory.');
      });
  });

  /* ==========================================================================
     OATH PIN Activation & Card Authentication Flow
     ========================================================================== */
  const authModal = document.getElementById('authModal');
  const activateCardBtn = document.getElementById('activateCardBtn');
  const activateBtnLabel = document.getElementById('activateBtnLabel');
  const activationPinPanel = document.getElementById('activationPinPanel');
  const panelActivateBtn = document.getElementById('panelActivateBtn');
  const authModalCloseBtn = document.getElementById('authModalCloseBtn');
  const cardPinInput = document.getElementById('cardPinInput');
  const quickFillPinBtn = document.getElementById('quickFillPinBtn');
  const submitPinAuthBtn = document.getElementById('submitPinAuthBtn');
  const authErrorMessage = document.getElementById('authErrorMessage');
  const authInputSection = document.getElementById('authInputSection');
  const authSuccessSection = document.getElementById('authSuccessSection');
  const modalStatusBadge = document.getElementById('modalStatusBadge');
  const pinStatusPill = document.getElementById('pinStatusPill');
  const doneActivationBtn = document.getElementById('doneActivationBtn');
  const resetActivationBtn = document.getElementById('resetActivationBtn');
  const clearanceChip = document.getElementById('clearanceChip');

  const STORAGE_KEY = 'wme_kr26_card_activated';

  function openAuthModal() {
    if (authModal) authModal.classList.add('is-active');
    if (cardPinInput && !isActivated()) {
      setTimeout(() => cardPinInput.focus(), 150);
    }
  }

  function closeAuthModal() {
    if (authModal) authModal.classList.remove('is-active');
    if (authErrorMessage) authErrorMessage.style.display = 'none';
  }

  function isActivated() {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }

  function applyActivationState(activated, clearanceCode = 'OATH-KR26-813-CLEAR') {
    if (activated) {
      if (pinStatusPill) {
        pinStatusPill.textContent = 'OATH ACTIVATED';
        pinStatusPill.className = 'pin-status-pill is-activated';
      }
      if (activateBtnLabel) {
        activateBtnLabel.textContent = 'Pass Activated ✓';
      }
      if (activateCardBtn) {
        activateCardBtn.classList.remove('btn-outline');
        activateCardBtn.classList.add('btn-gold');
      }
      if (modalStatusBadge) {
        modalStatusBadge.innerHTML = '<span class="pin-status-pill is-activated">OATH ACTIVATED &amp; CLEARED</span>';
      }
      if (authInputSection) authInputSection.style.display = 'none';
      if (authSuccessSection) authSuccessSection.style.display = 'block';
      if (clearanceChip) {
        clearanceChip.innerHTML = `CLEARANCE: <strong>${clearanceCode}</strong>`;
      }
    } else {
      if (pinStatusPill) {
        pinStatusPill.textContent = 'OATH READY';
        pinStatusPill.className = 'pin-status-pill is-pending';
      }
      if (activateBtnLabel) {
        activateBtnLabel.textContent = 'OATH Activate';
      }
      if (modalStatusBadge) {
        modalStatusBadge.innerHTML = '<span class="pin-status-pill is-pending">PENDING ACTIVATION</span>';
      }
      if (authInputSection) authInputSection.style.display = 'block';
      if (authSuccessSection) authSuccessSection.style.display = 'none';
      if (cardPinInput) cardPinInput.value = '';
    }
  }

  // Initialize activation state on load
  applyActivationState(isActivated());

  // Check server status if running via HTTP
  if (window.location.protocol.startsWith('http')) {
    fetch('/api/card/status/WME-KR26-0813-VIP')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.activated) {
          localStorage.setItem(STORAGE_KEY, 'true');
          applyActivationState(true, data.activation?.clearanceCode);
        }
      })
      .catch(() => {});
  }

  activateCardBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    openAuthModal();
  });

  activationPinPanel?.addEventListener('click', (e) => {
    e.stopPropagation();
    openAuthModal();
  });

  panelActivateBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    openAuthModal();
  });

  authModalCloseBtn?.addEventListener('click', closeAuthModal);
  doneActivationBtn?.addEventListener('click', closeAuthModal);

  authModal?.addEventListener('click', (e) => {
    if (e.target === authModal) closeAuthModal();
  });

  quickFillPinBtn?.addEventListener('click', () => {
    if (cardPinInput) {
      cardPinInput.value = '813-026';
      cardPinInput.focus();
    }
    if (authErrorMessage) authErrorMessage.style.display = 'none';
  });

  cardPinInput?.addEventListener('input', (e) => {
    let val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length > 6) val = val.slice(0, 6);
    if (val.length > 3) {
      val = `${val.slice(0, 3)}-${val.slice(3)}`;
    }
    e.target.value = val;
    if (authErrorMessage) authErrorMessage.style.display = 'none';
  });

  submitPinAuthBtn?.addEventListener('click', () => {
    const rawVal = cardPinInput?.value || '';
    const cleanDigits = rawVal.replace(/[^0-9]/g, '');

    if (cleanDigits !== '813026') {
      if (authErrorMessage) {
        authErrorMessage.textContent = 'Invalid OATH PIN. Please enter the valid 6-digit PIN on this credential (813-026).';
        authErrorMessage.style.display = 'block';
      }
      return;
    }

    // PIN is valid! Trigger activation
    const clearance = `OATH-KR26-813-CLEAR-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    localStorage.setItem(STORAGE_KEY, 'true');
    applyActivationState(true, clearance);

    // Sync with backend if available
    fetch('/api/card/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: 'WME-KR26-0813-VIP', pin: '813-026' })
    }).catch(() => {});
  });

  resetActivationBtn?.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    applyActivationState(false);
    fetch('/api/card/deactivate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: 'WME-KR26-0813-VIP' })
    }).catch(() => {});
  });
});
