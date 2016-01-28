var Autodesk = {} || Autodesk;
Autodesk.ADN = {} ||  Autodesk.ADN;

/////////////////////////////////////////////////////////////////////////
//
//
/////////////////////////////////////////////////////////////////////////
Autodesk.ADN.EffectsDemo = function (canvasId) {

    var _self = this;

    var _canvasId = canvasId;

    var _camera, _scene, _controlsTR, _controlsDO, _mesh, _renderer, _glRenderer;

    /////////////////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////////////////
    _self.resizeCanvas = function () {

        function getClientSize() {

            var w = window,
                d = document,
                e = d.documentElement,
                g = d.getElementsByTagName('body')[0],
                sx = w.innerWidth || e.clientWidth || g.clientWidth,
                sy = w.innerHeight || e.clientHeight || g.clientHeight;

            return {x: sx, y: sy};
        }

        var size = getClientSize();

        /*var size = {

         x:$('#webGLDiv').width(),
         y:$('#webGLDiv').height()
         }*/

        _camera.aspect = size.x / size.y;
        _camera.updateProjectionMatrix();

        _renderer.setSize(size.x, size.y);

        var canvas = document.getElementById(_canvasId);

        _controlsDO =  initializeDeviceOrientationControls(_camera, canvas);
        _controlsTR =  initializeTrackballControls(_camera, canvas);
    }

    function initializeDeviceOrientationControls(camera, canvas) {

        var controls = new DeviceOrientationController(_camera, canvas);
        controls.connect();

        return controls;
    }

    function initializeTrackballControls(camera, canvas) {

        var controls = new THREE.TrackballControls(_camera, canvas);
        controls.rotateSpeed = 1.0;
        controls.minDistance = 200;
        controls.maxDistance = 6000;
        controls.addEventListener('change', render);

        return controls;
    }

    /////////////////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////////////////
    function initializeScene() {

        var canvas = document.getElementById(
            _canvasId);

        _camera = new THREE.PerspectiveCamera(
            70, 1, 1, 10000);

        _camera.position.z = 400;

        _scene = new THREE.Scene();

        var geometry = new THREE.BoxGeometry(
            150, 150, 150);

        var texture = THREE.ImageUtils.loadTexture(
            'adsk.1500x1500.jpg');

        var material = new THREE.MeshPhongMaterial( {
            ambient: 0x030303,
            color: 0xdddddd,
            specular: 0x009900,
            shininess: 30,
            shading: THREE.FlatShading,
            map: texture
        });

        var l1 = new THREE.DirectionalLight(0xffffff);
        var l2 = new THREE.DirectionalLight(0xffffff);
        var l3 = new THREE.DirectionalLight(0xffffff);
        var l4 = new THREE.DirectionalLight(0xffffff);

        l1.position.set(5, 0, 0).normalize();
        l2.position.set(-5, 0, 0).normalize();
        l3.position.set(0, 10, 0).normalize();
        l4.position.set(10, 0, 10).normalize();

        _scene.add(l1);
        _scene.add(l2);
        _scene.add(l3);
        _scene.add(l4);

        _mesh = new THREE.Mesh(geometry, material);

        _scene.add(_mesh);


        var floorGeometry = new THREE.BoxGeometry(
            7200, 3, 7200);

        var floorTexture = THREE.ImageUtils.loadTexture(
            'floor.512x512.jpg');

        floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set( 20, 20 );

        var floorMaterial = new THREE.MeshPhongMaterial( {
            ambient: 0xFFFFFF,
            color: 0xFFFFFF,
            specular: 0xFFFFFF,
            shininess: 0,
            shading: THREE.FlatShading,
            map: floorTexture
        });

        var floorMesh = new THREE.Mesh(floorGeometry, floorMaterial)

        floorMesh.position.set(0, -150, 0);

        _scene.add(floorMesh);

        _renderer = _glRenderer = new THREE.WebGLRenderer({
            canvas: canvas
        });

        _renderer.setPixelRatio(window.devicePixelRatio);

        _renderer.setClearColor(0x1771C0, 1);

        _self.resizeCanvas();
    }

    /////////////////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////////////////
    function update() {

        requestAnimationFrame(update);

        _mesh.rotation.x += 0.01;
        _mesh.rotation.y += 0.01;

        _controlsTR.update();
        _controlsDO.update();

        render();
    }

    /////////////////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////////////////
    function render() {

        _renderer.render(_scene, _camera);
    }

    /////////////////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////////////////
    _self.setGlRenderer = function () {

        initializeScene();

        _self.resizeCanvas();
    }

    /////////////////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////////////////
    _self.setOculusRenderer = function () {

        _renderer = new THREE.OculusRiftEffect(
            _glRenderer);

        _self.resizeCanvas();
    }

    /////////////////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////////////////
    _self.setStereoRenderer = function () {

        _renderer = new THREE.StereoEffect(_glRenderer);

        _renderer.eyeSeparation = 0;

        _self.resizeCanvas();
    }

    /////////////////////////////////////////////////////////////////////
    //
    //
    /////////////////////////////////////////////////////////////////////

    initializeScene();
    update();
}

function goFullscreen() {

    if (!THREEx.FullScreen.activated()) {

        THREEx.FullScreen.request();

        $('#fullscreen-btn').hide();
    }
}

$( document ).ready(function() {

    var demo = new Autodesk.ADN.EffectsDemo('renderer');

    window.addEventListener('resize', function () {

        if (!THREEx.FullScreen.activated()) {

        }

        demo.resizeCanvas();

    }, false);

    function setGlMode() {

        THREEx.FullScreen.cancel();

        demo.setGlRenderer();
    }

    function setOculusMode() {

        if (!THREEx.FullScreen.activated()) {

            THREEx.FullScreen.request();
        }

        demo.setOculusRenderer();
    }

    function setStereoMode() {

        if (!THREEx.FullScreen.activated()) {

            THREEx.FullScreen.request();
        }

        demo.setStereoRenderer();
    }

    var modeIdx = 0;

    var modes = [setGlMode, setOculusMode, setStereoMode];

    $(document).keypress(function (event) {

        switch (event.which) {

            case 0: //ESC key

                demo.setGlRenderer();
                break;

            case 102: //f key

                if (THREEx.FullScreen.activated()) {

                    THREEx.FullScreen.cancel();
                    demo.setGlRenderer();

                } else {

                    THREEx.FullScreen.request();
                }

                break;

            case 110: //n key
                setGlMode();
                break;

            case 114: //r key

                setOculusMode();
                break;

            case 115: //s key

                setStereoMode();
                break;
        }
    });

    var mc = new Hammer.Manager(document.getElementById("webGLDiv"));

    mc.add(new Hammer.Tap({event: 'doubletap', taps: 2}));
    mc.add(new Hammer.Tap({event: 'singletap'}));

    mc.get('doubletap').recognizeWith('singletap');
    mc.get('singletap').requireFailure('doubletap');

    mc.on("doubletap", function (ev) {

        modeIdx = (++modeIdx) % 3;

        modes[modeIdx]();
    });

    var qs = querystring.parse();

    if(qs.mode) {
        switch (qs.mode) {
            case 'gl':
                setGlMode();
                break;
            case 'oculus':
                setOculusMode();
                break;
            case 'stereo':
                setStereoMode();
                break;
        }
    }
});
