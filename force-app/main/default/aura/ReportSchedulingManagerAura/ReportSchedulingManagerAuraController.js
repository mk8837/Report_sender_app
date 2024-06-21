({
    openModal: function(component, event, helper) {
        $A.createComponents([
            ["c:reportSchedulingManager", { "recordId": component.get("v.recordId") }]
        ],
        function(components, status) {
            if (status === "SUCCESS") {
                var modalPromise = component.find('overlayLib').showCustomModal({
                    header: "Report Settings",
                    body: components[0],
                    showCloseButton: true,
                    cssClass: "slds-modal_large",
                    closeCallback: function() {
                        helper.navigateToRecentList();
                    }
                });
            }
        });
    }
})