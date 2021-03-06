///////////////////////////////////////////////////////////////////////////////
// Autodesk.ADN.Viewing.Extension.Collaboration
// by Philippe Leefsma, June 2015
//
///////////////////////////////////////////////////////////////////////////////
AutodeskNamespace("Autodesk.ADN.Viewing.Extension");

Autodesk.ADN.Viewing.Extension.Collaboration = function (viewer, options) {

  Autodesk.Viewing.Extension.call(this, viewer, options);

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  var Stopwatch = function() {

    var _startTime = new Date().getTime();

    this.reset = function() {

      _startTime = new Date().getTime();
    };

    this.getElapsedMs = function() {

      var elapsedMs = new Date().getTime() - _startTime;

      return elapsedMs;
    }
  }

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  
  var _this = this;

  var _vr = false;
  
  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  var ALL_FILTER = {
    guid: true,
    seedURN: true,
    objectSet: true,
    viewport: true,
    renderOptions: true
  };

  var VIEWPORT_FILTER = {
    guid: false,
    seedURN: false,
    objectSet: false,
    viewport: true,
    renderOptions: false
  };

  var OBJECT_FILTER = {
    guid: false,
    seedURN: false,
    objectSet: true,
    viewport: false,
    renderOptions: false
  };

  var RENDER_FILTER = {
    guid: false,
    seedURN: false,
    objectSet: false,
    viewport: false,
    renderOptions: true
  };

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  _this.load = function () {
  
    _this.stopwatch = new Stopwatch();
    
    var ctrlGroup = getControlGroup(
      options.controlGroup);

    createControls(ctrlGroup);

    if (options.meetingId.length) {

      _this.splash = new Autodesk.ADN.Viewing.Extension.Collaboration.JoinSplashPanel(
        options.container);

      _this.splash.setVisible(true);
    }

    _this.meetingId = '';

    console.log('Autodesk.ADN.Viewing.Extension.Collaboration loaded');

    return true;
  };

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  _this.unload = function () {

    console.log('Autodesk.ADN.Viewing.Extension.Collaboration unloaded');

    return true;
  };

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  function getControlGroup(name) {

    var viewerToolbar = viewer.getToolbar(true);

    var control = viewerToolbar.getControl(name);

    if (!control) {

      control = new Autodesk.Viewing.UI.ControlGroup(
        options.controlGroup);

      viewerToolbar.addControl(control);
    }

    return control;
  }

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  function createControls(parentGroup) {

    var btn = createButton(
      'Autodesk.ADN.Collaboration.Button.Manage',
      'glyphicon glyphicon-thumbs-up',
      'Collaboration',
      onCollaborationClicked);

    parentGroup.addControl(btn);
  }

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  function onCollaborationClicked() {

    if(_this.meetingId.length) {

      _this.panel.setVisible(true);
    }
    else {

      if(options.meetingId.length) {

        _this.splash = new Autodesk.ADN.Viewing.Extension.Collaboration.JoinSplashPanel(
          options.container);

        _this.splash.setVisible(true);
      }
      else {

        _this.splash = new Autodesk.ADN.Viewing.Extension.Collaboration.CreateSplashPanel(
          options.container);

        _this.splash.setVisible(true);
      }
    }
  }

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  function createButton(id, className, tooltip, handler) {

    var button = new Autodesk.Viewing.UI.Button(id);

    button.icon.className = className;

    button.icon.style.fontSize = "24px";

    button.setToolTip(tooltip);

    button.onClick = handler;

    return button;
  }

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  function guid() {

    var d = new Date().getTime();

    var guid = 'xxxx-xxxx-xxxx'.replace(
      /[xy]/g,
      function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
      });

    return guid;
  }

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  function replacePropPanelPrototype(prototypeFunc) {

    Autodesk.Viewing.Extensions.ViewerPropertyPanel.prototype.setVisible =

      function (show) {

        sendUIMessage('PropertyPanel.Visible', {show: show});

        if(show) {

          var panel = $('#ViewerPropertyPanel');

          var panelContainer = $('#ViewerPropertyPanel-scroll-container');

          panelContainer.scroll(function() {

            sendUIMessage('PropertyPanel.Style', {
              scroll: panelContainer.scrollTop(),
              style: {
                left:  panel[0].style.left,
                top:  panel[0].style.top,
                height:  panel[0].style.height,
                width:  panel[0].style.width
              }
            });
          });

          panel.attrchange({
            trackValues: true,
            callback: function (event) {

              if(event.attributeName === 'style'){

                sendUIMessage('PropertyPanel.Style', {
                  scroll: panelContainer.scrollTop(),
                  style: {
                    left:  panel[0].style.left,
                    top:  panel[0].style.top,
                    height:  panel[0].style.height,
                    width:  panel[0].style.width
                  }
                });
              }
            }
          });
        }

        return prototypeFunc.apply(this, arguments);
      }
  }

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  function activateCollaboration(meetingId, username) {

    _this.meetingId = meetingId;

    _this.username = username;

    _this.socket.on('Collaboration.LoadViewable',
      onLoadViewable);

    _this.socket.on('Collaboration.StateChanged',
      onStateChanged);

    _this.socket.on('Collaboration.StateInit',
      onStateInit);

    _this.socket.on('Collaboration.ChatMessage',
      onChatMessage);

    _this.socket.on('Collaboration.Users',
      onUsers);

    _this.socket.on('Collaboration.UIMessage',
      onUIMessage);

    _this.socket.on('Collaboration.ExtensionMessage',
      onExtensionMessage);

    replacePropPanelPrototype(
      Autodesk.Viewing.Extensions.ViewerPropertyPanel.prototype.setVisible);
  }

  function activateViewerEvents(_vr) {

    if(!_vr) {

      viewer.addEventListener(
        Autodesk.Viewing.CAMERA_CHANGE_EVENT,
        onCameraChanged);

      viewer.addEventListener(
        Autodesk.Viewing.SELECTION_CHANGED_EVENT,
        onObjectSetChanged);

      viewer.addEventListener(
        Autodesk.Viewing.ISOLATE_EVENT,
        onObjectSetChanged);

      viewer.addEventListener(
        Autodesk.Viewing.EXPLODE_CHANGE_EVENT,
        onObjectSetChanged);

      viewer.addEventListener(
        Autodesk.Viewing.HIDE_EVENT,
        onObjectSetChanged);

      viewer.addEventListener(
        Autodesk.Viewing.SHOW_EVENT,
        onObjectSetChanged);

      viewer.addEventListener(
        Autodesk.Viewing.HIGHLIGHT_EVENT,
        onObjectSetChanged);

      viewer.addEventListener(
        Autodesk.Viewing.RENDER_OPTION_CHANGED_EVENT,
        onRenderOptionsChanged);

      viewer.addEventListener(
        Autodesk.Viewing.CUTPLANES_CHANGE_EVENT,
        onCutPlanesChanged);
    }
  }

  //NAVIGATION_MODE_CHANGED_EVENT
  //VIEWER_STATE_RESTORED_EVENT
  //LAYER_VISIBILITY_CHANGED_EVENT

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  function deactivateCollaboration() {

    _this.socket.removeListener(
      'Collaboration.LoadViewable',
      onLoadViewable);

    _this.socket.removeListener(
      'Collaboration.StateChanged',
      onStateChanged);

    _this.socket.removeListener(
      'Collaboration.StateInit',
      onStateInit);

    _this.socket.removeListener(
      'Collaboration.Users',
      onUsers);

    _this.socket.removeListener(
      'Collaboration.UIMessage',
      onUIMessage);

    _this.socket.removeListener(
      'Collaboration.ExtensionMessage',
      onExtensionMessage);
  }

  function deactivateViewerEvents() {

    viewer.removeEventListener(
      Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
      onGeometryLoaded);

    viewer.removeEventListener(
      Autodesk.Viewing.CAMERA_CHANGE_EVENT,
      onCameraChanged);

    viewer.removeEventListener(
      Autodesk.Viewing.SELECTION_CHANGED_EVENT,
      onObjectSetChanged);

    viewer.removeEventListener(
      Autodesk.Viewing.ISOLATE_EVENT,
      onObjectSetChanged);

    viewer.removeEventListener(
      Autodesk.Viewing.EXPLODE_CHANGE_EVENT,
      onObjectSetChanged);

    viewer.removeEventListener(
      Autodesk.Viewing.HIDE_EVENT,
      onObjectSetChanged);

    viewer.removeEventListener(
      Autodesk.Viewing.SHOW_EVENT,
      onObjectSetChanged);

    viewer.removeEventListener(
      Autodesk.Viewing.HIGHLIGHT_EVENT,
      onObjectSetChanged);

    viewer.removeEventListener(
      Autodesk.Viewing.RENDER_OPTION_CHANGED_EVENT,
      onRenderOptionsChanged);

    viewer.removeEventListener(
      Autodesk.Viewing.CUTPLANES_CHANGE_EVENT,
      onCutPlanesChanged);
  }

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  function createMeeting(meetingId, username) {

    activateCollaboration(
      meetingId,
      username);

    activateViewerEvents();

    var state = viewer.getState(ALL_FILTER);

    var collaborationMsg = {
      viewablePath: options.viewablePath,
      viewportState: JSON.stringify(state),
      objectState: JSON.stringify(state),
      renderState: JSON.stringify(state),
      modelId: options.modelId,
      meetingId: meetingId,
      username: username,
      urn: state.seedURN,
      filter: {}
    };

    _this.socket.emit('Collaboration.NewMeeting',
      collaborationMsg);
  }

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  function joinMeeting(meetingId, username, vr) {

    _vr = vr;

    activateCollaboration(
      meetingId,
      username,
      vr);

    viewer.addEventListener(
      Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
      onGeometryLoaded);

    var collaborationMsg = {
      meetingId: meetingId,
      username: username
    };

    _this.socket.emit('Collaboration.JoinMeeting',
      collaborationMsg);
  }

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  function onLoadViewable(collaborationMsg) {

    viewer.load(collaborationMsg.viewablePath);

    if(options.onLoadDocument) {

      options.onLoadDocument(
        collaborationMsg.urn,
        collaborationMsg.modelId);
    }
  }

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  function onGeometryLoaded(event) {

    var collaborationMsg = {
      meetingId: options.meetingId
    };

    if(_vr) {

      viewer.loadExtension('Autodesk.ADN.Viewing.Extension.VR', {
        requestUserGesture: false
      });
    }

    setTimeout(function() {

      _this.socket.emit('Collaboration.RequestStateInit',
        collaborationMsg);
    }, 3000);
  };

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  function onUsers(collaborationMsg) {
    
    _this.panel.loadUsers(
      collaborationMsg.users);
  }

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  function onUIMessage(collaborationMsg) {

    _this.stopwatch.reset();

    switch(collaborationMsg.uiMsgId) {

      case 'PropertyPanel.Visible':

        var propertyPanel = viewer.getPropertyPanel(true);

        propertyPanel.setVisible(collaborationMsg.args.show);

        break;

      case 'PropertyPanel.Style':

        var panel = $('#ViewerPropertyPanel');

        var panelContainer = $('#ViewerPropertyPanel-scroll-container');

        panelContainer.scrollTop(collaborationMsg.args.scroll);

        panel[0].style.left = collaborationMsg.args.style.left;
        panel[0].style.top = collaborationMsg.args.style.top;
        panel[0].style.height = collaborationMsg.args.style.height;
        panel[0].style.width = collaborationMsg.args.style.width;

        break;

      default:

        break;
    }
  }

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  function onExtensionMessage(collaborationMsg) {

    switch(collaborationMsg.msgId) {

      case 'Collaboration.Extension.Section':

        var cutPlanes = collaborationMsg.cutPlanes.map(
          function(plane) {
            return new THREE.Vector4(
              plane.x,
              plane.y,
              plane.z,
              plane.w);
          });

        viewer.setCutPlanes(cutPlanes);

        break;

      default:

        break;
    }
  }

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  function onObjectSetChanged() {

    sendStateMessage('object', OBJECT_FILTER);
  }

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  function _onCameraChanged() {

    sendStateMessage('viewport', VIEWPORT_FILTER);
  }

  var onCameraChanged = _.throttle(_onCameraChanged, 300);

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  function onRenderOptionsChanged() {

    sendStateMessage('render', RENDER_FILTER);
  }

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  function onCutPlanesChanged() {

    var cutPlanes = viewer.getCutPlanes().map(
      function (plane) {
        return {
          x: plane.x,
          y: plane.y,
          z: plane.z,
          w: plane.w
        }
      });

    var collaborationMsg = {
      meetingId: _this.meetingId,
      msgId: 'Collaboration.Extension.Section',
      cutPlanes: cutPlanes
    };

    sendExtensionMessage(collaborationMsg);
  }

  /////////////////////////////////////////////
  // A fix for viewer.restoreState
  // that also restores pivotPoint
  //
  /////////////////////////////////////////////
  function restoreStateWithPivot(state, filter, immediate) {

    function onStateRestored() {

      viewer.removeEventListener(
        Autodesk.Viewing.VIEWER_STATE_RESTORED_EVENT,
        onStateRestored);

      if(state.viewport) {

        var pivot = state.viewport.pivotPoint;

        setTimeout(function () {

          viewer.navigation.setPivotPoint(
            new THREE.Vector3(pivot[0], pivot[1], pivot[2]))
        }, 1250);
      }
    }

    viewer.addEventListener(
      Autodesk.Viewing.VIEWER_STATE_RESTORED_EVENT,
      onStateRestored);

    viewer.restoreState(state, filter, immediate);
  }

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  function onStateChanged(collaborationMsg) {

    _this.stopwatch.reset();

    try {

      var state = JSON.parse(collaborationMsg.state);

      restoreStateWithPivot(
        state,
        collaborationMsg.filter,
        true);
    }
    catch (ex) {

      console.log(ex);

      viewer.resize();
    }
  }

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  function onStateInit(collaborationMsg) {

    _this.stopwatch.reset();

    try {

      activateViewerEvents(_vr);

      var state = JSON.parse(collaborationMsg.state);

      restoreStateWithPivot(
        state,
        collaborationMsg.filter,
        true);
    }
    catch (ex) {

      console.log(ex);
    }
  }

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  function onChatMessage(collaborationMsg) {

    _this.panel.addMessage(
      collaborationMsg.username,
      collaborationMsg.msg);
  }

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  function sendStateMessage(stateType, filter) {

    var elapsed = _this.stopwatch.getElapsedMs();

    if(elapsed > 600) {

      var state = viewer.getState(filter);

      var collaborationMsg = {
        meetingId: _this.meetingId,
        state: JSON.stringify(state),
        stateType: stateType,
        filter: filter
      };

      _this.socket.emit('Collaboration.StateChanged',
        collaborationMsg);
    }
  }

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  function sendChatMessage(msg) {

    var collaborationMsg = {
      meetingId: _this.meetingId,
      username: _this.username,
      msg: msg
    };

    _this.socket.emit('Collaboration.ChatMessage',
      collaborationMsg);
  }

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  function sendUIMessage(uiMsgId, args) {

    var elapsed = _this.stopwatch.getElapsedMs();

    if(elapsed > 1000) {

      var collaborationMsg = {
        meetingId: _this.meetingId,
        uiMsgId: uiMsgId,
        args: args
      };

      _this.socket.emit('Collaboration.UIMessage',
        collaborationMsg);
    }
  }

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  var sendExtensionMessage = _.throttle(

    function (collaborationMsg) {

      _this.socket.emit('Collaboration.ExtensionMessage',
        collaborationMsg);
    },
    600);

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  Autodesk.ADN.Viewing.Extension.Collaboration.Panel = function(
    parentContainer) {

    var _thisPanel = this;

    var _baseId = guid();

    this.users = [];

    this.content = document.createElement('div');

    this.content.id = _baseId;
    this.content.className = 'collaboration-panel-content';

    Autodesk.Viewing.UI.DockingPanel.call(
      this,
      parentContainer,
      guid(),
      "Collaboration",
      {shadow: true});

    this.container.style.right = "0px";
    this.container.style.top = "0px";

    this.container.style.width = "300px";
    this.container.style.height = "250px";

    this.container.style.resize = "auto";

    var html = [

      '<div id="' + _baseId + '-content">',
      '<div class="collaboration-panel-users" id="' + _baseId + '-users">',
      '</div>',
      '<div class="collaboration-panel-chat" id="' + _baseId + '-chat">',
      '</div>',
      '<input class="collaboration-panel-input-msg" type="text" placeholder="Type a message ..." id="' + _baseId + '-input">',
      '</div>'

    ].join('\n');

    $('#' + _baseId).html(html);

    $('#' + _baseId + '-input').keyup(function(event) {

      //on ENTER pressed
      if(event.which === 13) {

        var msg = $('#' + _baseId + '-input').val();

        if(msg.length) {

          $('#' + _baseId + '-input').val('');

          sendChatMessage(msg);
        }
      }
    });

    var url = location.protocol + '//' +
      location.host + options.host  + '/collaboration' +
      '?meetingId=' + _this.meetingId;

    var _invitePanel = new Autodesk.ADN.Viewing.Extension.Collaboration.InviteSplashPanel(
      options.container, url);

    /////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////
    _thisPanel.addUser = function(username) {

      this.users.push(username);

      var className = (this.users.length % 2 ?
        'collaboration-user-even' :
        'collaboration-user-odd');

      var htmlUser = [

        '<div class=' + className +'>',
        '&nbsp;&nbsp;' + username,
        '</div>'

      ].join('\n');

      var usersPanel = $('#' + _baseId + '-users');

      usersPanel.append(htmlUser);
    }

    /////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////
    _thisPanel.addInviteButton = function() {

      var id = guid();

      var html = [

        '<button class="btn btn-info collaboration-invite-btn" id="' + id + '">',
        '<span class="glyphicon glyphicon-globe" aria-hidden="true"></span> <label>Invite</label>',
        '</button>',

      ].join('\n');

      var usersPanel = $('#' + _baseId + '-users');

      usersPanel.append(html);

      $('#' + id).click(function(){

        _invitePanel.setVisible(true);
      });
    }

    /////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////
    this.addMessage = function(username, msg) {

      var htmlMsg = [

        '<div class=collaboration-panel-chat-msg>',
        username + ': ' + msg,
        '</div>'

      ].join('\n');

      var chatPanel = $('#' + _baseId + '-chat');

      chatPanel.append(htmlMsg);

      chatPanel[0].scrollTop = chatPanel[0].scrollHeight;
    }

    /////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////
    _thisPanel.clearUsers = function() {
  
      _thisPanel.users = [];

      $('#' + _baseId + '-users > div').each(
        function (idx, child) {
          $(child).remove();
        });

      $('#' + _baseId + '-users > button').each(
        function (idx, child) {
          $(child).remove();
        });
    }
  
    /////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////
    _thisPanel.loadUsers = function(users) {
  
      _thisPanel.clearUsers();
  
      users.forEach(function(username){
  
        _thisPanel.addUser(username);
      });
  
      _thisPanel.addInviteButton();
  
      var chatPanel = $('#' + _baseId + '-chat');
  
      var offset = (55 + (users.length) * 20 + 30);
  
      chatPanel.css({'height': 'calc(100% - ' + offset + 'px)'});
  
      //chatPanel[0].scrollTop = chatPanel[0].scrollHeight;
    }
    
    /////////////////////////////////////////////////////////////
    // setVisible override (not used in that sample)
    //
    /////////////////////////////////////////////////////////////
    _thisPanel.setVisible = function(show) {

      Autodesk.Viewing.UI.DockingPanel.prototype.
        setVisible.call(this, show);
    }
  };

  Autodesk.ADN.Viewing.Extension.Collaboration.Panel.prototype = Object.create(
    Autodesk.Viewing.UI.DockingPanel.prototype);

  Autodesk.ADN.Viewing.Extension.Collaboration.Panel.prototype.constructor =
    Autodesk.ADN.Viewing.Extension.Collaboration.Panel;

  Autodesk.ADN.Viewing.Extension.Collaboration.Panel.prototype.initialize = function()
  {
    this.title = this.createTitleBar(
      this.titleLabel ||
      this.container.id);

    this.container.appendChild(this.title);
    this.container.appendChild(this.content);

    this.closer = this.createCloseButton();
    this.title.appendChild(this.closer);
    this.initializeCloseHandler(this.closer);

    this.initializeMoveHandlers(this.title);
  };

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  Autodesk.ADN.Viewing.Extension.Collaboration.CreateSplashPanel = function(
    parentContainer) {

    var panelId = guid();

    this.content = document.createElement('div');

    this.content.id = panelId;
    this.content.className = 'collaboration-panel-content';

    Autodesk.Viewing.UI.DockingPanel.call(
      this,
      parentContainer,
      guid(),
      'Create Meeting',
      {shadow: true});

    var w = 300;
    var h = 155;

    $(this.container).css({
      'left'  : 'calc(50vw - ' + w * 0.5 + 'px)',
      'top'   : 'calc(50vh - ' + h * 0.5 + 'px)',
      'width' : w + 'px',
      'height': h + 'px',
      'resize': 'none'
    });

    var userId = guid();

    var meetingId = guid();

    var startBtnId = guid();

    var html = [
      '<div>',
      '<hr class="collaboration-spacer">',
      '<input class="collaboration-panel-input-info" type="text" readonly id="' + meetingId + '">',
      '<hr class="collaboration-spacer">',
      '<input class="collaboration-panel-input-info" type="text" placeholder="Type your display name..." id="' + userId + '" value="Host">',
      '<hr class="collaboration-spacer">',
      '<button class="btn btn-info btn-collaboration" id="' + startBtnId + '">',
      '<span class="glyphicon glyphicon-play" aria-hidden="true"></span> <label> Start Meeting </label>',
      '</button>',
      '</div>'

    ].join('\n');

    $('#' + panelId).html(html);

    $('#' + meetingId).val(location.protocol + '//' +
      location.host + options.host  + '/collaboration' +
      '?meetingId=' + meetingId);

    $('#' + startBtnId).click(function(){

      var username = $('#' + userId).val();

      if(username.length) {

        _this.socket = io.connect(
          location.hostname + ':' + options.port);

        _this.splash.setVisible(false);

        createMeeting(meetingId, username);

        _this.panel = new Autodesk.ADN.Viewing.Extension.Collaboration.Panel(
          options.container);

        _this.panel.setVisible(true);
      }
    });
  };

  Autodesk.ADN.Viewing.Extension.Collaboration.CreateSplashPanel.prototype = Object.create(
    Autodesk.Viewing.UI.DockingPanel.prototype);

  Autodesk.ADN.Viewing.Extension.Collaboration.CreateSplashPanel.prototype.constructor =
    Autodesk.ADN.Viewing.Extension.Collaboration.CreateSplashPanel;

  Autodesk.ADN.Viewing.Extension.Collaboration.CreateSplashPanel.prototype.initialize =

    function() {

      this.title = this.createTitleBar(
        this.titleLabel ||
        this.container.id);

      this.closer = this.createCloseButton();

      this.container.appendChild(this.title);
      this.title.appendChild(this.closer);
      this.container.appendChild(this.content);

      this.initializeCloseHandler(this.closer);
    };

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  Autodesk.ADN.Viewing.Extension.Collaboration.JoinSplashPanel = function(
    parentContainer) {

    var panelId = guid();

    this.content = document.createElement('div');

    this.content.id = panelId;
    this.content.className = 'collaboration-panel-content';

    Autodesk.Viewing.UI.DockingPanel.call(
      this,
      parentContainer,
      guid(),
      'Join Meeting',
      {shadow: true});

    var w = 300;
    var h = 120;

    var vr = '';

    var vrStartBtnId = guid();

    if(options.mobile) {

      h = 165;

      vr = [
        '<hr class="collaboration-spacer">',
        '<button class="btn btn-success btn-collaboration" id="' + vrStartBtnId + '">',
        '<span class="glyphicon glyphicon-phone" aria-hidden="true"></span> <label> Join in VR</label>',
        '</button>'
      ].join('\n');
    }

    $(this.container).css({
      'left'  : 'calc(50vw - ' + w * 0.5 + 'px)',
      'top'   : 'calc(50vh - ' + h * 0.5 + 'px)',
      'width' : w + 'px',
      'height': h + 'px',
      'resize': 'none'
    });

    var userId = guid();

    var startBtnId = guid();

    var html = [
      '<div>',
      '<hr class="collaboration-spacer">',
      '<input class="collaboration-panel-input-info" type="text" placeholder="Type your display name..." id="' + userId + '" value="User">',
      '<hr class="collaboration-spacer">',
      '<button class="btn btn-info btn-collaboration" id="' + startBtnId + '">',
      '<span class="glyphicon glyphicon-user" aria-hidden="true"></span> <label> Join Meeting</label>',
      '</button>',
      vr,
      '</div>'

    ].join('\n');

    $('#' + panelId).html(html);

    $('#' + startBtnId).click(function(){

      var username = $('#' + userId).val();

      if(username.length) {

        _this.socket = io.connect(
          location.hostname + ':' + options.port);

        _this.splash.setVisible(false);

        _this.panel = new Autodesk.ADN.Viewing.Extension.Collaboration.Panel(
          options.container);

        _this.panel.setVisible(true);

        joinMeeting(options.meetingId, username, false);
      }
    });

    $('#' + vrStartBtnId).click(function(){

      var username = $('#' + userId).val();

      if(username.length) {

        _this.socket = io.connect(
          location.hostname + ':' + options.port);

        _this.splash.setVisible(false);

        _this.panel = new Autodesk.ADN.Viewing.Extension.Collaboration.Panel(
          options.container);

        joinMeeting(options.meetingId, username, true);

        viewer.nextScreenMode();
      }
    });
  };

  Autodesk.ADN.Viewing.Extension.Collaboration.JoinSplashPanel.prototype = Object.create(
    Autodesk.Viewing.UI.DockingPanel.prototype);

  Autodesk.ADN.Viewing.Extension.Collaboration.JoinSplashPanel.prototype.constructor =
    Autodesk.ADN.Viewing.Extension.Collaboration.JoinSplashPanel;

  Autodesk.ADN.Viewing.Extension.Collaboration.JoinSplashPanel.prototype.initialize =

    function() {

      this.title = this.createTitleBar(
        this.titleLabel ||
        this.container.id);

      this.closer = this.createCloseButton();

      this.container.appendChild(this.title);
      this.title.appendChild(this.closer);
      this.container.appendChild(this.content);

      this.initializeCloseHandler(this.closer);
    };

  /////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////
  Autodesk.ADN.Viewing.Extension.Collaboration.InviteSplashPanel = function(
    parentContainer, url) {

    var _thisPanel = this;

    var panelId = guid();

    this.content = document.createElement('div');

    this.content.id = panelId;
    this.content.className = 'collaboration-panel-content';

    Autodesk.Viewing.UI.DockingPanel.call(
      this,
      parentContainer,
      guid(),
      'Invite Meeting Link',
      {shadow: true});

    var w = 300;
    var h = 338;

    $(this.container).css({
      'left'  : 'calc(50vw - ' + w * 0.5 + 'px)',
      'top'   : 'calc(50vh - ' + h * 0.5 + 'px)',
      'background-color':'whitesmoke',
      'width' : w + 'px',
      'height': h + 'px',
      'resize': 'none'
    });

    var linkId = guid();

    var html = [
      '<div>',

      '<hr class="collaboration-spacer">',
      '<input class="collaboration-panel-input-info" type="text" readonly id="' + linkId + '">',

      '<hr class="collaboration-spacer">',
      '<hr class="collaboration-spacer">',

      '<div style="margin-left:22px" id="qr-container">',
        '<img id="qr-img" src="img/adsk/adsk-256x256-32.png" height="256" width="256"/>',
        '<div id="qr-code" style="display: none;"></div>',
      '</div>',

      '</div>'

    ].join('\n');

    $('#' + panelId).html(html);

    $('#' + linkId).val(url);

    $('#qr-code').qrcode({
      "color": "#3a3",
      "size": 250,
      "text": url
    });

    /////////////////////////////////////////////////////////////
    // setVisible override (not used in that sample)
    //
    /////////////////////////////////////////////////////////////
    _thisPanel.setVisible = function(show) {

      Autodesk.Viewing.UI.DockingPanel.prototype.
        setVisible.call(this, show);

      if (show) {

        setTimeout(function(){

          $('#qr-img').css({
            'display':'none'
          });

          $('#qr-code').css({
            'display':'block'
          });

        }, 800);
      }
      else {

        $('#qr-img').css({
          'display':'block'
        });

        $('#qr-code').css({
          'display':'none'
        });
      }
    }
  };

  Autodesk.ADN.Viewing.Extension.Collaboration.InviteSplashPanel.prototype = Object.create(
    Autodesk.Viewing.UI.DockingPanel.prototype);

  Autodesk.ADN.Viewing.Extension.Collaboration.InviteSplashPanel.prototype.constructor =
    Autodesk.ADN.Viewing.Extension.Collaboration.InviteSplashPanel;

  Autodesk.ADN.Viewing.Extension.Collaboration.InviteSplashPanel.prototype.initialize =

    function() {

      this.title = this.createTitleBar(
        this.titleLabel ||
        this.container.id);

      this.closer = this.createCloseButton();

      this.container.appendChild(this.title);
      this.title.appendChild(this.closer);
      this.container.appendChild(this.content);

      this.initializeCloseHandler(this.closer);
    };

  var css = [

    'button.btn-collaboration {',
      'width: calc(100% - 45px);',
      'margin-left: 10px;',
    '}',

    'div.collaboration-meetingId {',
      'overflow: auto;',
      'height: 20px;',
    '}',

    'div.collaboration-user-odd {',
      'background-color: rgb(142, 157, 255);',
      'width: calc(100% - 10px);',
      'border-radius: 5px;',
      'margin-left: 4px;',
      'margin-top: 2px;',
    '}',

    'div.collaboration-user-even {',
      'background-color: rgb(200, 255, 209);',
      'width: calc(100% - 10px);',
      'border-radius: 5px;',
      'margin-left: 4px;',
      'margin-top: 2.5px;',
    '}',

    'div.collaboration-panel-content {',
      'height: calc(100% - 50px);',
      'position: relative',
      'overflow-y: auto;',
    '}',

    'div.collaboration-panel-content > div {',
      'height: 100%;',
    '}',

    'div.collaboration-panel-container {',
      'height: calc(100% - 50px);',
      'margin: 10px;',
    '}',

    'div.collaboration-panel-controls-container {',
      'margin-bottom: 10px;',
    '}',

    'div.collaboration-panel-list-container {',
      'height: calc(100% - 50px);',
      'overflow-y: auto;',
    '}',

    'div.collaboration-panel-item {',
      'margin-left: 0;',
      'margin-right: 0;',
      'color: #FFFFFF;',
      'background-color: #3F4244;',
      'margin-bottom: 5px;',
      'border-radius: 4px;',
    '}',

    'div.collaboration-panel-item:hover {',
      'background-color: #5BC0DE;',
    '}',

    'div.collaboration-panel-item.enabled {',
      'background-color: #5BC0DE;',
    '}',

    'div.collaboration-panel-users {',
    '}',

    'div.collaboration-panel-chat {',
      'overflow-y: scroll;',
      'width: calc(100% - 8px);',
      'height: calc(100% - 95px);',
      'margin-left: 2px;',
      'margin-top: 10px;',
    '}',

    'div.collaboration-panel-chat-msg {',
      'margin-top: 2px;',
      'margin-left: 5px;',
      'color: white;',
      'word-wrap: break-word;',
    '}',

    'label.collaboration-panel-label {',
      'color: #FFFFFF;',
    '}',

    'input.collaboration-panel-input-msg {',
      'height: 22px;',
      'width: calc(100% - 12px);',
      'border-radius: 5px;',
      'background-color: rgb(200, 200, 200);',
      'position: absolute;',
      'bottom: 8px;',
      'margin-left: 3px;',
    '}',

    'input.collaboration-panel-input-info {',
      'height: 22px;',
      'border-radius: 5px;',
      'background-color: rgb(200, 200, 200);',
      'width: calc(100% - 25px);',
      'margin-left: 10px;',
    '}',

    'button.collaboration-invite-btn{',
      'width: calc(100% - 35px);',
      'height: 20px;',
      'margin-top: 5px;',
      'margin-left: 4px;',
    '}',

    'hr.collaboration-spacer {',
      'margin:6px;',
      'border:0;',
    '}'

  ].join('\n');

  $('<style type="text/css">' + css + '</style>').appendTo('head');
};

Autodesk.ADN.Viewing.Extension.Collaboration.prototype =
  Object.create(Autodesk.Viewing.Extension.prototype);

Autodesk.ADN.Viewing.Extension.Collaboration.prototype.constructor =
  Autodesk.ADN.Viewing.Extension.Collaboration;

Autodesk.Viewing.theExtensionManager.registerExtension(
  'Autodesk.ADN.Viewing.Extension.Collaboration',
  Autodesk.ADN.Viewing.Extension.Collaboration);

