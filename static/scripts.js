mapboxgl.accessToken = 'pk.eyJ1IjoiY2hyaXNsa2VsbGVyIiwiYSI6IkRIakY5bnMifQ.t9zuuBCI4gHbWSnJy6H57w';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-105.991761, 34.619547],
    zoom: 5.5
});

var geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl
});

document.getElementById('geocoder').appendChild(geocoder.onAdd(map));

map.addControl(new mapboxgl.NavigationControl());

map.on('load', function () {
    map.addSource("schools", {
        "type": "geojson",
        "data": "./data/features.geojson"
    });

    map.addLayer({
        "id": "schools",
        "interactive": true,
        "type": "circle",
        "source": "schools",
        "paint": {
            "circle-radius": 5,
            "circle-color": "#2A3478"
        },
        "filter": ["==", "grab_and_go_meals", "TRUE"]
    });
});

map.on('click', 'schools', function(e) {
    var coordinates = e.features[0].geometry.coordinates.slice();

    var md = e.features[0].properties;

    var description = md.school_name + ' is located at ' + md.school_address + ' in ' + md.City;
    if (md.meals.length){
        description += ' <br /><br /> Offering: ' + md.meals;
    }
    if (md.notes.length){
        description += ' <br /><br /> Notes: ' + md.notes;
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
