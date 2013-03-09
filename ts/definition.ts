module Chat{
    //ログオブジェクト
    export interface LogObj {
        _id:string; //発言のid
        name:string;    //発言者名
        time:string;    //ISODate
        ip:string;
        channel:any;    //文字列か配列
        comment:string; //コメント（文字列化された）
        syslog?:bool;
        commentObject?:any; //文字列表現でないコメントがある場合
        ipff?:string;   //Forwarded forの場合のもとIP
    }
    //ユーザーオブジェクト
    export interface UserObj {
        id:number;  //Id
        name:string;
        ip:string;
        rom:bool;
        ua:string;
    }
    //サーバーへ送る用だ!
    //入退室通知オブジェクト
    export interface InoutNotify{
        name:string;
    }
    //発言通知オブジェクト
    export interface CommentNotify{
        comment:string;
        response:string;    //log id
        channel:string[];
    }
}
