/**
 * DevForge Tools - Core Shared UI & Privacy Framework
 * Provides cookie consent governance, toasts, clipboard helpers, drag-and-drop, mobile responsive navigation, and input utilities.
 * 100% Client-side and strictly White/Light mode.
 */

(function(global) {
  'use strict';

  const STORAGE_KEY_CONSENT = 'devforge_cookie_consent';

  // State
  let consentState = null;

  // Enforce white/light mode universally
  function enforceLightMode() {
    try {
      localStorage.removeItem('devforge_theme');
    } catch (e) {}
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.classList.remove('dark');
    }
  }

  // Initialize consent state
  function getCookieConsent() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CONSENT);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveCookieConsent(state) {
    consentState = state;
    try {
      localStorage.setItem(STORAGE_KEY_CONSENT, JSON.stringify(state));
    } catch (e) {}

    if (state.analytics || state.marketing) {
      loadAdSenseScriptsIfApproved();
    }

    // Hide banners and modals
    const banner = document.getElementById('cookie-consent-banner');
    if (banner) banner.style.display = 'none';

    const modal = document.getElementById('cookie-manage-modal');
    if (modal) modal.style.display = 'none';
  }

  // Toast Notification
  function showToast(message, type = 'info', duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bgClass = type === 'error'
      ? 'bg-rose-900/90 text-rose-100 border-rose-700'
      : type === 'success'
      ? 'bg-emerald-900/90 text-emerald-100 border-emerald-700'
      : 'bg-slate-900/90 text-slate-100 border-slate-700';

    toast.className = `flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium shadow-xl backdrop-blur-sm pointer-events-auto transition-all duration-200 transform translate-y-2 opacity-0 ${bgClass}`;
    toast.innerHTML = `
      <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });

    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-2', 'opacity-0');
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  // Copy to clipboard helper
  function copyTextToClipboard(text, successMessage = 'Copied to clipboard!') {
    if (!text) {
      showToast('Nothing to copy', 'info');
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(successMessage, 'success');
      }).catch(() => {
        fallbackCopy(text, successMessage);
      });
    } else {
      fallbackCopy(text, successMessage);
    }
  }

  function fallbackCopy(text, msg) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast(msg, 'success');
    } catch (e) {
      showToast('Failed to copy', 'error');
    }
    document.body.removeChild(ta);
  }

  // File Download helper
  function downloadTextFile(content, fileName = 'devforge-export.txt', mimeType = 'text/plain;charset=utf-8') {
    if (!content) {
      showToast('No content to download', 'info');
      return;
    }
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  // Drag and drop wireup
  function wireDragAndDrop(dropArea, onTextLoaded) {
    if (!dropArea) return;

    ['dragenter', 'dragover'].forEach(eventName => {
      dropArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.add('ring-2', 'ring-cyan-500');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.remove('ring-2', 'ring-cyan-500');
      }, false);
    });

    dropArea.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
          onTextLoaded(event.target.result, file);
        };
        reader.readAsText(file);
      }
    });
  }

  // Mobile Navigation Drawer Management
  function initMobileNav() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    // Check if drawer exists; if not, inject it
    let drawer = document.getElementById('mobile-nav-drawer');
    if (!drawer) {
      drawer = document.createElement('div');
      drawer.id = 'mobile-nav-drawer';
      drawer.className = 'mobile-nav-drawer';

      const currentPath = window.location.pathname;
      const isHome = currentPath === '/' || currentPath === '/index.html' || currentPath.endsWith('index.html');
      const isBlog = currentPath.includes('/blog');
      const isAbout = currentPath.includes('about.html');
      const isContact = currentPath.includes('contact.html');

      drawer.innerHTML = `
        <div class="container mobile-nav-inner">
          <a href="/" class="mobile-nav-link ${isHome ? 'active' : ''}">Home</a>
          <div class="mobile-nav-group-title">Developer Tools</div>
          <div class="mobile-tools-grid">
            <a href="/tools/json-formatter.html" class="mobile-sublink ${currentPath.includes('json-formatter') ? 'active' : ''}">JSON Formatter & Validator</a>
            <a href="/tools/html-minifier.html" class="mobile-sublink ${currentPath.includes('html-minifier') ? 'active' : ''}">HTML Minifier</a>
            <a href="/tools/css-beautifier.html" class="mobile-sublink ${currentPath.includes('css-beautifier') ? 'active' : ''}">CSS Beautifier & Minifier</a>
            <a href="/tools/base64-encoder.html" class="mobile-sublink ${currentPath.includes('base64-encoder') ? 'active' : ''}">Base64 Encoder & Decoder</a>
            <a href="/tools/url-encoder.html" class="mobile-sublink ${currentPath.includes('url-encoder') ? 'active' : ''}">URL Encoder & Decoder</a>
            <a href="/tools/uuid-generator.html" class="mobile-sublink ${currentPath.includes('uuid-generator') ? 'active' : ''}">UUID Generator (v4 & v7)</a>
          </div>
          <div class="mobile-nav-divider"></div>
          <a href="/blog/" class="mobile-nav-link ${isBlog ? 'active' : ''}">Blog</a>
          <a href="/about.html" class="mobile-nav-link ${isAbout ? 'active' : ''}">About</a>
          <a href="/contact.html" class="mobile-nav-link ${isContact ? 'active' : ''}">Contact</a>
        </div>
      `;
      header.appendChild(drawer);
    }

    // Ensure mobile button exists in header-actions if missing
    let btn = document.getElementById('mobile-menu-btn');
    if (!btn) {
      const actions = header.querySelector('.header-actions');
      if (actions) {
        btn = document.createElement('button');
        btn.id = 'mobile-menu-btn';
        btn.className = 'mobile-menu-btn';
        btn.setAttribute('aria-label', 'Toggle navigation menu');
        btn.setAttribute('aria-expanded', 'false');
        btn.onclick = toggleMobileMenu;
        btn.innerHTML = `
          <svg class="hamburger-icon" style="width:20px;height:20px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg class="close-icon" style="width:20px;height:20px;display:none;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        `;
        actions.appendChild(btn);
      }
    } else {
      btn.onclick = toggleMobileMenu;
    }

    // Close when clicking on any link inside the drawer
    drawer.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', closeMobileMenu);
    });

    // Close on click outside the header
    document.addEventListener('click', (e) => {
      if (!header.contains(e.target)) {
        closeMobileMenu();
      }
    });

    // Close on resize to desktop width
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768) {
        closeMobileMenu();
      }
    });
  }

  function toggleMobileMenu() {
    const drawer = document.getElementById('mobile-nav-drawer');
    if (!drawer) return;
    if (drawer.classList.contains('open')) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  }

  function openMobileMenu() {
    const drawer = document.getElementById('mobile-nav-drawer');
    const btn = document.getElementById('mobile-menu-btn');
    if (!drawer) return;
    drawer.classList.add('open');
    if (btn) {
      btn.setAttribute('aria-expanded', 'true');
      const hamburger = btn.querySelector('.hamburger-icon');
      const close = btn.querySelector('.close-icon');
      if (hamburger) hamburger.style.display = 'none';
      if (close) close.style.display = 'block';
    }
  }

  function closeMobileMenu() {
    const drawer = document.getElementById('mobile-nav-drawer');
    const btn = document.getElementById('mobile-menu-btn');
    if (!drawer) return;
    drawer.classList.remove('open');
    if (btn) {
      btn.setAttribute('aria-expanded', 'false');
      const hamburger = btn.querySelector('.hamburger-icon');
      const close = btn.querySelector('.close-icon');
      if (hamburger) hamburger.style.display = 'block';
      if (close) close.style.display = 'none';
    }
  }

  // Keyboard Shortcuts Handler (Esc to close cookie banner/modals/mobile nav)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMobileMenu();
      const cookieModal = document.getElementById('cookie-manage-modal');
      if (cookieModal) cookieModal.style.display = 'none';
    }
  });

  // Load AdSense scripts only after explicit consent
  function loadAdSenseScriptsIfApproved() {
    const consent = getCookieConsent();
    if (!consent || (!consent.marketing && !consent.analytics)) {
      return;
    }
    console.log('[DevForge Privacy] Cookie consent granted for marketing/analytics.');
  }

  // Helper utility
  function escapeHtml(str) {
    if (typeof str !== 'string') return String(str);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Register service worker if available
  if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }

  // No-op compatibility stubs for UI functions to prevent any reference errors
  function noop() {}

  // Export
  global.DevForgeUI = {
    initTheme: enforceLightMode,
    toggleTheme: noop,
    applyTheme: noop,
    initMobileNav,
    toggleMobileMenu,
    openMobileMenu,
    closeMobileMenu,
    showToast,
    copyTextToClipboard,
    downloadTextFile,
    wireDragAndDrop,
    openSearchModal: noop,
    closeSearchModal: noop,
    getCookieConsent,
    saveCookieConsent,
    escapeHtml
  };

  function initApp() {
    enforceLightMode();
    initMobileNav();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})(typeof window !== 'undefined' ? window : globalThis);
