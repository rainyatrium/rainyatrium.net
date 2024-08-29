//MYSTERE DIALOGUE SYSTEM (mysDL)
/*
-DIALOGUE is a misnomer because this can be applied to wider contexts, but I can't think of anything better to name it at present
-designate a dialogue div, and point it to a text file 
-pull html blocks from that text file (skin can be changed per-instance? or maybe that should be built into character functionality... less complicated)
-support for branching lines of conversation, and it should remember options picked in the past.
-that is: we can skip to other lines, but we can also call in a dynamically-generated menu that then skips us to those lines
-'branches' happen by jumping from line to line, not through any specific/inherent structure, maybe? although we should ignore whitespace so that we can organize branches that way.
-multiple instances should be allowed to exist at once. just in case.
-events system: be able to call any arbitrary function. in the original system made for mo-rning, there were bespoke shorthand parameters.. but i think that that is unnecessary.
-characters: portraits, fonts, etc can be bundled into characters defined as JS objects and used to set several settings at once, but these settings can also be modified individually
-typing: enable and disable the typewriter effect

TO-DO:
name/title support
fix runfunction
ignore starting whitespace (for prettier organization)
dialogue option generation
literally any kind of error handling
sound support
set this up to only re-parse if text file has changed
make function running a bit more consistent
when finished with lines or on selection segment, remove grabby hand from div
*/
var mysDL = {
  // ===VARIABLES & THINGS ===
  //Guy format. we can have a global characters.js elsewhere where we define guys. this should be configurable
  mystereCharacter: function(name, portrait, position, font, fontweight, talksound, css, html) {
    this.name = name;
    this.portrait = portrait; //filepath
    this.position = position; //left, right, none (portrait position)
    this.font = font; //does nothing at the moment
    this.fontweight = fontweight; //does nothing at the moment
    this.talksound = talksound;
    this.css = css;
    this.html = html;
  },
  //this function defines a dialogue element.
  //id should be an element id; source should be a filepath/string
  dialogueObject: function(id,url,format = "sequential") {
    this.id = id;                       //id to match the element's
    this.url = url;                     //text file source url
    this.line = 0;                      //current line
    this.lineTarget = null;                    //line we are going to go to next (overrides current line if present)
    this.textPresentation = "instant";  //instant, typed
    this.typeSpeed = 1;                 //typing speed for typing effects
    this.format = format;               //nodiv, sequential, single (nothing, stack, one at a time)
    this.isBusy = false;                //is it doing an animation (like typing)
    this.lineArray;                     //the text file, split into an array
    this.skipping = false;              //are they trying to skip (ends animation)
    this.nextSound = null;              //generic sound. idk if they should layer
    this.runFunction = null;            //function to run, if there is one. a little picky.
    this.character = new mysDL.mystereCharacter(); //currently speaking character
    this.lastCharacter = null;          //last character
    this.showPortrait = true;
  },
  //we keep all our dialogue elements in here
  dialogueObjectArray: [],
  //DESIGNATING A DIALOGUE ELEMENT & putting it in our array
  addDialogue: function(id,url,format) {
    //console.log(id, url, format);
    id = new this.dialogueObject(id,url,format);
    this.dialogueObjectArray.push(id);
  },
  //we keep all our characters in here. ADDED TO VIA EXTERNAL FILES (mysDL.addCharacter())
  characterArray: [],
  //MAKING A NEW CHARACTER OBJECT and putting it in the character array (this way we can add characters anywhere)
  //also adding character style (nameText) to the stylesheet. can be overridden in css or with code, etc
  addCharacter: function(character) {
    //add to stylesheet
    if (character.css != undefined) {
      let characterStyleSheet = document.createElement("style");
      characterStyleSheet.textContent = '.'+character.name+'Text'+character.css;
      document.head.appendChild(characterStyleSheet);
    }
    //preload image & replace the image text string with the image element.
    //we make junk image elements to preload all the portraits.. ew. 
    //simpler way: scan ahead of time for character switches and load the images then?
    //i really dislike this method at the moment.
    if (character.portrait != undefined) {
      let img = document.createElement("img")
      img.src = character.portrait;
          //background method. lets us zoom in and crop shit. maybe revisit later
          /*img.src = mystere.mystereFolder+"/assets/empty.png"
          dialoguePortraitDiv.style.backgroundImage = 'url('+character.portrait+')';*/
    }
    //push character to characterArray
    this.characterArray.push(new this.mystereCharacter(character.name, character.portrait, character.position, character.font, character.fontweight, character.talksound, character.css, character.html))
  },
  //making the stylesheet for dialogue specific stuff
  //here are css rules applied to all dialogue elements by default
  //dialogueElement is where dialogue is placed
  //dialogueBox is the div that is made and placed inside 
  mystereDialogueStyles:  `
    .clickable {
      cursor: pointer;
    }
    .dialogueElement {
      -webkit-user-select: none; /* Safari */
      -ms-user-select: none; /* IE 10 and IE 11 */
      user-select: none; /* Standard syntax */
    }
    .dialogueElement.sequential {
      overflow: scroll;
      justify-content: start;
    }
    .dialogueElement.single .dialogueBox .dialoguePortrait{
      order:-1;      
    }
    .dialogueElement.single .dialogueBox{
      grid-template-columns: 15% auto;    
    }
    
    .dialoguePortrait{
      width:100%;
      background-size: contain;
      background-repeat: no-repeat;
    }
    .dialoguePortrait img{
      image-rendering: crisp-edges;
      width: 100%;
      object-fit: contain;
    }

    .dialogueBox {
      display: grid;
      order:0;
    }
    .dialogueBox.left {
      grid-template-columns: 15% auto;
    }
    .dialogueBox.right {
      grid-template-columns: auto 15%;
    }
    .dialogueBox.none {
      grid-template-columns: auto 0%;
    }
    .dialogueBox.right .dialoguePortrait{
      order:1
    }
    .dialogueBox.left .dialoguePortrait{
      order:-1
    }
    .dialogueBox.left .dialoguePortrait{
      order:-1
    }
  `,
  
  
  // === WINDOW LOAD ==
  addListeners: function() {window.addEventListener("load", function(event) {
    mysDL.dialogueObjectArray.forEach((dialogueObject) => {
      let elementid = dialogueObject.id;
      let dialogueElement = document.querySelector('#'+elementid);
      
      //why is the browser suddenly refusing to update this??? what is different from the original implementation?????????????
      //split our text files
      $.get(dialogueObject.url, function(data){
          mysDL.parseSource(data);
          //dialogueObject.lineArray = rawLines;
      });      
      
      //Format-based setup. Format can be changed later (if you really want to??? why??) but this determines how the containing element will behave
      switch(dialogueObject.format) {
        case "single":
          dialogueElement.classList.add("single");
          dialogueElement.appendChild(document.createElement("div"));
        break;
        case "sequential":
          dialogueElement.classList.add("sequential");
        break;
      }
      //add the listener that calls our advance line function on click
      dialogueElement.addEventListener("click", function() {
          mysDL.advanceLine(this);
      })
      
      //give it the dialogueElement & clickable classes
      dialogueElement.classList.add("dialogueElement");
      dialogueElement.classList.add("clickable");
      
    })
    //add the dialogueElement css to the stylesheet
    let dialogueStyleSheet = document.createElement("style");
    dialogueStyleSheet.textContent = mysDL.mystereDialogueStyles;
    document.head.appendChild(dialogueStyleSheet);
  })},
  
  // === PARSING DIALOGUE INTO OBJECT TREES ===
  //concept:
  //first, get our array. make it into a set of objects with depth & text properties. then sort into tree by depth
  parseSource: function(source){
    //i have not eaten since lunch
    let rawLines = source.split("\n");
    let cookedLines;
    //count & remove leading tabs + spaces, organize into an object
    let prepLine = function(line){
      let countLeadingTabs = function(line) {
        const tabRegex = /^(\t|    )*/g;
        const match = line.match(tabRegex);
        return match ? match[0].length : 0;
      }
      let preppedLine = {
        depth: countLeadingTabs(line),
        text: line.replace(/^(\t|    )*/g, ''),
      }
      return preppedLine;
    }

    let makeTree = function(source){
        const tree = {
          title: 'root',
          children: []
        };
        const ptrs = [[0, tree]]; // stack
        
        for (let line of source){
          const [depth, text] = [prepLine(line).depth,prepLine(line).text];
          while (ptrs.length && ptrs[ptrs.length-1][0] >= depth)
            ptrs.pop();
          parent = ptrs.length ? ptrs[ptrs.length-1][1] : tree;
          const obj = {text: text, depth: depth, children: []};
          parent.children.push(obj);
          ptrs.push([depth, obj]);
        }
        return tree;
      }

    console.log(makeTree(rawLines))
    /*rawLines.forEach((line)=> 
      
      //console.log(prepLine(line))
    )*/
  },

  // == LINE ADVANCE ==
  //called when line is advanced by any means
  advanceLine: function(dialogueElement) {
      let dialogueObject = this.dialogueObjectArray.find(({ id }) => id === dialogueElement.id);
      //dialogueElement is our DOM element. dialogueObject is our storage object. yippee!
       
      if (dialogueObject.isBusy) {
        dialogueObject.skipping = true;
      } else {
        //check if we are at the end of the array. do not progress if not. maybe add a 'no' sound to this later
        if (dialogueObject.line < dialogueObject.lineArray.length) {
          
          
          // ===APPLY MODIFIERS===
          let parse = function() {
                    //check for modifiers here: this lets us directly modify properties in the dialogue object. we can also run arbitrary functions if we want (good for many things!) 
            if (dialogueObject.lineArray[dialogueObject.line].startsWith("[")) {    
              let pairs =  dialogueObject.lineArray[dialogueObject.line].slice(1,-1).split('||');
                for (const pair of pairs) {
                let [key, value] = pair.split('::');
                //if the key matches any keys in dialogueObject, set it
                for (var modKey of Object.keys(dialogueObject)) {
                  if (modKey == key) {
                    dialogueObject[modKey] = value;
                    //if it's a character NAME property, then we actually want to take the relevant object from characterArray
                    if (modKey == 'character') {
                      dialogueObject.character = mysDL.characterArray.find(({ name }) => name === value);
                    }
                  }
                //if the key matches any keys in dialogueObject.character, set it
                    for (modKey of Object.keys(dialogueObject.character)) {
                      if (modKey == key) {
                        dialogueObject.character[modKey] = value;
                          }
                    }
                  }
                }
                          console.log('incrementing line (parse skip)');
              dialogueObject.line++; //skip the line
            }
          }
          parse();
          
          //skip line if told via lineTarget
          if (dialogueObject.lineTarget != null) {
            console.log('a');
            dialogueObject.line = dialogueObject.lineTarget-1;
            dialogueObject.lineTarget = null;
            parse();
          }

          // ===RUN FUNCTION===
              //run our function if we have one. 
              //this is so incredibly jankily done. i will revisit it i promise.
              //oh we can put all the special functions in an object and check against that :) 
              if (dialogueObject.runFunction != null) {
                let split = dialogueObject.runFunction.split(/(.+)\((.+)\)/)
                if (split[2] == null) {
                  window[split[0].toString()]()
                } else {
                window[split[1]](split[2])
                }
              }
              
              
              // ===TEXT DISPLAY===
              //Now we place the text!! This first section is the different ways we can do that.
              //Further down is the switch statement controlling which function is used
                
                //text typing effect
                const printSentence = (id, sentence, speed) => {
                  let index = 0;
                  let scrollCounter = 0;
                  let element = document.getElementById(id);
                
                  let timer = setInterval(function() {
                      dialogueObject.isBusy = true;
                      const char = sentence[index];
                      
                      if (char === '<') {
                        index = sentence.indexOf('>', index);  // skip to greater-than
                      }
                      
                      //If skipping is true, then skip to the end of the sentence
                      if (dialogueObject.skipping == false) { 
                        element.innerHTML = sentence.slice(0, index);
                        } else { 
                        element.innerHTML = sentence.slice(0, sentence.length); 
                        index = sentence.length-1;
                        dialogueObject.skipping = false;
                        }
                      function scrollBottom() {
                        dialogueElement.scrollTo({
                        top:  dialogueElement.scrollHeight,
                        behavior: 'smooth',
                      })
                      }
                      //Scroll to the bottom 
                      //modulo so that it does not get jittery outside firefox
                      scrollCounter++;
                      if (scrollCounter % 10 === 0) {
                        scrollBottom()
                      }
              
                      if (++index === sentence.length) {
                        scrollBottom()
                        dialogueObject.isBusy = false;
                        clearInterval(timer);
                      }
                    }, speed);
                  } 
              
              
              // ===ADDING DIALOGUE===
              let makeDialogue = {
                // MULTIPURPOSE: INSERT PORTRAIT
                insertPortrait: function (element) {
                //if the portrait is not null
                //if the character is not different from before and showPortrait is true 
                //OR if it's in single mode... display the portrait
                  if (((dialogueObject.character.portrait != null) && ((dialogueObject.showPortrait == true) && (dialogueObject.character != dialogueObject.lastCharacter)))|| (dialogueObject.format == "single")) {
                        let dialoguePortraitDiv = document.createElement("div");
                        let img = document.createElement("img")
                        img.src = dialogueObject.character.portrait;
                        dialoguePortraitDiv.classList.add("dialoguePortrait");
                        dialoguePortraitDiv.appendChild(img);          
                      return(dialoguePortraitDiv);
                    } else {
                      let div =  document.createElement("div");
                      div.classList.add("dialoguePortrait");
                      return(div)
                    }
                },
                // MULTIPURPOSE: INSERT TEXT
                insertText: function() {
                  let dialogueText = document.createElement("div");
                  dialogueText.classList.add("dialogueText");
                  dialogueText.classList.add(dialogueObject.character.name+'Text');
                  dialogueText.id = dialogueObject.id+'line'+dialogueObject.line;
                  return(dialogueText);
                },
                // MULTIPURPOSE: PRESENT TEXT
                presentText: function(element) {
                  switch(dialogueObject.textPresentation) {
                    case "instant":
                      element.innerHTML = dialogueObject.lineArray[dialogueObject.line];
                    break;
                    case "typed":
                      printSentence(element.id,dialogueObject.lineArray[dialogueObject.line],dialogueObject.typeSpeed);
                    break;
                  }
                },
                
                //MAKING DIALOGUE DIV (3)
                makeDialogue: function () {
                  //make the dialogue box
                  let dialogueBox = document.createElement("div");
                  dialogueBox.classList.add("dialogueBox");
                  //give it left/right class depending on portrait position
                  dialogueBox.classList.add(dialogueObject.character.position);
                  
                  //insert portrait if applicable
                  let portrait = this.insertPortrait(dialogueBox);
                  dialogueBox.appendChild(portrait);
                  
                  //insert text
                  let text = this.insertText();
                  dialogueBox.appendChild(text);
                  return dialogueBox;
                },
    
                //PLACING DIALOGUE DIV (2)
                placeDialogue: function(element) {
                  let dialogueBox = makeDialogue.makeDialogue();
                  switch(dialogueObject.format) {
                    case "nodiv": //do nothing if told
                    break;
                    case "sequential": //stack dialogue
                      element.appendChild(dialogueBox);
                      this.presentText(dialogueBox.querySelector(".dialogueText"))
                      
                    break;
                    case "single": //display one line at a time
                      element.firstChild.replaceWith(dialogueBox);
                      this.presentText(element.querySelector(".dialogueText"))
                    break;
                  }
                  
                }
              }
              
              makeDialogue.placeDialogue(dialogueElement);
              //now that we are done, increment the dialogue line & set our lastCharacter
              dialogueObject.lastCharacter = dialogueObject.character;
              console.log('incrementing line (end)');
              dialogueObject.line++;          
          } else {
            //if we have hit the end of the list, remove clickable
            dialogueElement.classList.remove("clickable");
          }
         
        }  
      }
    
  }
// ===ADD LISTENERS===
//add listeners for dialogue triggers
mysDL.addListeners();


/*$.get("parsetest.txt", function(data){
    console.log(data)
    console.log(mysDL.parse(data))
});*/