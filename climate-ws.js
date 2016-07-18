/* climate.js */
// this example streams temperature data from
// the climate sensor every 0.5 seconds
var tessel = require('tessel');
var climatelib = require('climate-si7005');
var websocket = require('ws');
var http = require('http');

// Connect to our climate sensor.
var climateSensor = climatelib.use(tessel.port['A']);

var WebSocketServer = websocket.Server
  , wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws) {

  ws.on('open', function open() {
    console.log('websocket connected');
  });

  ws.on('close', function close() {
    console.log('websocket disconnected');
  });

  setInterval(function () {
    // read some temperature data
    climateSensor.readTemperature('c', function(err, tempData) {
      if (err) throw err;
      climateSensor.readHumidity(function(err, humidData) {
          if (err) throw err;
          var sensorData = {
              temperature: { val: tempData.toFixed(2), unit: '°C' },
              humidity: { val: humidData.toFixed(2), unit: '%RH' }
          };
          // console.log('sensorData', sensorData);
          ws.send(JSON.stringify(sensorData), function ack(err) {
              if (err) throw err;
          });
      });
    })
  }, 500); // The sensor readings will happen every .5 seconds
});

var HttpServer = http.createServer(function (request, response) {
  response.writeHead(200, { 'Content-Type': 'text/html' })
  response.end(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Tessel 2 Climate Stats</title>
        <script>
            function updateClimateStats(sdata) {
                var tempVal = document.getElementById('tempVal');
                tempVal.innerHTML = sdata.temperature.val + ' ' + sdata.temperature.unit;
                var humidVal = document.getElementById('humidVal');
                humidVal.innerHTML = sdata.humidity.val + ' ' + sdata.humidity.unit;
            }
            var host = window.document.location.host.replace(/:.*/, '');
            var ws = new WebSocket('ws://' + host + ':8080');
            ws.onmessage = function (event) {
                // console.log('sdata', event.data);
                updateClimateStats(JSON.parse(event.data));
            };
        </script>
      </head>
      <body>
        <h1>Tessel 2 Climate Stats</h1>

        <p>Temperature: <span id='tempVal'></span></p>
        <p>Humidity: <span id='humidVal'></span></p>
      </body>
    </html>
  `)
});

HttpServer.listen(80, () => {
    var ip = require('os').networkInterfaces().wlan0[0].address;
    console.log('Web Server is listening on http://'+ip+':80/')
})