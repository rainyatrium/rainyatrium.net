//DIALOGUE TEST MYSTERE INITIALIZATION FILE. WHAT IS THE DEAL WITH THIS GUY? LET ME TELL U. 
//First we summon the rest of mystere, then we do stuff like add our characters... Basically this is mystere config stuff unique to each project.
//This should be sitting in the head of each page for a project

let mystereFolder;
var mysInit = {
  addScripts: function () {
    mystereFolder = "/js/mystere/" //FOLDER CONFIG!!!
    var script = document.createElement('script');
    script.src = mystereFolder+"mystere.js";
    document.head.appendChild(script); 
  }
}
//set up mystere framework
mysInit.addScripts();

//once we are all loaded, we can imagine anything
window.addEventListener("load", function(event) {
  // ===FRAMEWORK CONFIG===
  let mysConfig = function(){
    mys.projectName = "dialoguetest";
    mys.mystereFolder = mystereFolder;
  };
  mys.DLG.klungo = function() {
    return true
  }
  // ===ADD CHARACTERS TO THE LIST===
  //name, portrait, position, font, talksound, css, html
  //we do it this way so that we can potentially add characters from different sources. just in case
  mys.DLG.addCharacter({
    name:'soleil',
    portrait:'/assets/soleil/portraits/soleil.gif',
    position:'right',
    css:`
    {
      font-family: Times New Roman
    }
    `
    });
  mys.DLG.addCharacter({
    name:'attendant',
    portrait:'/assets/soleil/portraits/attendant2.gif',
    position:'left',
    css:`
    {
      font-family: ImpossAccents
    }
    `
    });
  mys.DLG.addCharacter({
    name:'interloper',
    portrait:'/assets/corrulike/interloper.gif',
    position:'left',
    css:`
    {
      font-family: Space Mono
    }
    `
    });
  mys.DLG.addCharacter({
    name:'walter',
    portrait:'/assets/warehouse/walt.png',
    position:'right',
    css:`
    {
      font-family: Space Mono
    }
    `
    });
  mys.DLG.addCharacter({
    name:'jesse',
    portrait:'/assets/warehouse/jesse.png',
    position:'left',
    css:`
    {
      font-family: Times New Roman
    }
    `
    });
})
