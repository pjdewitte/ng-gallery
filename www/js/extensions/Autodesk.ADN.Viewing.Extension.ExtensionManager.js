///////////////////////////////////////////////////////////////////////////////
// Autodesk.ADN.Viewing.Extension.ExtensionManager
// by Philippe Leefsma, May 2015
//
///////////////////////////////////////////////////////////////////////////////
AutodeskNamespace("Autodesk.ADN.Viewing.Extension");

Autodesk.ADN.Viewing.Extension.ExtensionManager = function (viewer, options) {

    Autodesk.Viewing.Extension.call(this, viewer, options);

    var _panelBaseId = guid();

    var _extensionsMap = {};

    var _panel = null;

    var _this = this;

    /////////////////////////////////////////////////////////
    //
    //
    //////////////////////////////////////////////////////////
    _this.load = function () {

        var ctrlGroup = getControlGroup();

        _this.createControls(ctrlGroup);

        _panel = new Autodesk.ADN.Viewing.Extension.ExtensionManager.Panel(
          viewer.container,
          _panelBaseId);

        $.get(options.apiUrl , function(extensions) {

            initStorage(extensions);

            _extensionsMap = _this.initializeExtensions(
              extensions);

            for(var extensionId in _extensionsMap) {

                _panel.addExtension(_extensionsMap[extensionId]);
            }
        });

        console.log('Autodesk.ADN.Viewing.Extension.ExtensionManager loaded');

        return true;
    };

    /////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////
    _this.unload = function () {

        console.log('Autodesk.ADN.Viewing.Extension.ExtensionManager unloaded');

        return true;
    };

    /////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////
    _this.initializeExtensions = function(extensions) {

        var extensionsMap = {};

        extensions.forEach(function(extension){

            //hidden extensions start with '_'
            if(!extension.id.startsWith('_') || options.showHidden) {

                extension.handler = function() {

                    extension.enabled = !extension.enabled;

                    storeExtensionState(extension);

                    if(extension.enabled) {

                        $('#' + extension.itemId).addClass('enabled');

                        loadExtension(extension);
                    }
                    else {

                        $('#' + extension.itemId).removeClass('enabled');

                        viewer.unloadExtension(extension.id);
                    }
                };

                extension.itemId = guid();

                extension.enabled = getExtensionState(extension);

                if(extension.enabled) {

                    loadExtension(extension);
                }

                extensionsMap[extension.id] = extension;
            }
        });

        return extensionsMap;
    };

    /////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////
    function getControlGroup() {

        var toolbar = viewer.getToolbar(true);

        var control = toolbar.getControl(
          options.controlGroup);

        if(!control) {

            control = new Autodesk.Viewing.UI.ControlGroup(
              options.controlGroup);

            toolbar.addControl(control);
        }

        return control;
    }

    /////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////
    _this.createControls = function(parentGroup) {

        var btn = createButton(
            'Autodesk.ADN.Gallery.ExtensionManager.Button.Manage',
            'glyphicon glyphicon-plus',
            'Manage Extensions',
            _this.onExtensionManagerClicked);

        parentGroup.addControl(btn, {index: options.index});
    };

    /////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////
    _this.onExtensionManagerClicked = function() {

        _panel.toggleVisibility();
    };

    /////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////
    function createButton(id, className, tooltip, handler) {

        var button = new Autodesk.Viewing.UI.Button(id);

        //button.icon.style.backgroundImage = imgUrl;
        button.icon.className = className;

        button.icon.style.fontSize = "24px";

        button.setToolTip(tooltip);

        button.onClick = handler;

        return button;
    }

    /////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////
    function guid() {

        var d = new Date().getTime();

        var guid = 'xxxx-xxxx-xxxx-xxxx-xxxx'.replace(
          /[xy]/g,
          function (c) {
              var r = (d + Math.random() * 16) % 16 | 0;
              d = Math.floor(d / 16);
              return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
          });

        return guid;
    }

    /////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////
    function initStorage(extensions) {

        //window.localStorage.clear();

        if(!localStorage['gallery.extensions']) {

            localStorage['gallery.extensions'] = JSON.stringify({});
        }

        var storageObj = JSON.parse(localStorage['gallery.extensions']);

        extensions.forEach(function(extension) {

            if(!storageObj[extension.id]) {

                storageObj[extension.id] = false;
            }
        });

        localStorage['gallery.extensions'] = JSON.stringify(storageObj);
    }

    /////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////
    function getExtensionState(extension) {

        var storageObj = JSON.parse(
          localStorage['gallery.extensions']);

        return storageObj[extension.id];
    }

    /////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////
    function storeExtensionState(extension) {

        var storageObj = JSON.parse(localStorage['gallery.extensions']);

        storageObj[extension.id] = extension.enabled;

        localStorage['gallery.extensions'] = JSON.stringify(storageObj);
    }

    /////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////
    function loadExtension(extension) {

        $.getScript(options.extensionsUrl +'/' +
          extension.id + '/' + extension.file)

          .done(function () {

              viewer.loadExtension(extension.id, {
                  channel: options.extensionsChannel
              });
          })
          .fail(function (jqxhr, settings, exception) {
              console.log("Load failed: " + extension.file);
          });
    }

    /////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////
    Autodesk.ADN.Viewing.Extension.ExtensionManager.Panel = function(
      parentContainer,
      baseId)
    {
        var _thisPanel = this;

        _thisPanel.content = document.createElement('div');

        _thisPanel.content.id = baseId + 'PanelContentId';
        _thisPanel.content.className = 'extension-manager-panel-content';

        Autodesk.Viewing.UI.DockingPanel.call(
          _thisPanel,
          parentContainer,
          baseId,
          "Extensions Manager",
          {shadow:true});

        var w = viewer.container.clientWidth;
        var h = viewer.container.clientHeight;

        _thisPanel.container.style.top = "0px";
        _thisPanel.container.style.right = "0px";

        _thisPanel.container.style.width = Math.min(w * 75/100, 280) + 'px',
        _thisPanel.container.style.height = Math.min(h * 75/100, 400) + 'px',

        _thisPanel.container.style.resize = "auto";

        var html = [
            '<div class="extension-manager-panel-container" style="z-index: 1000">',
                '<input id="' + baseId +'-filter" type="text" class="form-control extension-search row" placeholder="Search Extensions ...">',
                '<ul id="' + baseId + 'PanelContainerId" class="list-group extension-list">',
                '</ul>',
            '</div>'
        ].join('\n');

        $('#' + baseId + 'PanelContentId').html(html);

        $('#' + baseId + '-filter').on('input', function() {

            filterItems();
        });

        _thisPanel.addExtension = function(extension) {

            var srcUrl = options.extensionsSourceUrl + '/' + extension.id + '/' + extension.file;

            var html = [

                '<li class="extension-manager-panel-row">',
                    '<a class="list-group-item list-group-item-text extension-item col-md-6 col-sm-2 col-xs-2" id=' + extension.itemId + '>',
                        extension.name,
                    '</a>',

                    '<a href="' + srcUrl + '" class="list-group-item list-group-item-text extension-item-src col-md-2 col-sm-2 col-xs-2" target=_blank>',
                        'Source',
                    '</a>',
                '</li>',

            ].join('\n');

            $('#' + baseId + 'PanelContainerId').append(html);

            $('#' + extension.itemId).click(extension.handler);

            if(extension.enabled) {
                $('#' + extension.itemId).addClass('enabled');
            }
        }

        /////////////////////////////////////////////
        //
        //
        /////////////////////////////////////////////
        _thisPanel.clearExtensions = function () {

            $('#' + baseId + 'PanelContainerId > div').each(
              function (idx, child) {
                  $(child).remove();
              }
            );
        }

        /////////////////////////////////////////////////////////////
        // setVisible override
        //
        /////////////////////////////////////////////////////////////
        _thisPanel.isVisible = false;

        _thisPanel.setVisible = function(show) {

            _thisPanel.isVisible = show;

            Autodesk.Viewing.UI.DockingPanel.prototype.
              setVisible.call(this, show);
        }
    
        /////////////////////////////////////////////////////////////
        //
        //
        /////////////////////////////////////////////////////////////
        _thisPanel.toggleVisibility = function() {
        
            _panel.setVisible(!_thisPanel.isVisible);
        }

        /////////////////////////////////////////////
        // onTitleDoubleClick override
        //
        /////////////////////////////////////////////
        var _isMinimized = false;

        _thisPanel.onTitleDoubleClick = function (event) {

            _isMinimized = !_isMinimized;

            if(_isMinimized) {

                $(_thisPanel.container).css({
                    'height': '34px',
                    'min-height': '34px'
                });
            }
            else {
                $(_thisPanel.container).css({
                    'height': '200px',
                    'min-height': Math.min(
                      viewer.container.clientHeight * 75/100, 400) + 'px'
                });
            }
        };

        /////////////////////////////////////////////
        //
        //
        /////////////////////////////////////////////
        function filterItems() {

            var filter = $('#' + baseId + '-filter').val();

            $("li.extension-manager-panel-row").each(function(index) {

                var $item = $(this);

                if(!filter.length || $item.text().toLowerCase().indexOf(filter.toLowerCase()) > 0) {

                    $item.css({
                        'display':'block'
                    });
                }
                else {

                    $item.css({
                        'display':'none'
                    });
                }
            });
        }
    };

    Autodesk.ADN.Viewing.Extension.ExtensionManager.Panel.prototype = Object.create(
      Autodesk.Viewing.UI.DockingPanel.prototype);

    Autodesk.ADN.Viewing.Extension.ExtensionManager.Panel.prototype.constructor =
      Autodesk.ADN.Viewing.Extension.ExtensionManager.Panel;

    Autodesk.ADN.Viewing.Extension.ExtensionManager.Panel.prototype.initialize = function()
    {
        // Override DockingPanel initialize() to:
        // - create a standard title bar
        // - click anywhere on the panel to move

        this.title = this.createTitleBar(
          this.titleLabel ||
          this.container.id);

        this.closer = this.createCloseButton();

        this.container.appendChild(this.title);
        this.title.appendChild(this.closer);
        this.container.appendChild(this.content);

        this.initializeMoveHandlers(this.title);
        this.initializeCloseHandler(this.closer);
    };

    var css = [

        'div.extension-manager-panel-content {',
            'height: calc(100% - 10px);',
        '}',

        'div.extension-manager-panel-container {',
            'height: calc(100% - 55px);',
            'margin: 10px;',
        '}',

        'div.extension-controls {',
            'margin-bottom: 10px;',
        '}',

        'ul.extension-list {',
            'height: calc(100% - 35px);',
            'overflow-y: auto;',
        '}',

        'a.extension-item {',
            'color: #FFFFFF;',
            'background-color: #3F4244;',
            'margin-bottom: 5px;',
            'border-radius: 4px;',
            'width: calc(100% - 115px);',
        '}',

        'a.extension-item-src {',
            'color: #FFFFFF;',
            'background-color: #3F4244;',
            'margin-bottom: 5px;',
            'margin-left: 5px;',
            'width: 45px;',
            'border-radius: 4px;',
        '}',

        'a.extension-item:hover {',
            'color: #FFFFFF;',
            'background-color: #5BC0DE;',
        '}',

        'a.extension-item.enabled {',
            'color: #000000;',
            'background-color: #00CC00;',
        '}',

        'li.extension-manager-panel-row {',
            'height: 45px;',
        '}',

        'input.extension-search {',
            'height: 25px;',
            'margin-left: 1px;',
            'margin-bottom: 10px;',
            'width: calc(100% - 28px);',
            'background-color: #DEDEDE;',
        '}',

    ].join('\n');

    $('<style type="text/css">' + css + '</style>').appendTo('head');
};

Autodesk.ADN.Viewing.Extension.ExtensionManager.prototype =
  Object.create(Autodesk.Viewing.Extension.prototype);

Autodesk.ADN.Viewing.Extension.ExtensionManager.prototype.constructor =
  Autodesk.ADN.Viewing.Extension.ExtensionManager;

Autodesk.Viewing.theExtensionManager.registerExtension(
  'Autodesk.ADN.Viewing.Extension.ExtensionManager',
  Autodesk.ADN.Viewing.Extension.ExtensionManager);

