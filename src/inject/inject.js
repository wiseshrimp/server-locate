let userCoords = {
	lat: 0,
	long: 0
}

let map
let MAPBOX_TOKEN = 

// Get user geolocation
function successCallback (data) {
	userCoords.lat = data.coords.latitude
	userCoords.long = data.coords.longitude
	getDirections()

}

function errorCallback (err) {
	console.log(err)
}

(function getUserLocation() {
	navigator.geolocation.getCurrentPosition(successCallback, errorCallback, {
		maximumAge: Infinity
	})
})();


// MapboxGL map
(function createMap() {
	let mapEl = document.createElement('div')
	mapEl.id = 'serverMap'
	document.body.appendChild(mapEl)

	mapboxgl.accessToken = MAPBOX_TOKEN
	map = new mapboxgl.Map({
		container: 'serverMap', // container id
		style: 'mapbox://styles/wiseshrimp/cjhv5jyh409l62rmzwvwckjzl', // style URL
		center: [-97.317, 38.105], // starting position [lng, lat]
		zoom: 4.58 // starting zoom
	})
})();

let getDirections = () => {
	if (userCoords.lat && userCoords.long) {
		let url = `https://api.mapbox.com/directions/v5/mapbox/driving/${userCoords.long},${userCoords.lat};-122.486052,37.830348?access_token=${MAPBOX_TOKEN}`
		$.get(url, data => {
			if (data.routes.length) {
				let coords = polyline.toGeoJSON(data.routes[0].geometry)

				map.addSource('route', {
					'type': 'geojson',
					'data': {
						'type': 'Feature',
						'properties': {},
						'geometry': {
							'type': 'LineString',
							'coordinates': coords.coordinates
						}
					}
				})
			} else {
				map.addSource('route', {
					'type': 'geojson',
					'data': {
						'type': 'Feature',
						'properties': {},
						'geometry': {
							'type': 'LineString',
							'coordinates': [] // Add coords from urls
						}
					}
				})
			}
			map.addLayer({
				'id': 'route',
				'type': 'line',
				'source': 'route',
				'layout': {
					'line-join': 'round',
					'line-cap': 'round'
				},
				'paint': {
					'line-color': '#FE4473',
					'line-width': 5
				}
			})
		})
	}
}

chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval)

		// ----------------------------------------------------------
		// This part of the script triggers when page is done loading
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
			// console.log(resources[i].name) // these are urls of requests
		}
	}
	}, 10)
})