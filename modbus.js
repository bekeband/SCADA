

/* MODBUS function codes. */
const READ_COILS = 0x01;
const READ_DISCRETE_INPUTS = 0x02;
const READ_HOLDING_REGISTERS = 0x03;
const READ_INPUT_REGISTERS = 0x04;
const WRITE_SINGLE_COIL = 0x05;
const WRITE_SINGLE_REGISTER = 0x06;
const READ_EXCEPTION_STATUS = 0x07;
const GET_COMM_EVENT_COUNTER = 0x0B;
const GET_COMM_EVENT_LOG = 0x0C;
const WRITE_MULTIPLE_COILS = 0x0F;
const WRITE_MULTIPLE_REGISTERS = 0x10;
const REPORT_SERVER_ID = 0x11;
const READ_FILE_RECORD = 0x14;
const WRITE_FILE_RECORD = 0x15;
const MASK_WRITE_REGISTER = 0x16;
const READ_WRITE_MULTIPLE_REGISTERS = 0x17;
const READ_FIFO_QUEUE = 0x18;
const ENCAPSULATED_INTERFACE_TRANSPORT = 0x2B;

const MODBUS_ERROR_CODE_SHIFT = 0x80;

function commandItem(commandString, commandCode) {
    this.commandString = commandString;
    this.commandCode = commandCode;
}
var commandArray =
    [new commandItem("RC", READ_COILS),
    new commandItem("RDI", READ_DISCRETE_INPUTS),
    new commandItem("RHR", READ_HOLDING_REGISTERS),
    new commandItem("RIR", READ_INPUT_REGISTERS),
    new commandItem("WSC", WRITE_SINGLE_COIL),
    new commandItem("WSR", WRITE_SINGLE_REGISTER),
    new commandItem("RES", READ_EXCEPTION_STATUS),
    new commandItem("GCE", GET_COMM_EVENT_COUNTER),
    new commandItem("GCL", GET_COMM_EVENT_LOG),
    new commandItem("WMC", WRITE_MULTIPLE_COILS),
    new commandItem("WMR", WRITE_MULTIPLE_REGISTERS),
    new commandItem("RSI", REPORT_SERVER_ID),
    new commandItem("RFR", READ_FILE_RECORD),
    new commandItem("WFR", WRITE_FILE_RECORD),
    new commandItem("MWR", MASK_WRITE_REGISTER),
    new commandItem("RWR", READ_WRITE_MULTIPLE_REGISTERS),
    new commandItem("RFQ", READ_FIFO_QUEUE),
    new commandItem("EIT", ENCAPSULATED_INTERFACE_TRANSPORT)
    ];

var errorArray =
    [
        new commandItem("ILLEGAL FUNCTION", 0x01),
        new commandItem("ILLEGAL DATA ADDRESS", 0x02),
        new commandItem("ILLEGAL DATA VALUE", 0x03),
        new commandItem("SERVER DEVICE FAILURE", 0x04),
        new commandItem("ACKNOWLEDGE", 0x05),
        new commandItem("SERVER DEVICE BUSY", 0x06),
        new commandItem("MEMORY PARITY ERROR", 0x08),
        new commandItem("GATEWAY PATH UNAVAILABLE", 0x0A),
        new commandItem("GATEWAY TARGET DEVICE FAILED TO RESPOND", 0x0B)
    ];


    // Compute the MODBUS RTU CRC
function ModRTU_CRC(buf, len) {
    var crc = 0xFFFF;

    for (pos = 0; pos < len; pos++) {
        crc ^= buf[pos];          // XOR byte into least sig. byte of crc

        for (i = 8; i != 0; i--) {    // Loop over each bit
            if ((crc & 0x0001) != 0) {      // If the LSB is set
                crc >>= 1;                    // Shift right and XOR 0xA001
                crc ^= 0xA001;
            }
            else                            // Else LSB is not set
                crc >>= 1;                    // Just shift right
        }
    }
    // Note, this number has low and high bytes swapped, so use it accordingly (or swap bytes)
    return parseInt(crc);
}


    /**
 * 
 * @param {*} errorCode 
 * @returns 
 */

function getErrorString(errorCode) {
    var findedString = "N/A";
    errorArray.forEach(element => {
        if (errorCode == element.commandCode) {
            //            console.log("Hit code = ", element.commandCode);
            findedString = element.commandString;
        }
    });
    return findedString;
}


/**
 * 
 * @param {*} commandName 
 * @returns 
 */

 function getCommandCode(commandName) {
    var findedCode = -1;
    commandArray.forEach(element => {
        if (commandName == element.commandString) {
            //            console.log("Hit code = ", element.commandCode);
            findedCode = element.commandCode;
        }
    });
    return findedCode;
}

/**
 * 
 * @param {*} input1 
 * @param {*} input2 
 * @returns 
 */

function isEqualBuffers(input1, input2) {
    result = false;
    if ((input1.length === input2.length) && (input1.length > 0)) {
        for (i = 0; i < input1.length - 1; i++) {
            if (input1[i] === input2[i]) {
                result = true;
            }
        }
    }
    return result;
}

/**
 * @param {*} buffer
 * @param {*} deviceAddress 
 * @param {*} functionCode 
 */

function makeCommandBuffer(buffer, deviceAddress, functionCode) {
    var i;
    var bufferPtr = 0;
    buffer[bufferPtr++] = deviceAddress;
    buffer[bufferPtr++] = functionCode;
    /** getting arguments from argument list.  */
    for (i = 3; i < arguments.length; i++) {
        buffer[bufferPtr++] = (arguments[i] >>> 8) & 0xFF;
        buffer[bufferPtr++] = arguments[i] & 0xFF;
        //        console.log("arguments[" + i + "] = ", arguments[i]);
    }
    return bufferPtr;
}
/**
 * 
 * @param {*} buffer 
 * @param {*} nextData 
 * @returns 
 */
function storeCRCOnBufferTail(buffer, nextData) {
    var CRC = ModRTU_CRC(buffer, nextData);
    outBuffer[nextData++] = CRC & 0xFF;
    outBuffer[nextData++] = (CRC >>> 8) & 0xFF;
    return nextData;
}

/**
 * 
 * @param {*} deviceAddress 
 * @param {*} commandCode 
 * @param {*} firstWord 
 * @param {*} secondWord 
 */

function assemblyTwoWordsCommand(deviceAddress, commandCode, firstWord, secondWord) {
    nextData = makeCommandBuffer(outBuffer, deviceAddress, commandCode, firstWord, secondWord);
    storeCRCOnBufferTail(outBuffer, nextData);
}

/**Processing readed datas. */
/**
 * 
 * @param {*} readBuffer   The reading datas.
 * @returns 
 */
 function processData(readBuffer) {
    //    console.log("READBUFFER = ", readBuffer);
    if (readBuffer.length > 2) {
        CRCLength = readBuffer.length - 2;
        var CRC = ModRTU_CRC(readBuffer, CRCLength);

        if (((CRC & 0xFF) == readBuffer[readBuffer.length - 2]) && ((CRC >>> 8) & 0xFF) == readBuffer[readBuffer.length - 1]) {
            //      console.log('CRC LO = ', (CRC & 0xFF))
            //      console.log("CRC HI = ", (CRC >>> 8) & 0xFF);
            //            console.log("Reading data\'s CRC OK")
            return true;
        } else {
            //            console.log("Bad CRC of Reading data\'s")
            return false;
        }

    } else {
        //        console.log("readBuffer.length <= 2)")
        return false;
    }
    return false;
}

/**
 * 
 * @param {*} data 
 * @param {*} req 
 * @returns 
 */

function makeByteDataTable(data, req) {
    var dataTable = [];
    console.log("data = ", data);
    var regLength = data[2];

    for (j = 0; j < (regLength); j++) {
        var readValue = data[3 + (j)];

        var obj = {
            register: +req.params.address + j,
            value: readValue
        }
        dataTable.push(obj);
    }
    return dataTable;
}

/**
 * 
 * @param {*} data 
 * @param {*} req 
 * @returns 
 */

function makeWordDataTable(data, req) {
    var dataTable = [];
    console.log("data = ", data);
    var regLength = data[2];

    for (j = 0; j < (regLength / 2); j++) {
        var valHi = data[3 + (j * 2)];
        var valLow = data[4 + (j * 2)];
        var readValue = (valHi * 256) + valLow;

        var obj = {
            register: +req.params.address + j,
            value: readValue
        }
        dataTable.push(obj);
    }
    return dataTable;
}

function getErrorCodeString(currentModbusCommand, data) {
    if ((data.length >= 2) && (currentModbusCommand === (data[1] - MODBUS_ERROR_CODE_SHIFT))) {
        return getErrorString(data[2]);
    } else {
        return "Unknown error.";
    }
}


function getDatas() {
    var currentModbusCommand;
    p = new Promise((resolve, reject) => {

        currentModbusCommand = getCommandCode(req.params.reg_type);
        console.debug("CURRENT MODBUS COMMAND = ", currentModbusCommand);
        assemblyTwoWordsCommand(modbusDeviceAddress, currentModbusCommand, req.params.address, req.params.quantity);
        console.debug("WRITEBUFFER = ", outBuffer);    

        /**Write MODBUS outbuffer to serial. */
        port.write(outBuffer);

        port.on('data', (data) => {
            if (processData(data)) {
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
        var errorString;
        if (modbusDeviceAddress != data[0]) {

            res.json("Response with wrong MODBUS address.");
            res.end();
        }
        if (currentModbusCommand === data[1]) {

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
        };
    });

};


module.exports = { READ_COILS, getDatas, assemblyTwoWordsCommand };

