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
var planeMaterial;
var renderTarget;

var size = 600;

function initScene() {
    var alight = new THREE.DirectionalLight(0xffffff, 1);
    alight.position.set(15, 20, 10);
    scene.add(alight);

    renderer.setSize(600, 600);    
    var domelement = document.getElementById('canvases').appendChild(renderer.domElement);
    renderer.setClearColorHex(0x4444cc);
    controls = new THREE.FlyControls( camera );
    controls.movementSpeed=size/10;
    controls.rollSpeed = 1;
    controls.dragToLook = true;
    
    camera.position.x = 0;
    camera.position.y = size;
    camera.position.z = size;
    
    // controls  =new THREE.FirstPersonControls(camera);
    // controls.movementSpeed = 10;
    // controls.lookSpeed = 0.05;

    
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
        var ypos = 14*(1-(shades[c].pathlen/maxpath))*cellscale;
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
