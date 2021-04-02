document.addEventListener('DOMContentLoaded', () => {
    require(
        [
            "esri/config",
            "esri/Map",
            "esri/views/MapView"
        ], function (
            esriConfig,
            Map,
            MapView
        ) {
            const map = new Map({
                basemap: "osm"
            });

            const view = new MapView({
                map: map,
                center: [56, 54.75], // Longitude, latitude
                zoom: 13, // Zoom level
                container: "map"
            })
        });
});