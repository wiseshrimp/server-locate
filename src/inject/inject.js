chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval)

		// ----------------------------------------------------------
		// This part of the script triggers when page is done loading
		// alert("hello!!!!!!")
		// ----------------------------------------------------------

		// Check performance support
		if (performance === undefined) {
			console.log("performance NOT supported")
			return
		}
	
		// Get a list of "resource" performance entries
		let resources = performance.getEntriesByType("resource")
		if (resources === undefined || resources.length <= 0) {
			console.log("there are NO `resource` performance records")
			return
		}
	
		for (let i = 0; i < resources.length; i++) {
			console.log(resources[i].name) // these are urls of requests
		}
	}
	}, 10)
})