import React, { useState } from 'react';
import './CommonStyles.css';
import * as FaIcons from 'react-icons/fa';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  className?: string;
  emptyMessage?: string;
  pagination?: boolean;
  pageSize?: number;
  striped?: boolean;
  bordered?: boolean;
  compact?: boolean;
}

const DataTable = <T extends Record<string, any>>({ 
  columns, 
  data, 
  onRowClick, 
  className = '',
  emptyMessage = 'No data available',
  pagination = true,
  pageSize = 10,
  striped = true,
  bordered = false,
  compact = false
}: DataTableProps<T>) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof T | null, direction: 'asc' | 'desc' | null }>({ 
    key: null, 
    direction: null 
  });

  // Handle sorting
  const handleSort = (accessor: keyof T | ((row: T) => React.ReactNode)) => {
    if (typeof accessor === 'function') return;
    
    let direction: 'asc' | 'desc' | null = 'asc';
    
    if (sortConfig.key === accessor) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      }
    }
    
    setSortConfig({ key: accessor, direction });
  };

  // Sort data if needed
  const sortedData = React.useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof T];
      const bValue = b[sortConfig.key as keyof T];
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  // Pagination logic
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = pagination 
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Generate table class names
  const tableClassNames = [
    'data-table',
    striped ? 'striped' : '',
    bordered ? 'bordered' : '',
    compact ? 'compact' : '',
    className
  ].filter(Boolean).join(' ');

  if (!data.length) {
    return (
      <div className="data-table empty-state">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="data-table-container">
      <div className={tableClassNames}>
        <table>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={column.className || ''}
                  onClick={() => column.sortable && handleSort(column.accessor)}
                  style={{ cursor: column.sortable ? 'pointer' : 'default' }}
                >
                  <div className="th-content">
                    {column.header}
                    {column.sortable && (
                      <span className="sort-icon">
                        {sortConfig.key === column.accessor ? (
                          sortConfig.direction === 'asc' ? (
                            <FaIcons.FaSortUp />
                          ) : sortConfig.direction === 'desc' ? (
                            <FaIcons.FaSortDown />
                          ) : (
                            <FaIcons.FaSort />
                          )
                        ) : (
                          <FaIcons.FaSort />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'clickable' : ''}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={column.className || ''}
                  >
                    {typeof column.accessor === 'function'
                      ? column.accessor(row)
                      : row[column.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="pagination">
          <button 
            className="pagination-button"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
          >
            <FaIcons.FaAngleDoubleLeft />
          </button>
          <button 
            className="pagination-button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <FaIcons.FaAngleLeft />
          </button>
          
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          
          <button 
            className="pagination-button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <FaIcons.FaAngleRight />
          </button>
          <button 
            className="pagination-button"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            <FaIcons.FaAngleDoubleRight />
          </button>
        </div>
      )}
    </div>
  );
};

export default DataTable;