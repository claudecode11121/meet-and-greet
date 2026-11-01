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
    if ((e.code === 'Space' || e.key === ' ') && !idModal?.classList.contains('is-active')) {
      if (e.target === document.body || e.target === card) {
        e.preventDefault();
        toggleFlip();
      }
    } else if (e.key === 'Escape' && idModal?.classList.contains('is-active')) {
      closeModal();
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

  // Direct File Downloader Helper
  function triggerDownload(url, filename) {
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Network error');
        return res.blob();
      })
      .then(blob => {
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
        }, 100);
      })
      .catch(() => {
        // Fallback for file:// or direct link
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
  }

  // Download Front PNG
  const downloadFrontBtn = document.getElementById('downloadFrontBtn');
  downloadFrontBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    triggerDownload('brenda-wright-vip-pass-front.png', 'Brenda-Wright-VIP-Pass-Front.png');
  });

  // Download Back PNG
  const downloadBackBtn = document.getElementById('downloadBackBtn');
  downloadBackBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    triggerDownload('brenda-wright-vip-pass-back.png', 'Brenda-Wright-VIP-Pass-Back.png');
  });

  // Download PDF
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  downloadPdfBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    triggerDownload('brenda-wright-vip-pass.pdf', 'Brenda-Wright-VIP-Meet-Greet-Pass.pdf');
  });

  // Toggle Photo Style (Driver's License Photo vs Biometric Security Emblem)
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
      if (photoVerifiedBadge) photoVerifiedBadge.textContent = 'FLORIDA DL VERIFIED';
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
});
