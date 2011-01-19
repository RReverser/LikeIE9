(function(){
function qualifyURL(url) {
    var a = window.document.createElement('a');
    a.href = url;
    var href = a.href;
    delete a;
    return href;
}

function qualifyImg(url) {
    return '<img src="' + qualifyURL(url || 'icon.png') + '"/>';
}

function parseMeta(meta) {
    var attrs_t = {};
    meta.content.split(';').forEach(function(attr){
        attr = attr.split('=');
        attrs_t[attr[0]] = attr[1];
    });
    return attrs_t;
}

function listButtons()
{
    var buttons = '';
    if(window.external.hasThumbBar)
    {
        window.external.buttons.forEach(function(attrs){
            if(attrs.visible) buttons +=
                '<button title="' + attrs.tooltip + '" id=' + i + 
               (attrs.enabled ? '' : ' disabled') + 
               '>' + 
               qualifyImg(attrs.icon) + 
               '</button>';
        });
    }
    return buttons;
}

function listMeta()
{
    var list = window.document.querySelectorAll('meta[name="msapplication-task"]'), inner = '', prevGroup = '';
    for(var i = 0; i < list.length; i++)
    {
        var attrs = parseMeta(list[i]);
        
        if(attrs['group'] != prevGroup)
        {
            if(prevGroup) inner += '</ul></li>';
            prevGroup = attrs['group'];
            if(attrs['group']) inner += '<li>' + attrs['group'] + '<ul>';
        }
        inner += '<li><a href="' + qualifyURL(attrs['action-uri']) + '">' + qualifyImg(attrs['icon-uri'] || getFavicon()) + attrs['name'] + '</a></li>';
    }

    return inner;
}

function getMetaData(name)
{
    var meta = window.document.querySelector('meta[name="' + name + '"]');
    return meta ? meta.content : '';
}

function getAppName()
{
    return getMetaData('application-name') || window.document.title || window.location.host;
}

function getAppUrl()
{
    return qualifyURL(getMetaData('msapplication-starturl') || window.location.href);
}

function getTooltip()
{
    return getMetaData('msapplication-tooltip');
}

function findFavicons()
{
    return window.document.querySelectorAll('link[rel="shortcut icon"],link[rel="icon"]');
}

function getFavicon()
{
    return window.external.stdFavicon || (findFavicons()[0] || {href: ''}).href;
}

function setFavicon(href)
{
    var links = findFavicons();
    for(var i = 0; i < links.length; i++) links[i].href = href;
}

function getStyle()
{
/* for future:
    var data = getMetaData('msapplication-navbutton-color', '');
    return data ? ' style="color:' + data + '"' : '';
*/
    return '';
}

opera.extension.onmessage = function(event) {
    switch(event.data.name)
    {
    case 'init':
        var meta = listMeta();
        if(meta)
        {
            var btns = listButtons();
            if(btns) btns = 
                '<li class=panel' + getStyle() + '><a href="' + getAppUrl() + '" title="' + getTooltip() + '">' + qualifyImg(getFavicon()) + getAppName() + ' (controls)</a><div onclick="btnClick(' + window.connNumber + ',event.srcElement.parentNode)">' + btns + '</div></li>';
            event.source.postMessage({
                name: 'content',
                href: getAppUrl(),
                content: 
                    '<li' + getStyle() + '><a href="' + getAppUrl() + '" title="' + getTooltip() + '">' + qualifyImg(getFavicon()) + getAppName() + '</a><input type="checkbox" onchange="setStatus(this)" /><ul>' + meta + '</ul></li>',
                content2: btns
            });
        }
        break;
    
    case 'new':
        window.connNumber = event.data.content;
        break;
        
    case 'button':
        if(event.data.conn != window.connNumber) return;
        var e = document.createEvent('Event');
        e.initEvent('msthumbnailclick', true, true);
        e.buttonID = event.data.content;
        window.document.dispatchEvent(e);
        delete e;
        break;
        
    case 'tpl':
        window.alert('Rules list "' + event.data.content + '" was ' + ((event.data.content2 == 1) ? 'imported' : 'removed') + ' successfully.');
        console.log(event.data.info);
        break;
    
    case 'alert':
        console.log(event.data.content);
        break;
    }
}

var falseFunc = function() { return false };

function ie9buttonstyle(obj, defObj)
{
    this.update = function(from) { if(!from) return; for(var i in from) if(from[i] != undefined) this[i] = from[i] }
    this.update({icon: '', tooltip: ''});
    this.update(defObj);
    this.update(obj);
}

function ie9button(obj)
{
    ie9buttonstyle.call(this, obj, {enabled: true, visible: true});
}

window.external = {
    buttonStyles: [],
    buttons: [],
    jumpListGroup: '',
    stdFavicon: '',
    hasThumbBar: false,
    
    AddChannel: falseFunc,
    AddDesktopComponent: falseFunc,
    AddFavorite: falseFunc,
    AddSearchProvider: falseFunc,
    AddService: falseFunc,
    AddToFavoritesBar: falseFunc,
    AutoCompleteSaveForm: falseFunc,
    AutoScan: falseFunc,
    BrandImageUri: falseFunc,
    ContentDiscoveryReset: falseFunc,
    CustomizeClearType: falseFunc,
    CustomizeSettings: falseFunc,
    DefaultSearchProvider: falseFunc,
    DiagnoseConnection: falseFunc,
    ImportExportFavorites: falseFunc,
    InPrivateFilteringEnabled: falseFunc,
    IsSearchMigrated: falseFunc,
    IsSearchProviderInstalled: falseFunc,
    IsServiceInstalled: falseFunc,
    IsSubscribed: falseFunc,
    msAddSiteMode: falseFunc,
    msIsSiteMode: function() { return true },
    msSiteModeActivate: falseFunc,
    msSiteModeAddButtonStyle: function(uiButtonID, bstrIconUrl, pvarTooltip) {
        return this.buttonStyles.push(new ie9buttonstyle({icon:  bstrIconUrl, tooltip: pvarTooltip})) - 1;
    },
    msSiteModeAddJumpListItem: function(bstrName, bstrActionUri, bstrIconUri) {
        var meta = window.document.createElement('meta');
        meta.name = 'msapplication-task';
        meta.content = 'name=' + bstrName + ';action-uri=' + bstrActionUri + ';icon-uri=' + bstrIconUri + ';group=' + this.jumpListGroup;
        window.document.getElementsByTagName('head')[0].appendChild(meta);
    },
    msSiteModeAddThumbBarButton: function(bstrIconURL, bstrTooltip) {
        return this.buttons.push(new ie9button({icon: bstrIconURL, tooltip: bstrTooltip})) - 1;
    },
    msSiteModeClearIconOverlay: function() {
        this.stdFavicon ? setFavicon(this.stdFavicon) : this.stdFavicon = getFavicon()
    },
    msSiteModeClearJumplist: function() {
        var list = window.document.querySelectorAll('meta[name="msapplication-task"][content*="group="]');
        while(list.length) list[0].parentNode.removeChild(list[0]);
    },
    msSiteModeCreateJumplist: function(bstrHeader) { this.jumpListGroup = bstrHeader },
    msSiteModeSetIconOverlay: function(bstrIconUrl, bstrDescription) {
        if(!this.stdFavicon) this.stdFavicon = getFavicon();
        setFavicon(bstrIconUrl);
    },
    msSiteModeShowButtonStyle: function(uiButtonID, uiStyleID) {
        this.buttons[uiButtonID].update(this.buttonStyles[uiStyleID])
    },
    msSiteModeShowJumplist: falseFunc,
    msSiteModeShowThumbBar: function() { this.hasThumbBar = true },
    msSiteModeUpdateThumbBarButton: function(uiButtonID, fEnabled, fVisible) {
        this.buttons[uiButtonID].update({enabled: !!fEnabled, visible: !!fVisible})
    },
    msAddTrackingProtectionList: function(URL, bstrFilterName) {
        if(confirm('Do you really want to download and install this protection list?'))
            opera.extension.postMessage({name: 'tpl', content: URL, content2: bstrFilterName});
    },
    NavigateAndFind: function(sLocation, sQuery, sTargetFrame) { window.open(sLocation) },
    PhishingEnabled: falseFunc,
    RunOnceHasShown: falseFunc,
    RunOnceRequiredSettingsComplete: falseFunc,
    RunOnceShown: falseFunc,
    SearchGuideUrl: falseFunc,
    ShowBrowserUI: falseFunc,
    SkipRunOnce: falseFunc,
    SkipTabsWelcome: falseFunc,
    SqmEnabled: falseFunc
}
})()