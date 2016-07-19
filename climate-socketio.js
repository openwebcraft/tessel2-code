var http = require("http");
var os = require("os");
var path = require("path");

var five = require("johnny-five");
var tessel = require("tessel");
var Tessel = require("tessel-io");
var TesselClimate = require('climate-si7005');
var board = new five.Board({
    io: new Tessel()
});

var Express = require("express");
var SocketIO = require("socket.io");

var application = new Express();
var server = new http.Server(application);
var io = new SocketIO(server);

application.use(Express.static(path.join(__dirname, "/climate-socketio-app")));
application.use("/vendor", Express.static(__dirname + "/node_modules/"));

board.on("ready", () => {

    var clients = new Set();

    // Connect to Tessel 2's climate sensor.
    var climateSensor = TesselClimate.use(tessel.port['A']);

    climateSensor.on('ready', function () {
        console.log('Successfully connected to si7005 module');

        // Loop forever
        setImmediate(function loop () {
            // read temperature data
            climateSensor.readTemperature('c', function (err, temp) {
                if (err) {
                    console.error('Error reading temperature data', err);
                };
                // read humidity data
                climateSensor.readHumidity(function (err, humid) {
                    if (err) {
                        console.error('Error reading humidity data', err);
                    };
                    var sdata = {
                        thermometer: Math.round(temp),
                        hygrometer: Math.round(humid)
                    };
                    // console.log('sdata', sdata);
                    clients.forEach(recipient => {
                        recipient.emit("report", sdata);
                    });
                    setTimeout(loop, 500); // The sensor readings will happen every .5 seconds
                });
            });
        });
    });

    climateSensor.on('error', function (err) {
        console.error('Error connecting to si7005 module', err);
    });

    io.on("connection", socket => {
        // Allow up to 5 monitor sockets to
        // connect to this enviro-monitor server
        if (clients.size < 5) {
            clients.add(socket);
            // When the socket disconnects, remove
            // it from the recipient set.
            socket.on("disconnect", () => clients.delete(socket));
        }
    });

    var port = 80;
    server.listen(port, () => {
        console.log(`Web Server is listening on http://${os.networkInterfaces().wlan0[0].address}:${port}`);
    });

    process.on("SIGINT", () => {
        server.close();
    });

});