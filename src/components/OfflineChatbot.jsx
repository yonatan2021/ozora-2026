import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  MessageCircle, 
  X, 
  Send, 
  Calendar, 
  MapPin, 
  Star, 
  BookOpen, 
  Backpack, 
  Sparkles, 
  ArrowUpRight,
  User
} from 'lucide-react';
import timetableData from '../data/timetable.json';
import venueMapData from '../data/venueMap.json';
import useGuides from '../hooks/useGuides';
import { translations } from '../utils/lang';
import { trackEvent } from '../utils/analytics';
import { getSetStatus } from '../utils/time';
import { searchSchedule, customTranslationMap, normalizePhonetics } from '../utils/search';
import { getNotes } from '../utils/notes';
import { getFriends } from '../utils/friends';
import artistOrigins from '../data/artistOrigins.json';
import { getCountryName, getRenderableOrigin } from '../utils/countryFlags';
import { getArtistConnections } from '../utils/connections';
import './OfflineChatbot.css';
const HEBREW_STOP_WORDS = new Set([
  'מתי', 'איפה', 'איך', 'מי', 'מה', 'של', 'את', 'עם', 'ב', 'ל', 'מ', 'ה', 'ו', 
  'באילו', 'באיזה', 'באיזו', 'יום', 'שעה', 'הופעה', 'הופעות', 'במה', 'במות', 
  'פסטיבל', 'אחי', 'אפשר', 'רוצה', 'לראות', 'למצוא', 'לדעת', 'ללכת', 'שם', 
  'קשור', 'על', 'אל', 'אני', 'אנחנו', 'אתה', 'הוא', 'היא', 'הם', 'הן', 'יש', 'אין', 'כן', 'לא'
]);

const ENGLISH_STOP_WORDS = new Set([
  'when', 'where', 'how', 'who', 'what', 'of', 'the', 'with', 'in', 'on', 'at', 
  'to', 'for', 'a', 'an', 'is', 'are', 'was', 'were', 'show', 'shows', 'stage', 
  'stages', 'artist', 'artists', 'festival', 'want', 'see', 'find', 'know', 'go', 
  'about', 'can', 'please', 'i', 'we', 'you', 'he', 'she', 'they', 'yes', 'no'
]);

const HEBREW_COUNTRY_NAMES = {
  IL: 'ישראל',
  GB: 'בריטניה',
  HU: 'הונגריה',
  ZA: 'דרום אפריקה',
  CH: 'שוויץ',
  DE: 'גרמניה',
  FR: 'צרפת',
  IT: 'איטליה',
  US: 'ארצות הברית',
  CN: 'סין',
  ES: 'ספרד',
  PT: 'פורטוגל',
  BR: 'ברזיל',
  IN: 'הודו',
  JP: 'יפן',
  NL: 'הולנד',
  BE: 'בלגיה',
  SE: 'שבדיה',
  GR: 'יוון',
  AT: 'אוסטריה',
  AU: 'אוסטרליה',
  CA: 'קנדה',
  DK: 'דנמרק',
  FI: 'פינלנד',
  NO: 'נורווגיה',
  NZ: 'ניו זילנד',
  PL: 'פולין',
  RO: 'רומניה',
  RU: 'רוסיה',
  UA: 'אוקראינה',
  MX: 'מקסיקו',
  CO: 'קולומביה',
  AR: 'ארגנטינה',
  CL: 'צ\'ילה',
  PE: 'פרו',
  EG: 'מצרים',
  MA: 'מרוקו',
  TH: 'תאילנד',
  SG: 'סינגפור'
};const getHebrewDay = (day) => {
  const map = {
    'Warmup Sat': 'חימום שבת',
    'Warmup Sun': 'חימום ראשון',
    'Day 1': 'יום 1 (שני)',
    'Day 2': 'יום 2 (שלישי)',
    'Day 3': 'יום 3 (רביעי)',
    'Day 4': 'יום 4 (חמישי)',
    'Day 5': 'יום 5 (שישי)',
    'Day 6': 'יום 6 (שבת)',
    'Day 7': 'יום 7 (ראשון)',
    'Day 8': 'יום 8 (שני)'
  };
  return map[day] || day;
};

const uniqueArtistsWithMetadata = Array.from(new Set(timetableData.map(s => s.artist))).map(artist => {
  const lower = artist.toLowerCase();
  const phoneticWords = artist
    .split(/[^a-zA-Z0-9\u0590-\u05FF]+/)
    .filter(Boolean)
    .map(word => normalizePhonetics(word))
    .filter(Boolean);
  return { artist, lower, phoneticWords };
});

const GUIDE_KEYWORDS = [
  {
    slug: 'transport',
    topicIndex: 0, // טיסות והגעה כללית
    keywords: ['טיסה', 'טיסות', 'בודפשט', 'נחיתה', 'לנחות', 'שדה תעופה', 'טיסות לבודפשט', 'הגעה', 'להגיע', 'איך מגיעים', 'איך מגיעים לפסטיבל', 'דרכי הגעה', 'הגעה לפסטיבל', 'נסיעה', 'לנסוע', 'תחבורה', 'מטוס', 'הונגריה', 'חניה', 'flight', 'flights', 'airport', 'budapest', 'travel', 'arrive', 'getting there', 'how to get', 'obn', 'hungary', 'plane', 'airplane', 'car park', 'parking lot']
  },
  {
    slug: 'transport',
    topicIndex: 1, // רכבת
    keywords: ['רכבת', 'רכבות', 'שימונטורניה', 'deli', 'mav', 'train', 'trains', 'simontornya', 'תחנת רכבת', 'כרטיס רכבת', 'timetable train', 'train ticket', 'railway', 'rail']
  },
  {
    slug: 'transport',
    topicIndex: 2, // רישום רכבים
    keywords: ['רכב', 'רכבים', 'מכונית', 'לוחית רישוי', 'קארוון', 'אופנוע', 'נגרר', 'רישום רכב', 'חוק חדש', 'car registration', 'vehicle', 'plates', 'אישור רכב', 'רישום מכונית', 'מדבקה', 'toll', 'permit', 'license plate', 'car pass', 'vehicle pass']
  },
  {
    slug: 'transport',
    topicIndex: 3, // מוניות
    keywords: ['מונית', 'מוניות', 'פקק', 'פקקים', 'נהג', 'taxi', 'taxis', 'טלפון מונית', 'נהגים', 'מספר מונית', 'taxi number', 'cab', 'cabs', 'driver', 'uber', 'bolt']
  },
  {
    slug: 'transport',
    topicIndex: 4, // שאטלים
    keywords: ['שאטל', 'שאטלים', 'הסעה', 'הסעות', 'shuttle', 'shuttles', 'ozorashuttle', 'כרטיס שאטל', 'מחיר שאטל', 'שאטל רכבת', 'shuttle bus', 'shuttle ticket', 'shuttle times']
  },
  {
    slug: 'health-safety',
    topicIndex: 0, // מזג אוויר
    keywords: ['חום', 'קור', 'גשם', 'סופה', 'בוץ', 'מזג אוויר', 'מעלות', 'אבק', 'טמפרטורה', 'weather', 'rain', 'hot', 'cold', 'storm', 'mud', 'dust', 'שמש', 'רוח', 'מזג האויר', 'חם', 'קר', 'sun', 'wind', 'forecast', 'temp']
  },
  {
    slug: 'health-safety',
    topicIndex: 1, // מרפאה
    keywords: ['מרפאה', 'רופא', 'רופאים', 'חובש', 'חובשים', 'עזרה ראשונה', 'אמבולנס', 'פציעה', 'עקיצה', 'עקיצות', 'כוויות', 'חתך', 'חירום', 'medical', 'doctor', 'first aid', 'hospital', 'emergency', 'בית חולים', 'תרופה', 'תרופות', 'טיפול', 'חולה', 'כאב', 'כאבים', 'מקל', 'פראמדיק', 'clinic', 'pharmacy', 'medicine', 'hurt', 'injury', 'sick', 'pain', 'paramedic']
  },
  {
    slug: 'health-safety',
    topicIndex: 2, // תמיכה רגשית
    keywords: ['חרדה', 'טריפ', 'טריפ רע', 'פסיכדלי', 'נפשי', 'מנטלי', 'הייבן', 'haven', 'תמיכה', 'בלבול', 'עומס חושי', 'bad trip', 'support', 'emotional', 'הפחדה', 'לחץ', 'פאניקה', 'הייבן', 'פסיכדליה', 'אוהל הייבן', 'התקף חרדה', 'badtrip', 'panic', 'anxiety', 'overwhelmed', 'psychological', 'safe space', 'mental health']
  },
  {
    slug: 'health-safety',
    topicIndex: 3, // אבטחה וגניבות
    keywords: ['גניבה', 'גניבות', 'לגנוב', 'גנבו', 'מנעול', 'דרכון', 'כסף', 'יקר', 'שמירה', 'אבטחה', 'סדרנים', 'security', 'theft', 'steal', 'passport', 'משטרה', 'שוטר', 'שוטרים', 'שומר', 'כספת', 'חפצים', 'גנב', 'police', 'cop', 'cops', 'guard', 'safe', 'lock', 'stolen', 'lost property']
  },
  {
    slug: 'food-shopping',
    topicIndex: 0, // קנטינה
    keywords: ['קנטינה', 'canteen', 'אוכל חם', 'מנה הונגרית', 'בשרי', 'תבשיל', 'תפריט', 'ארוחה', 'אוכל זול', 'מרק', 'meal', 'cheap food', 'soup', 'menu']
  },
  {
    slug: 'food-shopping',
    topicIndex: 1, // דוכנים
    keywords: ['אוכל', 'לאכול', 'רעב', 'דוכן', 'דוכנים', 'פיצה', 'פלאפל', 'לאנגוש', 'צמחוני', 'טבעוני', 'בשרי', 'ללא גלוטן', 'street food', 'pizza', 'falafel', 'vegan', 'vegetarian', 'שתיה', 'מים', 'מתוק', 'בשר', 'המבורגר', 'שייק', 'קפה', 'gluten free', 'burger', 'smoothie', 'coffee', 'drink', 'drinks', 'food stalls']
  },
  {
    slug: 'food-shopping',
    topicIndex: 2, // סופרמרקט
    keywords: ['סופר', 'סופרמרקט', 'מכולת', 'קניות', 'ירקות', 'פירות', 'לחם', 'לידל', 'טסקו', 'lidl', 'tesco', 'supermarket', 'grocery', 'shopping', 'חנות', 'לקנות אוכל', 'אלכוהול', 'בירה', 'קרח', 'shop', 'beer', 'ice', 'buy food']
  },
  {
    slug: 'food-shopping',
    topicIndex: 3, // בישול עצמי
    keywords: ['בישול', 'לבשל', 'גזיה', 'גזיות', 'אש', 'מדורות', 'שימורים', 'טונה', 'cooking', 'gas', 'stove', 'מנגל', 'גז', 'סיר', 'מחבת', 'עצים לבעירה', 'grill', 'bbq', 'pots', 'firewood']
  },
  {
    slug: 'camping',
    topicIndex: 0, // קמפינג בשטח
    keywords: ['קמפינג', 'לישון', 'לינה', 'אוהל', 'אוהלים', 'מזרן', 'מזרנים', 'שקט', 'רעש', 'יער', 'צל', 'camping', 'tent', 'tents', 'sleep', 'quiet', 'מחנה', 'זולה', 'ערסל', 'רעש', 'לילה', 'camp', 'hammock', 'noisy', 'night']
  },
  {
    slug: 'camping',
    topicIndex: 1, // קארוון
    keywords: ['קארוון', 'קרוואן', 'קרוונים', 'rv', 'campervan', 'motorhome', 'קרוון', 'קמפר', 'camper', 'caravan', 'caravans']
  },
  {
    slug: 'camping',
    topicIndex: 2, // רכב צמוד
    keywords: ['רכב ליד האוהל', 'חניה ליד האוהל', 'ציליה', 'רכב צמוד', 'להחנות ליד האוהל', 'car near tent', 'car next to tent']
  },
  {
    slug: 'camping',
    topicIndex: 3, // קהילה ושכנים
    keywords: ['קהילה', 'שכנים', 'חברים', 'עזרה', 'שיתוף', 'community', 'neighbors', 'friends', 'cooperation', 'share', 'neighborhood']
  },
  {
    slug: 'facilities',
    topicIndex: 0, // מקלחות
    keywords: ['מקלחת', 'מקלחות', 'להתקלח', 'מים קרים', 'קפואים', 'תור', 'תורים', 'shower', 'showers', 'cold water', 'סבון', 'שמפו', 'מגבת', 'חם', 'soap', 'shampoo', 'towel', 'hot water']
  },
  {
    slug: 'facilities',
    topicIndex: 1, // שירותים
    keywords: ['שירותים', 'שרותים', 'ניקוי', 'נייר טואלט', 'אלקוגל', 'toilet', 'toilets', 'wc', 'שירותי קומפוסט', 'נייר', 'קקי', 'toilet paper', 'compost toilet', 'bathroom', 'restroom']
  },
  {
    slug: 'facilities',
    topicIndex: 2, // מקלחת ניידת
    keywords: ['מקלחת ניידת', 'מקלחת סולארית', 'אוהל מקלחת', 'מקלחת קמפינג', 'solar shower', 'camping shower', 'pocket shower']
  },
  {
    slug: 'tickets',
    topicIndex: 0, // תהליך הרכישה
    keywords: ['כרטיס', 'כרטיסים', 'לקנות', 'קניה', 'רכישה', 'ticket', 'tickets', 'buy', 'simple pay', 'ozora id', 'מחיר', 'כניסה', 'שער', 'price', 'entry', 'gate', 'purchase']
  },
  {
    slug: 'tickets',
    topicIndex: 1, // שיטות תשלום
    keywords: ['תשלום', 'לשלם', 'אשראי', 'מזומן', 'יורו', 'פורינט', 'simplepay', 'partial payment', 'pay', 'cash', 'credit card', 'דולר', 'עודף', 'כרטיס אשראי', 'huf', 'euro', 'exchange', 'currency', 'change']
  },
  {
    slug: 'tickets',
    topicIndex: 2, // מכירה והעברה
    keywords: ['העברת כרטיס', 'מכירת כרטיס', 'למכור כרטיס', 'להעביר כרטיס', 'שם בכרטיס', 'transfer', 'sell', 'שינוי שם', 'כרטיס יד שניה', 'name change', 'second hand ticket', 'ticket transfer']
  },
  {
    slug: 'tickets',
    topicIndex: 3, // ילדים ובעלי חיים
    keywords: ['ילד', 'ילדים', 'כלב', 'כלבים', 'חיות', 'חיה', 'בעלי חיים', 'חיסון', 'חיסונים', 'כלבת', 'pet', 'pets', 'dog', 'dogs', 'kid', 'kids', 'children', 'תינוק', 'משפחה', 'חתול', 'חיסון כלבת', 'baby', 'family', 'rabies', 'vaccination']
  },
  {
    slug: 'equipment',
    topicIndex: 0, // איפה קונים
    keywords: ['דקתלון', 'decathlon', 'auchun', 'obi', 'ציוד הונגריה', 'איפה לקנות', 'אושהן', 'אובי', 'לקנות ציוד', 'buying gear', 'shopping hungary']
  },
  {
    slug: 'equipment',
    topicIndex: 1, // ציוד חובה
    keywords: ['רשימת ציוד', 'ציוד חובה', 'מה להביא', 'מזרן', 'אטמי אוזניים', 'פנס ראש', 'חבל כביסה', 'packing list', 'gear', 'כרית', 'שק שינה', 'מטען נייד', 'pillow', 'sleeping bag', 'powerbank', 'earplugs', 'flashlight']
  },
  {
    slug: 'equipment',
    topicIndex: 2, // הגנה משמש
    keywords: ['שמש', 'חום', 'קרם הגנה', 'כובע', 'משקפי שמש', 'שפריצר', 'מאוורר', 'sun', 'heat', 'fan', 'משקפיים', 'לחות', 'צלייה', 'sunglasses', 'sunscreen', 'hat', 'shade']
  },
  {
    slug: 'equipment',
    topicIndex: 3, // עזרה ראשונה אישי
    keywords: ['אלקטרוליטים', 'משככי כאבים', 'פלסטר', 'פלסטרים', 'מגבונים', 'כדורים', 'בנדז\'', 'מגבונים לחים', 'wipes', 'plaster', 'painkiller', 'bandaid', 'electrolytes']
  },
  {
    slug: 'navigation',
    topicIndex: 0, // פתיחת שערים
    keywords: ['פתיחת שערים', 'שערים נפתחים', 'מתי נפתח', 'טקס פתיחה', 'טקס', 'פתיחה', 'opening ceremony', 'gates open', 'מתי אפשר להיכנס', 'מתי מתחיל', 'opening hours', 'when does it start']
  },
  {
    slug: 'navigation',
    topicIndex: 1, // איך לא ללכת לאיבוד
    keywords: ['איבוד', 'לאבד', 'ללכת לאיבוד', 'למצוא', 'נקודת מפגש', 'מפגש', 'lost', 'find', 'איבדתי', 'נאבד', 'מפגשים', 'meetup', 'lost and found', 'meeting point']
  },
  {
    slug: 'navigation',
    topicIndex: 2, // ציוני דרך
    keywords: ['פסל', 'פסלים', 'אדם וחוה', 'עץ העולם', 'מצפה הפרפרים', 'גן התבלינים', 'art', 'statue', 'sculpture', 'butterfly', 'vilagfa', 'מבנים', 'אמנות', 'גלריה', 'structures', 'gallery', 'exhibit']
  },
  {
    slug: 'navigation',
    topicIndex: 3, // שמירה על הניקיון
    keywords: ['זבל', 'אשפה', 'לכלוך', 'שקיות', 'מיחזור', 'recycling', 'trash', 'clean', 'פח זבל', 'שקית זבל', 'ניקוי', 'שקיות אשפה', 'garbage', 'litter', 'rubbish', 'green card']
  },
  {
    slug: 'stages-activities',
    topicIndex: 0, // במות
    keywords: ['במה', 'במות', 'הבמות', 'אוזורה סטייג\'', 'כיפה', 'הכיפה', 'dome', 'pumpui', 'dragon nest', 'ambyss', 'tek zero', 'מוזיקה', 'music', 'stages', 'הופעה', 'מסיבה', 'לרקוד', 'מיין סטייג\'', 'במת פומפוי', 'main stage', 'party', 'dance', 'dj']
  },
  {
    slug: 'stages-activities',
    topicIndex: 1, // סדנאות
    keywords: ['סדנה', 'סדנאות', 'הרצאה', 'הרצאות', 'יוגה', 'מדיטציה', 'צ\'מבוק', 'compass', 'healion', 'yoga', 'meditation', 'הוראה', 'רוחניות', 'ריפוי', 'spiritual', 'lecture', 'healing', 'chambok']
  },
  {
    slug: 'stages-activities',
    topicIndex: 2, // אמנות
    keywords: ['יצירה', 'ארטיבארן', 'artibarn', 'קרקס', 'circus', 'מיראדור', 'mirador', 'אקרובטיקה', 'להטוטנות', 'אש', 'מופעים', 'תאטרון', 'קולנוע', 'theater', 'cinema', 'performances', 'acrobatics']
  }
];

/** Renders bot text with **bold**, newlines, • bullets, and [links](urls) */
function BotText({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <span className="chatbot-bot-text">
      {lines.map((line, li) => {
        let currentLine = line;
        let isBullet = false;
        
        // Bullet list support
        if (currentLine.trim().startsWith('* ') || currentLine.trim().startsWith('- ')) {
          isBullet = true;
          currentLine = currentLine.trim().substring(2);
        } else if (currentLine.trim().startsWith('• ')) {
          isBullet = true;
          currentLine = currentLine.trim().substring(2);
        }
        
        // Parse markdown links: [text](url)
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const parts = [];
        let lastIndex = 0;
        let match;
        
        while ((match = linkRegex.exec(currentLine)) !== null) {
          if (match.index > lastIndex) {
            parts.push(currentLine.substring(lastIndex, match.index));
          }
          parts.push(
            <a 
              key={`link-${match.index}`} 
              href={match[2]} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#f472b6', textDecoration: 'underline', fontWeight: 600 }}
            >
              {match[1]}
            </a>
          );
          lastIndex = linkRegex.lastIndex;
        }
        
        if (lastIndex < currentLine.length) {
          parts.push(currentLine.substring(lastIndex));
        }
        
        const finalContent = parts.length > 0 ? parts : [currentLine];
        
        // Render bold markers within text parts
        const boldRendered = finalContent.map((part, pi) => {
          if (typeof part !== 'string') return part;
          const boldParts = part.split(/\*\*([^*]+)\*\*/g);
          return boldParts.map((sub, si) => 
            si % 2 === 1 ? <strong key={`bold-${pi}-${si}`}>{sub}</strong> : sub
          );
        });

        return (
          <span 
            key={li} 
            style={{ 
              display: 'block', 
              paddingLeft: isBullet ? '16px' : '0',
              textIndent: isBullet ? '-16px' : '0',
              marginBottom: '6px'
            }}
          >
            {isBullet && <span style={{ color: '#db2777', marginRight: '6px' }}>•</span>}
            {boldRendered}
          </span>
        );
      })}
    </span>
  );
}

export default function OfflineChatbot({ 
  lang, 
  favorites, 
  toggleFavorite, 
  onSelectSet, 
  onShowOnMap, 
  evalTime 
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const t = translations[lang];
  const isHe = lang === 'he';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { guides } = useGuides();

  // Scroll to bottom when messages or open state changes
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Initial welcome message (reset or set once when chat opens)
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'bot',
          text: t.botWelcome
        }
      ]);
    }
  }, [isOpen, messages.length, t.botWelcome]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    trackEvent('chatbot_toggle', { action: !isOpen ? 'open' : 'close' });
  };

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    const userQuery = inputValue;
    setInputValue('');

    // Add user message
    const userMsgId = `user-${Date.now()}`;
    setMessages(prev => [...prev, { id: userMsgId, sender: 'user', text: userQuery }]);

    trackEvent('chatbot_query', { query: userQuery });

    // Show typing indicator, then respond
    setIsTyping(true);
    setTimeout(() => {
      const response = processQuery(userQuery);
      setIsTyping(false);
      setMessages(prev => [...prev, { id: `bot-${Date.now()}`, sender: 'bot', ...response }]);
    }, 600);
  };

  // Helper to normalize strings for search (lowercase, trim, Hebrew cleanup)
  const normalize = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .trim()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
  };

  const processQuery = (rawQuery) => {
    const query = normalize(rawQuery);
    if (!query) return { text: t.botFallback };

    const cleanTokens = query.split(/\s+/).filter(word => !HEBREW_STOP_WORDS.has(word) && !ENGLISH_STOP_WORDS.has(word));
    const translatedTokens = cleanTokens.map(token => {
      if (customTranslationMap[token]) return customTranslationMap[token];
      for (const [key, value] of Object.entries(customTranslationMap)) {
        if (token.includes(key) || key.includes(token)) return value;
      }
      return token;
    });

    const normalizedQuery = query;

    // 1. SCORING APPS / FEATURES / QUICK REPLIES
    const isNowQuery = 
      normalizedQuery.includes('now') || 
      normalizedQuery.includes('playing') || 
      normalizedQuery.includes('currently') || 
      normalizedQuery.includes('עכשיו') || 
      normalizedQuery.includes('מנגן') || 
      normalizedQuery.includes('מי מנגן') || 
      normalizedQuery.includes('לייב') || 
      normalizedQuery.includes('live');

    const isChecklistQuery = 
      normalizedQuery.includes('pack') || 
      normalizedQuery.includes('backpack') || 
      normalizedQuery.includes('checklist') || 
      normalizedQuery.includes('equipment') || 
      normalizedQuery.includes('gear') || 
      normalizedQuery.includes('tent') || 
      normalizedQuery.includes('sleeping bag') || 
      normalizedQuery.includes('ציוד') || 
      normalizedQuery.includes('צ\'קליסט') || 
      normalizedQuery.includes('צקליסט') || 
      normalizedQuery.includes('אוהל') || 
      normalizedQuery.includes('שק שינה') || 
      normalizedQuery.includes('מזוודה') || 
      normalizedQuery.includes('תיק') || 
      normalizedQuery.includes('להביא');

    const isAppGuideQuery = 
      normalizedQuery.includes('save') || 
      normalizedQuery.includes('star') || 
      normalizedQuery.includes('favorite') || 
      normalizedQuery.includes('share') || 
      normalizedQuery.includes('coordination') || 
      normalizedQuery.includes('compare') || 
      normalizedQuery.includes('friend') || 
      normalizedQuery.includes('offline') || 
      normalizedQuery.includes('install') || 
      normalizedQuery.includes('מועדפים') || 
      normalizedQuery.includes('כוכב') || 
      normalizedQuery.includes('לשמור') || 
      normalizedQuery.includes('לשתף') || 
      normalizedQuery.includes('חבר') || 
      normalizedQuery.includes('השוואה') || 
      normalizedQuery.includes('אופליין') || 
      normalizedQuery.includes('התקן') || 
      normalizedQuery.includes('התקנה') || 
      normalizedQuery.includes('איך משתמשים') || 
      normalizedQuery.includes('הסבר') || 
      normalizedQuery.includes('מדריך') ||
      normalizedQuery.includes('הוראות');

    const isMapQuery =
      normalizedQuery.includes('מפה') ||
      normalizedQuery.includes('ניווט') ||
      normalizedQuery.includes('איפה הבמות') ||
      normalizedQuery.includes('map') ||
      normalizedQuery.includes('gps') ||
      normalizedQuery.includes('location') ||
      normalizedQuery.includes('navigate');

    const isMyScheduleQuery =
      normalizedQuery.includes('הלוח שלי') ||
      normalizedQuery.includes('לוח שלי') ||
      normalizedQuery.includes('הופעות שלי') ||
      normalizedQuery.includes('שמרתי') ||
      normalizedQuery.includes('מועדפים') ||
      normalizedQuery.includes('my schedule') ||
      normalizedQuery.includes('saved') ||
      normalizedQuery.includes('favorites') ||
      normalizedQuery.includes('my lineup') ||
      normalizedQuery.includes('הליינאפ שלי');

    const isTimetableQuery =
      normalizedQuery.includes('לוח הופעות') ||
      normalizedQuery.includes('לוח זמנים') ||
      normalizedQuery.includes('ליינאפ') ||
      normalizedQuery.includes('שעות') ||
      normalizedQuery.includes('מתי מנגנים') ||
      normalizedQuery.includes('timetable') ||
      normalizedQuery.includes('schedule') ||
      normalizedQuery.includes('lineup') ||
      normalizedQuery.includes('hours') ||
      normalizedQuery.includes('shows');

    const isGuideRootQuery =
      normalizedQuery.includes('מדריך') ||
      normalizedQuery.includes('מידע כללי') ||
      normalizedQuery.includes('guide') ||
      normalizedQuery.includes('guides') ||
      normalizedQuery.includes('info') ||
      normalizedQuery.includes('information') ||
      normalizedQuery.includes('מדריכים');

    // 2. SCORING ARTISTS USING SEARCHSCHEDULE
    let bestArtistScore = 0;
    let matchedArtists = [];

    const searchResults = searchSchedule(rawQuery, timetableData, { lang, favorites });
    if (searchResults && searchResults.length > 0) {
      const topArtist = searchResults[0].artist;
      const topArtistLower = topArtist.toLowerCase();
      
      const hasDirectNameMatch = normalizedQuery.includes(topArtistLower) || 
        cleanTokens.some(t => {
          const trans = customTranslationMap[t] || '';
          return trans && topArtistLower.includes(trans);
        }) ||
        cleanTokens.some(t => {
          const phon = normalizePhonetics(t);
          const artPhons = uniqueArtistsWithMetadata.find(a => a.artist === topArtist)?.phoneticWords || [];
          return phon && artPhons.includes(phon);
        });

      if (hasDirectNameMatch) {
        bestArtistScore = 100;
        matchedArtists = Array.from(new Set(searchResults.filter(s => {
          const sLower = s.artist.toLowerCase();
          return normalizedQuery.includes(sLower) || cleanTokens.some(t => {
            const trans = customTranslationMap[t] || '';
            return trans && sLower.includes(trans);
          }) || cleanTokens.some(t => {
            const phon = normalizePhonetics(t);
            const artPhons = uniqueArtistsWithMetadata.find(a => a.artist === s.artist)?.phoneticWords || [];
            return phon && artPhons.includes(phon);
          });
        }).map(s => s.artist)));

        if (matchedArtists.length === 0) {
          matchedArtists = [topArtist];
        }
      } else {
        bestArtistScore = 75;
        matchedArtists = Array.from(new Set(searchResults.map(s => s.artist))).slice(0, 3);
      }
    }

    // 3. SCORING POIs
    let bestPoiScore = 0;
    let matchedPoi = null;

    venueMapData.pois.forEach(poi => {
      let score = 0;
      const nameEn = poi.name.toLowerCase();
      const nameHe = poi.nameHe ? poi.nameHe.toLowerCase() : '';
      const stageName = poi.stageName ? poi.stageName.toLowerCase() : '';
      const tags = (poi.tags || []).map(t => t.toLowerCase());

      // Direct match
      if (
        normalizedQuery.includes(nameEn) || 
        (nameHe && normalizedQuery.includes(nameHe)) ||
        (stageName && normalizedQuery.includes(stageName))
      ) {
        score = 100;
      }

      // Translated contains
      const translatedQuery = cleanTokens.map(t => customTranslationMap[t] || t).join(' ');
      if (
        translatedQuery.includes(nameEn) || 
        (stageName && translatedQuery.includes(stageName)) ||
        tags.some(tag => translatedQuery.includes(tag))
      ) {
        score = Math.max(score, 90);
      }

      // Token match
      cleanTokens.forEach(token => {
        if (
          nameEn.includes(token) || 
          (nameHe && nameHe.includes(token)) || 
          (stageName && stageName.includes(token)) ||
          tags.includes(token)
        ) {
          score = Math.max(score, 80);
        }
      });

      if (score >= 60) {
        if (score > bestPoiScore) {
          bestPoiScore = score;
          matchedPoi = poi;
        }
      }
    });

    // 4. SCORING GUIDES (With Keyword Mapping)
    let bestGuideScore = 0;
    let matchedGuideObj = null;

    if (guides && guides.length > 0) {
      guides.forEach(guide => {
        const guideTitleNorm = guide.title.toLowerCase();
        let guideTitleScore = 0;
        cleanTokens.forEach(token => {
          if (guideTitleNorm.includes(token)) {
            guideTitleScore += 15;
          }
        });

        guide.topics.forEach((topic, idx) => {
          let score = guideTitleScore;
          const headingNorm = topic.heading.toLowerCase();
          
          const textContent = topic.markdown || (topic.html ? topic.html.replace(/<[^>]*>/g, '') : '');
          const bodyText = textContent.toLowerCase();

          // Heading matches
          cleanTokens.forEach(token => {
            if (headingNorm.includes(token)) {
              score += 25;
            }
          });

          // Body matches
          cleanTokens.forEach(token => {
            if (bodyText.includes(token)) {
              score += 5;
            }
          });

          // Substring matches
          if (headingNorm.includes(normalizedQuery) || normalizedQuery.includes(headingNorm)) {
            score += 50;
          }

          // Smart Keyword Mapping for high relevance
          const keywordMapping = GUIDE_KEYWORDS.find(
            k => k.slug === guide.slug && k.topicIndex === idx
          );
          if (keywordMapping) {
            let keywordMatches = 0;
            const allMatchTokens = [...cleanTokens, ...translatedTokens];
            keywordMapping.keywords.forEach(kw => {
              const kwNorm = kw.toLowerCase();
              if (normalizedQuery.includes(kwNorm)) {
                score += 45;
                keywordMatches++;
              } else {
                allMatchTokens.forEach(token => {
                  if (token.includes(kwNorm) || kwNorm.includes(token)) {
                    score += 25;
                    keywordMatches++;
                  }
                });
              }
            });
            if (keywordMatches > 0) {
              score += 35; // Bonus for any keyword match
            }
          }

          if (score >= 40) {
            if (score > bestGuideScore) {
              bestGuideScore = score;
              matchedGuideObj = { guide, topic, index: idx };
            }
          }
        });
      });
    }

    // 5. DETERMINE WINNER
    const scores = [
      { type: 'artist', score: bestArtistScore },
      { type: 'poi', score: bestPoiScore },
      { type: 'guide', score: bestGuideScore },
      { type: 'checklist', score: isChecklistQuery ? 95 : 0 },
      { type: 'now', score: isNowQuery ? 95 : 0 },
      { type: 'app_guide', score: isAppGuideQuery ? 95 : 0 },
      { type: 'map', score: isMapQuery ? 95 : 0 },
      { type: 'my_schedule', score: isMyScheduleQuery ? 95 : 0 },
      { type: 'timetable', score: isTimetableQuery ? 95 : 0 },
      { type: 'guide_root', score: isGuideRootQuery ? 95 : 0 }
    ];

    scores.sort((a, b) => b.score - a.score);
    const winner = scores[0];

    if (!winner || winner.score < 40) {
      return { text: t.botFallback };
    }

    if (winner.type === 'artist' && matchedArtists.length > 0) {
      if (matchedArtists.length > 1) {
        return {
          text: isHe ? 'מצאתי מספר אמנים תואמים:' : 'I found multiple matching artists:',
          card: {
            title: isHe ? 'תוצאות חיפוש' : 'Search Results',
            type: 'artist_list',
            items: matchedArtists.slice(0, 5).map(artName => {
              const artSets = timetableData.filter(s => s.artist === artName);
              return {
                id: `artist-${artName}`,
                title: artName,
                subtitle: isHe ? `${artSets.length} הופעות` : `${artSets.length} sets`,
                queryTrigger: artName
              };
            })
          }
        };
      }

      const artist = matchedArtists[0];
      const sets = timetableData.filter(s => s.artist === artist);
      
      let responseText = '';
      if (isHe) {
        responseText = `מצאתי את **${artist}** בלוח הזמנים:\n`;
        sets.forEach(set => {
          responseText += `• במה: **${set.stage}** ב${getHebrewDay(set.day)} בשעות ${set.start} - ${set.end}\n`;
        });
      } else {
        responseText = `I found **${artist}** in the schedule:\n`;
        sets.forEach(set => {
          responseText += `• Stage: **${set.stage}** on ${set.day} at ${set.start} - ${set.end}\n`;
        });
      }

      // Country origin & flag
      const origin = getRenderableOrigin(artistOrigins[artist]);
      if (origin && origin.countries.length > 0) {
        const flagsStr = origin.flags.join(' ');
        const countriesStr = origin.countries.map(code => {
          if (isHe) return HEBREW_COUNTRY_NAMES[code] || getCountryName(code);
          return getCountryName(code);
        }).join(' / ');
        
        if (isHe) {
          responseText += `\n🌍 מדינת מקור: ${countriesStr} ${flagsStr}\n`;
        } else {
          responseText += `\n🌍 Origin: ${countriesStr} ${flagsStr}\n`;
        }
      }

      // Related artist connections
      const connections = getArtistConnections(artist);
      if (connections && connections.allOtherProjects.length > 0) {
        const projectsList = connections.allOtherProjects.join(', ');
        if (isHe) {
          responseText += `\n🔗 פרויקטים וקשרים נוספים בפסטיבל: ${projectsList}\n`;
        } else {
          responseText += `\n🔗 Related projects at the festival: ${projectsList}\n`;
        }
      }

      return {
        text: responseText,
        card: {
          title: artist,
          type: 'artist_sets',
          items: sets.map(set => ({
            id: set.id,
            title: set.stage,
            subtitle: `${isHe ? getHebrewDay(set.day) : set.day} (${set.start} - ${set.end})`,
            setObj: set
          }))
        }
      };
    }

    if (winner.type === 'poi' && matchedPoi) {
      const poiName = isHe ? matchedPoi.nameHe : matchedPoi.name;
      const categoryLabel = getCategoryLabel(matchedPoi.type);
      
      let responseText = '';
      if (isHe) {
        responseText = `במת/מתחם **${poiName}** (${categoryLabel}):\n`;
      } else {
        responseText = `Stage/Venue **${poiName}** (${categoryLabel}):\n`;
      }

      if (matchedPoi.tags && matchedPoi.tags.length > 0) {
        if (isHe) {
          responseText += `תגיות: ${matchedPoi.tags.join(', ')}\n`;
        } else {
          responseText += `Tags: ${matchedPoi.tags.join(', ')}\n`;
        }
      }

      const stageNameForSets = matchedPoi.stageName;
      if (stageNameForSets) {
        const stageSets = timetableData.filter(s => s.stage.toLowerCase() === stageNameForSets.toLowerCase());
        if (stageSets.length > 0) {
          const evalDate = new Date(evalTime);
          const upcomingSets = stageSets
            .filter(set => {
              const status = getSetStatus(set, evalDate);
              return status === 'active' || status === 'upcoming';
            })
            .slice(0, 3);
          
          if (upcomingSets.length > 0) {
            responseText += isHe ? `\nהופעות קרובות בבמה זו:\n` : `\nUpcoming performances on this stage:\n`;
            upcomingSets.forEach(set => {
              responseText += `• **${set.artist}** - ${getHebrewDay(set.day)} (${set.start} - ${set.end})\n`;
            });
          }
        }
      }

      return {
        text: responseText,
        card: {
          title: poiName,
          type: 'poi_info',
          subtitle: `${isHe ? 'קטגוריה:' : 'Category:'} ${categoryLabel}`,
          poiId: matchedPoi.stageName || matchedPoi.id,
          poiObj: matchedPoi
        }
      };
    }

    if (winner.type === 'guide' && matchedGuideObj) {
      const { guide, topic, index } = matchedGuideObj;
      const rawText = topic.markdown || (topic.html ? topic.html.replace(/<[^>]*>/g, '') : '');
      const fullText = rawText.trim();
      
      // Limit length to a generous 1500 chars so we don't overflow the chat window but still provide solid info
      const displaySnippet = fullText.length > 1500 ? fullText.slice(0, 1500) + '\n\n...' : fullText;

      let responseText = '';
      if (isHe) {
        responseText = `מצאתי מידע רלוונטי במדריך **${guide.title}** תחת **${topic.heading}**:\n\n${displaySnippet}`;
      } else {
        responseText = `I found relevant information in **${guide.title}** > **${topic.heading}**:\n\n${displaySnippet}`;
      }

      return {
        text: responseText,
        card: {
          title: guide.title,
          type: 'navigation',
          route: `/guide?guide=${guide.slug}&topic=${index}`,
          buttonLabel: t.botReadGuide,
          icon: 'book'
        }
      };
    }

    if (winner.type === 'checklist') {
      return {
        text: isHe 
          ? 'הנה הצ\'ק-ליסט לפסטיבל. כדאי להצטייד באוהל עמיד, שק שינה, פנס ראש, בקבוק מים רב-פעמי וציוד היגיינה. תוכל לראות ולנהל את הרשימה המלאה כאן:' 
          : 'Here is the festival packing checklist. You should bring a reliable tent, sleeping bag, headlamp, reusable water bottle, and toiletries. View and manage the checklist here:',
        card: {
          title: isHe ? 'רשימת ציוד' : 'Packing Checklist',
          type: 'navigation',
          route: '/guide?tab=checklist',
          buttonLabel: isHe ? 'פתח צ\'ק-ליסט מלא' : 'Open Full Checklist',
          icon: 'backpack'
        }
      };
    }

    if (winner.type === 'now') {
      const evalDate = new Date(evalTime);
      const activeSets = timetableData
        .filter(set => {
          const status = getSetStatus(set, evalDate);
          return status === 'active';
        })
        .slice(0, 4);

      if (activeSets.length > 0) {
        return {
          text: isHe ? 'הנה מה שמנגן עכשיו בבמות:' : 'Here is what is currently playing:',
          card: {
            title: isHe ? 'מנגנים עכשיו' : 'Now Playing',
            type: 'now_playing',
            items: activeSets.map(set => ({
              id: set.id,
              title: set.artist,
              subtitle: `${set.stage} (${set.start} - ${set.end})`,
              setObj: set
            }))
          }
        };
      } else {
        return { text: isHe ? 'אין הופעות פעילות כרגע על פי הסימולטור.' : 'There are no active performances playing right now according to the simulation.' };
      }
    }

    if (winner.type === 'map') {
      return {
        text: t.botMapResponse,
        card: {
          title: isHe ? 'מפת הפסטיבל' : 'Festival Map',
          type: 'navigation',
          route: '/map',
          buttonLabel: t.botOpenMap,
          icon: 'map'
        }
      };
    }

    if (winner.type === 'my_schedule') {
      return {
        text: t.botScheduleResponse,
        card: {
          title: isHe ? 'הלוח שלי' : 'My Schedule',
          type: 'navigation',
          route: '/favorites',
          buttonLabel: t.botOpenSchedule,
          icon: 'user'
        }
      };
    }

    if (winner.type === 'timetable') {
      return {
        text: t.botTimetableResponse,
        card: {
          title: isHe ? 'לוח הופעות' : 'Timetable',
          type: 'navigation',
          route: '/timetable',
          buttonLabel: t.botOpenTimetable,
          icon: 'calendar'
        }
      };
    }

    if (winner.type === 'guide_root') {
      return {
        text: t.botGuideResponse,
        card: {
          title: isHe ? 'מדריך פסטיבל' : 'Festival Guide',
          type: 'navigation',
          route: '/guide',
          buttonLabel: t.botOpenGuide,
          icon: 'book'
        }
      };
    }

    if (winner.type === 'app_guide') {
      return {
        text: t.botHowToUseTitle + '\n\n' + t.botHowToUseDesc
      };
    }

    return { text: t.botFallback };
  };

  const getCategoryLabel = (type) => {
    const cat = venueMapData.categories.find(c => c.id === type);
    if (!cat) return type;
    return isHe ? cat.labelHe : cat.label;
  };

  const handleQuickReply = (replyText, queryText = null) => {
    // Add user message
    const userMsgId = `user-${Date.now()}`;
    setMessages(prev => [...prev, { id: userMsgId, sender: 'user', text: replyText }]);

    const finalQuery = queryText || replyText;
    trackEvent('chatbot_quick_reply', { reply: replyText });

    setTimeout(() => {
      const response = processQuery(finalQuery);
      setMessages(prev => [...prev, { id: `bot-${Date.now()}`, sender: 'bot', ...response }]);
    }, 400);
  };

  const handleNavigateCard = (route) => {
    navigate(route);
    setIsOpen(false);
    trackEvent('chatbot_card_navigate', { route });
  };

  const handleSelectSetCard = (set) => {
    onSelectSet(set);
    setIsOpen(false);
    trackEvent('chatbot_card_select_set', { artist: set.artist, set_id: set.id });
  };

  const handleShowOnMapCard = (poiId) => {
    onShowOnMap(poiId);
    setIsOpen(false);
    trackEvent('chatbot_card_show_on_map', { poi_id: poiId });
  };

  // Quick reply definitions depending on language
  const quickReplies = useMemo(() => {
    if (isHe) {
      return [
        { label: '🎵 מי מנגן עכשיו?', query: 'עכשיו' },
        { label: '⭐ איך שומרים הופעה?', query: 'מועדפים' },
        { label: '🎪 איפה במת הדום?', query: 'דום' },
        { label: '🏕️ ציוד לפסטיבל', query: 'ציוד' },
        { label: '🚌 איך מגיעים?', query: 'הגעה' },
        { label: '💊 איפה עזרה רפואית?', query: 'רפואי' },
      ];
    } else {
      return [
        { label: '🎵 Who\'s playing now?', query: 'playing now' },
        { label: '⭐ How to save a set?', query: 'favorite' },
        { label: '🎪 Where is The Dome?', query: 'dome' },
        { label: '🏕️ Packing list', query: 'pack' },
        { label: '🚌 Getting there', query: 'transport' },
        { label: '💊 Medical help', query: 'medical' },
      ];
    }
  }, [isHe, t]);

  return (
    <div className="chatbot-wrapper">
      {/* Floating Toggle Button */}
      <button 
        className="chatbot-toggle-btn" 
        onClick={toggleChat}
        aria-label="Toggle offline chatbot"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <header className="chatbot-header">
            <div className="chatbot-title-container">
              <div className="chatbot-avatar">
                <Sparkles size={18} />
                <span className="chatbot-online-indicator"></span>
              </div>
              <div>
                <h3>{t.botChatTitle}</h3>
                <p className="chatbot-header-subtitle">
                  {isHe ? 'מבוסס ידע מקומי בלבד' : '100% offline data'}
                </p>
              </div>
            </div>
            <button className="chatbot-close-btn" onClick={toggleChat}>
              <X size={18} />
            </button>
          </header>

          {/* Messages List */}
          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chatbot-msg-row ${msg.sender}`}>
                <div className="chatbot-bubble">
                  <BotText text={msg.text} />
                  
                  {/* Inline Cards for detailed search output */}
                  {msg.card && (
                    <div className="chatbot-card">
                      <div className="chatbot-card-title">{msg.card.title}</div>
                      
                      {msg.card.subtitle && (
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '8px' }}>
                          {msg.card.subtitle}
                        </div>
                      )}

                      {/* RENDERING ARTIST SETS */}
                      {msg.card.type === 'artist_sets' && (
                        <div className="chatbot-card-items">
                          {msg.card.items.map((item, idx) => {
                            const isFav = favorites.includes(item.setObj.id);
                            return (
                              <div key={idx} className="chatbot-card-row" style={{ flexDirection: 'column', gap: '4px', padding: '6px 0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.8rem', fontWeight: 600 }}>
                                  <span>{item.title}</span>
                                  <span style={{ color: '#db2777' }}>{item.subtitle}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                                  <button 
                                    className="chatbot-action-btn"
                                    onClick={() => handleSelectSetCard(item.setObj)}
                                  >
                                    <Calendar size={12} />
                                    <span>{t.botViewInTimetable}</span>
                                  </button>
                                  <button 
                                    className={`chatbot-action-btn favorite ${isFav ? 'added' : ''}`}
                                    onClick={() => !isFav && toggleFavorite(item.setObj.id)}
                                    disabled={isFav}
                                  >
                                    <Star size={12} fill={isFav ? 'currentColor' : 'none'} />
                                    <span>{isFav ? t.botAddedToSchedule : t.botAddToSchedule}</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* RENDERING NOW PLAYING */}
                      {msg.card.type === 'now_playing' && (
                        <div className="chatbot-card-items">
                          {msg.card.items.map((item, idx) => (
                            <div key={idx} className="chatbot-card-row" style={{ flexDirection: 'column', gap: '4px', padding: '6px 0' }}>
                              <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#ffffff' }}>{item.title}</div>
                              <div style={{ color: '#a78bfa', fontSize: '0.75rem' }}>{item.subtitle}</div>
                              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                                <button 
                                  className="chatbot-action-btn"
                                  onClick={() => handleSelectSetCard(item.setObj)}
                                >
                                  <Calendar size={12} />
                                  <span>{t.botViewInTimetable}</span>
                                </button>
                                <button 
                                  className="chatbot-action-btn"
                                  onClick={() => handleShowOnMapCard(item.setObj.stage)}
                                >
                                  <MapPin size={12} />
                                  <span>{t.botShowOnMap}</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* RENDERING POI MAP INFO */}
                      {msg.card.type === 'poi_info' && (
                        <div className="chatbot-card-actions">
                          <button 
                            className="chatbot-action-btn"
                            style={{ background: 'rgba(234, 179, 8, 0.2)', borderColor: 'rgba(234, 179, 8, 0.4)', color: '#fef08a' }}
                            onClick={() => handleShowOnMapCard(msg.card.poiId)}
                          >
                            <MapPin size={12} />
                            <span>{t.botShowOnMap}</span>
                          </button>
                        </div>
                      )}

                      {/* RENDERING MULTIPLE ARTIST SEARCH RESULTS */}
                      {msg.card.type === 'artist_list' && (
                        <div className="chatbot-card-items" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {msg.card.items.map((item, idx) => (
                            <button 
                              key={idx}
                              className="chatbot-quick-reply-btn" 
                              style={{ width: '100%', textAlign: 'start', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', borderRadius: '8px' }}
                              onClick={() => handleQuickReply(item.title, item.queryTrigger)}
                            >
                              <span>{item.title}</span>
                              <span style={{ color: '#9ca3af', fontSize: '0.7rem' }}>{item.subtitle}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* RENDERING NAVIGATION ROUTE BUTTON */}
                      {msg.card.type === 'navigation' && (
                        <div className="chatbot-card-actions">
                          <button 
                            className="chatbot-action-btn"
                            onClick={() => handleNavigateCard(msg.card.route)}
                          >
                            {msg.card.icon === 'backpack' ? <Backpack size={12} /> :
                             msg.card.icon === 'map' ? <MapPin size={12} /> :
                             msg.card.icon === 'calendar' ? <Calendar size={12} /> :
                             msg.card.icon === 'user' ? <User size={12} /> :
                             <BookOpen size={12} />}
                            <span>{msg.card.buttonLabel}</span>
                            <ArrowUpRight size={12} />
                          </button>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              </div>
            ))}
            {/* Typing indicator */}
            {isTyping && (
              <div className="chatbot-msg-row bot">
                <div className="chatbot-bubble chatbot-typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies Area */}
          <div className="chatbot-quick-replies-container">
            <div className="chatbot-quick-replies">
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  className="chatbot-quick-reply-btn"
                  onClick={() => handleQuickReply(reply.label, reply.query)}
                >
                  {reply.label}
                </button>
              ))}
            </div>
          </div>

          {/* Text Input Form */}
          <form className="chatbot-input-form" onSubmit={handleSendMessage}>
            <input
              ref={inputRef}
              type="text"
              className="chatbot-input"
              placeholder={isHe ? 'כתוב שאלה חופשית...' : 'Ask anything freely...'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              autoComplete="off"
            />
            <button 
              type="submit" 
              className="chatbot-send-btn"
              disabled={!inputValue.trim() || isTyping}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
