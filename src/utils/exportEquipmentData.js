import { getEquipmentItemFields } from './equipmentItemFields';

const BRAND_NOTE = 'רשימת Ozora 2026 נועדה לעזור בהיערכות. בדקו תמיד מגבלות טיסה, מזג אוויר והנחיות רשמיות של הפסטיבל.';

function normalizeItemState(value) {
  if (value === true || value === false) {
    return { checked: value, quantity: '', note: '' };
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return {
      checked: !!value.checked,
      quantity: value.quantity == null ? '' : String(value.quantity),
      note: typeof value.note === 'string' ? value.note : ''
    };
  }

  return { checked: false, quantity: '', note: '' };
}

function escapeCsv(value) {
  return String(value ?? '').replace(/"/g, '""');
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getSections(equipmentData, scope) {
  const sections = [];
  if (scope === 'both' || scope === 'shared') {
    sections.push({ key: 'shared', data: equipmentData.shared });
  }
  if (scope === 'both' || scope === 'personal') {
    sections.push({ key: 'personal', data: equipmentData.personal });
  }

  return sections;
}

function getRows(equipmentData, checkedMap, scope, onlyChecked = false) {
  const rows = [];
  const sections = getSections(equipmentData, scope);

  for (const sec of sections) {
    for (const topic of sec.data.topics) {
      for (const item of topic.items) {
        const details = normalizeItemState(checkedMap[item.id]);
        if (onlyChecked && !details.checked) continue;
        const fields = getEquipmentItemFields(item, topic, sec.key);
        rows.push({
          sectionTitle: sec.data.title,
          topicHeading: topic.heading,
          label: item.label,
          quantity: fields.quantity ? details.quantity : '',
          userNote: fields.note ? details.note : '',
          ozoraNote: item.hint || '',
          status: details.checked ? 'סומן' : 'לא סומן'
        });
      }
    }
  }

  return rows;
}

export function exportEquipmentToCsv(equipmentData, checkedMap, scope, onlyChecked = false) {
  const rows = getRows(equipmentData, checkedMap, scope, onlyChecked);
  let csvContent = 'סוג,קטגוריה,פריט,כמות,הערת משתמש,הערת Ozora,סטטוס\n';

  for (const row of rows) {
    csvContent += `"${escapeCsv(row.sectionTitle)}","${escapeCsv(row.topicHeading)}","${escapeCsv(row.label)}","${escapeCsv(row.quantity)}","${escapeCsv(row.userNote)}","${escapeCsv(row.ozoraNote)}","${escapeCsv(row.status)}"\n`;
  }

  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ozora-2026-equipment-${scope === 'both' ? 'all' : scope}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function worksheetXml(name, rows, description) {
  const emptyMessage = rows.length === 0
    ? '<Row ss:Height="32"><Cell ss:MergeAcross="6" ss:StyleID="Muted"><Data ss:Type="String">לא נמצאו פריטים לייצוא בבחירה הנוכחית.</Data></Cell></Row>'
    : '';

  const dataRows = rows.map(row => `
    <Row>
      <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(row.sectionTitle)}</Data></Cell>
      <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(row.topicHeading)}</Data></Cell>
      <Cell ss:StyleID="StrongCell"><Data ss:Type="String">${escapeXml(row.label)}</Data></Cell>
      <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(row.quantity)}</Data></Cell>
      <Cell ss:StyleID="CellWrap"><Data ss:Type="String">${escapeXml(row.userNote)}</Data></Cell>
      <Cell ss:StyleID="CellWrap"><Data ss:Type="String">${escapeXml(row.ozoraNote)}</Data></Cell>
      <Cell ss:StyleID="${row.status === 'סומן' ? 'DoneCell' : 'PendingCell'}"><Data ss:Type="String">${escapeXml(row.status)}</Data></Cell>
    </Row>
  `).join('');

  return `
    <Worksheet ss:Name="${escapeXml(name)}" ss:RightToLeft="1">
      <Table ss:DefaultRowHeight="24">
        <Column ss:Width="130"/>
        <Column ss:Width="160"/>
        <Column ss:Width="220"/>
        <Column ss:Width="70"/>
        <Column ss:Width="220"/>
        <Column ss:Width="260"/>
        <Column ss:Width="90"/>
        <Row ss:Height="34">
          <Cell ss:MergeAcross="6" ss:StyleID="BrandTitle"><Data ss:Type="String">OZORA 2026 · רשימת ציוד לפסטיבל</Data></Cell>
        </Row>
        <Row ss:Height="28">
          <Cell ss:MergeAcross="6" ss:StyleID="BrandNote"><Data ss:Type="String">${escapeXml(description)}</Data></Cell>
        </Row>
        <Row ss:Height="28">
          <Cell ss:MergeAcross="6" ss:StyleID="BrandNote"><Data ss:Type="String">${escapeXml(BRAND_NOTE)}</Data></Cell>
        </Row>
        <Row>
          <Cell ss:StyleID="Header"><Data ss:Type="String">סוג</Data></Cell>
          <Cell ss:StyleID="Header"><Data ss:Type="String">קטגוריה</Data></Cell>
          <Cell ss:StyleID="Header"><Data ss:Type="String">פריט</Data></Cell>
          <Cell ss:StyleID="Header"><Data ss:Type="String">כמות</Data></Cell>
          <Cell ss:StyleID="Header"><Data ss:Type="String">הערת משתמש</Data></Cell>
          <Cell ss:StyleID="Header"><Data ss:Type="String">הערת Ozora</Data></Cell>
          <Cell ss:StyleID="Header"><Data ss:Type="String">סטטוס</Data></Cell>
        </Row>
        ${emptyMessage}
        ${dataRows}
        <Row ss:Height="26">
          <Cell ss:MergeAcross="6" ss:StyleID="Footer"><Data ss:Type="String">נוצר עם ozora2026.app</Data></Cell>
        </Row>
      </Table>
    </Worksheet>
  `;
}

export function exportEquipmentToExcel(equipmentData, checkedMap, scope, onlyChecked = false) {
  const selectedRows = getRows(equipmentData, checkedMap, scope, onlyChecked);
  const checkedRows = getRows(equipmentData, checkedMap, scope, true);
  const allRows = getRows(equipmentData, checkedMap, scope, false);
  const description = onlyChecked ? 'ייצוא פריטים שסומנו בלבד' : 'ייצוא כל רשימת הציוד';

  const workbook = `<?xml version="1.0" encoding="UTF-8"?>
  <?mso-application progid="Excel.Sheet"?>
  <Workbook
    xmlns="urn:schemas-microsoft-com:office:spreadsheet"
    xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:x="urn:schemas-microsoft-com:office:excel"
    xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
    xmlns:html="http://www.w3.org/TR/REC-html40">
    <Styles>
      <Style ss:ID="Default" ss:Name="Normal">
        <Alignment ss:Vertical="Top" ss:Horizontal="Right" ss:ReadingOrder="RightToLeft"/>
        <Font ss:FontName="Arial" ss:Size="11" ss:Color="#241434"/>
      </Style>
      <Style ss:ID="BrandTitle">
        <Alignment ss:Vertical="Center" ss:Horizontal="Center"/>
        <Font ss:FontName="Arial" ss:Size="18" ss:Bold="1" ss:Color="#F3E8FF"/>
        <Interior ss:Color="#180A2A" ss:Pattern="Solid"/>
      </Style>
      <Style ss:ID="BrandNote">
        <Alignment ss:Vertical="Center" ss:Horizontal="Right" ss:WrapText="1"/>
        <Font ss:FontName="Arial" ss:Size="10" ss:Color="#5C2FA0"/>
        <Interior ss:Color="#F2E9FF" ss:Pattern="Solid"/>
      </Style>
      <Style ss:ID="Header">
        <Alignment ss:Vertical="Center" ss:Horizontal="Right"/>
        <Font ss:FontName="Arial" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
        <Interior ss:Color="#6A2CE8" ss:Pattern="Solid"/>
        <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C6A8FF"/></Borders>
      </Style>
      <Style ss:ID="Cell">
        <Alignment ss:Vertical="Top" ss:Horizontal="Right"/>
        <Interior ss:Color="#FBF8FF" ss:Pattern="Solid"/>
        <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E8DAFF"/></Borders>
      </Style>
      <Style ss:ID="StrongCell">
        <Alignment ss:Vertical="Top" ss:Horizontal="Right"/>
        <Font ss:FontName="Arial" ss:Size="11" ss:Bold="1" ss:Color="#241434"/>
        <Interior ss:Color="#FBF8FF" ss:Pattern="Solid"/>
        <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E8DAFF"/></Borders>
      </Style>
      <Style ss:ID="CellWrap">
        <Alignment ss:Vertical="Top" ss:Horizontal="Right" ss:WrapText="1"/>
        <Interior ss:Color="#FBF8FF" ss:Pattern="Solid"/>
        <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E8DAFF"/></Borders>
      </Style>
      <Style ss:ID="DoneCell">
        <Alignment ss:Vertical="Top" ss:Horizontal="Right"/>
        <Font ss:FontName="Arial" ss:Size="11" ss:Bold="1" ss:Color="#11692A"/>
        <Interior ss:Color="#E8F8EA" ss:Pattern="Solid"/>
      </Style>
      <Style ss:ID="PendingCell">
        <Alignment ss:Vertical="Top" ss:Horizontal="Right"/>
        <Font ss:FontName="Arial" ss:Size="11" ss:Color="#6F5C7D"/>
        <Interior ss:Color="#F4F0F8" ss:Pattern="Solid"/>
      </Style>
      <Style ss:ID="Muted">
        <Alignment ss:Vertical="Center" ss:Horizontal="Center"/>
        <Font ss:FontName="Arial" ss:Size="11" ss:Color="#6F5C7D"/>
      </Style>
      <Style ss:ID="Footer">
        <Alignment ss:Vertical="Center" ss:Horizontal="Center"/>
        <Font ss:FontName="Arial" ss:Size="10" ss:Color="#5C2FA0"/>
        <Interior ss:Color="#F2E9FF" ss:Pattern="Solid"/>
      </Style>
    </Styles>
    ${worksheetXml(onlyChecked ? 'פריטים שסומנו' : 'רשימת ציוד', selectedRows, description)}
    ${worksheetXml('ציוד שסומן', checkedRows, 'גיליון תיאום מהיר: רק פריטים שסומנו')}
    ${worksheetXml('כל הרשימה', allRows, 'גיליון מלא: כולל פריטים שלא סומנו')}
  </Workbook>`;

  const blob = new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ozora-2026-equipment-${scope === 'both' ? 'all' : scope}.xls`;
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
