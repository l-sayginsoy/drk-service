import React, { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Ticket, Status, Priority, Role, GroupableKey, User, Location, AppSettings, Asset, MaintenancePlan, AvailabilityStatus, RoutingRule } from './types';
import { MOCK_TICKETS, MOCK_USERS, MOCK_LOCATIONS, STATUSES, DEFAULT_APP_SETTINGS, MOCK_ASSETS, MOCK_MAINTENANCE_PLANS } from './constants';

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
import TechnicianView from './components/TechnicianView';
import SettingsView from './components/SettingsView';

const LOCAL_STORAGE_KEY_TICKETS = 'facility-management-tickets';
const LOCAL_STORAGE_KEY_USERS = 'facility-management-users';
const LOCAL_STORAGE_KEY_LOCATIONS = 'facility-management-locations';
const LOCAL_STORAGE_KEY_ASSETS = 'facility-management-assets';
const LOCAL_STORAGE_KEY_PLANS = 'facility-management-plans';
const LOCAL_STORAGE_KEY_SETTINGS = 'facility-management-settings';

const parseGermanDate = (dateStr: string | undefined): Date | null => {
    if (!dateStr || dateStr === 'N/A') return null;
    const parts = dateStr.split('.');
    if (parts.length === 3) {
        return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    return null;
};

// ADD THIS HELPER for Safari compatibility
const parseISODate = (dateStr: string | undefined): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        // new Date(year, monthIndex, day)
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    return null;
}

const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_LONG_EDGE = 1600;
                let { width, height } = img;
                if (width > height) {
                    if (width > MAX_LONG_EDGE) {
                        height *= MAX_LONG_EDGE / width;
                        width = MAX_LONG_EDGE;
                    }
                } else {
                    if (height > MAX_LONG_EDGE) {
                        width *= MAX_LONG_EDGE / height;
                        height = MAX_LONG_EDGE;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error('Canvas context not available'));
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.75));
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
};


const getFutureDateInGermanFormat = (days: number): string => {
    const today = new Date(2026, 1, 7); // February is month 1. Changed for Safari.
    today.setDate(today.getDate() + days);
    return today.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getFutureDateStringForUpdate = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getFormattedDate = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const assignTicket = (
    ticketData: { title: string; description?: string; },
    users: User[],
    tickets: Ticket[],
    routingRules: RoutingRule[]
): string => {
    let assignedTechnician = 'N/A';
    const fullText = `${ticketData.title} ${ticketData.description || ''}`.toLowerCase();
    
    // Find a rule that matches keywords in the ticket's title or description
    const matchedRule = routingRules.find(rule => 
        rule.keyword.toLowerCase().split(',').some(kw => fullText.includes(kw.trim()))
    );

    if (matchedRule) {
        // Find all active and available technicians with the required skill
        const skilledTechnicians = users.filter(u => 
            u.role === Role.Technician && 
            u.isActive && 
            u.availability.status === AvailabilityStatus.Available && 
            u.skills.includes(matchedRule.skill)
        );
        
        if (skilledTechnicians.length > 0) {
            // Calculate current load for each skilled technician
            const techniciansWithLoad = skilledTechnicians.map(tech => ({
                ...tech,
                load: tickets.filter(t => t.technician === tech.name && t.status !== Status.Abgeschlossen).length
            }));
            
            // Sort by load, ascending, to find the least busy one
            techniciansWithLoad.sort((a, b) => a.load - b.load);
            assignedTechnician = techniciansWithLoad[0].name;
        }
    }
    return assignedTechnician;
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => JSON.parse(window.localStorage.getItem('currentUser') || 'null'));

  // --- Main Data State ---
  const [tickets, setTickets] = useState<Ticket[]>(() => JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_TICKETS) || 'null') || MOCK_TICKETS);
  const [users, setUsers] = useState<User[]>(() => JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_USERS) || 'null') || MOCK_USERS);
  const [locations, setLocations] = useState<Location[]>(() => JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_LOCATIONS) || 'null') || MOCK_LOCATIONS);
  const [assets, setAssets] = useState<Asset[]>(() => JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_ASSETS) || 'null') || MOCK_ASSETS);
  const [maintenancePlans, setMaintenancePlans] = useState<MaintenancePlan[]>(() => JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_PLANS) || 'null') || MOCK_MAINTENANCE_PLANS);
  const [appSettings, setAppSettings] = useState<AppSettings>(() => ({ ...DEFAULT_APP_SETTINGS, ...JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_SETTINGS) || '{}') }));

  // --- UI State ---
  const [filters, setFilters] = useState({ area: 'Alle', technician: 'Alle', priority: 'Alle', status: 'Alle', search: '' });
  const [groupBy, setGroupBy] = useState<GroupableKey | 'none'>('none');
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState('light');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);

  // --- Effects to persist state ---
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('currentUser', JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEY_TICKETS, JSON.stringify(tickets)); }, [tickets]);
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEY_USERS, JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEY_LOCATIONS, JSON.stringify(locations)); }, [locations]);
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEY_ASSETS, JSON.stringify(assets)); }, [assets]);
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEY_PLANS, JSON.stringify(maintenancePlans)); }, [maintenancePlans]);
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEY_SETTINGS, JSON.stringify(appSettings)); }, [appSettings]);

  // --- Core App Logic Effects ---
  // Maintenance Scheduler Simulation
  useEffect(() => {
    const today = new Date(2026, 1, 7); // Changed for Safari
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString().split('T')[0];
    
    const duePlans = maintenancePlans.filter(plan => {
        const lastGenerated = parseISODate(plan.lastGenerated); // Changed for Safari
        if (!lastGenerated) return false;
        lastGenerated.setDate(lastGenerated.getDate() + plan.intervalDays);
        return lastGenerated <= today;
    });

    if (duePlans.length > 0) {
        const newTickets: Ticket[] = [];
        const updatedPlans = [...maintenancePlans];

        duePlans.forEach(plan => {
            const asset = assets.find(a => a.id === plan.assetId);
            if(!asset) return;
            
            const location = locations.find(l => l.id === asset.locationId);

            const newTicket: Omit<Ticket, 'id' | 'entryDate' | 'status'> = {
                ticketType: 'preventive',
                title: `Wartung: ${asset.name}`,
                area: location?.name || 'Unbekannt',
                location: asset.details.type,
                reporter: 'System',
                dueDate: '', // Will be set by SLA logic
                technician: 'N/A', // Will be set by routing logic
                priority: plan.ticketPriority,
                description: plan.taskDescription,
            };
            
            const ticketId = handleAddNewTicket(newTicket, true); // Add ticket without opening modal
            const planIndex = updatedPlans.findIndex(p => p.id === plan.id);
            if (planIndex !== -1) {
                updatedPlans[planIndex] = { ...updatedPlans[planIndex], lastGenerated: todayStr };
            }
        });
        setMaintenancePlans(updatedPlans);
    }
  }, []); // Runs once on app load

  // Automatically set tickets to overdue and back
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let wasChanged = false;
    const updatedTickets = tickets.map(ticket => {
        if (ticket.status === Status.Abgeschlossen) {
            return ticket;
        }

        const dueDate = parseGermanDate(ticket.dueDate);
        if (!dueDate) return ticket;

        const isPastDue = dueDate < today;

        if (isPastDue && ticket.status !== Status.Ueberfaellig) {
            wasChanged = true;
            return { ...ticket, status: Status.Ueberfaellig };
        } else if (!isPastDue && ticket.status === Status.Ueberfaellig) {
            wasChanged = true;
            return { ...ticket, status: Status.InArbeit };
        }
        
        return ticket;
    });

    if (wasChanged) {
        setTickets(updatedTickets);
    }
  }, [tickets]); // Reruns whenever tickets change

  const handleTicketUpdate = (updatedTicket: Ticket) => {
    const originalTicket = tickets.find(t => t.id === updatedTicket.id);

    // Auto-update due date when moving out of 'Overdue' status
    if (originalTicket && originalTicket.status === Status.Ueberfaellig) {
        if (updatedTicket.status === Status.Offen) {
            updatedTicket.dueDate = getFutureDateStringForUpdate(3);
        } else if (updatedTicket.status === Status.InArbeit) {
            updatedTicket.dueDate = getFutureDateStringForUpdate(2);
        }
    }

    setTickets(prev => prev.map(t => (t.id === updatedTicket.id ? updatedTicket : t)));
    if (selectedTicket && selectedTicket.id === updatedTicket.id) {
        setSelectedTicket(updatedTicket);
    }
  };

  const handleAddNewTicket = (newTicketData: Omit<Ticket, 'id' | 'entryDate' | 'status' | 'priority'> & { priority?: Priority }, silent = false): string => {
    // --- INTELLIGENT AUTOMATION LOGIC ---

    // 1. Smart Priority: Determine priority based on category
    const category = appSettings.ticketCategories.find(c => c.id === newTicketData.categoryId);
    const determinedPriority = newTicketData.priority || category?.default_priority || appSettings.defaultPriority;

    // 2. Load-Balancing Technician Assignment
    const assignedTechnician = assignTicket(newTicketData, users, tickets, appSettings.routingRules);

    // 3. SLA-based Due Date Calculation
    const slaRule = appSettings.slaMatrix.find(r => r.categoryId === newTicketData.categoryId && r.priority === determinedPriority);
    const dueDate = new Date();
    if (slaRule) {
        dueDate.setHours(dueDate.getHours() + slaRule.responseTimeHours);
    } else {
        dueDate.setDate(dueDate.getDate() + (appSettings.dueDateRules[determinedPriority] || 7));
    }
    const formattedDueDate = dueDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const newTicket: Ticket = {
      ...(newTicketData as Omit<Ticket, 'id' | 'entryDate' | 'status'>),
      id: `M-${Math.floor(Math.random() * 10000) + 30000}`,
      entryDate: new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      status: Status.Offen,
      priority: determinedPriority,
      technician: assignedTechnician,
      dueDate: formattedDueDate,
      notes: newTicketData.notes || [],
      hasNewNoteFromReporter: false,
      is_emergency: false,
    };

    setTickets(prevTickets => [newTicket, ...prevTickets]);
    if (!silent) setIsModalOpen(false);
    return newTicket.id;
  };
  
  const activeLocations = useMemo(() => locations.filter(a => a.isActive), [locations]);
  const activeTechnicians = useMemo(() => users.filter(u => u.isActive && u.role === Role.Technician), [users]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
        // Role-based pre-filtering: Technicians should only see tickets assigned to them.
        if (currentUser?.role === Role.Technician && ticket.technician !== currentUser.name) {
            return false;
        }

        const searchLower = filters.search.toLowerCase();
        if (filters.search && !ticket.title.toLowerCase().includes(searchLower) && !ticket.id.toLowerCase().includes(searchLower) && !ticket.area.toLowerCase().includes(searchLower)) return false;
        
        if (filters.area !== 'Alle' && ticket.area !== filters.area) return false;
        
        if (filters.technician !== 'Alle' && ticket.technician !== filters.technician) return false;
        
        if (filters.priority !== 'Alle' && ticket.priority !== filters.priority) return false;
        
        if (currentView === 'erledigt') {
            if (filters.status !== 'Alle' && ticket.status !== filters.status) return false;
            return ticket.status === Status.Abgeschlossen;
        }
        
        // For dashboard & tickets views, hide completed tickets.
        if (ticket.status === Status.Abgeschlossen) return false;
        
        if ((currentView === 'tickets' || currentView === 'dashboard') && filters.status !== 'Alle' && ticket.status !== filters.status) return false;
        
        return true;
    });
  }, [tickets, filters, currentView, currentUser]);
  
  const stats = useMemo(() => ({
      open: tickets.filter(t => t.status === Status.Offen).length,
      inProgress: tickets.filter(t => t.status === Status.InArbeit).length,
      overdue: tickets.filter(t => t.status === Status.Ueberfaellig).length,
  }), [tickets]);

  const allTechnicianNames = useMemo(() => ['N/A', ...users.filter(u => u.role === Role.Technician).map(t => t.name)], [users]);
  
  const locationOptionsWithCounts = useMemo(() => {
    const ticketsForCounts = tickets.filter(t => currentView === 'erledigt' ? t.status === Status.Abgeschlossen : t.status !== Status.Abgeschlossen);
    const counts = ticketsForCounts.reduce((acc, ticket) => {
        acc[ticket.area] = (acc[ticket.area] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const result = activeLocations.map(loc => ({ name: loc.name, count: counts[loc.name] || 0 }));
    return [{ name: 'Alle', count: ticketsForCounts.length }, ...result];
  }, [tickets, activeLocations, currentView]);

  const changeView = (view: string) => {
    if (['dashboard', 'reports', 'techniker', 'settings'].includes(view) && currentUser?.role !== Role.Admin) {
      alert('Keine Berechtigung, auf diese Seite zuzugreifen.');
      return;
    }
    setFilters(prev => ({ ...prev, status: 'Alle', search: '' }));
    setGroupBy('none'); setSelectedTicketIds([]); setCurrentView(view);
  };
  
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.role === Role.Admin) setCurrentView('dashboard');
    else if (user.role === Role.Technician) setCurrentView('tickets');
  };
  const handleLogout = () => { setCurrentUser(null); setCurrentView('dashboard'); };
  
  if (!currentUser) {
    return <Portal appSettings={appSettings} onLogin={handleLogin} tickets={tickets} onAddTicket={handleAddNewTicket} onUpdateTicket={handleTicketUpdate} locations={activeLocations.map(a => a.name)} users={users} />;
  }
  
  const renderCurrentView = () => {
    switch (currentView) {
        case 'dashboard': return <KanbanBoard tickets={filteredTickets} onUpdateTicket={handleTicketUpdate} onSelectTicket={setSelectedTicket} selectedTicket={selectedTicket} />;
        case 'tickets': return <TicketTableView tickets={filteredTickets} onUpdateTicket={handleTicketUpdate} onSelectTicket={setSelectedTicket} selectedTicketIds={selectedTicketIds} setSelectedTicketIds={setSelectedTicketIds} selectedTicket={selectedTicket} groupBy={groupBy} />;
        case 'erledigt': return <ErledigtTableView tickets={filteredTickets} onSelectTicket={setSelectedTicket} selectedTicket={selectedTicket} />;
        case 'reports': return <ReportsView tickets={tickets} />;
        case 'techniker': return <TechnicianView tickets={tickets} technicians={users.filter(u => u.role === Role.Technician)} onTechnicianSelect={(f) => { setFilters(prev => ({ ...prev, ...f })); setCurrentView('tickets');}} onFilter={(f) => { setFilters(prev => ({ ...prev, ...f })); setCurrentView('tickets');}} />;
        case 'settings': return <SettingsView users={users} setUsers={setUsers} locations={locations} setLocations={setLocations} assets={assets} setAssets={setAssets} maintenancePlans={maintenancePlans} setMaintenancePlans={setMaintenancePlans} appSettings={appSettings} setAppSettings={setAppSettings} />;
        default: return <KanbanBoard tickets={filteredTickets} onUpdateTicket={handleTicketUpdate} onSelectTicket={setSelectedTicket} selectedTicket={selectedTicket} />;
    }
  }

  return (
    <div className="app-layout">
      <Sidebar appSettings={appSettings} isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} theme={theme} setTheme={setTheme} currentView={currentView} setCurrentView={changeView} onLogout={handleLogout} userRole={currentUser.role} userName={currentUser.name} tickets={tickets} onNewTicketClick={() => setIsModalOpen(true)} onExportPDF={() => {}} onExportCSV={() => {}} />
      <main>
        <Header stats={stats} filters={filters} setFilters={setFilters} currentView={currentView} />
        {selectedTicketIds.length > 0 && (currentView === 'tickets' || currentView === 'erledigt') ? (
             <BulkActionBar selectedCount={selectedTicketIds.length} technicians={allTechnicianNames} statuses={Object.values(Status)} onBulkUpdate={()=>{}} onBulkDelete={()=>{}} onClearSelection={() => setSelectedTicketIds([])} />
        ) : ( (currentView === 'dashboard' || currentView === 'tickets' || currentView === 'erledigt' || currentView === 'techniker') &&
            <FilterBar filters={filters} setFilters={setFilters} locations={locationOptionsWithCounts} technicians={['Alle', ...activeTechnicians.map(t=>t.name)]} statuses={STATUSES} userRole={currentUser.role} groupBy={groupBy} setGroupBy={setGroupBy} currentView={currentView} />
        )}
        {renderCurrentView()}
      </main>
      {isModalOpen && <NewTicketModal onClose={() => setIsModalOpen(false)} onSave={handleAddNewTicket} locations={activeLocations.map(a => a.name)} technicians={activeTechnicians} appSettings={appSettings} compressImage={compressImage}/>}
      {selectedTicket && <TicketDetailSidebar ticket={selectedTicket} onClose={() => setSelectedTicket(null)} onUpdateTicket={handleTicketUpdate} technicians={allTechnicianNames} statuses={Object.values(Status)} currentUser={currentUser} appSettings={appSettings} />}
    </div>
  );
};
export default App;