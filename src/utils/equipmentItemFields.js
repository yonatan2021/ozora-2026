const QUANTITY_KEYWORDS = [
  'אוהל',
  'אוהלים',
  'קנופי',
  'גזיבו',
  'ברזנט',
  'יריעה',
  'מוט',
  'מוטות',
  'חבל',
  'חבלים',
  'יתד',
  'יתדות',
  'קליפס',
  'קליפסים',
  'רצוע',
  'פטיש',
  'כיסא',
  'כסא',
  'שולחן',
  'פנס',
  'סוללה',
  'בטרי',
  'מטען',
  'כבל',
  'מפצל',
  'מתאם',
  'בקבוק',
  'מיכל',
  'שקית',
  'שקיות',
  'קופסה',
  'ארגז',
  'מגבת',
  'מגבונים',
  'תרופות',
  'כדורים',
  'קרבינ',
  'מזרן',
  'שמיכה',
  'סדין',
  'בגד',
  'חולצה',
  'מכנס',
  'גרב',
  'נעל',
  'כובע',
  'מנעול',
  'כלי',
  'צלחת',
  'כוס',
  'סכו',
  'סיר',
  'מחבת',
  'מזון',
  'אוכל',
  'מים'
];

const NOTE_KEYWORDS = [
  'רשימת',
  'אחראים',
  'אחראי',
  'תכנון',
  'שרטוט',
  'צילום',
  'מסך',
  'כרטיס',
  'קשר',
  'נקודת',
  'מפגש',
  'מיקום',
  'תרופות',
  'רפואי',
  'ילד',
  'ילדה',
  'רגיש',
  'מסמכים',
  'דרכון',
  'כסף',
  'מידה',
  'סוג',
  'בדיקת',
  'לוודא',
  'אסור',
  'כבודה',
  'תחזית',
  'אחריות',
  'אבטחת',
  'סימון',
  'שם'
];

function includesAny(text, words) {
  return words.some(word => text.includes(word));
}

export function getEquipmentItemFields(item, topic = {}, sectionKey = 'personal') {
  if (Array.isArray(item.fields)) {
    return {
      quantity: item.fields.includes('quantity'),
      note: item.fields.includes('note')
    };
  }

  const text = `${item.label?.he || ''} ${item.hint?.he || ''} ${topic.heading?.he || ''}`;
  const quantity = sectionKey === 'shared' || includesAny(text, QUANTITY_KEYWORDS);
  const note = sectionKey === 'shared' || includesAny(text, NOTE_KEYWORDS);

  return { quantity, note };
}
