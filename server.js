var dgram = require('dgram');
var client = dgram.createSocket('udp4');
var five = require("johnny-five");
var XPlane = require('xplane');

var xplane = new XPlane({
    port: {
        in: 49100,
        out: 49001
    }
});

var boardReady = false;
var altitude = 397.6;
var sensorData = "sim/multiplayer/controls/yoke_heading_ratio[0]";

var board = new five.Board();

board.on("ready", function() {
    boardReady = true;
    xplane.listen();
    console.log('board ready');
    var slider = new five.Sensor("A0");
    var pressure = new five.Sensor("A1");
    slider.on("change", function(v) {
        var value = mapInput(v, 0, 784, -1, 1);
        //console.log('slider:' + value);
        sendDatarefValue(sensorData, value);
    });

    pressure.on("change", function(v) {
        var value = mapInput(v, 0, 15, 0, 0.5);
        //console.log('slider:' + value);
        sendDatarefValue('sim/multiplayer/controls/yoke_pitch_ratio[0]', value);
    });
});

xplane.on('data.airspeed', function(x) {
    if (boardReady && x.altind > altitude + 20) {
       sensorData = "sim/multiplayer/controls/yoke_roll_ratio[0]";
   }
});

var sendDatarefValue = function(dataref, value) {
    var outgoing = new Buffer(new Array(509));
    outgoing.write("DREF\0");
    outgoing.writeFloatLE(value, 5);
    outgoing.write(dataref + "\0", 9);
    client.send(outgoing, 0, outgoing.length, 49000, 'localhost', function(err) {
        if (err) {
            console.error("UDP client error sending to " + 'localhost', err);
        }
    });
};

var mapInput = function (x, in_min, in_max, out_min, out_max) {
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};