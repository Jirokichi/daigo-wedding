// node.js

/**
 * これより下はGoogle Driveのための処理
 * */
var i_debug=0; // for debug
var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

var SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly', 'https://www.googleapis.com/auth/drive.file'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'drive-api-quickstart.json';

// 起動時に認証操作を実施する
authorize(startInitialCallForGoogleDrive, 0, null, null);

/**
 * 認証後にコールバック関数を呼び出すためのメソッド
 */
function authorize(callback, type, imageFilename, imageFile){
  // fsにローカルファイルからClient Secretsを読み込む
  fs.readFile('client_secret.json', function processClientSecrets(err, content) {
    console.log("**** Start fs.readFile");
    if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
    }
    
    console.log("Read credentails")
    var credentials = JSON.parse(content);
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
    // ファイルの中身contentを元に認証を行う(＊読み込み成功後にstartInitialCallForGoogleDriveが呼び出される)
    if(type == 0){
      authorizeForFirstLaunch(oauth2Client, callback);
    }else if(type == 1){
      authorizeToUploadImages(oauth2Client, callback, imageFilename, imageFile);
    }
    console.log("**** Finish fs.readFile");
  });
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorizeForFirstLaunch(oauth2Client, callback) {
  console.log("---- Start authorizeForFirstLaunch");
  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      console.log("There are no tokens");
      getNewToken(oauth2Client, callback, 0, null, null);
    } else {
      console.log("There is a token in Internal File");
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
  console.log("---- Finish authorizeForFirstLaunch");
}


function authorizeToUploadImages(oauth2Client, callback, imageFilename, imageFile) {
  console.log("---- Start authorizeToUploadImages");
  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      console.log("There are no tokens");
      getNewToken(oauth2Client, callback, 1, imageFilename, imageFile);
    } else {
      console.log("There is a token in Internal File");
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client, imageFilename, imageFile);
    }
  });
  console.log("---- Finish authorizeToUploadImages");
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback, type, imageFilename, imageFile) {
  console.log("@@@@@ Start getNewToken");
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      
      if(type == 0){
        callback(oauth2Client);
      }
      else if(type == 1){
        callback(oauth2Client, imageFilename, imageFile);
      }
    });
  });
  console.log("@@@@@ Finish getNewToken");
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function startInitialCallForGoogleDrive(auth) {
  console.log('~~~~ Start startInitialCallForGoogleDrive');
  
  auth
  
  var service = google.drive('v2');
  service.files.list({
    auth: auth,
    maxResults: 10,
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var files = response.items;
    if (files.length == 0) {
      console.log('No files found.');
    } else {
      console.log('Files:');
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        console.log('%s (%s)', file.title, file.id);
      }
    }
    var imageFile = fs.readFileSync('backImage.jpg');
    insertDocs("test3.jpg", imageFile, auth);
  });
  console.log('~~~~ Finish startInitialCallForGoogleDrive');
}

function insertDocs(imageFilename, imageFile, auth){
  // ファイルのアップロード resourceでパラメータを指定するのがなかなかわからなかった
  console.log("insertDocs: %s(%s)", imageFilename, ""+i_debug);
  var drive = google.drive('v2');
  drive.files.insert({
    auth: auth,
    resource: {
      title: imageFilename,
      mimeType: 'image/jpeg',
    },
    media: {
      mimeType: 'image/jpeg',
      body: imageFile
    }
  }, function(err,res){
    // console.log('insertDocs return');
    if(err !== undefined && err !== null){
      console.error(err);
    }
    
    // [Debug]繰り返同じファイルをあっぷろーどする
    // if(i_debug <2 - 1){
    //   i_debug++;
    //   insertDocs(imageFilename, imageFile, auth, folderId);
    // }
    
    console.log("Upload Completed");
    // console.log(res)
    // 下記のURLでアップロードしたファイルに直接アクセスできるのはファイルのパーミッションがpublicの時のみ
    // console.log('https://docs.google.com/a/ドメイン名/uc?id='+res.id);
  });
}


function UploadImage(oauth2Client, imageFilename, imageFile){
  console.log("UploadImage: %s(%s)", imageFilename);
  var drive = google.drive('v2');
  
  // var string = (process.env.HOME || process.env.HOMEPATH ||
  //   process.env.USERPROFILE) + '/text.file/';
  // try {
  //   fs.mkdirSync(string);
  // } catch (err) {
  //   if (err.code != 'EEXIST') {
  //     throw err;
  //   }
  // }
  // fs.writeFile(string, JSON.stringify(imageFilename));
  
  var lMimeType = 'image/jpeg';//"application/json";// 
  drive.files.insert({
    auth: oauth2Client,
    resource: {
      title: imageFilename,
      mimeType: lMimeType,
    },
    media: {
      mimeType: lMimeType,
      body: imageFile
    }
  }, function(err,res){
    // console.log('insertDocs return');
    if(err !== undefined && err !== null){
      console.error(err);
    }
    
    // [Debug]繰り返同じファイルをあっぷろーどする
    // if(i_debug <2 - 1){
    //   i_debug++;
    //   insertDocs(imageFilename, imageFile, auth, folderId);
    // }
    
    console.log("*Upload Completed");
  });
  
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
var messages = [];
var sockets = [];

io.on('connection', function (socket) {
    messages.forEach(function (data) {
      socket.emit('message', data);
    });

    sockets.push(socket);

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
      updateRoster();
    });

    socket.on('message', function (msg) {
      console.log(" socket.on for message");
      var text = String(msg || '');

      if (!text)
        return;

      
      socket.get('name', function (err, name) {
        var data = {
          name: name,
          text: text
        };

        var imageFile = fs.readFileSync('backImage.jpg');
        authorize(UploadImage, 1, text + "_" +name + ".jpeg", imageFile);


        broadcast('message', data);
        messages.push(data);
      });
    });

    socket.on('identify', function (name) {
      socket.set('name', String(name || 'Anonymous'), function (err) {
        updateRoster();
      });
    });
  });

function updateRoster() {
  async.map(
    sockets,
    function (socket, callback) {
      socket.get('name', callback);
    },
    function (err, names) {
      broadcast('roster', names);
    }
  );
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