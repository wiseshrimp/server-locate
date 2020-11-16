let userCoords = {
	lat: 0,
	long: 0
}

let endpoints = []

let map
let totalDistance = 0
let canvas, ctx, isCapturing = true, isImgLoaded, isImg2Loaded, downloadLink
let stream
let mousePosition = []
let cursorImg = new Image()
let pointerImg = new Image()
let canvasRecorder

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

function getRandomColor() {
	var hue = Math.floor(Math.random() * 360)
	return 'hsl(' + hue + ', 100%, 80%)'
}

(function createCanvas() {
	downloadLink = document.createElement('a')
	downloadLink.id = "download-link"
	downloadLink.innerText = "download cursor"
	document.body.appendChild(downloadLink)
	canvas = document.createElement('canvas')
	canvasRecorder = new CanvasRecorder(canvas)

	canvas.id = 'mouse'
	canvas.width = window.innerWidth
	canvas.height = window.innerHeight
	ctx = canvas.getContext('2d')
	cursorImg.onload = () => {
		isImgLoaded = true
	}
	cursorImg.src = chrome.extension.getURL('src/inject/cursor.png')
	pointerImg.onload = () => {
		isImg2Loaded = true
	}
	pointerImg.src = chrome.extension.getURL('src/inject/pointer.png')
})();

(function attachListeners() {
	if (isCapturing) {
		document.addEventListener('mousemove', onMouseMove)
		document.addEventListener('mousedown', onMouseDown)
	}
})();

function onMouseMove (ev) {
	mousePosition.push({
		x: ev.clientX,
		y: ev.clientY,
		isMouseDown: false
	})
}

function onMouseDown (ev) {
	for (let idx = 0; idx < 8; idx++) {
		mousePosition.push({
			x: ev.clientX,
			y: ev.clientY,
			isMouseDown: true,
			radius: idx * 5
		})
	}
}

function CanvasRecorder(canvas, video_bits_per_sec) {
    this.start = startRecording;
    this.stop = stopRecording;
    this.save = download;

    var recordedBlobs = [];
    var supportedType = null;
    var mediaRecorder = null;

    var stream = canvas.captureStream();
    if (typeof stream == undefined || !stream) {
        return;
    }

    const video = document.createElement('video');
    video.style.display = 'none';

    function startRecording() {
        // let types = [
        //     "video/webm",
        //     // 'video/webm,codecs=vp9',
        //     // 'video/vp8',
        //     // "video/webm\;codecs=vp8",
        //     // "video/webm\;codecs=daala",
        //     // "video/webm\;codecs=h264",
        //     // "video/mpeg"
        // ];

        // for (let i in types) {
        //     if (MediaRecorder.isTypeSupported(types[i])) {
        //         supportedType = types[i];
        //         break;
        //     }
        // }
        // if (supportedType == null) {
        //     console.log("No supported type found for MediaRecorder");
        // }
        let options = { 
            mimeType: "video/webm",
            videoBitsPerSecond: video_bits_per_sec || 2500000 // 2.5Mbps
        };

        recordedBlobs = [];
        try {
            mediaRecorder = new MediaRecorder(stream, options);
        } catch (e) {
            alert('MediaRecorder is not supported by this browser.');
            console.error('Exception while creating MediaRecorder:', e);
            return;
        }

        console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
        mediaRecorder.onstop = handleStop;
        mediaRecorder.ondataavailable = handleDataAvailable;
        mediaRecorder.start(100); // collect 100ms of data blobs
        console.log('MediaRecorder started', mediaRecorder);
    }

    function handleDataAvailable(event) {
        if (event.data && event.data.size > 0) {
            recordedBlobs.push(event.data);
        }
    }

    function handleStop(event) {
        console.log('Recorder stopped: ', event);
        const superBuffer = new Blob(recordedBlobs, { type: supportedType });
        video.src = window.URL.createObjectURL(superBuffer);
    }

    function stopRecording() {
        mediaRecorder.stop();
        console.log('Recorded Blobs: ', recordedBlobs);
        video.controls = true;
    }

    function download(file_name) {
        const name = file_name || 'recording.webm';
        const blob = new Blob(recordedBlobs, { type: supportedType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    }
}

setTimeout(renderVideo, 5000)

function renderVideo() {
	document.body.appendChild(canvas)
	isCapturing = false
	canvasRecorder.start()
	setInterval(draw, 20)
}

let idx = 0
let isRecording = true

function draw() {
	if (!isRecording) return
	if (!mousePosition.length && !isImgLoaded) return
	ctx.clearRect(0, 0, canvas.width, canvas.height)
	let img = mousePosition[idx].isMouseDown ? pointerImg : cursorImg
	if (mousePosition[idx].isMouseDown) {
		ctx.beginPath()
		ctx.fillStyle = 'rgba(224, 183, 220, 0.5)'
		ctx.arc(mousePosition[idx].x, mousePosition[idx].y, mousePosition[idx].radius, 0, 2 * Math.PI)
		ctx.fill()
	}
	ctx.drawImage(img, mousePosition[idx].x, mousePosition[idx].y, 25, 25)
	if (idx === mousePosition.length - 1 && isRecording) {
		canvasRecorder.stop()
		canvasRecorder.save()
		isRecording = false
	}
	// var image = canvas.toDataURL("image/png")
	// downloadLink.href = image
	// downloadLink.download = `hello${idx}`
	// downloadLink.click()
	idx++
}

// MapboxGL map
(function createMap() {
	// let mapEl = document.createElement('div')
	// mapEl.id = 'serverMap'
	// document.body.appendChild(mapEl)
	// let distanceEl = document.createElement('div')
	// distanceEl.id = 'distanceRoutes'
	// let distanceTextEl = document.createElement('div')
	// distanceTextEl.innerText = "Total Distance: "
	// let distanceNumberEl = document.createElement('div')
	// distanceNumberEl.id = "distanceNum"
	// distanceNumberEl.innerText = "0"
	// let milesEl = document.createElement('div')
	// milesEl.innerText = " miles"
	// distanceEl.appendChild(distanceTextEl)
	// distanceEl.appendChild(distanceNumberEl)
	// distanceEl.appendChild(milesEl)
	// document.body.appendChild(distanceEl)

	// mapboxgl.accessToken = MAPBOX_TOKEN
	// map = new mapboxgl.Map({
	// 	container: 'serverMap', // container id
	// 	style: 'mapbox://styles/wiseshrimp/cjhv5jyh409l62rmzwvwckjzl', // style URL
	// 	center: [-97.317, 38.105], // starting position [lng, lat]
	// 	zoom: 4.58 // starting zoom
	// })

	// map.on('load', () => {
	// 	map.loadImage(chrome.extension.getURL('src/inject/cloud.png'), (err, image) => {
	// 		if (err) throw err
	// 		map.addImage('cloud', image)
	// 	})
	// 	map.loadImage(chrome.extension.getURL('src/inject/home.png'), (err, image) => {
	// 		if (err) throw err
	// 		map.addImage('home', image)
	// 	})
	// })
})();


// let getTestDirections = (destination, idx) => {

// 	map.addSource(`points-${idx}`, {
// 		'type': 'geojson',
// 		'data': {
// 			'type': 'Feature',
// 			'properties': {},
// 			'geometry': {
// 				'type': 'LineString',
// 				'coordinates': destination
// 			}
// 		}
// 	})
// 	map.addLayer({
// 		'id': `points-${idx}`,
// 		'type': 'line',
// 		'source': `points-${idx}`,
// 		'layout': {
// 			'line-join': 'round',
// 			'line-cap': 'round'
// 		},
// 		'paint': {
// 			'line-color': `${getRandomColor()}`,
// 			'line-width': 4,
// 		}
// 	})
// 	if (idx === 0) {
// 		map.addLayer({
// 			'id': `home-${idx}`,
// 			'type': 'symbol',
// 			'source': `points-${idx}`,
// 			'layout': {
// 				"icon-image": "home",
// 				"icon-size": 0.2
// 			  }
// 		})
// 	}
// }

// let getDirections = (destination, name) => {
// 	if (userCoords.lat && userCoords.long) {
// 		let url = `https://api.mapbox.com/directions/v5/mapbox/driving/${userCoords.long},${userCoords.lat};${destination.long},${destination.lat}?access_token=${MAPBOX_TOKEN}`
// 		$.get(url, data => {
// 			const routeID = `route-${name}`
// 			const endpointsID = `endpoints-${name}`

// 			// add route if queried, straight line otherwise
// 			if (data.routes.length) {
// 				let coords = polyline.toGeoJSON(data.routes[0].geometry)
// 				let dist = Number(document.getElementById('distanceNum').innerText) + data.routes[0].distance
// 				document.getElementById('distanceNum').innerText = dist

// 				map.addSource(routeID, {
// 					'type': 'geojson',
// 					'data': {
// 						'type': 'Feature',
// 						'properties': {},
// 						'geometry': {
// 							'type': 'LineString',
// 							'coordinates': coords.coordinates
// 						}
// 					}
// 				})
// 			} else {
// 				// let options = {
// 				// 	units: 'miles'
// 				// }
// 				// let to = turf.point([destination.lat, destination.long])
// 				// let from = turf.point([userCoords.lat, userCoords.long])
// 				// let currentDist = turf.distance(from, to, options, (d, s) => {
// 				// 	console.log(d, s)
// 				// 	console.log(currentDist)

// 				// })
// 				// let dist = Number(document.getElementById('distanceNum').innerText)
// 				// document.getElementById('distanceNum').innerText = dist + currentDist.toFixed([2])
// 				map.addSource(routeID, {
// 					'type': 'geojson',
// 					'data': {
// 						'type': 'Feature',
// 						'properties': {},
// 						'geometry': {
// 							'type': 'LineString',
// 							'coordinates': [[userCoords.long, userCoords.lat], [destination.long, destination.lat]]
// 						}
// 					}
// 				})
// 			}

// 			// add start and end points
// 			map.addSource(`home-${endpointsID}`, {
// 				type: 'geojson',

// 				'data': {
// 					'type': 'FeatureCollection',
// 					'features': [{
// 						'type': 'Feature',
// 						'properties': {},
// 						'geometry': {
// 							'type': 'Point',
// 							'coordinates': [userCoords.long, userCoords.lat]
// 						}
// 					}]
// 				}
// 			})
// 			map.addSource(`cloud-${endpointsID}`, {
// 				type: 'geojson',

// 				'data': {
// 					'type': 'FeatureCollection',
// 					'features': [				{
// 						'type': 'Feature',
// 						'properties': {},
// 						'geometry': {
// 							'type': 'Point',
// 							'coordinates': [destination.long, destination.lat]
// 						}
// 					}]
// 				}
// 			})

// 			map.addLayer({
// 				'id': routeID,
// 				'type': 'line',
// 				'source': routeID,
// 				'layout': {
// 					'line-join': 'round',
// 					'line-cap': 'round'
// 				},
// 				'paint': {
// 					'line-color': `${getRandomColor()}`,
// 					'line-width': 4,
// 				}
// 			})

// 			map.addLayer({
// 				'id': `home-${endpointsID}`,
// 				'type': 'symbol',
// 				'source': `home-${endpointsID}`,
// 				'layout': {
// 					"icon-image": "home",
// 					"icon-size": 0.3
// 				  }
// 			})
// 			map.addLayer({
// 				'id': `cloud-${endpointsID}`,
// 				'type': 'symbol',
// 				'source': `cloud-${endpointsID}`,
// 				'layout': {
// 					"icon-image": "cloud",
// 					"icon-size": 0.15
// 				  }
// 			})
// 		})
// 	}
// }

// chrome.extension.sendMessage({}, function(response) {
// 	var readyStateCheckInterval = setInterval(function() {
// 	if (document.readyState === "complete") {
// 		clearInterval(readyStateCheckInterval)

// 		// ----------------------------------------------------------
// 		// This part of the script triggers when page is done loading
// 		// ----------------------------------------------------------

// 		// Check performance support
// 		if (performance === undefined) {
// 			console.log("performance NOT supported")
// 			return
// 		}
	
// 		// Get a list of "resource" performance entries
// 		let resources = performance.getEntriesByType("resource")
// 		if (resources === undefined || resources.length <= 0) {
// 			console.log("there are NO `resource` performance records")
// 			return
// 		}

// 		let domains = {}
// 		for (let i = 0; i < resources.length; i++) {
// 			// console.log(resources[i].name) // these are urls of requests
// 			let domain = (new URL(resources[i].name)).hostname
// 			if (domains[domain]) domains[domain]++
// 			else domains[domain] = 1
// 		}

// 		// let mainDomain = Object.keys(domains).reduce((a, b) => domains[a] > domains[b] ? a : b)
// 		// console.log(mainDomain)

// 		let domainsArr = Object.keys(domains)

// 		domainsArr.forEach((domain, idx) => {
// 			fetch(`https://api.ipstack.com/${domain}?access_key=${IPSTACK_KEY}`)
// 				.then(response => response.json())
// 				.then(data => {
// 					console.log(data)
// 					endpoints.push({
// 						long: data.longitude,
// 						lat: data.latitude
// 					})
// 					if (idx === domainsArr.length - 1) {
// 						endpoints.splice(0, 0, userCoords)
// 						chrome.runtime.sendMessage(endpoints, res => {
// 							console.log(res)
// 						})
// 					}
// 					// getDirections({ long: data.longitude, lat: data.latitude }, `-${domain}`)
// 			})
// 		})
// 		// for (let domain in domains) {
// 		// 	fetch(`https://api.ipstack.com/${domain}?access_key=${IPSTACK_KEY}`)
// 		// 		.then(response => response.json())
// 		// 		.then(data => {
// 		// 			console.log(data)
// 		// 			endpoints.push({
// 		// 				long: data.longitude,
// 		// 				lat: data.latitude
// 		// 			})
// 		// 			// getDirections({ long: data.longitude, lat: data.latitude }, `-${domain}`)
// 		// 		})
// 		// }


// 		// for (let idx = 0; idx < TEST_DATA.length; idx++) {
// 		// 	getTestDirections(TEST_DATA[idx], idx)
// 		// }
// 	}
// 	}, 10)
// })