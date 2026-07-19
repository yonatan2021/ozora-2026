import { getEquipmentItemFields } from './equipmentItemFields';
import { translations } from './lang';

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

function getRows(equipmentData, checkedMap, scope, onlyChecked = false, lang = 'he') {
  const rows = [];
  const sections = getSections(equipmentData, scope);
  const t = translations[lang];

  for (const sec of sections) {
    for (const topic of sec.data.topics) {
      for (const item of topic.items) {
        const details = normalizeItemState(checkedMap[item.id]);
        if (onlyChecked && !details.checked) continue;
        const fields = getEquipmentItemFields(item, topic, sec.key);
        rows.push({
          sectionTitle: sec.data.title[lang],
          topicHeading: topic.heading[lang],
          label: item.label[lang],
          quantity: fields.quantity ? details.quantity : '',
          userNote: fields.note ? details.note : '',
          ozoraNote: item.hint ? item.hint[lang] : '',
          status: details.checked ? t.equipStatusChecked : t.equipStatusUnchecked
        });
      }
    }
  }

  return rows;
}

export function exportEquipmentToCsv(equipmentData, checkedMap, scope, onlyChecked = false, lang = 'he') {
  const t = translations[lang];
  const rows = getRows(equipmentData, checkedMap, scope, onlyChecked, lang);
  let csvContent = `${t.type},${t.equipColCategory},${t.equipColItem},${t.equipQuantityLabel},${t.equipColUserNote},${t.equipColOzoraNote},${t.equipColStatus}\n`;

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

function worksheetXml(name, rows, description, lang = 'he') {
  const t = translations[lang];
  const isHe = lang === 'he';
  const align = isHe ? 'Right' : 'Left';

  const emptyMessage = rows.length === 0
    ? `<Row ss:Height="32"><Cell ss:MergeAcross="6" ss:StyleID="Muted"><Data ss:Type="String">${escapeXml(t.equipNoExportItems)}</Data></Cell></Row>`
    : '';

  const dataRows = rows.map(row => `
    <Row>
      <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(row.sectionTitle)}</Data></Cell>
      <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(row.topicHeading)}</Data></Cell>
      <Cell ss:StyleID="StrongCell"><Data ss:Type="String">${escapeXml(row.label)}</Data></Cell>
      <Cell ss:StyleID="Cell"><Data ss:Type="String">${escapeXml(row.quantity)}</Data></Cell>
      <Cell ss:StyleID="CellWrap"><Data ss:Type="String">${escapeXml(row.userNote)}</Data></Cell>
      <Cell ss:StyleID="CellWrap"><Data ss:Type="String">${escapeXml(row.ozoraNote)}</Data></Cell>
      <Cell ss:StyleID="${row.status === t.equipStatusChecked ? 'DoneCell' : 'PendingCell'}"><Data ss:Type="String">${escapeXml(row.status)}</Data></Cell>
    </Row>
  `).join('');

  return `
    <Worksheet ss:Name="${escapeXml(name)}" ss:RightToLeft="${isHe ? '1' : '0'}">
      <Table ss:DefaultRowHeight="24">
        <Column ss:Width="130"/>
        <Column ss:Width="160"/>
        <Column ss:Width="220"/>
        <Column ss:Width="70"/>
        <Column ss:Width="220"/>
        <Column ss:Width="260"/>
        <Column ss:Width="90"/>
        <Row ss:Height="34">
          <Cell ss:MergeAcross="6" ss:StyleID="BrandTitle"><Data ss:Type="String">${escapeXml(t.equipBrandTitle)}</Data></Cell>
        </Row>
        <Row ss:Height="28">
          <Cell ss:MergeAcross="6" ss:StyleID="BrandNote_${align}"><Data ss:Type="String">${escapeXml(description)}</Data></Cell>
        </Row>
        <Row ss:Height="28">
          <Cell ss:MergeAcross="6" ss:StyleID="BrandNote_${align}"><Data ss:Type="String">${escapeXml(t.equipBrandNote)}</Data></Cell>
        </Row>
        <Row>
          <Cell ss:StyleID="Header_${align}"><Data ss:Type="String">${escapeXml(t.type)}</Data></Cell>
          <Cell ss:StyleID="Header_${align}"><Data ss:Type="String">${escapeXml(t.equipColCategory)}</Data></Cell>
          <Cell ss:StyleID="Header_${align}"><Data ss:Type="String">${escapeXml(t.equipColItem)}</Data></Cell>
          <Cell ss:StyleID="Header_${align}"><Data ss:Type="String">${escapeXml(t.equipQuantityLabel)}</Data></Cell>
          <Cell ss:StyleID="Header_${align}"><Data ss:Type="String">${escapeXml(t.equipColUserNote)}</Data></Cell>
          <Cell ss:StyleID="Header_${align}"><Data ss:Type="String">${escapeXml(t.equipColOzoraNote)}</Data></Cell>
          <Cell ss:StyleID="Header_${align}"><Data ss:Type="String">${escapeXml(t.equipColStatus)}</Data></Cell>
        </Row>
        ${emptyMessage}
        ${dataRows}
        <Row ss:Height="26">
          <Cell ss:MergeAcross="6" ss:StyleID="Footer"><Data ss:Type="String">${escapeXml(t.exportFooter)}</Data></Cell>
        </Row>
      </Table>
    </Worksheet>
  `;
}

export function exportEquipmentToExcel(equipmentData, checkedMap, scope, onlyChecked = false, lang = 'he') {
  const t = translations[lang];
  const isHe = lang === 'he';
  const align = isHe ? 'Right' : 'Left';
  const readingOrder = isHe ? 'RightToLeft' : 'LTR';

  const selectedRows = getRows(equipmentData, checkedMap, scope, onlyChecked, lang);
  const checkedRows = getRows(equipmentData, checkedMap, scope, true, lang);
  const allRows = getRows(equipmentData, checkedMap, scope, false, lang);
  const description = onlyChecked ? t.equipExportDescChecked : t.equipExportDescAll;

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
        <Alignment ss:Vertical="Top" ss:Horizontal="${align}" ss:ReadingOrder="${readingOrder}"/>
        <Font ss:FontName="Arial" ss:Size="11" ss:Color="#241434"/>
      </Style>
      <Style ss:ID="BrandTitle">
        <Alignment ss:Vertical="Center" ss:Horizontal="Center"/>
        <Font ss:FontName="Arial" ss:Size="18" ss:Bold="1" ss:Color="#F3E8FF"/>
        <Interior ss:Color="#180A2A" ss:Pattern="Solid"/>
      </Style>
      <Style ss:ID="BrandNote_Right">
        <Alignment ss:Vertical="Center" ss:Horizontal="Right" ss:WrapText="1"/>
        <Font ss:FontName="Arial" ss:Size="10" ss:Color="#5C2FA0"/>
        <Interior ss:Color="#F2E9FF" ss:Pattern="Solid"/>
      </Style>
      <Style ss:ID="BrandNote_Left">
        <Alignment ss:Vertical="Center" ss:Horizontal="Left" ss:WrapText="1"/>
        <Font ss:FontName="Arial" ss:Size="10" ss:Color="#5C2FA0"/>
        <Interior ss:Color="#F2E9FF" ss:Pattern="Solid"/>
      </Style>
      <Style ss:ID="Header_Right">
        <Alignment ss:Vertical="Center" ss:Horizontal="Right"/>
        <Font ss:FontName="Arial" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
        <Interior ss:Color="#6A2CE8" ss:Pattern="Solid"/>
        <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C6A8FF"/></Borders>
      </Style>
      <Style ss:ID="Header_Left">
        <Alignment ss:Vertical="Center" ss:Horizontal="Left"/>
        <Font ss:FontName="Arial" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
        <Interior ss:Color="#6A2CE8" ss:Pattern="Solid"/>
        <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C6A8FF"/></Borders>
      </Style>
      <Style ss:ID="Cell">
        <Alignment ss:Vertical="Top" ss:Horizontal="${align}"/>
        <Interior ss:Color="#FBF8FF" ss:Pattern="Solid"/>
        <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E8DAFF"/></Borders>
      </Style>
      <Style ss:ID="StrongCell">
        <Alignment ss:Vertical="Top" ss:Horizontal="${align}"/>
        <Font ss:FontName="Arial" ss:Size="11" ss:Bold="1" ss:Color="#241434"/>
        <Interior ss:Color="#FBF8FF" ss:Pattern="Solid"/>
        <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E8DAFF"/></Borders>
      </Style>
      <Style ss:ID="CellWrap">
        <Alignment ss:Vertical="Top" ss:Horizontal="${align}" ss:WrapText="1"/>
        <Interior ss:Color="#FBF8FF" ss:Pattern="Solid"/>
        <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E8DAFF"/></Borders>
      </Style>
      <Style ss:ID="DoneCell">
        <Alignment ss:Vertical="Top" ss:Horizontal="${align}"/>
        <Font ss:FontName="Arial" ss:Size="11" ss:Bold="1" ss:Color="#11692A"/>
        <Interior ss:Color="#E8F8EA" ss:Pattern="Solid"/>
      </Style>
      <Style ss:ID="PendingCell">
        <Alignment ss:Vertical="Top" ss:Horizontal="${align}"/>
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
    ${worksheetXml(onlyChecked ? t.equipWorksheetChecked : t.equipWorksheetAll, selectedRows, description, lang)}
    ${worksheetXml(t.equipWorksheetCoordination, checkedRows, t.equipWorksheetCoordinationDesc, lang)}
    ${worksheetXml(t.equipWorksheetFull, allRows, t.equipWorksheetFullDesc, lang)}
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
