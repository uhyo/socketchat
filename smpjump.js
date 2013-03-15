if ((navigator.userAgent.indexOf('iPhone') > 0)||(navigator.userAgent.indexOf('iPod') > 0)||(navigator.userAgent.indexOf('Android') > 0)||(navigator.userAgent.indexOf('Mobile') > 0)){
	if (window.location.search == "?switching"){
	   location.replace("/smp");
	}else{
		window.onload = function(){
			var infobar = document.getElementById('infobar');
			var smplink_a = document.createElement('a');
			smplink_a.href = '/smp';
			var smplink_text = document.createTextNode('SmartPhoneUI');
			infobar.appendChild(smplink_a).appendChild(smplink_text);
		}
	}
}
