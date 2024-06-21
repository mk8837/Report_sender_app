import { LightningElement, track, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import saveReportList from '@salesforce/apex/ReportFolderHierarchyController.saveReportList';

export default class ReportEmailScheduler extends NavigationMixin(LightningElement) {
    @track leavesReqeusts = [];
    @track columns = [];
    @track isActive = true;
    @track noRecordsFound = false;
    @track showDetails = false;
    @track recordId;
    @track objectApiName = 'Report_Setting_Configuration__c';

    @track isScheduled = false;
    @track isDaily = false;
    @track isWeekly = false;
    @track isMonthly = false;

    @api recipientEmailAddresses;
    @api additionalEmails;
    @api subject;
    @api emailBody;
    @api selectedEmailTemplateName;
    @api selectedEmailFolder;
    @api selectedEmailTemplateId;
    @api selectedReports;

    get selectedReportsString() {
        return JSON.stringify(this.selectedReports, null, 2);
    }

    rowActionHandler(event) {
        this.recordId = event.detail.row.Id;
        this.showDetails = true;
    }

    hideDetailsHandler() {
        this.showDetails = false;
    }

    successHandler(event) {
        const reportSettingConfigId = event.detail.id;
        this.saveReports(reportSettingConfigId);
        this.navigateToRecordPage(reportSettingConfigId);
    }

    handleSendTypeChange(event) {
        const sendTypeValue = event.target.value;
        this.isScheduled = sendTypeValue === 'Scheduled';
    }

    handleScheduleTypeChange(event) {
        this.isDaily = false;
        this.isWeekly = false;
        this.isMonthly = false;

        const scheduleTypeValue = event.target.value;
        if (scheduleTypeValue === 'Daily') {
            this.isDaily = true;
        } else if (scheduleTypeValue === 'Weekly') {
            this.isWeekly = true;
        } else if (scheduleTypeValue === 'Monthly') {
            this.isMonthly = true;
        }
    }

    handleBackClick() {
        const backEvent = new CustomEvent('back', {
            detail: {
                recipientEmailAddresses: this.recipientEmailAddresses,
                additionalEmails: this.additionalEmails,
                subject: this.subject,
                emailBody: this.emailBody,
                selectedEmailTemplateName: this.selectedEmailTemplateName,
                selectedEmailFolder: this.selectedEmailFolder,
                selectedEmailTemplateId: this.selectedEmailTemplateId
            }
        });
        this.dispatchEvent(backEvent);
    }

    saveReports(reportSettingConfigId) {
        const reportsToSave = this.selectedReports.map(report => ({
            Name: report.Name,
            Report_Id__c: report.Id,
            ReportSettingConfigID__c: reportSettingConfigId
        }));

        saveReportList({ reportList: reportsToSave })
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Reports have been saved successfully',
                        variant: 'success'
                    })
                );
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error saving reports',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });
    }

    navigateToRecordPage(recordId) {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordId,
                objectApiName: 'Report_Setting_Configuration__c',
                actionName: 'view'
            }
        });
    }
}
