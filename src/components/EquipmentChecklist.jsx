import { useState } from 'react';
import { ChevronDown, ChevronUp, Image as ImageIcon, Users, User } from 'lucide-react';
import equipmentData from '../data/equipmentChecklist.json';
import useEquipmentChecklist from '../hooks/useEquipmentChecklist';
import { exportEquipmentImageAsPng } from '../utils/exportEquipmentImage';
import { trackEvent } from '../utils/analytics';

export default function EquipmentChecklist() {
  const [activeKey, setActiveKey] = useState('shared');
  const [openTopics, setOpenTopics] = useState({});
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const { isChecked, toggle, getTopicProgress, getSectionProgress, checkedMap } = useEquipmentChecklist();

  const activeSection = equipmentData[activeKey];
  const sectionProgress = getSectionProgress(activeSection);

  const toggleTopic = (topicId) => {
    setOpenTopics(prev => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  const handleExport = async (scope) => {
    setExportMenuOpen(false);
    trackEvent('equipment_export', { scope });
    await exportEquipmentImageAsPng({
      shared: scope === 'personal' ? null : equipmentData.shared,
      personal: scope === 'shared' ? null : equipmentData.personal,
      checkedMap
    });
  };

  return (
    <div className="equipment-checklist stagger-slide-up" style={{ '--card-index': 0 }}>
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

      <div className="equipment-section-header">
        <h3>{activeSection.title}</h3>
        <span className="equipment-progress-badge">
          {sectionProgress.done}/{sectionProgress.total} סומנו
        </span>
      </div>

      <div className="equipment-topics">
        {activeSection.topics.map((topic) => {
          const isOpen = !!openTopics[topic.id];
          const progress = getTopicProgress(topic);
          return (
            <div key={topic.id} className={`equipment-topic ${isOpen ? 'open' : ''}`}>
              <button
                type="button"
                className="equipment-topic-header"
                data-testid={`equipment-topic-${topic.id}`}
                onClick={() => toggleTopic(topic.id)}
              >
                <span className="equipment-topic-heading">{topic.heading}</span>
                <span className="equipment-topic-right">
                  <span className="equipment-topic-progress">{progress.done}/{progress.total}</span>
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </button>
              {isOpen && (
                <div className="equipment-topic-body">
                  {topic.items.map((item) => (
                    <label
                      key={item.id}
                      className="equipment-item"
                      data-testid={`equipment-item-${item.id}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked(item.id)}
                        onChange={() => toggle(item.id)}
                      />
                      <span className="equipment-item-text">
                        <span className="equipment-item-label">{item.label}</span>
                        {item.hint && <span className="equipment-item-hint">{item.hint}</span>}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="equipment-export-wrap">
        <button
          type="button"
          className="equipment-export-btn"
          data-testid="equipment-export-btn"
          onClick={() => setExportMenuOpen(prev => !prev)}
        >
          <ImageIcon size={16} />
          <span>ייצוא לתמונה</span>
        </button>
        {exportMenuOpen && (
          <div className="equipment-export-menu">
            <button type="button" onClick={() => handleExport('shared')}>ציוד שטח בלבד</button>
            <button type="button" onClick={() => handleExport('personal')}>ציוד אישי בלבד</button>
            <button type="button" onClick={() => handleExport('both')}>שניהם</button>
          </div>
        )}
      </div>
    </div>
  );
}
