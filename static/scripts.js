var app = app || {};

mapboxgl.accessToken = 'pk.eyJ1IjoiY2hyaXNsa2VsbGVyIiwiYSI6IkRIakY5bnMifQ.t9zuuBCI4gHbWSnJy6H57w';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-105.991761, 34.619547],
    zoom: 6
});

var geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    countries: 'us',
    bbox: [-109.050173, 31.332301, -103.001964, 37.000232],

    filter: function(item) {
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

var schools;

document.getElementById('geocoder').appendChild(geocoder.onAdd(map));

map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

map.on('load', function () {
    map.addSource("schools", {
        "type": "geojson",
        "data": {"type": "FeatureCollection",
        "features": []}
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

    fetch("./data/nm-public_schools-meals-features.geojson").then(function(res) {
        return res.json();
    }).then(function(data) {
        schools = data;
        map.getSource('schools').setData(schools);
    });
    locateButton(map);
});

var modal = document.querySelector('.js-modal');
var modalBackground = document.querySelector('.js-modal__background');
var modalBody = document.querySelector('.js-modal__body');

var modalClose = document.querySelector('.js-modal-close-btn').addEventListener('click', function() {
    modal.classList.remove('modal--visible');
    modalBackground.classList.remove('modal__background--visible');
    modalBody.classList.remove('modal__body--visible');
});

var about = document.querySelector('.about').addEventListener('click', function() {
    modal.classList.add('modal--visible');
    modalBackground.classList.add('modal__background--visible');
    modalBody.classList.add('modal__body--visible');
})


var resetZoomBtn = document.querySelector('.js-reset-zoom').addEventListener('click', function() {
    map.flyTo({
        center: [-105.991761, 34.619547],
        zoom: 6,
        essential: true 
    });
});

function locateButton(map) {
    var locateBtn = document.querySelector('.locate-btn');
    locateBtn.disabled = false;
    locateBtn.addEventListener('click', function() {
        if ("geolocation" in navigator) {
            document.body.style.cursor = "wait"
            navigator.geolocation.getCurrentPosition(function (position) {
                var point = [position.coords.longitude, position.coords.latitude];
                var grabAndGo = schools.features.filter((obj) => {
                    return obj.properties.grab_and_go_meals == "TRUE";
                })
                var nearest = turf.nearestPoint(point, {"type": "FeatureCollection","features": grabAndGo});
                selectSchool(nearest);
                document.body.style.cursor = "auto"
            });
        } else {
            locateBtn.classList.add('hidden');
        }
    })
}

function selectSchool(school) {
    map.flyTo({center:school.geometry.coordinates, zoom: 15});
    var infoContainer = document.querySelector('.info-container');
    var description = '';
    var properties = school.properties;
    if (properties.school_name.length){
        description += properties.school_name + ', located at ' +
        properties.school_address + ', in ' + properties.city + '<br />';
    } else {
        description += properties.district + ' in ' + properties.city + '<br />';
    }

    if (properties.dates.length){
        description += '<br />Date(s): ' + properties.dates;
    }

    if (properties.hours.length){
        description += '<br />Hours: ' + properties.hours;
    }

    if (properties.offering.length){
        description += '<br /><br />Details: ' + properties.offering;
    }
    if (properties.link.length){
        description += '<br /><br /><a href=' + properties.link + ' target=\'blank\'>More information</a>';
    }
    infoContainer.innerHTML = description;
}

map.on('click', 'schools', function(e) {
    var selected = e.features[0];
    selectSchool(selected);

});

map.on('mouseenter', 'schools', function() {
    map.getCanvas().style.cursor = 'pointer';
});

map.on('mouseleave', 'schools', function() {
    map.getCanvas().style.cursor = '';
});
