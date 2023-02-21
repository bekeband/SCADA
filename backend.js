
const express = require('express')
const { json } = require('express/lib/response');
const { MockBinding } = require('@serialport/binding-mock')
const { SerialPortStream } = require('@serialport/stream')
const { ReadlineParser } = require("@serialport/parser-readline");
const PORTNAME = '/dev/ROBOT';
const PORTNUMB = 8081;

// Create a port and enable the echo and recording.
MockBinding.createPort(PORTNAME, { echo: true, record: true })

const port = new SerialPortStream({ binding: MockBinding, path: PORTNAME, baudRate: 14400 })

/* Add some action for incoming data. For example,
** print each incoming line in uppercase */
const parser = new ReadlineParser()
port.pipe(parser).on('data', line => {
   console.log(line.toUpperCase())
})

// wait for port to open...
port.on('open', () => {
   // ...then test by simulating incoming data
   port.port.emitData("Hello : " + PORTNAME + "\n")
})

var app = express();

// This responds with "Hello World" on the homepage
app.get('/', function (req, res) {

   console.log("Got a GET request for the homepage");
   port.port.emitData("get from frontend");
   res.send('Hello GET');

})

app.get('/listports', (req, res) => {
   res.json("serialPorts");
});

/**App.get get the MODBUS register data. These are read commands. */

app.get('/:reg_type/:address/:quantity', function (req, res, next) {
   var currentModbusCommand;
   p = new Promise((resolve, reject) => {

      //        currentModbusCommand = getCommandCode(req.params.reg_type);

      //        assemblyTwoWordsCommand(modbusDeviceAddress, currentModbusCommand, req.params.address, req.params.quantity);
      //  console.log("WRITEBUFFER = ", outBuffer);    

      /**Write MODBUS outbuffer to serial. */
      port.write("outBuffer");

      port.on('data', (data) => {
         //            if (processData(data)) 
         {
            resolve(data);
         }
      });

      port.on('error', (err) => {
         reject(err);
      });
   });

   //    p.then(readSerial(data));

   p.then((data) => {

      //        console.log("READBUFFER AWAIT = ", data);
      //        console.log('address', req.params.address);

      var dataTable = [];
      var errorString = "result";
/*      if (modbusDeviceAddress != data[0]) {

         res.json("Response with wrong MODBUS address.");
         res.end();
      }*/
/*      if (currentModbusCommand === data[1]) {

         if (currentModbusCommand <= READ_DISCRETE_INPUTS) {
            dataTable = makeByteDataTable(data, req);
         } else {
            dataTable = makeWordDataTable(data, req);
         }

         console.log("dataTable = ", dataTable);
         res.json(dataTable)
         res.end();
      } else {
         errorString = getErrorCodeString(currentModbusCommand, data);
         res.json(errorString);
         res.end();
      };*/
      res.json(errorString + " " + data + " return from backend.");
      res.end();
   });

});



// This responds a POST request for the homepage
app.post('/', function (req, res) {
   console.log("Got a POST request for the homepage");
   res.send('Hello POST');
})

// This responds a DELETE request for the /del_user page.
app.delete('/del_user', function (req, res) {
   console.log("Got a DELETE request for /del_user");
   res.send('Hello DELETE');
})

// This responds a GET request for the /list_user page.
app.get('/list_user', function (req, res) {
   console.log("Got a GET request for /list_user");
   res.send('Page Listing');
})

// This responds a GET request for abcd, abxcd, ab123cd, and so on
app.get('/ab*cd', function (req, res) {
   console.log("Got a GET request for /ab*cd");
   res.send('Page Pattern Match');
})

var server = app.listen(PORTNUMB, function () {
   var host = server.address().address
   var port = server.address().port

   console.log("Example app listening at http://%s:%s", host, port)
})
