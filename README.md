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

## Aktueller Stand – Version 0.1

Die erste Web-App ist umgesetzt. Sie bietet Mandantenverwaltung, manuelle Zeiterfassung, Bearbeiten und Löschen von Einträgen, Mandanten- und Datumsfilter, Gesamtdauer und abrechenbare Dauer sowie CSV-Export der gefilterten Einträge. Tätigkeiten werden aus einer vordefinierten Liste ausgewählt.

Die Oberfläche funktioniert auf Desktop und Smartphone. Die Daten werden im lokalen Browserspeicher (`localStorage`) gespeichert und bleiben beim Neuladen erhalten. Es gibt noch keine Anmeldung, gemeinsame Datenbank, Synchronisierung, Timer oder CSV-Importfunktion. Das Löschen der Browserdaten entfernt auch die Einträge; CSV-Exporte dienen der externen Sicherung und Weiterverarbeitung, können aber derzeit nicht wieder importiert werden. Verwenden Sie für diesen Prototyp ausschließlich fiktive Daten.

## Lokal starten

Voraussetzung: Node.js ab Version 20. Die Anwendung benötigt keine externen Pakete und keinen Installationsschritt.

```bash
cd /workspace/Erster-Versuch
npm start
```

Auf dem eigenen Computer wechseln Sie stattdessen in den heruntergeladenen Projektordner. Öffnen Sie dort nach dem Start `http://localhost:3000` im Browser. Der Server lauscht standardmäßig nur lokal. Port und Bind-Adresse können über `PORT` und `HOST` angepasst werden. In der Cloud ist diese lokale Adresse kein öffentlich erreichbarer Link.

## Anwendung benutzen

1. Unter „Mandanten verwalten“ einen fiktiven Mandanten anlegen.
2. Mandant, Datum, Dauer in Minuten, Tätigkeit und Mitarbeiter angeben.
3. Optional eine Leistungsbeschreibung ergänzen und die Abrechenbarkeit auswählen.
4. „Eintrag speichern“ wählen. Die Übersicht und Summen aktualisieren sich sofort.
5. Einträge bei Bedarf bearbeiten oder nach Bestätigung löschen.
6. Die Übersicht nach Mandant oder Zeitraum filtern und die Auswahl als CSV exportieren.

Die Summen beziehen sich immer auf die aktuelle Filterauswahl. Einträge und Mandantennamen werden als Text angezeigt. Der CSV-Export verwendet Semikolons und UTF-8 mit BOM; potenzielle Tabellenformeln werden als Text markiert.

## Tests

```bash
npm test
```

Die automatisierten Tests prüfen Eingabevalidierung, Mandanten- und Datumsfilter, Zeitberechnung und CSV-Maskierung. Der erste Entwicklungsstand wurde außerdem in Chromium mit Anlegen, Erfassen, Bearbeiten, Neuladen, Filtern, Exportieren und Löschen sowie mobiler Darstellung geprüft.

## Nächste Ausbaustufen

- Timer zum Starten und Stoppen einer Leistung.
- Benutzeranmeldung und rollenbasierte Zugriffsrechte.
- Serverseitige Datenbank mit Sicherung und Wiederherstellung.
- Gemeinsame Nutzung durch mehrere Mitarbeiter.
- Mandanten- und Tätigkeitsverwaltung mit Bearbeitung und Archivierung.

Vor einer Nutzung mit echten Kanzleidaten sind insbesondere Zugriffsschutz, Datensicherung und Datenschutz fachlich und technisch zu prüfen.
