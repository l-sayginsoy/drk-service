import { Ticket, Status, Priority, User, Role, AppArea } from './types';

export const MOCK_TICKETS: Ticket[] = [
  {
    id: 'M-31001',
    title: 'DRINGEND: Heizungsausfall im Wohnhaus A',
    area: 'Kreisverband',
    location: 'Wohnhaus A, Gesamtes Gebäude',
    reporter: 'Fr. Dr. Richter',
    entryDate: '06.02.2026',
    dueDate: '06.02.2026',
    status: Status.Ueberfaellig,
    technician: 'N/A',
    priority: Priority.Hoch,
    description: "Kompletter Heizungsausfall im Wohnhaus A. Bewohner frieren. Benötigen sofortige Entsendung eines Technikers. Höchste Priorität!",
    notes: ["Sofortige Eskalation an alle verfügbaren Techniker. (Admin am 06.02.2026, 08:15)"]
  },
  {
    id: 'M-31002',
    title: 'Wasserhahn in der Hauptküche tropft stark',
    area: 'Küche',
    location: 'Spülbereich 1',
    reporter: 'Peter Koch',
    entryDate: '05.02.2026',
    dueDate: '12.02.2026',
    status: Status.InArbeit,
    technician: 'Heiko Saupert',
    priority: Priority.Mittel,
    description: "Der Wasserhahn am Hauptwaschbecken schließt nicht mehr richtig und es geht permanent Wasser verloren.",
    notes: []
  },
  {
    id: 'M-31003',
    title: 'Handlauf im Flur vor Zimmer 205 ist locker',
    area: 'An den Seen',
    location: 'Flur, 2. OG West',
    reporter: 'Schwester Maria',
    entryDate: '06.02.2026',
    dueDate: '10.02.2026',
    status: Status.Offen,
    technician: 'N/A',
    priority: Priority.Hoch,
    description: "Sturzgefahr für Bewohner. Bitte umgehend befestigen.",
    notes: []
  },
  {
    id: 'M-31004',
    title: 'WLAN in der Verwaltung ausgefallen',
    area: 'Verwaltung',
    location: 'Gesamter Verwaltungstrakt',
    reporter: 'Anna Schmidt',
    entryDate: '07.02.2026',
    dueDate: '08.02.2026',
    status: Status.Offen,
    technician: 'Torsten Isselhard',
    priority: Priority.Mittel,
    description: "Seit heute Morgen kein Zugriff auf das WLAN möglich. Router wurde bereits neu gestartet, ohne Erfolg.",
    notes: []
  },
  {
    id: 'M-31005',
    title: 'Abfluss von Industriewaschmaschine verstopft',
    area: 'Wäscherei',
    location: 'Maschine 3',
    reporter: 'Fatima Yilmaz',
    entryDate: '03.02.2026',
    dueDate: '05.02.2026',
    status: Status.Ueberfaellig,
    technician: 'Ali Najafi',
    priority: Priority.Hoch,
    description: "Wasser läuft beim Abpumpen über. Betrieb in der Wäscherei ist stark beeinträchtigt.",
    notes: ["Ali prüft das heute. (Admin am 04.02.2026, 09:00)"]
  },
  {
    id: 'M-31006',
    title: 'Deckenleuchte über Tisch 4 flackert',
    area: 'Cafeteria',
    location: 'Sitzbereich',
    reporter: 'Gast',
    entryDate: '07.02.2026',
    dueDate: '14.02.2026',
    status: Status.Offen,
    technician: 'N/A',
    priority: Priority.Niedrig,
    description: "",
    notes: []
  },
  {
    id: 'M-31007',
    title: 'Pflegebett lässt sich nicht mehr verstellen',
    area: 'An den Seen',
    location: 'Zimmer 312, Bett 1',
    reporter: 'Pfleger Tom',
    entryDate: '06.02.2026',
    dueDate: '09.02.2026',
    status: Status.InArbeit,
    technician: 'Heiko Saupert',
    priority: Priority.Hoch,
    description: "Die elektrische Höhenverstellung des Pflegebettes reagiert nicht mehr.",
    notes: []
  },
  {
    id: 'M-31008',
    title: 'Holzlatte an Parkbank gebrochen',
    area: 'Außenbereich',
    location: 'Nähe Haupteingang',
    reporter: 'H. Gärtner',
    entryDate: '01.02.2026',
    dueDate: '15.02.2026',
    status: Status.InArbeit,
    technician: 'Ali Najafi',
    priority: Priority.Niedrig,
    description: "",
    notes: []
  },
  {
    id: 'M-31009',
    title: 'Drucker im Büro der Sozialstation druckt nicht',
    area: 'Sozialstation',
    location: 'Büro EG',
    reporter: 'Frau Meier',
    entryDate: '04.02.2026',
    dueDate: '08.02.2026',
    status: Status.InArbeit,
    technician: 'Torsten Isselhard',
    priority: Priority.Mittel,
    description: "Fehlermeldung 'Papierstau', obwohl kein Papier feststeckt.",
    notes: []
  },
  {
    id: 'M-31010',
    title: 'Turnusmäßige Prüfung Feuerlöscher',
    area: 'Brandschutz',
    location: 'Alle Flure',
    reporter: 'System',
    entryDate: '28.01.2026',
    dueDate: '28.02.2026',
    status: Status.InArbeit,
    technician: 'Heiko Saupert',
    priority: Priority.Niedrig,
    description: "Monatliche Sichtprüfung aller Feuerlöscher im Untergeschoss.",
    notes: []
  },
  {
    id: 'M-31011',
    title: 'Steckdose an der Bühne hat Wackelkontakt',
    area: 'Kleiner Saal',
    location: 'Bühne links',
    reporter: 'Veranstaltungsteam',
    entryDate: '02.02.2026',
    dueDate: '06.02.2026',
    status: Status.Ueberfaellig,
    technician: 'Torsten Isselhard',
    priority: Priority.Mittel,
    description: "Strom fällt bei Benutzung aus. Bitte prüfen.",
    notes: []
  },
  {
    id: 'M-31012',
    title: 'Fenster zum Terrassenzugang klemmt',
    area: 'Terrasse',
    location: 'Übergang Cafeteria',
    reporter: 'Servicekraft',
    entryDate: '07.02.2026',
    dueDate: '13.02.2026',
    status: Status.Offen,
    technician: 'N/A',
    priority: Priority.Niedrig,
    description: "Fenster lässt sich nur mit sehr hohem Kraftaufwand öffnen und schließen.",
    notes: []
  },
  {
    id: 'M-31013',
    title: 'Klimaanlage im Schulungsraum zu kalt eingestellt',
    area: 'Ausbildung',
    location: 'Schulungsraum 2',
    reporter: 'Dozent Herr Weiss',
    entryDate: '05.02.2026',
    dueDate: '11.02.2026',
    status: Status.InArbeit,
    technician: 'Ali Najafi',
    priority: Priority.Mittel,
    description: "Die Temperatur lässt sich am Thermostat nicht regeln, es ist dauerhaft zu kühl.",
    notes: []
  },
  {
    id: 'M-31014',
    title: 'Wand im Aufenthaltsraum neu streichen',
    area: 'An den Seen',
    location: 'Aufenthaltsraum 3. OG',
    reporter: 'Stationsleitung',
    entryDate: '20.01.2026',
    dueDate: '03.02.2026',
    status: Status.Abgeschlossen,
    technician: 'Heiko Saupert',
    priority: Priority.Niedrig,
    completionDate: '04.02.2026',
    notes: ["Farbe wurde geliefert. (HS am 01.02.2026, 14:00)", "Arbeiten abgeschlossen. (HS am 04.02.2026, 16:30)"]
  },
  {
    id: 'M-31015',
    title: 'Schwesternrufanlage in Zimmer 101 defekt',
    area: 'Schlosspark',
    location: 'Zimmer 101',
    reporter: 'Pflegepersonal',
    entryDate: '28.01.2026',
    dueDate: '30.01.2026',
    status: Status.Abgeschlossen,
    technician: 'Torsten Isselhard',
    priority: Priority.Hoch,
    completionDate: '29.01.2026',
    notes: ["Ersatzteil bestellt. (TI am 28.01.2026, 11:00)", "Anlage funktioniert wieder einwandfrei. (TI am 29.01.2026, 09:45)"]
  }
];

export const MOCK_USERS: User[] = [
    { id: 'user-1', name: 'Admin', role: Role.Admin, password: 'admin', isActive: true },
    { id: 'user-2', name: 'Heiko Saupert', role: Role.Technician, password: '123', isActive: true },
    { id: 'user-3', name: 'Ali Najafi', role: Role.Technician, password: '123', isActive: true },
    { id: 'user-4', name: 'Torsten Isselhard', role: Role.Technician, password: '123', isActive: true },
    { id: 'user-5', name: 'Max Mustermann (Inaktiv)', role: Role.Technician, password: '123', isActive: false },
];

// FIX: Export TECHNICIANS_DATA to be used across components
export const TECHNICIANS_DATA: User[] = MOCK_USERS.filter(u => u.role === Role.Technician);


export const BEREICH_OPTIONS = ["Schlosspark", "Ebertpark", "Rheinufer", "An den Seen", "Küche", "Cafeteria", "Wäscherei", "Reinigung", "Untergeschoss", "Verwaltung", "Ausbildung", "Kleiner Saal", "Außenbereich", "Terrasse", "Baumhaus", "Kreisverband", "Sozialstation", "Brandschutz", "Sicherheit", "Sonstiges"];
// FIX: Export AREAS for use in filters, including an "Alle" option.
export const AREAS = ['Alle', ...BEREICH_OPTIONS];
export const MOCK_AREAS: AppArea[] = BEREICH_OPTIONS.map((name, index) => ({
    id: `area-${index + 1}`,
    name,
    isActive: true,
}));

export const PRIORITIES = ['Alle', 'Hoch', 'Mittel', 'Niedrig'];
export const STATUSES = ['Alle', 'Offen', 'In Arbeit', 'Überfällig', 'Abgeschlossen'];

// =============================================
// Centralized Status Color Configuration
// =============================================

export const statusColorMap: Record<Status, string> = {
  [Status.Offen]: '--text-muted',
  [Status.InArbeit]: '--accent-primary',
  [Status.Ueberfaellig]: '--accent-danger',
  [Status.Abgeschlossen]: '--accent-success',
};

export const statusBgColorMap: Record<Status, string> = {
  [Status.Offen]: 'rgba(108, 117, 125, 0.1)',
  [Status.InArbeit]: 'rgba(0, 123, 255, 0.1)',
  [Status.Ueberfaellig]: 'rgba(220, 53, 69, 0.1)',
  [Status.Abgeschlossen]: 'rgba(40, 167, 69, 0.1)',
};

export const statusBorderColorMap: Record<Status, string> = {
  [Status.Offen]: 'rgba(108, 117, 125, 0.3)',
  [Status.InArbeit]: 'rgba(0, 123, 255, 0.3)',
  [Status.Ueberfaellig]: 'rgba(220, 53, 69, 0.3)',
  [Status.Abgeschlossen]: 'rgba(40, 167, 69, 0.3)',
};