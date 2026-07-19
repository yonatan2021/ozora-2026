import { useState, useRef, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ChevronDown, ChevronUp, Image as ImageIcon, Users, User, Info, Share2, FileSpreadsheet, Printer, Download, Upload, Search, X } from 'lucide-react';
import equipmentData from '../data/equipmentChecklist.json';
import useEquipmentChecklist from '../hooks/useEquipmentChecklist';
import { exportEquipmentImageAsPng } from '../utils/exportEquipmentImage';
import { exportEquipmentToExcel, exportEquipmentToJson } from '../utils/exportEquipmentData';
import { getEquipmentItemFields } from '../utils/equipmentItemFields';
import { trackEvent } from '../utils/analytics';
import { translations } from '../utils/lang';

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
  const { lang = 'he' } = useOutletContext() || {};
  const t = translations[lang];
  const [activeKey, setActiveKey] = useState('shared');
  const [openTopics, setOpenTopics] = useState({});
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);
  const {
    isChecked,
    getItemDetails,
    toggle,
    setQuantity,
    setNote,
    getTopicProgress,
    getSectionProgress,
    checkedMap,
    importCheckedMap
  } = useEquipmentChecklist();

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
    trackEvent('equipment_export', { method: 'excel', scope, onlyChecked });
    exportEquipmentToExcel(equipmentData, checkedMap, scope, onlyChecked, lang);
  };

  const handleExportJson = () => {
    setExportMenuOpen(false);
    trackEvent('equipment_export', { method: 'json' });
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
            } else if (typeof key === 'string' && value && typeof value === 'object' && !Array.isArray(value)) {
              validated[key] = {
                checked: !!value.checked,
                quantity: value.quantity == null ? '' : String(value.quantity),
                note: typeof value.note === 'string' ? value.note : ''
              };
            }
          }
          importCheckedMap(validated);
          alert(t.equipBackupLoaded);
        } else {
          alert(t.equipBackupInvalid);
        }
      } catch {
        alert(t.equipBackupReadError);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
    setExportMenuOpen(false);
  };

  const handlePrint = (onlyChecked = false) => {
    setExportMenuOpen(false);
    trackEvent('equipment_export', { method: 'print', onlyChecked });
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
    trackEvent('equipment_export', { method: 'image', scope, onlyChecked });
    await exportEquipmentImageAsPng({
      shared: scope === 'personal' ? null : equipmentData.shared,
      personal: scope === 'shared' ? null : equipmentData.personal,
      checkedMap,
      onlyChecked,
      lang
    });
  };

  const renderSection = (key, section, isPrint = false) => {
    const isActive = activeKey === key;
    const progress = getSectionProgress(section);
    
    let displayTopics = section.topics;
    if (!isPrint) {
      const query = searchTerm.toLowerCase().trim();
      displayTopics = section.topics.map(topic => {
        const matchesHeading = query === '' || topic.heading[lang].toLowerCase().includes(query);
        const filteredItems = topic.items.filter(item => {
          // Status filter
          const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'checked' && isChecked(item.id)) ||
            (statusFilter === 'unchecked' && !isChecked(item.id));

          if (!matchesStatus) return false;

          // Search filter
          if (matchesHeading) return true;
          const matchesLabel = item.label[lang].toLowerCase().includes(query);
          const matchesHint = item.hint && item.hint[lang].toLowerCase().includes(query);
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
          <h3>{isPrint ? t.equipPrintingTitle.replace('{title}', section.title[lang]) : section.title[lang]}</h3>
          <span className="equipment-progress-badge">
            {progress.done}/{progress.total} {t.equipCheckedCount}
          </span>
        </div>

        <div className="equipment-topics">
          {displayTopics.length === 0 ? (
            <div className="equipment-empty-search" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              {t.equipNoItemsMatch}
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
                      {isPrint ? t.equipTopicPrintPrefix.replace('{heading}', topic.heading[lang]) : highlightText(topic.heading[lang], searchTerm)}
                    </span>
                    <span className="equipment-topic-right">
                      <span className="equipment-topic-progress">{topicProgress.done}/{topicProgress.total}</span>
                      {!isPrint && (isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />)}
                    </span>
                  </button>
                  
                  {(isPrint || isOpen) && (
                    <div className="equipment-topic-body" data-testid={isPrint ? undefined : `equipment-topic-body-${topic.id}`}>
                      {topic.items.map((item) => (
                        <div
                          key={item.id}
                          className="equipment-item"
                          data-testid={isPrint ? undefined : `equipment-item-${item.id}`}
                          onClick={isPrint ? undefined : (event) => {
                            if (event.target.closest('input, textarea, button')) return;
                            toggle(item.id);
                          }}
                        >
                          <label className="equipment-check-control">
                            <input
                              type="checkbox"
                              checked={isChecked(item.id)}
                              onChange={isPrint ? () => {} : () => toggle(item.id)}
                              readOnly={isPrint}
                              style={isPrint ? { pointerEvents: 'none' } : undefined}
                            />
                          </label>
                          <span className="equipment-item-text">
                            <span className="equipment-item-label">
                              {isPrint ? `• ${item.label[lang]}` : highlightText(item.label[lang], searchTerm)}
                            </span>
                            {item.hint && (
                              <span className="equipment-item-hint">
                                {isPrint ? item.hint[lang] : highlightText(item.hint[lang], searchTerm)}
                              </span>
                            )}
                            {(() => {
                              const fields = getEquipmentItemFields(item, topic, key);
                              const details = getItemDetails(item.id);
                              const hasQuantity = fields.quantity && details.quantity;
                              const hasNote = fields.note && details.note;

                              if (isPrint) {
                                if (!hasQuantity && !hasNote) return null;
                                return (
                                  <span className="equipment-print-meta">
                                    {hasQuantity ? `${t.equipQuantityLabel}: ${details.quantity}` : ''}
                                    {hasQuantity && hasNote ? ' | ' : ''}
                                    {hasNote ? `${t.noteLabel}: ${details.note}` : ''}
                                  </span>
                                );
                              }

                              if (!fields.quantity && !fields.note) return null;

                              return (
                                <span className="equipment-item-fields" onClick={(event) => event.stopPropagation()}>
                                  {fields.quantity && (
                                    <label className="equipment-quantity-field">
                                      <span className="equipment-field-label">{t.equipQuantityLabel}</span>
                                      <input
                                        type="number"
                                        inputMode="numeric"
                                        min="0"
                                        step="1"
                                        value={details.quantity}
                                        onChange={(event) => setQuantity(item.id, event.target.value)}
                                        placeholder="1"
                                        aria-label={t.equipQuantityForAria.replace('{item}', item.label[lang])}
                                      />
                                    </label>
                                  )}
                                  {fields.note && (
                                    <label className="equipment-note-field">
                                      <span className="equipment-field-label">{t.noteLabel}</span>
                                      <textarea
                                        rows="1"
                                        value={details.note}
                                        onChange={(event) => setNote(item.id, event.target.value)}
                                        placeholder={t.equipNotePlaceholder}
                                        aria-label={t.equipNoteForAria.replace('{item}', item.label[lang])}
                                      />
                                    </label>
                                  )}
                                </span>
                              );
                            })()}
                          </span>
                        </div>
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
          <span>{t.equipInfoNote}</span>
        </div>
        <div className="equipment-export-wrap" ref={menuRef}>
          <button
            type="button"
            className="equipment-export-btn"
            data-testid="equipment-export-btn"
            onClick={() => setExportMenuOpen(prev => !prev)}
          >
            <Share2 size={16} />
            <span>{t.equipExportBackupBtn}</span>
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
              <div className="menu-section-title">{t.equipExportExcelSection}</div>
              <button type="button" onClick={() => handleExportCsv('both', false)}>
                <FileSpreadsheet size={14} className="menu-icon-csv" />
                <span>{t.equipExportExcelAll}</span>
              </button>
              <button type="button" onClick={() => handleExportCsv('both', true)}>
                <FileSpreadsheet size={14} className="menu-icon-csv" />
                <span>{t.equipExportExcelChecked}</span>
              </button>

              <div className="menu-divider" />

              <div className="menu-section-title">{t.equipPrintMediaSection}</div>
              <button type="button" onClick={() => handlePrint(false)}>
                <Printer size={14} className="menu-icon-print" />
                <span>{t.equipPrintAll}</span>
              </button>
              <button type="button" onClick={() => handlePrint(true)}>
                <Printer size={14} className="menu-icon-print" />
                <span>{t.equipPrintChecked}</span>
              </button>
              <button type="button" onClick={() => handleExportImage('both', false)}>
                <ImageIcon size={14} className="menu-icon-image" />
                <span>{t.equipExportImageAll}</span>
              </button>
              <button type="button" onClick={() => handleExportImage('both', true)}>
                <ImageIcon size={14} className="menu-icon-image" />
                <span>{t.equipExportImageChecked}</span>
              </button>

              <div className="menu-divider" />

              <div className="menu-section-title">{t.equipBackupSection}</div>
              <button type="button" onClick={handleExportJson}>
                <Download size={14} className="menu-icon-download" />
                <span>{t.equipSaveBackup}</span>
              </button>
              <button type="button" onClick={() => fileInputRef.current.click()}>
                <Upload size={14} className="menu-icon-upload" />
                <span>{t.equipLoadBackup}</span>
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
            placeholder={t.equipSearchPlaceholder}
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
              title={t.equipClearSearch}
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
            {t.equipFilterAll}
          </button>
          <button
            type="button"
            className={`equipment-filter-chip ${statusFilter === 'unchecked' ? 'active' : ''}`}
            onClick={() => setStatusFilter('unchecked')}
          >
            {t.equipFilterUnchecked}
          </button>
          <button
            type="button"
            className={`equipment-filter-chip ${statusFilter === 'checked' ? 'active' : ''}`}
            onClick={() => setStatusFilter('checked')}
          >
            {t.equipFilterChecked}
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
          <span>{t.equipTabShared}</span>
        </button>
        <button
          type="button"
          data-testid="equipment-section-toggle-personal"
          className={`equipment-section-tab ${activeKey === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveKey('personal')}
        >
          <User size={16} />
          <span>{t.equipTabPersonal}</span>
        </button>
      </div>

      <div className="equipment-screen-only-container">
        {renderSection(activeKey, equipmentData[activeKey], false)}
      </div>

      {printContainer}
    </div>
  );
}
