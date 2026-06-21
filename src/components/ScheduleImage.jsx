import { forwardRef } from 'react';
import { translations } from '../utils/lang';
import { getSetUniqueKey } from '../utils/time';
import { getConflictsForSet, getConflictPartner } from '../utils/conflicts';

const STAGE_COLORS = {
  "OZORA STAGE": "#d94070",
  "PUMPUI": "#2d9d5a",
  "THE DOME": "#4a7fbf",
  "DRAGON NEST / COOKING GROOVE": "#c48a2a",
  "VISIUM GARDEN": "#a09030",
  "TEK ZERO (2000s Trance)": "#8844cc"
};

const ScheduleImage = forwardRef(function ScheduleImage(
  { priorities, conflicts, lang, groupedByDay },
  ref
) {
  const t = translations[lang];

  return (
    <div ref={ref} style={{
      width: 1080,
      padding: 48,
      background: 'linear-gradient(180deg, #0b0713 0%, #1a0f2e 100%)',
      color: '#f0e6ff',
      fontFamily: "'Exo 2', 'Heebo', sans-serif",
      direction: lang === 'he' ? 'rtl' : 'ltr'
    }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0 }}>{t.exportTitle}</h1>
      </div>

      {Object.entries(groupedByDay).map(([day, daySets]) => (
        <div key={day} style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 18,
            fontWeight: 700,
            borderBottom: '1px solid rgba(240,230,255,0.2)',
            paddingBottom: 6,
            marginBottom: 10
          }}>
            {lang === 'he'
              ? day.replace('DAY', 'יום').replace('Warmup Sat', 'חימום שבת').replace('Warmup Sun', 'חימום ראשון')
              : day}
          </div>

          {daySets.map(set => {
            const key = getSetUniqueKey(set);
            const priority = priorities[key];
            const setConflicts = getConflictsForSet(set.id, conflicts);

            return (
              <div key={set.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '6px 0',
                opacity: priority === 'maybe' ? 0.5 : 1,
                borderInlineStart: priority === 'must' ? '3px solid #e86040' : 'none',
                paddingInlineStart: priority === 'must' ? 8 : 0
              }}>
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: STAGE_COLORS[set.stage] || '#888',
                  flexShrink: 0
                }} />
                <span style={{ fontSize: 15, fontWeight: 600, flex: 1 }}>
                  {set.artist}
                </span>
                <span style={{ fontSize: 12, color: 'rgba(240,230,255,0.5)' }}>
                  {set.stage.replace(' / COOKING GROOVE', '').replace(' (2000s Trance)', '')}
                </span>
                <span style={{ fontSize: 13, color: 'rgba(240,230,255,0.7)', whiteSpace: 'nowrap' }}>
                  {set.start}–{set.end}
                </span>
                {setConflicts.length > 0 && (
                  <span style={{ fontSize: 11, color: '#d4a843' }}>
                    {setConflicts.map(c => getConflictPartner(set.id, c).artist).join(', ')}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}

      <div style={{
        textAlign: 'center',
        fontSize: 12,
        color: 'rgba(240,230,255,0.3)',
        marginTop: 24,
        paddingTop: 16,
        borderTop: '1px solid rgba(240,230,255,0.1)'
      }}>
        {t.exportFooter}
      </div>
    </div>
  );
});

export default ScheduleImage;
