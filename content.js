// Inhoudscript voor stagemarkt.nl - haalt plaatsingsdatums op en geeft deze weer

// Controleer of we op stagemarkt.nl zijn
function isOnStagemarkt() {
  return window.location.hostname.includes('stagemarkt.nl');
}

// Debounce helper
function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}
function getPostedDateFromPage() {
  console.log('[Stagemarkt+] JSON-LD schema zoeken...');
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  console.log('[Stagemarkt+] Gevonden', scripts.length, 'JSON-LD scripts');
  
  for (let script of scripts) {
    try {
      const data = JSON.parse(script.textContent);
      console.log('[Stagemarkt+] JSON-LD geparst:', data);
      
      const graph = data['@graph'] || [data];
      for (let item of (Array.isArray(graph) ? graph : [graph])) {
        if (item['@type'] === 'JobPosting' && item.datePosted) {
          console.log('[Stagemarkt+] datePosted gevonden:', item.datePosted);
          return item.datePosted;
        }
      }
    } catch (e) {
      console.error('[Stagemarkt+] Fout bij het parseren van JSON-LD:', e);
    }
  }
  console.log('[Stagemarkt+] Geen datePosted gevonden');
  return null;
}

// Formateer datum naar "D maandnaam YYYY" (bijv. "23 mei 2026")
function formatDate(dateString) {
  const date = new Date(dateString);
  const day = date.getDate();
  const year = date.getFullYear();
  const months = [
    'januari','februari','maart','april','mei','juni',
    'juli','augustus','september','oktober','november','december'
  ];
  const monthName = months[date.getMonth()];
  return `${day} ${monthName} ${year}`;
}

// Voeg stijlen in voor datumweergave
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .stagemarkt-posted-date {
      display: block;
      background-color: #e8f4f8;
      border-left: 4px solid #3498db;
      color: #2c3e50;
      padding: 12px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      margin: 20px;
      margin-top: 15px;
    }
  `;
  document.head.appendChild(style);
}

// Geef datum weer op individuele stagepagina
function displayDateOnDetailPage() {
  console.log('[Stagemarkt+] Controleren of op detailpagina:', window.location.pathname);
  
  if (window.location.pathname.includes('/stages/')) {
    console.log('[Stagemarkt+] Op detailpagina, datum extraheren...');
    const postedDate = getPostedDateFromPage();
    
    if (postedDate) {
      const formattedDate = formatDate(postedDate);
      console.log('[Stagemarkt+] Geformateerde datum:', formattedDate);
      
      // Probeer meerdere selectors om te vinden waar de datum moet worden ingevoegd
      let inserted = false;
      const selectors = [
        '[class*="card-content"]',
        '[class*="job-description"]',
        '[class*="internship-details"]',
        'main',
        'article'
      ];
      
      for (let selector of selectors) {
        const element = document.querySelector(selector);
        if (element && !inserted) {
          const dateElement = document.createElement('div');
          dateElement.className = 'stagemarkt-posted-date';
          dateElement.innerHTML = `Datum Geplaatst: <strong>${formattedDate}</strong>`;
          element.appendChild(dateElement);
          console.log('[Stagemarkt+] Datum ingevoegd met selector:', selector);
          inserted = true;
          break;
        }
      }
      
      if (!inserted) {
        console.log('[Stagemarkt+] Kon geen invoegpunt vinden, voeg bovenaan body in');
        const dateElement = document.createElement('div');
        dateElement.className = 'stagemarkt-posted-date';
        dateElement.innerHTML = `Datum Geplaatst: <strong>${formattedDate}</strong>`;
        document.body.insertBefore(dateElement, document.body.firstChild);
      }
    } else {
      console.log('[Stagemarkt+] Geen plaatsingsdatum gevonden op deze pagina');
    }
  }
}

// Verwerk zoekresultatenpagina
function handleSearchPage() {
  if (window.location.pathname === '/stages' || window.location.pathname === '/stages/') {
    console.log('[Stagemarkt+] Op zoekpagina, datums ophalen voor aanbiedingen...');
    
    // Haal alle kaarten op die nog geen datum hebben
    const cards = document.querySelectorAll('a.card:not(.stagemarkt-dated)');
    console.log('[Stagemarkt+] Gevonden', cards.length, 'stage kaarten zonder datum');
    
    if (cards.length === 0) {
      console.log('[Stagemarkt+] Alle kaarten hebben al een datum');
      return;
    }
    
    cards.forEach((card, index) => {
      const href = card.getAttribute('href');
      if (href && href.includes('/stages/')) {
        // Voeg een kleine vertraging toe zodat we niet te veel tegelijk fetchen
        setTimeout(async () => {
          try {
            const response = await fetch(href);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
            for (let script of scripts) {
              try {
                const data = JSON.parse(script.textContent);
                const graph = data['@graph'] || [data];
                for (let item of (Array.isArray(graph) ? graph : [graph])) {
                  if (item['@type'] === 'JobPosting' && item.datePosted) {
                    const formattedDate = formatDate(item.datePosted);
                    console.log('[Stagemarkt+] Datum gevonden voor kaart:', formattedDate);
                    
                    // Zoek de card-tags div en voeg datum toe als label
                    const cardTags = card.querySelector('.card-tags');
                    if (cardTags && !cardTags.querySelector('.stagemarkt-date-pill')) {
                      const datePill = document.createElement('div');
                      datePill.className = 'sbb-pill stagemarkt-date-pill';
                      datePill.setAttribute('data-v-9d5e9195', '');
                      datePill.setAttribute('data-v-5eb516ad', '');
                      const iconSpan = document.createElement('span');
                      iconSpan.className = 'iconify i-material-symbols:calendar-month-outline text-brand-500';
                      iconSpan.setAttribute('data-v-9d5e9195', '');
                      iconSpan.setAttribute('aria-hidden', 'true');
                      iconSpan.style.fontSize = '1.4rem';
                      
                      const textSpan = document.createElement('span');
                      textSpan.setAttribute('data-v-9d5e9195', '');
                      textSpan.textContent = `Geplaatst op: ${formattedDate}`;
                      
                      datePill.appendChild(iconSpan);
                      datePill.appendChild(textSpan);
                      cardTags.appendChild(datePill);
                      console.log('[Stagemarkt+] Datumpilletje toegevoegd aan kaart');
                    }
                    
                    card.classList.add('stagemarkt-dated');
                    break;
                  }
                }
              } catch (e) {
                console.error('[Stagemarkt+] Fout bij parseren JSON-LD van opgehaalde pagina:', e);
              }
            }
          } catch (error) {
            console.error('[Stagemarkt+] Fout bij ophalen pagina:', error);
          }
        }, index * 100); // 100ms vertraging tussen requests
      }
    });
  }
}

// Luister naar berichten van popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPostedDate') {
    const postedDate = getPostedDateFromPage();
    sendResponse({ postedDate: postedDate });
  }
});

// Initialiseer
console.log('[Stagemarkt+] Inhoudscript initialiseert...');

if (isOnStagemarkt()) {
  console.log('[Stagemarkt+] Aan het injecteren op stagemarkt.nl');
  
  injectStyles();
  
  // Voer direct uit
  displayDateOnDetailPage();
  handleSearchPage();
  
  // Herhaal elke 2 seconden voor dynamische content
  setInterval(() => {
    displayDateOnDetailPage();
    handleSearchPage();
  }, 2000);
} else {
  console.log('[Stagemarkt+] Niet op stagemarkt.nl, script inactief');
}
