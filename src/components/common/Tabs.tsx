import React from 'react';
import './CommonStyles.css';

interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  variant?: 'default' | 'boxed' | 'pills';
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  variant = 'default'
}) => {
  const getTabClassName = (tabId: string) => {
    const baseClass = 'tab-item';
    const activeClass = tabId === activeTab ? 'tab-active' : '';
    const variantClass = `tab-${variant}`;
    
    return [baseClass, activeClass, variantClass, className].filter(Boolean).join(' ');
  };

  return (
    <div className="tabs-container">
      <div className={`tabs-header ${variant}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={getTabClassName(tab.id)}
            onClick={() => onTabChange(tab.id)}
            type="button"
          >
            {tab.icon && <span className="tab-icon">{tab.icon}</span>}
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tabs;