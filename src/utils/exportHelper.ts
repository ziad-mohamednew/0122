import { CenterSettings } from '../types';

/**
 * Exports a dataset as a high-quality, styled Excel spreadsheet (.xls)
 * utilizing Excel HTML format which allows colors, borders, and proper Arabic RTL support.
 */
export function exportToExcel(title: string, headers: string[], rows: any[][], fileName: string) {
  const currentDateStr = new Date().toLocaleString('ar-EG', { hour12: true });
  
  let html = `
  <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
    <style>
      body {
        font-family: 'Segoe UI', Arial, sans-serif;
        direction: rtl;
      }
      table {
        border-collapse: collapse;
        width: 100%;
        margin-top: 20px;
      }
      th {
        background-color: #4F46E5 !important;
        color: #FFFFFF !important;
        border: 1px solid #CBD5E1;
        padding: 10px;
        font-weight: bold;
        font-size: 13px;
        text-align: center;
      }
      td {
        border: 1px solid #E2E8F0;
        padding: 8px;
        font-size: 12px;
        text-align: right;
        color: #334155;
      }
      tr:nth-child(even) {
        background-color: #F8FAFC;
      }
      .title-container {
        text-align: center;
        margin-bottom: 15px;
      }
      .title {
        font-size: 18px;
        font-weight: bold;
        color: #1E293B;
      }
      .meta {
        font-size: 11px;
        color: #64748B;
        text-align: center;
        margin-bottom: 20px;
      }
    </style>
  </head>
  <body>
    <div class="title-container">
      <div class="title">${title}</div>
      <div class="meta">تاريخ التصدير: ${currentDateStr} • <a href="https://wa.me/201031123461" target="_blank" style="text-decoration: none; color: inherit;">Manara by Graphiqa</a></div>
    </div>
    <table>
      <thead>
        <tr>
          ${headers.map(h => `<th>${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows.map(row => `
          <tr>
            ${row.map(val => {
              const cleanedVal = val === undefined || val === null ? '' : String(val);
              return `<td>${cleanedVal}</td>`;
            }).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  </body>
  </html>
  `;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName}_${new Date().toISOString().split('T')[0]}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates a beautiful HTML and triggers the browser raw printing/PDF window.
 * This is the most bulletproof way to generate PDFs with full RTL, correct Arabic letters linking,
 * and page margins in standard web browsers.
 */
export function exportToPDF(
  title: string, 
  headers: string[], 
  rows: any[][], 
  centerSettings?: CenterSettings,
  summaryData?: { label: string, value: string }[]
) {
  const currentDateStr = new Date().toLocaleString('ar-EG', { dateStyle: 'long', timeStyle: 'short' });
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert("⚠️ الرجاء السماح بالنوافذ المنبثقة لتصدير ملف الـ PDF وطباعته.");
    return;
  }

  const logoUrl = centerSettings?.logoUrl || (window.location.origin + '/icon.png');
  const logoHtml = `<img src="${logoUrl}" class="center-logo" alt="Center Logo" onerror="this.onerror=null; this.outerHTML='<div class=\\'logo-placeholder\\'>🎓</div>';" />`;

  const summaryHtml = summaryData && summaryData.length > 0
    ? `
    <div class="summary-box">
      <h3 class="summary-title">خلاصة وإحصائيات العمليات</h3>
      <div class="summary-grid">
        ${summaryData.map(item => `
          <div class="summary-item">
            <span class="summary-label">${item.label}:</span>
            <span class="summary-value">${item.value}</span>
          </div>
        `).join('')}
      </div>
    </div>
    `
    : '';

  printWindow.document.write(`
    <html dir="rtl" lang="ar">
      <head>
        <title>${title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Cairo:wght@400;600;700;800&display=swap');
          
          body {
            font-family: 'Cairo', 'Inter', Tahoma, Geneva, sans-serif;
            margin: 0;
            padding: 40px;
            color: #1e293b;
            background-color: #ffffff;
            direction: rtl;
          }

          /* Print Layout Header */
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            border-bottom: 2px solid #4f46e5;
            padding-bottom: 20px;
          }
          .header-cell {
            vertical-align: middle;
            border: none;
          }
          .center-info {
            text-align: right;
          }
          .center-name {
            font-size: 22px;
            font-weight: 800;
            color: #4f46e5;
            margin: 0;
          }
          .center-details {
            font-size: 11px;
            color: #64748b;
            margin: 4px 0 0 0;
            line-height: 1.5;
          }
          .report-meta {
            text-align: left;
          }
          .report-title-label {
            font-size: 14px;
            font-weight: bold;
            color: #1e293b;
            margin: 0;
          }
          .report-date {
            font-size: 10px;
            color: #64748b;
            margin: 5px 0 0 0;
          }

          .center-logo {
            max-width: 70px;
            max-height: 70px;
            border-radius: 8px;
            margin-left: 15px;
          }
          .logo-placeholder {
            font-size: 40px;
            margin-left: 15px;
          }

          /* Report Heading */
          .report-header {
            text-align: center;
            margin: 25px 0;
          }
          .report-title {
            font-size: 20px;
            font-weight: 700;
            color: #1e293b;
            border-bottom: 2px dashed #e2e8f0;
            display: inline-block;
            padding-bottom: 8px;
          }

          /* Summary Box */
          .summary-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 15px 20px;
            margin-bottom: 25px;
          }
          .summary-title {
            font-size: 13px;
            font-weight: bold;
            color: #4f46e5;
            margin: 0 0 10px 0;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
          }
          .summary-item {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            border-left: 2px solid #e2e8f0;
            padding-left: 10px;
            padding-right: 5px;
          }
          .summary-label {
            color: #64748b;
          }
          .summary-value {
            font-weight: bold;
            color: #1e293b;
          }

          /* Styled Table */
          table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            page-break-inside: auto;
          }
          table.data-table tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          table.data-table th {
            background-color: #f1f5f9;
            color: #0f172a;
            border: 1px solid #cbd5e1;
            padding: 10px 8px;
            font-size: 11px;
            font-weight: 700;
            text-align: center;
          }
          table.data-table td {
            border: 1px solid #e2e8f0;
            padding: 9px 8px;
            font-size: 11px;
            text-align: right;
            color: #334155;
          }
          table.data-table tbody tr:nth-child(even) {
            background-color: #fafbfc;
          }

          /* Footer Pagination and Notes */
          .print-footer {
            margin-top: 40px;
            font-size: 10px;
            color: #94a3b8;
            text-align: center;
            border-top: 1px solid #f1f5f9;
            padding-top: 15px;
          }

          /* Page break styling for printing */
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none;
            }
            @page {
              size: A4;
              margin: 20mm;
            }
            table {
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        
        <!-- Header Info -->
        <table class="header-table">
          <tr>
            <td class="header-cell" style="width: 60%">
              <div style="display: flex; align-items: center;">
                ${logoHtml}
                <div class="center-info">
                  <h1 class="center-name">${centerSettings?.name || 'Manara'}</h1>
                  <p class="center-details">
                    📍 العنوان: ${centerSettings?.address || 'غير محدد'}<br/>
                    📞 الهاتف: ${centerSettings?.phone || 'غير محدد'}
                  </p>
                </div>
              </div>
            </td>
            <td class="header-cell report-meta" style="width: 40%; text-align: left;">
              <h2 class="report-title-label"><a href="https://wa.me/201031123461" target="_blank" style="text-decoration: none; color: inherit;">Manara by Graphiqa</a></h2>
              <p class="report-date">تاريخ ووقت التحضير: <strong style="color:#0f172a;">${currentDateStr}</strong></p>
            </td>
          </tr>
        </table>

        <!-- Report Header Title -->
        <div class="report-header">
          <div class="report-title">${title}</div>
        </div>

        <!-- Summary Statistics (if any) -->
        ${summaryHtml}

        <!-- Main Data Table -->
        <table class="data-table">
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                ${row.map(val => {
                  const cleanedVal = val === undefined || val === null ? '' : String(val);
                  return `<td>${cleanedVal}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Page Footer -->
        <div class="print-footer">
          توليد التقرير برمجياً بواسطة نظام الإدارة الذكي للسنتر • صفحة 1 من 1
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 1500);
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
