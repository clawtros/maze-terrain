var scene = new THREE.Scene(); 
var camera = new THREE.PerspectiveCamera(75, 1, 0.1, 15000);  
var renderer = new THREE.WebGLRenderer(); 
var controls;
var cubes = [];
var clock = new THREE.Clock();
var mirrorCubeCamera, mirrorCube;
var plane;
var rtTexture;
var planeMaterial;
var renderTarget;
var isfps = false;
var size = 600;
var meshes = [];
var alight;

function setFPSControls() {
    controls  =new THREE.FirstPersonControls(camera);
    controls.movementSpeed = 50;
    controls.lookSpeed = 0.75;
    controls.activeLook = true;
    camera.position.y = 10;
    camera.position.x = 0;
    camera.position.z = size;
    controls.domElement = renderer.domElement;
    isfps = true;
}

function setFlyControls() {
    controls = new THREE.FlyControls( camera );
    controls.movementSpeed=size/10;
    controls.rollSpeed = 1;
    controls.dragToLook = true;
   
    camera.position.x = 0;
    camera.position.y = size;
    camera.position.z = size;
    controls.domElement = renderer.domElement;
    isfps = false;
}

function initScene() {
    alight = new THREE.DirectionalLight(0xffffff, 1);
    alight.position.set(size/2, size/2.5, size/3);

    scene.add(alight);

    scene.add(new THREE.AmbientLight(0xffffff * 0.2));

    renderer.setSize(600, 600);    


    var domelement = document.getElementById('canvases').appendChild(renderer.domElement);
    renderer.setClearColorHex(0x7777ff);
    if (isfps) {
        setFPSControls();
    } else {
        setFlyControls();
    }
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    


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
            "lightPosition" : {type:"v3", value: alight.position},
            "EnvMap" : { type: "t", value: mirrorCubeCamera.renderTarget }},
        vertexShader: document.getElementById("envvert").textContent,
        fragmentShader: document.getElementById("tryit").textContent,
    });

    plane = new THREE.Mesh(new THREE.CubeGeometry(size*4.0, 2.0, size*4.0, 1, 1, 1), planeMaterial);

    plane.position.y = -1.5;        
    scene.add(plane);

}

function connectCubes(path) {
    
    var lineGeometry = new THREE.Geometry();
    for (var c = path.length-1; c >= 0; c--) {
        var cube = cubes[c];
        
        lineGeometry.vertices.push(new THREE.Vector3(cube.position.x, 
                                                     cube.position.y*2 + 1, 
                                                     cube.position.z));
    }
    lineGeometry.verticesNeedUpdate = true;

    var lineMaterial = new THREE.LineBasicMaterial({color:0xff0000});
    var line = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(line);


}

function make3d(shades) {

    while (cubes.length > 0) {
        scene.remove(cubes.pop());
    }
    

    var maxpath = shades.map(function(i) { return i.pathlen }).reduce(function(a, b) { return a > b ? a : b; });
    var merged = new THREE.CubeGeometry(0,0,0);
    var maxY = 0.1;
    var geometry = new THREE.CubeGeometry(1,1,1);;    


    for (var c in shades) {
        var cell = shades[c].cell;

        var col = shades[c].pathlen / maxpath;
        var x = 40+Math.floor((shades[c].pathlen / maxpath) * 180);

        var cube = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
        
        var cellscale = resolution * 2.0;
        cube.position.x = cell.x * cellscale - size;
        cube.position.z = cell.y * cellscale - size;
        var ypos = 5*(1-col)*cellscale;
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
                  'lightPosition': {type:'v3', value: alight.position }},
        vertexShader:document.getElementById('vertexShader').innerHTML,
        fragmentShader:document.getElementById('fragmentShader').innerHTML,

    }));
    meshes.push(mm);
    mm.position.y = mm.position.y;
    scene.add(mm);
    controls.meshes = meshes;
}

function setCameraToMapHeight() {
    var raycaster = new THREE.Raycaster(new THREE.Vector3(camera.position.x, 
                                                          600, 
                                                          camera.position.z), 
                                        new THREE.Vector3(0, -1, 0));
    var intersects = raycaster.intersectObjects(meshes);
    if (intersects.length > 0) {
        camera.position.y = intersects.map(
            function (i) {
                return i.point.y;
            }
        ).reduce(function (a,b) {return a > b}) + 10;
    } else {
        camera.position.y = 10;
    }
}
function render() { 
    requestAnimationFrame(render);
    if (isfps) {
//        setCameraToMapHeight();
    }
    plane.visible = false;
    mirrorCubeCamera.position.x = camera.position.x;
    mirrorCubeCamera.position.y = -camera.position.y;
    mirrorCubeCamera.position.z = camera.position.z;
    mirrorCubeCamera.updateCubeMap(renderer, scene);
    plane.visible = true;

    planeMaterial.uniforms.cameraPos.value = camera.position;
    planeMaterial.uniforms.EnvMap.value = mirrorCubeCamera.renderTarget;
    planeMaterial.uniforms.timeElapsed.value = clock.elapsedTime;

    renderer.render(scene, camera);
//    composer.render();
    controls.update(clock.getDelta());      
} 
