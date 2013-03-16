function ChalogViewer(log,form,pager,infobar){
	this.logid=log,this.formid=form,this.pagerid=pager,this.infobarid=infobar;
}
ChalogViewer.prototype={
	init:function(){
		this.log=document.getElementById(this.logid);
		this.form=document.forms[this.formid];
		this.pager=document.forms[this.pagerid];
		this.line=new HighChatMaker(document.getElementById(this.infobarid));
		
		this.form.addEventListener("submit",this.find.bind(this),false);
		this.pager.addEventListener("click",this.page_move.bind(this),false);
		
		this.mode=null;
		this.query=null;
		
		var socket;
		socket=this.socket=io.connect(settings.SOCKET_HOST_NAME||location.orogin);
		
		socket.on("result",function(data){
			if(data.logs.length){
				this.pager.elements["back"].disabled=this.query.page==0;
				this.pager.elements["forward"].disabled=false;
				while(this.log.firstChild)this.log.removeChild(this.log.firstChild);
				data.logs.reverse().forEach(function(line){
					this.write(line);
				},this);
				if(data.logs.length<this.query.value){
					//もう先がない
					this.pager.elements["forward"].disabled=true;
				}
			}else{
				this.pager.elements["forward"].disabled=false;
			}
		}.bind(this));
		
		this.log.addEventListener('click',this.click.bind(this),false);
		this.form.addEventListener('change', function(e){
			var t = e.target;
			if(t.tagName=="INPUT" && t.type=="text"){
				var elem = this.form.elements["use_"+t.name.slice(0,-6)];
				if(elem){
					if(t.value==""){
						elem.checked=false;
					}else{
						elem.checked=true;
					}
				}
			}
		}.bind(this));
		socket.emit("register",{"mode":"chalog"});
	},
	write:function(obj){
		
		this.log.insertBefore(this.line.make(obj),this.log.firstChild);
		
		
	},
	find:function(e){
		//範囲
		var query={};
		query.value=this.form.elements["page_number"].value-0;
		query.page=0;
		
		var range=this.getRadioValue(this.form,"range");
		if(range=="time"){
			var of=(new Date()).getTimezoneOffset() * 60*1000;	//ミリ秒
			query.starttime=this.form.elements["starttime"].valueAsNumber+of;
			query.endtime=this.form.elements["endtime"].valueAsNumber+of;
		}
		if(this.form.elements["use_name_or_ip"].checked){
			if(this.getRadioValue(this.form,"name_or_ip")=="name"){
				query.name=this.form.elements["name_or_ip_value"].value;
			}else{
				query.ip=this.form.elements["name_or_ip_value"].value;
			}
		}
		if(this.form.elements["use_comment"].checked){
			query.comment=this.form.elements["comment_value"].value;
		}
		if(this.form.elements["use_channel"].checked){
			query.channel=this.form.elements["channel_value"].value;
		}
		this.query=query;
		
		this.sendQuery();
		
		e.preventDefault();
	},
	page_move:function(e){
		if(!this.query)return;
		var t=e.target;
		if(t.type=="button"){
			if(t.name=="back"){
				this.query.page--;
				if(this.query.page<0){
					this.query.page=0;
					return;
				}
				this.sendQuery();
			}else if(t.name=="forward"){
				this.query.page++;
				this.sendQuery();
			}
		}
	},
	sendQuery:function(){
		if(!this.query)return;
		this.socket.emit("query",this.query);
		this.pager.elements["thispage"].value=this.query.page+"ページ目";
	},
	
	getRadioValue:function(form,name){
		var t=form.elements[name];
		if(t&&t.length&&t.item){
			var ret=null;
			for(var i=0,l=t.length;i<l;i++){
				if(t[i].checked){
					ret=t[i].value;
					break;
				}
			}
			return ret;
		}else if(t){
			return t.checked?t.value:null;
		}
		return null;
	},
	click:function(e){
		var t=e.target;
		var dd=document.evaluate('ancestor-or-self::p',t,null,XPathResult.ANY_UNORDERED_NODE_TYPE,null).singleNodeValue;
		if(dd.classList.contains("respto") && dd.dataset.open!="open"){
			//開く
			this.responding_to=dd;
			this.socket.emit("find",{"id":dd.dataset.respto},function(data){
				this.idresponse(data[0]);
			}.bind(this));
			dd.dataset.open="open";
			return;
		}
	},
	idresponse:function(data){
		if(!this.responding_to || !data)return;
		var line=this.line.make(data);
		var bq=document.createElement("blockquote");
		bq.classList.add("resp");
		bq.appendChild(line);

		var r=this.responding_to;
		r.parentNode.insertBefore(bq,r.nextSibling);
		
	},
};
