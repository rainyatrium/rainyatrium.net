//MYSTERE DEBUG (mysDBG)
//this is just a little box that i can easily monitor random variables with
//mysDBG.addMonitor(variable) adds the line in the debug
//mysDBG.updateMonitor("id",variable) updates the line, to be called as needed

var mysDBG = {
    //STYLE
  debugStyle: `
    .debug {
      color:white;
      display:none;
      position:absolute;
      font-family: Times New Roman;
      font-size:90%;
      width:22%;
      top:0px;
      right:0px;
      z-index:777;
      border:1px dotted;
      border-color:white;
      background:rgba(0,0,0,0.7);
      resize:both;
      overflow:auto;
      overflow-wrap:anywhere;
    }
    
    .debugheader {
      color:white;
      font-family: Times New Roman;
      background:rgba(0,0,0,0.8);
      cursor:move;
      font-size:75% !important;
    }
  `,
  
  DEBUG: function(){ 
      let debugDiv = document.querySelector(".debug");
      let debugHeader = document.createElement("div");
      debugHeader.innerHTML = `<div class = "debugheader" style="font-family:Times New Roman;font-size:0.7rem;font-weight:bold">WHAT?? WHAT ARE YOU DOING IN HERE??</div>`
      debugDiv.prepend(debugHeader);
      let debug = false;
      document.addEventListener("keydown", keyPress);
      function keyPress(e) {
        //console.log(e.key);
        if (e.key == "`") {
          if (!debug) {
              debug = true; 
              debugDiv.style.display = "inline"     
          } else {
              debug = false;
              debugDiv.style.display = "none"
          }
        }

      }
    },
    
  //let's add an easy/quick way to monitor any variable we want
  addMonitor: function(variable) {
        let debugDiv = document.querySelector(".debug");
        //add a span with an id corresponding to the variable we want to track
        let newMonitor = document.createElement("span");
        newMonitor.id = variable+'DMonitor';
        newMonitor.innerHTML = '<br><span>'+variable+'</span>'
        debugDiv.append(newMonitor);
        //add the function to update the span to our interval/debugFunctions array
    },
  //easy way to update it without typing out the whole thing every time
  updateMonitor: function(id,variable,label) {
    if(document.querySelector(".debug").style.display == "inline"){
      if (label != null) {
     document.getElementById(id+'DMonitor').innerHTML = '<br>'+label+': ' + variable; //update debug counter
      } else {
         document.getElementById(id+'DMonitor').innerHTML = '<br>'+id+': ' + variable; //update debug counter
      }
    }
  }
}

//on window load
window.addEventListener("load", function(event) {
  mysDBG.DEBUG();
  dragElement(document.querySelector(".debug"));
  let styleSheet = document.createElement("style");
  styleSheet.textContent = mysDBG.debugStyle;
  document.head.appendChild(styleSheet);
})
