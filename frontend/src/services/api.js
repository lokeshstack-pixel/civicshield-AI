/**
 * CIVICSHIELD AI — Frontend API Client Service
 * Connects the Citizen UI with the FastAPI backend at http://127.0.0.1:8000
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/**
 * Handle HTTP response and uniform error parsing
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.detail) {
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((d) => d.msg || JSON.stringify(d)).join('; ');
        } else {
          errorMessage = JSON.stringify(errorData.detail);
        }
      } else if (errorData && errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Non-JSON response
    }
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

/**
 * 1. Create a new civic complaint incident
 * POST /incidents
 * @param {Object} incidentData - { issue_type, description, latitude, longitude }
 */
export async function createIncident({ issue_type, description, latitude, longitude }) {
  try {
    const response = await fetch(`${API_BASE_URL}/incidents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        issue_type: issue_type ? String(issue_type).toLowerCase() : null,
        description: description ? description.trim() : '',
        latitude: Number(latitude),
        longitude: Number(longitude),
      }),
    });
    return await handleResponse(response);
  } catch (err) {
    if (err.name === 'TypeError' && err.message.toLowerCase().includes('fetch')) {
      throw new Error('Unable to connect to CivicShield server. Please ensure the backend is running at ' + API_BASE_URL);
    }
    throw err;
  }
}

/**
 * 2. Upload complaint photo and trigger AI damage & risk analysis
 * POST /incidents/{incident_id}/image
 * @param {number|string} incidentId
 * @param {File} file
 */
export async function uploadIncidentImage(incidentId, file) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_BASE_URL}/incidents/${incidentId}/image`, {
      method: 'POST',
      // Do NOT set Content-Type header manually; fetch automatically sets multipart boundary
      body: formData,
    });
    return await handleResponse(response);
  } catch (err) {
    if (err.name === 'TypeError' && err.message.toLowerCase().includes('fetch')) {
      throw new Error('Unable to connect to CivicShield server for image upload.');
    }
    throw err;
  }
}

/**
 * 3. Retrieve incident details for live tracking
 * GET /incidents/{incident_id}
 * @param {number|string} incidentId
 */
export async function getIncident(incidentId) {
  try {
    const response = await fetch(`${API_BASE_URL}/incidents/${incidentId}`);
    return await handleResponse(response);
  } catch (err) {
    if (err.name === 'TypeError' && err.message.toLowerCase().includes('fetch')) {
      throw new Error('Unable to connect to CivicShield server. Please check your network connection.');
    }
    throw err;
  }
}

/**
 * 4. Retrieve all incidents (optional filters)
 * GET /incidents
 * @param {Object} filters - { status, department, issue_type }
 */
export async function getIncidents(filters = {}) {
  const query = new URLSearchParams();
  if (filters.status) query.append('status', filters.status);
  if (filters.department) query.append('department', filters.department);
  if (filters.issue_type) query.append('issue_type', filters.issue_type);

  const url = `${API_BASE_URL}/incidents${query.toString() ? `?${query.toString()}` : ''}`;
  try {
    const response = await fetch(url);
    return await handleResponse(response);
  } catch (err) {
    if (err.name === 'TypeError' && err.message.toLowerCase().includes('fetch')) {
      throw new Error('Unable to connect to CivicShield server.');
    }
    throw err;
  }
}

/**
 * 5. Health probe
 * GET /health
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return await handleResponse(response);
  } catch {
    return { status: 'offline' };
  }
}

export default {
  createIncident,
  uploadIncidentImage,
  getIncident,
  getIncidents,
  checkHealth,
  API_BASE_URL,
};

