import { useState } from 'react';
import useGuides from '../hooks/useGuides';
import { getGuideIcon } from '../utils/guideIcons';
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

export default function FestivalGuide({ lang }) {
  const { guides } = useGuides();
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [openTopics, setOpenTopics] = useState({});

  const toggleTopic = (index) => {
    setOpenTopics(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleBack = () => {
    setSelectedGuide(null);
    setOpenTopics({});
  };

  if (selectedGuide) {
    return (
      <div className="guide-container stagger-slide-up" style={{ '--card-index': 0 }}>
        <header className="guide-header">
          <button className="guide-back-btn" onClick={handleBack}>
            <ArrowRight size={18} />
            <span>חזרה למדריכים</span>
          </button>
          <h2>{selectedGuide.title}</h2>
        </header>
        <div className="guide-topics">
          {selectedGuide.topics.map((topic, index) => (
            <div
              key={index}
              className={`guide-topic ${openTopics[index] ? 'open' : ''}`}
              style={{ '--card-index': index + 1 }}
            >
              <button
                className="guide-topic-header"
                onClick={() => toggleTopic(index)}
              >
                <span>{topic.heading}</span>
                {openTopics[index] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {openTopics[index] && (
                <div
                  className="guide-topic-body"
                  dangerouslySetInnerHTML={{ __html: topic.html }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (guides.length === 0) {
    return (
      <div className="guide-container stagger-slide-up" style={{ '--card-index': 0 }}>
        <header className="guide-header">
          <h2>מדריך הפסטיבל</h2>
          <p className="guide-subtitle">טיפים, עצות והתמצאות בשטח פסטיבל אוזורה 2026 – בקרוב!</p>
        </header>
      </div>
    );
  }

  return (
    <div className="guide-container stagger-slide-up" style={{ '--card-index': 0 }}>
      <header className="guide-header">
        <h2>מדריך הפסטיבל</h2>
        <p className="guide-subtitle">טיפים, עצות והתמצאות בשטח פסטיבל אוזורה 2026</p>
      </header>
      <div className="guide-grid">
        {guides.map((guide, index) => {
          const Icon = getGuideIcon(guide.icon);
          return (
            <div
              key={guide.slug}
              className="guide-card"
              style={{ '--card-index': index + 1 }}
              onClick={() => setSelectedGuide(guide)}
            >
              <div className="guide-card-icon">
                <Icon size={20} />
              </div>
              <h3>{guide.title}</h3>
              <p className="guide-card-topic-count">
                {guide.topics.length} נושאים
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
