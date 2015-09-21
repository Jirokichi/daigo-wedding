


/**
 * 画像の向き情報を取得するためのメソッド
 * FileReaderのonloadで読み込まれたe.target.resultを元にorientationを取得するための関数
 * ファイルがjpegでない場合は、1を返す
 * **/
function getOrientation(data){
    var orientation;
    // JPEGの場合には、EXIFからOrientation（回転）情報を取得
      if (data.split(',')[0].match('jpeg')) {
          orientation = getOrientationFromImgDataURL(data);
      }
      // JPEG以外や、JPEGでもEXIFが無い場合などには、標準の値に設定
      return orientation = orientation || 1;
}

// exif情報の画像を取得するためのメソッド(なぜかアプリを通して撮影した場合、1なのに6になる)
function getOrientationFromImgDataURL(imgDataURL){
  console.log("getOrientation start");
  var byteString = window.atob(imgDataURL.split(',')[1]);
  var orientaion = byteStringToOrientation(byteString);
  console.log("getOrientation end");
  return orientaion;

  function byteStringToOrientation(img){
      var head = 0;
      var orientation;
      while (1){
          if (img.charCodeAt(head) == 255 & img.charCodeAt(head + 1) == 218) {break;}
          if (img.charCodeAt(head) == 255 & img.charCodeAt(head + 1) == 216) {
              head += 2;
          }
          else {
              var length = img.charCodeAt(head + 2) * 256 + img.charCodeAt(head + 3);
              var endPoint = head + length + 2;
              if (img.charCodeAt(head) == 255 & img.charCodeAt(head + 1) == 225) {
                  var segment = img.slice(head, endPoint);
                  var bigEndian = segment.charCodeAt(10) == 77;
                  if (bigEndian) {
                      var count = segment.charCodeAt(18) * 256 + segment.charCodeAt(19);
                  } else {
                      var count = segment.charCodeAt(18) + segment.charCodeAt(19) * 256;
                  }
                  var i;
                  for (i=0;i<count;i++){
                      var field = segment.slice(20 + 12 * i, 32 + 12 * i);
                      if ((bigEndian && field.charCodeAt(1) == 18) || (!bigEndian && field.charCodeAt(0) == 18)) {
                          orientation = bigEndian ? field.charCodeAt(9) : field.charCodeAt(8);
                      }
                  }
                  break;
              }
              head = endPoint;
          }
          if (head > img.length){break;}
      }
      return orientation;
  }
}

function exif_orientation_to_css(orientation){
    var style="";
    switch( orientation ){
      case 0: //未定義
        style = "rotateX(  0deg) rotateY(  0deg) rotateZ( 0deg)"; 
        break;
      case 1: //通常
        style = "rotateX(  0deg) rotateY(  0deg) rotateZ( 0deg)"; 
        break;
      case 2: //左右反転
        style = "rotateX(  0deg) rotateY(180deg) rotateZ( 0deg)"; 
        break;
      case 3: //180°回転
        style = "rotateX(  0deg) rotateY(  0deg) rotateZ( 180deg)"; 
        break;
      case 4: //上下反転
        style = "rotateX(180deg) rotateY(  0deg) rotateZ( 0deg)"; 
        break;
      case 5: //反時計回りに90°回転 上下反転
        style = "rotateX(180deg) rotateY(  0deg) rotateZ( -90deg)"; 
        break;
      case 6: //時計回りに90°回転
        style = "rotateX(  0deg) rotateY(  0deg) rotateZ( 90deg)"; 
        break;
      case 7: //時計回りに90°回転 上下反転
        style = "rotateX(180deg) rotateY(  0deg) rotateZ( 90deg)"; 
        break;
      case 8: //反時計回りに90°回転
        style = "rotateX(  0deg) rotateY(  0deg) rotateZ( -90deg)"; 
        break;
    }
    return style;
}

function exif_rotate_z_orientation_to_css(orientation){
    var r="";
    switch( orientation ){
      case 0: //未定義
        r = 0; 
        break;
      case 1: //通常
        r =0;
        break;
      case 2: //左右反転
        r = 0; 
        break;
      case 3: //180°回転
        r = 180;
        break;
      case 4: //上下反転
        r =  0; 
        break;
      case 5: //反時計回りに90°回転 上下反転
        r = -90; 
        break;
      case 6: //時計回りに90°回転
        r = 90; 
        break;
      case 7: //時計回りに90°回転 上下反転
        r = 90; 
        break;
      case 8: //反時計回りに90°回転
        r = -90; 
        break;
    }
    return r;
}


function cal_p(img_width, img_height, window_width, window_height){
  var p = 1.0;
  if(img_width < window_width && img_height < window_height){
    // 幅と高さが両方とも枠内に収まっている場合
    if((window_width - img_width) > (window_height - img_height)){
      // 高さの方が余裕がないため、高さを基準として倍率を算出する
      p = window_height / img_height;
    }else{
      p = window_width  / img_width;
    }
  }else{
    if((window_width - img_width) < 0 && (window_height - img_height) < 0){
      //両方とも画面サイズを超えていた場合
      if((img_width - window_width) > (img_height - window_height)){
        // 幅の方が大きくはみ出している場合、それを枠内にするための処理をする
        p = window_width / img_width;
      }else{
        // 高さの方が大きくはみ出している場合、それを枠内にするための処理をする
        p = window_height  / img_height;
      }
    }else if ((window_width - img_width) < 0){
      // 幅だけはみ出ていた場合
      p = window_width / img_width;
    }else if((window_height - img_height) < 0){
      // 高さだけはみ出ていた場合
      p = window_height / img_height;
    }
  }
  return p;
}