(function () {
  'use strict';

  /*
    Integration to make images inside any div class="blog-img" enlargeable.
    Image gets placed in front of a darkened, blurred blog post background.
    Click backdrop or press Escape to close.
  */

  const STYLE_ID = 'ie-image-enlarge-styles';
  const BLUR_TARGET_SELECTOR = '.fade-in';
  const DEFAULT_ANIM_MS = 220;

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
.ie-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10,10,12,0.45);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  opacity: 0;
  transition: opacity ${DEFAULT_ANIM_MS}ms ease;
}

.ie-overlay.ie-open { opacity: 1; }

.ie-modal {
  position: relative;
  max-height: 94vh;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateY(8px) scale(0.99);
  opacity: 0;
  transition: transform ${DEFAULT_ANIM_MS}ms cubic-bezier(.2,.9,.2,1), opacity ${DEFAULT_ANIM_MS}ms ease;
  will-change: transform, opacity;
  outline: none;
}

.ie-overlay.ie-open .ie-modal {
  transform: translateY(0) scale(1);
  opacity: 1;
}

.ie-modal img {
  display: block;
  max-height: 90vh;
  height: auto;
  width: auto;
  border: 1px solid black;
  box-shadow: 0 18px 40px rgba(2,6,23,0.5);
  transition: transform ${DEFAULT_ANIM_MS}ms ease, opacity ${DEFAULT_ANIM_MS}ms ease;
  object-fit: contain;
}

.ie-bg-blur {
  filter: blur(5px) saturate(0.98) contrast(0.98);
  pointer-events: none;
  transition: filter ${DEFAULT_ANIM_MS}ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .ie-overlay, .ie-modal, .ie-modal img { transition: none !important; }
}
`;
    document.head.appendChild(style);
  }

  function findEnlargeComment(node) {
    const COMMENT = 8;
    for (let child of Array.from(node.childNodes)) {
      if (child.nodeType === COMMENT) {
        const m = /Enlarge:\s*([0-9]{1,3})\s*%/i.exec(child.nodeValue || '');
        if (m) {
          const pct = parseInt(m[1], 10);
          if (pct > 0 && pct <= 200) return pct;
        }
      }
      if (child.childNodes && child.childNodes.length) {
        const found = findEnlargeComment(child);
        if (found) return found;
      }
    }
    return null;
  }

  function makeClickable(el) {
    el.classList.add('ie-clickable');
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', 'Bild vergrößern');
  }

  function createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'ie-overlay';
    overlay.tabIndex = -1;

    const modal = document.createElement('div');
    modal.className = 'ie-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    overlay.appendChild(modal);
    return { overlay, modal };
  }

  function openImageModal(imgEl, pct, opener) {
    injectStyles();

    const rootBlurTarget = document.querySelector(BLUR_TARGET_SELECTOR) || document.body;
    const { overlay, modal } = createOverlay();
    const cloned = imgEl.cloneNode(true);

    cloned.alt = imgEl.alt || '';
    cloned.loading = 'eager';
    
    function computeEffectivePct() {
      return (window.innerHeight > window.innerWidth) ? 100 : pct;
    }
    let effectivePct = computeEffectivePct();

    cloned.style.maxWidth = `${Math.min(Math.max(effectivePct, 10), 200)}vw`;
    cloned.style.width = `${effectivePct}vw`;
    cloned.style.boxSizing = 'border-box';
    cloned.style.maxHeight = '90vh';
    modal.appendChild(cloned);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.classList.add('ie-open');
      modal.classList.add('ie-open');
      rootBlurTarget.classList.add('ie-bg-blur');
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    });

    function cleanup() {
      overlay.classList.remove('ie-open');
      rootBlurTarget.classList.remove('ie-bg-blur');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      const ms = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : DEFAULT_ANIM_MS + 20;
      setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, ms);
      document.removeEventListener('keydown', onKeyDown);
      overlay.removeEventListener('click', onBackdrop);
      if (opener && typeof opener.focus === 'function') opener.focus();
    }

    function onClose(e) {
      e && e.preventDefault();
      cleanup();
    }

    function onBackdrop(e) {
      if (e.target === overlay) onClose(e);
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') onClose(e);
    }

    overlay.addEventListener('click', onBackdrop);
    document.addEventListener('keydown', onKeyDown);

    let rAF;
    function onResize() {
      if (rAF) cancelAnimationFrame(rAF);
      rAF = requestAnimationFrame(() => {
        effectivePct = computeEffectivePct();
        cloned.style.width = `${effectivePct}vw`;
        cloned.style.maxWidth = `${Math.min(Math.max(effectivePct, 10), 200)}vw`;
      });
    }

    window.addEventListener('resize', onResize);
    const origCleanup = cleanup;
    cleanup = function () {
      window.removeEventListener('resize', onResize);
      origCleanup();
    };
  }

  function setup() {
    injectStyles();
    const blog_imgs = Array.from(document.querySelectorAll('div.blog-img'));
    if (!blog_imgs.length) return;

    blog_imgs.forEach((div) => {
      const pct = findEnlargeComment(div);
      if (!pct) return;
      const imgs = Array.from(div.querySelectorAll('img'));
      if (!imgs.length) return;
      makeClickable(div);
      
      imgs.forEach((img) => {
        img.draggable = false;
        img.setAttribute('tabindex', '0');
        img.setAttribute('role', 'button');
        img.setAttribute('aria-label', img.alt ? `Vergrößere: ${img.alt}` : 'Bild vergrößern');

        function openerClick(e) {
          e.stopPropagation();
          openImageModal(img, pct, img);
        }

        function onKey(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openerClick(e);
          }
        }

        img.addEventListener('click', openerClick);
        img.addEventListener('keydown', onKey);
      });

      const firstImg = imgs[0];
      function containerOpener(e) {
        openImageModal(firstImg, pct, firstImg);
      }
      function containerKey(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          containerOpener(e);
        }
      }
      div.addEventListener('click', containerOpener);
      div.addEventListener('keydown', containerKey);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();