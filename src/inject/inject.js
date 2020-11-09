let userCoords = {
	lat: 0,
	long: 0
}

let map
let MAPBOX_TOKEN = ''
let IPSTACK_KEY = ''

// Get user geolocation
function successCallback (data) {
	userCoords.lat = data.coords.latitude
	userCoords.long = data.coords.longitude
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

let getDirections = (destination, name) => {
	if (userCoords.lat && userCoords.long) {
		let url = `https://api.mapbox.com/directions/v5/mapbox/driving/${userCoords.long},${userCoords.lat};${destination.long},${destination.lat}?access_token=${MAPBOX_TOKEN}`
		console.log(url)
		$.get(url, data => {
			const routeID = `route-${name}`
			const endpointsID = `endpoints-${name}`

			// add route if queried, straight line otherwise
			if (data.routes.length) {
				let coords = polyline.toGeoJSON(data.routes[0].geometry)

				map.addSource(routeID, {
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
				map.addSource(routeID, {
					'type': 'geojson',
					'data': {
						'type': 'Feature',
						'properties': {},
						'geometry': {
							'type': 'LineString',
							'coordinates': [[userCoords.long, userCoords.lat], [destination.long, destination.lat]]
						}
					}
				})
			}

			// add start and end points
			map.addSource(endpointsID, {
				type: 'geojson',

				'data': {
					'type': 'FeatureCollection',
					'features': [{
						'type': 'Feature',
						'properties': {},
						'geometry': {
							'type': 'Point',
							'coordinates': [userCoords.long, userCoords.lat]
						}
					},
					{
						'type': 'Feature',
						'properties': {},
						'geometry': {
							'type': 'Point',
							'coordinates': [destination.long, destination.lat]
						}
					}]
				}
			})

			map.addLayer({
				'id': routeID,
				'type': 'line',
				'source': routeID,
				'layout': {
					'line-join': 'round',
					'line-cap': 'round'
				},
				'paint': {
					'line-color': '#FE4473',
					'line-width': 5,
				}
			})

			map.addLayer({
				'id': endpointsID,
				'type': 'circle',
				'source': endpointsID,
				'paint': {
					'circle-radius': 10,
					'circle-color': '#B42222'
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

		let domains = {}
		for (let i = 0; i < resources.length; i++) {
			// console.log(resources[i].name) // these are urls of requests
			let domain = (new URL(resources[i].name)).hostname
			if (domains[domain]) domains[domain]++
			else domains[domain] = 1
		}

		// let mainDomain = Object.keys(domains).reduce((a, b) => domains[a] > domains[b] ? a : b)
		// console.log(mainDomain)
		for (let domain in domains) {
			fetch(`https://api.ipstack.com/${domain}?access_key=${IPSTACK_KEY}`)
				.then(response => response.json())
				.then(data => {
					console.log(data)
					getDirections({ long: data.longitude, lat: data.latitude }, `-${domain}`)
				})
		}
	}
	}, 10)
})