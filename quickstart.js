// node.js

/**
 * これより下はGoogle Driveのための処理
 * */
var jsonNumber=36; // for debug
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
  // ファイルリストの取得
  // myGoogleDrive.getGoogleDriveFileList(auth, testAddImage);
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
      console.log("初めての"+ data.userName + "のsoket.io:" + data.msg);
      var jsonfileName = jsonNumber + '.json';
      // var outputPath = './public/' + jsonfileName;
      // fs.writeFile(outputPath, JSON.stringify(data, null, '    '));
      
      myGoogleDrive.jsonFile = JSON.stringify(data, null, '    ');//imageFile;
      myGoogleDrive.jsonFileName = jsonfileName;
      myGoogleDrive.authorize(onStartUploadJSONFileToGoogleDrive);
      function onStartUploadJSONFileToGoogleDrive(auth) {
        console.log('~~~~ Start startInitialCallForGoogleDrive');
        myGoogleDrive.insertJson(auth, function () {
          socket.emit("emit_from_server", "uplaoded:" + jsonfileName);
        });
        console.log('~~~~ Finish startInitialCallForGoogleDrive');
        jsonNumber++;
      }
    });

    socket.on('upload_from_client', function (data) {
      console.log("upload from client");
      var name = data.name;
      var img = data.data;
      console.log("upload from client:" + name);
      console.log("upload from client:" + img);
      var imgStructure = img.split(',');
      var base64 = imgStructure[1];
  
      if (!base64) {
          console.log('fal to parse image');
      }
  
      // 保存するならば
      // var now = new Date().getTime();
      // var outputPath = './public/' + now + name;
  
      // fs.writeFile(
      //     outputPath,
      //     new Buffer(base64, 'base64'),
      //     function (err) {
      //       　console.log("fs.writeFile")
      //         console.log(err);
      //     }
      // );
    
      myGoogleDrive.imageFile = new Buffer(base64, 'base64');//imageFile;
      myGoogleDrive.imageFileName = name;
      console.log("authorize:%s", myGoogleDrive.imageFileName);
      myGoogleDrive.authorize(onStartUploadFileToGoogleDrive);
      function onStartUploadFileToGoogleDrive(auth) {
        console.log('~~~~ Start startInitialCallForGoogleDrive');
        myGoogleDrive.insertImage(auth, function () {
          socket.emit("upload_from_server", "uplaoded:" + name);
        });
        console.log('~~~~ Finish startInitialCallForGoogleDrive');
      }
      // もしアップロード終了時に合図が欲しいならば
      // socket.emit('notify', {url : publicUrl});
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