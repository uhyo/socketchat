// Webページの読み込みが終わってから処理開始
document.addEventListener('DOMContentLoaded', function() {
    var installButton = document.getElementById('installButton');
    var installButtonLi = document.getElementById('installButtonLi');
    // mozApps APIがあるかどうかのチェック
    if (!navigator.mozApps) {
        return;
    }
    // (1) アプリケーションオブジェクトの取得
    var request = navigator.mozApps.getSelf();
    request.onsuccess = function() {
        // インストールされていない
        if (!request.result) {
            // インストールボタンを表示
            installButton.style.display = 'inline-block';
            installButton.hidden = false;
            installButtonLi.style.display = 'block';
            installButtonLi.hidden = false;
            // インストールボタンをクリックされた際の処理
            installButton.addEventListener('click', function() {
                var thisUrl = location.href;
                // マニフェストファイルのURL
                var manifestUrl = thisUrl.substring(0, thisUrl.lastIndexOf('/')) + '/manifest.webapp';
                // (2) インストール
                var request = navigator.mozApps.install(manifestUrl);
                request.onsuccess = function() {
                    alert('アプリケーションはインストールされました');
                };
                request.onerror = function() {
                    alert('インストール処理中にエラーが発生しました:' + this.error.message);
                };
            }, false);
        }
    };
    request.onerror = function() {
        alert('インストール状況のチェック中にエラーが発生しました:' + this.error.message);
    };
}, false);