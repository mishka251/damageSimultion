function calculateRBreaks() {
    const pressureBreaks = [
        100,
        70,
        28,
        14,
        2
    ];

    //R<=6.2
    function pressureForRadius1(r) {
        return 700 / (3 * (Math.sqrt(1 + r ** 3) - 1))
    }

    //R>6.2
    function pressureForRadius2(r) {
        return 70 / (r * Math.sqrt(Math.log10(r) - 0.332))
    }

    function pressureForRadius(r) {
        if (r <= 6.2) {
            return pressureForRadius1(r);
        } else {
            return pressureForRadius2(r);
        }
    }

    function binarySearch(min, max, target, eps, func) {
        const mid = (min + max) / 2;
        if (max - min < eps) {
            return mid;
        }
        const val = func(mid);
        if (Math.abs(val - target) < eps) {
            return mid;
        }
        const minVal = func(min);
        const maxVal = func(max);
        if (minVal < maxVal) {//возрастающая функция
            if (val < target) {
                return binarySearch(mid, max, target, eps, func);
            } else {
                return binarySearch(min, mid, target, eps, func);
            }
        } else {
            //убывающая
            if (val < target) {
                return binarySearch(min, mid, target, eps, func);
            } else {
                return binarySearch(mid, max, target, eps, func);
            }
        }
    }

    //bsearch in pressForRad
    const minR = 0;
    const maxR = 10000;
    const eps = 1e-4;

    return pressureBreaks.map((pressure) => {
        return binarySearch(minR, maxR, pressure, eps, pressureForRadius);
    });
}

function calculateRadiusBreaks(n, q, k) {
    const rBreaks = calculateRBreaks();

    //радиус по приведенному радиусу - обратный расчет
    function radiusForR(r) {
        return r * Math.pow(2 * n * q * k, 1 / 3);
    }

    return rBreaks.map(radiusForR);
}

function calculate(data) {
    return calculateRadiusBreaks(data.surface, data.mass, data.type);
}

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
        ) {
            const coords = [{"latitude":54.7,"longitude":56},{"latitude":54.8,"longitude":56},{"latitude":54.746433195550374,"longitude":55.9907302856436}];
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

            const graphicLayer = new GraphicsLayer();
            map.add(graphicLayer);

            const popupTemplate = document.getElementById('modal-form-template');
            const popupContent = popupTemplate.innerHTML;

            async function showZones(lat, lon, rads) {
                graphicLayer.removeAll();
                const circles = rads.map((rad) => {
                    return new Circle({
                        center: new Point({
                            latitude: lat,
                            longitude: lon
                        }),
                        radius: rad,
                        radiusUnit: "meters",
                        hasM: false,
                        hasZ: false,
                    });
                });
                const colors = [
                    [255, 0, 0],
                    [255, 0, 0, 0.8],
                    [200, 100, 100, 0.6],
                    [255, 255, 0, 0.5],
                    [100, 200, 0, 0.4],
                ];
                const zonesLabels = [
                    'Зона 1',
                    'Зона 2',
                    'Зона 3',
                    'Зона 4',
                    'Зона 5',
                ];
                const peoplesInZone = [];
                for (let i = 0; i < 5; i++) {
                    const query = peoplesLayer.createQuery();
                    query.geometry = new Point({
                        latitude: lat,
                        longitude: lon
                    });  // the point location of the pointer
                    query.distance = rads[i];
                    query.units = "meters";
                    query.spatialRelationship = "intersects";  // this is the default
                    query.returnGeometry = true;
                    const response = await peoplesLayer.queryFeatures(query);
                    let count = response.features.length;
                    console.log(i, count);
                    for (let j = 0; j < i; j++) {
                        count -= peoplesInZone[j];
                    }
                    peoplesInZone[i] = count;
                }

                console.log(peoplesInZone);
                const graphics = circles.map((circle, i) => {
                    return new Graphic({
                        geometry: circle,
                        attributes: {
                            label: zonesLabels[i],
                            people: peoplesInZone[i],
                            // OBJECTID: i,
                        },
                        popupTemplate: {
                            title: "{label}",
                            content: [{
                                // Pass in the fields to display
                                type: "fields",
                                fieldInfos: [{
                                    fieldName: "label",
                                    label: "Зона"
                                }, {
                                    fieldName: "people",
                                    label: "Пострадавших людей"
                                }]
                            }]
                        },
                        symbol: new SimpleFillSymbol({
                            color: colors[i],
                            style: "solid",
                            outline: {  // autocasts as new SimpleLineSymbol()
                                color: "white",
                                width: 1
                            }
                        }) // set symbol here
                    });
                });
                graphicLayer.addMany(graphics);
            }

            function onCalculateClick(lat, lon, e) {
                console.log(e);
                e.preventDefault();
                const f_data = new FormData(e.target);
                // console.log(data);
                const data = {};
                f_data.forEach((val, key) => data[key] = val);
                console.log(data);
                const rads = calculate(data);
                console.log(rads);
                showZones(data.lat, data.lon, rads);
            }

            function setContentInfo(lat, lon) {
                const popupDiv = document.createElement("div");
                popupDiv.classList.add("mapView");

                popupDiv.innerHTML = popupContent;
                const latInput = popupDiv.getElementsByClassName('lat')[0];
                latInput.value = lat;

                const lonInput = popupDiv.getElementsByClassName('lon')[0];
                lonInput.value = lon;

                const form = popupDiv.getElementsByTagName('form')[0];
                console.log(form);
                form.addEventListener('submit', (e) => onCalculateClick(lat, lon, e));
                // coordsSpan[0].innerText = `${lat} ${lon}`;
                return popupDiv;
            }

            view.on('click', (event) => {
                // Search for graphics at the clicked location
                view.hitTest(event).then(function (response) {
                    if (response.results.length) {
                        const circleClicked = response.results.some(function (result) {
                            // check if the graphic belongs to the layer of interest
                            return result.graphic.layer === graphicLayer;
                        });
                        // do something with the result graphic
                        if (circleClicked) {
                            view.popup.autoOpenEnabled = true;
                            return;
                        }
                    }
                    view.popup.autoOpenEnabled = false;

                    // Get the coordinates of the click on the view
                    const lat = event.mapPoint.latitude;
                    const lon = event.mapPoint.longitude;

                    view.popup.open({
                        // Set the popup's title to the coordinates of the location
                        title: "Координаты " + lon + ", " + lat + "",
                        location: event.mapPoint, // Set the location of the popup to the clicked location
                        content: setContentInfo(lat, lon)
                    });
                });
            });
        })
    ;
})
;