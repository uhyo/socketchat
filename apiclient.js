//API通信
function APIConnection(){
	ChatConnection.apply(this,arguments);
}
APIConnection.prototype=new ChatConnection;
APIConnection.prototype.init=function(){
	//タイマー
	this.timerid=setInterval(this.check.bind(this),10000);
	//フラグ 既に最初のログを受信したか
	this.init_flg=false;
	//リクエスト先
	this.requestto= settings.SOCKET_HOST_NAME || "";
	this.sessionid=null;	//自分でも持っている
};
//サーバーへリクエストを送る
APIConnection.prototype.send=function(path,query,callback){
	var http=new XMLHttpRequest();
	if(!query)query={};
	if(!callback)callback=this.normalresponse.bind(this);
	
	http.onload = function(){
		if(this.status==200){
			//console.log(JSON.parse(this.responseText));
			callback(JSON.parse(this.responseText));
		}
	};
	var res=[];
	for(var i in query){
		res.push(encodeURIComponent(i)+"="+encodeURIComponent(query[i]));
	}
	if(this.sessionid){
		res.push("sessionId="+this.sessionid);
	}
	//console.log(path+(res.length? "?"+res.join("&"):""));
	http.open("get",this.requestto+path+(res.length? "?"+res.join("&"):""));
	http.send();
};
//サーバーからの応答
APIConnection.prototype.normalresponse=function(obj){
	var t=this;
	if(obj.error){
		console.error(obj.errormessage);
		return;
	}
	if(!this.init_flg){
		//最初のログだ
		if(obj.sessionid){
			//idセット
			this.$emit("sessionid",obj.sessionid);
		}
		em("init",obj);
		this.init_flg=true;
	}else{
		//たまっているログを受信した
		obj.logs.reverse().forEach(function(x){
			em("log",x);
		},this);
	}
	if(obj.sessionid)this.sessionid=obj.sessionid;
	
	if(obj.inout){
		em("userinfo",obj.inout);
	}
	obj.userinfos.forEach(function(x){
		switch(x.name){
		case "newuser":
			em("newuser",x.user);
			break;
		case "deluser":
			em("deluser",x.id);
			break;
		case "inout":
			em("inout",x.user);
			break;
		case "users":
			em("users",x.users);
			break;
		}
	},this);
	
	function em(){
		t.$emit.apply(t,arguments);
	}
};
APIConnection.prototype.check=function(){
	//サーバーに更新を確認する
	this.send("/api/");
};
APIConnection.prototype.register=function(lastid,channel){
	this.check();
};
APIConnection.prototype.emit=function(name){
	var args=Array.prototype.slice.call(arguments,1);	//emitのパラメータ
	switch(name){
		case "say":
			//発言
			var obj=args[0];
			this.send("/api/say",obj);
			break;
		case "inout":
			var obj=args[0];
			this.send("/api/inout",obj);
			break;
		case "find":
			//JSONで送る
			var query=args[0], cb=args[1];
			//send!
			this.send("/api/find",{query:JSON.stringify(query)},function(data){
				cb(data);
			});
			break;
		case "users":
			var cb=args[0];
			this.send("/api/users",null,function(data){
				cb(data);
			});
			break;
	}
};
function APIChat(){
	ChatClient.apply(this,arguments);
	
}
APIChat.prototype=new ChatClient;
APIChat.prototype.useConnection=function(){
	return APIConnection;
};
