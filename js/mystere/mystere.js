// === MYSTERE FRAMEWORK! ===
//THIS INITIALIZATION/CORE PAGE IS A MESS WTF I NEED TO FIX IT
//for my adventure games.
//first things first: load in the other parts of mystere by adding them into the head.
//DOWN THE LINE, THIS SHOULD JUST BECOME var = mys and var = mysCFG

var mystere = {
      mystereFolder: "/js/mystere/",
      mystereComponents: ['mystere.debug.js','mystere.dialogue.js'],
      cursor: {x:0, y:0}, //fixed coords
      pageCursor: {x:0, y:0}, //page coords
      defbox: document.getElementById('definition-box')
};
mystereInit();
function mystereInit() {
  const mystereFolder = mystere.mystereFolder;
  const mystereComponents = mystere.mystereComponents;
  const addScripts = function (component) {
    var script = document.createElement('script');
    script.src = mystereFolder+component;
    document.head.appendChild(script); 
  }  
  mystereComponents.forEach((component) => addScripts(component))
}
//on window load. should... should our big mystere object be loaded after this???
window.onload = function () {
  
}

//keeping track of the mouse. for activities.
window.addEventListener('mousemove', e=> {
        mystere.cursor.x = e.clientX //coordinates relative to the browser window
        mystere.cursor.y = e.clientY 
        mystere.pageCursor.x = e.pageX //coordinates relative to the Whole Page
        mystere.pageCursor.y = e.pageY
    })

//draggable elements (okay this had better be good because for a point and click it is kind of important...)
//-function: makeDraggable(). maybe make it so that it automatically makes the positioning absolute? modified from w3schools...
// Make the DIV element draggable:
function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  //console.log(document.querySelector(elmnt.className + "header"))
  if (document.querySelector('.'+document.querySelector(".debug").className+'header')) {
    // if present, the header is where you move the DIV from:
    document.querySelector('.'+document.querySelector(".debug").className+'header').onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
