(function() {
  // Running ASAP in HTML head to prevent theme flashing effects on load
  // Applies the correct theme before any content is rendered.
  // Defaults to the browser/OS preferred theme when no user preference provided.
  const THEMES = {LIGHT: 'light', DARK: 'dark'};
  const STORAGE_KEY = 'site-theme-preference';
  const THEME_VARIABLES = {
    [THEMES.LIGHT]: {
      '--mist-grey': 'rgba(110, 110, 110, 1)',
      '--highlight-light': 'rgba(100, 100, 100, 0.05)',
      '--highlight-free': 'rgba(100, 100, 100, 0.1)',
      '--highlight-hover': 'rgba(100, 100, 100, 0.3)',
      '--paper-grey': '#f0f1ee',
      '--paper-grey-focused': '#f1f1f1',
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
  
  const persistedTheme = localStorage.getItem(STORAGE_KEY);
  const sysPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? THEMES.DARK : THEMES.LIGHT;
  // Fallback to sysPreference if persistedTheme undefined (|| is confusing, but works)
  const theme = persistedTheme || sysPreference;

  document.documentElement.setAttribute('data-theme', theme);
  const variables = THEME_VARIABLES[theme];
  
  // Prime CSS variables for theme
  for (const [key, value] of Object.entries(variables)) {
    document.documentElement.style.setProperty(key, value);
  }

  if (theme === THEMES.DARK) {
    document.documentElement.style.setProperty('color-scheme', 'dark');
    const style = document.createElement('style');
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
    document.documentElement.style.setProperty('color-scheme', 'light');
    const style = document.createElement('style');
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
})();
