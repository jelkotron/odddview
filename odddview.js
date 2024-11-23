// ################ LIBRARIES ################
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
// #### class storing 3d data and (default) scene settings to be set via json ####
class Data{
    constructor(data){
        // controls
        this.type = 'ORBIT';
        this.enable_pan = true;
        this.enable_zoom = true;
        this.enable_rotate = true;
        this.min_distance = 0.1;
        this.max_distance = 100;
        this.target_x = 0;
        this.target_y = 0;
        this.target_z = 0;
        this.camera_x = 0;
        this.camera_y = 0;
        this.camera_z = 0;
        this.camera_fov = 50;
        this.camera_clip_near = 0.1;
        this.camera_clip_far = 100; 
        // scene
        this.controls = 'ORBIT';
        this.meshes = undefined;
        this.environment = undefined;
        this.exposure = 1;
        this.background_color = undefined;
        this.render_transparent = false;
        this.highlight_color_0 = '#FFFFFF';
        this.highlight_color_1 = '#000000';
        this.persistent_highlight = true
        this.decompose = false;

        // dict
        this.dictionary = undefined;

        if(data){
            this.update(data);
        }
    }
    update(dict){
        // Settings
        if("controls" in dict){
            if("type" in dict["controls"]){
                this.type = dict["controls"]["type"];
            }
            if("enable_pan" in dict["controls"]){
                this.enable_pan = dict["controls"]["enable_pan"];
            }
            if("enable_zoom" in dict["controls"]){
                this.enable_zoom = dict["controls"]["enable_zoom"];
            }
            if("enable_rotate" in dict["controls"]){
                this.enable_rotate = dict["controls"]["enable_rotate"];
            }
            if("min_distance" in dict["controls"]){
                this.min_distance = dict["controls"]["min_distance"];
            }
            if("max_distance" in dict["controls"]){
                this.max_distance = dict["controls"]["max_distance"];
            }
            if("target_x" in dict["controls"]){
                this.target_x = dict["controls"]["target_x"];
            }
            if("target_y" in dict["controls"]){
                this.target_y = dict["controls"]["target_y"];
            }
            if("target_z" in dict["controls"]){
                this.target_z = dict["controls"]["target_z"];
            }
            if("camera_x" in dict["controls"]){
                this.camera_x = dict["controls"]["camera_x"];
            }
            if("camera_y" in dict["controls"]){
                this.camera_y = dict["controls"]["camera_y"];
            }
            if("camera_z" in dict["controls"]){
                this.camera_z = dict["controls"]["camera_z"];
            }
            if("camera_fov" in dict["controls"]){
                this.camera_fov = dict["controls"]["camera_fov"];
            }
            if("camera_clip_near" in dict["controls"]){
                this.camera_clip_near = dict["controls"]["camera_clip_near"];
            }
            if("camera_clip_far" in dict["controls"]){
                this.camera_clip_far = dict["controls"]["camera_clip_far"];
            }
        }    
        // Data
        if("meshes" in dict){
            this.meshes = dict["meshes"];
        }
        if("environment" in dict){
            this.environment = dict["environment"];
        }
        if("exposure" in dict){
            this.exposure = dict["exposure"];
        }
        if("background_color" in dict){
            this.background_color = dict["background_color"];
        }
        if("render_transparent" in dict){
            this.render_transparent = dict["render_transparent"];
        }
        if("dictionary" in dict){
            this.dictionary = dict["dictionary"];
        }
        if("highlight" in dict){
            this.highlight = dict["highlight"];
        }
        if("highlight_color_0" in dict){
            this.highlight_color_0 = dict["highlight_color_0"];
        }
        if("highlight_color_1" in dict){
            this.highlight_color_1 = dict["highlight_color_1"];
        }
        if("decompose" in dict){
            this.decompose = dict["decompose"];
        }

            
    }
}

// #### class containing threejs logic ####
export class OdddViewer {
        constructor(container, data){
            // html element
            this.container = container;
            this.settings = data;

            // scene
            this.scene = new THREE.Scene();
            if (data.background_color !== undefined){
                this.scene.background = new THREE.Color(data.background_color);
            }

            // camera
            this.camera = new THREE.PerspectiveCamera(
                data.camera_fov, 
                this.container.clientWidth / this.container.clientHeight, // aspect
                data.camera_clip_near, 
                data.camera_clip_far);
            this.camera.position.set(
                data.camera_x, 
                data.camera_y, 
                this.settings.camera_z );
            this.scene.add(this.camera);
            
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
            this.renderer.toneMappingExposure = 10000;//this.settings.exposure;
            
            // composer
            this.composer = new EffectComposer(this.renderer);
            this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            
            // shaded pass
            this.renderPass = new RenderPass(this.scene, this.camera);
            this.renderPass.toneMapping = THREE.LinearToneMapping;
            this.renderPass.toneMappingExposure = 10000;
            this.composer.addPass(this.renderPass)

            // outline pass
            this.outlinePass = new OutlinePass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                this.scene,
                this.camera
            );
            this.outlinePass.edgeStrength = 3.0;
            this.outlinePass.edgeGlow = 0;
            this.outlinePass.edgeThickness = 1.0;
            this.outlinePass.pulsePeriod = 0;
            this.outlinePass.usePatternTexture = false; 
            this.outlinePass.visibleEdgeColor.set(this.settings.highlight_color_0);
            this.outlinePass.hiddenEdgeColor.set(this.settings.highlight_color_1);
            
            this.composer.addPass(this.outlinePass);

            // anti aliasing
            this.effectFXAA = new ShaderPass(FXAAShader);
            this.effectFXAA.uniforms["resolution"].value.set(
                1 / window.innerWidth,
                1 / window.innerHeight
            );
            this.effectFXAA.renderToScreen = true;
            this.composer.addPass(this.effectFXAA);

            // add renderer to div container
            this.container.append(this.renderer.domElement);

            // selection
            this.select_previous = undefined;

            // controls
            this.controls = new OrbitControls( this.camera, this.renderer.domElement );
            this.controls.minDistance = this.settings.min_distance;
            this.controls.maxDistance = this.settings.max_distance;

            this.controls.enablePan = this.settings.enable_pan;
            this.controls.enableZoom = this.settings.enable_zoom;
            this.controls.enableRotate = this.settings.enable_rotate;
   
            this.controls.target = new THREE.Vector3(this.settings.target_x, this.settings.target_y, this.settings.target_z);
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
            
            // ray casting for highlighting elements
            this.pointer = new THREE.Vector2();
            this.raycaster = new THREE.Raycaster();

            // placeholder geometry
            const geometry = new THREE.BoxGeometry( 2, 2, 2 ); 
            const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} ); 
            const cube = new THREE.Mesh( geometry, material ); 
            this.scene.add( cube );

            this.render();
            this.setGeometry.bind(this);  
            this.updateView.bind(this);

            // loaders
            this.geoLoader = new GLTFLoader();

            this.envLoader = new THREE.TextureLoader();
            if(this.settings.environment != null){
                this.setEnvironment(this.settings.environment);
            }

            if(this.settings.meshes != null){
                this.setGeometry(this.settings.meshes);
            }

        }

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
                        
                        if(self.settings.decompose === true){
                            node.matrixWorld.decompose( node.position, node.quaternion, node.scale );
                            self.scene.add(node);
                        }
                    })
                    if(self.settings.decompose === false){
                        self.scene.add(gltf.scene)
                    }                    
                    self.updateView();
                });
            }
            console.log("oDDD: Geometry loaded.");
        }

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
                if(!context.settings.render_transparent){
                    context.scene.background = envTex;
                }
                
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

        updateView() {
            this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera.updateProjectionMatrix();
            
            this.render();
        }

        render(context=this){
            this.composer.render(context.scene, context.camera)
        }

        getIntersections(event){
            let mouse = [event.clientX, event.clientY]; 
            const canvas = this.renderer.domElement
            const pos = this.getCanvasRelativePosition(mouse)
            this.pointer.x = (pos.x / canvas.width ) *  2 - 1;
            this.pointer.y = (pos.y / canvas.height) * -2 + 1;

            
            
            
            if(pos.x > 0 && pos.x < canvas.width){
                if(pos.y > 0 && pos.y < canvas.height){
                    let object = undefined;
                    this.raycaster.setFromCamera( this.pointer, this.camera );
                    const intersects = this.raycaster.intersectObjects( this.scene.children, true );
                    
                    if(this.settings.highlight !== 'PERSISTENT'){
                    }
                    this.outlinePass.selectedObjects = [];
                    
                    if (intersects.length > 0) {
                        object = intersects[0].object;
                        if(this.settings.highlight !== 'NONE'){
                            this.outlinePass.selectedObjects =[]
                            this.outlinePass.selectedObjects.push(object);
                        }
                    }
                    else{
                        if(this.select_previous !== undefined){
                            this.outlinePass.selectedObjects.push(this.select_previous);
                        }
                    } 
                    this.updateView()
                    return object
                }
            }
            
            this.outlinePass.selectedObjects =[];
            
            if(this.select_previous !== undefined){
                    this.outlinePass.selectedObjects.push(this.select_previous);
                }
            
                this.updateView();

            return undefined

        }
            
            
        
        select_set(event){
            let obj = this.getIntersections(event);
            if(obj){
                this.select_previous = obj;
            } 
        }
        
        getCanvasRelativePosition(coords2d) {
            const canvas = this.renderer.domElement;
            const rect = canvas.getBoundingClientRect();
            return {
              x: (coords2d[0] - rect.left) * canvas.width  / rect.width,
              y: (coords2d[1] - rect.top ) * canvas.height / rect.height,
            };
        }

        updateViewerSize(){
            this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize( this.container.clientWidth, this.container.clientHeight );
            this.composer.setSize( this.container.clientWidth, this.container.clientHeight );
            this.effectFXAA.uniforms["resolution"].value.set(
                1 / window.innerWidth,
                1 / window.innerHeight
              );
            this.updateView()
        }

        updateMousePosition(event){
            let mouse = [event.clientX, event.clientY]; 
            let intersect = this.getIntersections(mouse);
            
            if(intersect != undefined){
                return intersect; 
            }
            return undefined;
        };
}

        

// #### helper function so separate filepaths and -names for texture loader ####
function dirAndFile(pathstring){
    pathstring = pathstring.split("/")
    let file = pathstring.pop();
    let folder = pathstring.join("/") + '/';
    if (folder[0] != '/' && folder[0] != '.' ) {
        folder = '/' + folder;
    }
    return [folder, file];
}

function camelize(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
      if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
      return index === 0 ? match.toLowerCase() : match.toUpperCase();
    });
  }
  

function updateTextElement(map){
    for(let i=0; i<map.length; i++){
        let key = map[i][0];
        let value = map[i][1];
        let leDiv = document.getElementById(key);
        if(leDiv === null){
            leDiv = document.createElement('div');
            leDiv.id = key;
            leDiv.innerHTML = value;
            const c = document.getElementById("infovalue3d");
            if(c){
                c.appendChild(leDiv)
            }
        }else{
            leDiv.innerHTML = value;
        }
    }
}
// #### main function ####
function main(){ 
    // get last executed script (this)
    const script = document.scripts[document.scripts.length - 1];
    
    // get json url from data attributes (variables passed to script tag)
    const data_url = script.dataset.jsondata;
    // get container
    const container = script.parentNode;

    let select_previous = undefined;
    let hover = undefined;
    // get data from data url
    const response = fetch(data_url).then(res => res.json()).then(rawdata => {
        const jsondata = JSON.parse(rawdata)
        const data = new Data(jsondata)
        let infoKey = undefined;
        let infoValue = undefined;

        // initiate odddviewer when ready
        const viewer = new OdddViewer(container, data);
        
        // add additional elements if specified (dummy)
        if(data["dictionary"] !== undefined){
            infoKey = document.createElement("p");
            infoKey.className = "infokey3d";
            infoKey.innerHTML = "";
            infoKey.style.color = data["highlight_color_0"];
            infoKey.style.position = 'absolute';
            infoKey.style.top = '10px';
            infoKey.style.left = '10px';
            infoKey.style.fontSize = '24px';
            

            container.appendChild(infoKey);

            infoValue = document.createElement("p");
            infoValue.id = "infovalue3d";
            infoValue.innerHTML = "";
            container.parentElement.appendChild(infoValue);
        }
        
        // event listeners
        window.addEventListener('resize', function(){viewer.updateViewerSize()});
        
        viewer.controls.addEventListener("change", function(){viewer.updateView()});
        
        document.addEventListener('pointermove', function(event){
            let intersect = viewer.getIntersections(event);
            if(intersect){
                container.style.cursor = "pointer";
                if(infoKey){
                    const title = data["dictionary"][intersect.name][0]+'title/';
                    const response = fetch(title)
                    .then(res => res.text())
                    .then(txt => {
                        if(infoKey.innerHTML !== txt && infoKey.innerHTML !== intersect.name){
                            const infoHeader = ">> ";
                            let info = ""; 
                            if(txt !== "" && txt !== "None"){
                                info = txt  
                            }
                            else{
                                info = intersect.name;
                            }
                            hover = info;

                            infoKey.innerHTML = infoHeader + info;
                        }
                        if(txt == select_previous){
                            infoKey.innerHTML = txt;
                        }

                    })


                    
                }
            }
            else{
                container.style.cursor = "auto";
                infoKey.innerHTML = "";
                hover = undefined;
                if(select_previous){
                    infoKey.innerHTML = select_previous;
                }
            }
        });

        window.addEventListener('mousedown', function(event){
            let intersect = viewer.getIntersections(event);
            if(true){ // TODO: check if mouse in 3d canvas
                let intersect = viewer.getIntersections(event);
                if(intersect){
                    if(infoValue){
                        let promise = new Promise(function(resolve, reject) {
                            infoValue.innerHTML = "";
                            for(let i=0; i<data["dictionary"][intersect.name].length; i++){
                                let bl = data["dictionary"][intersect.name][i];
                                let leDiv = document.createElement('div');
                                leDiv.id = bl; 
                                infoValue.appendChild(leDiv)
                            }
                            resolve("Done");
                        })

                        promise.then(
                            function(){
                                for(let i=0; i<data["dictionary"][intersect.name].length; i++){
                                    let bl = data["dictionary"][intersect.name][i];
                                    
                                    let blockList = [];
                                    const response = fetch(bl).then(res => res.text()).then(txt => {
                                        blockList.push([bl ,txt]);
                                        return blockList;
                                    }).then(blockList => {
                                        updateTextElement(blockList);
                                        viewer.select_set(event);
                                        if(hover){
                                            select_previous = hover;
                                        }
                                    })
                                }
                            }
                        )
                          
                        

                    }
                }
            }
            
        });

    });


}

        
// run application
main();
