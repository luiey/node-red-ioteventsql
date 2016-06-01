/**
 * Copyright 2013,2014 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
    "use strict";
    function IoThubInfo(n) 
    {
        RED.nodes.createNode(this,n);
        this.connstr = n.connstr;
    }
    RED.nodes.registerType("hubinfo",IoThubInfo);
    function printResultFor(op, n) {
        return function printResult(err, res) {
            if (err) {
                n.send({"payload":err.toString()});
                // console.log(op + ' error: ' + err.toString());
            }
            if (res) {
                n.send({"payload":res.constructor.name});
                // console.log(op + ' status: ' + res.constructor.name);
            }
        };
    }

    function SendEvent(n) {
        var Amqp = require('azure-iot-device-amqp').Amqp;
        var Client = require('azure-iot-device').Client;
        var Message = require('azure-iot-device').Message;

        RED.nodes.createNode(this,n);
        this.hubinfo = n.hubinfo;
        var hubinfo = RED.nodes.getNode(this.hubinfo);
        var connectionString = hubinfo.connstr;
        console.log(connectionString);
        var client = Client.fromConnectionString(connectionString, Amqp);
        
        var node = this;
        // console.log(this);
        var firstTimeSend = 1;
        // var dd = new Date().getTime();
        var firstData = {
            DeviceID        : n.deviceid,
            HubEnabledState : n.hubenabledstate,
            DeviceState     : "normal",
            UpdatedTime     : null,
            Manufacturer    : n.manufacturer,
            CreatedTime     : new Date().getTime(),
            ModelNumber     : n.modelnumber,
            SerialNumber    : n.serialnumber,
            FirmwareVersion : n.firmwareversion,
            Platform        : n.platform,
            Processor       : n.processor,
            Latitude        : n.latitude,
            Longitude       : n.longitude,
        };
        if (firstTimeSend == 1){
            var fir_m = new Message(firstData);
            client.sendEvent(fir_m, printResultFor('send', node));
            firstTimeSend = 0;
        }
         console.log(firstData);
        var connectCallback = function (err) {
            if (err) {
                node.status({fill:"red",shape:"dot",text:"Connect Error"});
                console.log('Could not connect: ' + err.message);
            } 
            else {
                node.status({fill:"green",shape:"dot",text:"Client connected"});
                node.on('input', function (msg) 
                {
                    
                    var message = new Message(msg.payload);
                    client.sendEvent(message, printResultFor('send', node));
                    node.status({fill:"green",shape:"dot",text:"Event Sended"});
                });
            }
        };
        client.open(connectCallback);
    }
    RED.nodes.registerType("IoThub SendEvent",SendEvent);

    function ReceiveMessage(n) {
        var Amqp = require('azure-iot-device-amqp').Amqp;
        var Client = require('azure-iot-device').Client;
        var Message = require('azure-iot-device').Message;

        RED.nodes.createNode(this,n);
        this.hubinfo = n.hubinfo;
        var hubinfo = RED.nodes.getNode(this.hubinfo);
        var connectionString = hubinfo.connstr;
        var client = Client.fromConnectionString(connectionString, Amqp);
        var node = this;
        var connectCallback = function (err) {
            if (err) {
                console.log('Could not connect: ' + err.message);
            } 
            else {
                client.on('message', function (msg) {
                    node.status({fill:"green",shape:"dot",text:"Receiveing Message"});
                    node.send({"payload":{"msgID":msg.messageId,"data":msg.data}});
                    // client._disconnectReceiver();
                });

                client.on('error', function (err) {
                    node.status({fill:"red",shape:"dot",text:err.message});
                    node.send({"payload":err.message});
                });

                client.on('disconnect', function () {
                    client.removeAllListeners();
                    node.status({fill:"yellow",shape:"dot",text:"disconnect"});
                });
            }
        };
        client.open(connectCallback);
    }
    RED.nodes.registerType("IoThub ReceiveMessage",ReceiveMessage);
}
