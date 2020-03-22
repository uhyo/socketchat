"use strict";
/// <reference path="connection.ts"/>
/// <reference path="process.ts"/>
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Chat;
(function (Chat) {
    //チャット外観の全体
    var ChatView = /** @class */ (function () {
        //protected
        function ChatView(userData, connection, receiver, process, com, channel) {
            this.userData = userData;
            this.connection = connection;
            this.receiver = receiver;
            this.process = process;
            this.initView(userData, connection, receiver, process, com, channel);
        }
        //表示部分的な?
        ChatView.prototype.initView = function (userData, connection, receiver, process, com, channel) {
            this.container = document.createElement("div");
            //コンテナはbodyに入れる
            document.body.setAttribute('role', 'application');
            document.body.appendChild(this.container);
            //disマネージャ
            this.dis = new ChatLogDisManager(userData);
            //設定・リンク部分を初期化
            if (com) {
                this.linksView = null;
                this.settingView = null;
            }
            else {
                this.linksView = new ChatLinksView();
                this.settingView = new ChatSettingView(userData, this);
            }
            //ログ表示部分を初期化
            this.logView = new ChatLogView(userData, receiver, process, this, this.dis);
            //ユーザー一覧部分を初期化
            this.userView = new ChatUserView(receiver, this, this.dis);
            //ユーザー操作部分を初期化
            //UIを選ぶ
            if (com) {
                this.ui = new ChatCmdUI(userData, receiver, process, this, this.dis);
            }
            else {
                this.ui = new ChatNormalUI(userData, receiver, process, this, this.dis, channel);
            }
            //HottoMottoボタンを初期化
            this.motto = new ChatUICollection.MottoForm();
            this.motto.onMotto(function (data) {
                receiver.motto(data);
            });
            //disマネージャ初期化
            //UIを組もう!
            if (this.linksView)
                this.container.appendChild(this.linksView.getContainer());
            if (this.settingView)
                this.container.appendChild(this.settingView.getContainer());
            this.container.appendChild(this.ui.getContainer());
            this.container.appendChild(this.logView.getContainer());
            this.container.appendChild(this.userView.getContainer());
            this.container.appendChild(this.motto.getContainer());
            //接続関係
            receiver.on("disconnect", function () {
                document.body.classList.add("discon");
            });
            receiver.on("reconnect", function () {
                document.body.classList.remove("discon");
            });
            //下までスクロールしたら自動mottoする
            window.addEventListener("scroll", function (e) {
                var st = document.body.scrollTop || document.documentElement.scrollTop || 0;
                var cl = document.documentElement.offsetHeight;
                var i = window.innerHeight;
                if (st >= cl - i) {
                    //下までスクロールした
                    receiver.motto({});
                }
            }, false);
            if (channel) {
                document.title = "#" + channel + " - " + document.title;
            }
        };
        //設定がされたので反映させる
        ChatView.prototype.refreshSettings = function () {
            this.settingView.refreshSettings();
            this.logView.refreshSettings();
            this.ui.refreshSettings();
        };
        //発言欄にフォーカスする
        ChatView.prototype.focusComment = function (focus, channel) {
            this.ui.focusComment(focus, channel);
        };
        //仕様を表示してあげる
        ChatView.prototype.showSiyou = function () {
            alert("\
・「餃子無展開」「餃子常時」「餃子オンマウス」ボタン\n\
　gyazo.comでアップロードされた画像のサムネイル表示設定\n\
\n\
・「欄#」「窓#」ボタン\n\
　ハッシュタグのクリック時の表示設定\n\
　欄#　タグ欄に入力されてタグ内での発言がハイライトされる\n\
　窓#　専用ウィンドウを開く\n\
\n\
・記法\n\
　[s]取り消し線[/s]　(閉じ省略可)\n\
　[small]文字サイズ小さく[/small]　(閉じ省略可)\n\
　[code]等幅フォント+改行無し[/code]　(閉じ省略可)\n\
　[math]\\LaTeX 数式[/math]\n\
　#hashtag　hashtagタグに発言\n\
　.#hashtag　hashtagタグを参照(リンクのみ)\n\
　@発言ID　発言IDへのリプライを付加\n\
\n\
・発言クリックで右に出る矢印について\n\
　緑クリックで下に枠が出るのでそこに入力して発言すると返信になる\n\
　灰色クリックで矢印を消す\n\
");
        };
        //強制的にコンソールを開く
        ChatView.prototype.openConsole = function () {
            var cons = new ChatCmdUI(this.userData, this.receiver, this.process, this, this.dis);
            var sole = cons.getConsole();
            this.container.appendChild(cons.getContainer());
            sole.openConsole();
            sole.onClose(function () {
                cons.cleanup();
            });
        };
        ChatView.prototype.getContainer = function () {
            return this.container;
        };
        return ChatView;
    }());
    Chat.ChatView = ChatView;
    //リンク一覧
    var ChatLinksView = /** @class */ (function () {
        function ChatLinksView() {
            //リンク一覧
            this.links = [
                [
                    {
                        url: "http://shogitter.com/",
                        name: "将棋",
                    },
                    {
                        url: "http://81.la/shogiwiki/",
                        name: "wiki",
                    },
                    {
                        url: "http://81.la/cgi-bin/up/",
                        name: "up",
                    },
                ], [
                    {
                        url: "/list",
                        name: "list",
                    },
                    {
                        url: "/log",
                        name: "log",
                    },
                    {
                        url: "/com",
                        name: "com",
                    },
                    {
                        url: "/smp",
                        name: "SMP",
                    },
                    {
                        url: "https://github.com/uhyo/socketchat/issues",
                        name: "issues",
                    },
                ],
            ];
            this.container = document.createElement("div");
            this.container.classList.add("links");
            this.container.appendChild(this.makeLinks());
        }
        ChatLinksView.prototype.getContainer = function () {
            return this.container;
        };
        ChatLinksView.prototype.makeLinks = function () {
            var df = document.createDocumentFragment();
            for (var i = 0, l = this.links.length; i < l; i++) {
                var ls = this.links[i];
                var ul = document.createElement("ul");
                for (var j = 0, m = ls.length; j < m; j++) {
                    var o = ls[j];
                    var a = document.createElement("a");
                    a.href = o.url;
                    a.target = "_blank";
                    a.textContent = o.name;
                    ul.appendChild(makeEl("li", function (li) {
                        li.appendChild(a);
                    }));
                }
                df.appendChild(ul);
            }
            return df;
        };
        return ChatLinksView;
    }());
    Chat.ChatLinksView = ChatLinksView;
    //設定
    var ChatSettingView = /** @class */ (function () {
        function ChatSettingView(userData, view) {
            this.userData = userData;
            this.view = view;
            //餃子セッティング一覧
            this.gyozaSettings = ["餃子無展開", "餃子オンマウス", "餃子常時"];
            //オーディオセッティング一覧
            this.audioSettings = ["ミュート", "システム音ON", "システム音OFF"];
            //チャネルセッティング一覧
            this.channelSettings = ["欄#", "窓#"];
            //通知設定
            this.notificationSettings = ["通知OFF", "通知ON"];
            this.container = document.createElement("form");
            this.container.classList.add("infobar");
            //餃子ボタン生成
            this.container.appendChild(this.makeGyozaButton());
            //ボリューム操作生成
            this.container.appendChild(this.makeVolumeRange());
            //オーディオ設定ボタン
            this.container.appendChild(this.makeAudioModeButton());
            //通知ボタン
            this.container.appendChild(this.makeNotificationButton());
            //チャネル開き方
            this.container.appendChild(this.makeChannelModeButton());
            //仕様ボタン
            this.container.appendChild(this.makeSiyouButton());
        }
        ChatSettingView.prototype.makeGyozaButton = function () {
            var _this = this;
            var button = document.createElement("input");
            var ud = this.userData;
            button.name = "gyozabutton";
            button.type = "button";
            button.value = this.gyozaSettings[ud.gyoza];
            button.addEventListener("click", function (e) {
                //クリックされたら変更
                ud.gyoza = (ud.gyoza + 1) % _this.gyozaSettings.length;
                ud.save();
                //ビューに変更を知らせる
                _this.view.refreshSettings();
            }, false);
            return button;
        };
        ChatSettingView.prototype.makeVolumeRange = function () {
            var df = document.createDocumentFragment();
            /*df.appendChild(makeEl("span",(span)=>{
                span.className="icon volumeicon";
                span.textContent="\ue003";
            }));*/
            var range = document.createElement("input");
            var ud = this.userData;
            range.name = "volume";
            range.type = "range";
            range.min = "0", range.max = "100", range.step = "10";
            range.value = String(ud.volume);
            //変更時
            var timerid = null;
            range.addEventListener("change", function (e) {
                //毎回saveするのは気持ち悪い。操作終了を待つ
                ud.volume = Number(range.value);
                clearTimeout(timerid);
                timerid = setTimeout(function () {
                    ud.save();
                }, 1000);
            }, false);
            df.appendChild(range);
            return df;
        };
        ChatSettingView.prototype.makeAudioModeButton = function () {
            var _this = this;
            var button = document.createElement("input");
            var ud = this.userData;
            button.name = "audiomode";
            button.type = "button";
            button.value = this.audioSettings[ud.audioMode];
            button.addEventListener("click", function (e) {
                //クリックされたら変更
                ud.audioMode = (ud.audioMode + 1) % _this.audioSettings.length;
                ud.save();
                //ビューに変更を知らせる
                _this.view.refreshSettings();
            }, false);
            return button;
        };
        ChatSettingView.prototype.makeChannelModeButton = function () {
            var _this = this;
            var button = document.createElement("input");
            var ud = this.userData;
            button.name = "channelmode";
            button.type = "button";
            button.value = this.channelSettings[ud.channelMode];
            button.addEventListener("click", function (e) {
                //クリックされたら変更
                ud.channelMode = (ud.channelMode + 1) % _this.channelSettings.length;
                ud.save();
                //ビューに変更を知らせる
                _this.view.refreshSettings();
            }, false);
            return button;
        };
        ChatSettingView.prototype.makeNotificationButton = function () {
            var _this = this;
            var button = document.createElement("input");
            var ud = this.userData;
            button.name = "notification";
            button.type = "button";
            button.value = this.notificationSettings[+ud.notification];
            button.addEventListener("click", function (e) {
                //クリックされたら変更
                ud.notification = !ud.notification;
                if (ud.notification && Notification.permission !== "granted") {
                    // ここに書くのは少し違うような気がするけどまあいいか
                    Notification.requestPermission().then(function (status) {
                        if (status !== "granted") {
                            ud.notification = false;
                            ud.save();
                            _this.view.refreshSettings();
                        }
                    });
                }
                ud.save();
                //ビューに変更を知らせる
                _this.view.refreshSettings();
            }, false);
            if (!("Notification" in window)) {
                // 通知がない
                button.disabled = true;
            }
            return button;
        };
        ChatSettingView.prototype.makeSiyouButton = function () {
            var _this = this;
            var button = document.createElement("input");
            var ud = this.userData;
            button.name = "siyou";
            button.type = "button";
            button.value = "仕様";
            button.addEventListener("click", function (e) {
                //クリックされたら仕様を表示してあげる
                _this.view.showSiyou();
            }, false);
            return button;
        };
        ChatSettingView.prototype.getContainer = function () {
            return this.container;
        };
        ChatSettingView.prototype.refreshSettings = function () {
            //設定変更
            var form = this.container, ud = this.userData;
            //餃子
            var gyozabutton = form.elements["gyozabutton"];
            gyozabutton.value = this.gyozaSettings[ud.gyoza];
            //ボリューム
            var volumeRange = form.elements["volume"];
            volumeRange.value = String(ud.volume);
            //オーディオ設定
            var audiobutton = form.elements["audiomode"];
            audiobutton.value = this.audioSettings[ud.audioMode];
            //通知設定
            var notificationbutton = form.elements["notification"];
            notificationbutton.value = this.notificationSettings[+ud.notification];
            //チャンネル
            var channelbutton = form.elements["channelmode"];
            channelbutton.value = this.channelSettings[ud.channelMode];
        };
        return ChatSettingView;
    }());
    Chat.ChatSettingView = ChatSettingView;
    //ログ表示部分
    var ChatLogView = /** @class */ (function () {
        function ChatLogView(userData, receiver, process, view, dis) {
            var _this = this;
            this.userData = userData;
            this.receiver = receiver;
            this.process = process;
            this.view = view;
            this.dis = dis;
            this.container = document.createElement("div");
            this.flow = new ChatLogFlow(userData, receiver);
            dis.registerLogContainer(this.flow.getContainer());
            this.container.appendChild(this.flow.getContainer());
            this.refreshSettings(); //初期設定
            //オーディオ準備
            // [0]: ログ更新
            // [1]: 入室
            // [2]: 退室、失踪
            this.audio = [];
            this.audio.push(this.getAudio("/sound"));
            this.audio.push(this.getAudio("/sound_sys1"));
            this.audio.push(this.getAudio("/sound_sys2"));
            //フローにイベント登録する
            var fe = this.flow.event;
            fe.on("logaudio", function (soundId) {
                if (soundId >= 0 && soundId < _this.audio.length) {
                    //オーディオを鳴らす指令
                    _this.audio[soundId].volume = _this.userData.volume / 100;
                    _this.audio[soundId].play();
                }
            });
            fe.on("focusChannel", function (channel) {
                //チャネルに注目した
                if (userData.channelMode === 0) {
                    //欄#
                    var focusedChannel = _this.dis.setFocusChannel(channel, true);
                    _this.view.focusComment(false, focusedChannel);
                }
                else {
                    //窓#
                    //もとのほうは薄くする
                    _this.dis.addDischannel(channel, true, false);
                    _this.process.openChannel(channel, function () {
                        _this.dis.removeDischannel(channel, true, false);
                    });
                }
            });
            fe.on("openReplyForm", function (log) {
                //このログに対して返信フォームを開くべきだ
                if (log.classList.contains("replyready")) {
                    //すでに返信フォームが開いている
                    return;
                }
                var comForm = new ChatUICollection.CommentForm(receiver, true, null); //子窓で返信時どうするか
                var cont = comForm.getContainer();
                //最初にマークつける
                var p = cont.getElementsByTagName("p")[0];
                if (p) {
                    p.insertBefore(makeEl("span", function (el) {
                        el.className = "icon respin opened";
                        el.textContent = "\ue000";
                    }), p.firstChild);
                }
                log.parentNode.insertBefore(cont, log.nextSibling);
                log.classList.add("replyready"); //返信フォームが開いている
                comForm.event.on("comment", function (data) {
                    //返信情報
                    data.response = log.dataset.id;
                    _this.process.comment(data);
                    appearAnimation(cont, "vertical", false, true);
                    log.classList.remove("replyready");
                });
                comForm.event.on("cancel", function () {
                    appearAnimation(cont, "vertical", false, true);
                    log.classList.remove("replyready");
                });
                appearAnimation(cont, "vertical", true, true);
                var ch = log.dataset.channel || "";
                //返信先チャネル決定
                var result = ch.match(/^#([^#]+)\/(?:#|$)/);
                console.log(result);
                if (result) {
                    comForm.setChannel(result[1]);
                }
                else {
                    comForm.setChannel(null);
                }
                comForm.focus();
            });
            fe.on('focus', function () {
                // チャットにフォーカスした
                parent.focus();
                window.focus();
                _this.view.focusComment(true);
            });
        }
        ChatLogView.prototype.getContainer = function () {
            return this.container;
        };
        //設定変更された
        ChatLogView.prototype.refreshSettings = function () {
            this.flow.refreshSettings();
        };
        //オーディオ初期化
        ChatLogView.prototype.getAudio = function (filename) {
            var audio;
            try {
                audio = new Audio();
                audio.removeAttribute("src");
                ["ogg", "mp3", "wav"].forEach(function (ext) {
                    var source = document.createElement("source");
                    source.src = filename + "." + ext;
                    source.type = "audio/" + ext;
                    audio.appendChild(source);
                });
            }
            catch (e) {
                //オーディオなんてなかった
                audio = { play: function () { } };
            }
            return audio;
        };
        return ChatLogView;
    }());
    Chat.ChatLogView = ChatLogView;
    //ログ表示本体
    var ChatLogFlow = /** @class */ (function () {
        function ChatLogFlow(userData, receiver) {
            var _this = this;
            this.userData = userData;
            this.receiver = receiver;
            // ページがvisibleかどうかを頑張ってトラック
            this.pageVisible = true;
            this.event = Chat.getEventEmitter();
            this.container = document.createElement("div");
            this.container.setAttribute('role', 'log');
            this.container.classList.add("logbox");
            setUniqueId(this.container, "log");
            this.lineMaker = new ChatLineMaker(userData);
            //流れてきたログをキャッチ!!
            //ログたくさんきた
            receiver.on("loginit", function (logs) {
                //まず全部消す
                var range = document.createRange();
                range.selectNodeContents(_this.container);
                range.deleteContents();
                range.detach();
                //逆にしてアレする
                logs.reverse().forEach(function (log) {
                    _this.getLog(log, true);
                });
            });
            //ログひとつきた
            receiver.on("log", function (log) {
                _this.getLog(log, false);
            });
            //Mottoのログがきた
            receiver.on("mottoLog", function (logs) {
                logs.forEach(function (log) {
                    var line = _this.lineMaker.make(log);
                    _this.container.appendChild(line);
                });
            });
            //餃子オンマウス用の処理入れる
            this.gyozaOnmouseListener = (function (e) {
                var t = e.target; //先取り
                if (!t.classList.contains("gyoza")) {
                    return; //違う
                }
                //既に展開されている場合はとばす
                if (t.classList.contains("gyozaloaded")) {
                    return;
                }
                _this.lineMaker.checkGyoza(t);
            }).bind(this);
            //クリックに対応する
            this.container.addEventListener("click", this.clickHandler.bind(this), false);
            //ツールボックスの準備をする
            this.toolbox = this.makeToolbox();
            //アイコンをコピーされると困る
            var clistener = function (e) {
                var selection = window.getSelection();
                var box = [];
                for (var i = 0, l = selection.rangeCount; i < l; i++) {
                    var range = selection.getRangeAt(i);
                    var an = range.commonAncestorContainer;
                    //TreeWalkerでアイコンを探す
                    var tw = document.createTreeWalker(an, NodeFilter.SHOW_ELEMENT, function (node) {
                        if (node.classList.contains("icon")) {
                            //アイコン
                            return NodeFilter.FILTER_ACCEPT;
                        }
                        else {
                            return NodeFilter.FILTER_SKIP;
                        }
                    }, false);
                    tw.currentNode = range.startContainer;
                    var node;
                    var range2;
                    while (node = tw.nextNode()) {
                        if (!range2)
                            range2 = document.createRange();
                        //範囲を通りすぎてないかチェック
                        range2.selectNode(node);
                        if (range.compareBoundaryPoints(Range.START_TO_END, range2) <= 0) {
                            //通り過ぎた。終了
                            break;
                        }
                        //TreeWalkerが見失わないようにとりあえず親
                        tw.currentNode = node.parentNode;
                        //アイコンである。消去する
                        var df = range2.extractContents();
                        box.push({
                            range: range2,
                            df: df,
                        });
                        console.log(df);
                        //このrange2は使用済。参照を断つ
                        range2 = null;
                    }
                }
                //一瞬後（コピー後）に復旧する
                //setImmediateが欲しい事例
                setTimeout(function () {
                    box.reverse(); //連続した奴を消したときに後ろから戻さないと順番が逆になる
                    box.forEach(function (obj) {
                        obj.range.insertNode(obj.df);
                        obj.range.detach();
                    });
                }, 0);
            };
            this.container.addEventListener("copy", clistener, false);
            // ページの表示状態をトラック
            document.addEventListener('visibilitychange', function () {
                _this.pageVisible = !document.hidden;
            });
            document.addEventListener('focus', function () {
                _this.pageVisible = true;
            });
            document.addEventListener('blur', function () {
                _this.pageVisible = false;
            });
        }
        ChatLogFlow.prototype.getContainer = function () {
            return this.container;
        };
        //ログを一つ追加
        ChatLogFlow.prototype.getLog = function (obj, initmode) {
            var _this = this;
            //initmode: それがログ初期化段階かどうか
            var line = this.lineMaker.make(obj);
            this.container.insertBefore(line, this.container.firstChild);
            //音を鳴らす
            if (!initmode && this.userData.volume > 0 && this.userData.audioMode != 0) {
                //音鳴らす判定を入れる
                //この判定でいいの?
                var style = document.defaultView.getComputedStyle(line, null);
                if (style.display !== "none") {
                    // 音を鳴らし分ける
                    if (!obj.syslog) {
                        //通常ログ
                        this.event.emit("logaudio", 0);
                    }
                    else if (this.userData.audioMode != 2) {
                        //システム音を鳴らす設定の場合のみ鳴らす
                        if (obj.name.indexOf("退室") != -1 || obj.name.indexOf("失踪") != -1) {
                            //退室・失踪通知
                            this.event.emit("logaudio", 2);
                        }
                        else {
                            //その他のシステムログ
                            this.event.emit("logaudio", 1);
                        }
                    }
                }
            }
            if (!initmode && !this.pageVisible && this.userData.notification) {
                // 通知を送る
                var n_1 = new Notification(obj.name, {
                    body: obj.comment,
                    lang: 'ja',
                    timestamp: new Date(obj.time).getTime(),
                });
                n_1.onclick = function () {
                    _this.event.emit('focus');
                    n_1.close();
                };
            }
        };
        ChatLogFlow.prototype.refreshSettings = function () {
            //餃子まわりの設定
            //リスナ消去
            this.container.removeEventListener("mouseover", this.gyozaOnmouseListener, false);
            if (this.userData.gyoza === 1) {
                //餃子オンマウスなら再設定
                this.container.addEventListener("mouseover", this.gyozaOnmouseListener, false);
            }
        };
        ChatLogFlow.prototype.clickHandler = function (e) {
            var _this = this;
            var t = e.target;
            // if emojified, target element is its parent
            if (t.tagName === "IMG" && t.classList.contains("emoji"))
                t = t.parentElement;
            var cl = t.classList;
            if (cl.contains("channel") && t.dataset.channel) {
                //チャンネルだ
                this.event.emit("focusChannel", t.dataset.channel);
            }
            else if (cl.contains("respin")) {
                if (cl.contains("opened")) {
                    //ログを戻す
                    var bq = document.evaluate('ancestor::p/following-sibling::blockquote', t, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    appearAnimation(bq, "vertical", false, true);
                }
                else if (!cl.contains("processing")) {
                    //親のログを得る
                    var log = t.parentNode.parentNode;
                    this.receiver.find({
                        id: log.dataset.respto,
                    }, function (logs) {
                        if (logs.length > 0) {
                            var l = logs[0];
                            var line = _this.lineMaker.make(l);
                            var bq = document.createElement("blockquote");
                            bq.classList.add("resp");
                            bq.appendChild(line);
                            log.parentNode.insertBefore(bq, log.nextSibling);
                            appearAnimation(bq, "vertical", true, true, function () {
                                cl.remove("processing");
                            });
                        }
                    });
                    cl.add("processing");
                }
                cl.toggle("opened");
                return;
            }
            //ログクリックを検出
            var logp = document.evaluate('ancestor-or-self::p', t, null, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue;
            if (logp && logp.classList.contains("log")) {
                //ログの位置にツールボックス
                if (this.selectedLog !== logp) {
                    this.selectedLog = logp;
                    logp.appendChild(this.toolbox);
                    appearAnimation(this.toolbox, "fade", true, true);
                }
            }
            else {
                //ログをクリックしていない
                //ツールボックス消去
                if (this.toolbox.parentNode) {
                    appearAnimation(this.toolbox, "fade", false, true);
                }
                this.selectedLog = null;
            }
        };
        //ツールボックス
        ChatLogFlow.prototype.makeToolbox = function () {
            var _this = this;
            var toolbox = document.createElement("span");
            toolbox.classList.add("toolbox");
            toolbox.appendChild(makeEl("span", function (el) {
                el.className = "icon resptip";
                el.setAttribute("role", "button");
                el.textContent = "\ue001";
                el.addEventListener("click", function (e) {
                    var log = _this.selectedLog;
                    if (log) {
                        //返信フォーム展開
                        _this.event.emit("openReplyForm", log);
                    }
                }, false);
            }));
            toolbox.appendChild(makeEl("span", function (el) {
                //しまう
                el.className = "icon hidetoolbox";
                el.setAttribute("role", "button");
                el.textContent = "\ue004";
                el.addEventListener("click", function (e) {
                    //クリックするとしまう
                    appearAnimation(toolbox, "fade", false, true, function () {
                        _this.selectedLog = null;
                    });
                }, false);
            }));
            return toolbox;
        };
        return ChatLogFlow;
    }());
    Chat.ChatLogFlow = ChatLogFlow;
    var ChatLogDisManager = /** @class */ (function () {
        function ChatLogDisManager(userData) {
            var _this = this;
            this.userData = userData;
            //今フォーカスしているチャネル
            this.focusedChannel = null;
            this.disip = []; //disipリスト
            this.logContainer = null; //logノード
            //disの初期化をする
            userData.disip.forEach(function (ip) {
                _this.setDisipStyle(ip);
            });
            userData.dischannel.forEach(function (channel) {
                _this.setDischannelStyle(channel, false, false);
            });
        }
        ChatLogDisManager.prototype.registerLogContainer = function (c) {
            this.logContainer = c;
        };
        ChatLogDisManager.prototype.addDisip = function (ip, temporal) {
            if (temporal === void 0) { temporal = false; }
            var ud = this.userData;
            if (ud.disip.indexOf(ip) >= 0)
                return false;
            if (!temporal) {
                ud.disip.push(ip);
                ud.save();
            }
            this.setDisipStyle(ip);
            return true;
        };
        ChatLogDisManager.prototype.setDisipStyle = function (ip) {
            this.addCSSRules([
                '.logbox > p.log[data-ip="' + ip + '"]{display:none}',
                '.users li[data-ip="' + ip + '"]{text-decoration:line-through}',
            ]);
        };
        ChatLogDisManager.prototype.removeDisip = function (ip, temporal) {
            var ud = this.userData;
            if (!temporal) {
                ud.disip = ud.disip.filter(function (x) { return x !== ip; });
                ud.save();
            }
            this.removeCSSRules([
                '.logbox > p.log[data-ip="' + ip + '"]',
                '.users li[data-ip="' + ip + '"]',
            ]);
        };
        //-------------- DisChannel API
        //チャネルにフォーカスする（現在のチャネルを返す）
        ChatLogDisManager.prototype.setFocusChannel = function (channel, toggle) {
            var lastChannel = this.focusedChannel;
            if (toggle && lastChannel === channel)
                channel = null;
            this.focusedChannel = channel;
            if (lastChannel !== null) {
                this.removeDischannel(lastChannel, true, true);
            }
            if (channel !== null) {
                this.addDischannel(channel, true, true);
            }
            return channel;
        };
        //disChannel用のcssルールを作る
        //attribute=要素セレクタにつける属性
        ChatLogDisManager.prototype.createDisCSSSelector = function (attribute, temporal, anti) {
            if (anti) {
                //逆
                attribute = ":not(" + attribute + ")";
            }
            return ".logbox > p.log" + attribute;
        };
        ChatLogDisManager.prototype.createDisCSSRule = function (attribute, temporal, anti) {
            var selector = this.createDisCSSSelector(attribute, temporal, anti);
            var body = temporal ? "opacity:0.3;" : "display:none;";
            return selector + "{" + body + "}";
        };
        //CSSルールを追加する
        ChatLogDisManager.prototype.addCSSRules = function (cssTexts) {
            if (document.styleSheets.length === 0) {
                //style!
                var style = document.createElement("style");
                document.head.appendChild(style);
            }
            cssTexts.forEach(function (cssText) {
                document.styleSheets.item(0).insertRule(cssText, 0);
            });
        };
        ChatLogDisManager.prototype.removeCSSRules = function (cssSelectors) {
            var css = document.styleSheets.item(0);
            for (var i = css.cssRules.length - 1; i >= 0; i--) {
                var rule = css.cssRules[i];
                if (cssSelectors.indexOf(rule.selectorText) >= 0) {
                    css.deleteRule(i);
                }
            }
        };
        //disChannelを追加する
        //temporal: 一時的（保存しない） anti:逆（特定のやつ以外dis）
        ChatLogDisManager.prototype.addDischannel = function (channel, temporal, anti) {
            var ud = this.userData;
            if (ud.dischannel.indexOf(channel) >= 0)
                return false;
            if (!temporal) {
                ud.dischannel.push(channel);
                ud.save();
            }
            this.setDischannelStyle(channel, temporal, anti);
            return true;
        };
        ChatLogDisManager.prototype.setDischannelStyle = function (channel, temporal, anti) {
            this.addCSSRules([
                this.createDisCSSRule('[data-channel*="#' + channel + '/"]', temporal, anti),
            ]);
        };
        ChatLogDisManager.prototype.removeDischannel = function (channel, temporal, anti) {
            var ud = this.userData;
            if (!temporal) {
                ud.dischannel = ud.dischannel.filter(function (x) { return x !== channel; });
                ud.save();
            }
            this.removeCSSRules([
                this.createDisCSSSelector('[data-channel*="#' + channel + '/"]', temporal, anti),
            ]);
        };
        ChatLogDisManager.prototype.addFocusOutlaw = function (temporal) {
            this.addCSSRules([
                this.createDisCSSRule('[data-channel]', temporal, false),
            ]);
        };
        ChatLogDisManager.prototype.removeFocusOutlaw = function (temporal) {
            this.removeCSSRules([
                this.createDisCSSSelector('[data-channel]', temporal, false),
            ]);
        };
        return ChatLogDisManager;
    }());
    Chat.ChatLogDisManager = ChatLogDisManager;
    //ログからDOMを生成するやつ
    var ChatLineMaker = /** @class */ (function () {
        function ChatLineMaker(userData) {
            this.userData = userData;
            //餃子設定
            this.gyazoSetting = [
                {
                    thumb: true,
                    url: {
                        host: "gyazo.com",
                        thumbnailUrlGenerator: function (hash) { return "https://gyazo.com/" + hash + "/raw"; },
                        ext: false,
                    },
                    text: {
                        normal: "[Gyazo]",
                        opening: "[Gyoza…]",
                        error: "[Gyoza?]",
                    }
                },
                {
                    thumb: false,
                    url: {
                        host: "myazo.net",
                        thumbnailUrlGenerator: ChatLineMaker.getRegularUrlGenerator("http://myazo.net/s/"),
                        ext: true,
                    },
                    text: {
                        normal: "[Myazo]",
                        opening: "[Myoza…]",
                        error: "[Myoza?]"
                    }
                },
                {
                    thumb: true,
                    url: {
                        host: "g.81.la",
                        thumbnailUrlGenerator: ChatLineMaker.getRegularUrlGenerator("https://g.81.la/thumb/"),
                        ext: false,
                    },
                    text: {
                        normal: "[81g]",
                        opening: "[81kg…]",
                        error: "[81kg?]",
                    }
                }
            ];
            this.mimetexUrl = "https://81.la/cgi-bin/mimetex.cgi";
        }
        ChatLineMaker.prototype.make = function (obj) {
            var _this = this;
            var p = document.createElement("p");
            p.classList.add("log");
            if (obj.syslog) {
                //システムログ
                p.classList.add("syslog");
            }
            var color = this.getColorByIP(obj.ip); //ログの色
            //名前部分の生成
            var name = el("bdi", obj.name);
            name.classList.add("name");
            name.style.color = color;
            p.appendChild(name);
            //アレ
            p.appendChild(makeEl("span", function (span) {
                span.classList.add("nameseparator");
                span.style.color = color;
                span.textContent = "> ";
            }));
            //名前以外の部分の生成
            p.appendChild(makeEl("span", function (main) {
                main.classList.add("main");
                //返信チップ
                if (obj.response) {
                    var resptip = document.createElement("span");
                    resptip.className = "icon respin";
                    resptip.textContent = "\ue000";
                    main.appendChild(resptip);
                }
                //コメント部分の生成
                var comment;
                main.appendChild(makeEl("bdi", function (bdi) {
                    comment = bdi;
                    bdi.appendChild(_this.commentHTMLify(obj.commentObject || obj.comment));
                    _this.parse(bdi, obj); //解析（URLとか）
                    bdi.normalize();
                }));
                //チャネル
                if (obj.channel) {
                    //コメントにも情報付加
                    p.dataset.channel = "#" + (Array.isArray(obj.channel) ? obj.channel.join("/#") : obj.channel) + "/";
                    //配列か
                    var c = Array.isArray(obj.channel) ? obj.channel : [obj.channel];
                    //ログ中のチャネルリンクを抽出
                    var sps = comment.getElementsByClassName("channels");
                    var chhs = Array.prototype.map.call(sps, function (x) {
                        return x.textContent;
                    });
                    for (var i = 0, l = c.length; i < l; i++) {
                        //ログのチャンネル名と、本文中のハッシュタグがかぶる場合は本文を優先
                        if (chhs.indexOf("#" + c[i]) === -1) {
                            main.appendChild(_this.makeChannelSpan(c[i]));
                        }
                    }
                }
                //返信先あり
                if (obj.response) {
                    p.dataset.respto = obj.response;
                    p.classList.add("respto");
                }
                //まとめる
                main.appendChild(makeEl("span", function (info) {
                    info.classList.add("info");
                    var date = new Date(obj.time);
                    //日付
                    var datestring = date.getFullYear() + "-" + zero2(date.getMonth() + 1) + "-" + zero2(date.getDate());
                    //時刻
                    var timestring = zero2(date.getHours()) + ":" + zero2(date.getMinutes()) + ":" + zero2(date.getSeconds());
                    //時間表示
                    info.appendChild(makeEl("time", function (time) {
                        time.appendChild(makeEl("span", function (dateelement) {
                            dateelement.textContent = datestring;
                            dateelement.classList.add("date");
                        }));
                        time.appendChild(makeEl("span", function (timeelement) {
                            timeelement.textContent = " " + timestring;
                            timeelement.classList.add("time");
                        }));
                        time.appendChild(document.createTextNode("; "));
                        time.dateTime = datestring + "T" + timestring;
                    }));
                    //コメントに付加情報
                    p.dataset.id = obj._id;
                    p.dataset.ip = obj.ip;
                    //IPアドレス情報
                    var ipstring = obj.ip + (obj.ipff ? " (forwarded for: " + obj.ipff + ")" : "");
                    info.appendChild(makeEl("span", function (ipelement) {
                        ipelement.textContent = ipstring + "; ";
                        ipelement.classList.add("ip");
                    }));
                    //なぜか名前にも
                    name.title = datestring + " " + timestring + ", " + ipstring;
                    info.appendChild(makeEl("span", function (ipelement) {
                        ipelement.textContent = obj._id + "; ";
                        ipelement.classList.add("id");
                    }));
                }));
                main.style.color = color;
            }));
            // emojify unicode to image (only if twemoji is declared in global)
            if (typeof twemoji !== "undefined")
                twemoji.parse(p);
            return p;
            //補助：中身をきめて作る
            function el(name, content) {
                var result = document.createElement(name);
                result.textContent = content;
                return result;
            }
            //補助: 2桁に0で埋める
            function zero2(num) {
                return ("00" + num).slice(-2);
            }
        };
        // IPアドレスから色を決める
        ChatLineMaker.prototype.getColorByIP = function (ip) {
            if ("string" === typeof ip) {
                var arr = ip.split(/\./);
                return "rgb(" + Math.floor(parseInt(arr[0]) * 0.75) + "," +
                    Math.floor(parseInt(arr[1]) * 0.75) + "," +
                    Math.floor(parseInt(arr[2]) * 0.75) + ")";
            }
            else {
                return "black";
            }
        };
        //コメントがオブジェクトのときはHTMLにする
        ChatLineMaker.prototype.commentHTMLify = function (comment) {
            var _this = this;
            if ("string" === typeof comment) {
                //テキストならテキストノード
                return document.createTextNode(comment);
            }
            else if (Array.isArray(comment)) {
                //配列のとき：全部つなげる
                var df = document.createDocumentFragment();
                comment.forEach(function (x) {
                    df.appendChild(_this.commentHTMLify(x));
                });
                return df;
            }
            else {
                //オブジェクトの場合
                //name:要素名 attributes: key-valueのオブジェクト style:key-valueのCSSスタイル
                //child: 中身(CommentObject)
                var elm = document.createElement(comment.name);
                for (var i in comment.attributes) {
                    elm.setAttribute(i, comment.attributes[i]);
                }
                for (var i in comment.style) {
                    elm.style.setProperty(i, comment.style[i], null);
                }
                elm.appendChild(this.commentHTMLify(comment.child));
                return elm;
            }
        };
        //チャネル表示
        ChatLineMaker.prototype.makeChannelSpan = function (channel) {
            var span = document.createElement("span");
            span.className = "channels";
            var wholeChannel = "";
            var channels = channel.split("/");
            for (var i = 0, l = channels.length; i < l; i++) {
                span.appendChild((function (i, ch) {
                    var span = document.createElement("span");
                    span.className = "channel";
                    if (i === 0) {
                        wholeChannel = ch;
                        span.textContent = "#" + ch;
                    }
                    else {
                        wholeChannel += "/" + ch;
                        span.textContent = "/" + ch;
                    }
                    span.dataset.channel = wholeChannel;
                    return span;
                })(i, channels[i]));
            }
            return span;
        };
        //ログを解析して追加する
        ChatLineMaker.prototype.parse = function (rawnode, obj) {
            var _this = this;
            var allowed_tag = ["s", "small", "code", "math"];
            if (rawnode.nodeType === Node.TEXT_NODE) {
                var node = rawnode;
                //テキストノード
                if (!node.parentNode)
                    return;
                //先頭から順番に処理
                while (node.nodeValue) {
                    var res = node.nodeValue.match(/^\[(\w+?)\]/);
                    //先頭が開始タグ
                    if (res) {
                        if (allowed_tag.indexOf(res[1]) < 0) {
                            //そんなタグはないよ!
                            node = node.splitText(res[0].length);
                            continue;
                        }
                        //タグが適用される部分をspanで囲む
                        var elem = document.createElement(res[1] == "math" ? "a" : "span");
                        elem.classList.add(res[1]);
                        //後ろを一旦全部突っ込む
                        elem.textContent = node.nodeValue.slice(res[0].length);
                        if (!elem.textContent) {
                            //空だったのでキャンセル.タダのテキストとして分離して次へ
                            node = node.splitText(res[0].length);
                            continue;
                        }
                        //処理対象をspanに置き換え
                        node.parentNode.replaceChild(elem, node);
                        node = elem.firstChild;
                        continue;
                    }
                    //終了タグ
                    res = node.nodeValue.match(/^\[\/(\w+?)\]/);
                    if (res) {
                        if (allowed_tag.indexOf(res[1]) < 0) {
                            node = node.splitText(res[0].length);
                            continue;
                        }
                        //閉じるべきタグを探す
                        var p = node;
                        while (p = p.parentNode) {
                            //nodeはテキストノードなので親からスターと
                            var cl = p.classList;
                            if (cl && cl.contains(res[1])) {
                                //問題のタグである
                                break;
                            }
                        }
                        //タグを閉じる
                        if (p) {
                            var elem_1 = p;
                            //終了タグを取り除いて、nodeの中には終了タグより右側が残る
                            node.nodeValue = node.nodeValue.slice(res[0].length);
                            elem_1.parentNode.insertBefore(node, p.nextSibling);
                            if (elem_1.classList.contains("math")) {
                                var img = new Image();
                                var a = elem_1;
                                a.href = img.src = this.mimetexUrl + "?" + elem_1.textContent;
                                a.target = "_blank";
                                elem_1.textContent = "";
                                elem_1.appendChild(img);
                            }
                        }
                        else {
                            //そのタグはなかった。ただのテキストとして処理
                            node = node.splitText(res[0].length);
                        }
                        continue;
                    }
                    //リンク
                    res = node.nodeValue.match(/^(https?:\/\/)(\S+)/);
                    if (res) {
                        var matched = false;
                        //URLがgyazo系かどうか調べる
                        for (var i = 0, l = this.gyazoSetting.length; i < l; i++) {
                            var settingObj = this.gyazoSetting[i];
                            var res2 = res[2].match(new RegExp("^" + settingObj.url.host.replace(".", "\\.") + "\/([0-9a-f]{32})(?:\\.png)?"));
                            if (!res2)
                                continue;
                            //Gyazo
                            var a = document.createElement("a");
                            a.target = "_blank";
                            a.href = res[1] + settingObj.url.host + "/" + res2[1] + (settingObj.url.ext ? ".png" : "");
                            a.classList.add("gyoza");
                            if (settingObj.thumb && this.userData.gyoza === 2) {
                                //餃子常時展開
                                this.openGyoza(settingObj, a, res2[1]);
                            }
                            else {
                                a.textContent = settingObj.text.normal;
                            }
                            //これは処理終了
                            node = node.splitText(res[1].length + res2[0].length);
                            //node.previousSiblingは、 splitTextで切断されたurl部分のテキストノード
                            node.parentNode.replaceChild(a, node.previousSibling);
                            matched = true;
                            break;
                        }
                        if (matched)
                            continue;
                        //通常のリンクだった
                        var a = document.createElement("a");
                        a.href = res[0];
                        a.target = "_blank";
                        try {
                            a.textContent = decodeURIComponent(res[0]);
                        }
                        catch (e) {
                            a.textContent = res[0];
                        }
                        node = node.splitText(res[0].length);
                        node.parentNode.replaceChild(a, node.previousSibling);
                        continue;
                    }
                    //チャネルリンク
                    res = node.nodeValue.match(/^(\s*\.?)#(\S+)/);
                    if (res) {
                        if (res[1]) {
                            //前の空白はいらないのでそのまま流す
                            node = node.splitText(res[1].length);
                        }
                        //ログが所属するチャネルと一致する?
                        var chs = Array.isArray(obj.channel) ? obj.channel.concat([]) : [];
                        var i = chs.length;
                        if (i > 0) {
                            //長さでソート
                            chs.sort(function (a, b) {
                                return a.length - b.length;
                            });
                        }
                        //属していないチャネルに対してもリンクできるようにした
                        //前方一致;この部分がチャネル
                        var span = this.makeChannelSpan(res[2]);
                        //チャネル部分を分離
                        node = node.splitText(res[2].length + 1);
                        node.parentNode.replaceChild(span, node.previousSibling);
                        //残りは何もない。流す
                        node = node.splitText(0);
                        if (i < 0) {
                            //見つからなかった
                            node = node.splitText(res[2].length + 1);
                        }
                        continue;
                    }
                    //その他　上のマークアップが車で通常の文字列
                    res = node.nodeValue.match(/^(.+?)(?=\[\/?\w+?\]|https?:\/\/|\s*[ .]#\S+)/);
                    if (res) {
                        node = node.splitText(res[0].length);
                        continue;
                    }
                    //名にもないただのテキスト nodeを空にする
                    node = node.splitText(node.nodeValue.length);
                }
            }
            else if (rawnode.childNodes) {
                //elementノード
                var nodes = [];
                //途中でchildNodesが変化するので、処理対象のノードをリストアップ
                for (var i = 0, l = rawnode.childNodes.length; i < l; i++) {
                    nodes.push(rawnode.childNodes[i]);
                }
                nodes.forEach(function (x) {
                    if (x.parentNode === rawnode)
                        _this.parse(x, obj);
                });
            }
        };
        //餃子サムネイルを展開する
        ChatLineMaker.prototype.openGyoza = function (settingObj, a, imageid) {
            //a: [Gyazo]リンク	imageid:32桁のやつ
            //まず中を削る
            while (a.hasChildNodes())
                a.removeChild(a.firstChild);
            //Loading
            //Textをとっておく（あとで取り除くので）
            var text = document.createTextNode(settingObj.text.opening);
            a.appendChild(text);
            //画像設置
            var img = document.createElement("img");
            img.classList.add("thumbnail");
            img.hidden = true;
            a.appendChild(img);
            //読み込みをまつ
            img.addEventListener("load", function (e) {
                //文字列を消して画像を表示
                a.removeChild(text);
                img.hidden = false;
            }, false);
            //失敗時
            img.addEventListener("error", function (e) {
                //文字列変更
                text.data = settingObj.text.error;
                //画像除去
                a.removeChild(img);
            }, false);
            img.src = settingObj.url.thumbnailUrlGenerator(imageid);
            img.alt = imageid + ".png";
            //開いた印
            a.classList.add("gyozaloaded");
        };
        //餃子を判別した上で展開する
        ChatLineMaker.prototype.checkGyoza = function (a) {
            for (var i = 0, l = this.gyazoSetting.length; i < l; i++) {
                var settingObj = this.gyazoSetting[i];
                if (!settingObj.thumb)
                    continue;
                var result = a.href.match(new RegExp("^https?://" + settingObj.url.host.replace(".", "\\.") + "/([0-9a-f]{32})(?:\\.png)?$"));
                if (result) {
                    //これだ!
                    this.openGyoza(settingObj, a, result[1]);
                }
            }
        };
        ChatLineMaker.getRegularUrlGenerator = function (url) { return function (hash) { return url + hash + ".png"; }; };
        return ChatLineMaker;
    }());
    Chat.ChatLineMaker = ChatLineMaker;
    //チャットのユーザー一覧を表示するやつ
    var ChatUserView = /** @class */ (function () {
        function ChatUserView(receiver, view, dis) {
            this.receiver = receiver;
            this.view = view;
            this.dis = dis;
            this.container = document.createElement("div");
            this.container.classList.add("userinfo");
            //ユーザー数表示部分
            this.userNumber = document.createElement("div");
            this.userNumber.classList.add("usernumber");
            this.userNumber.dataset.roms = "0";
            this.userNumber.dataset.actives = "0";
            this.container.appendChild(this.userNumber);
            //リスト部分
            this.userList = document.createElement("ul");
            this.userList.classList.add("users");
            this.container.appendChild(this.userList);
            //リストのクリック
            this.userList.addEventListener("click", this.clickHandler.bind(this), false);
            //ユーザー情報を監視
            receiver.on("userinit", this.userinit.bind(this));
            receiver.on("newuser", this.newuser.bind(this));
            receiver.on("deluser", this.deluser.bind(this));
            receiver.on("inout", this.inout.bind(this));
        }
        ChatUserView.prototype.getContainer = function () {
            return this.container;
        };
        ChatUserView.prototype.clickHandler = function (e) {
            //ユーザー一覧をクリック
            var t = e.target;
            // if emojified, target element is its parent of parent
            if (t.tagName === "IMG" && t.classList.contains("emoji"))
                t = t.parentElement.parentElement;
            else
                t = t.parentElement;
            if (/li/i.test(t.tagName) && t.dataset.ip) {
                if (!this.dis.addDisip(t.dataset.ip)) {
                    //既にあった=消す
                    this.dis.removeDisip(t.dataset.ip);
                }
            }
        };
        //処理用
        ChatUserView.prototype.userinit = function (data) {
            //リストの中を初期化
            var r = document.createRange();
            r.selectNodeContents(this.userList);
            r.deleteContents();
            r.detach();
            //数の情報を更新
            this.userNumber.dataset.actives = "0";
            this.userNumber.dataset.roms = "0";
            data.users.forEach(this.newuser, this);
        };
        //人数をセットして反映
        ChatUserView.prototype.setusernumber = function (actives, roms) {
            var dataset = this.userNumber.dataset;
            dataset.actives = String(parseInt(dataset.actives) + actives);
            dataset.roms = String(parseInt(dataset.roms) + roms);
            this.userNumber.textContent = "入室" + dataset.actives + (dataset.roms !== "0" ? " (ROM" + dataset.roms + ")" : "");
        };
        ChatUserView.prototype.newuser = function (user) {
            if (user.rom) {
                //romだ!(数だけ変更)
                //rom+1
                this.setusernumber(0, 1);
                return;
            }
            //activeユーザー追加
            this.setusernumber(1, 0);
            this.newuserinfo(user);
        };
        ChatUserView.prototype.newuserinfo = function (user) {
            var li = document.createElement("li");
            var sp = document.createElement("span");
            sp.textContent = user.name;
            sp.title = user.ip + " / " + user.ua;
            li.dataset.id = String(user.id);
            li.dataset.ip = user.ip;
            li.appendChild(sp);
            // emojify unicode to image (only if twemoji is declared in global)
            if (typeof twemoji !== "undefined")
                twemoji.parse(li);
            this.userList.appendChild(li);
        };
        //誰かがお亡くなりに
        ChatUserView.prototype.deluser = function (userid) {
            var elem = this.getUserElement(userid);
            if (!elem) {
                //ROMユーザーだろう
                this.setusernumber(0, -1);
                return;
            }
            //アクティブユーザーだ
            this.setusernumber(-1, 0);
            this.userList.removeChild(elem);
        };
        //そのユーザーを表すやつを手に入れる
        ChatUserView.prototype.getUserElement = function (id) {
            var lis = this.userList.childNodes;
            for (var i = 0, l = lis.length; i < l; i++) {
                var dataset = lis[i].dataset;
                if (dataset && dataset.id === String(id)) {
                    return lis[i];
                }
            }
            return null;
        };
        //誰かが入退室した
        ChatUserView.prototype.inout = function (user) {
            var elem = this.getUserElement(user.id);
            if (elem) {
                //古いのはいらない
                this.userList.removeChild(elem);
            }
            if (user.rom) {
                //activeからromになった
                this.setusernumber(-1, 1);
            }
            else {
                //romからactiveになった
                this.setusernumber(1, -1);
                //用意してあげる
                this.newuserinfo(user);
            }
        };
        return ChatUserView;
    }());
    Chat.ChatUserView = ChatUserView;
    //UI
    var ChatUI = /** @class */ (function () {
        //protected
        function ChatUI(userData, receiver, process, view) {
            this.userData = userData;
            this.receiver = receiver;
            this.process = process;
            this.view = view;
        }
        ChatUI.prototype.cleanup = function () {
            //UI消えるときの後処理
        };
        ChatUI.prototype.getContainer = function () {
            return this.container;
        };
        ChatUI.prototype.getView = function () {
            return this.view;
        };
        ChatUI.prototype.focusComment = function (focus, channel) {
        };
        ChatUI.prototype.refreshSettings = function () {
        };
        return ChatUI;
    }());
    Chat.ChatUI = ChatUI;
    //発言などのUI部分
    var ChatNormalUI = /** @class */ (function (_super) {
        __extends(ChatNormalUI, _super);
        function ChatNormalUI(userData, receiver, process, view, dis, channel) {
            var _this = _super.call(this, userData, receiver, process, view) || this;
            _this.container = document.createElement("div");
            _this.container.classList.add("ui");
            //フォーム用意
            //まず入退室フォーム
            _this.inoutForm = new ChatUICollection.InoutForm(_this.userData, _this.receiver);
            _this.container.appendChild(_this.inoutForm.getContainer());
            //次に発言フォーム
            _this.commentForm = new ChatUICollection.CommentForm(receiver, false, channel);
            _this.container.appendChild(_this.commentForm.getContainer());
            //操作に対応する
            _this.inoutForm.onInout(function (data) {
                _this.process.inout(data);
            });
            _this.commentForm.event.on("comment", function (data) {
                _this.process.comment(data);
            });
            _this.commentForm.event.on("changeChannel", function (channel) {
                dis.setFocusChannel(channel || null, false);
                _this.commentForm.event.emit("afterChangeChannel", false);
            });
            _this.commentForm.event.on("afterChangeChannel", function (on) {
                if (on /* && this.userData.channelMode==0*/) {
                    dis.addFocusOutlaw(true);
                }
                else {
                    dis.removeFocusOutlaw(true);
                }
            });
            return _this;
        }
        ChatNormalUI.prototype.getContainer = function () {
            return this.container;
        };
        //発言欄にフォーカスする
        ChatNormalUI.prototype.focusComment = function (focus, channel) {
            if (focus)
                this.commentForm.focus();
            this.commentForm.setChannel(channel);
            this.commentForm.event.emit("afterChangeChannel", false);
        };
        return ChatNormalUI;
    }(ChatUI));
    Chat.ChatNormalUI = ChatNormalUI;
    //UIパーツ
    var ChatUICollection;
    (function (ChatUICollection) {
        var UIObject = /** @class */ (function () {
            function UIObject() {
                this.event = Chat.getEventEmitter();
            }
            UIObject.prototype.getContainer = function () {
                return this.container;
            };
            //inputを作る
            UIObject.prototype.makeinput = function (callback) {
                var result = document.createElement("input");
                callback(result);
                return result;
            };
            return UIObject;
        }());
        ChatUICollection.UIObject = UIObject;
        //入退室フォーム
        var InoutForm = /** @class */ (function (_super) {
            __extends(InoutForm, _super);
            //private event:EventEmitter;
            //private container:HTMLFormElement;
            function InoutForm(userData, receiver) {
                var _this = _super.call(this) || this;
                _this.userData = userData;
                _this.receiver = receiver;
                _this.container = document.createElement("form");
                var cont = _this.container;
                var p;
                p = document.createElement("p");
                _this.container.appendChild(p);
                //まず名前フォーム
                p.appendChild(_this.makeinput(function (input) {
                    input.name = "uname";
                    input.size = 20;
                    input.maxLength = 25;
                    input.required = true;
                    input.placeholder = "名前";
                    //最初
                    input.value = _this.userData.name || "";
                }));
                //入退室ボタン
                p.appendChild(_this.makeinput(function (input) {
                    input.name = "inoutbutton";
                    input.type = "submit";
                    input.value = "入室";
                }));
                //入退室時にフォームがかわる
                _this.receiver.on("userinfo", function (data) {
                    cont.elements["uname"].disabled = !data.rom;
                    cont.elements["inoutbutton"].value = data.rom ? "入室" : "退室";
                });
                _this.container.addEventListener("submit", function (e) {
                    e.preventDefault();
                    _this.emitInout(e);
                }, false);
                return _this;
            }
            //入退室ボタンが押されたときの処理
            InoutForm.prototype.emitInout = function (e) {
                var cont = this.container;
                var data = {
                    name: cont.elements["uname"].value,
                };
                this.event.emit("inout", data);
            };
            InoutForm.prototype.onInout = function (func) {
                this.event.on("inout", func);
            };
            return InoutForm;
        }(UIObject));
        ChatUICollection.InoutForm = InoutForm;
        //入退室フォーム
        var CommentForm = /** @class */ (function (_super) {
            __extends(CommentForm, _super);
            function CommentForm(receiver, canselable, channel) {
                var _this = 
                //canselable: キャンセルボタンがつく
                _super.call(this) || this;
                _this.receiver = receiver;
                _this.canselable = canselable;
                _this.flagFocusOutlaw = false;
                _this.container = document.createElement("form");
                _this.container.classList.add("commentform");
                var p;
                p = document.createElement("p");
                _this.container.appendChild(p);
                var us = receiver.getUserinfo();
                //発言欄
                p.appendChild(_this.makeinput(function (input) {
                    input.name = "comment";
                    input.type = "text";
                    input.size = 60;
                    input.autocomplete = "off";
                    input.required = true;
                    input.disabled = us.rom;
                    input.addEventListener("input", function (e) { return _this.emitInput(); });
                }));
                p.appendChild(document.createTextNode("#"));
                //チャネル欄
                var channelInput;
                p.appendChild(_this.makeinput(function (input) {
                    channelInput = input;
                    input.name = "channel";
                    input.type = "text";
                    input.size = 10;
                    input.disabled = us.rom;
                    if (channel)
                        input.value = channel;
                    input.addEventListener("blur", function (e) {
                        _this.event.emit("changeChannel", input.value);
                    }, false);
                    //validate
                    input.addEventListener("input", function (e) {
                        if (!input.value || validateHashtag(input.value)) {
                            input.setCustomValidity("");
                        }
                        else {
                            input.setCustomValidity("不正なチャネル名です");
                        }
                    }, false);
                    input.dataset.autocomplete = "/channels";
                }));
                //発言ボタン
                p.appendChild(_this.makeinput(function (input) {
                    input.name = "commentbutton";
                    input.type = "submit";
                    input.value = "発言";
                    input.disabled = us.rom;
                }));
                _this.receiver.on("userinfo", function (data) {
                    ["comment", "channel", "commentbutton"].forEach(function (x) {
                        _this.container.elements[x].disabled = data.rom;
                    });
                });
                _this.container.addEventListener("submit", function (e) {
                    e.preventDefault();
                    _this.emitComment(e);
                    _this.emitInput();
                    _this.event.emit("changeChannel", channelInput.value); // hack
                }, false);
                if (canselable) {
                    //キャンセルボタン
                    p.appendChild(_this.makeinput(function (input) {
                        input.name = "canselbutton";
                        input.type = "button";
                        input.value = "キャンセル";
                        input.addEventListener("click", function (e) {
                            _this.event.emit("cancel");
                        }, false);
                    }));
                }
                // inputが描画されてから起動
                setTimeout(function () {
                    new AutoComplete({}, channelInput);
                }, 0);
                function validateHashtag(channel) {
                    if ("string" !== typeof channel)
                        return false;
                    if (channel === "")
                        return false;
                    //スペースや#を含んではいけない
                    if (/\s|#/.test(channel))
                        return false;
                    //スラッシュで始まらない
                    if (/^\//.test(channel))
                        return false;
                    //スラッシュで終わらない
                    if (/\/$/.test(channel))
                        return false;
                    //スラッシュが連続しない
                    if (/\/\//.test(channel))
                        return false;
                    //OK!
                    return true;
                }
                return _this;
            }
            //入退室ボタンが押されたときの処理
            CommentForm.prototype.emitComment = function (e) {
                var form = this.container;
                //チャネル
                var channel = null;
                var channelvalue = form.elements["channel"].value;
                if (channelvalue) {
                    channel = [channelvalue];
                }
                var data = {
                    comment: form.elements["comment"].value,
                    response: null,
                    channel: channel,
                };
                this.event.emit("comment", data);
                //フォームを消す
                form.elements["comment"].value = "";
            };
            //コメント欄が変わった時の処理
            //outlaw(タグがない発言)への注目処理
            CommentForm.prototype.emitInput = function () {
                if (this.getChannel() != "") {
                    //チャネルが指定されている場合はオンにしない
                    if (this.flagFocusOutlaw) {
                        //オンなときはオフにする
                        this.flagFocusOutlaw = false;
                        this.event.emit("afterChangeChannel", false);
                    }
                    return;
                }
                var nowCommentEmpty = this.container.elements["comment"].value.length == 0;
                if ((this.flagFocusOutlaw && nowCommentEmpty) || (!this.flagFocusOutlaw && !nowCommentEmpty)) {
                    this.event.emit("afterChangeChannel", !nowCommentEmpty);
                }
                this.flagFocusOutlaw = !nowCommentEmpty;
            };
            //フォーカスする(チャネル指定可能）
            CommentForm.prototype.focus = function () {
                this.container.elements["comment"].focus();
            };
            CommentForm.prototype.setChannel = function (channel) {
                this.container.elements["channel"].value = channel ? channel : "";
            };
            CommentForm.prototype.getChannel = function () {
                return this.container.elements["channel"].value;
            };
            return CommentForm;
        }(UIObject));
        ChatUICollection.CommentForm = CommentForm;
        var MottoForm = /** @class */ (function (_super) {
            __extends(MottoForm, _super);
            //private event:EventEmitter;
            //private container:HTMLFormElement;
            function MottoForm() {
                var _this = _super.call(this) || this;
                _this.container = document.createElement("form");
                var p;
                p = document.createElement("p");
                _this.container.appendChild(p);
                //HottoMottoButton
                p.appendChild(_this.makeinput(function (input) {
                    input.type = "submit";
                    input.value = "HottoMotto";
                }));
                _this.container.addEventListener("submit", function (e) {
                    e.preventDefault();
                    _this.emitMotto(e);
                }, false);
                return _this;
            }
            //入退室ボタンが押されたときの処理
            MottoForm.prototype.emitMotto = function (e) {
                var data = {};
                this.event.emit("motto", data);
            };
            MottoForm.prototype.onMotto = function (func) {
                this.event.on("motto", func);
            };
            return MottoForm;
        }(UIObject));
        ChatUICollection.MottoForm = MottoForm;
        //コマンドライン用コンソール
        var Console = /** @class */ (function (_super) {
            __extends(Console, _super);
            function Console(userData, receiver, process, ui) {
                var _this = _super.call(this) || this;
                _this.userData = userData;
                _this.receiver = receiver;
                _this.process = process;
                _this.ui = ui;
                _this.commandlog = [];
                _this.commandlogindex = null;
                _this.indentSpace = "";
                _this.saves = [];
                _this.cmode = "down"; //up:新しいログ上へ、down:下へ
                _this.makeConsole();
                _this.cmdprocess = null;
                return _this;
            }
            //コンソール初期化
            Console.prototype.makeConsole = function () {
                var _this = this;
                //コンテナ=コンソール画面
                this.container = document.createElement("div");
                this.container.classList.add("console");
                setUniqueId(this.container, "console");
                this.setHeight(this.userData.cmd.height);
                this.consoleo = document.createElement("pre");
                this.consoleo.classList.add("consoleoutput");
                this.container.appendChild(this.consoleo);
                //入力部分を作る
                var p = document.createElement("p");
                this.command = document.createElement("input");
                this.commandtopelement = document.createElement("span");
                this.commandtopelement.textContent = "> ";
                p.appendChild(this.commandtopelement);
                p.appendChild(this.command);
                if (this.cmode === "up") {
                    this.container.insertBefore(p, this.consoleo);
                }
                else {
                    this.container.appendChild(p);
                }
                //クリックされると入力フォーカス
                this.container.addEventListener("click", function (e) {
                    _this.focusConsole();
                }, false);
                //キーを捕捉する
                var handler = this.keydown.bind(this);
                document.addEventListener("keydown", handler, false);
                //後始末
                this.event.on("exit", function () {
                    document.removeEventListener("keydown", handler, false);
                });
            };
            //自分も始末する
            Console.prototype.cleanup = function () {
                var _this = this;
                this.event.emit("exit");
                setTimeout(function () {
                    if (_this.container.parentNode)
                        _this.container.parentNode.removeChild(_this.container);
                }, 350);
            };
            //キーを・・・
            Console.prototype.keydown = function (e) {
                //プロセスに送る
                if (this.cmdprocess) {
                    if (!this.cmdprocess.gotKey(e)) {
                        e.preventDefault();
                        return;
                    }
                }
                var act = document.activeElement;
                if (/^input|button$/i.test(act.tagName) && act !== this.command) {
                    //邪魔しない
                    return;
                }
                if (e.keyCode === 13 || e.keyCode === 27) {
                    //Enter,Esc
                    if (!this.container.classList.contains("open")) {
                        //開く
                        this.openConsole();
                        e.preventDefault();
                        return;
                    }
                    else if (this.command.value === "") {
                        //閉じる
                        this.closeConsole();
                        e.preventDefault();
                        return;
                    }
                }
                if (e.keyCode === 13 && !this.cmdprocess) {
                    //コマンド実行
                    this.execCommand(this.command.value);
                    this.command.value = "";
                    this.focusConsole();
                    e.preventDefault();
                    return;
                }
                //コマンド履歴をスクロールする
                if ((e.keyCode === 38 || e.keyCode === 40) && this.command === document.activeElement && this.container.classList.contains("open")) {
                    //上下
                    if (this.commandlogindex == null) {
                        this.commandlogindex = this.commandlog.length - 1;
                    }
                    else if (e.keyCode === 38) {
                        this.commandlogindex--;
                        if (this.commandlogindex < 0)
                            this.commandlogindex = 0;
                    }
                    else {
                        this.commandlogindex++;
                        if (this.commandlogindex >= this.commandlog.length)
                            this.commandlogindex = this.commandlog.length - 1;
                    }
                    if (this.commandlog[this.commandlogindex]) {
                        this.command.value = this.commandlog[this.commandlogindex];
                    }
                }
            };
            Console.prototype.openConsole = function () {
                this.container.classList.add("open");
                this.focusConsole();
            };
            Console.prototype.closeConsole = function () {
                this.container.classList.remove("open");
                this.command.blur();
                this.event.emit("close");
            };
            Console.prototype.onClose = function (func) {
                this.event.on("close", func);
            };
            Console.prototype.focusConsole = function () {
                //コンソールにフォーカスする
                //コマンドにフォーカスするとスクロールしてしまうので一時的にスクロール位置保存
                var sc = document.documentElement.scrollTop || document.body.scrollTop;
                this.command.focus();
                //戻す
                document.documentElement.scrollTop && (document.documentElement.scrollTop = sc);
                document.body.scrollTop && (document.body.scrollTop = sc);
            };
            Console.prototype.setHeight = function (height) {
                if (!height)
                    height = "30em";
                var st = document.styleSheets.item(0);
                st.insertRule("#" + this.container.id + " { height: " + height + "; bottom:-" + height + "}", st.cssRules.length);
            };
            Console.prototype.openInput = function (topstr) {
                if (topstr != null) {
                    this.commandtopelement.textContent = topstr ? topstr + " " : "";
                }
                this.command.disabled = false;
                this.command.parentNode.hidden = false;
            };
            Console.prototype.hideInput = function () {
                this.command.disabled = true;
                this.command.parentNode.hidden = true;
            };
            Console.prototype.setInput = function (str) {
                this.command.value = str;
            };
            Console.prototype.getInput = function () {
                return this.command.value;
            };
            //一番下を見せる
            Console.prototype.scrollDown = function () {
                this.container.scrollTop = this.container.scrollHeight - this.container.clientHeight;
            };
            Console.prototype.execCommand = function (line) {
                var syschar = this.userData.cmd.syschar;
                var result = line.match(new RegExp("^\\" + syschar + "(\\S+)\\s*"));
                if (!result && line) {
                    //通常の発言
                    var data = {
                        comment: line,
                        response: null,
                        channel: null,
                    };
                    this.process.comment(data);
                    return;
                }
                //履歴にコマンドを追加する
                this.addCommandLog(line);
                this.print("> " + line);
                //命令・スペースを除去する
                line = line.slice(result[0].length);
                var errorMessage = this.runCommand(result[1], line);
                if (errorMessage) {
                    this.print(errorMessage, { color: "red" });
                }
            };
            //返り値: error message
            Console.prototype.runCommand = function (name, args) {
                var c = null;
                //選択
                if (name === "in") {
                    c = ChatCmdProcessCollection.In;
                }
                else if (name === "out") {
                    c = ChatCmdProcessCollection.Out;
                }
                else if (name === "motto") {
                    c = ChatCmdProcessCollection.Motto;
                }
                else if (name === "volume") {
                    c = ChatCmdProcessCollection.Volume;
                }
                else if (name === "gyoza" || name === "gyazo") {
                    c = ChatCmdProcessCollection.Gyoza;
                }
                else if (name === "set") {
                    c = ChatCmdProcessCollection.Set;
                }
                else if (name === "clear" || name === "clean") {
                    c = ChatCmdProcessCollection.Clean;
                }
                else if (name === "help") {
                    c = ChatCmdProcessCollection.Help;
                }
                else if (name === "go") {
                    c = ChatCmdProcessCollection.Go;
                }
                else if (name === "disip") {
                    c = ChatCmdProcessCollection.Disip;
                }
                else if (name === "dischannel") {
                    c = ChatCmdProcessCollection.Dischannel;
                }
                else if (name === "sl") {
                    c = ChatCmdProcessCollection.Sl;
                }
                if (c) {
                    var p = new c(this.ui, this, this.process, this.userData, args);
                    this.cmdprocess = p;
                    p.run();
                    return null;
                }
                else {
                    return "Unknown command: " + name;
                }
            };
            //コマンド終了
            Console.prototype.endProcess = function () {
                this.cmdprocess = null;
                this.openInput(">");
            };
            Console.prototype.addCommandLog = function (line) {
                this.commandlog.push(line);
                //古いほうを消す
                if (this.commandlog.length > 50) {
                    this.commandlog.shift();
                }
                this.commandlogindex = null;
            };
            //コンソールに文字出力
            Console.prototype.print = function (str, option) {
                //改行付き
                this.put(str + "\n", option);
            };
            //生
            Console.prototype.put = function (str, option) {
                var _this = this;
                //まずインデント設定
                if (this.indentSpace.length > 0) {
                    str = str.split("\n").map(function (x, i) {
                        return i > 0 && x ? _this.indentSpace + x : x;
                    }).join("\n");
                    //行頭インデント
                    if (this.cmode === "up") {
                        var con = this.consoleo.textContent;
                        if (con.length === 0 || con.charAt(0) === "\n") {
                            //最初にもインデント必要
                            str = this.indentSpace + str;
                        }
                    }
                    else {
                        if (con.length === 0 || con.charAt(con.length - 1) === "\n") {
                            str = this.indentSpace + str;
                        }
                    }
                }
                if (this.cmode === "up") {
                    //改行で分ける
                    var lines = str.split("\n");
                    var df = document.createDocumentFragment(); //2行め以降をまとめておく
                    var first = lines.shift();
                    //逆順か
                    lines.reverse();
                    var remains = lines.join("\n");
                    if (remains) {
                        df.appendChild(makeNode(remains, option));
                    }
                    //いい位置を探す
                    var tw = document.createTreeWalker(this.consoleo, NodeFilter.SHOW_TEXT, function (node) {
                        return NodeFilter.FILTER_ACCEPT;
                    }, false);
                    var node;
                    while (node = tw.nextNode()) {
                        var idx = node.data.lastIndexOf("\n");
                        if (idx < 0) {
                            //改行がない
                            continue;
                        }
                        //改行があった!改行の後ろに追加する
                        var range = document.createRange();
                        range.setStart(this.consoleo, 0); //出力の一番最初
                        range.setEnd(node, idx); //改行の直前まで
                        //改行の前までを抜き出す
                        var c = range.extractContents();
                        //間にはさんで追加する
                        this.consoleo.insertBefore(makeNode(first, option), this.consoleo.firstChild);
                        //戻す
                        this.consoleo.insertBefore(c, this.consoleo.firstChild);
                        range.detach();
                        break;
                    }
                    if (!node) {
                        //入れられなかった
                        this.consoleo.appendChild(node);
                    }
                    //残り
                    this.consoleo.insertBefore(df, this.consoleo.firstChild);
                    this.consoleo.normalize();
                }
                else {
                    //下に追加するだけじゃん!
                    this.consoleo.appendChild(makeNode(str, option));
                    this.consoleo.normalize();
                    this.scrollDown();
                }
                //テキストをラップする
                function makeNode(text, option) {
                    var ins;
                    if (!option) {
                        ins = document.createTextNode(text);
                    }
                    else {
                        ins = document.createElement("span");
                        ins.textContent = text;
                        //cssプロパティ
                        for (var key in option) {
                            if (option[key] != null) {
                                ins.style.setProperty(key, option[key], null);
                            }
                        }
                    }
                    return ins;
                }
            };
            Console.prototype.indent = function (num, callback) {
                //内部を印伝として表示
                var t = this;
                setindent(num);
                callback();
                setindent(-num);
                function setindent(n) {
                    if (n > 0) {
                        for (var i = 0; i < n; i++) {
                            t.indentSpace += " ";
                        }
                    }
                    else if (n < 0) {
                        t.indentSpace = t.indentSpace.slice(-n);
                    }
                }
            };
            //行削除(num: 後ろから何行消すか）
            Console.prototype.deletelines = function (num) {
                if (num == null) {
                    this.consoleo.textContent = "";
                    return;
                }
                if (num <= 0)
                    return;
                var tw = document.createTreeWalker(this.consoleo, NodeFilter.SHOW_TEXT, function (node) {
                    return NodeFilter.FILTER_ACCEPT;
                }, false);
                var node, count = num;
                var range = document.createRange();
                range.selectNodeContents(this.consoleo);
                if (this.cmode === "up") {
                    //前から
                    if (this.consoleo.textContent.charAt(0) === "\n") {
                        count++;
                    }
                    big: while (node = tw.nextNode()) {
                        var idx = 0;
                        while ((idx = node.data.indexOf("\n", idx)) >= 0) {
                            //改行 みつけた
                            count--;
                            if (count <= 0) {
                                range.setEnd(node, idx); //改行の手前まで
                                break big;
                            }
                        }
                    }
                    //breakしなかったら最後まで消すのだ
                }
                else {
                    //後ろから
                    var cono = this.consoleo.textContent;
                    if (cono.charAt(cono.length - 1) === "\n") {
                        count++;
                    }
                    big: while (node = tw.previousNode()) {
                        var idx = 0;
                        while ((idx = node.data.lastIndexOf("\n", idx)) >= 0) {
                            //改行
                            count--;
                            if (count <= 0) {
                                range.setStart(node, idx + 1); //改行の直後まで
                                break big;
                            }
                        }
                    }
                }
                //中身を抜く
                range.deleteContents();
                range.detach();
            };
            Console.prototype.newContext = function () {
                //前のをとっておいて出力を空に
                var range = document.createRange();
                range.selectNodeContents(this.consoleo);
                this.saves.push(range.extractContents());
                range.detach();
            };
            Console.prototype.restoreContext = function () {
                var range = document.createRange();
                range.selectNodeContents(this.consoleo);
                range.deleteContents();
                range.insertNode(this.saves.pop());
                range.detach();
            };
            return Console;
        }(UIObject));
        ChatUICollection.Console = Console;
    })(ChatUICollection = Chat.ChatUICollection || (Chat.ChatUICollection = {}));
    //コマンドライン用プロセス
    var ChatCmdProcessCollection;
    (function (ChatCmdProcessCollection) {
        var Process = /** @class */ (function () {
            //protectedが欲しい事例
            function Process(ui, console, process, userData, arg) {
                this.ui = ui;
                this.console = console;
                this.process = process;
                this.userData = userData;
                this.arg = arg;
                //want protected
                this.key = null;
            }
            //引数を配列に分けて返す
            Process.prototype.parseArg = function () {
                var reqs = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    reqs[_i] = arguments[_i];
                }
                var a = this.arg;
                var result = [];
                //まず単語に分解
                var words = [];
                while (a = a.replace(/^\s+/, "")) {
                    var r;
                    if (a.charAt(0) === '"') {
                        // "囲み
                        r = a.match(/^\"(?:[^\"]|\\")*\"(?=\s+|$)/);
                        if (r) {
                            //囲まれた
                            words.push(r[0]); //""ごと
                            a = a.slice(r[0].length);
                            continue;
                        }
                    }
                    else if (a.charAt(0) === "'") {
                        r = a.match(/^\'(?:[^\"]|\\')*\'(?=\s+|$)/);
                        if (r) {
                            //囲まれた
                            words.push(r[0]); //""ごと
                            a = a.slice(r[0].length);
                            continue;
                        }
                    }
                    //ダメだったら空白まで
                    r = a.match(/^\S+/);
                    if (r) {
                        words.push(r[0]);
                        a = a.slice(r[0].length);
                    }
                }
                //wordsと引数をてらしあわす
                var addto = null, addremain = null;
                for (var i = 0, l = words.length; i < l; i++) {
                    var word = words[i];
                    //対応する引数探す
                    //まずoptionの
                    for (var j = 0, m = reqs.length; j < m; j++) {
                        var req = reqs[j];
                        if (!result[j] && req.option) {
                            if (req.name.indexOf(word) >= 0) {
                                addremain = req.num || 0;
                                result[j] = {
                                    active: true,
                                    option: true,
                                    value: word,
                                    params: []
                                };
                                if (addremain) {
                                    //追加モード
                                    addto = result[j];
                                }
                                else {
                                    //通常通り
                                    addto = null;
                                }
                                words.splice(i, 1);
                                i--, l--;
                                break;
                            }
                        }
                    }
                    if (j === m) {
                        //見つからなかった（ただの引数）
                        if (addremain && addto) {
                            word = normalize(word);
                            addto.params.push(word);
                            addremain--;
                            words.splice(i, 1);
                            i--, l--;
                        }
                    }
                }
                //一周目終了。残りを埋める
                for (var j = 0, m = reqs.length; j < m; j++) {
                    if (result[j])
                        continue; //処理終了した
                    var req = reqs[j];
                    if (!req.option) {
                        for (i = 0; i < l; i++) {
                            var word = words[i];
                            result[j] = {
                                active: true,
                                option: false,
                                value: normalize(word),
                            };
                            words.splice(i, 1);
                            i--, l--;
                            break;
                        }
                    }
                    else {
                        result[j] = {
                            active: false,
                            option: true,
                            value: req.name[0],
                            params: [],
                        };
                    }
                }
                //最後に省略引数の処理
                for (var j = 0, m = reqs.length; j < m; j++) {
                    if (!result[j]) {
                        var req = reqs[j];
                        result[j] = {
                            active: false,
                            option: req.option,
                            value: req.option ? req.name[0] : null,
                        };
                    }
                }
                return result;
                function normalize(word) {
                    //""などを取り除く
                    var r;
                    if (r = word.match(/^\"(.*)\"$/)) {
                        return r[1];
                    }
                    if (r = word.match(/^\'(.*)\'$/)) {
                        return r[1];
                    }
                    return word;
                }
            };
            Process.prototype.gotKey = function (e) {
                if (!this.key)
                    return true; //妨げない
                return this.key(e);
            };
            //コンソール操作系
            Process.prototype.print = function (str, option) {
                this.console.print(str, option);
            };
            Process.prototype.put = function (str, option) {
                this.console.put(str, option);
            };
            //エラー表示
            Process.prototype.error = function (str, option) {
                if (option === void 0) { option = {}; }
                option.color = "#ff6666";
                this.print(str, option);
            };
            Process.prototype.indent = function (num, callback) {
                this.console.indent(num, callback);
            };
            //行単位入力
            Process.prototype.input = function (multiline, callback) {
                var _this = this;
                //multiline:複数行対応
                this.console.openInput("");
                var result = "";
                this.key = function (e) {
                    if (e.keyCode === 13) {
                        //Enter=行
                        var inp = _this.console.getInput();
                        _this.print(inp);
                        result += inp + "\n";
                        _this.console.setInput("");
                        _this.console.focusConsole();
                        if (!multiline || !e.shiftKey) {
                            //終了
                            _this.console.hideInput();
                            _this.key = null;
                            callback(result);
                        }
                        return false;
                    }
                    return true;
                };
            };
            //キー単位入力
            Process.prototype.inputKey = function (callback) {
                var _this = this;
                this.console.openInput("");
                this.key = function (e) {
                    e.preventDefault();
                    if (!callback(e)) {
                        _this.key = null;
                    }
                    return false;
                };
            };
            //走る
            Process.prototype.run = function () {
            };
            //終了
            Process.prototype.die = function () {
                this.console.endProcess();
            };
            //末尾の改行をけす
            Process.prototype.chomp = function (str) {
                return str.replace(/\n+$/, "");
            };
            return Process;
        }());
        ChatCmdProcessCollection.Process = Process;
        //コマンドの実装
        var In = /** @class */ (function (_super) {
            __extends(In, _super);
            function In() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            In.prototype.run = function () {
                var args = this.parseArg({
                    option: false,
                }, {
                    option: true,
                    name: ["--auto"],
                    num: 0,
                }, {
                    option: true,
                    name: ["--noauto"],
                    num: 0,
                });
                if (args[1].active) {
                    //autoin
                    this.userData.autoin = true;
                    this.userData.save();
                    this.print("autoin set.");
                }
                else if (args[2].active) {
                    this.userData.autoin = false;
                    this.userData.save();
                    this.print("autoin unset.");
                }
                //入室
                var data = {
                    name: null,
                };
                if (args[0].active) {
                    //名前がある
                    data.name = args[0].value;
                }
                else if (this.userData.name) {
                    data.name = this.userData.name;
                }
                else {
                    //名前がない
                    this.error("Name required.");
                    this.die();
                    return;
                }
                var result = this.process.inout(data, "in");
                if (!result) {
                    //失敗
                    this.error("You are already in the room.");
                }
                this.die();
            };
            return In;
        }(Process));
        ChatCmdProcessCollection.In = In;
        var Out = /** @class */ (function (_super) {
            __extends(Out, _super);
            function Out() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Out.prototype.run = function () {
                //入室
                var data = {
                    name: null,
                };
                var result = this.process.inout(data, "out");
                if (!result) {
                    //失敗
                    this.error("You are not in the room.");
                }
                this.die();
            };
            return Out;
        }(Process));
        ChatCmdProcessCollection.Out = Out;
        var Motto = /** @class */ (function (_super) {
            __extends(Motto, _super);
            function Motto() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Motto.prototype.run = function () {
                //日時
                var args = this.parseArg({
                    option: false,
                }, {
                    option: true,
                    name: ["--gmt", "--utc"],
                    num: 0,
                });
                //リクエストを作る
                var untiltime = null;
                if (args[0].active) {
                    //日時指定あり
                    untiltime = (new Date(args[0].value)).getTime();
                    if (!isNaN(untiltime)) {
                        if (!args[1].active) {
                            //ローカル時間なのでずらす
                            untiltime += (new Date).getTimezoneOffset() * 60000;
                        }
                    }
                }
                var data = {};
                if (untiltime) {
                    data.until = new Date(untiltime);
                }
                this.process.motto(data);
                this.die();
            };
            return Motto;
        }(Process));
        ChatCmdProcessCollection.Motto = Motto;
        var Volume = /** @class */ (function (_super) {
            __extends(Volume, _super);
            function Volume() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Volume.prototype.run = function () {
                var args = this.parseArg({
                    option: false,
                });
                //ボリューム変更
                if (!args[0].active) {
                    //教えるだけ
                    this.print(String(this.userData.volume));
                    this.die();
                    return;
                }
                var vo = parseInt(args[0].value);
                if (isNaN(vo) || vo < 0 || 100 < vo) {
                    this.error("Invalid volume " + args[0].value);
                }
                else {
                    this.userData.volume = vo;
                    this.userData.save();
                    this.ui.getView().refreshSettings();
                }
                this.die();
            };
            return Volume;
        }(Process));
        ChatCmdProcessCollection.Volume = Volume;
        var Gyoza = /** @class */ (function (_super) {
            __extends(Gyoza, _super);
            function Gyoza() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Gyoza.prototype.run = function () {
                var _this = this;
                var args = this.parseArg({
                    option: false,
                });
                //餃子モード変更
                if (args[0].active) {
                    var mo = parseInt(args[0].value);
                    if (isNaN(mo) || mo < 0 || 2 < mo) {
                        this.error("Invalid gyoza: " + args[0].value);
                    }
                    else {
                        this.userData.gyoza = mo;
                        this.userData.save();
                        this.ui.getView().refreshSettings();
                    }
                }
                //餃子状態を表示してあげる
                ["餃子無展開", "餃子オンマウス", "餃子常時"].forEach(function (x, i) {
                    if (_this.userData.gyoza === i) {
                        _this.put("*" + i, { color: "#00ffff" });
                    }
                    else {
                        _this.put(" " + i);
                    }
                    _this.print(": " + x);
                });
                this.die();
            };
            return Gyoza;
        }(Process));
        ChatCmdProcessCollection.Gyoza = Gyoza;
        var Set = /** @class */ (function (_super) {
            __extends(Set, _super);
            function Set() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Set.prototype.run = function () {
                var args = this.parseArg({
                    option: false,
                }, {
                    option: false,
                });
                if (!args[1].active) {
                    //keyがない
                    this.error("Value is required.");
                    this.die();
                    return;
                }
                var key = args[0].active ? args[0].value : null;
                var value = args[1].value;
                //複数の設定を変更できる
                switch (key) {
                    case "syschar":
                    case "systemchar":
                        //命令文字
                        if (value.length !== 1) {
                            this.error("set " + key + ": invalid char " + value);
                            break;
                        }
                        this.userData.cmd.syschar = value;
                        this.userData.save();
                        break;
                    case "height":
                        //コンソール高さ
                        var vn = parseFloat(value);
                        if (isNaN(vn) || vn < 0) {
                            this.error("set " + key + ": invalid value " + value);
                            break;
                        }
                        this.userData.cmd.height = value + "em";
                        this.userData.save();
                        this.console.setHeight(value + "em");
                        break;
                    default:
                        this.error("Unknown setting: " + key);
                        break;
                }
                this.die();
            };
            return Set;
        }(Process));
        ChatCmdProcessCollection.Set = Set;
        var Clean = /** @class */ (function (_super) {
            __extends(Clean, _super);
            function Clean() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Clean.prototype.run = function () {
                //コンソール掃除
                this.console.deletelines();
                this.die();
            };
            return Clean;
        }(Process));
        ChatCmdProcessCollection.Clean = Clean;
        var Help = /** @class */ (function (_super) {
            __extends(Help, _super);
            function Help() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Help.prototype.run = function () {
                //ヘルプメッセージ
                this.print([
                    "command usage: " + this.userData.cmd.syschar + "command",
                    "in [name] [--auto] [--noauto]",
                    "	 enter the chatroom",
                    "	 --auto: auto-enter at the next time",
                    "	 --noauto: don't auto-enter",
                    "out",
                    "	 quit the chatroom",
                    "motto [until] [--gmt] [--utc]",
                    "	 HottoMotto",
                    "	   until(if exists): ex) 2012-01-01, 2013-01-01T00:00",
                    "volume [number]",
                    "	 show/set volume",
                    "set (param) (value)",
                    "	 set syschar/systemchar",
                    "		 height",
                    "gyazo [num], gyoza [num]",
                    "	 show/set gyoza mode",
                    "clear, clean",
                    "	 clean the console",
                    "disip [-d] [ip] ",
                    "	 set/remove ip into/from disip list",
                    "dischannel [-d] [channel]",
                    "	 set/remove channel into/from dischannel list",
                    "go [URL|alias|#channelname]",
                    "	 alias: 'wiki'",
                ].join("\n"));
                this.die();
            };
            return Help;
        }(Process));
        ChatCmdProcessCollection.Help = Help;
        var Go = /** @class */ (function (_super) {
            __extends(Go, _super);
            function Go() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Go.prototype.run = function () {
                var args = this.parseArg({
                    option: false
                });
                if (!args[0].active) {
                    this.die();
                    return;
                }
                var dest = args[0].value;
                //alias
                if (dest === "wiki") {
                    dest = "http://showigiki.81.la/shogiwiki/";
                }
                else {
                    //チャネル
                    var result = dest.match(/^#(\S+)$/);
                    if (result) {
                        this.process.openChannel(result[1]);
                        this.die();
                        return;
                    }
                }
                //URLへ
                var a = document.createElement("a");
                a.href = dest;
                a.target = "_blank";
                a.click();
                this.die();
            };
            return Go;
        }(Process));
        ChatCmdProcessCollection.Go = Go;
        var Disip = /** @class */ (function (_super) {
            __extends(Disip, _super);
            function Disip() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Disip.prototype.run = function () {
                var _this = this;
                var args = this.parseArg({
                    option: false,
                }, {
                    option: true,
                    name: ["-d"],
                    num: 0,
                }, {
                    option: true,
                    name: ["--clean"],
                    num: 0,
                });
                var dis = this.ui.getView().dis;
                if (args[0].active) {
                    //disipに追加
                    var ip = args[0].value;
                    if (args[1].active) {
                        //やっぱり削除
                        dis.removeDisip(ip);
                    }
                    else {
                        if (!dis.addDisip(ip)) {
                            //失敗=すでにある
                            this.error("Already exists: " + ip);
                        }
                    }
                }
                if (args[2].active) {
                    //全て削除
                    var diss = this.userData.disip.concat([]);
                    diss.forEach(function (ip) {
                        dis.removeDisip(ip);
                    });
                }
                //disip一覧を表示
                this.userData.disip.forEach(function (ip) {
                    _this.print(ip);
                });
                this.die();
            };
            return Disip;
        }(Process));
        ChatCmdProcessCollection.Disip = Disip;
        var Dischannel = /** @class */ (function (_super) {
            __extends(Dischannel, _super);
            function Dischannel() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Dischannel.prototype.run = function () {
                var _this = this;
                var args = this.parseArg({
                    option: false,
                }, {
                    option: true,
                    name: ["-d"],
                    num: 0,
                }, {
                    option: true,
                    name: ["--clean"],
                    num: 0,
                });
                var dis = this.ui.getView().dis;
                if (args[0].active) {
                    //dischannelに追加
                    var channel = args[0].value;
                    if (/^#\S+$/.test(channel)) {
                        //#を除く
                        channel = channel.slice(1);
                    }
                    if (args[1].active) {
                        //やっぱり削除
                        dis.removeDischannel(channel, false, false);
                    }
                    else {
                        if (!dis.addDischannel(channel, false, false)) {
                            //失敗=すでにある
                            this.error("Already exists: " + channel);
                        }
                    }
                }
                if (args[2].active) {
                    //全て削除
                    var diss = this.userData.dischannel.concat([]);
                    diss.forEach(function (channel) {
                        dis.removeDischannel(channel, false, false);
                    });
                }
                //dischannel一覧を表示
                this.userData.dischannel.forEach(function (channel) {
                    _this.print(channel);
                });
                this.die();
            };
            return Dischannel;
        }(Process));
        ChatCmdProcessCollection.Dischannel = Dischannel;
        var Sl = /** @class */ (function (_super) {
            __extends(Sl, _super);
            function Sl() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Sl.prototype.run = function () {
                var sl_steam = [
                    ["						(@@) (	) (@)  ( )	@@	  ()	@	  O		@	  O		 @",
                        "				  (   )",
                        "			  (@@@@)",
                        "		   (	)",
                        "",
                        "		 (@@@)",
                    ],
                    [
                        "					   (  ) (@@) ( )  (@)  ()	 @@    O	 @	   O	 @		O",
                        "				  (@@@)",
                        "			  (    )",
                        "		   (@@@@)",
                        "",
                        "		 (	 )",
                    ]
                ], sl_body = [
                    "	   ====		   ________				   ___________ ",
                    "  _D _|  |_______/		   \\__I_I_____===__|_________| ",
                    "	|(_)---  |	 H\\________/ |   |		   =|___ ___|	   _________________		 ",
                    "	/	  |  |	 H	|  |	 |	 |		   ||_| |_||	 _|				   \\_____A  ",
                    "  |	  |  |	 H	|__--------------------| [___] |   =|						 |	",
                    "  | ________|___H__/__|_____/[][]~\\_______|		|	-|						  |  ",
                    "  |/ |   |-----------I_____I [][] []  D   |=======|____|________________________|_ ",
                ], sl_wheels = [
                    [
                        "__/ =| o |=-O=====O=====O=====O \\ ____Y___________|__|__________________________|_ ",
                        " |/-=|___|=	||	  ||	||	  |_____/~\\___/		  |_D__D__D_|  |_D__D__D_|	 ",
                        "  \\_/		 \\__/	\\__/  \\__/  \\__/		 \\_/				\\_/   \\_/    \\_/   \\_/	  ",
                    ], [
                        "__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__|__________________________|_ ",
                        " |/-=|___|=O=====O=====O=====O   |_____/~\\___/		  |_D__D__D_|  |_D__D__D_|	 ",
                        "  \\_/		 \\__/	\\__/  \\__/  \\__/		 \\_/				\\_/   \\_/    \\_/   \\_/	  ",
                    ], [
                        "__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__|__________________________|_ ",
                        " |/-=|___|=	||	  ||	||	  |_____/~\\___/		  |_D__D__D_|  |_D__D__D_|	 ",
                        "  \\_/		 \\O=====O=====O=====O_/	  \\_/				 \\_/	\\_/	\\_/   \\_/    ",
                    ], [
                        "__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__|__________________________|_ ",
                        " |/-=|___|=	||	  ||	||	  |_____/~\\___/		  |_D__D__D_|  |_D__D__D_|	 ",
                        "  \\_/		 \\_O=====O=====O=====O/	  \\_/				 \\_/	\\_/	\\_/   \\_/    ",
                    ], [
                        "__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__|__________________________|_ ",
                        " |/-=|___|=   O=====O=====O=====O|_____/~\\___/		  |_D__D__D_|  |_D__D__D_|	 ",
                        "  \\_/		 \\__/	\\__/  \\__/  \\__/		 \\_/				\\_/   \\_/    \\_/   \\_/	  ",
                    ], [
                        "__/ =| o |=-~O=====O=====O=====O\\ ____Y___________|__|__________________________|_ ",
                        " |/-=|___|=	||	  ||	||	  |_____/~\\___/		  |_D__D__D_|  |_D__D__D_|	 ",
                        "  \\_/		 \\__/	\\__/  \\__/  \\__/		 \\_/				\\_/   \\_/    \\_/   \\_/	  ",
                    ],
                ];
                var counter = 0, position = 0, sl_length = 90, sp_length = 30;
                var sl_speed = 90; //wait長さ
                var spaces = "";
                for (var i = 0; i < sp_length; i++) {
                    spaces += " "; //スペースを作る
                }
                var le = 0; //減った
                var console = this.console, t = this;
                console.newContext();
                console.hideInput();
                this.key = function (e) { return false; };
                sl_move();
                function sl_move() {
                    if (counter) {
                        //2かいめ以降
                        console.deletelines(16); //16行
                    }
                    var wheel = counter % 6; //6 patterns
                    var steam = Math.floor(counter / 3) % 2;
                    var cut = function (x) { return spaces + x.slice(le); };
                    console.print(sl_steam[steam].concat(sl_body, sl_wheels[wheel]).map(cut).join("\n"));
                    counter++;
                    if (spaces.length > 0) {
                        spaces = spaces.slice(1);
                    }
                    else {
                        le++;
                    }
                    if (le < sl_length) {
                        setTimeout(sl_move, sl_speed);
                    }
                    else {
                        //process.deletelines(16);
                        console.restoreContext();
                        t.key = null;
                        t.die();
                    }
                }
            };
            return Sl;
        }(Process));
        ChatCmdProcessCollection.Sl = Sl;
    })(ChatCmdProcessCollection = Chat.ChatCmdProcessCollection || (Chat.ChatCmdProcessCollection = {}));
    //コマンドラインみたいなUI
    var ChatCmdUI = /** @class */ (function (_super) {
        __extends(ChatCmdUI, _super);
        function ChatCmdUI(userData, receiver, process, view, dis) {
            var _this = _super.call(this, userData, receiver, process, view) || this;
            _this.console = new ChatUICollection.Console(userData, receiver, process, _this);
            receiver.on("userinfo", _this.userinfoHandle = function (data) {
                if (!data.rom && data.name) {
                    _this.console.print("Hello, " + data.name, { color: "#ffff00" });
                }
            });
            return _this;
        }
        ChatCmdUI.prototype.cleanup = function () {
            this.receiver.removeListener("userinfo", this.userinfoHandle);
            this.console.cleanup();
        };
        ChatCmdUI.prototype.getConsole = function () {
            return this.console;
        };
        ChatCmdUI.prototype.getContainer = function () {
            return this.console.getContainer();
        };
        return ChatCmdUI;
    }(ChatUI));
    Chat.ChatCmdUI = ChatCmdUI;
    //その他util
    function setUniqueId(element, base) {
        if (!document.getElementById(base)) {
            element.id = base;
            return;
        }
        var number = 0;
        while (document.getElementById(base + number))
            number++;
        element.id = base + number;
        return;
    }
    function appearAnimation(el, mode, appear, finish, callback) {
        if (callback === void 0) { callback = function () { }; }
        //transition heightが設定してあることが前提
        //mode:"vertical","horizontal","fade"
        //appear: true->出現 false->消滅
        //finish: 終了時に後処理をするかどうか(appear:true->スタイルを消す, appear:false->スタイルを消して親から消す)
        //DOMツリーに追加してから呼ぶ(スタイル反映）
        //とっておく
        //computedStyle取得
        var cmp = el.ownerDocument.defaultView.getComputedStyle(el, null);
        if (!cmp.transition) {
            if (!appear && finish) {
                if (el.parentNode) {
                    el.parentNode.removeChild(el);
                }
            }
            callback();
            return; //未対応
        }
        //クラス付加
        var inb1, inb2;
        var h;
        if (mode === "vertical") {
            inb1 = el.classList.contains("verticalanime1");
            el.classList.add("verticalanime1");
            h = el.clientHeight;
            if (appear) {
                el.style.height = "0";
            }
            else {
                el.style.height = h + "px";
            }
        }
        else if (mode === "horizontal") {
            inb1 = el.classList.contains("horizontalanime1");
            el.classList.add("horizontalanime1");
            h = el.clientWidth;
            if (appear) {
                el.style.width = "0";
            }
            else {
                el.style.width = h + "px";
            }
        }
        else if (mode === "fade") {
            inb1 = el.classList.contains("fadeanime1");
            el.classList.add("fadeanime1");
            if (appear) {
                el.style.opacity = "0";
            }
            else {
                el.style.opacity = "1";
            }
        }
        //setImmediateがほしい
        setTimeout(function () {
            if (mode === "vertical") {
                inb2 = el.classList.contains("verticalanime2");
                el.classList.add("verticalanime2");
            }
            else if (mode === "horizontal") {
                inb2 = el.classList.contains("horizontalanime2");
                el.classList.add("horizontalanime2");
            }
            else if (mode === "fade") {
                inb2 = el.classList.contains("fadeanime2");
                el.classList.add("fadeanime2");
            }
            setTimeout(function () {
                //戻す（アニメーション）
                if (mode === "vertical") {
                    if (appear) {
                        el.style.height = h + "px";
                    }
                    else {
                        el.style.height = "0";
                    }
                }
                else if (mode === "horizontal") {
                    if (appear) {
                        el.style.width = h + "px";
                    }
                    else {
                        el.style.width = "0";
                    }
                }
                else if (mode === "fade") {
                    if (appear) {
                        el.style.opacity = "1";
                    }
                    else {
                        el.style.opacity = "0";
                    }
                }
                var listener;
                el.addEventListener("transitionend", listener = function (e) {
                    if (!inb1) {
                        if (mode === "vertical") {
                            el.classList.remove("verticalanime1");
                        }
                        else if (mode === "horizontal") {
                            el.classList.remove("horizontalanime1");
                        }
                        else if (mode === "fade") {
                            el.classList.remove("fadeanime1");
                        }
                    }
                    if (!inb2) {
                        if (mode === "vertical") {
                            el.classList.remove("verticalanime2");
                        }
                        else if (mode === "horizontal") {
                            el.classList.remove("horizontalanime2");
                        }
                        else if (mode === "fade") {
                            el.classList.remove("fadeanime2");
                        }
                    }
                    if (finish) {
                        if (mode === "vertical") {
                            el.style.removeProperty("height");
                        }
                        else if (mode === "horizontal") {
                            el.style.removeProperty("width");
                        }
                        else if (mode === "fade") {
                            el.style.removeProperty("opacity");
                        }
                        if (!appear) {
                            if (el.parentNode) {
                                el.parentNode.removeChild(el);
                            }
                        }
                    }
                    callback();
                    el.removeEventListener("transitionend", listener, false);
                }, false);
            }, 0);
        }, 0);
    }
    //要素作る
    function makeEl(name, callback) {
        var el = document.createElement(name);
        callback(el);
        return el;
    }
    Chat.makeEl = makeEl;
    function createChannelDatasetString(channel) {
        return channel.replace(/\//g, "-");
    }
    Chat.createChannelDatasetString = createChannelDatasetString;
})(Chat || (Chat = {}));
