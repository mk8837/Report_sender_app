global class ScheduledReportBatchProcessor implements Database.Batchable<SObject>, Schedulable {

        global void execute(SchedulableContext sc) {
            Database.executeBatch(this, 5); // Set a manageable batch size, e.g., 5 records per batch
        }
    
        global Database.QueryLocator start(Database.BatchableContext bc) {
            return Database.getQueryLocator([
                SELECT Id, Recipient_Email_Addresses__c, Additional_Emails__c, Email_Body__c, Subject__c, Time_Value__c, Scheduled_Day__c, Schedule_Date__c 
                FROM Report_Setting_Configuration__c 
                WHERE Time_Value__c != NULL OR Schedule_Date__c != NULL
            ]);
        }
    
        global void execute(Database.BatchableContext bc, List<Report_Setting_Configuration__c> scope) {
            DateTime now = DateTime.now();
            String currentDay = now.format('EEEE'); // Get current day of the week (e.g., Monday, Tuesday)
            String currentTime = now.format('h:mm a'); // Get current time in h:mm a format (e.g., 04:00 PM)
            String currentDate = now.format('dd/MM/yyyy'); // Get the current date in dd/MM/yyyy format
    
            List<Report_Setting_Configuration__c> recordsToProcess = new List<Report_Setting_Configuration__c>();
            for (Report_Setting_Configuration__c record : scope) {
                System.debug('Processing record: ' + record);
    
                try {
                    Boolean shouldSendEmail = false;
                    // Daily schedule (only time specified)
                    if (record.Time_Value__c != null && record.Schedule_Date__c == null &&  record.Scheduled_Day__c == null) {
                        String recordTime = record.Time_Value__c;
                        System.debug('Checking daily schedule. Current time: ' + currentTime + ', Record time: ' + recordTime);
                        if (currentTime.equalsIgnoreCase(recordTime)) {
                            shouldSendEmail = true;
                        }
                    }
                    // Weekly schedule (time and day specified)
                    if (record.Scheduled_Day__c != null && record.Time_Value__c != null) {
                        String recordTime = record.Time_Value__c;
                        System.debug('Checking weekly schedule. Current day: ' + currentDay + ', Record day: ' + record.Scheduled_Day__c + ', Current time: ' + currentTime + ', Record time: ' + recordTime);
                        if (currentDay.equalsIgnoreCase(record.Scheduled_Day__c) && currentTime.equalsIgnoreCase(recordTime)) {
                            shouldSendEmail = true;
                        }
                    }
                    // One-time schedule (specific date and time)
                    if (record.Schedule_Date__c != null && record.Time_Value__c != null) {
                        String recordDate = DateTime.newInstance(record.Schedule_Date__c, Time.newInstance(0, 0, 0, 0)).format('dd/MM/yyyy');
                        String recordTime = record.Time_Value__c;
                        System.debug('Checking one-time schedule for record ID: ' + record.Id + '. Schedule_Date__c: ' + recordDate + ', Time_Value__c: ' + recordTime);
                        if (currentDate.equalsIgnoreCase(recordDate) && currentTime.equalsIgnoreCase(recordTime)) {
                            shouldSendEmail = true;
                        }
                    }
    
                    if (shouldSendEmail) {
                        recordsToProcess.add(record);
                    }
                } catch (Exception e) {
                    System.debug('Error processing record ID: ' + record.Id + '. Error: ' + e.getMessage());
                }
            }
    
            if (!recordsToProcess.isEmpty()) {
                System.enqueueJob(new QueuedReportEmailSender(recordsToProcess, 0));
            }
        }
    
        global void finish(Database.BatchableContext bc) {
            System.debug('Batch job finished.');
            // Any post-processing or cleanup can be done here
        }
    }
    