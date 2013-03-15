//コマンドライン風
function CommandLineChat(log,info,con,fnd){
	var infobar=document.createElement("div");
	infobar.id="aaaaaaaaa____aa_a_a_a_a_a_a_a___aa_a";	//?????
	SocketChat.call(this,log,info,infobar.id);
	
	this.consoleid=con;
	this.findlogid=fnd;
	this.cmode="down";	//新しいログは上へ
	
	this.commandlog=[];	// コマンド履歴
	this.commandlogindex=null;	//basho
	
	this.process=null;	//プロセス数
//	this.accept=true;//プロセスの入力

	this.autoin_flg=false;	//autoin処理が行われたかどうか
}
CommandLineChat.prototype=new SocketChat;
//HottoMottoボタンやフォームは表示しない
CommandLineChat.prototype.prepareHottoMottoButton=function(){};
CommandLineChat.prototype.prepareForm=function(){};
CommandLineChat.prototype.init=function(){
	SocketChat.prototype.init.apply(this);
	
	this.findlog=document.getElementById(this.findlogid);
	
	//コンソールを準備
	this.console=document.getElementById(this.consoleid);
	this.consoleo=this.console.getElementsByClassName("consoleoutput")[0];
	this.command=document.createElement("input");
	var p=document.createElement("p");
	this.commandtopelement=document.createElement("span");
	this.commandtopelement.textContent="> ";
	p.appendChild(this.commandtopelement);
	p.appendChild(this.command);
	if(this.cmode=="up"){
		//上へ進む
		this.console.insertBefore(p,this.consoleo);
	}else{
		this.console.appendChild(p);
	}
	this.console.addEventListener("click",function(e){
		this.cfocus();
	}.bind(this),false);
	if(localStorage.consoleheight)this.setConsoleHeight();
	
	// コンソール環境
	var focus=false;
	
	document.addEventListener("keydown",keydown.bind(this),false);
	this.command.addEventListener("focus",function(){focus=true},false);
	this.command.addEventListener("blur",function(){focus=false},false);
	
	this.indentSpace="";	//インデント用
	//移動用フォーム
	this.form=document.createElement("form");
	this.form.method="get";
	this.form.target="_blank";
	
	function keydown(e){
		//起動中のプロセスがあればプロセスに送る
		if(this.process && this.process.key){
			if(!this.process.key(e))return;
		}
		if(this.process && !this.process.key)return;
		if(e.keyCode==13 || e.keyCode==27){
			//Enter,Esc
			if(!this.console.classList.contains("open")){
				//開く
				this.openConsole();
			}else if(this.command.value==""){
				this.closeConsole();
				return;
			}
		}
		if(e.keyCode==13 && !this.process){
			this.doCommand(this.command.value);
			this.command.value="";
			this.cfocus();
			return;
		}
/*		if(focus && this.process>0 && !this.accept){
			e.preventDefault();
			return;
		}*/
		//コマンド履歴
		if(focus && (e.keyCode==38 || e.keyCode==40)){
			//上下
			if(this.commandlogindex==null){
				this.commandlogindex=this.commandlog.length-1;
			}else if(e.keyCode==38){
				this.commandlogindex--;
				if(this.commandlogindex<0)this.commandlogindex=0;
			}else{
				this.commandlogindex++;
				if(this.commandlogindex>=this.commandlog.length)this.commandlogindex=this.commandlog.length-1;
			}
			if(this.commandlog[this.commandlogindex]){
				this.command.value=this.commandlog[this.commandlogindex];
			}
		}
	}
};
CommandLineChat.prototype.openConsole=function(){
	this.console.classList.add("open");
	this.cfocus();
};
CommandLineChat.prototype.closeConsole=function(){
	this.console.classList.remove("open");
	this.command.blur();
};
//コマンドを解析する
CommandLineChat.prototype.doCommand=function(str){
	var result;
	var syschar=localStorage.syschar || "\\";
	result=str.match(new RegExp("^\\"+syschar+"(\\S+)(?:\\s+)?"));
	if(!result){
		//通常の発言
		if(str){
			this.say(str);
		}
		return;
	}
	//履歴
	this.commandlog.push(str);
	this.commandlogindex=null;
	
	this.cprint("> "+str);
	//コマンド文字列から命令及びスペースを除去
	str=str.slice(result[0].length);
	if(!this.commands[result[1]]){
		this.cprint(result[1]+": No such command");
		return;
	}
	//result[1]がコマンド名
	this.commands[result[1]](new CommandLineChat.Process(this,str));
};
CommandLineChat.prototype.chideinput=function(){
	this.command.disabled=true;
	this.command.parentNode.hidden=true;
};
CommandLineChat.prototype.copeninput=function(topstr){
	if(topstr!=null){
		this.commandtopelement.textContent=topstr ? topstr+" " : "";
	}
	this.command.disabled=false;
	this.command.parentNode.hidden=false;

};
//コマンドのプロセスを管理するオブジェクト
CommandLineChat.Process=function(chat,arg){
	this.chat=chat;
	this.arg=arg;	//arg: コマンドに渡された引数
	
	this.chat.chideinput();
	
	chat.process=this;
	this.saves=[];
}
CommandLineChat.Process.prototype={
	//このプロセスに渡された引数を配列に分けて返す
	parse:function(str,maxlen){
		var ret=[],opt=[],result;
		if(!maxlen)maxlen=1/0;
		while(str && ret.length+1<maxlen){
			result=str.match(/^\s*([^\"\s]+)\s*/);
			if(result){
				if(/^-/.test(result[1])){
					opt.push(result[1]);
				}else{
					ret.push(result[1]);
				}
				str=str.slice(result[0].length);
				continue;
			}
			result=str.match(/^\s*\"((?:\\\"|[^\"])+)\"\s*/);
			if(result){
				ret.push(result[1].replace(/\\\"/g,"\""));
				str=str.slice(result[0].length);
				continue;
			}
			break;
		}
		if(str){
			ret.push(str);
		}
		return {
			arg:ret,
			opt:opt,
		};
	},
	//プロセスからコンソールへ出力
	put:function(str,option){
		this.chat.cput(str,option);
	},
	print:function(str,option){
		this.chat.cprint(str,option);
	},
	//内部をインデントして表示
	indent:function(num,callback){
		this.chat.indent(num,callback);
	},
	//行削除(num:後ろから何行消すか 省略:全部消す)
	deletelines:function(num){
		if(num==null){
			this.chat.consoleo.textContent="";
			return;
		}
		//囲むRange
		var range=document.createRange();
		range.selectNodeContents(this.chat.consoleo);	//いったん中身を全部囲っておく
		for(var i=0;i<num;i++){
			//後ろから改行を見つけていく
			//this.chat.consoleo.textContent=this.chat.consoleo.textContent.replace(/.*\n?$/,"");
			var cs=this.chat.consoleo.childNodes;
			for(var j=cs.length-1;j>=0;j--){
				var node=cs[j];
				var iii=node.textContent.lastIndexOf("\n");
				if(iii>=0){
					//改行を見つけたのでそこまで取り除く
					range.setStart(node,iii);	//改行の直前から
					range.deleteContents();	//Rangeのおわりは一番最後になっている
					break;
				}
			}
			//もう改行がない
			this.chat.consoleo.textContent="";
			break;
		}
		range.detach();
	},
	//新しいコンテキスト（出力フィールドを空にする）
	newContext:function(){
		var range=document.createRange();
		range.selectNodeContents(this.chat.consoleo);
		this.saves.push(range.extractContents());
		this.chat.consoleo.textContent="";
		range.detach();
	},
	//もとに戻す
	restoreContext:function(){
		this.chat.consoleo.textContent="";
		this.chat.consoleo.appendChild(this.saves.pop());
	},
	//行単位で入力 結果はコールバック
	input:function(cb){
		//複数行対応
		this.chat.copeninput("");	//入力できる状態にする
		var result=""
		//入力を受け付けるリスナ
		this.key=function(e){
			if(e.keyCode==13){
				//Shift+Enter
				this.print(this.chat.command.value);
				result+=this.chat.command.value+"\n";
				//入力を上に表示して次の行に移る
				this.chat.command.value="";
				this.chat.cfocus();
				if(!e.shiftKey){
					//終了
					//（最後に改行を含む系）
					this.chat.chideinput();
					this.key=null;	//入力受付解除
					cb(result);
				}
			}
		}.bind(this);
	},
	//キーひとつを受け付ける入力 trueを返すと続行
	getkey:function(cb){
		this.chat.copeninput("");
		this.key=function(e){
			e.preventDefault();
			if(!cb(e)){
				//this.chat.chideinput();
				this.key=null;
			}
			return false;
		}.bind(this);
	},
	//プロセス終了 通常モードに戻す
	die:function(chat){
		this.chat.process=null;
		this.chat.copeninput(">");
	},
	//松尾の改行
	chomp:function(str){
		return str.replace(/\n+$/,"");
	},
};

//実効できるコマンド
CommandLineChat.prototype.commands=(function(){
	var obj={};
	obj["in"]=function(process){
		//入室
		var pr=process.parse(process.arg);
		var str=pr.arg[0];	//名前
		var oauto=pr.opt.indexOf("--auto")>=0;	// autoオプション
		if(!str && oauto){
			// autoフラグ解除
			localStorage.removeItem("socketchat_autoin");
			process.die();
			return;
		}
		//既に入室している
		if(process.chat.me.rom===false){
			process.print("You are already in the room.");
			process.die();
			return;
		}
		if(str=pr.arg[0]){
			localStorage.socketchat_name=str;
			if(oauto){
				// 次から自動入室
				localStorage.socketchat_autoin=str;
			}
		}
		//入室する
		process.chat.inout_notify(str ? str : localStorage.socketchat_name);
		process.die();
	};
	obj.out=function(process){
		//退室
		if(process.chat.me.rom===true){
			process.print("You are not in the room.");
			process.die();
			return;
		}
		var str;
		if(str=process.arg){
			//次回の名前を設定できる（いるのだろうか）
			localStorage.socketchat_name=str;
		}
		process.chat.inout_notify(str ? str : localStorage.socketchat_name);
		process.die();
	};
	obj.motto=function(process){
		//HottoMotto要求
		if(process.arg){
			//日時指定（この日時まで読み込む）
			var pr=process.parse(process.arg);
			var until=new Date(pr.arg[0]).getTime();
			if(!isNaN(until)){
				if(!(pr.opt.indexOf("--gmt")>=0 || pr.opt.indexOf("--utc")>=0)){
					//ローカルで書いてあるからずらす
					until+=(new Date).getTimezoneOffset()*60000
				}
				process.chat.HottoMotto(until);
				process.die();
				return;
			}
		}
		//通常のmotto（一定数読み込み）
		process.chat.HottoMotto();
		process.die();
	};
	obj.volume=function(process){
		//ボリューム変更
		if(process.arg){
			var vo=parseInt(process.arg);
			if(isNaN(vo) || vo<0 || 100<vo){
				process.print("volume: invalid volume "+process.arg);
			}else{
				localStorage.soc_highchat_audiovolume=vo;
				process.chat.setVolume(vo/100);
			}
		}else{
			//現在のボリュームを表示
			process.print(localStorage.soc_highchat_audiovolume);
		}
		process.die();
		
	};
	obj.set=function(process){
		//設定
		var args=process.parse(process.arg,2).arg;
		switch(args[0]){
		case "syschar":case "systemchar":	//命令文字
			if(args[1].length!=1){
				process.print("set "+args[0]+": invalid char "+args[1]);
				break;
			}
			localStorage.syschar=args[1];
			break;
		case "height":	//コンソール高さ
			if(isNaN(args[1]) || parseInt(args[1])<0){
				process.print("set "+args[0]+": invalid value "+args[1]);
				break;
			}
			localStorage.consoleheight=args[1]+"em";
			process.chat.setConsoleHeight();
			break;
		default:
			process.print("set: unknown settings: "+args[0]);
			break;
		}
		process.die();
	};
	obj.gyazo=obj.gyoza=function(process){
		//餃子設定
		if(process.arg){
			vo=parseInt(process.arg);
			if(isNaN(vo) || vo<0 || 2<vo){
				process.print("gyazo: invalid value "+process.arg);
			}else{
				localStorage.soc_highchat_gyoza=vo;
			}
		}
		["餃子無展開","餃子オンマウス","餃子常時"].forEach(function(x,i){
			process.put((localStorage.soc_highchat_gyoza==i ? "*"+i : i+" "),{color:"#00ffff"});
			process.print(": "+x);
		});
		process.die();
	};
	obj.clean=obj.clear=function(process){
		//コンソール掃除
		var spc=process.chat.command.parentNode;
		process.chat.consoleo.textContent="";
		process.chat.console.appendChild(spc);
		process.die();
	};
	obj.help=function(process){
		process.print([
"command usage: "+localStorage.syschar+"command",
"in [name] [--auto]",
"    enter the chatroom",
"    --auto(with name): auto-enter at the next time",
"    --auto(with no name): don't auto-enter",
"out",
"    quit the chatroom",
"motto [until] [--gmt] [--utc]",
"    HottoMotto",
"      until(is exists): ex) 2012-01-01",
"volume [number]",
"    show/set volume",
"set (param) (value)",
"    set options",
"        systemchar",
"        height",
"gyazo [num], gyoza [num]",
"    show/set gyoza mode",
"clear, clean",
"    clean the console",
"js",
"    JavaScript console",
"sc, scroll",
"    Scroll with arrow keys",
"disip [-d] [ip] ",
"    set/remove ip into/from disip list",
"resp",
"    response to a comment",
"go [URL|alias|#channelname]",
"    alias: 'wiki'",
		].join("\n"));
		process.die();
	};
	obj.js=function(process){
		//JSコンソール
		process.print("Type '//bye' to finish the console.");
		
		waitforline();
		
		function waitforline(){
			//1行読んでevalに投げる
			process.input(function(line){
				if(line=="//bye" || line=="//bye\n"){
					process.die();
					return;
				}
				//consoleを書き換える
				var console={log:function(){
					Array.prototype.forEach.call(arguments,function(x){
						process.put(x.toString()+" ");
					});
				}};
				try{
					var result=eval(line);
					//結果を表示
					write(result,0);
					process.print("");	//改行
				}catch(e){
					//エラー
					process.print(e,{color:"#ff0000",fontWeight:"bold"});
				}
				waitforline();
			});
		}
		function write(obj,nest){
			var color,flag;
			if(!nest)nest=0;
			if(nest>=2)debugger;
			if(obj==null){
				color="#eeeeee";
			}else if(typeof obj==="function"){
				color="#33ffff";
			}else if(typeof obj==="number"){
				color="#3333ff";
			}else if(typeof obj==="boolean"){
				color="#33ff33";
			}else if(typeof obj==="string"){
				flag=true;	//自前描画
				process.put('"');
				process.put(obj,{color:"#ff0000"});
				process.put('"');
			}else{
				//オブジェクト
				if(nest>=3){
					//深追いしない
				}else if(Array.isArray(obj)){
					//配列
					if(obj.length<200){
						//あぶない
						flag=true;
						process.put("[");
						var l=obj.length-1;
						obj.forEach(function(x,i){
							write(x,nest+1);
							if(i<l){
								process.put(", ");
							}
						});
						process.put("]");
					}else{
						result=JSON.stringify(obj);
					}
				}else{
					//オブジェクト
					var keys=Object.getOwnPropertyNames(obj);
					if(keys.length<50){
						//あぶない
						flag=true;
						process.put("{\n");
						//debugger;
						process.indent(2,function(){
							var l=keys.length-1;
							keys.forEach(function(x,i){
								write(x);
								process.put(": ");
								write(obj[x],nest+1);
								if(i<l){
									process.put(",\n");
								}else{
									process.put("\n");
								}
							});
						});
						process.put("}");
					}
				}
			}
			if(!flag){
				process.put(obj,{color:color});
			}
		}
	};
	obj.sc=obj.scroll=function(process){
		//上下キーでスクロールするコマンド
		waitforkey();
		function waitforkey(){
			process.getkey(function(e){
				if(e.keyCode==27){
					//Esc
					process.die();
					return false;
				}
				if(e.keyCode==38){
					window.scrollBy(0,-120);
				}else if(e.keyCode==40){
					window.scrollBy(0,120);
				}
				return true;
			});
		}
	};
	obj.go=function(process){
		//新しいウィンドウで移動
		var dest=process.arg;
		if(dest==="wiki"){
			//wikiへ飛ぶ
			dest="http://shogiwiki.81.la/shogiwiki/";
		}else{
			var result=dest.match(/^#(\S+)$/);
			if(result){
				process.chat.openChannel(result[1]);
				process.die();
				return;
			}
		}
		process.chat.newwin(dest);
		process.die();
	};
	obj.disip=function(process){
		//disip設定
		var pr=process.parse(process.arg);
		var ip=pr.arg[0];
		if(ip){
			if(pr.opt.indexOf("-d")>=0){
				//削除
				process.chat.removeDisip(ip);
			}else{
				if(process.chat.addDisip(ip)){

				}else{
					process.print("disip: already exists:"+ip);
				}
			}
		}
		//現在のdisipを表示して終了
		process.chat.disip.forEach(process.print,process);
		process.die();
	};
	obj.dischannel=function(process){
		//disip設定
		var pr=process.parse(process.arg);
		var channel=pr.arg[0];
		if(channel){
			if(pr.opt.indexOf("-d")>=0){
				//削除
				process.chat.removeDischannel(channel);
			}else{
				if(process.chat.addDischannel(channel)){

				}else{
					process.print("dischannel: already exists:"+channel);
				}
			}
		}
		//現在のdisipを表示して終了
		process.chat.dischannel.forEach(process.print,process);
		process.die();
	};
	obj.resp=function(process){
		//返信を行う
		
		var index=0,maxlen=10;
		var choosing=true;
		
		//返信先表示画面
		process.newContext();

		process.getkey(function(e){
			//上下：返信先選択
			if(e.keyCode==38){
				while(true){
					index--;
					if(index<=0){
						index=0;
					}else{
						var node=process.chat.log.childNodes[index];
						if(node && node.nodeType===Node.ELEMENT_NODE && node.classList.contains("resp")){
							//とばす
							continue;
						}
					}
					break;
				}
				//書き換え
				process.deletelines();
				view();
			}else if(e.keyCode==40){
				while(true){
					index++;
					var node=process.chat.log.childNodes[index];
					if(node && node.nodeType===Node.ELEMENT_NODE && node.classList.contains("resp")){
						//とばす
						continue;
					}
					break;
				}
				process.deletelines();
				view();
			}else if(e.keyCode==27){
				//Esc
				end();
				return false;
			}else if(e.keyCode==13){
				//Enter
				if(!choosing)return false;
				var lc=process.chat.log.childNodes;
				var c=lc[index];
				if(!c){
					end();
					return false;
				}
				respto=c.dataset.id;
				//返信内容入力
				process.input(function(inp){
					inp=process.chomp(inp);
					if(inp){
						process.chat.say(inp,respto);
					}
					end();
				});
				choosing=false;
				return true;	//input側で新たなkeyを設定するから（暫定処置）
			}
			return true;
		});
		view();
		
		function view(){
			//返信先表示
			var lc=process.chat.log.childNodes;
			var st=Math.max(0,Math.floor(index-maxlen/2));
			for(var i=0;i<maxlen;i++){
				var m=st+i;
				if(m>=lc.length)break;
				process.put((m==index?"* ":"  "),{color:"#00ffff"});
				if(lc[m].classList.contains("resp"))process.put("  ");	//返信のインデント
				process.print(lc[m].textContent);
			}
		}
		function end(){
			//終了
			process.restoreContext();
			process.die();
		}	
	};
/*	obj.g=function(process){
		process.chat.newwin("http://www.google.co.jp/search?q="+encodeURIComponent(process.arg));
	};*/
	
	
	obj.sl=function(process){
		var sl_steam=[
["                      (@@) (  ) (@)  ( )  @@    ()    @     O     @     O      @",
"                 (   )",
"             (@@@@)",
"          (    )",
"",
"        (@@@)",
],
[
"                      (  ) (@@) ( )  (@)  ()    @@    O     @     O     @      O",
"                 (@@@)",
"             (    )",
"          (@@@@)",
"",
"        (   )",
]
		],sl_body=[
"      ====        ________                ___________ ",
"  _D _|  |_______/        \\__I_I_____===__|_________| ",
"   |(_)---  |   H\\________/ |   |        =|___ ___|      _________________         ",
"   /     |  |   H  |  |     |   |         ||_| |_||     _|                \\_____A  ",
"  |      |  |   H  |__--------------------| [___] |   =|                        |  ",
"  | ________|___H__/__|_____/[][]~\\_______|       |   -|                        |  ",
"  |/ |   |-----------I_____I [][] []  D   |=======|____|________________________|_ ",
		],sl_wheels=[
[
"__/ =| o |=-O=====O=====O=====O \\ ____Y___________|__|__________________________|_ ",
" |/-=|___|=    ||    ||    ||    |_____/~\\___/          |_D__D__D_|  |_D__D__D_|   ",
"  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/               \\_/   \\_/    \\_/   \\_/    ",
],[
"__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__|__________________________|_ ",
" |/-=|___|=O=====O=====O=====O   |_____/~\\___/          |_D__D__D_|  |_D__D__D_|   ",
"  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/               \\_/   \\_/    \\_/   \\_/    ",
],[
"__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__|__________________________|_ ",
" |/-=|___|=    ||    ||    ||    |_____/~\\___/          |_D__D__D_|  |_D__D__D_|   ",
"  \\_/      \\O=====O=====O=====O_/      \\_/               \\_/   \\_/    \\_/   \\_/    ",
],[
"__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__|__________________________|_ ",
" |/-=|___|=    ||    ||    ||    |_____/~\\___/          |_D__D__D_|  |_D__D__D_|   ",
"  \\_/      \\_O=====O=====O=====O/      \\_/               \\_/   \\_/    \\_/   \\_/    ",
],[
"__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__|__________________________|_ ",
" |/-=|___|=   O=====O=====O=====O|_____/~\\___/          |_D__D__D_|  |_D__D__D_|   ",
"  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/               \\_/   \\_/    \\_/   \\_/    ",
],[
"__/ =| o |=-~O=====O=====O=====O\\ ____Y___________|__|__________________________|_ ",
" |/-=|___|=    ||    ||    ||    |_____/~\\___/          |_D__D__D_|  |_D__D__D_|   ",
"  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/               \\_/   \\_/    \\_/   \\_/    ",
],
		];
		
		var counter=0,position=0,sl_length=90,sp_length=30;
		var sl_speed=40;	//wait長さ
		var spaces="";
		for(var i=0;i<sp_length;i++){
			spaces+=" ";	//スペースを作る
		}
		var le=0;	//減った
		process.newContext();
		sl_move();
		function sl_move(){
			if(counter){
				//2かいめ以降
				process.deletelines(16);	//16行
			}
			var wheel=counter%6;	//6 patterns
			var steam=parseInt(counter/3)%2;
			var cut=function(x){return spaces+x.slice(le)};
			process.print(sl_steam[steam].concat(sl_body,sl_wheels[wheel]).map(cut).join("\n"));
			counter++;
			if(spaces.length>0){
				spaces=spaces.slice(1);
			}else{
				le++;
			}
			if(le<sl_length){
				setTimeout(sl_move,sl_speed);
			}else{
				//process.deletelines(16);
				process.restoreContext();
				process.die();
			}
		}
		
	};
	return obj;
})();

CommandLineChat.prototype.cprint=function(str,option){
	this.cput(str+"\n",option);
};
CommandLineChat.prototype.cput=function(str,option){
	var ins;
	str=String(str);
	//まずインデント設定
	if(this.indentSpace.length>0){
		str=setIndent(str,this.indentSpace);
		var con=this.consoleo.textContent;
		if(con.length===0 || con.lastIndexOf("\n")===con.length-1){
			str=this.indentSpace+str;	//最初にもつける
		}
	}
	if(!option){
		//ただの文字列
		ins=document.createTextNode(str);
	}else{
		ins=document.createElement("span");
		ins.textContent=str;
		//cssプロパティ
		for(var key in option){
			if(option[key]!=null){
				ins.style[key]=option[key];
			}
		}
	}
	//this.consoleo.textContent+=str;
	this.consoleo.appendChild(ins);
	this.consoleo.normalize();
	this.cscrollDown();

	function setIndent(str,space){
		return str.split("\n").map(function(x,i){return x&&i>0?space+x:x}).join("\n");	//最初だけスペースいらない
	}
};
	//内部をインデントして表示
CommandLineChat.prototype.indent=function(num,callback){
	var t=this;
	setindent(num);
	callback();
	setindent(-num);

	function setindent(n){
		if(n>0){
			for(var i=0;i<n;i++){
				t.indentSpace+=" ";
			}
		}else if(n<0){
			t.indentSpace=t.indentSpace.slice(-n);	//FIFOのスペース列
		}
	}
};
CommandLineChat.prototype.cfocus=function(){
	//コマンドにフォーカスするとスクロールしてしまうので一時的にスクロール位置保存
	var sc=document.documentElement.scrollTop || document.body.scrollTop;
	this.command.focus();
	document.documentElement.scrollTop && (document.documentElement.scrollTop=sc);
	document.body.scrollTop && (document.body.scrollTop=sc);
};
CommandLineChat.prototype.cscrollDown=function(){
	this.console.scrollTop= this.console.scrollHeight - this.console.clientHeight;
	
};
//サーバーからユーザー情報が送られてきたらコンソールに表示
CommandLineChat.prototype.userinfo=function(obj){
	SocketChat.prototype.userinfo.apply(this,arguments);
	if(!obj.rom){
		this.cput("Hello, ");
		this.cprint(obj.name,{color:"#ffff00"});
	}
	if(obj.rom && !this.autoin_flg && localStorage.socketchat_autoin){
		this.inout_notify(localStorage.socketchat_autoin);
	}
	this.autoin_flg=true;
	
};
//reconnect時はもう一度再入室がはたらく
CommandLineChat.prototype.reconnect=function(){
	SocketChat.prototype.reconnect.apply(this,arguments);
	this.autoin_flg=false;
};
CommandLineChat.prototype.setConsoleHeight=function(){
	var st=document.styleSheets.item(0);
	st.insertRule("#console { height: "+localStorage.consoleheight+"; bottom:-"+localStorage.consoleheight+"}",st.cssRules.length);
};
CommandLineChat.prototype.newwin=function(url){
	this.form.action=url;
	this.form.submit();
};

