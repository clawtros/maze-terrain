var scene = new THREE.Scene(); 
var camera = new THREE.PerspectiveCamera(75, 1, 0.1, 15000);  
var renderer = new THREE.WebGLRenderer(); 
var controls;
var cubes = [];
var clock = new THREE.Clock();
var controls;
var mirrorCubeCamera, mirrorCube;
var plane;
var rtTexture;
var composer;
var planeMaterial;
var renderTarget;


var size = 600;

function initScene() {
    var alight = new THREE.DirectionalLight(0xffffff, 1);
    alight.position.set(15, 20, 10);
    scene.add(alight);

    renderer.setSize(600, 600);    
    document.getElementById('canvases').appendChild(renderer.domElement);
    renderer.setClearColorHex(0x4444cc);
    controls = new THREE.FlyControls( camera );
    controls.movementSpeed=size/5;
    controls.rollSpeed = 1;
    controls.dragToLook = true;
    
    camera.position.x = 0;
    camera.position.y = size/2;
    camera.position.z = size/2;

    camera.lookAt(new THREE.Vector3(0, 0, 0));

    controls.domElement = renderer.domElement;

    mirrorCubeCamera = new THREE.CubeCamera(0.1, 3000, 512);
    var cubeGeom = new THREE.CubeGeometry(600, 5, 600, 1,1,1);
    mirrorCube = new THREE.Mesh( cubeGeom, mirrorCubeMaterial);

    mirrorCube.position.set(0,-100,0);

    var mirrorCubeMaterial = new THREE.MeshBasicMaterial( { envMap: mirrorCubeCamera.renderTarget } );
    mirrorCubeCamera.position = mirrorCube.position;
    //    scene.add(mirrorCube);

    scene.add(mirrorCubeCamera);
    planeMaterial = new THREE.ShaderMaterial({
        uniforms: { 
            "cameraPos" : { type: "v3", value: THREE.Vector3(camera.position.x, camera.position.y, camera.position.z) },
            "timeElapsed": {type:"f", value:0.0},

            "EnvMap" : { type: "t", value: mirrorCubeCamera.renderTarget }},
        vertexShader: document.getElementById("envvert").textContent,
        fragmentShader: document.getElementById("tryit").textContent,
    });

    plane = new THREE.Mesh(new THREE.CubeGeometry(size*2.0, 2.0, size*2.0, 1, 1, 1), planeMaterial);

    plane.position.y = -2.0;        
    scene.add(plane);
}



function make3d(shades) {

    while (cubes.length > 0) {
        scene.remove(cubes.pop());
    }
    

    var maxpath = shades.map(function(i) { return i.pathlen }).reduce(function(a, b) { return a > b ? a : b; });
    var merged = new THREE.CubeGeometry(0,0,0);
    var maxY = 0.1;
    for (var c in shades) {
        var cell = shades[c].cell;

        var col = shades[c].pathlen / maxpath;
        var x = 40+Math.floor((shades[c].pathlen / maxpath) * 180);

        var geometry = new THREE.CubeGeometry(1,1,1);

        var cube = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
        
        var cellscale = resolution;
        cube.position.x = cell.x * cellscale - size/2;
        cube.position.z = cell.y * cellscale - size/2;
        var ypos = Math.pow(5*(1-(shades[c].pathlen/maxpath)),1.5)*cellscale;
        cube.position.y = ypos;

        cube.scale.x = cellscale;
        cube.scale.z = cellscale;
        cube.scale.y = 2*ypos;
        if (col > maxY) {
            maxY = cube.position.y;
        }
        THREE.GeometryUtils.merge(merged, cube);
        cubes.push(cube);
    }

    var mm = new THREE.Mesh(merged, new THREE.ShaderMaterial({
        uniforms:{'maxY': {type:'f', value: maxY},
                  'lightPosition': {type:'v3', value: new THREE.Vector3(0,300,0)}},
        vertexShader:document.getElementById('vertexShader').innerHTML,
        fragmentShader:document.getElementById('fragmentShader').innerHTML,

    }));
    mm.position.y = mm.position.y;
    scene.add(mm);
}

function render() { 
    requestAnimationFrame(render);

    plane.visible = false;
    mirrorCubeCamera.position.x = camera.position.x;
    mirrorCubeCamera.position.y = -camera.position.y + 0.1;
    mirrorCubeCamera.position.z = camera.position.z;
    mirrorCubeCamera.updateCubeMap(renderer, scene);

    plane.visible = true;

    planeMaterial.uniforms.cameraPos.value = camera.position;
    planeMaterial.uniforms.EnvMap.value = mirrorCubeCamera.renderTarget;
    planeMaterial.uniforms.timeElapsed.value = clock.elapsedTime;

    renderer.render(scene, camera);
    controls.update(clock.getDelta());      
} 
