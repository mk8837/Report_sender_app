import { LightningElement, api, track, wire } from 'lwc';
import getAllFolderHierarchy from '@salesforce/apex/ReportFolderHierarchyController.getAllFolderHierarchy';
import getReportsByFolderId from '@salesforce/apex/ReportFolderHierarchyController.getReportsByFolderId';

const COLUMNS_DEFINITION_BASIC = [
    { label: 'Folder Name', fieldName: 'Name', type: 'button', iconName: 'utility:open_folder', typeAttributes: { label: { fieldName: 'Name' }, variant: 'base', iconName: 'utility:open_folder' }, sortable: true },
];

export default class ReportFolderAndList extends LightningElement {
    @track hierarchyMap;
    @track selectedFolderId;
    @track folderReports = [];
    @track hasReports = false;

    @api gridColumns = COLUMNS_DEFINITION_BASIC;
    @api primaryKey = 'Id';

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
        const selectedReport = event.detail.reportId;
        const selectedReportName = event.detail.reportName;

        if (selectedReport && selectedReportName) {
            this.dispatchEvent(new CustomEvent('add', {
                detail: { selectedReport, selectedReportName }
            }));
        }
    }
}
