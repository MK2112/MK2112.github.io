(function() {
  // Core Theme Management Component
  // Handles theme pref storage, toggling and persistive application
  // Initial page theme application is done through no-flash.js
  // This file concerns the toggline and storage of theme preference
  // Theme preference is stored in local storage

  // Page will default to using the browser/OS preferred theme
  const THEMES = {LIGHT: 'light', DARK: 'dark'};
  const STORAGE_KEY = 'site-theme-preference';
  
  // Theme vars for light and dark themes
  const THEME_VARIABLES = {
    [THEMES.LIGHT]: {
      '--mist-grey': 'rgba(125, 125, 125, 1)',
      '--highlight-light': 'rgba(100, 100, 100, 0.05)',
      '--highlight-free': 'rgba(100, 100, 100, 0.1)',
      '--highlight-hover': 'rgba(100, 100, 100, 0.3)',
      '--paper-grey': '#ecede8',
      '--paper-grey-focused': '#f0f1ee',
      '--code-bg': '#ccc'
    },
    [THEMES.DARK]: {
      '--mist-grey': 'rgba(180, 180, 180, 1)',
      '--highlight-light': 'rgba(200, 200, 200, 0.1)',
      '--highlight-free': 'rgba(200, 200, 200, 0.15)',
      '--highlight-hover': 'rgba(200, 200, 200, 0.35)',
      '--paper-grey': '#1e1e1e',
      '--paper-grey-focused': '#252525',
      '--code-bg': '#444'
    }
  };

  // 'Injecting' the theme toggle button
  // Makes new pages easy to hook into theme system
  let themeToggleBtn;
  let footerEmbed;
  
  function initThemeSystem() {
    createThemeToggleButton();
    setupEventListeners();
    // Applying of theme is actually handled by no-flash.js
    // Caring mainly about the toggle button here
    updateButtonIcon();
    // Grab the footer embed element
    footerEmbed = document.querySelector('embed[src="footer.html"]');
  }
  
  function createThemeToggleButton() {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'theme-toggle-container';
    // Button 'flies' to be within reach even in the search overlay
    buttonContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999;
    `;
    
    themeToggleBtn = document.createElement('button');
    themeToggleBtn.className = 'theme-toggle-btn';
    themeToggleBtn.setAttribute('aria-label', 'Toggle dark/light mode');
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
      transition: all 0.3s ease;
    `;
  
    updateButtonIcon();
    buttonContainer.appendChild(themeToggleBtn);
    document.body.appendChild(buttonContainer);
  }
  
  function setupEventListeners() {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = getStoredTheme() || getSystemPreference();
      const newTheme = currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
      
      applyTheme(newTheme);
      storeTheme(newTheme);
      updateButtonIcon();
      
      // Footer needs extra invitation, reloads to apply theme
      reloadFooter();
    });
    
    // Looking out for system preference changes, apply only if no user preference
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!getStoredTheme()) {
        const newTheme = e.matches ? THEMES.DARK : THEMES.LIGHT;
        applyTheme(newTheme);
        updateButtonIcon();
        reloadFooter();
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
    document.documentElement.setAttribute('data-theme', theme);
    
    const variables = THEME_VARIABLES[theme];
    // Prime CSS variables for theme
    for (const [key, value] of Object.entries(variables)) {
      document.documentElement.style.setProperty(key, value);
    }
    
    if (theme === THEMES.DARK) {
      // Dark mode styling gets applied
      document.documentElement.style.setProperty('color-scheme', 'dark');
      
      // Clean any existing theme style elements
      const existingStyle = document.getElementById('theme-toggle-style');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      const style = document.createElement('style');
      style.id = 'theme-toggle-style';
      // Set dark mode styles
      style.textContent = `
        body { color: #e6e6e6; }
        h1, h2, h3, p, a, .static-anchor, .work, .ed { color: #e6e6e6; }
        .highlight, .citation { color: #e6e6e6; }
        .dynamic-anchor:hover { color: #e6e6e6; }
        code:not(pre code) { background-color: #444; }
        
        /* Preserve mist-grey color for elements that should use it */
        h4, .dynamic-anchor, aside, .ed-details, 
        .work-details aside, .project-p, .blog-img p { 
          color: var(--mist-grey); 
        }
      `;
      document.head.appendChild(style);
    } else {
      // Light mode styling gets applied
      document.documentElement.style.setProperty('color-scheme', 'light');

      // Clean any existing theme style elements
      const existingStyle = document.getElementById('theme-toggle-style');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      const style = document.createElement('style');
      style.id = 'theme-toggle-style';
      // Set light mode styles
      style.textContent = `
        body { color: #000; }
        h1, h2, h3, p, a, .static-anchor, .work, .ed { color: #000; }
        .highlight, .citation { color: inherit; }
        code:not(pre code) { background-color: #ccc; }
        
        /* Preserve mist-grey color for elements that should use it */
        h4, .dynamic-anchor, aside, .ed-details, 
        .work-details aside, .project-p, .blog-img p { 
          color: var(--mist-grey); 
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  function updateButtonIcon() {
    const currentTheme = getStoredTheme() || getSystemPreference();
    
    // Select icon based on currently live theme
    if (currentTheme === THEMES.DARK) {
      themeToggleBtn.innerHTML = '☀️';
    } else {
      themeToggleBtn.innerHTML = '🌙';
    }
    
    // Update button hover effect
    themeToggleBtn.onmouseover = () => {
      themeToggleBtn.style.transform = 'scale(1.1)';
    };
    
    themeToggleBtn.onmouseout = () => {
      themeToggleBtn.style.transform = 'scale(1)';
    };
  }
  
  function reloadFooter() {
    if (footerEmbed) {
      // Reload the footer to apply the new theme, given a footer embed exists
      const timestamp = new Date().getTime();
      const currentSrc = footerEmbed.getAttribute('src').split('?')[0];
      footerEmbed.setAttribute('src', `${currentSrc}?t=${timestamp}`);
    }
  }
  
  // Initialize the theme system
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeSystem);
  } else {
    initThemeSystem();
  }
})();
