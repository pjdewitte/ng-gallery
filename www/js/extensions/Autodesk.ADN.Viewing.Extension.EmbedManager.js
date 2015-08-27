///////////////////////////////////////////////////////////////////////////////
// Autodesk.ADN.Viewing.Extension.AnimationManager
// by Philippe Leefsma, May 2015
//
///////////////////////////////////////////////////////////////////////////////
AutodeskNamespace("Autodesk.ADN.Viewing.Extension");

Autodesk.ADN.Viewing.Extension.EmbedManager = function (viewer, options) {

  Autodesk.Viewing.Extension.call(this, viewer, options);

  var _this = this;

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  _this.load = function () {

    var ctrlGroup = getControlGroup();

    createControls(ctrlGroup);

    console.log('Autodesk.ADN.Viewing.Extension.EmbedManager loaded');

    return true;
  };

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  _this.unload = function () {

    console.log('Autodesk.ADN.Viewing.Extension.EmbedManager unloaded');

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

    var btn = createButton(
      'Autodesk.ADN.Gallery.EmbedManager.Button.Manage',
      'url(img/embed.png)',
      'Embed',
      onEmbedClicked);

    parentGroup.addControl(btn);
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  function createButton(id, imgUrl, tooltip, handler) {

    var button = new Autodesk.Viewing.UI.Button(id);

    button.icon.style.backgroundImage = imgUrl;

    button.icon.style.bottom = "3px";

    button.setToolTip(tooltip);

    button.onClick = handler;

    return button;
  }

  /////////////////////////////////////////////////////////
  //
  //
  /////////////////////////////////////////////////////////
  function onEmbedClicked() {

    options.onEmbedClicked();
  }
};

Autodesk.ADN.Viewing.Extension.EmbedManager.prototype =
  Object.create(Autodesk.Viewing.Extension.prototype);

Autodesk.ADN.Viewing.Extension.EmbedManager.prototype.constructor =
  Autodesk.ADN.Viewing.Extension.EmbedManager;

Autodesk.Viewing.theExtensionManager.registerExtension(
  'Autodesk.ADN.Viewing.Extension.EmbedManager',
  Autodesk.ADN.Viewing.Extension.EmbedManager);

