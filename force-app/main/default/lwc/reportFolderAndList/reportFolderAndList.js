import { LightningElement, api, track } from 'lwc';
import getAllFolderHierarchy from '@salesforce/apex/ReportFolderHierarchyController.getAllFolderHierarchy';
import getReportsByFolderId from '@salesforce/apex/ReportFolderHierarchyController.getReportsByFolderId';

const COLUMNS_DEFINITION_BASIC = [
    { label: 'Folder Name', fieldName: 'Name', type: 'button', iconName: 'utility:open_folder', typeAttributes: { label: { fieldName: 'Name' }, variant: 'base', iconName: 'utility:open_folder' }, sortable: true },
];
const REPORT_COLUMNS = [
    { label: 'Report Name', fieldName: 'reportName', type: 'text' }
];

export default class ReportFolderAndList extends LightningElement {
    @track hierarchyMap;
    @track selectedFolderId;
    @track folderReports = [];
    @track hasReports = false;
    @track selectedReportsData = [];

    @api gridColumns = COLUMNS_DEFINITION_BASIC;
    @api primaryKey = 'Id';

    @api reportColumns = REPORT_COLUMNS;

    connectedCallback() {
        getAllFolderHierarchy().then(result => {
            this.parseResult(result);
        }).catch(error => {
            console.error('Error:', error);
        });
    }

    parseResult(result) {
        this.hierarchyMap = [];
        result.superParentList.forEach(element => {
            this.hierarchyMap.push(this.findChildrenNode(element, result));
        });
        this.hierarchyMap = JSON.parse(JSON.stringify(this.hierarchyMap));
    }

    findChildrenNode(element, result) {
        for (let key in result.parentMap) {
            if (key === element[this.primaryKey]) {
                element["_children"] = result.parentMap[key];
                element["_children"].forEach(child => {
                    this.findChildrenNode(child, result);
                });
            }
        }
        return element;
    }

    handleFolderClick(event) {
        this.selectedFolderId = event.detail.row.Id;
        this.fetchReports();
    }

    fetchReports() {
        getReportsByFolderId({ folderId: this.selectedFolderId })
            .then(result => {
                this.folderReports = result;
                this.hasReports = result && result.length > 0;
            })
            .catch(error => {
                console.error('Error fetching reports:', error);
                this.folderReports = [];
                this.hasReports = false;
            });
    }

    handleReportSelect(event) {
        const selectedReportsDetails = event.detail.selectedReportsDetails;

        selectedReportsDetails.forEach(report => {
            const reportExists = this.selectedReportsData.some(existingReport => existingReport.reportId === report.reportId);

            if (!reportExists) {
                this.selectedReportsData = [...this.selectedReportsData, { reportId: report.reportId, reportName: report.reportName }];
            }
        });

        this.dispatchEvent(new CustomEvent('reportselect', {
            detail: { selectedReportsDetails: this.selectedReportsData }
            }));
        }
    }
}
