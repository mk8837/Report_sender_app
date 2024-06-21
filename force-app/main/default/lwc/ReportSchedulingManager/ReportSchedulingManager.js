import { LightningElement, track ,api} from 'lwc';
    @api recordId;
                this.selectedReports = [...this.selectedReports, { Id: report.reportId, Name: report.reportName }];
            }
        });

        this.handleClose();  // Close the modal after adding the reports
    @api recordId;
