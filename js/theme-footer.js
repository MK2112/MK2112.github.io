(function() {
  // Specifically for footer.html, because I *embedded* it in all pages.
  // Ensures footer's theme matches parent page's theme.
  const THEMES = {LIGHT: 'light', DARK: 'dark'};
  const STORAGE_KEY = 'site-theme-preference';
  
  // Variables for light + dark themes
  const THEME_VARIABLES = {
    [THEMES.LIGHT]: {
      '--mist-grey': 'rgba(125, 125, 125, 1)',
      '--highlight-light': 'rgba(100, 100, 100, 0.05)',
      '--highlight-free': 'rgba(100, 100, 100, 0.1)',
      '--highlight-hover': 'rgba(100, 100, 100, 0.3)',
      '--paper-grey': '#ecede8',
      '--paper-grey-focused': '#f0f1ee'
    },
    [THEMES.DARK]: {
      '--mist-grey': 'rgba(180, 180, 180, 1)',
      '--highlight-light': 'rgba(200, 200, 200, 0.1)',
      '--highlight-free': 'rgba(200, 200, 200, 0.15)',
      '--highlight-hover': 'rgba(200, 200, 200, 0.35)',
      '--paper-grey': '#1e1e1e',
      '--paper-grey-focused': '#252525'
    }
  };
  
  function initFooterTheme() {
    // Apply persisted theme or system preference as fallback initially
    applyTheme(getStoredTheme() || getSystemPreference());
    // Update view on storage update
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        applyTheme(e.newValue || getSystemPreference());
      }
    });
  }

  function getStoredTheme() {
    return localStorage.getItem(STORAGE_KEY);
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
    
    // Setting text color (this was stubborn) for body and other elements based on theme
    if (theme === THEMES.DARK) {
      document.documentElement.style.setProperty('color-scheme', 'dark');
      
      // Clean existing theme style elements
      const existingStyle = document.getElementById('theme-footer-style');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      const style = document.createElement('style');
      style.id = 'theme-footer-style';
      // Set dark mode styles
      style.textContent = `
        body { color: #e6e6e6; }
        h1, h2, h3, p, a, .static-anchor, .work, .ed { color: #e6e6e6; }
        .highlight, .citation { color: #e6e6e6; }
        .dynamic-anchor:hover { color: #e6e6e6; }
        footer a, footer div { color: #e6e6e6; }
        
        /* Preserve mist-grey color for elements that should use it */
        h4, .dynamic-anchor, aside, .ed-details, 
        .work-details aside, .project-p, .blog-img p { 
          color: var(--mist-grey); 
        }
      `;
      document.head.appendChild(style);
    } else {
      document.documentElement.style.setProperty('color-scheme', 'light');
      
      // Same cleaning as above
      const existingStyle = document.getElementById('theme-footer-style');
      if (existingStyle) {
        existingStyle.remove();
      }

      const style = document.createElement('style');
      style.id = 'theme-footer-style';
      // Set light mode styles
      style.textContent = `
        body { color: #000; }
        h1, h2, h3, p, a, .static-anchor, .work, .ed { color: #000; }
        .highlight, .citation { color: inherit; }
        footer a, footer div { color: #000; }
        
        /* Preserve mist-grey color for elements that should use it */
        h4, .dynamic-anchor, aside, .ed-details, 
        .work-details aside, .project-p, .blog-img p { 
          color: var(--mist-grey); 
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  // Apply footer theme only with a fully loaded DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFooterTheme);
  } else {
    initFooterTheme();
  }
})();
