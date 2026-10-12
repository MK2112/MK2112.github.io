(function() {

  // Default to using browser-imposed theme
  const THEMES = {LIGHT: 'light', DARK: 'dark'};
  const STORAGE_KEY = 'site-theme-preference';

  // Theme vars for light and dark themes
  const THEME_VARIABLES = {
    [THEMES.LIGHT]: {
      '--mist-grey': 'rgba(110, 110, 110, 1)',
      '--highlight-light': 'rgba(100, 100, 100, 0.05)',
      '--highlight-free': 'rgba(100, 100, 100, 0.1)',
      '--highlight-hover': 'rgba(100, 100, 100, 0.3)',
      '--paper-grey': '#f0f1ee',
      '--paper-grey-focused': '#f1f1f1',
      '--code-bg': '#ccc',
      '--text-color': '#000'
    },
    [THEMES.DARK]: {
      '--mist-grey': 'rgba(180, 180, 180, 1)',
      '--highlight-light': 'rgba(200, 200, 200, 0.1)',
      '--highlight-free': 'rgba(200, 200, 200, 0.15)',
      '--highlight-hover': 'rgba(200, 200, 200, 0.35)',
      '--paper-grey': '#1e1e1e',
      '--paper-grey-focused': '#252525',
      '--code-bg': '#444',
      '--text-color': '#e6e6e6'
    }
  };

  function injectBaseThemeStyles() {
    // Check if styles already exist
    if (document.getElementById('base-theme-styles')) return;

    const style = document.createElement('style');
    style.id = 'base-theme-styles';
    style.textContent = `
      .theme-no-transition, .theme-no-transition *, .theme-no-transition *::before, .theme-no-transition *::after {
        transition: none !important;
      }

      body {
        color: var(--text-color);
      }

      h1, h2, h3, p, a, .static-anchor, .work, .ed {
        color: var(--text-color);
      }

      ul, ol, li, ul li, ol li {
        color: var(--text-color);
      }

      ul li::before {
        color: var(--mist-grey);
      }

      h4, .dynamic-anchor, aside, .ed-details,
      .work-details aside, .project-p, .blog-img p, footer {
        color: var(--mist-grey);
      }
    `;
    document.head.appendChild(style);
  }

  // Injecting theme toggle button
  // Makes new pages way easier to hook into the theme system
  let themeToggleBtn;
  let footerEmbed;

  function initThemeSystem() {
    injectBaseThemeStyles(); // Add base styles immediately
    createThemeToggleButton();
    setupEventListeners();
    // Theme application is mainly handled by no-flash.js
    // Caring mainly about the toggle function here
    updateButtonIcon();
    footerEmbed = document.querySelector('embed[src="footer.html"]');
  }

  function createThemeToggleButton() {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'theme-toggle-container';
    // Button hovers to also be within reach in search overlay
    buttonContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999;
    `;
    // Theme toggle button definition
    themeToggleBtn = document.createElement('button');
    themeToggleBtn.className = 'theme-toggle-btn';
    themeToggleBtn.setAttribute('aria-label', 'Toggle dark/light mode');
    // (default) light mode
    themeToggleBtn.style.cssText = `
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background-color: var(--paper-grey-focused);
      color: var(--mist-grey);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    `;
    themeToggleBtn.onmouseover = () => {
      themeToggleBtn.style.transform = 'scale(1.025)';
    };
    themeToggleBtn.onmouseout = () => {
      themeToggleBtn.style.transform = 'scale(1)';
    };

    updateButtonIcon();
    buttonContainer.appendChild(themeToggleBtn);
    document.body.appendChild(buttonContainer);
  }

  function setupEventListeners() {
    themeToggleBtn.addEventListener('click', () => {
      // Default to system preference if no theme stored
      const currentTheme = getStoredTheme() || getSystemPreference();
      // Determine theme to switch to from current theme
      const newTheme = currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
      // Send message to footer BEFORE applying theme to main page
      if (footerEmbed && footerEmbed.contentWindow) {
        footerEmbed.contentWindow.postMessage({
          type: 'theme-change',
          theme: newTheme,
          themeVariables: THEME_VARIABLES[newTheme]
        }, '*');
      }
      applyTheme(newTheme);
      storeTheme(newTheme);
      updateButtonIcon();
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!getStoredTheme()) {
        const newTheme = e.matches ? THEMES.DARK : THEMES.LIGHT;
        // Send message to footer BEFORE applying theme to main page
        if (footerEmbed && footerEmbed.contentWindow) {
          footerEmbed.contentWindow.postMessage({
            type: 'theme-change',
            theme: newTheme,
            themeVariables: THEME_VARIABLES[newTheme]
          }, '*');
        }
        applyTheme(newTheme);
        updateButtonIcon();
      }
    });

    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'request-theme') {
        const currentTheme = getStoredTheme() || getSystemPreference();
        event.source.postMessage({
          type: 'theme-change',
          theme: currentTheme,
          themeVariables: THEME_VARIABLES[currentTheme]
        }, '*');
      }
    });
  }

  function getStoredTheme() {
    return localStorage.getItem(STORAGE_KEY);
  }

  function storeTheme(theme) {
    localStorage.setItem(STORAGE_KEY, theme);
  }

  function getSystemPreference() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEMES.DARK : THEMES.LIGHT;
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    root.classList.add('theme-no-transition');
    root.setAttribute('data-theme', theme);
    const variables = THEME_VARIABLES[theme];
    for (const [key, value] of Object.entries(variables)) {
      root.style.setProperty(key, value);
    }
    root.style.setProperty('color-scheme', theme === THEMES.DARK ? 'dark' : 'light');
    void root.offsetHeight;
    root.classList.remove('theme-no-transition');
  }

  function updateButtonIcon() {
    if (!themeToggleBtn) return;
    const currentTheme = getStoredTheme() || getSystemPreference();
    // Select icon based on currently live theme
    if (currentTheme === THEMES.DARK) {
      themeToggleBtn.innerHTML = '☀️';
    } else {
      themeToggleBtn.innerHTML = '🌙';
    }
  }
  // Initialize theme system when document is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeSystem);
  } else {
    initThemeSystem();
  }
  // Also inject base styles immediately to ensure they're present even before DOM is fully loaded
  injectBaseThemeStyles();
})();
