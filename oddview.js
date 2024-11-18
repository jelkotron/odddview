// ################ LIBRARIES ################
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// ################ class & helpers to wrap 3D scene setup for ease of use ################
export class OdddViewer {
        // #### constructor function is called on object instantiation ####
        constructor(container_id, env = null, geo = null){

            // html element
            this.container = document.getElementById(container_id);

            // scene
            this.scene = new THREE.Scene();
            
            // loaders
            this.env = env;
            this.envLoader = new THREE.TextureLoader();
            if(env != null){
                this.setEnvironment(env);
            }

            this.geo = geo;
            if(geo != null){
                this.setGeometry(geo);
            }

            this.geoLoader = new GLTFLoader();
            
            // camera 
            let aspect = this.container.clientWidth / this.container.clientHeight;
            let fov = 60; // to be accessed via camera.fov, camera.near, etc.
            let near = 0.1;
            let far = 32; // TODO: Set using bounding box of geometry loaded
            this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
            this.camera.position.set( 1, 1.5, 2 );
            this.scene.add(this.camera);
            
            // renderer
            this.renderer = new THREE.WebGLRenderer( { antialias: true } );
            this.renderer.physicallyBasedShading = true;
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.toneMapping = THREE.NoToneMapping;
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
            
            // add renderer to div container
            this.container.append(this.renderer.domElement);

            // controls
            this.controls = new OrbitControls( this.camera, this.renderer.domElement );
            this.controls.minDistance = 0;
            this.controls.maxDistance = 3;
            this.controls.enablePan = true;   
            this.controls.target = new THREE.Vector3(0, 2, 0);
            this.controls.update()

            // bg color
			this.backgroundCol = new THREE.Color( '#add7e6' );

            // environment texture
            this.envTex = undefined;

            // animation
            this.animationmixer = undefined;
            this.animations = undefined;
            this.actions = undefined;
            this.clock = new THREE.Clock();
            
            const geometry = new THREE.BoxGeometry( 2, 2, 2 ); 
            const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} ); 
            const cube = new THREE.Mesh( geometry, material ); 
            this.scene.add( cube );

            this.render();
            this.setGeometry.bind(this);  
        }
        // #### function to load geometry ####
        setGeometry(geoPath){
            let vertCount = 0;
            this.clearScene();
            var self = this;
            let slicedPath = dirAndFile(geoPath);
            let directory = slicedPath[0];
            let file = slicedPath[1];
            this.geoLoader.setPath(directory);

            let geo = this.geoLoader.load(file, function(gltf){
                self.animationmixer = new THREE.AnimationMixer(gltf.scene);
                gltf.animations.forEach( (clip ) => {
                    self.animationmixer.clipAction(clip).play();
                    const action = self.animationmixer.clipAction(clip);
                    action.clampWhenFinished = true;
                    action.timeScale = 1;
                    action.setLoop(THREE.LoopRepeat, Infinity);
                })

                if(gltf.animations.length > 0){
                    self.animations = gltf.animations;
                }

                gltf.scene.traverse(function(node){
                    if (node.isMesh || node.isLight) {
                        node.castShadow = true;
                    }
                    if (node.isMesh) {
                        node.receiveShadow = true;
                    }
                    
                });
                
                self.scene.add(gltf.scene);
                self.updateView();
                console.log("oDDD: Geometry loaded.");
            });
        }

        // #### function to load environment texture ####
        setEnvironment(envTexPath, context=this){
            let slicedPath = dirAndFile(envTexPath);
            let directory = slicedPath[0];
            let file = slicedPath[1];
            this.envLoader.setPath(directory);
            let envTex = this.envLoader.load(file, function(texture){
                texture.mapping = THREE.EquirectangularReflectionMapping;
                texture.needsUpdate = true;
                context.envTex = envTex;
                context.scene.environment = envTex;
                context.scene.background = envTex;
                context.updateView();
                
                const environment = new RoomEnvironment( context.renderer );
				const pmremGenerator = new THREE.PMREMGenerator( context.renderer );
                context.scene.environment = pmremGenerator.fromEquirectangular(texture).texture;
				environment.dispose();
                console.log("oDDD: Environment loaded.");
            })
        }

        clearScene(){
            let self = this;
            while(this.scene.children.length > 0){ 
                this.scene.remove(this.scene.children[0]); 
            }
            this.clock = new THREE.Clock();
            // TODO: Good way to clear animations? Necessary?
            if(this.animationmixer != undefined && this.animations != undefined){
                this.animationmixer.update(self.clock.getDelta());
                for(let i=0; i<this.animations.length; i++){
                    const action = this.animationmixer.clipAction(this.animations[i]);
                    action.stop();
                }
            }

            this.animations = undefined;
            this.renderer.environment = undefined;
            this.renderer.background = undefined;
            this.updateView();
        }

        playAnimation(){
            let self = this;
            if(self.animations !== undefined){
                let animPromise = new Promise((resolve, reject) => {
                    self.animationmixer.update(self.clock.getDelta());
                    self.animations.forEach((clip) => {
                        const action = self.animationmixer.clipAction(clip);
                        action.play();
                        resolve();
                        })
                        self.render(); 
                    }
                    , /*{cache: "no-store"}*/)

                return animPromise;
            }
            else{
                reject();
            }
        } 

        // #### function to adjust renderer to div container size and render view ####
        updateView() {
            this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera.updateProjectionMatrix();
            
            this.render();
        }

        render(context=this){
            this.renderer.render(context.scene, context.camera)
        }

}


// #### helper function so separate filepaths and -names ####
function dirAndFile(pathstring){
    pathstring = pathstring.split("/")
    let file = pathstring.pop();
    let folder = pathstring.join("/") + '/';
    if (folder[0] != '/' && folder[0] != '.' ) {
        folder = '/' + folder;
    }
    return [folder, file];
}