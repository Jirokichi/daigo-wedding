

<!--[if IE]><script type="text/javascript" src="excanvas.js"></script><![endif]-->

var KEY_USERNAME = "KEY_NAME"; /*　top.jsでも同じものである必要がある・ユーザ名を保存するためのキー */

var WINDOW_WITDH;
var WINDOW_HEIGHT;
var userName = localStorage.getItem(KEY_USERNAME);
document.getElementById("userNameId").innerHTML = "ユーザー名「" + userName + "」の変更";
console.log("start daigo.js");
console.log("userName:" + userName);
console.log("navigator.userAgent:" + navigator.userAgent);
console.log("設定項目:" + document.getElementById("userNameId").innerHTML);

var DEBUG = 0; // 0ならデバッグモード(DEBUG_MAX_COUNT回同じものをアップロード)オフ
var DEBUG_MAX_COUNT = 150;

var type = 0;// iPad/iPhoneの場合は1となるようにする
if(navigator.userAgent.indexOf("iPad") > 0 || navigator.userAgent.indexOf("iPhone") > 0){
  type = 1;
  // alert("iOS!");
}

var isSending = false;

var file = null;
var socket = null;

var textBoxValue = null;
var imgName = null;
/**
 * 読み込み時の処理
 * */
window.onload = function() {
  console.log("onload");
  // body
  WINDOW_WITDH = window.innerWidth;//$("body").width();
  WINDOW_HEIGHT = window.innerHeight;//$("body").height();
  console.log("width:" + WINDOW_WITDH);
  console.log("height:" + WINDOW_HEIGHT);
  
  socket = io.connect();
  socket.on("emit_from_server", function (msg) {
      if(DEBUG == 0 || DEBUG > DEBUG_MAX_COUNT){
        alert("アップロードしました！");
        console.log("メッセージ送信終了:" + msg);
        isSending = false;
      }else{
        DEBUG++;
        console.log("まだまだ続く:" + DEBUG);
        isSending = false;
        send();
      }
  });
  
  socket.on("upload_from_server", function (msg1) {
    
      console.log("画像送信完了:" + msg1);
      console.log("送信スタート:");
      console.log("textBoxValue:" + textBoxValue);
      console.log("userName:" + userName);
      console.log("imgName:" + imgName);
      if(DEBUG == 0){
        socket.json.emit("emit_from_client", { msg:textBoxValue, userName:userName, imgPath:imgName});
      }else{
        socket.json.emit("emit_from_client", { msg:textBoxValue + DEBUG, userName:userName, imgPath:imgName});
      }
  });
    
};


var timer = false;
$(window).resize(function() {
    if (timer !== false) {
        clearTimeout(timer);
    }
    timer = setTimeout(function() {
        console.log('resized');
        WINDOW_WITDH = window.innerWidth;
        WINDOW_HEIGHT = window.innerHeight;
        console.log("resize-width:" + WINDOW_WITDH);
        console.log("resize-height:" + WINDOW_HEIGHT);
    }, 200);
});

window.onerror = function(error) {
    alert(error);
};

function onMyBlur(){
  console.log("onMyBlur()");
}

// ファイルを選択したときに呼び出されるメソッド
$('#fileId').change(
  function() {
    console.log("onChangeFile");
    if ( !this.files.length ) {
        return;
    }
  
    file = $(this).prop('files')[0];
    console.log("file:" + file.size);
    console.log(file);
    console.log(file.type);
    
    if(file.type.indexOf("image/jpeg") == -1 && file.type.indexOf("image/png") == -1){
      
      alert("画像(jpeg及びpngファイル)以外は対象外です");
      file = null;
      $('#fileId').val(null);
      $('#previewImageId').attr('src', null ).css('display','none');
      return;
    }
    
    
    
    var fr = new FileReader();
    fr.onload = function(e) {
      console.log("FileReader onload:");
      var data = e.target.result;
      var orientation = getOrientation(data);
      console.log("orientation:" + orientation);
      if(type == 1){
        // iOSの場合は、なぜかexifのorientationがあるにも関わらず、読み込んだファイルがすでに反映された結果となっているため、
        // orientationを1として扱う
        console.log("orientation: " + orientation + "(iOS)");
        orientation = 1;
      }else{
        console.log("orientation:" + orientation);
      }
      
      var rotateStyle = exif_orientation_to_css(orientation);
      
      console.log("rotateStyle:" + rotateStyle)
      $('#previewImageId').attr('src', fr.result ).css("transform", rotateStyle).css('display','inline').load(function(){
        
        // 新しい画像を追加
        var image = document.getElementById('previewImageId'); 
        //テキストボックスのフィールドには画像が被らないようにする必要があるため、その高さを取得
        var textElementHeight = document.getElementById('div_inputArea_id').scrollHeight;
        var navBarElementHeight = document.getElementById('navBarId').scrollHeight;
        var OrgWidth = image.naturalWidth;
        var OrgHeight = image.naturalHeight;
        console.log("textElementHeight:" + textElementHeight);
        console.log("navBarElementHeight:" + navBarElementHeight);
        console.log("OrgWidth:" + OrgWidth);
        console.log("OrgHeight:" + OrgHeight);
         
        
        
        // 表示する画像サイズを調整する
        var p = 1.0;
        
        // テキストボックス分縦の範囲は狭くなる
        var DIFF_HEIGHT = WINDOW_HEIGHT - textElementHeight - navBarElementHeight;
        console.log("DIFF_HEIGHT:" + DIFF_HEIGHT);
        
        // ９０度回転など、縦横が入れ替わる場合には事前に最大幅、高さを入れ替えておく
        var window_width = WINDOW_WITDH;
        if (orientation > 4) {
          p = cal_p(OrgWidth, OrgHeight, DIFF_HEIGHT, WINDOW_WITDH);
        }else{
          p = cal_p(OrgWidth, OrgHeight, WINDOW_WITDH, DIFF_HEIGHT);
        }
        
        console.log("p:" + p);
        image.width = OrgWidth * p;
        image.height = OrgHeight * p;
        console.log("image.width:" + image.width);
        console.log("image.height:" + image.height);
        
        
        
        var x_image = ( WINDOW_WITDH - image.width ) / 2;
        var y_image = (WINDOW_HEIGHT - image.height - textElementHeight + navBarElementHeight ) / 2;
        console.log("WINDOW_WITDH:" + WINDOW_WITDH);
        console.log("WINDOW_HEIGHT:" + WINDOW_HEIGHT);
        console.log("x_image(image.style.leftにセットする値):" + x_image);
        console.log("y_image(image.style.topにセットする値):" + y_image);
        
        image.style.left = x_image;
        image.style.top = y_image;
        
        //表示に変更 
        // $('#previewImage');
        console.log("image.scrollHeight:" + image.scrollHeight);
        console.log("image.scrollWidth:" + image.scrollWidth);
      });
    }
    fr.readAsDataURL(file);
  }
);

// 絵文字削除処理
function replaceEmoji(message){
  var ranges = [
          '\ud83c[\udf00-\udfff]',
          '\ud83d[\udc00-\ude4f]',
          '\ud83d[\ude80-\udeff]',
          '\ud7c9[\ude00-\udeff]',
          '[\u2600-\u27BF]'
  ];
  var ex = new RegExp(ranges.join('|'), 'g');
  message = message.replace(ex, '♡'); //ここで削除
  // alert(message); //絵文字だよ！
  return message
}

// 送信ボタンがクリックされたときの処理
function send(){
  console.log("send()");

  if(isSending){
    alert("送信中です。少しお待ち下さい...");
    return;
  }

  var message;
  var lTextBoxValue = $('#textAreaId').val();
  console.log("lTextBoxValue:"+lTextBoxValue);
  // 絵文字削除処理
  lTextBoxValue = replaceEmoji(lTextBoxValue);
  console.log("lTextBoxValue:"+lTextBoxValue);
  if(file == null){
    if(lTextBoxValue == null || lTextBoxValue == ""){
      alert("値を入力してください。")
      return;
    }
    message = "メッセージ「" + lTextBoxValue + "」";
  }else{
    if(lTextBoxValue == null || lTextBoxValue == ""){
      lTextBoxValue = null;
      message = "画像";
    }else{
      message = "画像とメッセージ「" + lTextBoxValue + "」" 
    }
  }
  
  
  
  
  
  
  if(DEBUG == 0){
    var ok = window.confirm(message + "を送信していいですか？");
    if(!ok){
      console.log("キャンセル");
      return;
    }
  }
  
  // 送信中に変更
  isSending = true;
  
  textBoxValue = lTextBoxValue;
  imgName = null;
   
  console.log("送信開始:" + userName);
  
  if(file == null){
    // コメントだけ送信
    console.log("コメントだけ送信:" + textBoxValue);
    socket.json.emit("emit_from_client", { msg:textBoxValue, userName:userName, imgPath:null});
    $('#textAreaId').val(null);   
  }else{

    // 画像がある場合は画像を先に送信する
    console.log("送信するファイル:" + file);
    console.log("実際のファイル名:" + file.name);
    
    // ファイル名を時刻とするため、そのファイル名の作成
    var now = new Date().getTime();
    imgName = now + ".jpeg";
    console.log("sentFileName:" + imgName)
    
    
    var reader = new FileReader();
    
    // 送信するときにrowデータだと大きすぎるため縮小しておくる
    // 幅と高さの大きい方の値
    var maxLength = 1000;
    
    
    reader.onloadend = function (e) {
      console.log("Start onloadened method:");
      var data = e.target.result;
      var orientation = getOrientation(data);
      var rotateAngle = exif_rotate_z_orientation_to_css(orientation);
      console.log("orientation:" + orientation);
      console.log("rotateAngle:" + rotateAngle);
      
      if (!data) {
        return ;
      }
      
      console.log("upload:" + imgName);
      var OrgWidth = document.getElementById('previewImageId').naturalWidth;
      var OrgHeight = document.getElementById('previewImageId').naturalHeight;
      
      var larger = (OrgWidth > OrgHeight) ? OrgWidth : OrgHeight;
      var p = 1.0;
      if(larger > maxLength){
        p = maxLength / larger;
      }
      
      var sentWidth, sentHeight;
      
      // iOSだけ特別な処理が必要
      if(type == 1 && orientation > 4){
        sentWidth = OrgHeight * p;
        sentHeight = OrgWidth * p;
      }else{
        sentWidth = OrgWidth * p;
        sentHeight = OrgHeight * p;
      }
      
      ImgB64Resize(data, sentWidth, sentHeight, rotateAngle,
          function(img_b64) {
            　console.log("画像の縮小が終わったので送信開始:" + imgName);
              socket.emit('upload_from_client', { name : imgName, data : img_b64});
          
              // 送信終了後の処理(本来は完了通知がきてから実施するべき)
              if(DEBUG == 0 || DEBUG == DEBUG_MAX_COUNT){
                $('#previewImageId').attr('src', null ).css('display','none');
                file = null;
                $('#fileId').val(null);
                $('#textAreaId').val(null);
              }
          }
      );
      console.log("upload end:");
      console.log("Finish onloadened method:");
    };
    reader.readAsDataURL(file);
  }
  
  // Resize Base64 Image
  //   imgB64_src: string | "data:image/png;base64,xxxxxxxx"
  //   width     : number | dst img w
  //   height    : number | dst img h
  //   rotate    : number | dst img r 0/90/180/270 only
  // http://qiita.com/stakei1/items/590788e6c9b2f8e6b3d2
  function ImgB64Resize(imgB64_src, width, height, rotate, callback) {
      // Image Type
      var img_type = imgB64_src.substring(5, imgB64_src.indexOf(";"));
      // Source Image
      var img = new Image();
      img.onload = function() {
          // New Canvas
          var canvas = document.createElement('canvas');
          if(rotate == 90 || rotate == 270) {
              // swap w <==> h
              canvas.width = height;
              canvas.height = width;
          } else {
              canvas.width = width;
              canvas.height = height;
          }
          // Draw (Resize)
          var ctx = canvas.getContext('2d');
          if(0 < rotate && rotate < 360) {
              ctx.rotate(rotate * Math.PI / 180);
              if(rotate == 90)
                  ctx.translate(0, -height);
              else if(rotate == 180)
                  ctx.translate(-width, -height);
              else if(rotate == 270)
                  ctx.translate(-width, 0);
          }
          ctx.drawImage(img, 0, 0, width, height);
          // Destination Image
          var imgB64_dst = canvas.toDataURL(img_type);
          callback(imgB64_dst);
      };
      img.src = imgB64_src;
  }
  
}

//  改行を禁止にする処理
$('#textAreaId').bind('keydown', function(e) {
    if (e.which == 13) {
        return false;
    }
}).bind('blur', function() {
    // 貼りつけられたテキストの改行コードを削除
    var $textarea = $(this),
        text = $textarea.val(),
        new_text = text.replace(/\n/g, "");
    if (new_text != text) {
        $textarea.val(new_text);
    }
});