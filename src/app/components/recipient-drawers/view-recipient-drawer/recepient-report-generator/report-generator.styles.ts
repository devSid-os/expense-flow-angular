// report-generator.styles.ts

export const REPORT_STYLES = `
  /* Page Setup */
  @page {
    size: A4;
    margin: 15mm 10mm 20mm 10mm;
  }

  /* Print Specific Styles */
  @media print {
    html, body {
      height: auto;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .report-container {
      page-break-inside: auto;
    }

    .entries-table {
      page-break-inside: auto;
    }

    .entries-table tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }

    .entries-table thead {
      display: table-header-group;
    }

    .entries-table tfoot {
      display: table-footer-group;
    }

    .summary-grid {
      page-break-inside: avoid;
    }

    .recipient-info {
      page-break-inside: avoid;
    }

    .report-header {
      page-break-inside: avoid;
    }
  }

  /* Reset */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  /* Base Styles */
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #1f2937;
    font-size: 11px;
    line-height: 1.4;
    background: #ffffff;
  }

  .report-container {
    max-width: 100%;
    padding: 0;
  }

  /* Header */
  .report-header {
    text-align: center;
    padding: 15px 0;
    border-bottom: 2px solid #111827;
    margin-bottom: 15px;
  }

  .report-title {
    font-size: 22px;
    font-weight: 700;
    color: #111827;
    margin: 0;
    letter-spacing: -0.5px;
  }

  .report-subtitle {
    font-size: 11px;
    color: #6b7280;
    margin-top: 4px;
  }

  /* Recipient Info */
  .recipient-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 12px 15px;
    margin-bottom: 15px;
  }

  .recipient-details {
    flex: 1;
  }

  .recipient-name {
    font-size: 15px;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }

  .recipient-number {
    font-size: 11px;
    color: #6b7280;
    margin-top: 2px;
  }

  .report-period {
    text-align: right;
  }

  .period-label {
    font-size: 10px;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0;
  }

  .period-value {
    font-size: 11px;
    font-weight: 600;
    color: #111827;
    margin-top: 2px;
  }

  /* Summary Grid */
  .summary-grid {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
  }

  .summary-card {
    flex: 1;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 12px 10px;
    text-align: center;
  }

  .summary-card.highlight {
    background: #f3f4f6;
    border: 2px solid #9ca3af;
  }

  .summary-label {
    font-size: 9px;
    color: #6b7280;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 500;
  }

  .summary-value {
    font-size: 18px;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }

  .summary-value.green {
    color: #059669;
  }

  .summary-value.red {
    color: #dc2626;
  }

  .summary-count {
    font-size: 9px;
    color: #9ca3af;
    margin-top: 3px;
  }

  /* Entries Section */
  .entries-section {
    margin-top: 10px;
  }

  .section-title {
    font-size: 13px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid #e5e7eb;
  }

  /* Table Styles */
  .entries-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10px;
  }

  .entries-table th {
    background: #f3f4f6;
    padding: 8px 6px;
    text-align: left;
    font-size: 9px;
    font-weight: 600;
    color: #374151;
    border: 1px solid #e5e7eb;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .entries-table td {
    padding: 7px 6px;
    border: 1px solid #e5e7eb;
    vertical-align: middle;
    color: #374151;
  }

  .entries-table tbody tr:nth-child(even) {
    background: #fafafa;
  }

  .entries-table tbody tr:hover {
    background: #f3f4f6;
  }

  /* Table Cell Specific */
  .sno-col {
    width: 35px;
    text-align: center;
  }

  .sno {
    text-align: center;
    color: #9ca3af;
    font-weight: 500;
  }

  .type-in {
    color: #059669;
    font-weight: 600;
  }

  .type-out {
    color: #dc2626;
    font-weight: 600;
  }

  .amount {
    font-weight: 600;
    white-space: nowrap;
    color: #111827;
  }

  .remark {
    color: #6b7280;
    max-width: 180px;
    word-wrap: break-word;
    font-size: 9px;
  }

  .capitalize {
    text-transform: capitalize;
  }

  /* Footer */
  .report-footer {
    margin-top: 25px;
    padding-top: 12px;
    border-top: 1px solid #e5e7eb;
    text-align: center;
    font-size: 9px;
    color: #9ca3af;
  }

  .report-footer p {
    margin: 2px 0;
  }
`;