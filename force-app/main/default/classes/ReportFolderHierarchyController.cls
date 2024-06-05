public with sharing class ReportFolderHierarchyController {
    @AuraEnabled
    public static hierarchyWrapper getAllFolderHierarchy() {
        List<Folder> folderList = [SELECT Id, Name, ParentId FROM Folder WHERE Type = 'Report' AND DeveloperName != null WITH SECURITY_ENFORCED];
        return getAllHierarchy(folderList, 'ParentId');
    }

    @AuraEnabled
    public static hierarchyWrapper getAllHierarchy(List<SObject> recordList, String parentFieldApiName) {
        Map<String, List<SObject>> mapOfParentWithListOfChild = new Map<String, List<SObject>>();
        List<SObject> parentList = new List<SObject>();
        for (SObject record : recordList) {
            if (record.get(parentFieldApiName) != null) {
                if (mapOfParentWithListOfChild.containsKey((String) record.get(parentFieldApiName))) {
                    mapOfParentWithListOfChild.get((String) record.get(parentFieldApiName)).add(record);
                } else {
                    mapOfParentWithListOfChild.put((String) record.get(parentFieldApiName), new List<SObject>{record});
                }
            } else {
                parentList.add(record);
            }
        }
        hierarchyWrapper wrapper = new hierarchyWrapper();
        wrapper.superParentList = parentList;
        wrapper.parentMap = mapOfParentWithListOfChild;

        return wrapper;
    }

    @AuraEnabled(cacheable=true)
    public static List<ReportWrapper> getReportsByFolderId(String folderId) {
        List<ReportWrapper> reportList = new List<ReportWrapper>();
        List<Report> reports = [SELECT Id, Name, CreatedBy.Name FROM Report WHERE OwnerId = :folderId WITH SECURITY_ENFORCED];
        for (Report r : reports) {
            reportList.add(new ReportWrapper(r.Id, r.Name, r.CreatedBy.Name));
        }
        return reportList;
    }

    @AuraEnabled
    public static void saveReportList(List<Report_List__c> reportList) {
        try {
            insert reportList;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static Report_Setting_Configuration__c getRecordDetails(String recordId) {
        try {
            return [SELECT Id, Recipient_Email_Addresses__c, Additional_Emails__c, Subject__c, Email_Body__c, Email_Template__c, Email_Template_Folder__c FROM Report_Setting_Configuration__c WHERE Id = :recordId WITH SECURITY_ENFORCED LIMIT 1];
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching record details: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static void updateRecord(String recordId, Map<String, Object> updatedFields) {
        try {
            Report_Setting_Configuration__c record = [SELECT Id FROM Report_Setting_Configuration__c WHERE Id = :recordId LIMIT 1];
            for (String fieldName : updatedFields.keySet()) {
                record.put(fieldName, updatedFields.get(fieldName));
            }
            update record;
        } catch (Exception e) {
            throw new AuraHandledException('Error updating record: ' + e.getMessage());
        }
    }

    public class ReportWrapper {
        @AuraEnabled public String Id;
        @AuraEnabled public String Name;
        @AuraEnabled public String CreatedByName;

        public ReportWrapper(String Id, String Name, String CreatedByName) {
            this.Id = Id;
            this.Name = Name;
            this.CreatedByName = CreatedByName;
        }
    }

    public class hierarchyWrapper {
        @AuraEnabled public List<SObject> superParentList {get; set;}
        @AuraEnabled public Map<String, List<SObject>> parentMap {get; set;}
    }
}
