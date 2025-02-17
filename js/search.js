document.addEventListener('keydown', function(event) {
    // Trigger on Command+K or Ctrl+K
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      toggleSearchOverlay();
    }
  });
  
  document.addEventListener('click', function(event) {
    const searchOverlay = document.getElementById('search-overlay');
    const searchContainer = document.querySelector('.search-container');
    
    if (!searchOverlay.classList.contains('hidden') && 
        !searchContainer.contains(event.target)) {
      closeSearchOverlay();
    }
  });
  
  function toggleSearchOverlay() {
    const searchOverlay = document.getElementById('search-overlay');
    
    if (searchOverlay.classList.contains('hidden')) {
      openSearchOverlay();
    } else {
      closeSearchOverlay();
    }
  }
  
  function openSearchOverlay() {
    const searchOverlay = document.getElementById('search-overlay');
    const searchInput = document.getElementById('search-input');
    
    searchOverlay.classList.remove('hidden');
    searchInput.focus();
  }
  
  function closeSearchOverlay() {
    const searchOverlay = document.getElementById('search-overlay');
    const searchInput = document.getElementById('search-input');
    
    searchOverlay.classList.add('hidden');
    searchInput.value = '';
    document.getElementById('search-results').innerHTML = '';
  }
  
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', function() {
    const query = this.value.toLowerCase();
    const results = performSearch(query);
    displayResults(results);
  });
  
  let searchKeywords = [];

  // Function to fetch and parse blog.html
  async function fetchBlogItems() {
    try {
      const blog_response = await fetch('blog.html');
      const blog_html = await blog_response.text();
      const parser = new DOMParser();
      const blog_doc = parser.parseFromString(blog_html, 'text/html');
      const blog_h2Elements = blog_doc.querySelectorAll('h2');
      searchKeywords = Array.from(blog_h2Elements).map(h2 => ({
        title: h2.textContent,
        id: h2.id || h2.textContent.toLowerCase().replace(/\s+/g, '-')
      }));
      console.log('Blog items loaded:', searchKeywords);
    } catch (error) {
      console.error('Error fetching blog items:', error);
    }
  }
  
  // Call this function when the page loads
  fetchBlogItems();
  
  function performSearch(query) {
    query = query.toLowerCase();
    return searchKeywords.filter(item => item.title.toLowerCase().includes(query));
  }
  
  function displayResults(results) {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';
    
    if (results.length === 0) {
      resultsContainer.innerHTML = '<p>No results found.</p>';
      return;
    }
    
    // Sort results by title alphabetically
    results.sort((a, b) => a.title.localeCompare(b.title));

    results.forEach(result => {
      const resultElement = document.createElement('div');
      resultElement.className = 'search-result';
      resultElement.innerHTML = `
        <p><a class="highlight" href="blog/${result.id}.html">${result.title}</a></p>
      `;
      resultsContainer.appendChild(resultElement);
    });
  }