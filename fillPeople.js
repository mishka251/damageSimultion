document.addEventListener('DOMContentLoaded', () => {
    require(
        [
            "esri/config",
            "esri/Map",
            "esri/views/MapView",
            "esri/views/SceneView",
            "esri/PopupTemplate",
            "esri/widgets/Popup",
            "esri/geometry/Circle",
            "esri/geometry/Point",
            "esri/layers/GraphicsLayer",
            "esri/Graphic",
            "esri/symbols/SimpleFillSymbol",
            "esri/layers/FeatureLayer",
            "esri/symbols/PictureMarkerSymbol",
            "esri/widgets/Editor",
        ], function (
            esriConfig,
            Map,
            MapView,
            SceneView,
            PopupTemplate,
            Popup,
            Circle,
            Point,
            GraphicsLayer,
            Graphic,
            SimpleFillSymbol,
            FeatureLayer,
            PictureMarkerSymbol,
            Editor
        ) {

            const coords = [{"latitude": 54.7, "longitude": 56}, {
                "latitude": 54.8,
                "longitude": 56
            }, {"latitude": 54.7370192864625, "longitude": 55.985752105711974}, {
                "latitude": 54.747126765464465,
                "longitude": 56.00720977783108
            }, {"latitude": 54.743163348817376, "longitude": 55.98952865600493}];
            const graphics = coords.map((coord, i) => new Graphic({
                geometry: new Point(coord),
                attributes: {
                    OBJECTID: i,
                }
            }));

            const peoplesLayer = new FeatureLayer({
                source: graphics,  // array of graphics objects
                objectIdField: "OBJECTID",
                fields: [{
                    name: "OBJECTID",
                    type: "oid"
                }],
                renderer: {  // overrides the layer's default renderer
                    type: "simple",
                    symbol: new PictureMarkerSymbol({
                        url: 'human.png',
                        width: '20px',
                        height: '20px',
                    })
                }
            });

            const map = new Map({
                basemap: "osm"
            });

            map.add(peoplesLayer);

            const view = new MapView({
                map: map,
                center: [56, 54.75], // Longitude, latitude
                zoom: 13, // Zoom level
                container: "map",
            });

            // At the very minimum, set the Editor's view
            const editor = new Editor({
                view: view
            });

            view.ui.add(editor, "top-right");
            view.on('click', async (e) => {
                const query = peoplesLayer.createQuery();
                query.returnGeometry = true;
                const response = await peoplesLayer.queryFeatures(query);
                const geometryes = response.features.map((feature) => feature.geometry);
                const coords = geometryes.map((geometry) => {
                    return {
                        latitude: geometry.y,
                        longitude: geometry.x,
                    };
                });
                console.log(JSON.stringify(coords));
            });
        });
});