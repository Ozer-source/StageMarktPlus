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

function formatRangeValue(value) {
  const number = Number(value);
  if (Number.isNaN(number)) {
    return '5';
  }

  return String(Math.min(75, Math.max(5, number)));
}

const allowedRangeValues = [5, 10, 15, 25, 50, 75];

function snapRangeValue(value) {
  const numericValue = Number(formatRangeValue(value));
  let nearestValue = allowedRangeValues[0];
  let smallestDistance = Math.abs(numericValue - nearestValue);

  for (const allowedValue of allowedRangeValues) {
    const distance = Math.abs(numericValue - allowedValue);
    if (distance < smallestDistance) {
      nearestValue = allowedValue;
      smallestDistance = distance;
    }
  }

  return String(nearestValue);
}

function getCurrentRangeValue() {
  const params = new URLSearchParams(window.location.search);
  return snapRangeValue(params.get('range') || '75');
}

function updateRangeInUrl(value) {
  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set('range', snapRangeValue(value));
  window.location.href = nextUrl.toString();
}

function startRangeFilterObserver() {
  if (window.__stagemarktRangeFilterObserverStarted) {
    return;
  }

  window.__stagemarktRangeFilterObserverStarted = true;

  const scheduleInject = debounce(() => {
    injectRangeFilter();
  }, 50);

  const observer = new MutationObserver(() => {
    if (window.location.pathname === '/stages' || window.location.pathname === '/stages/') {
      scheduleInject();
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  window.__stagemarktRangeFilterObserver = observer;
}

function ensureStagemarktPageClass() {
  document.body.classList.add('stagemarkt-plus-page');
}

function injectRangeFilter() {
  if (window.location.pathname !== '/stages' && window.location.pathname !== '/stages/') {
    return;
  }

  if (document.querySelector('.stagemarkt-range-filter')) {
    return;
  }

  const keywordSearch = document.querySelector('.search-field.keyword-search-field');
  const filterBar = document.querySelector('.filter-bar-container.items-start .filter-bar-container.flex-wrap');

  if (!keywordSearch || !filterBar) {
    return;
  }

  const rangeFilter = document.createElement('div');
  rangeFilter.className = 'search-field stagemarkt-range-filter';
  rangeFilter.setAttribute('data-v-b1cec4bb', '');
  rangeFilter.setAttribute('data-v-e442821d', '');

  const header = document.createElement('div');
  header.className = 'stagemarkt-range-header';

  const title = document.createElement('span');
  title.className = 'stagemarkt-range-title';
  title.textContent = 'Bereik';

  const value = document.createElement('span');
  value.className = 'stagemarkt-range-value';
  value.textContent = `${getCurrentRangeValue()}`;

  header.appendChild(title);
  header.appendChild(value);

  const track = document.createElement('div');
  track.className = 'stagemarkt-range-track';

  const minLabel = document.createElement('span');
  minLabel.className = 'stagemarkt-range-min';
  minLabel.textContent = '5';

  const rangeInput = document.createElement('input');
  rangeInput.type = 'range';
  rangeInput.min = '5';
  rangeInput.max = '75';
  rangeInput.value = getCurrentRangeValue();
  rangeInput.setAttribute('aria-label', 'Filter van 5 tot 75');
  rangeInput.setAttribute('list', 'stagemarkt-range-values');

  const dataList = document.createElement('datalist');
  dataList.id = 'stagemarkt-range-values';
  allowedRangeValues.forEach((allowedValue) => {
    const option = document.createElement('option');
    option.value = String(allowedValue);
    dataList.appendChild(option);
  });

  const maxLabel = document.createElement('span');
  maxLabel.className = 'stagemarkt-range-max';
  maxLabel.textContent = '75';

  rangeInput.addEventListener('input', () => {
    const formattedValue = snapRangeValue(rangeInput.value);
    rangeInput.value = formattedValue;
    value.textContent = `${formattedValue}`;
  });

  rangeInput.addEventListener('change', () => {
    updateRangeInUrl(rangeInput.value);
  });

  track.appendChild(minLabel);
  track.appendChild(rangeInput);
  track.appendChild(maxLabel);

  rangeFilter.appendChild(header);
  rangeFilter.appendChild(track);
  rangeFilter.appendChild(dataList);

  keywordSearch.insertAdjacentElement('afterend', rangeFilter);
}

// --- Form copy/paste helpers ---
function isMessageField(el) {
  if (!el) return false;
  const name = (el.name || '').toLowerCase();
  const id = (el.id || '').toLowerCase();
  if (el.tagName === 'TEXTAREA') {
    if (name.includes('bericht') || name.includes('motivatie') || id.includes('bericht') || id.includes('motivatie')) {
      return true;
    }
  }
  return false;
}

function collectFormData(form) {
  const data = {};
  Array.from(form.elements).forEach((el) => {
    if (!el.name && !el.id) return;
    if (el.type === 'file') return;
    if (isMessageField(el)) return; // skip message/motivation field  

    const key = el.name || el.id;
    if (el.tagName === 'INPUT') {
      const type = (el.type || '').toLowerCase();
      if (type === 'checkbox') {
        data[key] = el.checked;
      } else if (type === 'radio') {
        if (el.checked) data[key] = el.value;
      } else {
        data[key] = el.value;
      }
    } else if (el.tagName === 'SELECT') {
      data[key] = el.value;
    } else if (el.tagName === 'TEXTAREA') {
      data[key] = el.value;
    }
  });
  return data;
}

function fillFormWithData(form, data) {
  if (!data) return;
  Array.from(form.elements).forEach((el) => {
    if (!el.name && !el.id) return;
    if (isMessageField(el)) return; // don't overwrite message

    const key = el.name || el.id;
    if (!(key in data)) return;

    try {
      if (el.tagName === 'INPUT') {
        const type = (el.type || '').toLowerCase();
        if (type === 'checkbox') {
          el.checked = !!data[key];
        } else if (type === 'radio') {
          el.checked = (el.value === data[key]);
        } else {
          el.value = data[key];
        }
      } else if (el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
        el.value = data[key];
      }
    } catch (e) {
      console.warn('[Stagemarkt+] Kon veld niet invullen', key, e);
    }
  });
}

function createFormButtons(form) {
  if (form.querySelector('.stagemarkt-copy-row')) return;

  const row = document.createElement('div');
  row.className = 'stagemarkt-copy-row';
  row.style.display = 'flex';
  row.style.gap = '8px';
  row.style.marginTop = '12px';

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'stagemarkt-action-button stagemarkt-copy-btn';
  copyBtn.textContent = 'Kopieer gegevens';

  const pasteBtn = document.createElement('button');
  pasteBtn.type = 'button';
  pasteBtn.className = 'stagemarkt-action-button stagemarkt-paste-btn';
  pasteBtn.textContent = 'Plak gegevens';

  copyBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const data = collectFormData(form);
    try {
      chrome.storage.local.set({ stagemarktSavedApplicant: data }, () => {
        copyBtn.textContent = 'Gekopieerd';
        setTimeout(() => (copyBtn.textContent = 'Kopieer gegevens'), 1200);
      });
    } catch (err) {
      console.error('[Stagemarkt+] Opslaan mislukt', err);
    }
  });

  pasteBtn.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.storage.local.get('stagemarktSavedApplicant', (res) => {
      const saved = res && res.stagemarktSavedApplicant;
      if (saved) {
        fillFormWithData(form, saved);
        pasteBtn.textContent = 'Gepakt';
        setTimeout(() => (pasteBtn.textContent = 'Plak gegevens'), 1200);
      } else {
        pasteBtn.textContent = 'Geen gegevens';
        setTimeout(() => (pasteBtn.textContent = 'Plak gegevens'), 1200);
      }
    });
  });

  row.appendChild(copyBtn);
  row.appendChild(pasteBtn);

  // Insert at the top of the form
  form.insertBefore(row, form.firstChild);
}

function injectFormButtonsIntoPage() {
  const forms = document.querySelectorAll('form');
  forms.forEach((form) => {
    // Only attach to forms that look like application forms (contain name/email/telefoon)
    const hasName = form.querySelector('input[name*="naam"], input[id*="naam"], input[placeholder*="naam"]');
    const hasEmail = form.querySelector('input[type="email"], input[name*="email"]');
    const hasPhone = form.querySelector('input[type="tel"], input[name*="telefoon"]');
    if (hasName || hasEmail || hasPhone) {
      createFormButtons(form);
    }
  });
}

// Observe DOM to attach buttons when forms render dynamically
const formObserver = new MutationObserver(debounce(() => {
  injectFormButtonsIntoPage();
}, 200));
formObserver.observe(document.documentElement, { childList: true, subtree: true });


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
  
  ensureStagemarktPageClass();
  startRangeFilterObserver();
  
  // Voer direct uit
  displayDateOnDetailPage();
  handleSearchPage();
  injectRangeFilter();
  
  // Herhaal elke 2 seconden voor dynamische content
  setInterval(() => {
    displayDateOnDetailPage();
    handleSearchPage();
    injectRangeFilter();
  }, 2000);
} else {
  console.log('[Stagemarkt+] Niet op stagemarkt.nl, script inactief');
}
