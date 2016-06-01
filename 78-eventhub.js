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
    
    //console.log(nodemailer.Transport.transports.SMTP.wellKnownHosts);

    function EventHubNode(n) {
        RED.nodes.createNode(this,n);
        //console.log(n);
        this.hubname = n.hubname;
        this.namespace = n.namespace;
        var flag = true;
        if (this.credentials && this.credentials.hasOwnProperty("keyname")) {
            this.keyname = this.credentials.keyname;
        }
        if (this.credentials && this.credentials.hasOwnProperty("key")) {
            this.key = this.credentials.key;
        }
        if (flag) {
            RED.nodes.addCredentials(n.id,{keyname:this.keyname, key:this.key, global:true});
        }
        var node = this;

        var config = {
            keyname: node.keyname,
            key: node.key,
            namespace: node.namespace, // You can use 'localhost\\instance' to connect to named instance
            hubname: node.hubname,

            options: {
                encrypt: true // Use this if you're on Windows Azure
            }
        }
        //console.log(config);
        this.on("input", function(msg) {
            //var query_string = msg.query;
            // var QQ = "{\"ID\":\"1\", \"BatteryCurrent\":\"11\", \"BatteryVoltage\": \"5656\", \"BatteryPower\": \"9635\"}";
            var client = require('event-hub-client').restClient(node.namespace,node.hubname,node.keyname,node.key);
            var query = JSON.stringify(msg.payload);
            console.log(query);
            client.sendMessage(query,function(err) {
                if (err == undefined){
                    node.status({fill:"green",shape:"dot",text:"sended"});   
                } 
                else {
                    node.status({fill:"red",shape:"dot",text:"error"});   
                    console.log(err);
                }
                
            });
        });
    }
    RED.nodes.registerType("eventhub",EventHubNode,{
        credentials: {
            keyname: {type:"text"},
            key: {type: "password"},
            global: { type:"boolean"}
        }
    });
}
