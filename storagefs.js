if (!window.localStorage) {
  window.localStorage = {
    getItem: function (sKey) {
      if (!sKey || !this.hasOwnProperty(sKey)) { return null; }
      return unescape(document.cookie.replace(new RegExp("(?:^|.*;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*((?:[^;](?!;))*[^;]?).*"), "$1"));
    },
    key: function (nKeyId) { return unescape(document.cookie.replace(/\s*\=(?:.(?!;))*$/, "").split(/\s*\=(?:[^;](?!;))*[^;]?;\s*/)[nKeyId]); },
    setItem: function (sKey, sValue) {
      if(!sKey) { return; }
      document.cookie = escape(sKey) + "=" + escape(sValue) + "; path=/";
      this.length = document.cookie.match(/\=/g).length;
    },
    length: 0,
    removeItem: function (sKey) {
      if (!sKey || !this.hasOwnProperty(sKey)) { return; }
      var sExpDate = new Date();
      sExpDate.setDate(sExpDate.getDate() - 1);
      document.cookie = escape(sKey) + "=; expires=" + sExpDate.toGMTString() + "; path=/";
      this.length--;
    },
    hasOwnProperty: function (sKey) { return (new RegExp("(?:^|;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie); }
  };
  window.localStorage.length = (document.cookie.match(/\=/g) || window.localStorage).length;
}

function StorageFS(namespace){
	this._ns = namespace||"";
	this._loadFileHeader();
	this._now = this._getFileHeaderData(this._pwd);
}
StorageFS.prototype={
	_idLength: 20,
	_fileHeader: {},
	_ns: "",
	_pwd: [],
	_now: {},
	_opening: null,
	_loadFileHeader: function(){
		try{
			this._fileHeader = JSON.parse(localStorage.getItem(this._getKey("header_")))||{};
		}catch(e){
			this._fileHeader = {};
		}
	},
	_saveFileHeader: function(){
		localStorage.setItem(this._getKey("header_"), JSON.stringify(this._fileHeader));
	},
	_getFileHeaderData: function(path){
		var now = this._fileHeader;
		path.forEach(function(dir){
			now = now[dir];
		});
		return now;
	},
	_getKey: function(key){
		return "StorageFS_"+this._ns+"_"+key;
	},
	_getFileById: function(id){
		return localStorage.getItem(this._getKey(id));
	},
	_setFileById: function(id, content){
		localStorage.setItem(this._getKey(id), content);
	},
	_removeFileById: function(id){
		localStorage.removeItem(this._getKey(id));
	},
	_getRandomId: function(length){
		length = length || this._idLength;
		var id = "";
		var str = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
		for(var i=0;i<length;i++){
			id+=str[Math.floor(Math.random()*str.length)];
		}
		return id;
	},
	_isStr: function(str){
		return typeof str == "string";
	},
	_isArr: function(arr){
		return arr instanceof Array;
	},
	_isFile: function(str){
		return this._isStr(str);
	},
	_removeAll: function(dir){
		for(var i in dir){
			if(this._isFile(dir[i])){
				this._removeFileById(dir[i]);
				delete dir[i];
			}else{
				this._removeAll(dir[i]);
				delete dir[i];
			}
		}
	},
	//ディレクトリ構造のツリー表示を得る
	_tree: function(now, indent){
		var indentStr = "";
		for(var i=0; i<indent; i++) indentStr+=" ";
		var str="";
		for(var name in now){
			if(this._isFile(now[name])){
				str+=indentStr+name+"\n";
			}else{
				str+=indentStr+"["+name+"]"+"\n";
				str+=this._tree(now[name], indent+1);
			}
		}
		return str;
	},
	//カレントパスと移動パスから次のカレントパスを得る
	_pathMerger: function(nowPath, movePath){
		if(movePath[0]==""){
			//絶対パス
			nowPath = [];
			movePath.shift();
		}
		while(movePath.length>0){
			var path = movePath.shift();
			switch(path){
				case "":
				case ".":
					break;
				case "..":
					if(nowPath.length==0) throw "access to the parent of root directory";
					nowPath.pop();
					break;
				default:
					nowPath.push(path);
			}
		}
		return nowPath;
	},
	//文字列のpathを配列に分解
	_pathParser: function(path){
		return path.replace(/\/+/g, "/").split("/");
	},
	//カレントディレクトリの一覧を得る
	ls: function(){
		var list=[];
		for(var name in this._now){
			if(typeof this._now[name] == "string"){
				list.push({name: name, type: "file", id: this._now[name]});
			}else{
				list.push({name: name, type: "directory"});
			}
		}
		return list;
	},
	//カレントディレクトリのパスを得る
	pwd: function(){
		return "/"+this._pwd.join("/");
	},
	//カレントディレクトリにファイルを保存
	save: function(filename, content){
		if(typeof filename == "undefined" || typeof content == "undefined"){
			throw "2 arguments required";
		}
		var id;
		if(filename in this._now){
			id = this._now[filename];
		}else{
			id = this._getRandomId();
		}
		this._now[filename] = id;
		this._saveFileHeader();
		this._setFileById(id, content);
	},
	//カレントディレクトリからファイルを読み込む
	load: function(filename){
		if(typeof filename == "undefined"){
			throw "1 argument required";
		}
		var id;
		if(filename in this._now){
			return this._getFileById(this._now[filename]);
		}else{
			return null;
		}
	},
	open: function(filename){
		if(typeof filename == "undefined"){
			throw "1 argument required";
		}
		this._opening = filename;
		return this.load(filename);
	},
	close: function(content){
		if(typeof content == "undefined"){
			throw "1 argument required";
		}
		if(this._opening==null) throw "開いているファイルがありません";
		this.save(this._opening, content);
		this._opening=null;
	},
	exists: function(filename){
		if(typeof filename == "undefined"){
			throw "1 argument required";
		}
		return filename in this._now;
	},
	rm: function(filename){
		if(typeof filename == "undefined"){
			throw "1 argument required";
		}
		if(filename in this._now){
			if(this._isFile(this._now[filename])){
				//ファイル
				this._removeFileById(this._now[filename]);
				delete this._now[filename];
				this._saveFileHeader();
			}else{
				//フォルダ
				throw "フォルダをrmすることはできません";
			}
		}else{
			throw "ファイルが存在しません";
		}
	},
	rmdir: function(dirname){
		if(typeof dirname == "undefined"){
			throw "1 argument required";
		}
		if(dirname in this._now){
			if(this._isFile(this._now[dirname])){
				throw "これはファイルです．";
			}
			this._removeAll(this._now[dirname]);
			delete this._now[dirname];
			this._saveFileHeader();
		}else{
			throw "ディレクトリが存在しません";
		}
	},
	mkdir: function(dirname){
		if(typeof dirname == "undefined"){
			throw "1 argument required";
		}
		if(dirname in this._now){
			throw "既に存在します";
		}else{
			this._now[dirname] = {};
			this._saveFileHeader();
		}
	},
	cd: function(path){
		if(this._isStr(path)){
			path = this._pathParser(path);
		}
		if(this._isArr(path)){
			var pwd = this._pathMerger(this._pwd, path);
			try{
				this._now = this._getFileHeaderData(pwd);
				this._pwd = pwd;
			}catch(e){
				throw "存在しないフォルダです";
			}
		}else{
			throw "invalid type";
		}
		return this;
	},
	tree: function(now, indent){
		console.log(this._tree(this._now, 0));
	},
	sl: function(){
		var d=document,sl_open,sl_run,sl_close,s=d.createElement('script');
		s.charset='UTF-8';
		s.src='http://labs.creazy.net/sl/bookmarklet.js';
		d.body.appendChild(s);
	}
};