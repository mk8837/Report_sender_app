public class QueuedReportEmailSender implements Queueable, Database.AllowsCallouts {
    private List<Report_Setting_Configuration__c> records;
    private Integer index;

    public QueuedReportEmailSender(List<Report_Setting_Configuration__c> records, Integer index) {
        this.records = records;
        this.index = index;
    }

    public void execute(QueueableContext context) {
        if (index < records.size()) {
            Report_Setting_Configuration__c record = records[index];

            List<Report_List__c> reportList = [SELECT Report_Id__c, Name FROM Report_List__c WHERE ReportSettingConfigID__c = :record.Id];
            List<Id> reportIds = new List<Id>();
            for (Report_List__c report : reportList) {
                reportIds.add(report.Report_Id__c);
            }

            List<Report> reports = [SELECT Id, Name FROM Report WHERE Id IN :reportIds];
            List<Messaging.EmailFileAttachment> attachments = new List<Messaging.EmailFileAttachment>();

            for (Report report : reports) {
                String reportIdStr = report.Id;
                String reportName = report.Name;

                try {
                    ApexPages.PageReference reportPage = new ApexPages.PageReference('/' + reportIdStr + '?csv=1&exp=1&enc=UTF-8&isdtp=p1');
                    Blob csvBlob = reportPage.getContent();

                    Messaging.EmailFileAttachment reportAttachment = new Messaging.EmailFileAttachment();
                    reportAttachment.setFileName(reportName + '.csv');
                    reportAttachment.setBody(csvBlob);
                    reportAttachment.setContentType('text/csv');
                    attachments.add(reportAttachment);
                } catch (Exception e) {
                    System.debug('Error fetching CSV for report ID: ' + reportIdStr + '. Error: ' + e.getMessage());
                }
            }

            try {
                List<String> emailAddresses = new List<String>();
                if (record.Recipient_Email_Addresses__c != null) {
                    emailAddresses.addAll(record.Recipient_Email_Addresses__c.split(','));
                }
                if (record.Additional_Emails__c != null) {
                    emailAddresses.addAll(record.Additional_Emails__c.split(','));
                }

                for (Integer i = 0; i < emailAddresses.size(); i++) {
                    emailAddresses[i] = emailAddresses[i].trim();
                }

                Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
                mail.setToAddresses(emailAddresses);
                mail.setSubject(record.Subject__c != null ? record.Subject__c : 'No Subject');
                mail.setPlainTextBody(record.Email_Body__c != null ? record.Email_Body__c : 'No Body');
                mail.setFileAttachments(attachments);

                if (!emailAddresses.isEmpty()) {
                    Messaging.sendEmail(new Messaging.SingleEmailMessage[] { mail });
                }
            } catch (Exception e) {
                System.debug('Error sending email for record ID: ' + record.Id + '. Error: ' + e.getMessage());
            }

            // Chain the next job
            if (index + 1 < records.size()) {
                System.enqueueJob(new QueuedReportEmailSender(records, index + 1));
            }
        }
    }
}
