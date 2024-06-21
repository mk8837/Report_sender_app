public with sharing class EmailTemplateSearchController {
    @AuraEnabled(cacheable=true)
    public static List<Contact> getContactRecords() {
        return [SELECT Id, FirstName, LastName, Email FROM Contact WITH SECURITY_ENFORCED];
    }

    @AuraEnabled(cacheable=true)
    public static List<Lead> getLeadRecords() {
        return [SELECT Id, FirstName, LastName, Email FROM Lead WITH SECURITY_ENFORCED];
    }
    @AuraEnabled(cacheable=true)
    public static List<User> getUserRecords() {
        try {
            return [SELECT Id, FirstName, LastName, Email FROM User WHERE Email != NULL WITH SECURITY_ENFORCED];
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching user records: ' + e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<Folder> getLightningEmailFolders() {
        return [SELECT Id, Name, Type FROM Folder WHERE Type = 'EmailTemplate' WITH SECURITY_ENFORCED];
    }

    @AuraEnabled(cacheable=true)
    public static List<Folder> getClassicEmailFolders() {
        return [SELECT Id, Name, Type FROM Folder WHERE Type = 'Email' WITH SECURITY_ENFORCED];
    }

    @AuraEnabled(cacheable=true)
    public static List<EmailTemplate> getAllEmailTemplates() {
        try {
            return [SELECT Id, Name, Subject, Body, HtmlValue, FolderId, FolderName FROM EmailTemplate WHERE IsActive = true WITH SECURITY_ENFORCED];
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching Email Templates: ' + e.getMessage());
        }
    }
}
