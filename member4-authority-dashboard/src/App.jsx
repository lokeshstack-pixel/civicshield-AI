import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import StatsCards from './components/StatsCards';
import IncidentFilters from './components/IncidentFilters';
import GISMap from './components/GISMap';
import DispatchQueue from './components/DispatchQueue';
import IncidentModal from './components/IncidentModal';
import AnalyticsView from './components/AnalyticsView';
import { 
  fetchIncidentsAPI, 
  updateIncidentStatusAPI, 
  verifyRepairAPI,
  INITIAL_INCIDENTS,
  saveCachedIncidents 
} from './services/api';
import './App.css';

export default function App() {
  const [incidents, setIncidents] = useState([]);
  const [dataSource, setDataSource] = useState('cache');
  const [activeView, setActiveView] = useState('split'); // 'split', 'map', 'queue', 'analytics'
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');

  // Load incidents on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const res = await fetchIncidentsAPI();
    setIncidents(res.data);
    setDataSource(res.source);
    setLastUpdated(new Date());
  };

  // Filtered Incidents calculation
  const filteredIncidents = useMemo(() => {
    return incidents.filter((item) => {
      // 1. Priority / Urgency filter
      if (selectedPriority !== 'ALL' && item.priority_level !== selectedPriority) {
        return false;
      }

      // 2. Department filter
      if (selectedDepartment !== 'All Departments' && item.department !== selectedDepartment) {
        return false;
      }

      // 3. Status filter
      if (selectedStatus !== 'All Statuses' && item.status !== selectedStatus) {
        return false;
      }

      // 4. Search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const idMatch = item.id?.toLowerCase().includes(query);
        const issueMatch = item.issue_type?.toLowerCase().includes(query);
        const locMatch = item.location_name?.toLowerCase().includes(query);
        const descMatch = item.description?.toLowerCase().includes(query);
        const deptMatch = item.department?.toLowerCase().includes(query);

        if (!idMatch && !issueMatch && !locMatch && !descMatch && !deptMatch) {
          return false;
        }
      }

      return true;
    });
  }, [incidents, selectedPriority, selectedDepartment, selectedStatus, searchQuery]);

  // Handle status update (e.g. ASSIGNED, IN PROGRESS, VERIFIED, CLOSED)
  const handleUpdateStatus = async (id, newStatus, assignedTeam = null) => {
    const updated = await updateIncidentStatusAPI(id, newStatus, assignedTeam);
    setIncidents((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            status: newStatus,
            assigned_team: assignedTeam || item.assigned_team,
            repair_verified: newStatus === 'VERIFIED' ? true : item.repair_verified
          };
        }
        return item;
      })
    );

    if (selectedIncident && selectedIncident.id === id) {
      setSelectedIncident((prev) => ({
        ...prev,
        status: newStatus,
        assigned_team: assignedTeam || prev.assigned_team,
        repair_verified: newStatus === 'VERIFIED' ? true : prev.repair_verified
      }));
    }
  };

  // Handle repair verification
  const handleVerifyRepair = async (id, repairPhotoUrl) => {
    await verifyRepairAPI(id, repairPhotoUrl);
    setIncidents((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            repair_image_url: repairPhotoUrl,
            repair_verified: true,
            status: 'VERIFIED'
          };
        }
        return item;
      })
    );

    if (selectedIncident && selectedIncident.id === id) {
      setSelectedIncident((prev) => ({
        ...prev,
        repair_image_url: repairPhotoUrl,
        repair_verified: true,
        status: 'VERIFIED'
      }));
    }
  };

  // Quick filter by clicking a Stat card
  const handleStatCardFilter = (filterType) => {
    if (filterType === 'ALL') {
      setSelectedPriority('ALL');
      setSelectedStatus('All Statuses');
    } else if (filterType === 'CRITICAL') {
      setSelectedPriority('CRITICAL');
    } else if (filterType === 'HIGH') {
      setSelectedPriority('HIGH');
    } else if (filterType === 'PENDING') {
      setSelectedStatus('REPORTED');
    } else if (filterType === 'RESOLVED') {
      setSelectedStatus('VERIFIED');
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedPriority('ALL');
    setSelectedDepartment('All Departments');
    setSelectedStatus('All Statuses');
  };

  const handleResetSeedData = () => {
    saveCachedIncidents(INITIAL_INCIDENTS);
    setIncidents(INITIAL_INCIDENTS);
    setSelectedIncident(null);
  };

  return (
    <div className="app-container">
      {/* 1. Command Header */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        onRefresh={loadData}
        lastUpdated={lastUpdated}
        incidentCount={filteredIncidents.length}
      />

      {/* Main Content Area */}
      <main className="dashboard-main">
        {/* 2. Executive Stats KPI Row */}
        <StatsCards
          incidents={incidents}
          onFilterSelect={handleStatCardFilter}
          activeFilter={selectedPriority}
        />

        {/* 3. Multi-dimensional Filters Bar (Visible for Map, Queue & Split views) */}
        {activeView !== 'analytics' && (
          <IncidentFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedPriority={selectedPriority}
            setSelectedPriority={setSelectedPriority}
            selectedDepartment={selectedDepartment}
            setSelectedDepartment={setSelectedDepartment}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            onResetFilters={handleResetFilters}
          />
        )}

        {/* 4. Active Viewport */}
        {activeView === 'split' && (
          <div className="view-split-grid">
            <GISMap
              incidents={filteredIncidents}
              selectedIncident={selectedIncident}
              onSelectIncident={(inc) => setSelectedIncident(inc)}
            />
            <DispatchQueue
              incidents={filteredIncidents}
              onSelectIncident={(inc) => setSelectedIncident(inc)}
              onQuickStatusChange={handleUpdateStatus}
            />
          </div>
        )}

        {activeView === 'map' && (
          <div className="view-full-pane">
            <GISMap
              incidents={filteredIncidents}
              selectedIncident={selectedIncident}
              onSelectIncident={(inc) => setSelectedIncident(inc)}
            />
          </div>
        )}

        {activeView === 'queue' && (
          <div className="view-full-pane">
            <DispatchQueue
              incidents={filteredIncidents}
              onSelectIncident={(inc) => setSelectedIncident(inc)}
              onQuickStatusChange={handleUpdateStatus}
            />
          </div>
        )}

        {activeView === 'analytics' && (
          <AnalyticsView incidents={incidents} />
        )}
      </main>

      {/* 5. Incident Dossier & AI Repair Verification Modal */}
      {selectedIncident && (
        <IncidentModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onUpdateStatus={handleUpdateStatus}
          onVerifyRepair={handleVerifyRepair}
        />
      )}

      {/* 6. Command Footer */}
      <footer className="command-footer">
        <div className="footer-left">
          <span>CIVICSHIELD AI &bull; Member 4 GIS & Authority Command System</span>
          <span className="data-source-badge">
            Data Stream: {dataSource === 'backend' ? '🟢 Live FastAPI / Supabase' : '🟡 In-Memory Smart Cache (Offline Ready)'}
          </span>
        </div>
        <div className="footer-right">
          <span>OpenStreetMap &bull; Leaflet GIS Engine</span>
          <button 
            onClick={handleResetSeedData}
            style={{ color: '#94a3b8', textDecoration: 'underline', fontSize: '11px' }}
          >
            Reset Demo Incidents
          </button>
        </div>
      </footer>
    </div>
  );
}
