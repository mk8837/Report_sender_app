({
    navigateToRecentList: function() {
        var navEvt = $A.get("e.force:navigateToURL");
        navEvt.setParams({
            "url": "/lightning/o/Report_Setting_Configuration__c/list?filterName=Recent"
        });
        navEvt.fire();
    }
})