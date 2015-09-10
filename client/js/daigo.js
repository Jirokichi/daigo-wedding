

<!--[if IE]><script type="text/javascript" src="excanvas.js"></script><![endif]-->

var DEBUG = true;

var textField = null;
var hasTextbox = false;
var textFieldX = document.offsetWidth/2;
var textFieldY = document.offsetHeight/2;
var textFieldID = "textField";
var addText = false;


var WINDOW_WITDH;
var WINDOW_HEIGHT;


// function onMyBlur(){
//   console.log("キーボードとじたね:" + addText);
//   if(addText){
//     alert("キーボードとじたね:" + addText);
//     addText = false;
//   }
// }

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

$('#file').change(
  function() {
    console.log("onChangeFile");
    if ( !this.files.length ) {
        return;
    }
  
    var file = $(this).prop('files')[0];
    var fr = new FileReader();
    fr.onload = function() {  
      $('#previewImage').attr('src', fr.result ).css('display','inline');
    }
    fr.readAsDataURL(file);
    
    
    // 新しいテキストを追加
    var image = document.getElementById('#previewImage'); 
    // 画面中央に配置（本当は降ってくるようにしたい）
    var x_image = WINDOW_WITDH/2 - $("#previewImage").clientWidth/2;
    var y_image = WINDOW_HEIGHT/2 - $("#previewImage").clientHeight/2;
    console.log("WINDOW_WITDH:" + WINDOW_WITDH);
    console.log("WINDOW_HEIGHT:" + WINDOW_HEIGHT);
    
    console.log("x_image:" + x_image);
    console.log("y_image:" + y_image);
    image.style.left = x_image;//"15px";//
    image.style.top = y_image;//"150px";//
  }
);


// function draw() {
//   /* canvas要素のノードオブジェクト */
//   var canvas = document.getElementById('canvasTouchRangeId');
//   /* canvas要素の存在チェックとCanvas未対応ブラウザの対処 */
//   if ( ! canvas || ! canvas.getContext ) {
//     return false;
//   }
  
  
//   // canvas.style.width = window.innerWidth;
//   // canvas.style.height = window.innerHeight * 3/4;
  
//   /* 2Dコンテキスト */
//   var ctx = canvas.getContext('2d');
//   /* 四角を描く */
//   ctx.strokeRect(5, 5, 520, 120)
//   // ctx.beginPath();
//   // ctx.moveTo(5, 5);
//   // ctx.lineTo(window.innerWidth - 5, 5);
//   // ctx.lineTo(window.innerWidth - 5, window.innerHeight - 5);
//   // ctx.lineTo(5, window.innerHeight - 5);
//   // ctx.closePath();
//   // ctx.stroke();
// }


// 読み込み終了時に呼び出されるイベント
// $("body").on(
//   function(){
//     console.log("body onLoad")
    
    
    
    
//   }
// );



onload = function() {
  console.log("onload");
  // body
  WINDOW_WITDH = window.innerWidth;//$("body").width();
  WINDOW_HEIGHT = window.innerHeight;//$("body").height();

  
  console.log("width:" + WINDOW_WITDH);
  console.log("height:" + WINDOW_HEIGHT);
  
  // draw();
};