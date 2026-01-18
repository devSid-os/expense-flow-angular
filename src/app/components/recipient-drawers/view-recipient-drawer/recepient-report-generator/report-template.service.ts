// report-template.service.ts
import { EntryModel } from '../../../../Models/entry.model';
import { RecipientModel } from '../../../../Models/recipient.model';

export class ReportTemplateService {
  constructor(
    private recipient: RecipientModel,
    private entries: EntryModel[],
    private today: Date
  ) {}

  generateHTML(): string {
    return `
      <div class="report-container">
        ${this.recipientInfoSection()}
        ${this.summarySection()}
        ${this.entriesTableSection()}
        ${this.footerSection()}
      </div>
    `;
  }

  

  private recipientInfoSection(): string {
    return `
      <div class="recipient-info">
        <div class="recipient-details">
          <p class="recipient-name">${this.recipient?.name || 'N/A'}</p>
          <p class="recipient-number">${this.recipient?.number || 'N/A'}</p>
        </div>
        <div class="report-period">
          <p class="period-label">Report Period</p>
          <p class="period-value">All Transactions</p>
        </div>
      </div>
    `;
  }

  private summarySection(): string {
    const balanceClass = this.balance > 0 ? 'green' : this.balance < 0 ? 'red' : '';
    
    return `
      <div class="summary-grid">
        <div class="summary-card">
          <p class="summary-label">Total Given (You Paid)</p>
          <p class="summary-value red">${this.formatCurrency(this.totalOut)}</p>
          <p class="summary-count">${this.outCount} transactions</p>
        </div>
        <div class="summary-card">
          <p class="summary-label">Total Received (You Got)</p>
          <p class="summary-value green">${this.formatCurrency(this.totalIn)}</p>
          <p class="summary-count">${this.inCount} transactions</p>
        </div>
        <div class="summary-card highlight">
          <p class="summary-label">${this.balanceStatus}</p>
          <p class="summary-value ${balanceClass}">${this.formatCurrency(Math.abs(this.balance))}</p>
          <p class="summary-count">Net Balance</p>
        </div>
      </div>
    `;
  }

  private entriesTableSection(): string {
    const rows = this.entries.map((entry, idx) => this.tableRow(entry, idx + 1)).join('');

    return `
      <div class="entries-section">
        <h2 class="section-title">Transaction History (${this.entries.length} entries)</h2>
        <table class="entries-table">
          <thead>
            <tr>
              <th class="sno-col">#</th>
              <th>Date & Time</th>
              <th>Type</th>
              <th>Mode</th>
              <th>Amount</th>
              <th>Remark</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  private tableRow(entry: EntryModel, index: number): string {
    const typeClass = entry.type === 'in' ? 'type-in' : 'type-out';
    const typeText = entry.type === 'in' ? 'Received' : 'Paid';

    return `
      <tr>
        <td class="sno">${index}</td>
        <td>${this.formatDate(entry.date)}</td>
        <td class="${typeClass}">${typeText}</td>
        <td class="capitalize">${entry.mode}</td>
        <td class="amount">${this.formatCurrency(entry.amount)}</td>
        <td class="remark">${entry.remark || '-'}</td>
      </tr>
    `;
  }

  private footerSection(): string {
    return `
      <div class="report-footer">
        <p>This is a computer-generated report. Total entries: ${this.entries.length}</p>
        <p>Report generated for: ${this.recipient?.name} | Date: ${this.formatDate(this.today)}</p>
      </div>
    `;
  }

  // Getters for calculations
  private get totalIn(): number {
    return this.entries
      .filter(e => e.type === 'in')
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  }

  private get totalOut(): number {
    return this.entries
      .filter(e => e.type === 'out')
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  }

  private get inCount(): number {
    return this.entries.filter(e => e.type === 'in').length;
  }

  private get outCount(): number {
    return this.entries.filter(e => e.type === 'out').length;
  }

  private get balance(): number {
    return this.totalIn - this.totalOut;
  }

  private get balanceStatus(): string {
    if ((this.recipient?.in || 0) > (this.recipient?.out || 0)) return 'You Will Give';
    else if ((this.recipient?.in || 0) < (this.recipient?.out || 0)) return 'You Will Get';
    return 'Settled Up';
  }

  // Formatters
  private formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  }
}