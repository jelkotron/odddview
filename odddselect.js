// ################ LIBRARIES ################
import { OdddViewer } from 'viewer';
import { OdddData } from 'viewer';


class GuiElements{
    constructor(container, dictionary=undefined, root_name=undefined){
        this.dictionary = dictionary;
        this.highlight = false;
        let div = document.createElement("div");
        div.className = "div_3d_gui";
        
        let infoKeyArrows = document.createElement("p");
        infoKeyArrows.className = "infokey3darrows";
        infoKeyArrows.innerHTML = "<<";
        div.appendChild(infoKeyArrows)

        let infoKeyArrowsHelp = document.createElement("p");
        infoKeyArrowsHelp.className = "infokey3darrowshelp";
        infoKeyArrowsHelp.innerHTML = "back to " + root_name;
        div.appendChild(infoKeyArrowsHelp)
        
        let infoKey = document.createElement("p");
        infoKey.className = "infokey3d";
        infoKey.innerHTML = "";
        div.appendChild(infoKey)
        
        container.append(div);    
        
        this.infoKeyArrows = infoKeyArrows;
        this.infoKeyArrowsHelp = infoKeyArrowsHelp;
        this.infoKey = infoKey;
        this.div = div;
    }

    pointToElement(elementname){
        if(this.dictionary && this.dictionary[elementname]){
            elementname = this.dictionary[elementname];
        }
        this.infoKeyArrows.innerHTML = ">>  ";
        this.infoKeyArrows.style.fontWeight = 'bolder';
        this.infoKey.innerHTML = elementname;
    }
    pointToRoot = function(){
        this.infoKey.innerHTML = ""
        this.infoKeyArrows.innerHTML = "<<";
    
        if(this.highlight === true){
            this.infoKeyArrows.style.fontWeight = 'bolder';
            
        }
        else{
            this.infoKeyArrows.style.fontWeight = 'lighter';
        }
    }
    hide = function(){
        this.infoKey.innerHTML = ""
        this.infoKeyArrows.innerHTML = "";
    }
}



function main(){    
    // get json url from data attributes (variables passed to script tag)
    const script = document.scripts[document.scripts.length - 1];
    
    const data_url = script.dataset.jsondata;
    // get container
    const container = script.parentNode;
    
    const response = fetch(data_url).then(res => res.json()).then(rawdata => {
        let intersects = [];
        const jsondata = JSON.parse(rawdata);
        const data = new OdddData(jsondata);
        const dictionary = data["dictionary"];
        const gui = new GuiElements(container, data["dictionary"], data["root_name"]);
        const viewer = new OdddViewer(container, data);
        let block_container = document.getElementsByClassName("block_container")[0];

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
    
    })
}

// run application
main();
