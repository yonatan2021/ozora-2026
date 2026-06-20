import { Tent, Backpack, Compass, Map } from 'lucide-react';

export default function FestivalGuide({ lang }) {
  const isHe = lang === 'he';

  const categories = [
    {
      icon: Tent,
      title: isHe ? 'קמפינג ולינה' : 'Camping & Lodging',
      desc: isHe 
        ? 'טיפים למיקום האוהל, שמירה על ציוד אישי והתנהלות נכונה בשטחי הלינה.'
        : 'Best spots to pitch your tent, securing valuables, and campsite etiquette.'
    },
    {
      icon: Backpack,
      title: isHe ? 'רשימת ציוד חיוני' : 'Ultimate Packing List',
      desc: isHe
        ? 'כל מה שאתה חייב להביא לפסטיבל יער בקיץ: הגנה מהשמש, ביגוד מתאים ותרופות.'
        : 'Everything you need to pack for a summer forest festival: sun block, dust mask, and essentials.'
    },
    {
      icon: Compass,
      title: isHe ? 'התמצאות וניווט' : 'Festival Survival Guide',
      desc: isHe
        ? 'מדריך הבמות השונות, המעיינות, מוקדי העזרה הראשונה וחנויות האוכל.'
        : 'Guide to different stages, hot springs, first aid checkpoints, and food stalls.'
    },
    {
      icon: Map,
      title: isHe ? 'תחבורה והגעה' : 'Getting There & Away',
      desc: isHe
        ? 'איך מגיעים משדה התעופה בבודפשט, שאטלים רשמיים, רכבות ונסיעות משותפות.'
        : 'Shuttle buses from Budapest, train schedules, parking permits, and rideshares.'
    }
  ];

  return (
    <div className="guide-container stagger-slide-up" style={{ '--card-index': 0 }}>
      <header className="guide-header">
        <h2>{isHe ? 'מדריך הפסטיבל' : 'Festival Guide'}</h2>
        <p className="sim-desc">
          {isHe 
            ? 'טיפים, עצות והתמצאות בשטח פסטיבל אוזורו 2026 – בקרוב!' 
            : 'Guides, tips, and navigation instructions for Ozora 2026 – Coming Soon!'}
        </p>
      </header>
      <div className="guide-grid">
        {categories.map((cat, index) => {
          const Icon = cat.icon;
          return (
            <div 
              key={index} 
              className="guide-card" 
              style={{ '--card-index': index + 1 }}
            >
              <span className="coming-soon-badge">{isHe ? 'בקרוב' : 'Soon'}</span>
              <div className="guide-card-icon">
                <Icon size={20} />
              </div>
              <h3>{cat.title}</h3>
              <p>{cat.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
