import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const columns = [
    { label: 'Report Name', fieldName: 'Name', type: 'text' },
    { label: 'Report ID', fieldName: 'Id', type: 'text' },
    {
        type: 'button',
        typeAttributes: {
            iconName: 'utility:delete',
            name: 'remove',
            title: 'Remove',
            variant: 'destructive'
        }
    }
];

export default class ReportSchedulingManager extends LightningElement {
    @track currentStep = 'step1';
    @track showFirstComponent = false;
    @track showSecondComponent = false;
    @track showThirdComponent = false;
    @track showFirstComponentbeg = true;

    @track selectedReports = [];
    @track recipientEmailAddresses = '';
    @track additionalEmails = '';
    @track subject = '';
    @track emailBody = '';
    @track selectedEmailTemplateName = '';
    @track selectedEmailFolder = '';
    @track selectedEmailTemplateId = '';

    columns = columns;

    handleNext(event) {
        if (this.currentStep === 'step1') {
            if (this.selectedReports.length === 0) {
                this.showNotification('Error', 'Please select at least one report before proceeding.', 'error');
                return;
            }
            this.showFirstComponent = false;
            this.showSecondComponent = true;
            this.showFirstComponentbeg = false;
            this.currentStep = 'step2';
        } else if (this.currentStep === 'step2') {
            this.recipientEmailAddresses = event.detail.recipientEmailAddresses;
            this.additionalEmails = event.detail.additionalEmails;
            this.subject = event.detail.subject;
            this.emailBody = event.detail.emailBody;
            this.selectedEmailTemplateName = event.detail.selectedEmailTemplateName;
            this.selectedEmailFolder = event.detail.selectedEmailFolder;
            this.selectedEmailTemplateId = event.detail.selectedEmailTemplateId;

            if (!this.recipientEmailAddresses && !this.additionalEmails) {
                this.showNotification('Error', 'Please enter at least one email address before proceeding.', 'error');
                return;
            }
            if (!this.subject) {
                this.showNotification('Error', 'Please enter the subject before proceeding.', 'error');
                return;
            }

            this.showSecondComponent = false;
            this.showThirdComponent = true;
            this.showFirstComponentbeg = false;
            this.currentStep = 'step3';
        }
    }

    handleBack(event) {
        if (this.currentStep === 'step3') {
            this.showThirdComponent = false;
            this.showSecondComponent = true;
            this.currentStep = 'step2';
        } else if (this.currentStep === 'step2') {
            this.showSecondComponent = false;
            this.showFirstComponentbeg = true;
            this.currentStep = 'step1';
        }

        const detail = event.detail;
        this.recipientEmailAddresses = detail.recipientEmailAddresses || this.recipientEmailAddresses;
        this.additionalEmails = detail.additionalEmails || this.additionalEmails;
        this.subject = detail.subject || this.subject;
        this.emailBody = detail.emailBody || this.emailBody;
        this.selectedEmailTemplateName = detail.selectedEmailTemplateName || this.selectedEmailTemplateName;
        this.selectedEmailFolder = detail.selectedEmailFolder || this.selectedEmailFolder;
        this.selectedEmailTemplateId = detail.selectedEmailTemplateId || this.selectedEmailTemplateId;
    }

    handleSave() {
        this.currentStep = 'step3';
        this.showNotification('Success', 'Record saved successfully.', 'success');
    }

    navigateToStep(event) {
        const step = event.target.dataset.step;

        if (step === '1') {
            this.showFirstComponentbeg = true;
            this.showSecondComponent = false;
            this.showThirdComponent = false;
            this.currentStep = 'step1';
        } else if (step === '2') {
            if (this.selectedReports.length === 0) {
                this.showNotification('Error', 'Please select at least one report before proceeding.', 'error');
                return;
            }
            this.showFirstComponentbeg = false;
            this.showSecondComponent = true;
            this.showThirdComponent = false;
            this.currentStep = 'step2';
        } else if (step === '3') {
            if (!this.recipientEmailAddresses && !this.additionalEmails) {
                this.showNotification('Error', 'Please enter at least one email address before proceeding.', 'error');
                return;
            }
            if (!this.subject) {
                this.showNotification('Error', 'Please enter the subject before proceeding.', 'error');
                return;
            }

            this.showFirstComponentbeg = false;
            this.showSecondComponent = false;
            this.showThirdComponent = true;
            this.currentStep = 'step3';
        }
    }

    openModal() {
        this.showFirstComponent = true;
    }

    openSecondScreen() {
        if (this.selectedReports.length === 0) {
            this.showNotification('Error', 'Please select at least one report before proceeding.', 'error');
            return;
        }
        this.showSecondComponent = true;
        this.showFirstComponentbeg = false;
        this.currentStep = 'step2';
    }

    handleClose() {
        this.showFirstComponent = false;
    }

    handleAddReport(event) {
        const selectedReport = event.detail.selectedReport;
        const selectedReportName = event.detail.selectedReportName;

        const reportExists = this.selectedReports.some(report => report.Id === selectedReport);

        if (!reportExists) {
            if (selectedReport && selectedReportName) {
                this.selectedReports = [...this.selectedReports, { Id: selectedReport, Name: selectedReportName }];
                this.handleClose();
            }
        } else {
            this.showNotification('Error', 'This report is already added to the list.', 'error');
        }
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        if (actionName === 'remove') {
            this.removeReport(row);
        }
    }

    removeReport(row) {
        const { Id } = row;
        this.selectedReports = this.selectedReports.filter(report => report.Id !== Id);
    }

    showNotification(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(evt);
    }
}
