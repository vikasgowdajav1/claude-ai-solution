const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || 'Request failed.');
  }

  return payload;
}

export function fetchHealth() {
  return request('/health');
}

export function fetchTasks() {
  return request('/tasks');
}

export function createTask(title) {
  return request('/tasks', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}
