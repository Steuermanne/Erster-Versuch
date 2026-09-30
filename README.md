# Zeiterfassung für Steuerberater

Eine Anwendung zur einfachen und nachvollziehbaren Erfassung von Arbeitszeiten in Steuerberatungskanzleien. Zeiten sollen Mandanten und Tätigkeiten zugeordnet werden können, um die interne Auswertung und die Vorbereitung der Abrechnung zu unterstützen.

## Projektziel

Die Anwendung soll den täglichen Aufwand der Zeiterfassung reduzieren und einen Überblick darüber geben, welche Leistungen für welche Mandanten erbracht wurden.

## Geplante Funktionen

- Arbeitszeiten über eine Start-/Stopp-Funktion oder manuell erfassen.
- Zeiteinträge einem Mandanten und einer Tätigkeit zuordnen, beispielsweise Finanzbuchhaltung, Lohnbuchhaltung, Jahresabschluss oder Steuererklärung.
- Datum, Dauer und eine kurze Leistungsbeschreibung festhalten.
- Abrechenbare und nicht abrechenbare Zeiten unterscheiden.
- Eigene Zeiteinträge prüfen und bearbeiten.
- Zeiten nach Zeitraum, Mandant und Mitarbeiter auswerten.
- Auswertungen als CSV für die weitere Verarbeitung exportieren.

## Beispiel für einen Zeiteintrag

| Feld | Beispiel |
| --- | --- |
| Datum | 30.09.2026 |
| Mitarbeiter | Erika Beispiel |
| Mandant | Muster GmbH (fiktiv) |
| Tätigkeit | Finanzbuchhaltung |
| Dauer | 45 Minuten |
| Beschreibung | Belege für September geprüft und gebucht |
| Abrechenbar | Ja |

## Geplanter erster Entwicklungsumfang

1. Mandanten und Tätigkeiten verwalten.
2. Arbeitszeiten manuell erfassen und in einer Liste anzeigen.
3. Zeiteinträge bearbeiten und nach Mandant oder Zeitraum filtern.
4. Gesamtdauer berechnen und als CSV exportieren.

Weitere Funktionen wie Timer, Benutzerverwaltung und Rollen können anschließend ergänzt werden.

## Datenschutz und Zugriff

Mandantenbezogene Angaben und Arbeitszeiten sind vertraulich. Bei der Umsetzung müssen geeignete Zugriffsrechte, sichere Speicherung und die geltenden Datenschutzanforderungen berücksichtigt werden. Für Entwicklung und Tests sollen ausschließlich fiktive Daten verwendet werden. Passwörter, API-Schlüssel und andere Zugangsdaten dürfen nicht im Repository gespeichert werden.

## Aktueller Stand

Das Projekt befindet sich in der Planungsphase. Diese README beschreibt die vorgesehenen Funktionen; eine ausführbare Anwendung ist noch nicht vorhanden.

Technologie, Installation, Startbefehle und Tests werden dokumentiert, sobald die technische Grundlage festgelegt und umgesetzt ist.
