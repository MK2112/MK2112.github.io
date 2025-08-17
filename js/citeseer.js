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
        if (authors.length > 3) {
            result['author'] = authors[0] + ' et al.';
        }

        result.link = cite_container.children[i].querySelector('a').innerText;
        cite_list.push(result);
    }

    // sort by concatenation of author and title
    cite_list.sort((a, b) => (a.author + a.title).localeCompare(b.author + b.title));

    // render in-text references
    var target_divs = document.getElementsByClassName(target_class);
    const citeRegex = /\\cite{(\w+)}/g;

    for (var i = 0; i < target_divs.length; i++) {
        var div = target_divs[i];
        var text = div.innerHTML;
        var matches = text.matchAll(citeRegex);
        for (const match of matches) {
            if (cite_list.some(cite => cite.id === match[1])) {
                var cite_key = match[1];
                if (!cite_list.find(cite => cite.id === cite_key).cite_counter) {
                    var cite = cite_list.find(cite => cite.id === cite_key);
                    text = text.replaceAll(match[0], `$[$<a class="highlight" href="${cite.link}" title="${cite.author}, ${cite.title}, ${cite.year}" target="_blank">$${cite_list.indexOf(cite) + 1}$</a>$]$`);
                    cite_list.find(cite => cite.id === cite_key).cite_counter = cite_list.indexOf(cite) + 1;
                    div.innerHTML = text;
                }
            }
        }
    }

    // reduce to actually cited entries, sort by cite_counter
    cite_list = cite_list.filter(cite => cite.cite_counter).sort((a, b) => a.cite_counter - b.cite_counter);

    var referencesDiv = document.getElementById('references');
    
    var heading = document.createElement('h3');
    heading.textContent = 'References';
    referencesDiv.appendChild(heading);
    
    var referencesTable = document.createElement('table');
    referencesTable.setAttribute('id', 'referencesTable');
    referencesDiv.appendChild(referencesTable);

    for (var i = 0; i < cite_list.length; i++) {
        var cite = cite_list[i];

        if (!cite.cite_counter) {
            continue;
        }

        var newRow = referencesTable.insertRow(-1);
        var counterCell = newRow.insertCell(0);
        counterCell.textContent = `$[${cite.cite_counter}]$`;
        counterCell.style.verticalAlign = 'top';
        
        var detailsCell = newRow.insertCell(1);
        detailsCell.innerHTML = `<a class="citation" href='${cite.link}' title="${cite.author}: ${cite.title}, ${cite.year}" target='_blank'><p>${cite.author}: ${cite.title}, ${cite.year}</p></a>`;
    }
}