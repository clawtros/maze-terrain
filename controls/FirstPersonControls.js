/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author paulirish / http://paulirish.com/
 */

THREE.FirstPersonControls = function ( object, domElement ) {

    this.object = object;
    this.target = new THREE.Vector3( 0, 0, 0 );

    this.domElement = ( domElement !== undefined ) ? domElement : document;

    this.movementSpeed = 1.0;
    this.lookSpeed = 0.005;

    this.lookVertical = true;
    this.autoForward = false;
    // this.invertVertical = false;

    this.activeLook = true;

    this.heightSpeed = false;
    this.heightCoef = 1.0;
    this.heightMin = 0.0;
    this.heightMax = 1.0;

    this.constrainVertical = false;
    this.verticalMin = 0;
    this.verticalMax = Math.PI;

    this.autoSpeedFactor = 0.0;

    this.mouseX = 0;
    this.mouseY = 0;

    this.lat = 0;
    this.lon = 0;
    this.phi = 0;
    this.theta = 0;

    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.freeze = false;

    this.mouseDragOn = false;

    this.viewHalfX = 0;
    this.viewHalfY = 0;

    if ( this.domElement !== document ) {

	this.domElement.setAttribute( 'tabindex', -1 );

    }

    //

    this.handleResize = function () {

	if ( this.domElement === document ) {

	    this.viewHalfX = window.innerWidth / 2;
	    this.viewHalfY = window.innerHeight / 2;

	} else {

	    this.viewHalfX = this.domElement.offsetWidth / 2;
	    this.viewHalfY = this.domElement.offsetHeight / 2;

	}

    };

    this.onMouseDown = function ( event ) {

	if ( this.domElement !== document ) {

	    this.domElement.focus();

	}

	event.preventDefault();
	event.stopPropagation();

	if ( this.activeLook ) {

	    switch ( event.button ) {

//	    case 0: this.moveForward = true; break;
//	    case 2: this.moveBackward = true; break;

	    }

	}

	this.mouseDragOn = true;

    };

    this.onMouseUp = function ( event ) {

	event.preventDefault();
	event.stopPropagation();

	if ( this.activeLook ) {

	    switch ( event.button ) {

	    case 0: this.moveForward = false; break;
	    case 2: this.moveBackward = false; break;

	    }

	}

	this.mouseDragOn = false;

    };

    this.onMouseMove = function ( event ) {

	if ( this.domElement === document ) {

	    this.mouseX = event.pageX - this.viewHalfX;
	    this.mouseY = event.pageY - this.viewHalfY;

	} else {
	    this.viewHalfX = this.domElement.offsetWidth / 2;
	    this.viewHalfY = this.domElement.offsetHeight / 2;
            
	    this.mouseX = event.pageX - this.domElement.offsetLeft - this.viewHalfX;
	    this.mouseY = event.pageY - this.domElement.offsetTop - this.viewHalfY;

	}

    };

    this.onKeyDown = function ( event ) {

	//event.preventDefault();

	switch ( event.keyCode ) {

	case 38: /*up*/
	case 87: /*W*/ this.moveForward = true; break;

	case 37: /*left*/
	case 65: /*A*/ this.moveLeft = true; break;

	case 40: /*down*/
	case 83: /*S*/ this.moveBackward = true; break;

	case 39: /*right*/
	case 68: /*D*/ this.moveRight = true; break;

	case 82: /*R*/ this.moveUp = true; break;
	case 70: /*F*/ this.moveDown = true; break;

            //			case 81: /*Q*/ this.freeze = !this.freeze; break;

	}

    };

    this.onKeyUp = function ( event ) {

	switch( event.keyCode ) {

	case 38: /*up*/
	case 87: /*W*/ this.moveForward = false; break;

	case 37: /*left*/
	case 65: /*A*/ this.moveLeft = false; break;

	case 40: /*down*/
	case 83: /*S*/ this.moveBackward = false; break;

	case 39: /*right*/
	case 68: /*D*/ this.moveRight = false; break;

	case 82: /*R*/ this.moveUp = false; break;
	case 70: /*F*/ this.moveDown = false; break;

	}

    };
    this.meshes = [];
    this.playerHeight = 10.0;
    this.debugCube = new THREE.Mesh(new THREE.CubeGeometry(5,5,5,1,1,1), 
                                    new THREE.MeshPhongMaterial({color:0xff0000}));
    scene.add(this.debugCube);
    this.walkable = function(x,z) {
        var angle = this.theta;
	var tx = Math.cos( angle )*10;
	var tz = Math.sin( angle )*10;

        var dvec = new THREE.Vector2(x+tx, z+tz);
        x = dvec.x;
        z = dvec.y;
        this.debugCube.position.set(this.object.position.x + x, this.object.position.y - 5, this.object.position.z + z);
        var maxHeightDelta = 10.0;
        var targetY = 0.0;
        var raycaster = new THREE.Raycaster(new THREE.Vector3(this.object.position.x + x, 
                                                              600, 
                                                              this.object.position.z + z), 
                                            new THREE.Vector3(0, -1, 0));
        var intersects = raycaster.intersectObjects(meshes);
        if (intersects.length > 0) {
            this.debugCube.position = intersects[0].point;
            this.debugCube.position.y += 5;
            targetY = intersects.map(
                function (i) {
                    return i.point.y;
                }
            ).reduce(function (a,b) {return a < b});
        } 
        var dy = Math.abs(this.object.position.y - targetY - this.playerHeight);
//        console.log(this.object.position.y, targetY, this.playerHeight, dy);
//        if (dy < maxHeightDelta) {
        if (true) {
            return targetY + this.playerHeight;
        } else { 
            return false;
        }
    };

    
    this.update = function( delta ) {

	if ( this.freeze ) {

	    return;

	}

	if ( this.heightSpeed ) {

	    var y = THREE.Math.clamp( this.object.position.y, this.heightMin, this.heightMax );
	    var heightDelta = y - this.heightMin;

	    this.autoSpeedFactor = delta * ( heightDelta * this.heightCoef );

	} else {

	    this.autoSpeedFactor = 0.0;

	}

	var actualMoveSpeed = delta * this.movementSpeed;

        var dx = 0, dz = 0, moving = false;

	if ( this.moveForward ) {
            dz += - ( actualMoveSpeed );
            moving = true;
        }

	if ( this.moveBackward ) {
            dz += actualMoveSpeed;
            moving = true;
        }

	if ( this.moveLeft ) {
            dx += - actualMoveSpeed;
            moving = true;
        }
	
        if ( this.moveRight ) {
            dx += actualMoveSpeed;
            moving = true;
        }

        if (moving) {

            var newy = this.walkable(dx, dz);
            
            if (newy != false) {
                this.object.translateX(dx);
                this.object.translateZ(dz);
                this.object.position.y = newy;
            }
        }

	    if ( this.moveUp ) this.object.translateY( actualMoveSpeed );
	    if ( this.moveDown ) this.object.translateY( - actualMoveSpeed );

	var actualLookSpeed = delta * this.lookSpeed;

	if ( !this.activeLook ) {

	    actualLookSpeed = 0;

	}

	var verticalLookRatio = 1;

	if ( this.constrainVertical ) {

	    verticalLookRatio = Math.PI / ( this.verticalMax - this.verticalMin );

	}

	this.lon += this.mouseX * actualLookSpeed;
	if( this.lookVertical ) this.lat -= this.mouseY * actualLookSpeed * verticalLookRatio;

	this.lat = Math.max( - 85, Math.min( 85, this.lat ) );
	this.phi = THREE.Math.degToRad( 90 - this.lat );

	this.theta = THREE.Math.degToRad( this.lon );

	if ( this.constrainVertical ) {

	    this.phi = THREE.Math.mapLinear( this.phi, 0, Math.PI, this.verticalMin, this.verticalMax );

	}

	var targetPosition = this.target,
	position = this.object.position;

	targetPosition.x = position.x + 100 * Math.sin( this.phi ) * Math.cos( this.theta );
	targetPosition.y = position.y + 100 * Math.cos( this.phi );
	targetPosition.z = position.z + 100 * Math.sin( this.phi ) * Math.sin( this.theta );
        
	this.object.lookAt( targetPosition );

    };


    this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );

    this.domElement.addEventListener( 'mousemove', bind( this, this.onMouseMove ), false );
    this.domElement.addEventListener( 'mousedown', bind( this, this.onMouseDown ), false );
    this.domElement.addEventListener( 'mouseup', bind( this, this.onMouseUp ), false );
    this.domElement.addEventListener( 'keydown', bind( this, this.onKeyDown ), false );
    this.domElement.addEventListener( 'keyup', bind( this, this.onKeyUp ), false );

    function bind( scope, fn ) {

	return function () {

	    fn.apply( scope, arguments );

	};

    };

    this.handleResize();

};
