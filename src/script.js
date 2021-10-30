import "./style.css"
import * as THREE from "./three.min.js"
import "./TweenMax.min.js"

//////////////////////////* Color Palette///////////////////////

var Colors = {
    red: 0xf25346,
    white: 0xd8d0d1,
    brown: 0x59332e,
    pink: 0xF5986E,
    brownDark: 0x23190f,
    blue: 0x51C4D3,
};

// GAME VARIABLES
var game;
var newTime = new Date().getTime();;
var oldTime = new Date().getTime();;
var deltaTime = 0;
var ennemiesPool = [];
var particlesPool = [];
var particlesInUse = [];

function resetGame() {
    game = {
        speed: 0,
        initSpeed: .00035,
        baseSpeed: .00035,
        targetBaseSpeed: .00035,
        incrementSpeedByTime: .0000025,
        incrementSpeedByLevel: .000005,
        distanceForSpeedUpdate: 100,
        speedLastUpdate: 0,

        distance: 0,
        ratioSpeedDistance: 50,
        energy: 100,
        ratioSpeedEnergy: 3,

        level: 1,
        levelLastUpdate: 0,
        distanceForLevelUpdate: 1000,

        planeDefaultHeight: 100,
        planeAmpHeight: 80,
        planeAmpWidth: 75,
        planeMoveSensivity: 0.005,
        planeRotXSensivity: 0.0008,
        planeRotZSensivity: 0.0004,
        planeFallSpeed: .001,
        planeMinSpeed: 1.2,
        planeMaxSpeed: 1.6,
        planeSpeed: 0,
        planeCollisionDisplacementX: 0,
        planeCollisionSpeedX: 0,

        planeCollisionDisplacementY: 0,
        planeCollisionSpeedY: 0,

        seaRadius: 600,
        seaLength: 800,
        //seaRotationSpeed:0.006,
        wavesMinAmp: 5,
        wavesMaxAmp: 20,
        wavesMinSpeed: 0.001,
        wavesMaxSpeed: 0.003,

        cameraFarPos: 500,
        cameraNearPos: 150,
        cameraSensivity: 0.002,

        coinDistanceTolerance: 15,
        coinValue: 3,
        coinsSpeed: .5,
        coinLastSpawn: 0,
        distanceForCoinsSpawn: 100,

        ennemyDistanceTolerance: 10,
        ennemyValue: 10,
        ennemiesSpeed: .6,
        ennemyLastSpawn: 0,
        distanceForEnnemiesSpawn: 50,

        status: "playing",
    };
    // fieldLevel.innerHTML = Math.floor(game.level);
}




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
        this.nClouds = 20;
        this.clouds = [];
        var stepAngle = Math.PI * 2 / this.nClouds;
        for (var i = 0; i < this.nClouds; i++) {
            var c = new Cloud();
            this.clouds.push(c);
            var a = stepAngle * i;
            var h = game.seaRadius + 150 + Math.random() * 200;
            c.mesh.position.y = Math.sin(a) * h;
            c.mesh.position.x = Math.cos(a) * h;
            c.mesh.position.z = -300 - Math.random() * 500;
            c.mesh.rotation.z = a + Math.PI / 2;
            var s = 1 + Math.random() * 2;
            c.mesh.scale.set(s, s, s);
            this.mesh.add(c.mesh);
        }
    }
}
Sky.prototype.moveClouds = function () {
    for (var i = 0; i < this.nClouds; i++) {
        var c = this.clouds[i];
        //    c.rotate()
    }
    this.mesh.rotation.z += game.speed * deltaTime;

}



// Now we instantiate the sky and push its center a bit
// towards the bottom of the screen

var sky;

function createSky() {
    sky = new Sky();
    sky.mesh.position.y = -600;
    scene.add(sky.mesh);
}


class AirPlane {
    constructor () {

        this.mesh = new THREE.Object3D();
        this.mesh.name = "airPlane";

        // Cabin

        var geomCabin = new THREE.BoxGeometry(80, 50, 50, 1, 1, 1);
        var matCabin = new THREE.MeshPhongMaterial({ color: Colors.red, shading: THREE.FlatShading });

        geomCabin.vertices[4].y -= 10;
        geomCabin.vertices[4].z += 20;
        geomCabin.vertices[5].y -= 10;
        geomCabin.vertices[5].z -= 20;
        geomCabin.vertices[6].y += 30;
        geomCabin.vertices[6].z += 20;
        geomCabin.vertices[7].y += 30;
        geomCabin.vertices[7].z -= 20;

        var cabin = new THREE.Mesh(geomCabin, matCabin);
        cabin.castShadow = true;
        cabin.receiveShadow = true;
        this.mesh.add(cabin);

        // Engine

        var geomEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
        var matEngine = new THREE.MeshPhongMaterial({ color: Colors.white, shading: THREE.FlatShading });
        var engine = new THREE.Mesh(geomEngine, matEngine);
        engine.position.x = 50;
        engine.castShadow = true;
        engine.receiveShadow = true;
        this.mesh.add(engine);

        // Tail Plane

        var geomTailPlane = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
        var matTailPlane = new THREE.MeshPhongMaterial({ color: Colors.red, shading: THREE.FlatShading });
        var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
        tailPlane.position.set(-40, 20, 0);
        tailPlane.castShadow = true;
        tailPlane.receiveShadow = true;
        this.mesh.add(tailPlane);

        // Wings

        var geomSideWing = new THREE.BoxGeometry(30, 5, 120, 1, 1, 1);
        var matSideWing = new THREE.MeshPhongMaterial({ color: Colors.red, shading: THREE.FlatShading });
        var sideWing = new THREE.Mesh(geomSideWing, matSideWing);
        sideWing.position.set(0, 15, 0);
        sideWing.castShadow = true;
        sideWing.receiveShadow = true;
        this.mesh.add(sideWing);

        var geomWindshield = new THREE.BoxGeometry(3, 15, 20, 1, 1, 1);
        var matWindshield = new THREE.MeshPhongMaterial({ color: Colors.white, transparent: true, opacity: .3, shading: THREE.FlatShading });;
        var windshield = new THREE.Mesh(geomWindshield, matWindshield);
        windshield.position.set(5, 27, 0);

        windshield.castShadow = true;
        windshield.receiveShadow = true;

        this.mesh.add(windshield);

        var geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
        geomPropeller.vertices[4].y -= 5;
        geomPropeller.vertices[4].z += 5;
        geomPropeller.vertices[5].y -= 5;
        geomPropeller.vertices[5].z -= 5;
        geomPropeller.vertices[6].y += 5;
        geomPropeller.vertices[6].z += 5;
        geomPropeller.vertices[7].y += 5;
        geomPropeller.vertices[7].z -= 5;
        var matPropeller = new THREE.MeshPhongMaterial({ color: Colors.brown, shading: THREE.FlatShading });
        this.propeller = new THREE.Mesh(geomPropeller, matPropeller);

        this.propeller.castShadow = true;
        this.propeller.receiveShadow = true;

        var geomBlade = new THREE.BoxGeometry(1, 80, 10, 1, 1, 1);
        var matBlade = new THREE.MeshPhongMaterial({ color: Colors.brownDark, shading: THREE.FlatShading });
        var blade1 = new THREE.Mesh(geomBlade, matBlade);
        blade1.position.set(8, 0, 0);

        blade1.castShadow = true;
        blade1.receiveShadow = true;

        var blade2 = blade1.clone();
        blade2.rotation.x = Math.PI / 2;

        blade2.castShadow = true;
        blade2.receiveShadow = true;

        this.propeller.add(blade1);
        this.propeller.add(blade2);
        this.propeller.position.set(60, 0, 0);
        this.mesh.add(this.propeller);

        var wheelProtecGeom = new THREE.BoxGeometry(30, 15, 10, 1, 1, 1);
        var wheelProtecMat = new THREE.MeshPhongMaterial({ color: Colors.red, shading: THREE.FlatShading });
        var wheelProtecR = new THREE.Mesh(wheelProtecGeom, wheelProtecMat);
        wheelProtecR.position.set(25, -20, 25);
        this.mesh.add(wheelProtecR);

        var wheelTireGeom = new THREE.BoxGeometry(24, 24, 4);
        var wheelTireMat = new THREE.MeshPhongMaterial({ color: Colors.brownDark, shading: THREE.FlatShading });
        var wheelTireR = new THREE.Mesh(wheelTireGeom, wheelTireMat);
        wheelTireR.position.set(25, -28, 25);

        var wheelAxisGeom = new THREE.BoxGeometry(10, 10, 6);
        var wheelAxisMat = new THREE.MeshPhongMaterial({ color: Colors.brown, shading: THREE.FlatShading });
        var wheelAxis = new THREE.Mesh(wheelAxisGeom, wheelAxisMat);
        wheelTireR.add(wheelAxis);

        this.mesh.add(wheelTireR);

        var wheelProtecL = wheelProtecR.clone();
        wheelProtecL.position.z = -wheelProtecR.position.z;
        this.mesh.add(wheelProtecL);

        var wheelTireL = wheelTireR.clone();
        wheelTireL.position.z = -wheelTireR.position.z;
        this.mesh.add(wheelTireL);

        var wheelTireB = wheelTireR.clone();
        wheelTireB.scale.set(.5, .5, .5);
        wheelTireB.position.set(-35, -5, 0);
        this.mesh.add(wheelTireB);

        var suspensionGeom = new THREE.BoxGeometry(4, 20, 4);
        suspensionGeom.applyMatrix(new THREE.Matrix4().makeTranslation(0, 10, 0))
        var suspensionMat = new THREE.MeshPhongMaterial({ color: Colors.red, shading: THREE.FlatShading });
        var suspension = new THREE.Mesh(suspensionGeom, suspensionMat);
        suspension.position.set(-35, -5, 0);
        suspension.rotation.z = -.3;
        this.mesh.add(suspension);

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
    airplane.mesh.position.y = game.planeDefaultHeight;
    scene.add(airplane.mesh);
}

var coinsHolder, ennemiesHolder, particlesHolder;


class Ennemy {
    constructor () {
        var geom = new THREE.TetrahedronGeometry(8, 2);
        var mat = new THREE.MeshPhongMaterial({
            color: Colors.red,
            shininess: 0,
            specular: 0xffffff,
            shading: THREE.FlatShading
        });
        this.mesh = new THREE.Mesh(geom, mat);
        this.mesh.castShadow = true;
        this.angle = 0;
        this.dist = 0;
    }
}

class EnnemiesHolder {
    constructor () {
        this.mesh = new THREE.Object3D();
        this.ennemiesInUse = [];
    }
}

EnnemiesHolder.prototype.spawnEnnemies = function () {
    var nEnnemies = game.level;

    for (var i = 0; i < nEnnemies; i++) {
        var ennemy;
        if (ennemiesPool.length) {
            ennemy = ennemiesPool.pop();
        } else {
            ennemy = new Ennemy();
        }

        ennemy.angle = - (i * 0.1);
        ennemy.distance = game.seaRadius + game.planeDefaultHeight + (-1 + Math.random() * 2) * (game.planeAmpHeight - 20);
        ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle) * ennemy.distance;
        ennemy.mesh.position.x = Math.cos(ennemy.angle) * ennemy.distance;

        this.mesh.add(ennemy.mesh);
        this.ennemiesInUse.push(ennemy);
    }
}

EnnemiesHolder.prototype.rotateEnnemies = function () {
    for (var i = 0; i < this.ennemiesInUse.length; i++) {
        var ennemy = this.ennemiesInUse[i];
        ennemy.angle += game.speed * deltaTime * game.ennemiesSpeed;

        if (ennemy.angle > Math.PI * 2) ennemy.angle -= Math.PI * 2;

        ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle) * ennemy.distance;
        ennemy.mesh.position.x = Math.cos(ennemy.angle) * ennemy.distance;
        ennemy.mesh.rotation.z += Math.random() * .1;
        ennemy.mesh.rotation.y += Math.random() * .1;

        //var globalEnnemyPosition =  ennemy.mesh.localToWorld(new THREE.Vector3());
        var diffPos = airplane.mesh.position.clone().sub(ennemy.mesh.position.clone());
        var d = diffPos.length();
        if (d < game.ennemyDistanceTolerance) {
            particlesHolder.spawnParticles(ennemy.mesh.position.clone(), 15, Colors.red, 3);

            ennemiesPool.unshift(this.ennemiesInUse.splice(i, 1)[0]);
            this.mesh.remove(ennemy.mesh);
            game.planeCollisionSpeedX = 100 * diffPos.x / d;
            game.planeCollisionSpeedY = 100 * diffPos.y / d;
            ambientLight.intensity = 2;

            removeEnergy();
            i--;
        } else if (ennemy.angle > Math.PI) {
            ennemiesPool.unshift(this.ennemiesInUse.splice(i, 1)[0]);
            this.mesh.remove(ennemy.mesh);
            i--;
        }
    }
}

class Particle {
    constructor () {
        var geom = new THREE.TetrahedronGeometry(3, 0);
        var mat = new THREE.MeshPhongMaterial({
            color: 0x009999,
            shininess: 0,
            specular: 0xffffff,
            shading: THREE.FlatShading
        });
        this.mesh = new THREE.Mesh(geom, mat);
    }
}

Particle.prototype.explode = function (pos, color, scale) {
    var _this = this;
    var _p = this.mesh.parent;
    this.mesh.material.color = new THREE.Color(color);
    this.mesh.material.needsUpdate = true;
    this.mesh.scale.set(scale, scale, scale);
    var targetX = pos.x + (-1 + Math.random() * 2) * 50;
    var targetY = pos.y + (-1 + Math.random() * 2) * 50;
    var speed = .6 + Math.random() * .2;
    TweenMax.to(this.mesh.rotation, speed, { x: Math.random() * 12, y: Math.random() * 12 });
    TweenMax.to(this.mesh.scale, speed, { x: .1, y: .1, z: .1 });
    TweenMax.to(this.mesh.position, speed, {
        x: targetX, y: targetY, delay: Math.random() * .1, ease: Power2.easeOut, onComplete: function () {
            if (_p) _p.remove(_this.mesh);
            _this.mesh.scale.set(1, 1, 1);
            particlesPool.unshift(_this);
        }
    });
}

class ParticlesHolder {
    constructor () {
        this.mesh = new THREE.Object3D();
        this.particlesInUse = [];
    }
}

ParticlesHolder.prototype.spawnParticles = function (pos, density, color, scale) {

    var nPArticles = density;
    for (var i = 0; i < nPArticles; i++) {
        var particle;
        if (particlesPool.length) {
            particle = particlesPool.pop();
        } else {
            particle = new Particle();
        }
        this.mesh.add(particle.mesh);
        particle.mesh.visible = true;
        var _this = this;
        particle.mesh.position.y = pos.y;
        particle.mesh.position.x = pos.x;
        particle.explode(pos, color, scale);
    }
}

class Coin {
    constructor () {
        var geom = new THREE.TetrahedronGeometry(5, 0);
        var mat = new THREE.MeshPhongMaterial({
            color: 0x009999,
            shininess: 0,
            specular: 0xffffff,

            shading: THREE.FlatShading
        });
        this.mesh = new THREE.Mesh(geom, mat);
        this.mesh.castShadow = true;
        this.angle = 0;
        this.dist = 0;
    }
}

class CoinsHolder {
    constructor (nCoins) {
        this.mesh = new THREE.Object3D();
        this.coinsInUse = [];
        this.coinsPool = [];
        for (var i = 0; i < nCoins; i++) {
            var coin = new Coin();
            this.coinsPool.push(coin);
        }
    }
}

CoinsHolder.prototype.spawnCoins = function () {

    var nCoins = 1 + Math.floor(Math.random() * 10);
    var d = game.seaRadius + game.planeDefaultHeight + (-1 + Math.random() * 2) * (game.planeAmpHeight - 20);
    var amplitude = 10 + Math.round(Math.random() * 10);
    for (var i = 0; i < nCoins; i++) {
        var coin;
        if (this.coinsPool.length) {
            coin = this.coinsPool.pop();
        } else {
            coin = new Coin();
        }
        this.mesh.add(coin.mesh);
        this.coinsInUse.push(coin);
        coin.angle = - (i * 0.02);
        coin.distance = d + Math.cos(i * .5) * amplitude;
        coin.mesh.position.y = -game.seaRadius + Math.sin(coin.angle) * coin.distance;
        coin.mesh.position.x = Math.cos(coin.angle) * coin.distance;
    }
}

CoinsHolder.prototype.rotateCoins = function () {
    for (var i = 0; i < this.coinsInUse.length; i++) {
        var coin = this.coinsInUse[i];
        if (coin.exploding) continue;
        coin.angle += game.speed * deltaTime * game.coinsSpeed;
        if (coin.angle > Math.PI * 2) coin.angle -= Math.PI * 2;
        coin.mesh.position.y = -game.seaRadius + Math.sin(coin.angle) * coin.distance;
        coin.mesh.position.x = Math.cos(coin.angle) * coin.distance;
        coin.mesh.rotation.z += Math.random() * .1;
        coin.mesh.rotation.y += Math.random() * .1;

        //var globalCoinPosition =  coin.mesh.localToWorld(new THREE.Vector3());
        var diffPos = airplane.mesh.position.clone().sub(coin.mesh.position.clone());
        var d = diffPos.length();
        if (d < game.coinDistanceTolerance) {
            this.coinsPool.unshift(this.coinsInUse.splice(i, 1)[0]);
            this.mesh.remove(coin.mesh);
            particlesHolder.spawnParticles(coin.mesh.position.clone(), 5, 0x009999, .8);
            addEnergy();
            i--;
        } else if (coin.angle > Math.PI) {
            this.coinsPool.unshift(this.coinsInUse.splice(i, 1)[0]);
            this.mesh.remove(coin.mesh);
            i--;
        }
    }
}


function createCoins() {

    coinsHolder = new CoinsHolder(20);
    scene.add(coinsHolder.mesh)
}

function createEnnemies() {
    for (var i = 0; i < 10; i++) {
        var ennemy = new Ennemy();
        ennemiesPool.push(ennemy);
    }
    ennemiesHolder = new EnnemiesHolder();
    //ennemiesHolder.mesh.position.y = -game.seaRadius;
    scene.add(ennemiesHolder.mesh)
}

function createParticles() {
    for (var i = 0; i < 10; i++) {
        var particle = new Particle();
        particlesPool.push(particle);
    }
    particlesHolder = new ParticlesHolder();
    //ennemiesHolder.mesh.position.y = -game.seaRadius;
    scene.add(particlesHolder.mesh)
}






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
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1))
renderer.shadowMap.enabled = true;



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

function handleTouchMove(event) {
    event.preventDefault();
    var tx = -1 + (event.touches[0].pageX /sizes.width) * 2;
    var ty = 1 - (event.touches[0].pageY / sizes.height) * 2;
    mousePos = { x: tx, y: ty };
}

function handleMouseUp(event) {
    if (game.status == "waitingReplay") {
        resetGame();
        hideReplay();
    }
}


function handleTouchEnd(event) {
    if (game.status == "waitingReplay") {
        resetGame();
        hideReplay();
    }
}






document.addEventListener('mousemove', handleMouseMove, false);




// function updatePlane() {

//     // let's move the airplane between -100 and 100 on the horizontal axis, 
//     // and between 25 and 175 on the vertical axis,
//     // depending on the mouse position which ranges between -1 and 1 on both axes;
//     // to achieve that we use a normalize function (see below)

//     // var targetX = normalize(mousePos.x, -1, 1, -100, 100);
//     // var targetY = normalize(mousePos.y, -1, 1, 25, 175);

//     // // update the airplane's position
//     // airplane.mesh.position.y = targetY;
//     // airplane.mesh.position.x = targetX;
//     // airplane.propeller.rotation.x += 0.3;


//     var targetY = normalize(mousePos.y, -.75, .75, 25, 175);
//     var targetX = normalize(mousePos.x, -.75, .75, -100, 100);

//     // Move the plane at each frame by adding a fraction of the remaining distance
//     airplane.mesh.position.y += (targetY - airplane.mesh.position.y) * 0.1;

//     // Rotate the plane proportionally to the remaining distance
//     airplane.mesh.rotation.z = (targetY - airplane.mesh.position.y) * 0.0128;
//     airplane.mesh.rotation.x = (airplane.mesh.position.y - targetY) * 0.0064;

//     airplane.propeller.rotation.x += 0.3;
// }

function updateCameraFov() {
    camera.fov = normalize(mousePos.x, -1, 1, 40, 80);
    camera.updateProjectionMatrix();
}

function updateDistance() {
    game.distance += game.speed * deltaTime * game.ratioSpeedDistance;
    fieldDistance.innerHTML = Math.floor(game.distance);
    var d = 502 * (1 - (game.distance % game.distanceForLevelUpdate) / game.distanceForLevelUpdate);
    levelCircle.setAttribute("stroke-dashoffset", d);

}

var blinkEnergy = false;

function updateEnergy() {
    game.energy -= game.speed * deltaTime * game.ratioSpeedEnergy;
    game.energy = Math.max(0, game.energy);
    energyBar.style.right = (100 - game.energy) + "%";
    energyBar.style.backgroundColor = (game.energy < 50) ? "#f25346" : "#68c3c0";

    if (game.energy < 30) {
        energyBar.style.animationName = "blinking";
    } else {
        energyBar.style.animationName = "none";
    }

    if (game.energy < 1) {
        game.status = "gameover";
    }
}

function addEnergy() {
    game.energy += game.coinValue;
    game.energy = Math.min(game.energy, 100);
}

function removeEnergy() {
    game.energy -= game.ennemyValue;
    game.energy = Math.max(0, game.energy);
}



function updatePlane() {

    game.planeSpeed = normalize(mousePos.x, -.5, .5, game.planeMinSpeed, game.planeMaxSpeed);
    // var targetY = normalize(mousePos.y, -.75, .75, game.planeDefaultHeight - game.planeAmpHeight, game.planeDefaultHeight + game.planeAmpHeight);
    // var targetX = normalize(mousePos.x, -1, 1, -game.planeAmpWidth * .7, -game.planeAmpWidth);
    var targetY = normalize(mousePos.y, -.75, .75, 25, 175);
    var targetX = normalize(mousePos.x, -.75, .75, -1, 1);

    game.planeCollisionDisplacementX += game.planeCollisionSpeedX;
    targetX += game.planeCollisionDisplacementX;


    game.planeCollisionDisplacementY += game.planeCollisionSpeedY;
    targetY += game.planeCollisionDisplacementY;

    airplane.mesh.position.y += (targetY - airplane.mesh.position.y) * deltaTime * game.planeMoveSensivity;
    airplane.mesh.position.x += (targetX - airplane.mesh.position.x) * deltaTime * game.planeMoveSensivity;

    airplane.mesh.rotation.z = (targetY - airplane.mesh.position.y) * deltaTime * game.planeRotXSensivity;
    airplane.mesh.rotation.x = (airplane.mesh.position.y - targetY) * deltaTime * game.planeRotZSensivity;
    var targetCameraZ = normalize(game.planeSpeed, game.planeMinSpeed, game.planeMaxSpeed, game.cameraNearPos, game.cameraFarPos);
    camera.fov = normalize(mousePos.x, -1, 1, 40, 80);
    camera.updateProjectionMatrix()
    camera.position.y += (airplane.mesh.position.y - camera.position.y) * deltaTime * game.cameraSensivity;

    game.planeCollisionSpeedX += (0 - game.planeCollisionSpeedX) * deltaTime * 0.03;
    game.planeCollisionDisplacementX += (0 - game.planeCollisionDisplacementX) * deltaTime * 0.01;
    game.planeCollisionSpeedY += (0 - game.planeCollisionSpeedY) * deltaTime * 0.03;
    game.planeCollisionDisplacementY += (0 - game.planeCollisionDisplacementY) * deltaTime * 0.01;

    airplane.pilot.updateHairs();
}

function showReplay() {
    replayMessage.style.display = "block";
}

function hideReplay() {
    replayMessage.style.display = "none";
}
function normalize(v, vmin, vmax, tmin, tmax) {
    var nv = Math.max(Math.min(v, vmax), vmin);
    var dv = vmax - vmin;
    var pc = (nv - vmin) / dv;
    var dt = tmax - tmin;
    var tv = tmin + (pc * dt);
    return tv;

}


var fieldDistance, energyBar, replayMessage, fieldLevel, levelCircle;



const clock = new THREE.Clock()

var oldTime = 0

const tick = () => {

    const elapsedTime = clock.getElapsedTime()

    newTime = new Date().getTime();
    deltaTime = newTime - oldTime;
    oldTime = newTime;

    // newTime = elapsedTime
    // deltaTime = newTime - oldTime
    // oldTime = newTime

    if (game.status == "playing") {

        // Add energy coins every 100m;
        if (Math.floor(game.distance) % game.distanceForCoinsSpawn == 0 && Math.floor(game.distance) > game.coinLastSpawn) {
            game.coinLastSpawn = Math.floor(game.distance);
            coinsHolder.spawnCoins();
        }

        if (Math.floor(game.distance) % game.distanceForSpeedUpdate == 0 && Math.floor(game.distance) > game.speedLastUpdate) {
            game.speedLastUpdate = Math.floor(game.distance);
            game.targetBaseSpeed += game.incrementSpeedByTime * deltaTime;
        }


        if (Math.floor(game.distance) % game.distanceForEnnemiesSpawn == 0 && Math.floor(game.distance) > game.ennemyLastSpawn) {
            game.ennemyLastSpawn = Math.floor(game.distance);
            ennemiesHolder.spawnEnnemies();
        }

        if (Math.floor(game.distance) % game.distanceForLevelUpdate == 0 && Math.floor(game.distance) > game.levelLastUpdate) {
            game.levelLastUpdate = Math.floor(game.distance);
            game.level++;
            fieldLevel.innerHTML = Math.floor(game.level);

            game.targetBaseSpeed = game.initSpeed + game.incrementSpeedByLevel * game.level
        }


        updatePlane();
        updateDistance();
        updateEnergy();
        
        game.baseSpeed += (game.targetBaseSpeed - game.baseSpeed) * deltaTime * 0.02;
        game.speed = game.baseSpeed * game.planeSpeed;

    } else if (game.status == "gameover") {
        game.speed *= .99;
        airplane.mesh.rotation.z += (-Math.PI / 2 - airplane.mesh.rotation.z) * .0002 * deltaTime;
        airplane.mesh.rotation.x += 0.0003 * deltaTime;
        game.planeFallSpeed *= 1.05;
        airplane.mesh.position.y -= game.planeFallSpeed * deltaTime;

        if (airplane.mesh.position.y < -200) {
            showReplay();
            game.status = "waitingReplay";

        }
    } else if (game.status == "waitingReplay") {

    }


    airplane.propeller.rotation.x += .2 + game.planeSpeed * deltaTime * .005;
    sea.mesh.rotation.z += game.speed * deltaTime;//*game.seaRotationSpeed;

    if (sea.mesh.rotation.z > 2 * Math.PI) sea.mesh.rotation.z -= 2 * Math.PI;

    ambientLight.intensity += (.5 - ambientLight.intensity) * deltaTime * 0.005;

    coinsHolder.rotateCoins();
    ennemiesHolder.rotateEnnemies();

    sky.moveClouds();
    sea.moveWaves();






    // Update Orbital Controls
    // controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}



function init(event) {

    // UI

    fieldDistance = document.getElementById("distValue");
    energyBar = document.getElementById("energyBar");
    replayMessage = document.getElementById("replayMessage");
    fieldLevel = document.getElementById("levelValue");
    levelCircle = document.getElementById("levelCircleStroke");

    resetGame();
    // createScene();

    // createLights();
    createPlane();
    createSea();
    createSky();
    createCoins();
    createEnnemies();
    createParticles();

    document.addEventListener('mousemove', handleMouseMove, false);
    document.addEventListener('touchmove', handleTouchMove, false);
    document.addEventListener('mouseup', handleMouseUp, false);
    document.addEventListener('touchend', handleTouchEnd, false);

    tick();
}
window.addEventListener('load', init, false);