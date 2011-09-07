//Mongodbのオブジェクト
function DatabaseItem(db){
	this.db=db;

	this.obj=db;
	this.stack=[];
}
DatabaseItem.prototype={
	end:function(){
		doo();
		
		function doo(err){
			if(this.stack.length==0)return;

			var st=this.stack.shift();
			if(st.name){
				this.obj[st.name].apply(null,st.args);
			}
		}
	},
	collection:function(name){
		this.stack.push({"name":"collection","args":[name],"func":function(err,coll){
			this.obj=coll;
		}});
	},
};
