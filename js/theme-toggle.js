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
      body {
        color: var(--text-color);
      }
      
      h1, h2, h3, p, a, .static-anchor, .work, .ed { 
        color: var(--text-color);
      }
      
      ul, ol, li, ul li, ol li { 
        color: var(--text-color); 
        transition: color 0.3s ease;
      }

      ul li::before { 
        color: var(--mist-grey); 
        transition: color 0.3s ease;
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
      transition: all 0.3s ease;
    `;
  
    updateButtonIcon();
    buttonContainer.appendChild(themeToggleBtn);
    document.body.appendChild(buttonContainer);
  }
  
  function setupEventListeners() {
    themeToggleBtn.addEventListener('click', async () => {
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
      
      // Apply theme to main page
      await applyTheme(newTheme);
      storeTheme(newTheme);
      updateButtonIcon();
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async (e) => {
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
        
        await applyTheme(newTheme);
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
    // Create a promise for theme application
    return new Promise(resolve => {
      document.documentElement.setAttribute('data-theme', theme);
      
      const variables = THEME_VARIABLES[theme];
      // "Prime" CSS variables for theme
      for (const [key, value] of Object.entries(variables)) {
        document.documentElement.style.setProperty(key, value);
      }
      
      if (theme === THEMES.DARK) {
        // Applying dark mode styling
        document.documentElement.style.setProperty('color-scheme', 'dark');
        
        // Set additional theme-specific styles
        updateThemeStyles('.highlight, .citation', 'color', '#e6e6e6');
        updateThemeStyles('code:not(pre code)', 'background-color', '#444');
        
        // Explicitly handle list items for dark theme
        updateThemeStyles('ul li, ol li, .resume-entry ul li', 'color', '#e6e6e6');
      } else {
        // Light mode styling gets applied
        document.documentElement.style.setProperty('color-scheme', 'light');
        
        // Set additional theme-specific styles
        updateThemeStyles('.highlight, .citation', 'color', 'inherit');
        updateThemeStyles('code:not(pre code)', 'background-color', '#ccc');
        
        // Explicitly handle list items for light theme
        updateThemeStyles('ul li, ol li, .resume-entry ul li', 'color', '#000');
      }
      
      // Force browser to repaint list items
      forceRepaintLists();
      
      // Use requestAnimationFrame to ensure everything is rendered before resolving
      requestAnimationFrame(() => {
        resolve();
      });
    });
  }
  
  // Helper function to update styles without recreating the style element
  function updateThemeStyles(selector, property, value) {
    // Get or create the style element for dynamic styles
    let styleEl = document.getElementById('dynamic-theme-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'dynamic-theme-styles';
      document.head.appendChild(styleEl);
    }
    
    // Use computed styles if needed
    let sheet = styleEl.sheet;
    
    // Try to find existing rule
    let existingRuleIndex = -1;
    for (let i = 0; i < sheet.cssRules.length; i++) {
      if (sheet.cssRules[i].selectorText === selector) {
        existingRuleIndex = i;
        break;
      }
    }
    
    // Create or update the style rule
    const rule = `${selector} { ${property}: ${value}; }`;
    
    if (existingRuleIndex >= 0) {
      sheet.deleteRule(existingRuleIndex);
    }
    sheet.insertRule(rule, sheet.cssRules.length);
  }
  
  // Force browser to repaint list items
  function forceRepaintLists() {
    const lists = document.querySelectorAll('ul, ol');
    lists.forEach(list => {
      // This small change forces a repaint
      list.style.display = 'none';
      // We need to get the computed style to ensure the browser processes the change
      window.getComputedStyle(list).display;
      list.style.display = '';
    });
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
      themeToggleBtn.style.transform = 'scale(1.025)';
    };
    
    themeToggleBtn.onmouseout = () => {
      themeToggleBtn.style.transform = 'scale(1)';
    };
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