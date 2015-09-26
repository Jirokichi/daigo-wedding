

<!--[if IE]><script type="text/javascript" src="excanvas.js"></script><![endif]-->

var DEBUG = true;
var KEY_USERNAME = "KEY_NAME"; /*　top.jsでも同じものである必要がある・ユーザ名を保存するためのキー */



var WINDOW_WITDH;
var WINDOW_HEIGHT;

var userName = localStorage.getItem(KEY_USERNAME);
console.log("start daigo.js");
console.log("userName:" + userName);
console.log("navigator.userAgent:" + navigator.userAgent);

var type = 0;// iPad/iPhoneの場合は1となるようにする
if(navigator.userAgent.indexOf("iPad") > 0 || navigator.userAgent.indexOf("iPhone") > 0){
  type = 1;
  // alert("iOS!");
}

var file = null;
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
};


var timer = false;
$(window).resize(function() {
    if (timer !== false) {
        clearTimeout(timer);
    }
    timer = setTimeout(function() {
        console.log('resized');
        WINDOW_WITDH = window.innerWidth;//$("body").width();
        WINDOW_HEIGHT = window.innerHeight;//$("body").height();
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
        var OrgWidth = image.naturalWidth;
        var OrgHeight = image.naturalHeight;
        console.log("textElementHeight:" + textElementHeight);
        console.log("OrgWidth:" + OrgWidth);
        console.log("OrgHeight:" + OrgHeight);
         
        
        
        // 表示する画像サイズを調整する
        var p = 1.0;
        
        // テキストボックス分縦の範囲は狭くなる
        var DIFF_HEIGHT = WINDOW_HEIGHT - textElementHeight;
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
        var y_image = (WINDOW_HEIGHT - image.height - textElementHeight ) / 2;
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



// 送信ボタンがクリックされたときの処理
function send(){
  console.log("send()");

  var message;
  var textBoxValue = $('#textAreaId').val();
  console.log("textBoxValue:"+textBoxValue);
  if(file == null){
    if(textBoxValue == null || textBoxValue == ""){
      alert("値を入力してください。")
      return;
    }
    message = "メッセージ「" + textBoxValue + "」";
  }else{
    if(textBoxValue == null || textBoxValue == ""){
      textBoxValue = null;
      message = "画像";
    }else{
      message = "画像とメッセージ「" + textBoxValue + "」" 
    }
  }
  
  
  
  var ok = window.confirm(message + "を送信していいですか？");
  if(!ok){
    console.log("キャンセル");
    return;
  }
  
  var imgName = null;
  if(file != null){
    var now = new Date().getTime();
    imgName = now + "jpeg";
    console.log("sentFileName:" + imgName)
  }
   
  console.log("送信開始:" + userName);
  var socket = io.connect();
  if(file == null){
    // コメントだけ送信
    console.log("コメントだけ送信:" + textBoxValue);
    socket.json.emit("emit_from_client", { msg:textBoxValue, userName:userName, imgPath:null});
    $('#textAreaId').val(null);
    console.log("送信終了");
  }else{
    // 画像がある場合は画像を先に送信する
    console.log("送信するファイル:" + file);
    console.log("実際のファイル名:" + file.name);
    
    // ファイル名を時刻とするため、そのファイル名の作成
    var now = new Date().getTime();
    var imgName = now + ".jpeg";
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
            　console.log("画像の縮小が終わったので送信開始");
              socket.emit('upload_from_client', { name : imgName, data : img_b64});
              
              console.log("メッセージの送信開始");
              socket.json.emit("emit_from_client", { msg:textBoxValue, userName:userName, imgPath:imgName});
              
              // 送信終了後の処理(本来は完了通知がきてから実施するべき)
              $('#previewImageId').attr('src', null ).css('display','none');
              file = null;
              $('#fileId').val(null);
              $('#textAreaId').val(null);
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