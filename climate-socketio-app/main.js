window.onload = function () {
    var socket = io();
    var monitor = {};

    monitor.thermometer = new JustGage({
        id: "thermometer",
        value: 10,
        min: 0,
        max: 100,
        title: "Thermometer",
        label: "° Celsius",
        relativeGaugeSize: true,
    });

    monitor.hygrometer = new JustGage({
        id: "hygrometer",
        value: 10,
        min: 0,
        max: 100,
        title: "Hygrometer",
        label: "Humidity %",
        relativeGaugeSize: true,
    });

    var displays = Object.keys(monitor);

    socket.on("report", function (data) {
        displays.forEach(function (display) {
            monitor[display].refresh(data[display]);
        });
    });
};