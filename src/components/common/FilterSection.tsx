import React, { useState, useEffect } from 'react';
import './CommonStyles.css';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  type: 'text' | 'select' | 'boolean' | 'date';
  name: string;
  label: string;
  placeholder?: string;
  options?: FilterOption[];
  valueTransform?: (value: string) => any;
}

export interface FilterValues {
  [key: string]: any;
}

interface FilterSectionProps {
  filters: FilterConfig[];
  initialValues: FilterValues;
  onFilterChange: (name: string, value: any) => void;
  onSearch: (e: React.FormEvent) => void;
  onClearFilters: () => void;
  searchInputValue: string;
  onSearchInputChange: (value: string) => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  filters,
  initialValues,
  onFilterChange,
  onSearch,
  onClearFilters,
  searchInputValue,
  onSearchInputChange,
}) => {
  const [filterValues, setFilterValues] = useState<FilterValues>(initialValues);

  useEffect(() => {
    setFilterValues(initialValues);
  }, [initialValues]);

  const handleFilterChange = (name: string, value: any, valueTransform?: (value: string) => any) => {
    const transformedValue = valueTransform ? valueTransform(value) : value;
    setFilterValues({ ...filterValues, [name]: transformedValue });
    onFilterChange(name, transformedValue);
  };

  const renderFilterControl = (filter: FilterConfig) => {
    switch (filter.type) {
      case 'text':
        return (
          <input
            type="text"
            placeholder={filter.placeholder || `Filter by ${filter.label.toLowerCase()}...`}
            value={filterValues[filter.name] || ''}
            onChange={(e) => handleFilterChange(filter.name, e.target.value)}
            className="filter-input"
          />
        );
      case 'select':
        return (
          <select
            value={filterValues[filter.name] || ''}
            onChange={(e) => handleFilterChange(filter.name, e.target.value, filter.valueTransform)}
            className="filter-select"
          >
            {filter.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'boolean':
        return (
          <select
            value={filterValues[filter.name] === null ? '' : String(filterValues[filter.name])}
            onChange={(e) => {
              const value = e.target.value;
              const transformedValue = value === '' ? null : value === 'true';
              handleFilterChange(filter.name, transformedValue);
            }}
            className="filter-select"
          >
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );
      case 'date':
        return (
          <input
            type="date"
            value={filterValues[filter.name] || ''}
            onChange={(e) => handleFilterChange(filter.name, e.target.value)}
            className="filter-input"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="filters-section">
      <form onSubmit={onSearch} className="search-form">
        <input
          type="text"
          placeholder="Search..."
          value={searchInputValue}
          onChange={(e) => onSearchInputChange(e.target.value)}
          className="search-input"
        />
        <button type="button" onClick={onSearch} className="search-button">Search</button>
      </form>

      <div className="filter-controls">
        {filters.map((filter) => (
          <div key={filter.name} className="filter-group">
            <label>{filter.label}:</label>
            {renderFilterControl(filter)}
          </div>
        ))}

        <button onClick={onClearFilters} className="clear-filters-button">
          Clear Filters
        </button>
      </div>
    </div>
  );
};

export default FilterSection;