import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, Image as ImageIcon, Users, User, Info, Share2, FileSpreadsheet, Printer, Download, Upload, Search, X } from 'lucide-react';
import equipmentData from '../data/equipmentChecklist.json';
import useEquipmentChecklist from '../hooks/useEquipmentChecklist';
import { exportEquipmentImageAsPng } from '../utils/exportEquipmentImage';
import { exportEquipmentToCsv, exportEquipmentToJson } from '../utils/exportEquipmentData';
import { trackEvent } from '../utils/analytics';

const highlightText = (text, highlight) => {
  const trimmed = highlight.trim();
  if (!trimmed) return text;
  const regex = new RegExp(`(${trimmed.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, index) => 
    part.toLowerCase() === trimmed.toLowerCase() ? (
      <mark key={index} className="search-highlight">{part}</mark>
    ) : part
  );
};

export default function EquipmentChecklist() {
  const [activeKey, setActiveKey] = useState('shared');
  const [openTopics, setOpenTopics] = useState({});
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);
  const { isChecked, toggle, getTopicProgress, getSectionProgress, checkedMap, importCheckedMap } = useEquipmentChecklist();

  const [localSearch, setLocalSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(localSearch);
    }, 150);
    return () => clearTimeout(timer);
  }, [localSearch]);

  useEffect(() => {
    if (!exportMenuOpen) return;
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setExportMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [exportMenuOpen]);

  const toggleTopic = (topicId) => {
    setOpenTopics(prev => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  const handleExportCsv = (scope, onlyChecked = false) => {
    setExportMenuOpen(false);
    trackEvent('equipment_export_csv', { scope, onlyChecked });
    exportEquipmentToCsv(equipmentData, checkedMap, scope, onlyChecked);
  };

  const handleExportJson = () => {
    setExportMenuOpen(false);
    trackEvent('equipment_export_json');
    exportEquipmentToJson(checkedMap);
  };

  const handleImportJson = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (typeof importedData === 'object' && importedData !== null && !Array.isArray(importedData)) {
          const validated = {};
          for (const [key, value] of Object.entries(importedData)) {
            if (typeof key === 'string' && typeof value === 'boolean') {
              validated[key] = value;
            }
          }
          importCheckedMap(validated);
          alert('הגיבוי נטען בהצלחה!');
        } else {
          alert('קובץ הגיבוי אינו תקין.');
        }
      } catch {
        alert('שגיאה בקריאת קובץ הגיבוי.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
    setExportMenuOpen(false);
  };

  const handlePrint = (onlyChecked = false) => {
    setExportMenuOpen(false);
    trackEvent('equipment_print', { onlyChecked });
    if (onlyChecked) {
      document.body.classList.add('print-checked-only');
    } else {
      document.body.classList.remove('print-checked-only');
    }

    const cleanup = () => {
      document.body.classList.remove('print-checked-only');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
    setTimeout(cleanup, 2000);
  };

  const handleExportImage = async (scope, onlyChecked = false) => {
    setExportMenuOpen(false);
    trackEvent('equipment_export_image', { scope, onlyChecked });
    await exportEquipmentImageAsPng({
      shared: scope === 'personal' ? null : equipmentData.shared,
      personal: scope === 'shared' ? null : equipmentData.personal,
      checkedMap,
      onlyChecked
    });
  };

  const renderSection = (key, section, isPrint = false) => {
    const isActive = activeKey === key;
    const progress = getSectionProgress(section);
    
    let displayTopics = section.topics;
    if (!isPrint) {
      const query = searchTerm.toLowerCase().trim();
      displayTopics = section.topics.map(topic => {
        const matchesHeading = query === '' || topic.heading.toLowerCase().includes(query);
        const filteredItems = topic.items.filter(item => {
          // Status filter
          const matchesStatus = 
            statusFilter === 'all' ||
            (statusFilter === 'checked' && isChecked(item.id)) ||
            (statusFilter === 'unchecked' && !isChecked(item.id));
          
          if (!matchesStatus) return false;

          // Search filter
          if (matchesHeading) return true;
          const matchesLabel = item.label.toLowerCase().includes(query);
          const matchesHint = item.hint && item.hint.toLowerCase().includes(query);
          return matchesLabel || matchesHint;
        });

        return {
          ...topic,
          items: filteredItems
        };
      }).filter(topic => topic.items.length > 0);
    }

    return (
      <div 
        key={key} 
        className={`equipment-section-wrapper ${key}-section ${isActive && !isPrint ? 'active-tab' : ''} ${isPrint ? 'print-section' : ''}`}
        data-testid={isPrint ? undefined : `equipment-section-${key}`}
      >
        <div className="equipment-section-header">
          <h3>{isPrint ? `הדפסת ${section.title}` : section.title}</h3>
          <span className="equipment-progress-badge">
            {progress.done}/{progress.total} סומנו
          </span>
        </div>

        <div className="equipment-topics">
          {displayTopics.length === 0 ? (
            <div className="equipment-empty-search" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              לא נמצאו פריטים המתאימים לסינון הנוכחי.
            </div>
          ) : (
            displayTopics.map((topic) => {
              // Auto-expand if search is active
              const isOpen = isPrint || (searchTerm.trim() !== '' ? true : !!openTopics[topic.id]);
              const topicProgress = getTopicProgress(topic);
              return (
                <div 
                  key={topic.id} 
                  className={`equipment-topic ${isOpen ? 'open' : ''}`} 
                  data-testid={isPrint ? undefined : `equipment-topic-${topic.id}`}
                >
                  <button
                    type="button"
                    className="equipment-topic-header"
                    data-testid={isPrint ? undefined : `equipment-topic-header-${topic.id}`}
                    onClick={isPrint ? undefined : () => toggleTopic(topic.id)}
                  >
                    <span className="equipment-topic-heading">
                      {isPrint ? `נושא: ${topic.heading}` : highlightText(topic.heading, searchTerm)}
                    </span>
                    <span className="equipment-topic-right">
                      <span className="equipment-topic-progress">{topicProgress.done}/{topicProgress.total}</span>
                      {!isPrint && (isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />)}
                    </span>
                  </button>
                  
                  {(isPrint || isOpen) && (
                    <div className="equipment-topic-body" data-testid={isPrint ? undefined : `equipment-topic-body-${topic.id}`}>
                      {topic.items.map((item) => (
                        <label
                          key={item.id}
                          className="equipment-item"
                          data-testid={isPrint ? undefined : `equipment-item-${item.id}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked(item.id)}
                            onChange={isPrint ? () => {} : () => toggle(item.id)}
                            readOnly={isPrint}
                            style={isPrint ? { pointerEvents: 'none' } : undefined}
                          />
                          <span className="equipment-item-text">
                            <span className="equipment-item-label">
                              {isPrint ? `• ${item.label}` : highlightText(item.label, searchTerm)}
                            </span>
                            {item.hint && (
                              <span className="equipment-item-hint">
                                {isPrint ? item.hint : highlightText(item.hint, searchTerm)}
                              </span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const printContainer = useMemo(() => (
    <div className="equipment-print-only-container">
      {renderSection('shared', equipmentData.shared, true)}
      {renderSection('personal', equipmentData.personal, true)}
    </div>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [checkedMap]);

  return (
    <div className="equipment-checklist stagger-slide-up" style={{ '--card-index': 0 }}>
      <div className="equipment-header-actions">
        <div className="equipment-info-note">
          <Info size={16} />
          <span>לאחר סימון הציוד ברשימה, תוכלו לייצא אותו לאקסל, להדפיס או לשמור גיבוי.</span>
        </div>
        <div className="equipment-export-wrap" ref={menuRef}>
          <button
            type="button"
            className="equipment-export-btn"
            data-testid="equipment-export-btn"
            onClick={() => setExportMenuOpen(prev => !prev)}
          >
            <Share2 size={16} />
            <span>ייצוא וגיבוי</span>
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".json"
            onChange={handleImportJson}
          />

          {exportMenuOpen && (
            <div className="equipment-export-menu">
              <div className="menu-section-title">ייצוא נתונים (Excel)</div>
              <button type="button" onClick={() => handleExportCsv('both', false)}>
                <FileSpreadsheet size={14} className="menu-icon-csv" />
                <span>ייצוא לאקסל (כל הציוד)</span>
              </button>
              <button type="button" onClick={() => handleExportCsv('both', true)}>
                <FileSpreadsheet size={14} className="menu-icon-csv" />
                <span>ייצוא לאקסל (פריטים שסומנו בלבד)</span>
              </button>

              <div className="menu-divider" />

              <div className="menu-section-title">הדפסה ומדיה</div>
              <button type="button" onClick={() => handlePrint(false)}>
                <Printer size={14} className="menu-icon-print" />
                <span>הדפסת הרשימה (כל הציוד)</span>
              </button>
              <button type="button" onClick={() => handlePrint(true)}>
                <Printer size={14} className="menu-icon-print" />
                <span>הדפסת פריטים שסומנו בלבד</span>
              </button>
              <button type="button" onClick={() => handleExportImage('both', false)}>
                <ImageIcon size={14} className="menu-icon-image" />
                <span>ייצוא לתמונה (כל הציוד - PNG)</span>
              </button>
              <button type="button" onClick={() => handleExportImage('both', true)}>
                <ImageIcon size={14} className="menu-icon-image" />
                <span>ייצוא לתמונה (פריטים שסומנו בלבד - PNG)</span>
              </button>

              <div className="menu-divider" />

              <div className="menu-section-title">גיבוי אופליין (JSON)</div>
              <button type="button" onClick={handleExportJson}>
                <Download size={14} className="menu-icon-download" />
                <span>שמירת קובץ גיבוי</span>
              </button>
              <button type="button" onClick={() => fileInputRef.current.click()}>
                <Upload size={14} className="menu-icon-upload" />
                <span>טעינת קובץ גיבוי</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter bar */}
      <div className="equipment-search-filter-bar">
        <div className="equipment-search-wrapper">
          <Search className="equipment-search-icon" size={18} />
          <input
            type="text"
            className="equipment-search-input"
            placeholder="חיפוש פריט או רמז עזר..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
          {localSearch && (
            <button
              type="button"
              className="equipment-search-clear-btn"
              onClick={() => {
                setLocalSearch('');
                setSearchTerm('');
              }}
              title="נקה חיפוש"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="equipment-filter-chips">
          <button
            type="button"
            className={`equipment-filter-chip ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            הכל
          </button>
          <button
            type="button"
            className={`equipment-filter-chip ${statusFilter === 'unchecked' ? 'active' : ''}`}
            onClick={() => setStatusFilter('unchecked')}
          >
            טרם סומנו
          </button>
          <button
            type="button"
            className={`equipment-filter-chip ${statusFilter === 'checked' ? 'active' : ''}`}
            onClick={() => setStatusFilter('checked')}
          >
            סומנו
          </button>
        </div>
      </div>

      <div className="equipment-section-tabs">
        <button
          type="button"
          data-testid="equipment-section-toggle-shared"
          className={`equipment-section-tab ${activeKey === 'shared' ? 'active' : ''}`}
          onClick={() => setActiveKey('shared')}
        >
          <Users size={16} />
          <span>קבוצתי</span>
        </button>
        <button
          type="button"
          data-testid="equipment-section-toggle-personal"
          className={`equipment-section-tab ${activeKey === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveKey('personal')}
        >
          <User size={16} />
          <span>אישי</span>
        </button>
      </div>

      <div className="equipment-screen-only-container">
        {renderSection(activeKey, equipmentData[activeKey], false)}
      </div>

      {printContainer}
    </div>
  );
}
