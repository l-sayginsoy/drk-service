import React, { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Ticket, Status, Priority, Role, GroupableKey } from './types';
import { MOCK_TICKETS, AREAS, TECHNICIANS_DATA, STATUSES } from './constants';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import KanbanBoard from './components/KanbanBoard';
import NewTicketModal from './components/NewTicketModal';
import Portal from './components/Portal';
import TicketTableView from './components/TicketTableView';
import TicketDetailSidebar from './components/TicketDetailSidebar';
import BulkActionBar from './components/BulkActionBar';
import ErledigtTableView from './components/ErledigtTableView';
import ReportsView from './components/ReportsView';

const LOCAL_STORAGE_KEY = 'facility-management-tickets';

const parseGermanDate = (dateStr: string): Date | null => {
    if (!dateStr || dateStr === 'N/A') return null;
    const parts = dateStr.split('.');
    if (parts.length === 3) {
        return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    return null;
};

const getFutureDateInGermanFormat = (days: number): string => {
    const today = new Date('2026-02-07');
    today.setDate(today.getDate() + days);
    return today.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Helper to get date as YYYY-MM-DD for filenames
const getFormattedDate = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<{ displayName: string; role: Role } | null>(() => {
    try {
      const savedUser = window.localStorage.getItem('currentUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error("Could not load user from localStorage", error);
      return null;
    }
  });

  const [tickets, setTickets] = useState<Ticket[]>(() => {
    try {
      const savedTickets = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedTickets) return JSON.parse(savedTickets);
    } catch (error) {
      console.error("Konnte Tickets nicht aus dem localStorage laden.", error);
    }
    return MOCK_TICKETS;
  });

  const [filters, setFilters] = useState({ area: 'Alle', technician: 'Alle', priority: 'Alle', status: 'Alle', search: '' });
  const [groupBy, setGroupBy] = useState<GroupableKey | 'none'>('none');
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState('light');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  useEffect(() => {
    try {
        if (currentUser) window.localStorage.setItem('currentUser', JSON.stringify(currentUser));
        else window.localStorage.removeItem('currentUser');
    } catch (error) { console.error("Could not save user to localStorage", error); }
  }, [currentUser]);
  
  useEffect(() => {
    const checkAndSetOverdueTickets = () => {
        const today = new Date('2026-02-07');
        today.setHours(0, 0, 0, 0);
        setTickets(currentTickets => {
            let hasChanged = false;
            const checkedTickets = currentTickets.map(ticket => {
                if (ticket.status === Status.Offen || ticket.status === Status.InArbeit) {
                    const dueDate = parseGermanDate(ticket.dueDate);
                    if (dueDate && dueDate < today) {
                        hasChanged = true;
                        return { ...ticket, status: Status.Ueberfaellig };
                    }
                }
                return ticket;
            });
            return hasChanged ? checkedTickets : currentTickets;
        });
    };
    checkAndSetOverdueTickets();
    const intervalId = setInterval(checkAndSetOverdueTickets, 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    try { window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tickets)); }
    catch (error) { console.error("Konnte Tickets nicht im localStorage speichern.", error); }
  }, [tickets]);

  useEffect(() => {
    if (currentUser?.role === Role.Technician && currentUser.displayName && currentView === 'tickets') {
      setFilters(prev => ({ ...prev, technician: currentUser.displayName }));
    }
  }, [currentUser, currentView]);

  const handleTicketUpdate = (updatedTicket: Ticket) => {
    const originalTicket = tickets.find(t => t.id === updatedTicket.id);
    if (!originalTicket) return;

    // Simulate email notification for status change
    const statusWasChanged = originalTicket.status !== updatedTicket.status;
    if (statusWasChanged && updatedTicket.reporterEmail) {
        console.log(`[E-Mail-Simulation] Sende E-Mail an: ${updatedTicket.reporterEmail}`);
        console.log(`Betreff: Status-Update für Ihr Ticket ${updatedTicket.id}`);
        console.log(`Nachricht: Der Status Ihres Tickets "${updatedTicket.title}" wurde auf "${updatedTicket.status}" geändert.`);
        if(updatedTicket.status === Status.Abgeschlossen) {
             console.log('Nachricht: Der Auftrag wurde erfolgreich abgeschlossen.');
        }
    }

    let finalTicket = { ...updatedTicket };
    const today = new Date('2026-02-07'); today.setHours(0, 0, 0, 0);
    const todayStr = today.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    if (statusWasChanged && (originalTicket.status === Status.Offen || originalTicket.status === Status.Ueberfaellig) && finalTicket.status === Status.InArbeit) {
        finalTicket.dueDate = getFutureDateInGermanFormat(3);
    } else if (statusWasChanged && finalTicket.status === Status.Abgeschlossen) {
        finalTicket.completionDate = todayStr;
    } else if (statusWasChanged && originalTicket.status === Status.Abgeschlossen) {
        finalTicket.completionDate = undefined;
        finalTicket.dueDate = getFutureDateInGermanFormat(3);
    }
    const finalDueDate = parseGermanDate(finalTicket.dueDate);
    if (finalTicket.status !== Status.Abgeschlossen) {
        if (finalDueDate && finalDueDate < today) finalTicket.status = Status.Ueberfaellig;
        else if (finalTicket.status === Status.Ueberfaellig && finalDueDate && finalDueDate >= today) finalTicket.status = Status.InArbeit;
    }
    setTickets(prev => prev.map(t => t.id === finalTicket.id ? finalTicket : t));
    if (selectedTicket && selectedTicket.id === finalTicket.id) setSelectedTicket(finalTicket);
  };

  const handleAddNewTicket = (newTicketData: Omit<Ticket, 'id' | 'entryDate' | 'status'>): string => {
    const newTicketId = `M-${Math.floor(Math.random() * 10000) + 30000}`;
    const newTicket: Ticket = {
      ...newTicketData,
      id: newTicketId,
      entryDate: new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      status: Status.Offen,
      priority: newTicketData.priority || Priority.Mittel,
      technician: newTicketData.technician || 'N/A',
      notes: newTicketData.notes || [],
      hasNewNoteFromReporter: false,
    };
    setTickets(prevTickets => [newTicket, ...prevTickets]);
    setIsModalOpen(false);
    return newTicketId;
  };
  
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
        if (currentView === 'reports') return true;
        const searchLower = filters.search.toLowerCase();
        if (filters.search && !ticket.title.toLowerCase().includes(searchLower) && !ticket.id.toLowerCase().includes(searchLower) && !ticket.area.toLowerCase().includes(searchLower)) return false;
        if (filters.area !== 'Alle' && ticket.area !== filters.area) return false;
        if (filters.technician !== 'Alle' && ticket.technician !== filters.technician) return false;
        if (filters.priority !== 'Alle' && ticket.priority !== filters.priority) return false;
        if (currentView === 'erledigt') {
            if (filters.status !== 'Alle' && ticket.status !== filters.status) return false;
            return ticket.status === Status.Abgeschlossen;
        }
        if (ticket.status === Status.Abgeschlossen) return false;
        if ((currentView === 'tickets' || currentView === 'dashboard') && filters.status !== 'Alle' && ticket.status !== filters.status) return false;
        return true;
    });
  }, [tickets, filters, currentView]);
  
  const stats = useMemo(() => ({
      open: tickets.filter(t => t.status === Status.Offen).length,
      inProgress: tickets.filter(t => t.status === Status.InArbeit).length,
      overdue: tickets.filter(t => t.status === Status.Ueberfaellig).length,
  }), [tickets]);

  const allAreas = AREAS;
  const allTechnicians = useMemo(() => ['N/A', ...TECHNICIANS_DATA.map(t => t.name)], []);
  
  const techniciansForFilter = useMemo(() => {
      const allTechniciansWithOptions = ['Alle', ...allTechnicians];
      if (currentUser?.role === Role.Technician) {
          return allTechniciansWithOptions.filter(name => name !== currentUser.displayName);
      }
      return allTechniciansWithOptions;
  }, [allTechnicians, currentUser]);


  const changeView = (view: string) => {
    if (['dashboard', 'reports'].includes(view) && currentUser?.role !== Role.Admin) {
      alert('Keine Berechtigung, auf diese Seite zuzugreifen.');
      return;
    }
    setFilters(prev => ({ ...prev, status: 'Alle', search: '' }));
    setGroupBy('none'); setSelectedTicketIds([]); setCurrentView(view);
  };

  const statusesForFilter = useMemo(() => {
      if (currentView === 'tickets' || currentView === 'dashboard') return ['Alle', Status.Offen, Status.InArbeit, Status.Ueberfaellig];
      return STATUSES;
  }, [currentView]);

  const handleBulkUpdate = (property: keyof Ticket, value: any) => {
    const todayStr = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    setTickets(prev => prev.map(ticket => {
        if (selectedTicketIds.includes(ticket.id)) {
            const updated = { ...ticket, [property]: value };
            if (property === 'status' && value === Status.Abgeschlossen) updated.completionDate = todayStr;
            handleTicketUpdate(updated); // Reuse logic for single update to trigger notifications
            return updated;
        }
        return ticket;
    }));
    setSelectedTicketIds([]);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Sind Sie sicher, dass Sie ${selectedTicketIds.length} Tickets löschen möchten?`)) {
        setTickets(prev => prev.filter(ticket => !selectedTicketIds.includes(ticket.id)));
        setSelectedTicketIds([]);
    }
  };
  
  const handleExportCSV = async () => {
      const headers = ["ID", "Titel", "Bereich", "Ort", "Melder", "Eingangsdatum", "Fälligkeitsdatum", "Status", "Techniker", "Priorität", "Abschlussdatum", "Beschreibung"];
      const rows = filteredTickets.map(t => [t.id, `"${t.title.replace(/"/g, '""')}"`, t.area, t.location, t.reporter, t.entryDate, t.dueDate, t.status, t.technician, t.priority, t.completionDate || 'N/A', `"${t.description ? t.description.replace(/"/g, '""').replace(/\n/g, ' ') : ''}"`].join(','));
      const csvString = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
      const fileName = `Ticket_Uebersicht_${getFormattedDate()}.csv`;

      if ((window as any).showSaveFilePicker) {
          try {
              const handle = await (window as any).showSaveFilePicker({
                  suggestedName: fileName,
                  types: [{ description: 'CSV-Datei', accept: { 'text/csv': ['.csv'] } }],
              });
              const writable = await handle.createWritable();
              await writable.write(blob);
              await writable.close();
          } catch (err) {
              console.log('Speichern abgebrochen.', err);
          }
      } else {
          // Fallback für ältere Browser
          const link = document.createElement("a");
          const url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", fileName);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
      }
  };
  
  const handleExportPDF = async () => {
    const doc = new jsPDF();
    const head = [['ID', 'Betreff', 'Bereich', 'Techniker', 'Prio', 'Eingang', 'Fällig']];
    const groupedByStatus = filteredTickets.reduce((acc, ticket) => {
        if (!acc[ticket.status]) acc[ticket.status] = [];
        acc[ticket.status].push(ticket);
        return acc;
    }, {} as Record<Status, Ticket[]>);

    const activeFilters = Object.entries(filters).filter(([, val]) => val !== 'Alle' && val !== '').map(([key, val]) => `${key}: ${val}`).join(', ');
    doc.text(`Ticket Übersicht - Export: ${new Date().toLocaleDateString('de-DE')}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Aktive Filter: ${activeFilters || 'Keine'}`, 14, 22);

    let startY = 30;
    const statusOrder = [Status.Ueberfaellig, Status.InArbeit, Status.Offen, Status.Abgeschlossen];

    statusOrder.forEach(status => {
        if (groupedByStatus[status]) {
            const ticketsInGroup = groupedByStatus[status];
            const body = ticketsInGroup.map(t => [t.id, t.title, t.area, t.technician, t.priority, t.entryDate, t.dueDate]);
            
            autoTable(doc, {
                head,
                body,
                startY,
                didDrawPage: (data: any) => { data.settings.margin.top = 10; },
                headStyles: { 
                    fillColor: '#0d6efd',
                    textColor: '#ffffff',
                    fontStyle: 'bold'
                },
                willDrawPage: (data: any) => {
                     doc.setFontSize(12);
                     doc.text(`${status} (${ticketsInGroup.length} Tickets)`, data.settings.margin.left, startY - 2);
                }
            });
            startY = (doc as any).lastAutoTable.finalY + 15;
        }
    });

    const fileName = `Ticket_Uebersicht_${getFormattedDate()}.pdf`;

    if ((window as any).showSaveFilePicker) {
        try {
            const blob = doc.output('blob');
            const handle = await (window as any).showSaveFilePicker({
                suggestedName: fileName,
                types: [{ description: 'PDF-Dokument', accept: { 'application/pdf': ['.pdf'] } }],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
        } catch (err) {
            console.log('Speichern abgebrochen.', err);
        }
    } else {
        // Fallback für ältere Browser
        doc.save(fileName);
    }
  };

  const handleLogin = (role: Role, name: string) => {
    setCurrentUser({ role, displayName: name });
    if (role === Role.Admin) setCurrentView('dashboard');
    else if (role === Role.Technician) setCurrentView('tickets');
  };
  const handleLogout = () => setCurrentUser(null);

  if (!currentUser) {
    return <Portal onLogin={handleLogin} tickets={tickets} onAddTicket={handleAddNewTicket} onUpdateTicket={handleTicketUpdate} areas={allAreas.filter(a => a !== 'Alle')} />;
  }

  const isBulkActionsVisible = (currentView === 'tickets' || currentView === 'erledigt') && selectedTicketIds.length > 0;
  
  const renderCurrentView = () => {
    switch (currentView) {
        case 'dashboard': return <KanbanBoard tickets={filteredTickets} onUpdateTicket={handleTicketUpdate} onSelectTicket={setSelectedTicket} selectedTicket={selectedTicket} />;
        case 'tickets': return <TicketTableView tickets={filteredTickets} onUpdateTicket={handleTicketUpdate} onSelectTicket={setSelectedTicket} selectedTicketIds={selectedTicketIds} setSelectedTicketIds={setSelectedTicketIds} selectedTicket={selectedTicket} groupBy={groupBy} />;
        case 'erledigt': return <ErledigtTableView tickets={filteredTickets} onSelectTicket={setSelectedTicket} selectedTicket={selectedTicket} />;
        case 'reports': return <ReportsView tickets={tickets} />;
        default: return <KanbanBoard tickets={filteredTickets} onUpdateTicket={handleTicketUpdate} onSelectTicket={setSelectedTicket} selectedTicket={selectedTicket} />;
    }
  }

  return (
    <div className="app-layout">
      <Sidebar isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} theme={theme} setTheme={setTheme} currentView={currentView} setCurrentView={changeView} onLogout={handleLogout} userRole={currentUser.role} userName={currentUser.displayName} tickets={tickets} />
      <main>
        <Header stats={stats} filters={filters} setFilters={setFilters} onNewTicketClick={() => setIsModalOpen(true)} currentView={currentView} />
        {isBulkActionsVisible ? (
             <BulkActionBar selectedCount={selectedTicketIds.length} technicians={allTechnicians} statuses={Object.values(Status)} onBulkUpdate={handleBulkUpdate} onBulkDelete={handleBulkDelete} onClearSelection={() => setSelectedTicketIds([])} />
        ) : ( (currentView === 'dashboard' || currentView === 'tickets' || currentView === 'erledigt') &&
            <FilterBar filters={filters} setFilters={setFilters} areas={allAreas} technicians={techniciansForFilter} statuses={statusesForFilter} onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} userRole={currentUser.role} groupBy={groupBy} setGroupBy={setGroupBy} currentView={currentView} />
        )}
        {renderCurrentView()}
      </main>
      {isModalOpen && <NewTicketModal onClose={() => setIsModalOpen(false)} onSave={handleAddNewTicket} areas={allAreas.filter(a => a !== 'Alle')} />}
      {selectedTicket && <TicketDetailSidebar ticket={selectedTicket} onClose={() => setSelectedTicket(null)} onUpdateTicket={handleTicketUpdate} technicians={allTechnicians} statuses={Object.values(Status)} currentUser={currentUser} />}
    </div>
  );
};
export default App;