///////////////////////////////////////////////////////////////////////////////
// Autodesk.ADN.Viewing.Extension.AnimationManager
// by Philippe Leefsma, May 2015
//
///////////////////////////////////////////////////////////////////////////////
AutodeskNamespace("Autodesk.ADN.Viewing.Extension");

Autodesk.ADN.Viewing.Extension.AnimationManager = function (viewer, options) {

  Autodesk.Viewing.Extension.call(this, viewer, options);

  var _this = this;

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  _this.load = function () {

    var ctrlGroup = getControlGroup();

    createControls(ctrlGroup);

    _this.tool = new AnimationTool(viewer);

    viewer.toolController.registerTool(_this.tool);

    console.log('Autodesk.ADN.Viewing.Extension.AnimationManager loaded');

    return true;
  };

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  _this.unload = function () {

    console.log('Autodesk.ADN.Viewing.Extension.AnimationManager unloaded');

    return true;
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
  function createControls(parentGroup) {

    var combo = new Autodesk.Viewing.UI.ComboButton(
      'Autodesk.ADN.Gallery.AnimationManager.Combo');

    //combo.arrowButton.setToolTip('Animations');
    combo.setToolTip('Animations');

    combo.icon.style.fontSize = "24px";
    combo.icon.className = 'glyphicon glyphicon-facetime-video';

    var explodeBtn = createButton(
      'Autodesk.ADN.Gallery.AnimationManager.Button.Explode',
      'glyphicon glyphicon-certificate',
      'Explode',
      onExplodeClicked);

    var rotateBtn = createButton(
      'Autodesk.ADN.Gallery.AnimationManager.Button.Rotate',
      'glyphicon glyphicon-repeat',
      'Rotate',
      onRotateClicked);

    var cancelBtn = createButton(
      'Autodesk.ADN.Gallery.AnimationManager.Button.Cancel',
      'glyphicon glyphicon-remove-circle',
      'Cancel Animations',
      onCancelClicked);

    combo.addControl(explodeBtn);
    combo.addControl(rotateBtn);
    combo.addControl(cancelBtn);

    parentGroup.addControl(combo, {index: options.index});
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  function onExplodeClicked() {

    viewer.toolController.activateTool(_this.tool.getName());

    _this.tool.startExplodeMotion(0.2, 0.1, 1.5);
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  function onRotateClicked() {

    viewer.toolController.activateTool(_this.tool.getName());

    var worldUp = viewer.navigation.getWorldUpVector();

    _this.tool.startRotateMotion(0.3,
      {
        x:worldUp.x,
        y:worldUp.y,
        z:worldUp.z
      });
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  function onCancelClicked() {

    viewer.toolController.deactivateTool(_this.tool.getName());
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  function createButton(id, className, tooltip, handler) {

    var button = new Autodesk.Viewing.UI.Button(id);

    button.icon.className = className;

    button.icon.style.fontSize = "24px";

    button.setToolTip(tooltip);

    button.onClick = handler;

    return button;
  }

  /////////////////////////////////////////////////////////////////
  // The animation tool
  //
  /////////////////////////////////////////////////////////////////
  function AnimationTool(viewer) {

    var _tool = this;

    _tool.motionCallbacks = {};

    this.getNames = function() {

      return ["Autodesk.ADN.Viewing.Tool.AnimationTool"];
    };

    this.getName = function() {

      return "Autodesk.ADN.Viewing.Tool.AnimationTool";
    };

    /////////////////////////////////////////////////////////////
    // called when tool is activated
    //
    /////////////////////////////////////////////////////////////
    this.activate = function(name) {

      _tool.initialState = {
        scale: viewer.getExplodeScale(),
        position: viewer.navigation.getPosition()
      };

      _tool.lastTime = -1;
    };

    /////////////////////////////////////////////////////////////
    // called when tool is deactivated
    //
    /////////////////////////////////////////////////////////////
    this.deactivate = function(name) {

      viewer.explode(_tool.initialState.scale);

      viewer.navigation.setPosition(
        new THREE.Vector3(
          _tool.initialState.position.x,
          _tool.initialState.position.y,
          _tool.initialState.position.z
        ));

      _tool.motionCallbacks = {};
    };

    /////////////////////////////////////////////////////////////
    // update is called by the framework
    // t: time elapsed since tool activated in ms
    /////////////////////////////////////////////////////////////
    this.update = function(t) {

      var dt = elapsed(t);

      for(var motionId in  _tool.motionCallbacks){

        _tool.motionCallbacks[motionId](dt);
      }

      return false;
    };

    /////////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////////
    function elapsed(t) {

      if(_tool.lastTime < 0) {

        _tool.lastTime = t;
      }

      var dt = t - _tool.lastTime;

      _tool.lastTime = t;

      return dt;
    }

    /////////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////////
    this.startExplodeMotion = function(speed, min, max) {

      var scale = min;

      _tool.motionCallbacks['explode'] = function (elapsed) {

        scale += speed * 0.001 * elapsed;

        if (scale > max) {

          scale = max;
          speed = -speed;
        }

        else if (scale < min) {

          scale = min;
          speed = -speed;
        }

        viewer.explode(scale);
      };
    };

    this.stopExplodeMotion = function () {

      delete _tool.motionCallbacks['explode'];
    };

    /////////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////////
    this.startRotateMotion = function (speed, axis) {

      _tool.motionCallbacks['rotate'] = function (elapsed) {

          var pos = viewer.navigation.getPosition();

          var position = new THREE.Vector3(
            pos.x,
            pos.y,
            pos.z
          );

          var rAxis = new THREE.Vector3(
            axis.x, axis.y, axis.z
          );

          var matrix = new THREE.Matrix4().makeRotationAxis(
            rAxis,
            speed * 0.001 * elapsed);

          position.applyMatrix4(matrix);

          viewer.navigation.setPosition(position);
      };
    };

    this.stopRotateMotion = function () {

      delete _tool.motionCallbacks['rotate'];
    };
  }
};

Autodesk.ADN.Viewing.Extension.AnimationManager.prototype =
  Object.create(Autodesk.Viewing.Extension.prototype);

Autodesk.ADN.Viewing.Extension.AnimationManager.prototype.constructor =
  Autodesk.ADN.Viewing.Extension.AnimationManager;

Autodesk.Viewing.theExtensionManager.registerExtension(
  'Autodesk.ADN.Viewing.Extension.AnimationManager',
  Autodesk.ADN.Viewing.Extension.AnimationManager);

