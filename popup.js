// Popupscript voor Stagemarkt+ extensie

document.getElementById('showDateButton').addEventListener('click', () => {
  const statusDiv = document.getElementById('status');
  const dateDisplay = document.getElementById('dateDisplay');
  const dateValue = document.getElementById('dateValue');
  
  // Haal het actieve tabblad op
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0].url.includes('stagemarkt.nl')) {
      statusDiv.textContent = 'Werkt alleen op stagemarkt.nl';
      statusDiv.className = 'status-error';
      return;
    }
    
    // Stuur bericht naar inhoudscript om plaatsingsdatum op te halen
    chrome.tabs.sendMessage(tabs[0].id, { action: 'getPostedDate' }, (response) => {
      if (response && response.postedDate) {
        const date = new Date(response.postedDate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const formattedDate = `${day}:${month}:${year}`;
        
        dateValue.textContent = formattedDate;
        dateDisplay.classList.remove('date-display-hidden');
        dateDisplay.classList.add('date-display-visible');
        statusDiv.textContent = 'Datum gevonden!';
        statusDiv.className = 'status-success';
      } else {
        statusDiv.textContent = 'Geen datum gevonden op deze pagina';
        statusDiv.className = 'status-warning';
      }
    });
  });
});

// Controleer of we op stagemarkt.nl zijn
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const url = tabs[0].url;
  if (!url.includes('stagemarkt.nl')) {
    document.getElementById('status').textContent = 'Open een stagemarkt.nl pagina';
    document.getElementById('status').className = 'status-info';
  }
});
