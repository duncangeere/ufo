// Objects to store ISS and user data
let issData = {};
let userData = {};
let permissionGranted = false;
const apiUrl = 'https://api.wheretheiss.at/v1/satellites/25544';

// Get permissions for geolocation and MIDI access
function permissionRequest() {
    let geolocationGranted = false;
    let midiGranted = false;

    function checkAndContinue() {
        if (geolocationGranted && midiGranted) {
            permissionGranted = true;
            document.getElementById('permissions').style.display = 'none';
            fetchISSData();
            setInterval(fetchISSData, 5000);
        }
    }

    // Request geolocation
    function requestGeolocation() {
        if (navigator.permissions) {
            navigator.permissions.query({ name: 'geolocation' })
                .then(function(permissionStatus) {
                    if (permissionStatus.state === 'granted' || permissionStatus.state === 'prompt') {
                        console.log("Geolocation permission granted.");
                        geolocationGranted = true;
                        requestMIDI();
                    } else {
                        console.log("Geolocation permission denied.");
                    }
                })
                .catch(function(error) {
                    console.error('Geolocation permission error:', error);
                });
        } else {
            console.log("Permissions API not supported by this browser.");
        }
    }

    // Request MIDI
    function requestMIDI() {
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess()
                .then(function(midiAccess) {
                    console.log('MIDI Access granted:', midiAccess);
                    WebMidi
                        .enable()
                        .then(() => {
                            console.log("WebMidi enabled!")
                            console.log("MIDI Inputs:");
                            WebMidi.inputs.forEach(input => console.log(input.manufacturer, input.name));
                            console.log("MIDI Outputs:");
                            WebMidi.outputs.forEach(output => console.log(output.manufacturer, output.name));
                        }).catch(err => alert(err));
                    midiGranted = true;
                    checkAndContinue();
                })
                .catch(function(error) {
                    console.error('MIDI Access request error:', error);
                });
        } else {
            console.log("MIDI Access API not supported by this browser.");
        }
    }

    // Start the permission request process
    requestGeolocation();
}

// Access the "Where the ISS At?" API
async function fetchISSData() {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        } else {
            //console.log("ISS data fetched successfully.");
            issData = await response.json();
            displayISSData(issData);
            getUserLocation();
        }
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }

    // Show ISS data
    function displayISSData(issData) {
        const issElement = document.getElementById('iss-data');
        issElement.innerHTML = `
            <h2>Current Location of the ISS</h2>
            <p><strong>Latitude:</strong> ${issData.latitude.toFixed(2)}</p>
            <p><strong>Longitude:</strong> ${issData.longitude.toFixed(2)}</p>
            <p><strong>Altitude:</strong> ${issData.altitude.toFixed(2)} km</p>
            <p><strong>Velocity:</strong> ${issData.velocity.toFixed(2)} km/h</p>
        `;
        issElement.style.display = 'block';
    }
}

// Get user lat/lon coordinates
function getUserLocation() {

    // Check if geolocation is supported and request permission
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        console.log("Geolocation is not supported by this browser.");
    }

    // Show user's position
    function showPosition(position) {
        userData["latitude"] = position.coords.latitude;
        userData["longitude"] = position.coords.longitude;
        const userLocationElement = document.getElementById('user-data');
        userLocationElement.innerHTML = `
            <h2>Your Location</h2>
            <p><strong>Latitude:</strong> ${userData.latitude.toFixed(2)}</p>
            <p><strong>Longitude:</strong> ${userData.longitude.toFixed(2)}</p>
            <p><strong>Distance to ISS:</strong> 
                <span id="distance">${calculateDistance(issData.latitude, issData.longitude, userData.latitude, userData.longitude).toFixed(2)}</span> km
            </p>
        `;
        userLocationElement.style.display = 'block';
    }

    // Show error if geolocation fails
    function showError(error) {
        switch(error.code) {
            case error.PERMISSION_DENIED:
                console.error("User denied the request for Geolocation.");
                break;
            case error.POSITION_UNAVAILABLE:
                console.error("Location information is unavailable.");
                break;
            case error.TIMEOUT:
                console.error("The request to get user location timed out.");
                break;
            case error.UNKNOWN_ERROR:
                console.error("An unknown error occurred.");
                break;
        }
    }

    // Calculate distance between ISS and user location
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the Earth in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    }
}

// Access MIDI devices and play a sound
function playSound() {
    // Play a note on the first output
    if (WebMidi.outputs.length > 0) {
        let output = WebMidi.outputs[0];
        let channel = output.channels[1];
        console.log("Playing note C4 on output:", output.name);
        channel.playNote("C4", {duration: 1000});
    } else {
        console.log("No MIDI outputs available.");
    }
}