import { LightningElement, api, track, wire } from 'lwc';
import getReportsByFolderId from '@salesforce/apex/ReportFolderHierarchyController.getReportsByFolderId';

export default class ReportSelection extends LightningElement {
    @api selectedFolderId;
    @track reportOptions = [];
    @track selectedReports = [];
   
    @wire(getReportsByFolderId, { folderId: '$selectedFolderId' })
    wiredReports({ error, data }) {
        if (data) {
            this.reportOptions = data.map(report => ({ label: report.Name, value: report.Id }));
        } else if (error) {
            console.error('Error fetching reports:', error);
        }
    }

    handleReportSelection(event) {
        this.selectedReports = event.detail.value;
    }

    handleAddReport() {
        const selectedReportsDetails = this.selectedReports.map(reportId => {
            const report = this.reportOptions.find(option => option.value === reportId);
            return { reportId, reportName: report.label };
        });

        this.dispatchEvent(new CustomEvent('reportselect', {
            detail: { selectedReportsDetails }
        }));
    }
}
