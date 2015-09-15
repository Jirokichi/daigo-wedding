// node.js

/**
 * これより下はGoogle Driveのための処理
 * */
var i_debug=0; // for debug
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

// function testAddImage(auth){
//   console.log("||||||||| start testaddImage")
//   // リスト表示後に検証でファイルをアップロード
//   require('date-utils')
//   var dt = new Date();
//   var formatted = dt.toFormat("YYYYMMDDHH24MISS");
//   console.log(formatted);
//   var imageFile = fs.readFileSync('backImage.jpg');
//   myGoogleDrive.imageFile = imageFile;
//   myGoogleDrive.imageFileName = "検証_"+formatted+".jpg";
  
//   console.log("testAddImage: %s(%s)", myGoogleDrive.imageFileName);
//   myGoogleDrive.insertDocs(auth);
//   console.log("||||||||| finish testaddImage")
// }


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
var messages = [];
var sockets = [];

io.on('connection', function (socket) {
    
    // socket.on('disconnect', function () {
    //   sockets.splice(sockets.indexOf(socket), 1);
    //   updateRoster();
    // });
    
    socket.on("emit_from_client", function(data){
      console.log("初めての"+ data.userName + "のsoket.io:" + data.msg);
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
      var now = new Date().getTime();
      var outputPath = './public/' + now + name;
  
      fs.writeFile(
          outputPath,
          new Buffer(base64, 'base64'),
          function (err) {
            　console.log("fs.writeFile")
              console.log(err);
          }
      );
      
      // 起動時に認証操作を実施する
      // var imageFile = fs.readFileSync("public/1442321209075Sample.png");
    
      myGoogleDrive.imageFile = new Buffer(base64, 'base64');//imageFile;
      myGoogleDrive.imageFileName = name;
      console.log("authorize:%s", myGoogleDrive.imageFileName);
      myGoogleDrive.authorize(onStartUploadFileToGoogleDrive);
      function onStartUploadFileToGoogleDrive(auth) {
        console.log('~~~~ Start startInitialCallForGoogleDrive');
        myGoogleDrive.insertDocs(auth);
        console.log('~~~~ Finish startInitialCallForGoogleDrive');
      }
      // もしアップロード終了時に合図が欲しいならば
      // socket.emit('notify', {url : publicUrl});
    });

    // socket.on('identify', function (name) {
    //   socket.set('name', String(name || 'Anonymous'), function (err) {
    //     updateRoster();
    //   });
    // });
    
  });

// function updateRoster() {
//   async.map(
//     sockets,
//     function (socket, callback) {
//       socket.get('name', callback);
//     },
//     function (err, names) {
//       broadcast('roster', names);
//     }
//   );
// }

/**
 * 画像アップロードのための認証後に呼び出されるメソッド
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function onStartUploadCallForGoogleDrive(auth) {
  console.log('~~~~ Start onStartUploadCallForGoogleDrive');
  
  // ファイルリストの取得
  myGoogleDrive.insertDocs(auth);
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