# Amazon Checkout Restock-Check

Ein Userscript (Violentmonkey/Tampermonkey), das auf der Amazon-Checkout-Seite so lange automatisch neu lädt, bis ein zuvor nicht verfügbarer Artikel wieder bestellbar ist – und dann einen deutlichen Dauer-Alarm auslöst.

## Was es macht

Nach dem Laden der Checkout-Seite prüft das Skript, ob eine der bekannten „nicht verfügbar"-Meldungen im Seitentext steht:

- „nicht mehr verfügbar"
- „maximal verfügbare Menge"
- „Es gab ein Problem mit einigen Artikeln"

Ist eine dieser Meldungen vorhanden, wird die Seite nach einer zufälligen Wartezeit (10–25 Sekunden) neu geladen. Die Zufallspause soll ein Reload-Muster vermeiden. Verschwindet die Meldung, gilt der Artikel als verfügbar und der Alarm startet.

## Alarm

Sobald der Artikel verfügbar ist, passiert Folgendes gleichzeitig:

- **Desktop-Benachrichtigung** über `GM_notification` (nur im Echtbetrieb, kein Timeout).
- **Beep** – ein 880-Hz-Ton alle 2 Sekunden über die Web Audio API.
- **Fullscreen-Flash** – ein grünes Overlay über der gesamten Seite blinkt im halben-Sekunden-Takt. Das Overlay hat `pointer-events:none`, du kannst also währenddessen ganz normal weiter klicken und bestellen.
- **Blinkender Tab-Titel**, damit der Alarm auch im Hintergrund-Tab sichtbar ist.
- Ein **Banner oben** mit Bestätigungs-Button.

Der Alarm läuft dauerhaft, bis du auf **Ack** klickst. Danach verstummt der Ton, das Blinken hört auf, und das Banner bleibt als Bestätigung stehen.

### Ton-Freigabe

Browser blockieren Audio ohne vorherige Nutzer-Interaktion. Wenn der Beep deshalb nicht startet, erscheint im Banner der Button **🔊 Ton aktivieren** – ein Klick darauf gibt den Sound frei.

## Testmodus

Über das Userscript-Menü gibt es den Befehl **Alarm testen**. Damit lässt sich der komplette Alarm (Overlay, Beep, Banner) ohne echtes Verfügbarkeits-Ereignis auslösen – nützlich, um vorab zu prüfen, ob Ton und Benachrichtigung funktionieren. Im Testmodus ist das Overlay orange statt grün, und das Banner verschwindet beim Ack vollständig.

## Installation

1. Violentmonkey oder Tampermonkey im Browser installieren.
2. Die Datei `amazon-checkout-restock-check.user.js` im Dashboard als neues Skript importieren (oder den Inhalt in ein neues Skript einfügen).
3. Speichern. Das Skript wird auf folgenden Seiten aktiv:
   - `https://www.amazon.de/gp/buy/*`
   - `https://www.amazon.de/checkout/*`

## Konfiguration

Die wichtigsten Werte stehen oben im Skript:

| Konstante | Standard | Bedeutung |
|---|---|---|
| `MIN_MS` / `MAX_MS` | 10000 / 25000 | Zufalls-Bereich für die Reload-Pause (ms) |
| `BEEP_INTERVAL_MS` | 2000 | Abstand zwischen den Beeps (ms) |
| `FLASH_INTERVAL_MS` | 500 | Takt des Flash-/Titel-Blinkens (ms) |
| `ERROR_PATTERNS` | s. o. | Textmuster, die „nicht verfügbar" signalisieren |

Wenn Amazon den Wortlaut seiner Fehlermeldungen ändert, müssen die Einträge in `ERROR_PATTERNS` angepasst werden, sonst erkennt das Skript den Zustand nicht mehr.

## Hinweise

- Das Skript automatisiert **nur das Neuladen und den Alarm** – der eigentliche Bestellvorgang bleibt manuell.
- Die Erkennung basiert auf dem sichtbaren Seitentext; bei Layout- oder Text-Änderungen von Amazon kann eine Anpassung nötig sein.
