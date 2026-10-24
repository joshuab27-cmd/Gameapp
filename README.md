# Revier 13 🚓

Ein Browser-Spiel, in dem du eine heruntergekommene Polizeistation auf Vordermann bringst –
von der **Bruchbude** bis zum **Hightech-Präsidium**.

## Spielen

`index.html` im Browser öffnen – fertig. Kein Build-Schritt, keine Abhängigkeiten.
Lokal z. B. mit:

```bash
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

Läuft auf Desktop und Handy (lässt sich über „Zum Startbildschirm hinzufügen“ wie eine App installieren).
Der Spielstand wird automatisch im Browser gespeichert.

## So funktioniert's

- 🧹 **Aufräumen:** Tippe auf Müll, Spinnweben, Ziegel und Pfützen in den Räumen. Manche brauchen mehrere Treffer.
- 🔨 **Renovieren:** Ein aufgeräumter Raum kann renoviert werden – in fünf Stufen:
  *Kaputt → Notdürftig → Renoviert → Modern → Hightech*. Jede Stufe sieht anders aus.
- 📻 **Einsätze:** Die Leitstelle meldet Einsätze. Schicke deine Beamten los und verdiene Geld (💶) und Ruf (⭐).
  Unbearbeitete Meldungen kosten Ruf.
- ⭐ **Ruf:** Größere Umbauten genehmigt das Präsidium erst ab einem bestimmten Ruf.
- 👮 **Personal:** Stelle weitere Beamte ein – dafür brauchst du Platz im Büro.
- 🎲 **Ereignisse:** Rohrbrüche, Spenden, Zeitungsberichte und Inspektionen sorgen für Abwechslung.

## Räume

| Raum | Wirkung |
|---|---|
| 🛎️ Empfang | Mehr Ruf pro Einsatz, schaltet Diebstahlsanzeigen frei |
| 🗂️ Büro | Mehr Platz für Beamte |
| 📡 Leitstelle | Mehr und häufigere Meldungen, ab „Renoviert“ automatische Zuweisung, ab „Modern“ Großeinsätze |
| 🔒 Zellen | Schaltet Festnahmen frei |
| 🎙️ Verhörraum | Schaltet Verhöre frei |
| 📦 Asservaten | Höhere Belohnungen |
| 🔬 Kriminallabor | Schaltet Spurensicherung und Einbruchserien frei |
| 🚓 Fuhrpark | Kürzere Einsatzdauer |
| ☕ Kantine | Bessere Moral: mehr Geld und Ruf |

Ziel: Alle Räume auf **Hightech** bringen.

## Dateien

- `index.html` – Grundgerüst
- `style.css` – Aussehen der Räume in allen Ausbaustufen
- `game.js` – Spiellogik
