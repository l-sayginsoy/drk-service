import React, { useMemo, useState } from 'react';
import { Ticket, Status, Priority } from '../types';
// FIX: Changed AREAS to LOCATIONS_FOR_FILTER as AREAS is not exported from constants.
import { statusBgColorMap, LOCATIONS_FOR_FILTER, TECHNICIANS_DATA, STATUSES } from '../constants';
import { DocumentIcon } from './icons/DocumentIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { RefreshIcon } from './icons/RefreshIcon';


interface ReportsViewProps {
  tickets: Ticket[];
}

// Helper to parse German date format DD.MM.YYYY
const parseGermanDate = (dateStr: string | undefined): Date | null => {
    if (!dateStr || dateStr === 'N/A') return null;
    const parts = dateStr.split('.');
    if (parts.length === 3) {
        // new Date(year, monthIndex, day)
        return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    return null;
};

// --- Icon components defined locally for this view ---
const ExclamationTriangleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
);
const WrenchScrewdriverIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.495-2.495a1.125 1.125 0 0 1 1.591 0l3.001 3.001a1.125 1.125 0 0 1 0 1.591l-2.495 2.495m-5.832-5.832 2.495-2.495a1.125 1.125 0 0 0 0-1.591l-3.001-3.001a1.125 1.125 0 0 0-1.591 0l-2.495 2.495m5.832 5.832L9.25 17.25" />
    </svg>
);
const CheckCircleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

const StatCard: React.FC<{ title: string; value: string | number; description?: string; icon: React.ReactNode; iconBgColor: