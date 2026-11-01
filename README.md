# Revier 17

Ein Aufbau-Spiel im Browser: Du übernimmst ein heruntergekommenes Polizeirevier und bringst es auf Vordermann.

Das ganze Revier ist ein 3D-Modell (Three.js), das du drehen und zoomen kannst: Beamte, Hausmeister und Besucher laufen durch die Räume, Streifenwagen fahren mit Blaulicht zu Einsätzen, der Hubschrauber startet seinen Rotor, und jeder Raum bekommt mit jeder Ausbaustufe mehr Einrichtung.

## So spielst du

- **Geld vom Staat:** Du musst nichts anklicken, um Geld zu verdienen. Alle 5 Sekunden überweist der Staat dein Budget. Je mehr Räume in Betrieb sind und je besser dein Ruf ist, desto höher die Zuweisung.
- **Renovieren und ausbauen:** Tippe einen Raum an und investiere das Geld. Renovierte Räume erhöhen das Staatsbudget; jeder Raum hat 10 Ausbaustufen.
- **Einsätze:** Laufen automatisch. Freie Streifenbeamte fahren los; gelöste Fälle bringen eine Prämie, Erfahrung und Ruf. Sind zu wenige Streifen da, verfallen Einsätze und der Ruf sinkt.
- **Personal:** Streifenbeamte (mehr Einsätze gleichzeitig), Hausmeister (räumen Unordnung automatisch weg), Verwaltung (+15 % Staatsbudget je Kraft), Kommissar (schnellere Fälle, höhere Prämien).
- **Revierstufe:** Erfahrung lässt dein Revier aufsteigen, bringt eine Sonderzuweisung und schaltet neue Räume frei, bis zu Hubschrauberlandeplatz und Leitstelle.

Unordnung kommt mit der Zeit zurück und senkt das Budget eines Raums, bis ein Hausmeister sie wegräumt. Du kannst auch selbst auf Dreck tippen, das ist aber freiwillig. Der Spielstand wird automatisch im Browser gespeichert; während du weg bist, zahlt der Staat die Hälfte weiter (max. 2 Stunden).

## Starten

`index.html` im Browser öffnen. Three.js wird von cdn.jsdelivr.net geladen, dafür braucht es eine Internetverbindung.
