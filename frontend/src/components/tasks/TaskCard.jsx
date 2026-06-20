import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate, getStatusColor, getPriorityColor } from '../../utils/helpers';

const TaskCard = ({ task }) => {
  const navigate = useNavigate();

  const statusColors = {
    new: 'blue',
    assigned: 'purple',
    'in-progress': 'orange',
    completed: 'green',
    overdue: 'red',
  };

  const priorityColors = {
    low: 'green',
    medium: 'yellow',
    high: 'orange',
    urgent: 'red',
  };

  return (
    <div
      onClick={() => navigate(`/tasks/${task._id}`)}
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
        <div className="flex space-x-2">
          <span className={`px-2 py-1 text-xs rounded-full bg-${priorityColors[task.priority]}-100 text-${priorityColors[task.priority]}-800`}>
            {task.priority}
          </span>
          <span className={`px-2 py-1 text-xs rounded-full bg-${statusColors[task.status]}-100 text-${statusColors[task.status]}-800`}>
            {task.status}
          </span>
        </div>
      </div>
      
      <p className="text-gray-600 mb-4 line-clamp-2">{task.description}</p>
      
      <div className="flex justify-between items-center text-sm">
        <div className="space-y-1">
          <p className="text-gray-500">
            Assigned to: <span className="font-medium text-gray-700">{task.assignedTo?.fullName}</span>
          </p>
          <p className="text-gray-500">
            Due: <span className="font-medium text-gray-700">{formatDate(task.dueDate)}</span>
          </p>
        </div>
        
        <div className="w-32">
          <div className="text-xs text-gray-500 mb-1">Progress {task.progress}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 rounded-full h-2 transition-all"
              style={{ width: `${task.progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;