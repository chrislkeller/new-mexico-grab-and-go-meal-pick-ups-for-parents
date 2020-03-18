var app = app || {};

mapboxgl.accessToken = 'pk.eyJ1IjoiY2hyaXNsa2VsbGVyIiwiYSI6IkRIakY5bnMifQ.t9zuuBCI4gHbWSnJy6H57w';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-105.991761, 34.619547],
    zoom: 5.5
});

var geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,

    countries: 'us',

    // limit results to the geographic bounds of new mexico
    bbox: [-109.050173, 31.332301, -103.001964, 37.000232],

    // apply a client side filter to further limit results

    filter: function(item) {
    // returns true if item contains New South Wales region
        return item.context
            .map(function(i) {
                return (
                    i.id.split('.').shift() === 'region' &&
                    i.text === 'New Mexico'
                );
            })
            .reduce(function(acc, cur) {
                return acc || cur;
            });
    },
});

document.getElementById('geocoder').appendChild(geocoder.onAdd(map));

map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

map.on('load', function () {
    map.addSource("schools", {
        "type": "geojson",
        "data": "./data/nm-public_schools-meals-features.geojson"
    });

    map.addLayer({
        "id": "schools",
        "interactive": true,
        "type": "circle",
        "source": "schools",
        "paint": {
            "circle-radius": 7,
            "circle-color": "#2A3478"
        },
        "filter": ["==", "grab_and_go_meals", "TRUE"]
    });

    locateButton(map);
});

function locateButton(map) {
    var locateBtn = document.querySelector('.locate-btn');
    locateBtn.disabled = false;
    locateBtn.addEventListener('click', function() {
        if ("geolocation" in navigator) { 
            navigator.geolocation.getCurrentPosition(function (position) { 
                var point = [position.coords.longitude, position.coords.latitude];
                var grabAndGo = map.querySourceFeatures('schools').filter((obj) => {
                    return obj.properties.grab_and_go_meals == "TRUE";
                })
                var nearest = turf.nearestPoint(point, {"type": "FeatureCollection","features": grabAndGo});
                map.flyTo({center:nearest.geometry.coordinates, zoom: 15});
            }); 
        } else {
            locateBtn.classList.add('d-none');
        }     
    })
}



map.on('click', 'schools', function(e) {
    var coordinates = e.features[0].geometry.coordinates.slice();

    var md = e.features[0].properties;

    var description = '';

    if (md.school_name.length){
        description += md.school_name + ', located at ' +
        md.school_address + ', in ' + md.city + '<br />';
    } else {
        description += md.district + ' in ' + md.city + '<br />';
    }

    if (md.dates.length){
        description += '<br />Date(s): ' + md.dates;
    }

    if (md.hours.length){
        description += '<br />Hours: ' + md.hours;
    }

    if (md.offering.length){
        description += '<br />Details: ' + md.offering;
    }
    if (md.link.length){
        description += '<br /><a href=' + md.link + ' target=\'blank\'>More information</a>';
    }

    // ensure that if the map is zoomed out such that multiple
    // copies of the feature are visible, the popup appears
    // over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(description)
        .addTo(map);
});

// indicate that the markers are clickable
map.on('mouseenter', 'schools', function() {
    map.getCanvas().style.cursor = 'pointer';
});

// change it back to a pointer when it leaves.
map.on('mouseleave', 'schools', function() {
    map.getCanvas().style.cursor = '';
});
