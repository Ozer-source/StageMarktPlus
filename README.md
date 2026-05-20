# Stagemarkt+ Browserextensie

Geeft plaatsingsdatums weer op stagemarkt.nl stageverzoeken die normaal verborgen zijn.

## Functies

- **Automatische weergave van datums op detailpagina's**: Wanneer u een stage bekijkt, wordt de "Datum Geplaatst" automatisch opgehaald en weergegeven
- **Verbetering zoekresultaten**: Toont datummarkeringen naast aanbiedingen op zoekresultatenpagina's  
- **Datumformat**: DD:MM:YYYY
- **Gegevensbron**: Haalt op uit JSON-LD schema in paginabron

## Hoe het werkt

stagemarkt.nl bevat plaatsingsdatums in de paginabron (JSON-LD schema) maar geeft deze niet weer op de website. Deze extensie:
1. Parseert het JSON-LD schema voor het `datePosted` veld
2. Formatteert het naar DD:MM:YYYY
3. Geeft het prominent weer op stagepagina's

## Installatie

### Voor Edge:
1. Open `edge://extensions/`
2. Schakel "Ontwikkelaarsmodus" in (linker zijbalk)
3. Klik op "Niet-verpakte extensie laden"
4. Selecteer deze extensiemap

### Voor Chrome:
1. Open `chrome://extensions/`
2. Schakel "Ontwikkelaarsmodus" in (rechts bovenin)
3. Klik op "Niet-verpakte extensie laden"
4. Selecteer deze extensiemap

## Gebruik

### Individuele stagepagina's
Wanneer u een stagepagina bezoekt (bijv. `stagemarkt.nl/stages/...`), verschijnt de plaatsingsdatum automatisch onder de jobbeschrijving.

### Zoekresultatenpagina's
Op zoekresultatenpagina's (bijv. `stagemarkt.nl/stages?...`) verschijnen datummarkeringen naast elke aanbieding.

### Popupknop
Klik op het extensiepictogram en gebruik de knop "Toon Datum Geplaatst" om handmatig de datum op de huidige pagina te controleren.
