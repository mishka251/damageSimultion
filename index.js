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
            "esri/symbols/SimpleFillSymbol"
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
            SimpleFillSymbol
        ) {
            const map = new Map({
                basemap: "osm"
            });

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

            function showZones(lat, lon, rads) {
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
                const graphics = circles.map((circle, i) => {
                    return new Graphic({
                        geometry: circle,
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
});