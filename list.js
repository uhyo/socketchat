function UserList(table){
	this.tableid=table;
}
UserList.prototype={
	init:function(){
		this.table=document.getElementById(this.tableid);
		this.line=new HighChatMaker(null);
		
		var socket;
		socket=this.socket=io.connect(settings.SOCKET_HOST_NAME||location.orogin);
		
		socket.on("users",this.users.bind(this));
		socket.on("newuser",this.newuser.bind(this));
		socket.on("inout",this.inout.bind(this));
		socket.on("deluser",this.deluser.bind(this));
		
		socket.emit("register",{"mode":"userlist"});
	},
	users:function(data){
		console.log(data);
		var tbody=this.table.tBodies[0];
		while(tbody.rows.length){
			tbody.deleteRow(0);
		}
		data.users.forEach(function(user){
			this.newuser(user);
		},this);
	},
	newuser:function(user){
		var tbody=this.table.tBodies[0];
		var row=tbody.insertRow(-1);
		row.dataset.id=user.id;
		row.style.color=this.line.getColor(user.ip);
		row.insertCell(0).textContent=user.rom?"(ROM)":user.name;
		row.insertCell(1).textContent=user.ip;
		row.insertCell(2).textContent=user.ua;
	},
	inout:function(data){
		var r=this.findRow(data.id);
		if(!r)return;
		r.cells[0].textContent=data.rom?"(ROM)":data.name;
	},
	deluser:function(id){
		var r=this.findRow(id);
		if(!r)return;
		this.table.deleteRow(r.rowIndex);
	},
	findRow:function(id){
		var r=this.table.tBodies[0].rows;
		for(var i=0,l=r.length;i<l;i++){
			if(r[i].dataset.id==id)return r[i];
		}
		return null;
	},

};
