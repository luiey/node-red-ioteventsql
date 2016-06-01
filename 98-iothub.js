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

module.exports = function (RED) {

    "use strict";
    
    var Protocol = require('azure-iot-device-amqp').Amqp;
    var Client = require('azure-iot-device').Client;
    var Message = require('azure-iot-device').Message;

    function IotHubNode(n) {
        RED.nodes.createNode(this, n);
        this.hostname = n.hostname;
        this.deviceid = n.deviceid;
        this.devicekey = n.devicekey;

        var flag = true;
        if (this.credentials && this.credentials.hasOwnProperty("deviceid")) {
            this.keyname = this.credentials.keyname;
        }
        if (this.credentials && this.credentials.hasOwnProperty("devicekey")) {
            this.key = this.credentials.key;
        }
        if (flag) {
            RED.nodes.addCredentials(n.id, { keyname: this.deviceid, key: this.devicekey, global: true });
        }
        
        var node = this;
        
        var config = {
            hostname: node.hostname,
            deviceid: node.deviceid,
            devicekey: node.devicekey,
            options: { encrypt: true }
        }

        this.on("input", function (data) {
            var connectionString = "HostName=" + node.hostname + ";DeviceId=" + node.deviceid + ";SharedAccessKey=" + node.devicekey;
            var client = Client.fromConnectionString(connectionString, Protocol);
            var payload = data.payload;
            var connectCallback = function (err, msg) {
                if (err) {
                    node.status({ fill: "red", shape: "dot", text: "error" });
                    node.send(err);
                } else {
                    node.status({ fill: "green", shape: "dot", text: "connected" });
                   // var json = JSON.stringify(even);
                    //var message = new Message(json);
                    var json = JSON.stringify(payload);
                    var message = new Message(json);
                    console.log(message);

                    client.sendEvent(message, printResultFor('send', node));
                                        
                    client.on('message', function (msg) {
                        console.log('Id: ' + msg.messageId + ' Body: ' + msg.data);
                        client.complete(msg, printResultFor('completed'));
                    });
                    
                    client.on('error', function (err) {
                        node.status({ fill: "red", shape: "dot", text: "connection failed" });
                    });
                    
                    client.on('disconnect', function () {
                        client.removeAllListeners();
                        client.connect(connectCallback);
                    });
                }
            };
            client.open(connectCallback);
        });
    }

    function printResultFor(op, node) {
        return function printResult(err, res) {
            if (err) {
                node.status({ fill: "red", shape: "dot", text: "send error" });
                console.log(op + ' error: ' + err.toString());
            }
            if (res) {
                node.status({ fill: "green", shape: "dot", text: "send succeeded" });
                console.log(op + ' status: ' + res.constructor.name);
            }
        };
    }

    RED.nodes.registerType("iothub", IotHubNode, {
        credentials: {
            keyname: {type:"text"},
            key: {type: "password"},
            global: { type:"boolean"}
        }
    });
}
