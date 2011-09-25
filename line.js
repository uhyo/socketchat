//https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
if (!Function.prototype.bind) {

  Function.prototype.bind = function (oThis) {

    if (typeof this !== "function") // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be fBound is not callable");

    var aArgs = Array.prototype.slice.call(arguments, 1), 
        fToBind = this, 
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof fNOP ? this : oThis || window, aArgs.concat(Array.prototype.slice.call(arguments)));    
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;

  };

}

function LineMaker(){
}
LineMaker.prototype={
	make:function(obj){
		var df=document.createDocumentFragment();
		var color=this.getColor(obj.ip);
		var dt=el("dt",obj.name);
		if(obj.syslog)dt.classList.add("syslog");
		dt.style.color=color;
		
		df.appendChild(dt);
		var dd=el("dd","");
		var comsp=el("span",obj.comment);
		comsp.classList.add("comment");
		dd.appendChild(comsp);
		var infsp=el("span","(");
		infsp.classList.add("info");
		var date=new Date(obj.time);
		var time=el("time",date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds());
		time.datetime=date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+"T"+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds()+"+09:00";
		
		dd.dataset.id=obj._id;
		if(obj.response){
			dd.dataset.respto=obj.response;
			dd.classList.add("respto");
		}
	
		infsp.appendChild(time);
		infsp.appendChild(document.createTextNode(", "+obj.ip+")"));
		dd.appendChild(infsp);
		dd.style.color=color;
		df.appendChild(dd);
		return df;

		function el(name,text){
			var ret=document.createElement(name);
			ret.textContent=text;
			return ret;
		}
	},
	getColor:function(ip){
		var arr=ip.split(/\./);
		return "rgb("+Math.floor(parseInt(arr[0])*0.75)+", "+
		Math.floor(parseInt(arr[1])*0.75)+", "+
		Math.floor(parseInt(arr[2])*0.75)+")";
	},
}


function HighChatMaker(infobar){
	this.gyoza1_on=null;	//mouseoverがonになっているか
	this.gyozas=["餃子無展開","餃子オンマウス","餃子常時"];
	this.infobar=infobar;
	if(!infobar){
		this.infobar=document.createElement("div");
	}
	this.init();

	this.setGyoza(localStorage.soc_highchat_gyoza ? localStorage.soc_highchat_gyoza : 0);
	
}
HighChatMaker.prototype=new LineMaker();
HighChatMaker.prototype.init=function(){
	//infobar
	while(this.infobar.firstChild)this.infobar.removeChild(this.infobar.firstChild);
	
	this.gyozab=document.createElement("button");
	this.gyozab.textContent=this.gyozas[this.gyoza];
	this.gyozab.classList.add("gyozainfo");
	
	this.gyozab.addEventListener("click",this.gyozabutton.bind(this),false);
	this.infobar.appendChild(this.gyozab);
};
HighChatMaker.prototype.make=function(obj){
	var df=LineMaker.prototype.make.apply(this,arguments);
	var parse=_parse.bind(this);
	
	var dd=df.childNodes.item(1);
	parse(dd);
	return df;
	
	function _parse(node){
		if(node.nodeType==Node.TEXT_NODE){
			//テキストノード
			var v=node.nodeValue;
			var result;
			//[s]の解析
			result=v.match(/^(.*)\[s\](.*?)(\[\/s\].*)?$/);
			if(result){
				var dff=document.createDocumentFragment();
				if(result[1]){
					dff.appendChild(document.createTextNode(result[1]));
				}
				if(result[2]){
					var span=document.createElement("span");
					span.textContent=result[2];
					span.classList.add("s");
					dff.appendChild(span);
				}
				if(result[3]){
					dff.appendChild(document.createTextNode(result[3].slice(4)));
				}
				parse(dff);
				node.parentNode.replaceChild(dff,node);
				return;
			}
			//[small]の解析
			result=v.match(/^(.+)?\[small\](.*?)(\[\/small\].*)?$/);
			if(result){						if(result[1]){
							dff.appendChild(document.createTextNode(result[1]));
						}

				var dff=document.createDocumentFragment();
				if(result[1]){
					dff.appendChild(document.createTextNode(result[1]));
				}
				if(result[2]){
					var span=document.createElement("span");
					span.textContent=result[2];
					span.classList.add("small");
					dff.appendChild(span);
				}
				if(result[3]){
					dff.appendChild(document.createTextNode(result[3].slice(8)));
				}				parse(dff);
				node.parentNode.replaceChild(dff,node);
				return;
			}
			//URLの解析
			if(!node.parentNode || node.parentNode.nodeName.toLowerCase()!="a"){
				result=v.match(/^(.*?)(https?:\/\/\S+)(.*)$/);
				if(result){
					var dff=document.createDocumentFragment();
					if(result[1]){
						dff.appendChild(document.createTextNode(result[1]));
					}
					var result2=result[2].match(/^http:\/\/gyazo\.com\/([0-9a-f]{32})(?:\.png)?(.*)$/);
					if(result2){
						//[Gyazo]
						var a=document.createElement("a");
						a.target="_blank";
						a.href="http://gyazo.com/"+result2[1]+".png";
						a.classList.add("gyoza");
						if(this.gyoza==2){
							//餃子常時展開
							var img=document.createElement("img");
							img.src="http://img.gyazo.com/a/"+result2[1]+".png";
							img.classList.add("thumbnail");
							a.appendChild(img);
						}else{
							a.textContent="[Gyazo]";
						}
						dff.appendChild(a);
						if(result2[2]){
							dff.appendChild(document.createTextNode(result2[2]));
						}
					}else{
					
						if(result[2]){
							var a=document.createElement("a");
							a.target="_blank";
							a.href=result[2];
							a.textContent=result[2];
							dff.appendChild(a);
						}
					}
					if(result[3]){
						dff.appendChild(document.createTextNode(result[3]));
					}
					parse(dff);
					node.parentNode.replaceChild(dff,node);
					return;
				}
				
				if(result=v.match(/^(.*)#(\d{4})(.*)$/)){
					var dff=document.createDocumentFragment();
					if(result[1]){
						dff.appendChild(document.createTextNode(result[1]));
					}
					if(result[2]){
						var a=document.createElement("a");
						a.target="_blank";
						a.href="http://81.la/"+result[2];
						a.textContent="#"+result[2];
						dff.appendChild(a);
					}
					if(result[3]){
						dff.appendChild(document.createTextNode(result[3]));
					}
					parse(dff);
					node.parentNode.replaceChild(dff,node);
					return;
				}
				
			}
		}else if(node.childNodes){
			var nodes=[];
			for(var i=0,l=node.childNodes.length;i<l;i++){
				nodes.push(node.childNodes[i]);
			}
			nodes.forEach(function(x){
				if(x.parentNode.isSameNode(node))
					parse(x);
			});
		}
	}
};
HighChatMaker.prototype.setGyoza=function(gyoza){
	this.gyoza=localStorage.soc_highchat_gyoza=gyoza%this.gyozas.length;
	this.gyozab.textContent=this.gyozas[this.gyoza];

	if(this.gyoza==1 && !this.gyoza1_on){
		this.gyoza1_on=this.gyozamouse.bind(this);
		document.addEventListener("mouseover",this.gyoza1_on,false);
	}else if(this.gyoza!=1 && this.gyoza1_on){
		document.removeEventListener("mouseover",this.gyoza1_on,false);
		this.gyoza1_on=null;
	}
};
HighChatMaker.prototype.gyozabutton=function(e){
	this.setGyoza(this.gyoza+1);
};
HighChatMaker.prototype.gyozamouse=function(e){
	var t=e.target;
	if(t.classList.contains("gyoza")){
		var result=t.href.match(/^http:\/\/gyazo\.com\/([0-9a-f]{32})\.png$/);
		if(!result)return;
		var img=document.createElement("img");
		img.src="http://img.gyazo.com/a/"+result[1]+".png";
		
		img.addEventListener("load",ev,false);
		img.style.display="none";
		t.textContent="[Gyoza...]";
		t.appendChild(img);
	}
	
	function ev(e){
		t.removeChild(t.firstChild);
		img.style.display="";
	}
};
