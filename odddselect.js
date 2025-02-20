import { OdddViewer } from 'viewer';
import { OdddData } from 'viewer';

class GuiElements{
    constructor(container, dictionary=undefined, root_name=undefined){
        this.dictionary = dictionary;
        this.highlight = false;
        this.hidden = false;
        this.div = document.createElement("div");
        this.div.className = "div_3d_gui";
        this.root_name = root_name;
        this.infoKeyArrows = document.createElement("p");
        this.infoKeyArrows.className = "infokey3darrows";
        this.infoKeyArrows.innerHTML = "<<";
        this.div.appendChild(this.infoKeyArrows)

        this.infoKeyArrowsHelp = document.createElement("p");
        this.infoKeyArrowsHelp.className = "infokey3darrowshelp";
        this.infoKeyArrowsHelp.innerHTML = "back to " + this.root_name;
        this.div.appendChild(this.infoKeyArrowsHelp)
        
        this.infoKey = document.createElement("p");
        this.infoKey.className = "infokey3d";
        this.infoKey.innerHTML = "";
        this.div.appendChild(this.infoKey)
        
        container.append(this.div);    
        this.hide();
    }

    pointToElement(elementname){
        let a = "";
        if(this.dictionary && this.dictionary[elementname]){
            elementname = elementname + " - " + this.dictionary[elementname];
        }
        this.infoKeyArrows.innerHTML = ">>";
        this.infoKeyArrows.style.fontWeight = 'bolder';
        this.infoKey.innerHTML = elementname;
    }
    pointToRoot = function(){
        this.infoKey.innerHTML = ""
        if(self.hidden === false){
            this.infoKeyArrows.innerHTML = "<<";
        }
        else{
            this.infoKeyArrows.innerHTML = "";
        }
    
        if(this.highlight === true){
            this.infoKeyArrows.style.fontWeight = 'bolder';
        }
        else{
            this.infoKeyArrows.style.fontWeight = 'lighter';
        }
    }
    hide = function(){
        self.hidden = true;
        this.infoKey.innerHTML = "";
        this.infoKeyArrows.innerHTML = "";
        this.infoKeyArrowsHelp.innerHTML = "";
    }
    unhide = function(){
        self.hidden = false;
        this.infoKeyArrowsHelp.innerHTML = "back to " + this.root_name;
    }
}

var setInnerHTML = function(elm, html) {
    elm.innerHTML = html;
    Array.from(elm.querySelectorAll("script")).forEach(oldScript => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes)
        .forEach(attr => newScript.setAttribute(attr.name, attr.value));
      newScript.appendChild(document.createTextNode(oldScript.innerHTML));
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
}

function main(){    
    // get json url from data attributes (variables passed to script tag)
    const script = document.scripts[document.scripts.length - 1];
    // get container
    const container = script.parentNode;
    
    // get data, add objects 
    // const response = fetch(data_url).then(res => res.json()).then(rawdata => {
    const jsondata = JSON.parse(script.dataset.jsondata);
    const data = new OdddData(jsondata);
    const dictionary = data["dictionary"];
    
    const gui = new GuiElements(container, dictionary, data["root_name"]);
    const viewer = new OdddViewer(container, data);
    
    let block_container = document.getElementsByClassName("block_container")[0];
    
    let intersects = [];
    
    gui.div.addEventListener("mouseenter", function(){
        gui.highlight = true;
    });

    gui.div.addEventListener("mouseleave", function(){
        gui.highlight = false;
    });
    
    gui.div.addEventListener('click', (event) => {
        viewer.setPrimaryHighlight(null);     
        const response = fetch('blocks/').then(res => res.text()).then(txt => {
            block_container.innerHTML = txt;
        }).then(undefined => {
            gui.hide()
        })
    })   


    document.addEventListener('click', (event) =>{
        intersects = viewer.getIntersections(event);
        viewer.setPrimaryHighlight(intersects);
        
        if(intersects.length > 0){
            block_container.innerHTML = "";
            let key = intersects[0].object.name;
            let value = dictionary[key];
            const response = fetch('blocks/' + key).then(res => res.text()).then(htmltext => {
                block_container.innerHTML = htmltext;
                let htmlscript = block_container.getElementsByClassName('odddscript')[0];
                
                let impmap = block_container.getElementsByClassName('import_map');
                if(impmap.length > 0){
                    impmap = impmap[0]
                    const p = impmap.parentElement;
                    p.removeChild(impmap);
                }

                if(htmlscript){
                    const parent = htmlscript.parentElement;
                    const bl_jsondata = JSON.parse(htmlscript.dataset.jsondata);
                    const bl_data = new OdddData(bl_jsondata);
                    const bl_dictionary = bl_data["dictionary"];
                    const bl_viewer = new OdddViewer(parent, bl_data);
                    parent.removeChild(htmlscript);
                }
                
            }).then(htmltext => {
                gui.unhide();
            })
        }
    });

    document.addEventListener('pointermove', (event) =>{
        intersects = viewer.getIntersections(event);
        if(intersects.length > 0){
            viewer.setSecondaryHighlight(intersects);
            let txt = intersects[0].object.name;
            gui.pointToElement(txt) 
            container.style.cursor = "pointer";
        }
        else{
            viewer.setSecondaryHighlight(null);
            gui.pointToRoot();
            container.style.cursor = "auto";
        }
    });
}

// run application
main();
