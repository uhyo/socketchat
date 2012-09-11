/*
   DB fix script 2012-08-16
   { comment: [Object] }  -> { comment:"String", commentObject:[Object] }

   */
var mongodb=require('mongodb'), readline=require('readline');
var settings=require('./../settings');

var mongoserver = new mongodb.Server(settings.DB_SERVER,settings.DB_PORT,{});
var db = new mongodb.Db(settings.DB_NAME,mongoserver,{});

db.open(function(err,_db){
	if(err){
		console.log("DB Open err: "+err);
		throw err;
	}
	db.authenticate(settings.DB_USER, settings.DB_PASS, function(err){
		if(err){
			console.log("DB Auth err: "+err);
			throw err;
		}
		db.collection("log",function(err,log){
			var rl=readline.createInterface({
				input: process.stdin,
				output:process.stdout,
			});
			rl.question("Do you have backup? [Y/N]",function(answer){
				if(!/^y$/i.test(answer)){
					console.log("aborted.");
					rl.close();
					db.close();
					return;
				}
				//まず該当のログを数える(3と4が何か怪しい）
				log.find({ comment: {$type:3},commentObject:{$exists:false}}).count(function(err,onum){
					console.log("Object-commented logs: "+onum);
					log.find({comment: {$type:4},commentObject:{$exists:false}}).count(function(err,anum){
						console.log("Array-commented logs:"+anum);
						//確認を入れる
						rl.question("Start converting? D for dry run.[Y/D/N]",function(answer){
							rl.close();
							if(!/^[yd]$/i.test(answer)){
								console.log("aborted.");
								db.close();
								return;
							}
							//変更する
							convert(log,/^d$/.test(answer));
						});
					});
				});
			});
		});
	});
});
//インデントを下げる
function convert(log,dry){
	var count=0;
	var nextCount=100;
	var c=log.find({comment:{$type:3},commentObject:{$exists:false}});
	c.nextObject(function h1(err,doc){
		if(doc){
			if(handle(doc))return;
			c.nextObject(h1);
		}else{
			var c2=log.find({comment:{$type:4},commentObject:{$exists:false}});
			c2.nextObject(function h2(err,doc){
				if(doc){
					if(handle(doc))return;
					c2.nextObject(h2);
				}else{
					//すべて終了した
					console.log(count+" logs converted.");
					console.log("successfully done.");
					db.close();
				}
			});
		}
	});
	//変換する
	function handle(doc){
		//console.log(doc);
		var query={
			$set: {
				commentObject: doc.comment,
				comment:stringify(doc.comment),
			},
		};
		//console.log(query);

		if(!dry){
			log.update({_id:doc._id},query,{safe:true},function(err){
				if(err)console.warn(err);
			});
		}else{
			console.log(doc,"=>",query);
		}
		if(++count >=nextCount){
			console.log(count+" logs converted.");
			nextCount+=500;
			return dry;
		}
		return false;
	}
	function stringify(obj){
		if("string"===typeof obj){
			return obj;
		}else if(Array.isArray(obj)){
			//配列は全部連結する
			return obj.map(stringify).join("");
		}else if(obj.child){
			//オブジェクト
			return stringify(obj.child);
		}else{
			//??????
			return obj.toString();
		}
	}
}
