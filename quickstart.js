// node.js

/**
 * これより下はGoogle Driveのための処理
 * */
var myGoogleDrive = require("./googledrive.js");
var fs = require('fs');
var google = require('googleapis');



console.log("Launch quickstart.js")
// 起動時に認証操作を実施する
myGoogleDrive.authorize(onStartInitialCallForGoogleDrive);
console.log("Called authorize method")

/**
 * 起動時に実施されるGoogleDrive認証後に呼び出されるメソッド
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function onStartInitialCallForGoogleDrive(auth) {
  console.log('~~~~ Start startInitialCallForGoogleDrive');
  // ファイルリスト取得して次のjsonNumberを
  myGoogleDrive.getGoogleDriveFileList(auth, function (number){
    console.log("jsonNumber:"+number);
  });
  console.log('~~~~ Finish startInitialCallForGoogleDrive');
}


/**
 * これより下はServerのための処理
 * */
var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');

var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'client')));
var sockets = [];

io.on('connection', function (socket) {
    
  socket.on("emit_from_client", function(data){
    console.log("クライアント「"+ data.userName + "」から次のデータ受信:" + data.msg);
    
    myGoogleDrive.authorize(onStartUploadJSONFileToGoogleDrive);
    function onStartUploadJSONFileToGoogleDrive(auth) {
      console.log('~~~~ Start startInitialCallForGoogleDrive');
      myGoogleDrive.getGoogleDriveFileList(auth, function (number){
        var jsonfileName = number + '.json';
        myGoogleDrive.jsonFile = JSON.stringify(data, null, '    ');//imageFile;
        myGoogleDrive.jsonFileName = jsonfileName;
        myGoogleDrive.insertJson(auth, function () {
          socket.emit("emit_from_server", "uplaoded:" + jsonfileName);
        });
        console.log('~~~~ Finish startInitialCallForGoogleDrive');
      });
    }
  });

  socket.on('upload_from_client', function (data) {
    console.log("クライアントから画像情報の受信：");
    var name = data.name;
    var img = data.data;
    console.log("upload from client:" + name);
    // console.log("upload from client:" + img);
    var imgStructure = img.split(',');
    var base64 = imgStructure[1];

    if (!base64) {
        console.log('fal to parse image');
    }
  
    myGoogleDrive.imageFile = new Buffer(base64, 'base64');//imageFile;
    myGoogleDrive.imageFileName = name;
    console.log("authorize:%s", myGoogleDrive.imageFileName);
    myGoogleDrive.authorize(onStartUploadFileToGoogleDrive);
    function onStartUploadFileToGoogleDrive(auth) {
      console.log('~~~~ Start startInitialCallForGoogleDrive');
      myGoogleDrive.insertImage(auth, function () {
        // アップロード完了の合図を送信
        socket.emit("upload_from_server", "uplaoded:" + name);
      });
      console.log('~~~~ Finish startInitialCallForGoogleDrive');
    }
  });
  
});

/**
 * 画像アップロードのための認証後に呼び出されるメソッド
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function onStartUploadCallForGoogleDrive(auth) {
  console.log('~~~~ Start onStartUploadCallForGoogleDrive');
  
  // ファイルリストの取得
  myGoogleDrive.insertImage(auth);
  console.log('~~~~ Finish onStartUploadCallForGoogleDrive');
}

function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});