import React from 'react';
import { Search, Filter, XCircle } from 'lucide-react';

export const DEPARTMENTS = [
  "All Departments",
  "Roads & Infrastructure",
  "Drainage / Public Works",
  "Electrical / Utilities",
  "Sanitation",
  "Disaster Management"
];

export const STATUSES = [
  "All Statuses",
  "REPORTED",
  "ASSIGNED",
  "IN PROGRESS",
  "VERIFIED",
  "CLOSED"
];

export const PRIORITIES = [
  "ALL",
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW"
];

export default function IncidentFilters({
  searchQuery,
  setSearchQuery,
  selectedPriority,
  setSelectedPriority,
  selectedDepartment,
  setSelectedDepartment,
  selectedStatus,
  setSelectedStatus,
  onResetFilters
}) {
  const hasActiveFilters = 
    searchQuery !== '' || 
    selectedPriority !== 'ALL' || 
    selectedDepartment !== 'All Departments' || 
    selectedStatus !== 'All Statuses';

  return (
    <div className="filters-container">
      <div className="filters-top-row">
        <div className="search-bar-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by ID (e.g. CS-1042), street name, issue or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
              &times;
            </button>
          )}
        </div>

        <div className="dropdown-filters-group">
          <div className="filter-select-wrapper">
            <label>Dept:</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="filter-select"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="filter-select-wrapper">
            <label>Status:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="filter-select"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button className="reset-filter-btn" onClick={onResetFilters}>
              <XCircle size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="filters-priority-row">
        <span className="priority-label-tag">
          <Filter size={13} /> Urgency Filter:
        </span>
        <div className="priority-pills">
          {PRIORITIES.map((lvl) => {
            const isSelected = selectedPriority === lvl;
            let badgeClass = 'pill-all';
            if (lvl === 'CRITICAL') badgeClass = 'pill-critical';
            if (lvl === 'HIGH') badgeClass = 'pill-high';
            if (lvl === 'MEDIUM') badgeClass = 'pill-medium';
            if (lvl === 'LOW') badgeClass = 'pill-low';

            return (
              <button
                key={lvl}
                className={`priority-pill-btn ${badgeClass} ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedPriority(lvl)}
              >
                {lvl === 'CRITICAL' && <span className="pill-dot"></span>}
                {lvl}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

