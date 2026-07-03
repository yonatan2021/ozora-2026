export function exportEquipmentToCsv(equipmentData, checkedMap, scope) {
  const sections = [];
  if (scope === 'both' || scope === 'shared') {
    sections.push({ key: 'shared', data: equipmentData.shared });
  }
  if (scope === 'both' || scope === 'personal') {
    sections.push({ key: 'personal', data: equipmentData.personal });
  }

  // Header row for CSV
  let csvContent = "סוג,קטגוריה,פריט,הערה,סטטוס\n";

  for (const sec of sections) {
    const sectionTitle = sec.data.title;
    for (const topic of sec.data.topics) {
      const topicHeading = topic.heading;
      for (const item of topic.items) {
        const checked = !!checkedMap[item.id];
        const status = checked ? "סומן" : "לא סומן";
        // Escape quotes by doubling them
        const label = item.label.replace(/"/g, '""');
        const hint = (item.hint || '').replace(/"/g, '""');
        
        csvContent += `"${sectionTitle}","${topicHeading}","${label}","${hint}","${status}"\n`;
      }
    }
  }

  // Prepend UTF-8 BOM so Excel opens it correctly with Hebrew characters
  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ozora-2026-equipment-${scope === 'both' ? 'all' : scope}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportEquipmentToJson(checkedMap) {
  const dataStr = JSON.stringify(checkedMap, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ozora-2026-equipment-backup.json';
  a.click();
  URL.revokeObjectURL(url);
}
