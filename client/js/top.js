<!--[if IE]><script type="text/javascript" src="excanvas.js"></script><![endif]-->

var KEY_USERNAME = "KEY_NAME"; <!--　このキーはdaigo.jsでも同じものである必要がある -->
var LINK = 'daigo.html';

function submit(){
    console.log("submit()");
    var name = $("#topPageTextFieldID").val();
    console.log("name:" + name);
    if(name == null || name == ""){
        alert("名前が不適切です。");
        return;
    }
    localStorage.setItem(KEY_USERNAME,name);
    setTimeout( redirectLink(), 0);
}

document.body.onload = function(){
    console.log("onload");
    var name = localStorage.getItem(KEY_USERNAME);
    console.log("name:" + name);
    // $("#topPageTextFieldID").val(name);
    
    if(name != null && name != ""){
        // すでに入力したことがあるということ
        $("#topPageTextFieldID").val(name);
        // setTimeout( redirectLink(), 0);
    }
}

function redirectLink(){
    location.href=LINK;
}