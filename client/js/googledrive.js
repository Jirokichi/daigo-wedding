console.log("start uploading file");
var REFRESH_TOKEN = "1/xdAYIQOwK5wtYwUVWt2EF_EK_496yFgE4DFFjMSjDhfBactUREZofsF9C7PrpE-j";
var CLIENT_ID = '358351538857-i7ie83r326kh0mjrc4578hdmusnc40af.apps.googleusercontent.com';
var CLIENT_SECRET = "D3gEOVEI9oAmMJA9aU1Haub4";
var SCOPES = 'https://www.googleapis.com/auth/drive';
var GRANT_TYPE = "refresh_token";

console.log("CLIENT_ID:" + CLIENT_ID);
console.log("SCOPES:" + SCOPES);

/**
* Called when the client library is loaded to start the auth flow.
*/
function handleClientLoad() {
    console.log("handleClientLoad() - start");
    window.setTimeout(checkAuth, 1);
    console.log("handleClientLoad() - fin");
}



/**
* Check if the current user has authorized the application.
*/
function checkAuth() {
    console.log("checkAuth() - start");
    // ユーザーに認証させる方法
    // gapi.auth.authorize(
    //     {'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': true},
    //     handleAuthResult);

    $.post("https://accounts.google.com/o/oauth2/token",
      { "refresh_token": REFRESH_TOKEN, "client_id": CLIENT_ID , "client_secret": CLIENT_SECRET, "grant_type": GRANT_TYPE},
      function(data){
        //リクエストが成功した際に実行する関数
        alert("Data Loaded: " + data);
      },
      "json"
    );
    
    console.log("checkAuth() - fin");
}

/**
* Called when authorization server replies.
*
* @param {Object} authResult Authorization result.
*/
function handleAuthResult(authResult) {
    
    console.log("handleAuthResult() - start:");
    var authButton = document.getElementById('authorizeButton');
    var filePicker = document.getElementById('filePicker');
    authButton.style.display = 'none';
    filePicker.style.display = 'none';
    if (authResult && !authResult.error) {
        // console.log("authResult:" + authResult);
      // Access token has been successfully retrieved, requests can be sent to the API.
      filePicker.style.display = 'block';
      filePicker.onchange = uploadFile;
    } else {
      // No access token could be retrieved, show the button to start the authorization flow.
      authButton.style.display = 'block';
      authButton.onclick = function() {
          gapi.auth.authorize(
              {'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': false},
              handleAuthResult);
              
      };
    }
    
    console.log("handleAuthResult() - fin");
}

/**
* Start the file upload.
*
* @param {Object} evt Arguments from the file selector.
*/
function uploadFile(evt) {
    console.log("uploadFile() - start");
    gapi.client.load('drive', 'v2', function() {
      var file = evt.target.files[0];
      insertFile(file);
    });
    console.log("uploadFile() - fin");
}

/**
* Insert new file.
*
* @param {File} fileData File object to read data from.
* @param {Function} callback Function to call when the request is complete.
*/
function insertFile(fileData, callback) {
    console.log("insertFile() - start");
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";
    
    var reader = new FileReader();
    reader.readAsBinaryString(fileData);
    reader.onload = function(e) {
      var contentType = fileData.type || 'application/octet-stream';
      var metadata = {
        'title': fileData.name,
        'mimeType': contentType
      };
    
      var base64Data = btoa(reader.result);
      var multipartRequestBody =
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: ' + contentType + '\r\n' +
          'Content-Transfer-Encoding: base64\r\n' +
          '\r\n' +
          base64Data +
          close_delim;
    
      var request = gapi.client.request({
          'path': '/upload/drive/v2/files',
          'method': 'POST',
          'params': {'uploadType': 'multipart'},
          'headers': {
            'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
          },
          'body': multipartRequestBody});
      if (!callback) {
        callback = function(file) {
          console.log(file)
        };
      }
      request.execute(callback);
    }
    
    console.log("insertFile() - fin");
}