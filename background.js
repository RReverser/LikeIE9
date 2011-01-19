(function(){
opera.contexts.toolbar.addItem(
    opera.contexts.toolbar.createItem({
        title: 'LikeIE9',
        icon: 'icon18.png',
        popup: { href: 'popup.html', width: 270, height: 350 }
    })
);

function ajaxCall(URL, callback) {
    var ajax = new XMLHttpRequest;
    ajax.onreadystatechange = function() { if(this.readyState == 4) { callback(this.responseText) } }
    ajax.open('GET', URL, true);
    ajax.send();
}

var connCount = 0;
opera.extension.onconnect = function(event) { event.source.postMessage({name: 'new', content: connCount++}) };
opera.extension.onmessage = function(event) {
    if(event.data.name == 'tpl') {
        var URL = event.data.content, info;
        ajaxCall(URL, function(data){
            data.split('\n').forEach(function(row){
                var match;
                if(match = row.match(/^([-+])(d?)\s+(([^\s]*)(\s+(.*))?)$/)) {
                    var filter = '*' + ((match[2] == 'd') ? ('://' + match[4] + '/*' + (match[6] || '')) : match[3]) + '*';
                    opera.extension.broadcastMessage({name: 'alert', content: match});
                    opera.extension.broadcastMessage({name: 'alert', content: filter});
                    var action = (match[1] == '-');
                    if(localStorage[URL] == 1) action = !action;
                    var urlfilter = opera.extension.urlfilter;
                    action ? urlfilter.block.add(filter) : urlfilter.block.remove(filter);
                    info = filter;
                }
            });
            localStorage[URL] = 1 - (localStorage[URL] || 0);
            event.source.postMessage({name: 'tpl', content: event.data.content2, content2: localStorage[URL], info: info});
        });
    } else
        opera.extension.broadcastMessage(event.data);
};
})()