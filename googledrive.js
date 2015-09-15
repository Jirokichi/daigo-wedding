var fs = require('fs');
var googleAuth = require('google-auth-library');
var SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly', 'https://www.googleapis.com/auth/drive.file'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'drive-api-quickstart.json';
var readline = require('readline');
var google = require('googleapis');





var imageFileName = null;
exports.imageFileName = imageFileName;

var imageFile = null;
exports.imageFile = imageFile;

/**
 * 認証後にコールバック関数を呼び出すためのメソッド
 * 認証のために必要な情報はclient_secret.jsonから読み込む
 * なお、tokenも上記json内に保存する。
 * 
 */
function authorize(callback){
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
    // 読み込んだファイルの中身を元に認証を行う
    // -> 読み込み成功後にcallback関数が呼び出される
    authorizeBasedOnInfo(oauth2Client, callback);
    console.log("**** Finish fs.readFile");
  });
}
exports.authorize = authorize;


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorizeBasedOnInfo(oauth2Client, callback) {
  console.log("---- Start authorizeBasedOnInfo");
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
  console.log("---- Finish authorizeBasedOnInfo");
}

/**
 * 認証トークンが保存されていなかった場合のみ呼び出され、認証トークンを取得する
 */
function getNewToken(oauth2Client, callback) {
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
      
      callback(oauth2Client);
      
    });
  });
  console.log("@@@@@ Finish getNewToken");
}

/**
 * 認証トークンをjsonファイルに保存する
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


function insertDocs(auth, callback){
  // ファイルのアップロード resourceでパラメータを指定するのがなかなかわからなかった
  console.log("insertDocs: %s(%s)", this.imageFileName);
  var drive = google.drive('v2');
  drive.files.insert({
    auth: auth,
    resource: {
      title: this.imageFileName,
      mimeType: 'image/png',
    },
    media: {
      mimeType: 'image/png',
      body: this.imageFile
    }
  }, function(err,res){
    // console.log('insertDocs return');
    if(err !== undefined && err !== null){
      console.error(err);
    }
    
    console.log("Upload Completed");
    // console.log(res)
    // 下記のURLでアップロードしたファイルに直接アクセスできるのはファイルのパーミッションがpublicの時のみ
    // console.log('https://docs.google.com/a/ドメイン名/uc?id='+res.id);
  });
}
exports.insertDocs = insertDocs;


function getGoogleDriveFileList(auth, callback){
  console.log("start getGoogleDriveFileList");
  var service = google.drive('v2');
  // 現在のGoogleDrive内のファイルのリストを取得
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
        console.log('             %s (%s)', file.title, file.id);
      }
    }
    callback(auth);
    console.log("finish getGoogleDriveFileList");
  });
}
exports.getGoogleDriveFileList = getGoogleDriveFileList;
