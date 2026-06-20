export const TASK_STATUSES = {
  NEW: 'new',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  OVERDUE: 'overdue',
};

export const TASK_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

export const PROGRESS_LEVELS = [0, 25, 50, 75, 100];

export const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: '#3b82f6' },
  { value: 'assigned', label: 'Assigned', color: '#8b5cf6' },
  { value: 'in-progress', label: 'In Progress', color: '#f59e0b' },
  { value: 'completed', label: 'Completed', color: '#10b981' },
  { value: 'overdue', label: 'Overdue', color: '#ef4444' },
];

export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: '#10b981' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#f97316' },
  { value: 'urgent', label: 'Urgent', color: '#ef4444' },
];