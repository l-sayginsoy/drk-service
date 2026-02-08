export enum Status {
  Offen = 'Offen',
  InArbeit = 'In Arbeit',
  Ueberfaellig = 'Überfällig',
  Abgeschlossen = 'Abgeschlossen',
}

export enum Priority {
  Hoch = 'Hoch',
  Mittel = 'Mittel',
  Niedrig = 'Niedrig',
}

export enum Role {
  Admin = 'admin',
  Technician = 'techniker',
}

export interface User {
  id: string;
  name: string;
  role: Role;
  password?: string;
  isActive: boolean;
}

export interface AppArea {
  id: string;
  name: string;
  isActive: boolean;
}

export interface Technician {
    name: string;
}

export type GroupableKey = 'status' | 'technician' | 'priority' | 'area';


export interface Ticket {
  id: string;
  title: string;
  area: string;
  location: string;
  reporter: string;
  entryDate: string;
  dueDate: string;
  status: Status;
  technician: string;
  priority: Priority;
  completionDate?: string; // Datum, an dem das Ticket abgeschlossen wurde
  wunschTermin?: string; // Optionaler Wunschtermin vom Melder
  photos?: string[]; // Array von Base64-kodierten Bildern
  description?: string;
  notes?: string[];
  reporterEmail?: string; // Optional: E-Mail des Melders für Benachrichtigungen
  hasNewNoteFromReporter?: boolean; // Optional: Flag für neue Notizen vom Melder
}