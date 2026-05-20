// Achtergrondservice worker voor Stagemarkt+ Extensie

console.log('Stagemarkt+ achtergrondservice worker geladen');

// Voer uit wanneer extensie is geïnstalleerd
chrome.runtime.onInstalled.addListener(() => {
  console.log('Stagemarkt+ Extensie geïnstalleerd');
});
