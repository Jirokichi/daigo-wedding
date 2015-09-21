

<!--[if IE]><script type="text/javascript" src="excanvas.js"></script><![endif]-->

var DEBUG = true;
var KEY_USERNAME = "KEY_NAME"; /*　top.jsでも同じものである必要がある・ユーザ名を保存するためのキー */


var textField = null;
var hasTextbox = false;
var textFieldX = document.offsetWidth/2;
var textFieldY = document.offsetHeight/2;
var textFieldID = "textField";
var addText = false;

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

window.onerror = function(error) {
    alert(error);
};

function onMyBlur(){
  console.log("onMyBlur()");
}

// ファイルを選択したときに呼び出されるメソッド
$('#file').change(
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
        alert("orientation: " + orientation + "(iOS)");
        orientation = 1;
      }else{
        alert("orientation:" + orientation);
      }
      
      var rotateStyle = exif_orientation_to_css(orientation);
      
      console.log("rotateStyle:" + rotateStyle)
      $('#previewImage').attr('src', fr.result ).css("transform", rotateStyle).css('display','inline').load(function(){
        //テキストボックスのフィールドには画像が被らないようにする必要があるため、その高さを取得
        var textElementHeight = document.getElementById('div_box_id').scrollHeight;
        var OrgWidth = document.getElementById('previewImage').naturalWidth;
        var OrgHeight = document.getElementById('previewImage').naturalHeight;
        console.log("textElementHeight:" + textElementHeight);
        console.log("OrgWidth:" + OrgWidth);
        console.log("OrgHeight:" + OrgHeight);
         
        // 新しい画像を追加
        var image = document.getElementById('previewImage'); 
        
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

  
  
  var textBoxValue = $('#textBox').val();
  console.log("textBoxValue:"+textBoxValue);
  console.log("createNewText:" + document.getElementById(textFieldID));
  if(textBoxValue == null || textBoxValue == ""){
    alert("値を入力してください。")
    return;
  }
  if(textField != null){
    console.log("すでに送信候補文字が画面に表示されています。送信したい場合は上部に移動させてください。");
    alert("すでに送信候補文字が画面に表示されています。送信したい場合は上部に移動させてください。")
    return;
  }
  
  var ok = window.confirm("送信していいですか？");
  if(!ok){
    console.log("キャンセル");
    return;
  }
  
  // 文字の送信処理
  console.log("送信開始:" + userName);
  var socket = io.connect();
  socket.json.emit("emit_from_client", { msg:textBoxValue, userName:userName, imgPath:"test.png"});
  console.log("送信終了");
  
  // 画像の送信
  console.log("file:");
  console.log(file);
  if(file != null){
    console.log("ファイル読み込みあり");
    var name = file.name;
    var reader = new FileReader();
    console.log("name:" + name);
    var maxLength = 1000;
    reader.onloadend = function (e) {
      var data = e.target.result;
      var orientation = getOrientation(data);
      var rotateAngle = exif_rotate_z_orientation_to_css(orientation);
      console.log("orientation:" + orientation);
      console.log("rotateAngle:" + rotateAngle);
      
      if (!data) {
        return ;
      }
      console.log("upload:" + name);
      
      var OrgWidth = document.getElementById('previewImage').naturalWidth;
      var OrgHeight = document.getElementById('previewImage').naturalHeight;
      
      var larger = (OrgWidth > OrgHeight) ? OrgWidth : OrgHeight;
      var p = 1.0;
      if(larger > maxLength){
        p = maxLength / larger;
      }
      
      var sentWidth, sentHeight;
      if(type == 1 && orientation > 4){
        sentWidth = OrgHeight * p;
        sentHeight = OrgWidth * p;
      }else{
        sentWidth = OrgWidth * p;
        sentHeight = OrgHeight * p;
      }
      ImgB64Resize(data, sentWidth, sentHeight, rotateAngle,
          function(img_b64) {
              socket.emit('upload_from_client', { name : name, data : img_b64});
          }
      );
      console.log("upload end:");
      
      // 送信終了後の処理(本来は完了通知がきてから実施するべき)
      $('#previewImage').attr('src', null ).css('display','none');
      file = null;
      $('#file').val(null);
      $('#textBox').val(null);
      
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




/**********************************************
 *  これ以下は利用していない
 **********************************************/
/**
 * テキストを一度プレビューする場合に利用する
 * コメント：プレビューは画像のみにし、送信ボタンをタップしたらかならずそのメッセージを送信するようにする。
 * */
function createNewText(){

  var textBoxValue = $('#textBox').val();
  console.log("textBoxValue:"+textBoxValue);
  console.log("createNewText:" + document.getElementById(textFieldID));
  if(textBoxValue == null || textBoxValue == ""){
    alert("値を入力してください。")
    return;
  }
  if(textField != null){
    console.log("a");
    alert("すでに送信候補文字が画面に表示されています。送信したい場合は上部に移動させてください。")
    return;
  }
  
  addText = true;
  
  // textBoxからフォーカスを外す
  $("textBox").blur();
  
  // 新しいテキストを追加
  textField = document.createElement('div'); 
  textField.id = "textFieldID";
  textField.innerHTML = textBoxValue;
  textField.style.position = "absolute";
  // textField.style.zIndex = "2";
  textField.style.fontSize = "2em";
  var objBody = document.getElementsByTagName("body").item(0); 
  objBody.appendChild(textField); 
  if(DEBUG)textField.style.border = "1px solid #915";
  
  // 画面中央に配置（本当は降ってくるようにしたい）
  console.log("window.innerWidth/2:"+WINDOW_WITDH/2);
  console.log("window.innerHeight/2:"+WINDOW_HEIGHT/2);
  console.log("textField.clientWidth/2:"+textField.clientWidth/2);
  console.log("textField.clientHeight/2:"+textField.clientHeight/2);
  
  // var b = $("div_box_id")div_box_id.style;
  // console.log('コンテンツ本体：' + b.height + '×' + b.width);
  // console.log('内部余白込み：' + b.innerHeight() + '×' + b.innerWidth());
  // console.log('枠線込み：' + b.outerHeight() + '×' + b.outerWidth());
  // console.log('外部余白込み：' + b.outerHeight(true) + '×' + b.outerWidth(true));
  textFieldX = textField.style.left = WINDOW_WITDH/2 - textField.clientWidth/2;
  textFieldY = textField.style.top = WINDOW_HEIGHT/2 - textField.clientHeight/2 - 100;
  
  // position: absolute; z-index: 2; VISIBILITY: visible; TOP: 150px; LEFT: 15px; width:1;"
  
  
  
  
  if(window.TouchEvent){
    	console.log("タッチイベントに対応");
        
        
    // イベントリスナーに対応している
    if(document.addEventListener){
      console.log("イベントリスナーに対応している");
    	// ------------------------------------------------------------
    	// タッチすると実行される関数
    	// ------------------------------------------------------------
    	function TouchEventFunc(e){
        	console.log("TouchEventFunc:" + e + "(" + e.clientX + ", " + e.clientY + ")");
        	// TouchList オブジェクトを取得
        	var touch_list = e.changedTouches;
        			
          var currentPositionX = e.changedTouches[0].pageX;
          var currentPositionY = e.changedTouches[0].pageY;
        	
        	if(currentPositionY > WINDOW_HEIGHT * 4/5){
        	  currentPositionY = WINDOW_HEIGHT * 4 /5;
        	}else if(currentPositionY < WINDOW_HEIGHT * 1/5){
            
            alert("「" + textField.innerHTML + "」が送信されました！");
            
            var objBody = document.getElementsByTagName("body").item(0); 
            objBody.removeChild(textField);
            textField = null;
            
            
            
          }
        	textField.style.left = currentPositionX - textField.clientWidth/2;
          textField.style.top  = currentPositionY - textField.clientHeight/2 ;
          
          // alert("textField.clientWidth:" + textField.clientWidth);
      }
    
      var PC = false;
      if(PC){
        // document.addEventListener("click",TouchEventFunc);
        document.addEventListener("mousedown",TouchEventFunc);
      }else{
        // タッチを開始すると実行されるイベント
    	  document.addEventListener("touchstart",TouchEventFunc);
    
    		// タッチしたまま平行移動すると実行されるイベント
    		document.addEventListener("touchmove",TouchEventFunc);
    
    		// タッチを終了すると実行されるイベント
    		document.addEventListener("touchend",TouchEventFunc);
      }
    }else{
      console.log("イベントリスナーに対応していない");
    }
    }else{
    console.log("タッチイベントに未対応");
    }

}