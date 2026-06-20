import React, { useState } from 'react';
import Select from '../common/Select';
import Input from '../common/Input';
import Button from '../common/Button';
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from '../../utils/constants';

const TaskFilters = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleApply = () => {
    onFilterChange(filters);
  };

  const handleReset = () => {
    setFilters({ status: '', priority: '', search: '' });
    onFilterChange({ status: '', priority: '', search: '' });
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Input
          type="text"
          name="search"
          value={filters.search}
          onChange={handleChange}
          placeholder="Search tasks..."
        />
        
        <Select
          name="status"
          value={filters.status}
          onChange={handleChange}
          options={STATUS_OPTIONS}
          placeholder="All Statuses"
        />
        
        <Select
          name="priority"
          value={filters.priority}
          onChange={handleChange}
          options={PRIORITY_OPTIONS}
          placeholder="All Priorities"
        />
        
        <div className="flex space-x-2">
          <Button onClick={handleApply} variant="primary" size="sm">
            Apply Filters
          </Button>
          <Button onClick={handleReset} variant="secondary" size="sm">
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TaskFilters;