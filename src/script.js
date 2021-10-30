import "./style.css"
import * as THREE from "./three.min.js"

//////////////////////////* Color Palette///////////////////////

var Colors = {
    red: 0xf25346,
    white: 0xd8d0d1,
    brown: 0x59332e,
    pink: 0xF5986E,
    brownDark: 0x23190f,
    blue: 0x68c3c0,
};


//////////////////////////* Canvas//////////////////////////////
const canvas = document.querySelector('canvas.webgl')

//////////////////////////* Scene///////////////////////////////
const scene = new THREE.Scene()
//////////////////////////* Fog/////////////////////////////////
scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);



//////////////////////////* Objects/////////////////////////////


//! SEA

class Sea {
    constructor () {
        var geom = new THREE.CylinderGeometry(600, 600, 800, 40, 10);
        geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
        geom.mergeVertices();
        var l = geom.vertices.length;

        this.waves = [];

        for (var i = 0; i < l; i++) {
            var v = geom.vertices[i];
            this.waves.push({
                y: v.y,
                x: v.x,
                z: v.z,
                ang: Math.random() * Math.PI * 2,
                amp: 5 + Math.random() * 15,
                speed: 0.016 + Math.random() * 0.032
            });
        };
        var mat = new THREE.MeshPhongMaterial({
            color: Colors.blue,
            transparent: true,
            opacity: .8,
            shading: THREE.FlatShading,

        });

        this.mesh = new THREE.Mesh(geom, mat);
        this.mesh.receiveShadow = true;

    }
}

Sea.prototype.moveWaves = function () {
    var verts = this.mesh.geometry.vertices;
    var l = verts.length;
    for (var i = 0; i < l; i++) {
        var v = verts[i];
        var vprops = this.waves[i];
        v.x = vprops.x + Math.cos(vprops.ang) * vprops.amp;
        v.y = vprops.y + Math.sin(vprops.ang) * vprops.amp;
        vprops.ang += vprops.speed;
    }
    this.mesh.geometry.verticesNeedUpdate = true;
    sea.mesh.rotation.z += .005;
}


var sea;

function createSea() {
    sea = new Sea();

    // push it a little bit at the bottom of the scene
    sea.mesh.position.y = -600;

    // add the mesh of the sea to the scene
    scene.add(sea.mesh);
}
createSea()

//! CLOUD

class Cloud {
    constructor () {
        // Create an empty container that will hold the different parts of the cloud
        this.mesh = new THREE.Object3D();

        // create a cube geometry;
        // this shape will be duplicated to create the cloud
        var geom = new THREE.BoxGeometry(20, 20, 20);

        // create a material; a simple white material will do the trick
        var mat = new THREE.MeshPhongMaterial({
            color: Colors.white,
        });

        // duplicate the geometry a random number of times
        var nBlocs = 3 + Math.floor(Math.random() * 3);
        for (var i = 0; i < nBlocs; i++) {

            // create the mesh by cloning the geometry
            var m = new THREE.Mesh(geom, mat);

            // set the position and the rotation of each cube randomly
            m.position.x = i * 15;
            m.position.y = Math.random() * 10;
            m.position.z = Math.random() * 10;
            m.rotation.z = Math.random() * Math.PI * 2;
            m.rotation.y = Math.random() * Math.PI * 2;

            // set the size of the cube randomly
            var s = .1 + Math.random() * .9;
            m.scale.set(s, s, s);

            // allow each cube to cast and to receive shadows
            m.castShadow = true;
            m.receiveShadow = true;

            // add the cube to the container we first created
            this.mesh.add(m);
        }
    }
}

//! SKY

// Define a Sky Object
class Sky {
    constructor () {
        // Create an empty container
        this.mesh = new THREE.Object3D();

        // choose a number of clouds to be scattered in the sky
        this.nClouds = 20;

        // To distribute the clouds consistently,
        // we need to place them according to a uniform angle
        var stepAngle = Math.PI * 2 / this.nClouds;

        // create the clouds
        for (var i = 0; i < this.nClouds; i++) {
            var c = new Cloud();

            // set the rotation and the position of each cloud;
            // for that we use a bit of trigonometry
            var a = stepAngle * i; // this is the final angle of the cloud
            var h = 750 + Math.random() * 200; // this is the distance between the center of the axis and the cloud itself




            // Trigonometry!!! I hope you remember what you've learned in Math :)
            // in case you don't: 
            // we are simply converting polar coordinates (angle, distance) into Cartesian coordinates (x, y)
            c.mesh.position.y = Math.sin(a) * h;
            c.mesh.position.x = Math.cos(a) * h;

            // rotate the cloud according to its position
            c.mesh.rotation.z = a + Math.PI / 2;

            // for a better result, we position the clouds 
            // at random depths inside of the scene
            c.mesh.position.z = -400 - Math.random() * 400;

            // we also set a random scale for each cloud
            var s = 1 + Math.random() * 2;
            c.mesh.scale.set(s, s, s);

            // do not forget to add the mesh of each cloud in the scene
            this.mesh.add(c.mesh);
        }
    }
}

// Now we instantiate the sky and push its center a bit
// towards the bottom of the screen

var sky;

function createSky() {
    sky = new Sky();
    sky.mesh.position.y = -600;
    scene.add(sky.mesh);
}
createSky()

class AirPlane {
    constructor () {

        this.mesh = new THREE.Object3D();

        // Create the cabin
        var geomCockpit = new THREE.BoxGeometry(80, 50, 50, 1, 1, 1);
        var matCockpit = new THREE.MeshPhongMaterial({ color: Colors.red, shading: THREE.FlatShading });

        // we can access a specific vertex of a shape through 
        // the vertices array, and then move its x, y and z property:
        geomCockpit.vertices[4].y -= 10;
        geomCockpit.vertices[4].z += 20;
        geomCockpit.vertices[5].y -= 10;
        geomCockpit.vertices[5].z -= 20;
        geomCockpit.vertices[6].y += 30;
        geomCockpit.vertices[6].z += 20;
        geomCockpit.vertices[7].y += 30;
        geomCockpit.vertices[7].z -= 20;

        var cockpit = new THREE.Mesh(geomCockpit, matCockpit);
        cockpit.castShadow = true;
        cockpit.receiveShadow = true;
        this.mesh.add(cockpit);

        // Create the engine
        var geomEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
        var matEngine = new THREE.MeshPhongMaterial({ color: Colors.white, shading: THREE.FlatShading });
        var engine = new THREE.Mesh(geomEngine, matEngine);
        engine.position.x = 40;
        engine.castShadow = true;
        engine.receiveShadow = true;
        this.mesh.add(engine);

        // Create the tail
        var geomTailPlane = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
        var matTailPlane = new THREE.MeshPhongMaterial({ color: Colors.red, shading: THREE.FlatShading });
        var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
        tailPlane.position.set(-35, 25, 0);
        tailPlane.castShadow = true;
        tailPlane.receiveShadow = true;
        this.mesh.add(tailPlane);

        // Create the wing
        var geomSideWing = new THREE.BoxGeometry(40, 8, 150, 1, 1, 1);
        var matSideWing = new THREE.MeshPhongMaterial({ color: Colors.red, shading: THREE.FlatShading });
        var sideWing = new THREE.Mesh(geomSideWing, matSideWing);
        sideWing.castShadow = true;
        sideWing.receiveShadow = true;
        this.mesh.add(sideWing);

        // propeller
        var geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
        var matPropeller = new THREE.MeshPhongMaterial({ color: Colors.brown, shading: THREE.FlatShading });
        this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
        this.propeller.castShadow = true;
        this.propeller.receiveShadow = true;

        // blades
        var geomBlade = new THREE.BoxGeometry(1, 100, 20, 1, 1, 1);
        var matBlade = new THREE.MeshPhongMaterial({
            color: Colors.brownDark,
            // shading: THREE.FlatShading
        });

        var blade = new THREE.Mesh(geomBlade, matBlade);
        blade.position.set(8, 0, 0);
        blade.castShadow = true;
        blade.receiveShadow = true;
        this.propeller.add(blade);
        this.propeller.position.set(50, 0, 0);
        this.mesh.add(this.propeller);

        this.pilot = new Pilot();
        this.pilot.mesh.position.set(-10, 27, 0);
        this.mesh.add(this.pilot.mesh);

        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

    }
}

//* Pilot

class Pilot {
    constructor () {
        this.mesh = new THREE.Object3D();
        this.mesh.name = "pilot";

        // angleHairs is a property used to animate the hair later 
        this.angleHairs = 0;

        // Body of the pilot
        var bodyGeom = new THREE.BoxGeometry(15, 15, 15);
        var bodyMat = new THREE.MeshPhongMaterial({ color: Colors.brown, shading: THREE.FlatShading });
        var body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.set(2, -12, 0);
        this.mesh.add(body);

        // Face of the pilot
        var faceGeom = new THREE.BoxGeometry(10, 10, 10);
        var faceMat = new THREE.MeshLambertMaterial({ color: Colors.pink });
        var face = new THREE.Mesh(faceGeom, faceMat);
        this.mesh.add(face);

        // Hair element
        var hairGeom = new THREE.BoxGeometry(4, 4, 4);
        var hairMat = new THREE.MeshLambertMaterial({ color: Colors.brown });
        var hair = new THREE.Mesh(hairGeom, hairMat);
        // Align the shape of the hair to its bottom boundary, that will make it easier to scale.
        hair.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 2, 0));

        // create a container for the hair
        var hairs = new THREE.Object3D();

        // create a container for the hairs at the top 
        // of the head (the ones that will be animated)
        this.hairsTop = new THREE.Object3D();

        // create the hairs at the top of the head 
        // and position them on a 3 x 4 grid
        for (var i = 0; i < 12; i++) {
            var h = hair.clone();
            var col = i % 3;
            var row = Math.floor(i / 3);
            var startPosZ = -4;
            var startPosX = -4;
            h.position.set(startPosX + row * 4, 0, startPosZ + col * 4);
            this.hairsTop.add(h);
        }
        hairs.add(this.hairsTop);

        // create the hairs at the side of the face
        var hairSideGeom = new THREE.BoxGeometry(12, 4, 2);
        hairSideGeom.applyMatrix(new THREE.Matrix4().makeTranslation(-6, 0, 0));
        var hairSideR = new THREE.Mesh(hairSideGeom, hairMat);
        var hairSideL = hairSideR.clone();
        hairSideR.position.set(8, -2, 6);
        hairSideL.position.set(8, -2, -6);
        hairs.add(hairSideR);
        hairs.add(hairSideL);

        // create the hairs at the back of the head
        var hairBackGeom = new THREE.BoxGeometry(2, 8, 10);
        var hairBack = new THREE.Mesh(hairBackGeom, hairMat);
        hairBack.position.set(-1, -4, 0);
        hairs.add(hairBack);
        hairs.position.set(-5, 5, 0);

        this.mesh.add(hairs);

        var glassGeom = new THREE.BoxGeometry(5, 5, 5);
        var glassMat = new THREE.MeshLambertMaterial({ color: Colors.brown });
        var glassR = new THREE.Mesh(glassGeom, glassMat);
        glassR.position.set(6, 0, 3);
        var glassL = glassR.clone();
        glassL.position.z = -glassR.position.z;

        var glassAGeom = new THREE.BoxGeometry(11, 1, 11);
        var glassA = new THREE.Mesh(glassAGeom, glassMat);
        this.mesh.add(glassR);
        this.mesh.add(glassL);
        this.mesh.add(glassA);

        var earGeom = new THREE.BoxGeometry(2, 3, 2);
        var earL = new THREE.Mesh(earGeom, faceMat);
        earL.position.set(0, 0, -6);
        var earR = earL.clone();
        earR.position.set(0, 0, 6);
        this.mesh.add(earL);
        this.mesh.add(earR);
    }
 
}
Pilot.prototype.updateHairs = function () {
    var hairs = this.hairsTop.children;

    var l = hairs.length;
    for (var i = 0; i < l; i++) {
        var h = hairs[i];
        h.scale.y = .75 + Math.cos(this.angleHairs + i / 3) * .25;
    }
    this.angleHairs += 0.16;
}






var airplane;

function createPlane() {
    airplane = new AirPlane();
    airplane.mesh.scale.set(.25, .25, .25);
    airplane.mesh.position.y = 100;
    scene.add(airplane.mesh);
}

createPlane()



//////////////////////////* Lights//////////////////////////////

const hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9)

const ambientLight = new THREE.AmbientLight(0xdc8874, .5);

const shadowLight = new THREE.DirectionalLight(0xffffff, 0.9);

shadowLight.position.set(150, 350, 350)

shadowLight.castShadow = true

shadowLight.shadow.camera.left = -400;
shadowLight.shadow.camera.right = 400;
shadowLight.shadow.camera.top = 400;
shadowLight.shadow.camera.bottom = -400;
shadowLight.shadow.camera.near = 1;
shadowLight.shadow.camera.far = 1000;

shadowLight.shadow.mapSize.width = 2048;
shadowLight.shadow.mapSize.height = 2048;

scene.add(hemisphereLight);
scene.add(shadowLight)
scene.add(ambientLight);


/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(60, sizes.width / sizes.height, 1, 10000)
camera.position.x = 0
camera.position.y = 100
camera.position.z = 200
scene.add(camera)






// Controls
// const controls = new OrbitControls(camera, canvas)
// controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true;


// // Add the DOM element of the renderer to the 
// // container we created in the HTML
//  var container = document.getElementById('world');
// container.appendChild(renderer.domElement);
/**
 * Animate
 */

var mousePos = { x: 0, y: 0 };

// now handle the mousemove event

function handleMouseMove(event) {

    // here we are converting the mouse position value received 
    // to a normalized value varying between -1 and 1;
    // this is the formula for the horizontal axis:

    var tx = -1 + (event.clientX / sizes.width) * 2;

    // for the vertical axis, we need to inverse the formula 
    // because the 2D y-axis goes the opposite direction of the 3D y-axis

    var ty = 1 - (event.clientY / sizes.height) * 2;
    mousePos = { x: tx, y: ty };

}
document.addEventListener('mousemove', handleMouseMove, false);

function normalize(v, vmin, vmax, tmin, tmax) {
    var nv = Math.max(Math.min(v, vmax), vmin);
    var dv = vmax - vmin;
    var pc = (nv - vmin) / dv;
    var dt = tmax - tmin;
    var tv = tmin + (pc * dt);
    return tv;

}



function updatePlane() {

    // let's move the airplane between -100 and 100 on the horizontal axis, 
    // and between 25 and 175 on the vertical axis,
    // depending on the mouse position which ranges between -1 and 1 on both axes;
    // to achieve that we use a normalize function (see below)

    // var targetX = normalize(mousePos.x, -1, 1, -100, 100);
    // var targetY = normalize(mousePos.y, -1, 1, 25, 175);

    // // update the airplane's position
    // airplane.mesh.position.y = targetY;
    // airplane.mesh.position.x = targetX;
    // airplane.propeller.rotation.x += 0.3;


    var targetY = normalize(mousePos.y, -.75, .75, 25, 175);
    var targetX = normalize(mousePos.x, -.75, .75, -100, 100);

    // Move the plane at each frame by adding a fraction of the remaining distance
    airplane.mesh.position.y += (targetY - airplane.mesh.position.y) * 0.1;

    // Rotate the plane proportionally to the remaining distance
    airplane.mesh.rotation.z = (targetY - airplane.mesh.position.y) * 0.0128;
    airplane.mesh.rotation.x = (airplane.mesh.position.y - targetY) * 0.0064;

    airplane.propeller.rotation.x += 0.3;
}

function updateCameraFov() {
    camera.fov = normalize(mousePos.x, -1, 1, 40, 80);
    camera.updateProjectionMatrix();
}




const clock = new THREE.Clock()

const tick = () => {

    const elapsedTime = clock.getElapsedTime()

    // Update objects
    updatePlane();
    airplane.pilot.updateHairs();
    updateCameraFov();
    sea.moveWaves();
    sky.mesh.rotation.z += .01;
    airplane.propeller.rotation.x += 0.3;
    sea.mesh.rotation.z += .005;
   
   
    
    
    
    
    // Update Orbital Controls
    // controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()