import { LightningElement, api, track, wire } from 'lwc';
import getReportsByFolderId from '@salesforce/apex/ReportFolderHierarchyController.getReportsByFolderId';

export default class ReportSelection extends LightningElement {
    @api selectedFolderId;
    @track reportOptions = [];
    @track selectedReport = '';
    @track showTable = false;
   
    @wire(getReportsByFolderId, { folderId: '$selectedFolderId' })
    wiredReports({ error, data }) {
        if (data) {
            this.reportOptions = data.map(report => ({ label: report.Name, value: report.Id }));
        } else if (error) {
            console.error('Error fetching reports:', error);
        }
    }

    handleReportSelection(event) {
        this.selectedReport = event.detail.value;
        const selectedReportName = this.reportOptions.find(option => option.value === this.selectedReport).label;
        this.showTable = true;

        this.dispatchEvent(new CustomEvent('reportselect', {
            detail: {
                reportId: this.selectedReport,
                reportName: selectedReportName
            }
        }));
    }
}
