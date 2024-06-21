import { LightningElement, track, wire, api } from 'lwc';
import getContactRecords from '@salesforce/apex/EmailTemplateSearchController.getContactRecords';
import getLeadRecords from '@salesforce/apex/EmailTemplateSearchController.getLeadRecords';
import getLightningEmailFolders from '@salesforce/apex/EmailTemplateSearchController.getLightningEmailFolders';
import getClassicEmailFolders from '@salesforce/apex/EmailTemplateSearchController.getClassicEmailFolders';
import getAllEmailTemplates from '@salesforce/apex/EmailTemplateSearchController.getAllEmailTemplates';
import getUserRecords from '@salesforce/apex/EmailTemplateSearchController.getUserRecords';

export default class EmailRecipientsSelector extends LightningElement {
    @track showModal = false;
    @track modalHeader = '';
    @track searchResults = [];
    @track columns = [];
    @track searchKey = '';
    @track selectedEmails = '';
    @track additionalEmails = '';
    @track combinedFolderOptions = [];
    @track emailTemplateOptions = [];
    @track selectedEmailFolder = '';
    @track selectedEmailFolderId = '';
    @track selectedEmailTemplate = '';
    @track selectedEmailTemplateName = '';
    @track subject = '';
    @track emailBody = '';
    @track emailBodyHtml = '';
    @track isTemplateSelected = false;
    //@track showSubjectError = false;

    contactRowKeys = new Set();
    leadRowKeys = new Set();
    selectedContacts = [];
    selectedLeads = [];
    userRowKeys = new Set();
    selectedUsers = [];

    @api recipientEmailAddresses;
    @api additionalEmails;
    @api subject;
    @api emailBody;
    @api selectedEmailTemplateName;
    @api selectedEmailFolder;
    @api selectedEmailTemplateId;

    connectedCallback() {
        this.selectedEmails = this.recipientEmailAddresses;
        this.additionalEmails = this.additionalEmails;
        this.subject = this.subject;
        this.emailBody = this.emailBody;
        this.selectedEmailTemplateName = this.selectedEmailTemplateName;
        this.selectedEmailFolder = this.selectedEmailFolder;
        this.selectedEmailTemplate = this.selectedEmailTemplateId;
        this.reinitializeEmailTemplates();
    }

    @wire(getLightningEmailFolders)
    wiredLightningFolders({ error, data }) {
        if (data) {
            const lightningFolders = data.map(folder => ({
                label: `${folder.Name} (Lightning)`,
                value: folder.Name,
                id: folder.Id,
                type: 'lightning'
            }));
            this.combineFolderOptions(lightningFolders);
        } else if (error) {
            console.error('Error fetching Lightning folders:', error);
        }
    }

    @wire(getClassicEmailFolders)
    wiredClassicFolders({ error, data }) {
        if (data) {
            const classicFolders = data.map(folder => ({
                label: `${folder.Name} (Classic)`,
                value: folder.Name,
                id: folder.Id,
                type: 'classic'
            }));
            this.combineFolderOptions(classicFolders);
        } else if (error) {
            console.error('Error fetching Classic folders:', error);
        }
    }

    @wire(getAllEmailTemplates)
    wiredEmailTemplates({ error, data }) {
        if (data) {
            this.templates = data;
            this.updateEmailTemplateOptions();
        } else if (error) {
            console.error('Error fetching email templates:', error);
        }
    }

    combineFolderOptions(newFolders) {
        // Add "None" option only if it is not already present
        if (!this.combinedFolderOptions.some(option => option.value === 'None')) {
            this.combinedFolderOptions = [
                { label: 'None', value: 'None', id: '', type: '' },
                ...this.combinedFolderOptions,
                ...newFolders
            ];
        } else {
            this.combinedFolderOptions = [
                ...this.combinedFolderOptions,
                ...newFolders
            ];
    }
    }

    handleEmailFolderChange(event) {
        this.selectedEmailFolder = event.target.value;
        const selectedFolder = this.combinedFolderOptions.find(folder => folder.value === this.selectedEmailFolder);
        this.selectedEmailFolderId = selectedFolder ? selectedFolder.id : '';
    
        if (this.selectedEmailFolder === 'None') {
            // Clear the selected email template, subject, and body
            this.selectedEmailTemplate = '';
            this.subject = '';
            this.emailBody = '';
            this.emailBodyHtml = '';
            this.selectedEmailTemplateName = '';
            this.isTemplateSelected = false;
            this.emailTemplateOptions = [];
        } else {
        this.updateEmailTemplateOptions();
        }
    }
    

    updateEmailTemplateOptions() {
        const selectedFolderId = this.selectedEmailFolderId;
        if (selectedFolderId && this.templates && this.templates.length > 0) {
            this.emailTemplateOptions = this.templates
                .filter(template => template.FolderId === selectedFolderId)
                .map(template => ({
                    label: template.Name,
                    value: template.Id,
                    subject: template.Subject,
                    body: template.Body || template.HtmlValue 
                }));
        } else {
            this.emailTemplateOptions = [];
        }

        if (this.emailTemplateOptions.length === 0 && selectedFolderId) {
            this.emailTemplateOptions = [{ label: 'No templates found in this folder', value: '' }];
        }

        if (this.selectedEmailTemplate) {
            const selectedTemplate = this.emailTemplateOptions.find(template => template.value === this.selectedEmailTemplate);
            if (selectedTemplate) {
                this.subject = selectedTemplate.subject;
                this.emailBody = selectedTemplate.body;
                this.emailBodyHtml = selectedTemplate.body;
                this.selectedEmailTemplateName = selectedTemplate.label;
                this.isTemplateSelected = true;
            }
        } else {
            this.isTemplateSelected = false;
        }
    }

    handleEmailTemplateChange(event) {
        this.selectedEmailTemplate = event.target.value;
        const selectedTemplate = this.emailTemplateOptions.find(template => template.value === this.selectedEmailTemplate);
        if (selectedTemplate) {
            this.subject = selectedTemplate.subject;
            this.emailBody = selectedTemplate.body;
            this.emailBodyHtml = selectedTemplate.body;
            this.selectedEmailTemplateName = selectedTemplate.label;
            this.isTemplateSelected = true;
        } else {
            this.subject = this.subject;
            this.emailBody = this.emailBody;
            this.emailBodyHtml = '';
            this.selectedEmailTemplateName = this.selectedEmailTemplateName;
            this.isTemplateSelected = false;
        }
    }

    handleContactSearch() {
        getContactRecords()
            .then(result => {
                if (result && result.length > 0) {
                    this.modalHeader = 'Contact Records';
                    this.searchResults = result;
                    this.columns = [
                        { label: 'First Name', fieldName: 'FirstName' },
                        { label: 'Last Name', fieldName: 'LastName' },
                        { label: 'Email', fieldName: 'Email' }
                    ];
                    this.showModal = true;
                    this.updateSelectedRowKeys();
                } else {
                    // Handle no records found
                }
            })
            .catch(error => {
                console.error('Error fetching contact records:', error);
            });
    }

    handleLeadSearch() {
        getLeadRecords()
            .then(result => {
                if (result && result.length > 0) {
                    this.modalHeader = 'Lead Records';
                    this.searchResults = result;
                    this.columns = [
                        { label: 'First Name', fieldName: 'FirstName' },
                        { label: 'Last Name', fieldName: 'LastName' },
                        { label: 'Email', fieldName: 'Email' }
                    ];
                    this.showModal = true;
                    this.updateSelectedRowKeys();
                } else {
                    // Handle no records found
                }
            })
            .catch(error => {
                console.error('Error fetching lead records:', error);
            });
    }

    closeModal() {
        this.showModal = false;
        this.searchResults = [];
        this.columns = [];
        this.searchKey = '';
    }

    handleSearch(event) {
        this.searchKey = event.target.value.toLowerCase();
    }

    get filteredData() {
        return this.searchResults.filter(record => {
            return Object.values(record).some(
                field => typeof field === 'string' && field.toLowerCase().includes(this.searchKey)
            );
        });
    }

    handleClearAll() {
        this.selectedEmails = '';
        this.contactRowKeys.clear();
        this.leadRowKeys.clear();
        this.userRowKeys.clear(); // Ensure userRowKeys is also cleared
        this.selectedContacts = [];
        this.selectedLeads = [];
        this.selectedUsers = []; // Reset selectedUsers array
        this.updateSelectedRowKeys();
    }

    handleRowSelection(event) {
        const selectedRows = event.detail.selectedRows;
        const currentSelectedEmails = new Set(this.selectedEmails.split(', ').filter(email => email.trim()));

        const selectedIds = new Set(selectedRows.map(row => row.Id));
        const allSelectedRows = this.selectedContacts.concat(this.selectedLeads).concat(this.selectedUsers || []);

        allSelectedRows.forEach(row => {
            if (!selectedIds.has(row.Id)) {
                currentSelectedEmails.delete(row.Email);
            }
        });

        if (this.modalHeader === 'Contact Records') {
            this.contactRowKeys = new Set(selectedRows.map(row => row.Id));
            this.selectedContacts = selectedRows;
        } else if (this.modalHeader === 'Lead Records') {
            this.leadRowKeys = new Set(selectedRows.map(row => row.Id));
            this.selectedLeads = selectedRows;
        } else if (this.modalHeader === 'User Records') {
            this.userRowKeys = new Set(selectedRows.map(row => row.Id));
            this.selectedUsers = selectedRows;
        }

        this.selectedContacts.concat(this.selectedLeads).concat(this.selectedUsers || []).forEach(row => {
            if (selectedIds.has(row.Id)) {
                currentSelectedEmails.add(row.Email);
            }
        });

        this.selectedEmails = [...currentSelectedEmails].join(', ');
        this.updateSelectedRowKeys();
    }

    addSelectedEmails() {
        const newEmails = this.selectedContacts.concat(this.selectedLeads).concat(this.selectedUsers || []).map(row => row.Email);
        const existingEmailsArray = this.selectedEmails.split(', ').filter(email => email.trim());
        const allEmailsSet = new Set([...existingEmailsArray, ...newEmails]);
        this.selectedEmails = [...allEmailsSet].join(', ');

        this.showModal = false;
    }

    updateSelectedRowKeys() {
        if (this.modalHeader === 'Contact Records') {
            this.selectedRowKeysArray = [...this.contactRowKeys];
        } else if (this.modalHeader === 'Lead Records') {
            this.selectedRowKeysArray = [...this.leadRowKeys];
        } else if (this.modalHeader === 'User Records') {
            this.selectedRowKeysArray = [...this.userRowKeys];
        }
    }

    get selectedRowKeysArray() {
        return this._selectedRowKeysArray;
    }

    set selectedRowKeysArray(value) {
        this._selectedRowKeysArray = value;
    }

    handleEmailChange(event) {
        this.selectedEmails = event.target.value;
    }

    handleAdditionalEmailsChange(event) {
        this.additionalEmails = event.target.value;
    }

    handleSubjectChange(event) {
        this.subject = event.target.value;
        // if (this.subject) {
        //     this.showSubjectError = false; // Clear error state when subject is entered
        // }
    }

    handleEmailBodyChange(event) {
        this.emailBody = event.target.value;
    }

    handleNextClick() {

        // if (!this.subject) {
        //     this.showSubjectError = true;
        //     return; // Prevent further actions if validation fails
        // }

        const nextEvent = new CustomEvent('next', {
            detail: {
                recipientEmailAddresses: this.selectedEmails,
                additionalEmails: this.additionalEmails,
                subject: this.subject,
                emailBody: this.emailBody,
                selectedEmailTemplateName: this.selectedEmailTemplateName,
                selectedEmailFolder: this.selectedEmailFolder,
                selectedEmailTemplateId: this.selectedEmailTemplate
            }
        });
        this.dispatchEvent(nextEvent);
    }

    handleBackClick() {
        const backEvent = new CustomEvent('back', {
            detail: {
                recipientEmailAddresses: this.selectedEmails,
                additionalEmails: this.additionalEmails,
                subject: this.subject,
                emailBody: this.emailBody,
                selectedEmailTemplateName: this.selectedEmailTemplateName,
                selectedEmailFolder: this.selectedEmailFolder,
                selectedEmailTemplateId: this.selectedEmailTemplate
            }
        });
        this.dispatchEvent(backEvent);
    }

    reinitializeEmailTemplates() {
        const selectedFolder = this.combinedFolderOptions.find(folder => folder.value === this.selectedEmailFolder);
        this.selectedEmailFolderId = selectedFolder ? selectedFolder.id : '';
        this.updateEmailTemplateOptions();
    }
    handleUserSearch() {
        getUserRecords()
            .then(result => {
                if (result && result.length > 0) {
                    this.modalHeader = 'User Records';
                    this.searchResults = result;
                    this.columns = [
                        { label: 'First Name', fieldName: 'FirstName' },
                        { label: 'Last Name', fieldName: 'LastName' },
                        { label: 'Email', fieldName: 'Email' }
                    ];
                    this.showModal = true;
                    this.updateSelectedRowKeys();
                } else {
                    // Handle no records found
                }
            })
            .catch(error => {
                console.error('Error fetching user records:', error);
            });
    }
    
}