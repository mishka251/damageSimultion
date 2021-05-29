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

            const graphics = [
                new Graphic({
                    geometry: new Point({
                        latitude: 54.7,
                        longitude: 56,
                    }),
                    attributes: {
                        OBJECTID: 1,
                    }
                }),
                new Graphic({
                    geometry: new Point({
                        latitude: 54.8,
                        longitude: 56,
                    }),
                    attributes: {
                        OBJECTID: 2,
                    }
                }),
            ];

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