document.addEventListener('keydown', function(event) {
  // Command+K || Ctrl+K
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

async function fetchSearchItems() {
  try {
    const pages = [{src: 'blog.html', id: 'Blog'}, {src: 'projects.html', id: 'Projects'}];
    let searchKeywords = [];

    for (const page of pages) {
      const response = await fetch(page.src);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const h2Elements = doc.querySelectorAll('h2');

      const pageKeywords = Array.from(h2Elements).map(h2 => {
        const cleanTitle = h2.textContent.trim().replace(/\s+/g, ' ');
        return {
          type: page.id,
          title: cleanTitle,
          id: h2.id || cleanTitle.toLowerCase().replace(/\s+/g, '-')
        };
      });

      searchKeywords = searchKeywords.concat(pageKeywords);
    }

    console.log('Items loaded:', searchKeywords);
    window.searchKeywords = searchKeywords;
  } catch (error) {
    console.error('Error fetching items:', error);
  }
}

fetchSearchItems();

function performSearch(query) {
  query = query.toLowerCase();
  return window.searchKeywords.filter(item => item.title.toLowerCase().includes(query));
}

function displayResults(results) {
  const resultsContainer = document.getElementById('search-results');
  resultsContainer.innerHTML = '';

  if (results.length === 0) {
    resultsContainer.innerHTML = '<p style="color: var(--mist-grey);">No results found.</p>';
    return;
  }

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {});

  Object.keys(groupedResults).forEach(type => {
    const section = document.createElement('div');
    section.className = 'search-section';
    const sectionTitle = document.createElement('p');
    sectionTitle.className = 'title-tag';
    sectionTitle.textContent = type;
    section.appendChild(sectionTitle);

    groupedResults[type].forEach(result => {
      const resultElement = document.createElement('div');
      resultElement.className = 'search-result';
      if (type === 'Projects') {
        resultElement.innerHTML = `<p><a class="search-arrow">↪</a>
                                   <a class="highlight" target="_blank" href="https://github.com/mk2112/${result.id}">${result.title}</a></p>`;
        section.appendChild(resultElement);
      } else {
        resultElement.innerHTML = `<p><a class="search-arrow">↪</a>
                                 <a class="highlight" href="${type.toLowerCase()}/${result.id}.html">${result.title}</a></p>`;
        section.appendChild(resultElement);
      }
    });

    resultsContainer.appendChild(section);
  });
}