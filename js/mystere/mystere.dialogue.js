//MYSTERE DIALOGUE SYSTEM (mys.DLG)
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
add support for NEXT layer picking instead of just the next available
name/title support
literally any kind of error handling
sound support
set this up to only re-parse if text file has changed
*/
mys.DLG = {
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
  //dialogueObjectState is tied to the tree hierarchy. properties at the root of dialogueObject are universal.
  dialogueObjectState: function(){
    this.textPresentation = "instant";  //instant, typed
    this.character = new mys.DLG.mystereCharacter(); //currently speaking character
    this.typeSpeed = 1;                 //typing speed for typing effects
  },
  dialogueObject: function(id,url,format = "sequential"){
    this.state = new mys.DLG.dialogueObjectState(); //properties we want to be attached to the tree
    this.stateStack = []; //state stack for passing properties around the tree
    this.lineIndexStack = [0]; //
    this.lineTreeStack = [];
    this.currentParent = null;
    this.currentLine = null;
    this.id = id;                       //id to match the element's
    this.url = url;                     //text file source url
    this.dialogueTree;                     //the text file, split into an array
    this.format = format;               //single-line, stacked, etc
    this.defaultItemType = 'dialogue';
    this.itemType = 'dialogue';           //different from format. can't think of a better name! dialogue,choice,skip
    this.isBusy = false;                //is it doing an animation (like typing)
    this.fastForward = false;              //are they trying to skip (ends animation)
    this.nextSound = null;              //generic sound. idk if they should layer
    this.lastCharacter = null;          //last character displayed
    this.showPortrait = true;
    this.choiceArray= [];
    this.choiceObjectStack = [];
    this.doUpChoice=[];
    this.stopGoingDeeper = false;
    this.ended = false; //are we done with the dialogue
  },
  //we keep all our dialogue elements in here
  dialogueObjectArray: [],
  //DESIGNATING A DIALOGUE ELEMENT & putting it in our array
  addDialogue: function(id,url,format) {
    id = new this.dialogueObject(id,url,format);
    this.dialogueObjectArray.push(id);
  },
  //we keep all our characters in here. ADDED TO VIA EXTERNAL FILES (mys.DLG.addCharacter())
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

    .dialogueElement.single .choiceBox {
      margin-top:-40%;
      grid-template-columns: 100%;
      grid-template-rows: auto auto;
      background-color:gray;
    }
    .choiceBox {
       display:grid;
       padding:5px;
    }
    .dialogueChoice:hover {
      text-decoration:underline;
    }
    choiceBox .clicked {
      text-decoration:underline;
    }
  `,
  
  
  // === WINDOW LOAD ==
  addListeners: function() {window.addEventListener("load", function(event) {
    mys.DLG.dialogueObjectArray.forEach((dialogueObject) => {
      let elementid = dialogueObject.id;
      let dialogueElement = document.querySelector('#'+elementid);
      
      //why is the browser suddenly refusing to update this??? what is different from the original implementation?????????????
      //split our text files
      $.get(dialogueObject.url, function(data){
          dialogueObject.dialogueTree = mys.DLG.parseSource(data);
          //set default parent
          dialogueObject.currentParent = dialogueObject.dialogueTree;
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
          mys.DLG.advanceLine(this);
      })
      
      //give it the dialogueElement & clickable classes
      dialogueElement.classList.add("dialogueElement");
      dialogueElement.classList.add("clickable");
      
    })
    //add the dialogueElement css to the stylesheet
    let dialogueStyleSheet = document.createElement("style");
    dialogueStyleSheet.textContent = mys.DLG.mystereDialogueStyles;
    document.head.appendChild(dialogueStyleSheet);
  })},
  
  // === PARSING DIALOGUE INTO OBJECT TREES ===
  //concept:
  //first, get our array. make it into a set of objects with depth & text properties. then sort into tree by depth.
  //as we do this, store modifiers in the properties of each line object. only apply them to children & subsequent entries on the same layer.
  parseSource: function(source){
    //i have not eaten since lunch
    let rawLines = source.split("\n").filter(line => !line.startsWith("//")); //filter out comment lines
  
    //count & remove leading tabs + spaces, organize into an object
    let prepLine = function(line){
      let countLeadingTabs = function(line) {
        const tabRegex = /^(\t|    )*/g;
        const match = line.match(tabRegex);
        return match ? match[0].length : 0;
      }


      let preppedLine = {
        depth: countLeadingTabs(line),
        text: line.replace(/^(\t|    )*/g, '').replace(/\r$/, ''), //remove returns and leading spaces/tabs
      }
      return preppedLine;
    }

    //where da magic happens. stack logic from stacked overflow so i am still wrapping my mind around it
    let makeTree = function(source){
        //make our root & our working stack
        const tree = {
          title: 'root',
          children: []
        };
        const stack = [[0, tree]]; // stack
        //for each line in the line array..
        for (let line of source){
          //assigning variables from prepLine object
          
          const [depth, text] = [prepLine(line).depth,prepLine(line).text];
          //folder at the top of our stack is the last examined.
          //if recent folders have higher or equal depth, then remove them until we hit
          //something with lower. that is our parent
          while (stack.length && stack[stack.length-1][0] >= depth){
            stack.pop();
          }
          //if the current stack is not empty, set parent to the next stack up. if it is, then parent is root
          parent = stack.length ? stack[stack.length-1][1] : tree;

          //make a new object with our properties & then children
          const obj = {text: text, depth: depth, children: []};
          //add our object to the parent stack's children array
          parent.children.push(obj);
          //put this object on top of the stack (marking it as last examined)
          stack.push([depth, obj]);
        }
        return tree;
      }

    return makeTree(rawLines);

  },

  // === LINE ADVANCE === 
  //called when line is advanced by any means
  advanceLine: function(dialogueElement) {
      let dialogueObject = this.dialogueObjectArray.find(({ id }) => id === dialogueElement.id);
      //dialogueElement is our DOM element. dialogueObject is our storage object. yippee!
      //if we are out of bounds, shut that shit DOWN
      if (dialogueObject.isBusy) {
        dialogueObject.fastForward = true;
      } else if (dialogueObject.ended == false /*&& dialogueObject.state.line <= Object.keys(dialogueObject.<CURRENTDEPTH>.children).length*/){


          // == TREE TRAVERSAL ==
          //This is kind of a mess i will clean it up "later"
          let treeTraverse = {
            goDown: function (){
                dialogueObject.lineTreeStack.push(dialogueObject.currentParent) //remembering the next lineindex for when we go back up  
                dialogueObject.currentParent = dialogueObject.currentLine;
                dialogueObject.lineIndexStack.push(0);
                dialogueObject.stateStack.push({...dialogueObject.state});
              
            },
            incrementSameLayer: function() {
              let index = dialogueObject.lineIndexStack.pop()
              dialogueObject.lineIndexStack.push(index + 1);
              dialogueObject.currentLine = dialogueObject.currentParent.children[index];
            }
          }
          //parseLine 
          let parseLine = function(line) {
            //[localvariable::value],[#flag::value],[^globalvariable::value]
            //{readvariable} (same shorthand applies)
            //!!dialogue engine command
            //= INSERT INLINE VARIABLES =
            let inline = line.substring(line.indexOf("{") + 1, line.indexOf("}"));
            let inlineParsed = mys.DLG.accessMysKey(inline,undefined,dialogueObject)
            dialogueObject.currentLine.text = line.replace("{"+inline+"}",inlineParsed)
            //= SET VARIABLES =
            if (line.startsWith("[")){
              let pairs =  line.slice(1,-1).split('||');
              for (const pair of pairs){
                let [key,value] = pair.split('::');
                mys.DLG.accessMysKey(key,value,dialogueObject)
              }
              //now skip
              dialogueObject.itemType = "skip"
              return;
            }
            //= SET CHARACTER = (can be done with variables, but i think ultra-shorthand is convenient)
            else if (line.startsWith("--")){
              mys.DLG.accessMysKey(line,undefined,dialogueObject)
              dialogueObject.itemType = "skip"
              return;
            }
            //= ENGINE COMMANDS =
            else if (line.startsWith("!!")){
              //similar deal... break up into an array by spaces
              slicedLineArray = line.slice(2).split(' ');
              console.log(slicedLineArray)

              let conditionalType;
              if(slicedLineArray[0]=="WHEN"||slicedLineArray[0]=="UNLESS") {
                conditionalType = slicedLineArray[0];
                slicedLineArray[0]="CONDITIONAL";
              }
              switch(slicedLineArray[0]) {
                case "CHOICE":
                  console.info("== ENTERING CHOICE MODE ==")
                  if (dialogueObject.itemType == "choice") {
                    console.error("double choice??!?! that can't be right!")
                  } else { 
                    dialogueObject.itemType = "choice"
                    dialogueObject.choiceObjectStack.push(dialogueObject.currentLine);
                    dialogueObject.choiceObjectStack.at(-1).index = dialogueObject.lineIndexStack.at(-1);
                    dialogueObject.choiceObjectStack.at(-1).state = dialogueObject.state;
                  }
                break;
                //conditionals. we want some kind of "check if applies" function, i think...
                //split by :: into key/value.
                //if no value, we are checking for boolean. if value, we are checking for value
                case "CONDITIONAL":
                  let [key, value] = slicedLineArray[1].split('::');
                  let showLine = false;
                  let result = mys.DLG.accessMysKey(key, undefined, dialogueObject);
                  if (value) {
                    if (conditionalType == "WHEN" && result == value) {showLine=true}
                    else if ( conditionalType == "UNLESS" && (result != value)) {showLine=true}
                  }

                  //assumes boolean if not specified. This is kind of dirty, what if we want to check if a variable is simply not undefined?
                  else {
                    if (conditionalType == "WHEN" && (result == true || result == "true")) {showLine=true}
                    else if (conditionalType == "UNLESS" && (result != true && result != "true")) {showLine=true}
                  }

                  if(showLine){
                    if(dialogueObject.itemType!="choice"){dialogueObject.itemType = "skip"}
                    else {}
                  } else if(!showLine) { //just for my own readability
                    if(dialogueObject.itemType!="choice"){dialogueObject.itemType = "skipobject"}
                    else {dialogueObject.currentLine.stopper = true} //tells makeChoiceArray to stop at this line
                  }
                break;
                case "NEXT":
                //do nothing, this is default behavior lol lmao
                  dialogueObject.itemType = "skip"
                break;
                case "UP":
                  dialogueObject.itemType = "skip"
                  if (slicedLineArray[1]) {
                    dialogueObject.doUpChoice[1] = slicedLineArray[1]
                  } else {
                    dialogueObject.doUpChoice[1] = -1;
                  }
                  dialogueObject.doUpChoice[2] = 0;
                break;
              }
            }
            //return text from current line
            //return(dialogueObject.currentLine.text)
          }


          // ===TEXT DISPLAY===
          //Different ways to display text after it is placed. 
                //text typing effect
                const printSentence = (id, sentence, speed) => {
                  let index = 0;
                  let scrollCounter = 0;
                  let element = document.getElementById(id);
                  if (!sentence.startsWith("<")){
                    sentence = "<span>" + sentence + "</span>"
                  }
                
                  let timer = setInterval(function() {
                      dialogueObject.isBusy = true;
                      const char = sentence[index];
                      
                      if (char === '<') {
                        index = sentence.indexOf('>', index);  // skip to greater-than
                      }
                      
                      //If fastForward is true, then skip to the end of the sentence
                      if (dialogueObject.fastForward == false) { 
                        element.innerHTML = sentence.slice(0, index);
                        } else { 
                        element.innerHTML = sentence.slice(0, sentence.length); 
                        index = sentence.length-1;
                        dialogueObject.fastForward = false;
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

                  
          // == ADDING DIALOGUE ==
          let makeDialogue = {
            // MULTIPURPOSE: INSERT PORTRAIT
            insertPortrait: function (element) {
            //if the portrait is not null
            //if the character is not different from before and showPortrait is true 
            //OR if it's in single mode... display the portrait
              if (((dialogueObject.state.character.portrait != null) && ((dialogueObject.showPortrait == true) && (dialogueObject.state.character != dialogueObject.lastCharacter))) || (dialogueObject.format == "single") || dialogueObject.forcePortrait) {
                    let dialoguePortraitDiv = document.createElement("div");
                    let img = document.createElement("img")
                    img.src = dialogueObject.state.character.portrait;
                    dialoguePortraitDiv.classList.add("dialoguePortrait");
                    dialoguePortraitDiv.appendChild(img); 
                    dialogueObject.forcePortrait = false;         
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
              dialogueText.classList.add(dialogueObject.state.character.name+'Text');
              dialogueText.id = dialogueObject.id+'line'+dialogueObject.lineIndexStack.at(-1)+'depth'+dialogueObject.currentLine.depth;
              return(dialogueText);
            },
            // MULTIPURPOSE: PRESENT TEXT
            presentText: function(element) {
              switch(dialogueObject.state.textPresentation) {
                case "instant":
                  element.innerHTML = dialogueObject.currentLine.text;
                break;
                case "typed":
                  printSentence(element.id,dialogueObject.currentLine.text,dialogueObject.state.typeSpeed);
                break;
              }
            },
            
            //MAKING DIALOGUE DIV (3)
            makeDialogue: function () {
              //make the dialogue box
              let dialogueBox = document.createElement("div");
              dialogueBox.classList.add("dialogueBox");
              //give it left/right class depending on portrait position
              dialogueBox.classList.add(dialogueObject.state.character.position);
              
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
                case "sequential": //stack dialogue
                  element.appendChild(dialogueBox);
                  this.presentText(dialogueBox.querySelector(".dialogueText"))
                  //this.presentText(dialogueBox.querySelector('#'+dialogueObject.id+'line'+dialogueObject.lineIndexStack.at(-1)))
                break;
                case "single": //display one line at a time
                  element.firstChild.replaceWith(dialogueBox);
                  this.presentText(element.querySelector(".dialogueText"))
                  //this.presentText(element.querySelector('#'+dialogueObject.id+'line'+dialogueObject.lineIndexStack.at(-1)))
                break;
              }
              
            }
          }

          // == ADDING A CHOICE BOX ==
          let makeChoice = {
            // INSERT CHOICE BUTTONS
            insertChoice: function(choice) {
              choiceText = choice.text.slice(0,-1)
              let dialogueChoice = document.createElement("div");
              dialogueChoice.classList.add("dialogueChoice");
              dialogueChoice.classList.add("clickable")
              dialogueChoice.id = dialogueObject.id+'choice'+choiceText;
              dialogueChoice.innerHTML = choiceText;

              //When clicked, a choice will push its line to the fore + remove eventlisteners/adjust classes on all dialogueChoices in the object, thus:
              // SELECT CHOICE
              dialogueChoice.addEventListener('click', function selectChoice(){ 
                  let goDown = function(){
                    dialogueObject.lineTreeStack.push(dialogueObject.currentParent) //remembering the next lineindex for when we go back up  
                    dialogueObject.currentParent = choice;
                    dialogueObject.lineIndexStack.push(0);
                    dialogueObject.stateStack.push({...dialogueObject.state});
                  }
                  goDown();
                  
                  this.classList.add("clicked")
                  allChoices = dialogueElement.querySelectorAll(".dialogueChoice")
                  for (let i = 0; i < allChoices.length; i++) {
                    console.log(allChoices[i])
                    allChoices[i].classList.remove("dialogueChoice")
                    allChoices[i].classList.remove("clickable")
                    allChoices[i].replaceWith(allChoices[i].cloneNode(true));
                  }
                  
                  dialogueObject.isBusy = false;
                  dialogueElement.classList.add("clickable")
                  if (dialogueObject.format == "single") {
                    dialogueElement.querySelector(".choiceBox").remove()
                  }
              })
              console.info("== EXITING CHOICE MODE ==")
              return(dialogueChoice);
            },
            // PLACE CHOICE BOX
            placeChoice: function(){
              //make flexbox and fill with choicearray contents
              //make the dialogue box
              let dialogueBox = document.createElement("div");
              dialogueBox.classList.add("dialogueBox");
              dialogueBox.classList.add("choiceBox");
              

              //insert text, clear choicearray
              for (let choice of dialogueObject.choiceArray){
                let choiceDiv = this.insertChoice(choice);
                dialogueBox.appendChild(choiceDiv);
              }
              dialogueObject.choiceArray = [];

              //APPEND BOX
              switch(dialogueObject.format) {
                case "sequential": //stack dialogue
                  dialogueElement.appendChild(dialogueBox);
                break;
                case "single": //display one line at a time
                  dialogueElement.appendChild(dialogueBox);
                break;
              }

              //Mark busy, remove clickable tag
              dialogueObject.isBusy = true;
              dialogueElement.classList.remove("clickable")
            },
            // MAKE CHOICE ARRAY (run through the whole tree)
            makeChoiceArray: function(){
              if (dialogueObject.currentLine.text.endsWith(":") || dialogueObject.currentLine.stopper == true){
                if(!dialogueObject.currentLine.stopper) {dialogueObject.choiceArray.push(dialogueObject.currentLine)} //for if it hit a conditional
                //console.log(dialogueObject.choiceArray)
                dialogueObject.stopGoingDeeper = true;
              } else {
                dialogueObject.stopGoingDeeper = false;
              }
            },
          }

          // == DO LINE (this is the set of events through which we display lines!!!)
          //called in the middle of readTree()
          let doLine = function(line){
            //parse the line, apply modifiers, etc
            parseLine(line);
            //place dialogue or place choices, with potential to add more modes in the future
            switch (dialogueObject.itemType) {
              case "dialogue":
                makeDialogue.placeDialogue(dialogueElement);
                dialogueObject.lastCharacter = dialogueObject.state.character;
                dialogueObject.stopGoingDeeper = false; 
                break;
              case "choice":
                makeChoice.makeChoiceArray()
                dialogueObject.doSkip = true;
                break;
              case "skip":
                dialogueObject.itemType = dialogueObject.defaultItemType;   //reset item type
                dialogueObject.doSkip = true;                      //move forward
                dialogueObject.stopGoingDeeper = false;
                break;
              case "skipstay":
                dialogueObject.itemType = dialogueObject.defaultItemType;   //reset item type
                dialogueObject.stopGoingDeeper = false;
                break;
              case "skipobject":
                dialogueObject.itemType = dialogueObject.defaultItemType;   //reset item type
                dialogueObject.doSkip = true;                      //move forward
                dialogueObject.stopGoingDeeper = true;
                break;
            }
            //dialogueObject.itemType = dialogueObject.defaultItemType;
          }

          // == READ TREE; START DISPLAY PROCESS ==
          let readTree = function(insertObject){ 
            //i hate it here. handheld through this by the wonderful ewoudje 
            let index = dialogueObject.lineIndexStack.pop() //grab line index from top of stack
            //console.log(index)
            let direction = "forward";
            function incrementNoPop(){
              dialogueObject.lineIndexStack.push(index + 1);
              //console.log('CURRENT PARENT (INCREMENTING)' )
              //console.log(dialogueObject.currentParent)
              dialogueObject.currentLine = dialogueObject.currentParent.children[index];

            }
            
            //if instructed, go up and find the first choice so we can repeat it
            function doUpChoice(){
                let depth = dialogueObject.doUpChoice[1];
                let next = dialogueObject.doUpChoice[2];
                //this could maybe go in treeTraverse object for organization
                let goUp = function() {
                  dialogueObject.lineIndexStack.pop()
                  dialogueObject.currentParent = dialogueObject.lineTreeStack.pop();
                  dialogueObject.state = dialogueObject.stateStack.pop();
                }
                let targetChoice = dialogueObject.choiceObjectStack.at(depth)
                if (depth == "ROOT"||depth=="root") {depth = -dialogueObject.choiceObjectStack.length;console.log(depth)}
                //keep popping until we hit the right depth
                while (dialogueObject.currentParent.depth != targetChoice.depth) {
                  //if current parent is choice and we are still not there, add to the counter..
                  if (dialogueObject.currentParent.text == "!!CHOICE") {          
                  }
                    console.log("PARENT / CHOICEOBJECT")
                    console.log(dialogueObject.currentParent)
                    console.log(targetChoice)
                    goUp()
                }
                console.log("at the right depth of "+dialogueObject.currentParent.depth+ "with goal of "+ targetChoice.depth)
                goUp()//pop again so we are on the right layer?
                //then set our properties
                console.log(dialogueObject.lineIndexStack)
                //for desired depth, pop choiceObjectStack
                for (i = 1; i<=(-depth); i++){
                  console.log(i)
                  dialogueObject.currentLine = dialogueObject.choiceObjectStack.pop()
                  console.log(dialogueObject.currentLine)
                }
                dialogueObject.lineIndexStack.push(dialogueObject.currentLine.index-1+next) //-1 because otherwise it will try to skip the choice. cancel out if set to skip/next
                dialogueObject.stateStack.push(dialogueObject.currentLine.state)
                console.info("CURRENTLINE / INDEX")
                console.log(dialogueObject.currentLine)
                console.log(dialogueObject.lineIndexStack.at(-1))

                dialogueObject.doUpChoice[1] = undefined;
            }

            //if we are at the end of the object, move to parent layer (default behavior)
            if (index >= dialogueObject.currentParent.children.length)  { 
              console.log('going up; end of object')
              if (dialogueObject.currentParent == dialogueObject.dialogueTree && index >= dialogueObject.dialogueTree.children.length){
                console.error('line index out of bounds, setting ended = true. this should have been marked properly in the script!')
                dialogueObject.ended = true;
              } else {            
                let log = function() {
                  console.info('=== CHOICEOBJECT / PARENT / DIR / STACK / CURRENT ===')
                  console.log(dialogueObject.choiceObjectStack.at(-1))
                  console.log(dialogueObject.currentParent)
                  console.log(direction)
                  console.log(dialogueObject.lineIndexStack)
                  console.log(dialogueObject.currentLine)
                } 
                //log();                   
                dialogueObject.currentParent = dialogueObject.lineTreeStack.pop();
                dialogueObject.state = dialogueObject.stateStack.pop();
                readTree()
                return;
              }
            }

            
            //increment our index (storing it on top of the stack), get our current line with it
              incrementNoPop();
              // = PARSE LINE, DO THE COOL STUFF!! =
              doLine(dialogueObject.currentLine.text)
              console.log(dialogueObject.currentLine)
              //if our current line has children, go down a layer
              if(!dialogueObject.stopGoingDeeper) {
                if (dialogueObject.currentLine.children !== undefined && dialogueObject.currentLine.children.length > 0) {
                  console.log('gone deeper :)')
                  treeTraverse.goDown();
                }
              }


            //if we hit the end of our choice object while gathering arrays..
            if (dialogueObject.itemType=="choice" && (dialogueObject.currentParent == dialogueObject.choiceObjectStack.at(-1)) && (dialogueObject.lineIndexStack.at(-1) >= dialogueObject.currentParent.children.length)){
              
              makeChoice.placeChoice();
              dialogueObject.forcePortrait = true;
              dialogueObject.itemType = dialogueObject.defaultItemType;
              dialogueObject.doSkip = false;
            }  //if we hit our root choice object while traveling upward..
            
            //if we are told to go UP, keep going until we hit our desired choice marker and rerun it
            if (dialogueObject.doUpChoice[1]) {
              console.info("LOOKING FOR CHOICE")  
              doUpChoice();
            }

            if (dialogueObject.doSkip) {
                dialogueObject.doSkip = false;
                readTree();
              }
          }


            
          readTree();
      }  
  },

  // === UTILITIES ===
  //returns a variable or function from an address given in a string, accounting for the .mys script notation
  //everything here is within the mys object
  accessMysKey: function(key, value, dialogueObject) {
    let parsedKey;
    let object;
    let functionArgs;
    //if this has a function argument in it, we will save that for later
    if(key.endsWith(")")) {
      functionArgs = key.substring(key.indexOf("(")+1, key.indexOf(")"));
      key = key.replace("("+functionArgs+")", "");
    }
    //FLAG (in save file)
    if (key.startsWith("#")) {
      parsedKey = key.slice(1)
      if(value){_.set(mysFLG,parsedKey,value)}else{object = _.get(mysFLG,parsedKey)}
    }
    //GLOBAL (whatever we want, anywhere in mys)
    else if (key.startsWith("^")) {
      if (key.startsWith("^mys.")){
        parsedKey = key.slice(5)
      } else {
        parsedKey = key.slice(1)
      }
      if(value){_.set(mys,parsedKey,value)}else{object = _.get(mys,parsedKey)}
    }
    //CHARACTER (search characterArray & get it from there)
    else if (key.startsWith("--")){
      let charName = key.slice(2);
      let char = mys.DLG.characterArray.find(({ name }) => name === charName);
      if (!char){console.error("'"+value + "' is an invalid character!");};
      value = char;
      if(value){
        if(dialogueObject){dialogueObject.state.character = char}
      }else{object = char}
    }
    //LOCAL (in the dialogueObject. do not check unless one has been passed in)
    else if (dialogueObject) {
      //STATE (get from state if it is a property stored in state)
      let inState = false;
      for (varmodKey of Object.keys(dialogueObject.state)) {
        if (varmodKey == key) {
          if(value){_.set(dialogueObject.state,key,value)} else {object =_.get(dialogueObject.state,key)}
          inState = true;
        }
      }
      //NOT IN STATE (it is in the root of dialogueObject)
      if (!inState) {
        if(value){_.set(dialogueObject,key,value)} else {object =_.get(dialogueObject,key)}
      }
    }
    if (object){
      //RUN FUNCTION IF IT IS AN OBJECT !!
      if (mys.UTL.isFunction(object)){
        parsedKey = 'mys.'+parsedKey;
        return mys.UTL.executeFunctionByName(parsedKey,window,functionArgs);
      }
      return object;
    }

  }
    
  }
// ===ADD LISTENERS===
//add listeners for dialogue triggers
mys.DLG.addListeners();

// ADD EMPTY CHARACTER (technical use)
mys.DLG.addCharacter({name:'dlg-null',
    portrait: mys.mystereFolder+"/assets/empty.png",
    position:'right',
    css:`
    {
      font-family: Times New Roman
    }
    `
    });

