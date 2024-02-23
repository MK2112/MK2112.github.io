function renderBibtex(target_class) {
    cite_container = document.getElementById('bibtex');
    cite_list = [];
    const keyValueRegex = /(\w+)\s*=\s*{(.*?)},/g;

    // serialize bibtex into cite_list
    for (var i = 0; i < cite_container.children.length; i++) {
        cite_key = cite_container.children[i].id;
        matches = cite_container.children[i].innerText.matchAll(keyValueRegex);
        result = {};
        result['id'] = cite_key;
        for (const match of matches) {
            [, key, value] = match;
            result[key] = value;
        }

        authors = result['author'].split(", ");
        if (authors.length > 2) {
            result['author'] = authors[0] + ' et al.';
        }

        result.link = cite_container.children[i].querySelector('a').innerText;
        cite_list.push(result);
    }

    // render in-text references
    var target_divs = document.getElementsByClassName(target_class);
    const citeRegex = /\\cite{(\w+)}/g;

    for (var i = 0; i < target_divs.length; i++) {
        var div = target_divs[i];
        var text = div.innerHTML; // Use innerHTML to preserve HTML structure
        var matches = text.matchAll(citeRegex);
        cite_counter = 1;
        for (const match of matches) {
            if (cite_list.some(cite => cite.id === match[1])) {
                var cite_key = match[1];
                var cite_link = cite_list.find(cite => cite.id === cite_key).link;
                text = text.replace(match[0], `<a class="highlight" href="${cite_link}" target="_blank">$[${cite_counter}]$</a>`);
                cite_list.find(cite => cite.id === cite_key).cite_counter = cite_counter;
                div.innerHTML = text; // Set innerHTML to preserve HTML structure
                cite_counter++;
            }
        }
    }

    // Reduce to what's actually used, sorting by cite_counter
    cite_list = cite_list.filter(cite => cite.cite_counter).sort((a, b) => a.cite_counter - b.cite_counter);

    for (var i = 0; i < cite_list.length; i++) {
        var cite = cite_list[i];
        var referencesDiv = document.getElementById('references');
        if (i === 0) {
            var headerDiv = document.createElement('div');
            headerDiv.className = 'header';
            headerDiv.innerHTML = '<h3>References</h3>';
            referencesDiv.appendChild(headerDiv);
        }

        if (cite.cite_counter) {
            var referenceDiv = document.createElement('div');
            referenceDiv.className = 'reference ' + cite.id;
            referenceDiv.innerHTML = `<a class="citation" href='${cite.link}' target='_blank'><p>[${cite.cite_counter}]&nbsp;&nbsp;${cite.author}: ${cite.title}, ${cite.year}</p></a>`;
            referencesDiv.appendChild(referenceDiv);
        }
    }
}