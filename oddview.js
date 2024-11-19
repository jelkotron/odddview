// ################ LIBRARIES ################
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

class Settings{
    constructor(){
        // controls
        const type = 'ORBIT';
        const enable_pan = true;
        const enable_zoom = true;
        const enable_rotate = true;
        const min_distance = 0.1;
        const max_distance = 100;
        const target_x = 0;
        const target_y = 0;
        const target_z = 0;
        const camera_x = 0;
        const camera_y = 0;
        const camera_z = 0;
        const camera_fov = 50;
        const camera_clip_near = 0.1;
        const camera_clip_far = 100; 
        // scene
        const controls = 'ORBIT';
        const meshes = undefined;
        const environment = undefined;
        const background = undefined;
    }
    update(dict){
        if("controls" in dict){
            if("type" in dict["controls"]){
                this.type = dict["controls"]["type"]
            }
            if("enable_pan" in dict["controls"]){
                this.enable_pan = dict["controls"]["enable_pan"]
            }
            if("enable_zoom" in dict["controls"]){
                this.enable_zoom = dict["controls"]["enable_zoom"]
            }
            if("enable_rotate" in dict["controls"]){
                this.enable_rotate = dict["controls"]["enable_rotate"]
            }
            if("min_distance" in dict["controls"]){
                this.min_distance = dict["controls"]["min_distance"]
            }
            if("max_distance" in dict["controls"]){
                this.max_distance = dict["controls"]["max_distance"]
            }
            if("target_x" in dict["controls"]){
                this.target_x = dict["controls"]["target_x"]
            }
            if("target_y" in dict["controls"]){
                this.target_y = dict["controls"]["target_y"]
            }
            if("target_z" in dict["controls"]){
                this.target_z = dict["controls"]["target_z"]
            }
            if("camera_x" in dict["controls"]){
                this.camera_x = dict["controls"]["camera_x"]
            }
            if("camera_y" in dict["controls"]){
                this.camera_y = dict["controls"]["camera_y"]
            }
            if("camera_z" in dict["controls"]){
                this.camera_z = dict["controls"]["camera_z"]
            }
            if("camera_fov" in dict["controls"]){
                this.camera_fov = dict["controls"]["camera_fov"]
            }
            if("camera_clip_near" in dict["controls"]){
                this.camera_clip_near = dict["controls"]["camera_clip_near"]
            }
            if("camera_clip_far" in dict["controls"]){
                this.camera_clip_far = dict["controls"]["camera_clip_far"]
            }

            
        }    

        if("meshes" in dict){
            this.meshes = dict["meshes"]
        }
        if("environment" in dict){
            this.environment = dict["environment"]
        }
        if("background" in dict){
            this.background = dict["background"]
        }
    }
}

// ################ class & helpers to wrap 3D scene setup for ease of use ################
export class OdddViewer {
        // #### constructor function is called on object instantiation ####
        constructor(container_id, jsondata){
            // html element
            this.container = document.getElementById(container_id);
            // settings and data
            const data = JSON.parse(jsondata)
            const settings = new Settings
            settings.update(data) 

            // scene
            this.scene = new THREE.Scene();
            if (settings.background !== undefined){
                this.scene.background = new THREE.Color( '#add7e6' );
            }

            
            // renderer
            this.renderer = new THREE.WebGLRenderer( { 
                antialias: true,
                alpha: true
            } );
            this.renderer.physicallyBasedShading = true;
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.toneMapping = THREE.NeutralToneMapping;
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
            this.renderer.toneMappingExposure = 1;
            // add renderer to div container
            this.container.append(this.renderer.domElement);


            // camera
            this.camera = new THREE.PerspectiveCamera(
                settings.camera_fov, 
                this.container.clientWidth / this.container.clientHeight, // aspect
                settings.camera_clip_near, 
                settings.camera_clip_far);
            this.camera.position.set(
                settings.camera_x, 
                settings.camera_y, 
                settings.camera_z );
            this.scene.add(this.camera);

            // controls
            this.controls = new OrbitControls( this.camera, this.renderer.domElement );
            this.controls.minDistance = settings.min_distance;
            this.controls.maxDistance = settings.max_distance;

            this.controls.enablePan = settings.enable_pan;
            this.controls.enableZoom = settings.enable_zoom;
            this.controls.enableRotate = settings.enable_rotate;
   
            this.controls.target = new THREE.Vector3(settings.target_x, settings.target_y, settings.target_z);
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

            // loaders
            this.geoLoader = new GLTFLoader();

            this.envLoader = new THREE.TextureLoader();
            if(settings.environment != null){
                this.setEnvironment(settings.environment);
            }
            


            if(settings.meshes != null){
                this.setGeometry(settings.meshes);
            }

        }
        // #### function to load geometry ####
        setGeometry(meshes){
            this.clearScene();
            var self = this;
            for(let i=0; i<meshes.length; i++){
                let mesh = meshes[i]
                let slicedPath = dirAndFile(mesh);
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
                });
            }
            console.log("oDDD: Geometry loaded.");
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
                if(context.scene.background === undefined){
                    context.scene.background = envTex;
                } 
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
                        action.setLoop(THREE.LoopOnce);
                        action.play();
                        resolve();
                        })
                        self.render(); 
                    }
                    , {cache: "no-store"})

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