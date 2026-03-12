(function () {
    function sanitizeMathText(text) {
        var sanitized = text || '';

        while (/\\[a-zA-Z]+\s*\{[^{}]*\}/.test(sanitized)) {
            sanitized = sanitized.replace(/\\[a-zA-Z]+\s*\{([^{}]*)\}/g, '$1');
        }

        sanitized = sanitized.replace(/\\[a-zA-Z]+/g, '');
        sanitized = sanitized.replace(/[{}]/g, '');
        sanitized = sanitized.replace(/\s+/g, ' ').trim();
        return sanitized;
    }

    function sanitizeTextNode(text) {
        return (text || '')
            .replace(/\$\$([^$]+)\$\$/g, function (_, mathText) {
                return sanitizeMathText(mathText);
            })
            .replace(/\$([^$]+)\$/g, function (_, mathText) {
                return sanitizeMathText(mathText);
            })
            .replace(/\s+/g, ' ')
            .trim();
    }

    function collectHeadingText(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            return sanitizeTextNode(node.textContent);
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            return '';
        }

        if (node.classList.contains('katex')) {
            var annotation = node.querySelector('annotation');
            return sanitizeMathText(annotation ? annotation.textContent : node.textContent);
        }

        return Array.prototype.map.call(node.childNodes, collectHeadingText).join(' ');
    }

    function getHeadingLabel(heading) {
        return Array.prototype.map.call(heading.childNodes, collectHeadingText)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function buildToc() {
        var blogEntry = document.querySelector('.blog-entry');
        if (!blogEntry) return;
        var project = document.querySelector('#main-projects .project');
        if (!project) return;

        var headingItems = Array.prototype.slice.call(blogEntry.querySelectorAll('h3')).map(function (heading, index) {
            if (!heading.id) {
                var slug = getHeadingLabel(heading)
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '');
                heading.id = slug || ('section-' + (index + 1));
            }

            return {
                element: heading,
                id: heading.id,
                label: getHeadingLabel(heading)
            };
        });

        var referencesDiv = document.getElementById('references');
        if (referencesDiv) {
            headingItems.push({
                element: referencesDiv,
                id: referencesDiv.id,
                label: 'References'
            });
        }

        if (headingItems.length < 2) return;

        var toc = document.createElement('nav');
        toc.className = 'blog-toc';
        toc.setAttribute('aria-label', 'Table of contents');

        var ol = document.createElement('ol');
        headingItems.forEach(function (item) {
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.href = '#' + item.id;
            a.textContent = item.label;
            li.appendChild(a);
            ol.appendChild(li);
        });
        toc.appendChild(ol);

        document.body.appendChild(toc);

        function positionToc() {
            if (window.innerWidth < 1200) {
                toc.style.left = '';
                return;
            }

            var projectRect = project.getBoundingClientRect();
            var tocWidth = toc.offsetWidth || 175;
            var gap = 28;
            var viewportPadding = 24;
            var desiredLeft = projectRect.right + gap;
            var maxLeft = window.innerWidth - tocWidth - viewportPadding;

            toc.style.left = Math.min(desiredLeft, maxLeft) + 'px';
        }

        positionToc();
        window.addEventListener('resize', positionToc);

        var activeLink = null;
        function setActiveLinkByScrollPosition() {
            var anchorY = window.innerHeight * 0.18;
            var currentItem = headingItems[0];

            headingItems.forEach(function (item) {
                if (item.element.getBoundingClientRect().top <= anchorY) {
                    currentItem = item;
                }
            });

            var nextLink = toc.querySelector('a[href="#' + currentItem.id + '"]');
            if (!nextLink || nextLink === activeLink) return;

            if (activeLink) activeLink.classList.remove('active');
            activeLink = nextLink;
            activeLink.classList.add('active');
        }

        setActiveLinkByScrollPosition();
        window.addEventListener('scroll', setActiveLinkByScrollPosition, { passive: true });

        Array.prototype.forEach.call(toc.querySelectorAll('a'), function (a) {
            a.addEventListener('click', function (e) {
                e.preventDefault();
                var target = document.getElementById(a.getAttribute('href').slice(1));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    if (activeLink) activeLink.classList.remove('active');
                    activeLink = a;
                    a.classList.add('active');
                    window.setTimeout(setActiveLinkByScrollPosition, 50);
                }
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', buildToc);
    } else {
        buildToc();
    }
})();
