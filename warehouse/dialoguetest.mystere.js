//DIALOGUE TEST MYSTERE INITIALIZATION FILE. WHAT IS THE DEAL WITH THIS GUY? LET ME TELL U. 
//First we summon the rest of mystere, then we do stuff like add our characters... Basically this is mystere config stuff unique to each project.
//This should be sitting in the head of each page for a project

var mysInit = {
  addScripts: function () {
    const mystereFolder = "/js/mystere/"
    var script = document.createElement('script');
    script.src = mystereFolder+"mystere.js";
    document.head.appendChild(script); 
  }  
}

//set up mystere framework
mysInit.addScripts();

//once we are all loaded, we can imagine anything
window.addEventListener("load", function(event) {
  // ===ADD CHARACTERS TO THE LIST===
  //name, portrait, position, font, talksound, css, html
  //we do it this way so that we can potentially add characters from different sources. just in case
  mysDL.addCharacter({
    name:'soleil',
    portrait:'/assets/soleil/portraits/soleil.gif',
    position:'right',
    css:`
    {
      font-family: Times New Roman
    }
    `
    });
  mysDL.addCharacter({
    name:'attendant',
    portrait:'/assets/soleil/portraits/attendant2.gif',
    position:'left',
    css:`
    {
      font-family: ImpossAccents
    }
    `
    })
  mysDL.addCharacter({
    name:'interloper',
    portrait:'/assets/corrulike/interloper.gif',
    position:'left',
    css:`
    {
      font-family: Space Mono
    }
    `
    })
})
