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
    var sql = require("mssql");

    function MSSQLServer(n) {
        RED.nodes.createNode(this, n);
        this.host = n.host;
        this.port = n.port;
        this.db = n.db;
        this.encrypt = n.encrypt;
        this.sqluser = this.credentials.sqluser;
        this.sqlpwd = this.credentials.sqlpwd;
        var node = this;
        var config = {
            user: node.sqluser,
            password: node.sqlpwd,
            server: node.host, 
            database: node.db,
            port: node.port,
            options: {
                encrypt: (node.encrypt == 1) ? true:false 
            }
        };
        // console.log(config);
        node.connected = false;
        node.doConnect = function() {
            node.connection = new sql.Connection(config);
            node.connection.on('error', function(err) {
                console.log("error");
                node.connected = false;
                node.error(err);
                node.doConnect();
            });            
        }
        node.connect = function() {
            if (!node.connected){

                node.doConnect();    
            }
            
        }
        node.on('close', function (done) {
            if (node.connection) {
                node.connection.close(function(err) {
                    if (err) { node.error(err); }
                    done();
                });
            } else {
                done();
            }
        });
    }
    RED.nodes.registerType("mssqlserver",MSSQLServer,{
        credentials: {
            sqluser: {type:"text"},
            sqlpwd: {type: "password"}
        }
    });
    function MSSQLNode(n) {
        RED.nodes.createNode(this,n);
        this.name = n.name;
        this.server = n.server;
        this.sqlconn = RED.nodes.getNode(this.server);
        var node = this;
        node.sqlconn.connect();
        if (!node.sqlconn.connected){
            node.sqlconn.connection.connect(function(err) {
                if (err == null) {
                    node.sqlconn.connected = true;
                    node.status({fill:"green",shape:"dot",text:"Server Connected"});     
                } 
                else {
                    node.sqlconn.connected = false;
                    node.status({fill:"grey",shape:"dot",text:"Connecte Error"});
                    node.send({payload: err});          
                }
            });
        }
        if (node.sqlconn) {
            node.on("input", function(msg) {
                var query_string = msg.query;
                var request = node.sqlconn.connection.request(); // or: var request = connection.request(); 
                request.query(query_string, function(err, recordset) {
                    if (err) { 
                        node.warn(err); 
                    }
                    else {
                        if (recordset == undefined) {
                            msg.payload = "Success";    
                        }
                        else {
                            msg.payload = recordset;
                        }
                        node.send(msg);
                    }
                });
            });
        }
        else {
            node.error("mssql server not configured");
        }
        
    }
    RED.nodes.registerType("mssql",MSSQLNode);
}
