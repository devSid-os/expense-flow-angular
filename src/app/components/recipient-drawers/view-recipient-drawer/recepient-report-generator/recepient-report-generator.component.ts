// report-generator.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipientModel } from '../../../../Models/recipient.model';
import { REPORT_STYLES } from './report-generator.styles';
import { ReportTemplateService } from './report-template.service';
import { EntryModel } from '../../../../Models/entry.model';

@Component({
  selector: 'app-recepient-report-generator',
  imports: [CommonModule],
  templateUrl: './recepient-report-generator.component.html',
  template: '<ng-content></ng-content>',
  standalone: true,
  styleUrl: './recepient-report-generator.component.scss'
})
export class RecepientReportGeneratorComponent {

  generatePDF(recipient: RecipientModel, entries: EntryModel[]): Promise<boolean> {
    return new Promise((resolve) => {
      console.log('Recipient:', recipient);
      console.log('Entries:', entries);

      if (!recipient || !entries) {
        console.error('Missing data');
        resolve(false);
        return;
      }

      const printWindow = window.open('', '_blank');

      if (!printWindow) {
        alert('Please allow popups to download the report');
        resolve(false);
        return;
      }

      const templateService = new ReportTemplateService(
        recipient,
        entries,
        new Date()
      );

      const content = templateService.generateHTML();

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${recipient?.name || 'Report'}_Transaction_Report</title>
            <style>${REPORT_STYLES}</style>
          </head>
          <body>${content}</body>
        </html>
      `);

      printWindow.document.close();

      printWindow.onload = () => {
        printWindow.print();
        resolve(true);
      };

      setTimeout(() => {
        printWindow.print();
        resolve(true);
      }, 500);
    });
  }
}
