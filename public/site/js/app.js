var username = '';
var userkey = '';
var personalpfp = '../site/assets/icons/missing.png'
var active_room = ''

const delay = ms => new Promise(res => setTimeout(res, ms));

try {
  let ss = JSON.parse(decrypt(sessionStorage.getItem('LRUserLogin')));
  username = ss['user']
  userkey = ss['key']
} catch {
  location.href = '../login';
}


(async () => {
  let consent = await DB({'type':'getconsent', 'user':username, 'pass':userkey});

  let pendingConsent = "";
  let docs = [
    {name:'Privacy Policy', link:'../policies/privacy.html'}, 
    {name:'Terms of Service', link:'../policies/terms.html'}, 
    {name:'Cookie Policy', link:'../policies/cookies.html'}
  ];

  for (i in consent.userConsent) {
    if (consent.userConsent[i] < consent.latest[i]) {
      pendingConsent += ` -  <a href="${docs[i].link}" target="_blank" rel="noopener noreferrer" class="claim-link">${docs[i].name}</a> <br>`;
    }
  }

  if (pendingConsent.length > 0) {
    Warn("Policy updates", `<strong>The following documents have been updated:</strong> <br><br> 

    ${pendingConsent} <br>

    <small>By clicking "Accept", you have read and accepted the changes made to the above documents.</small>
    `, "Accept", function() {DB({'type':'updateconsent', 'user':username, 'pass':userkey})})
  }
})();


let catalog = {
  "skintones":[
    [248, 232, 212],
    [241, 209, 181],
    [233, 185, 151],
    [223, 165, 122],
    [200, 137, 94],
    [176, 109, 66],
    [146, 81, 43],
    [120, 60, 28],
    [94, 41, 17],
    [150, 150, 150],
    [21, 255, 0],
  ],

  "haircolors":[
    [25, 100, 15],
    [70, 35, 300],
    [25, 80, 300],
    [0, 0, 300],
    [0, 0, 10],
    [10, 100, 25],
    [215, 100, 100],
    [115, 100, 100],
    [0, 100, 100],
    [30, 100, 100],
    [275, 100, 100],
    [295, 100, 100],
  ],

  "backgrounds":[
      "default",
      "void",
      "tunnel",
      "white stripes",
      "bricks 01",
      "bricks 02",
      "sun rays",
      "colors",
  ],

  "shirts":[
      "black suit",
      "white suit",
      "blue suit",
      "red suit",
      "purple suit",
      "black tee",
      "white tee",
      "yellow tee",
      "pink tee",
      "red tee",
      "magenta tee",
      "purple tee",
      "blue tee",
      "green tee",
      "space suit",
      "connor's jacket",
  ],

  "eyes":[
      "happy",
      "soulless",
      "closed",
      "eyebrows",
      "wide",
      "wide 2",
      "small",
      "vertical",
  ],

  "hair":[
      "buzz cut",
      "long",
      "short fluffy",
      "afro",
      "squared afro",
      "mohawk",
      "receding",
      "medium",
  ],

  "facialhair":[
      "short beard",
      "long beard",
      "mustache",
      "horseshoe mustache",
  ],

  "mouths":[
      "expressionless",
      "smile",
      "frown",
      "lips",
      "open smile",
      "open",
      "shock",
      "smirk",
      "toothy",
      "wide smile",
      "drool",
  ],

  "accessories":[
    "shades",
    "headphones",
    "headphones white",
    "ski goggles",
    "glasses 1",
    "glasses 2",
    "mask 1",
    "space helmet",
    "spice's monitor head",
    "beanie",
    "crown",
    "king's robe",
    "queen's robe",
    "earrings 1",
    "earrings 2",
    "black durag",
    "red durag",
    "blue durag",
    "black fedora",
    "red fedora",
    "green fedora",
    "blue fedora",
    "purple fedora",
    "connor's fedora",
    "robo's tophat",
    "aussie hat",
    "scout's cap",
    "red cap",
    "green cap",
    "blue cap",
    "purple cap",
    "white cap",
    "black cap",
    "ushanka",
],
}

let canvasID = 0;
async function loadAvatar(arr) {
  if (Settings.Accessibility['Load Avatars']) {
    try {
      // [skin color rgb [r, g, b], hair color hsv [h, s, v], background id, shirt id, eye id, hair id, mouth id]
  
      let id = `avatarassembler-${canvasID}`
      canvasID += 1;
      document.body.insertAdjacentHTML('beforebegin', `<canvas style="display: none;" width="16" height="16" id="${id}"></canvas>`)
  
      var assembler = document.getElementById(id);
      var ctx = assembler.getContext("2d", {alpha: false});
      ctx.filter = 'none';
  
      //assembler.style.backgroundColor = `rgb(${arr[0][0]}, ${arr[0][1]}, ${arr[0][2]})`;
  
      if (! (arr[0] === null)) {
        let st = catalog.skintones[arr[0]]
        ctx.fillStyle = `rgb(${st[0]}, ${st[1]}, ${st[2]})`;
        ctx.fillRect(0, 0, 16, 16);
      }
  
      function pasteImage(src, loc) {
        const img = new Image();
        const imgPromise = new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
  
        img.src = src;
  
        imgPromise.then(() => {
          ctx.drawImage(img, loc.x, loc.y)
        })
  
        return imgPromise;
      }
  
      await pasteImage(`../site/assets/avatar/backgrounds/${catalog.backgrounds[arr[2]]}.png`, {x:0, y:0})
  
      if (! (arr[3] === null)) {
        await pasteImage(`../site/assets/avatar/shirts/${catalog.shirts[arr[3]]}.png`, {x:0, y:12})
      }
  
      if (! (arr[4] === null)) {
        await pasteImage(`../site/assets/avatar/eyes/${catalog.eyes[arr[4]]}.png`, {x:3, y:6})
      }
  
      if (! (arr[5] === null)) {
        let st = catalog.haircolors[arr[1]]
        ctx.filter = `hue-rotate(${st[0]}deg) saturate(${st[1]}%) brightness(${st[2]}%)`;
        await pasteImage(`../site/assets/avatar/hair/${catalog.hair[arr[5]]}.png`, {x:0, y:0})
        ctx.filter = 'none';
      }
  
      if (! (arr[6] === null)) {
        await pasteImage(`../site/assets/avatar/mouths/${catalog.mouths[arr[6]]}.png`, {x:5, y:9})
      }
  
      if (! (arr[8] === null)) {
        let st = catalog.haircolors[arr[1]]
        ctx.filter = `hue-rotate(${st[0]}deg) saturate(${st[1]}%) brightness(${st[2]}%)`;
        await pasteImage(`../site/assets/avatar/facialhair/${catalog.facialhair[arr[8]]}.png`, {x:3, y:6})
        ctx.filter = 'none';
      }
  
      if (arr[7].length > 0) {
        for (a of arr[7]) {
          await pasteImage(`../site/assets/avatar/accessories/${catalog.accessories[a]}.png`, {x:0, y:0})
        }
      }
  
      let bs4 = assembler.toDataURL('image/png');
      assembler.parentNode.removeChild(assembler);
  
      return bs4;
    } catch(err) {
      console.log(err, arr)
      return "../site/assets/icons/missing.png"
    }
  } else {
    return "../site/assets/icons/missing.png"
  }
}

cachedAvs = {};
let avatarQueue = [];
async function getAvatar(us, preParse=true) {
  var pic;

  if (us in cachedAvs) {
    pic = cachedAvs[us];
  } else {
    let result = await DB({'type':'getavatar', 'targuser':us});

    pic = result['obj'];
    cachedAvs[us] = pic;
  }

  if (preParse) {
    return loadAvatar(pic);
  } else {
    return pic;
  }
}

userRoles = {};
async function getRoles(us) {
  var r;

  if (us in userRoles) {
    r = userRoles[us];
  } else {
    let result = await DB({'type':'getroles', 'targuser':us});

    r = result['list'];
    userRoles[us] = r;
  }

  return r;
}

(async () => {
  personalpfp = await getAvatar(username);
  document.getElementById('personal-pfp-display').src = personalpfp;
})();

document.getElementById('personal-username-display').textContent = '@' + username;
document.getElementById('personal-profile-btn').onclick = function () { openMenu('profile', {user:username});};


async function leaveroom() { 
  let status = await DB({'type':'leaveroom', 'room':active_room, 'user':username, 'pass':userkey});

  if (status === true) {
    addNotif(`Left "${active_room}"`)
    switch_room("Main room", "Main room", "r");
    populateSidebar("r");
  } else {
    if (status === "cannotleave") {
      addNotif("You cannot leave this room")
    }
    if (status === "NOAUTH") {
      addNotif("Authentication error")
    }
  }
};

async function unfriend() {
  let dm = active_room.split("/");
  let user;
  if (dm[0] === username) {
    user = dm[1]
  } else {
    user = dm[0]
  }

  let res = await DB({'type':'removefriend', 'targ':user, 'user':username, 'pass':userkey});

  if (res === "NOAUTH") {
    addNotif("Authentication error")
  } else if (res === true) {
    addNotif(`Unfriended @${user}`)
    switch_room("Main room", "Main room", "r")
    populateSidebar("r");
  }
}

if (Settings.Accessibility["Fancy Graphics"]) {
  document.body.insertAdjacentHTML('afterbegin', '<img id="loading-ind" style="position: absolute; bottom: 80px; left: 20px; height: 150px; max-width: 50%;" src="../site/assets/icons/loading.gif" alt="loading">')
} else {
  document.body.insertAdjacentHTML('afterbegin', '<h1 id="loading-ind" style="position: absolute; bottom: 80px; left: 20px; font-size: 30px;">Loading...</h1>')
}




let totalUnreads = 0;
let lastUnread = {notifications:0, rooms:{}}
async function updateUnreads() {
  let result = await DB({'type':'getunreads', 'user':username});

  totalUnreads = 0;

  if (lastUnread.notifications < result.notifications) {
    lastUnread.notifications = result.notifications;

    //pushNotif("You have new notifications");
    if (Settings.General['Notification Sounds']) {
      var audio = new Audio('../site/assets/audio/pop-notification.mp3');
      audio.play();
    }
  }

  if (result.notifications > 0) {
    totalUnreads += result.notifications;
    document.getElementById('mailbtn').src = '../site/assets/icons/letter-notif.svg'
  } else {
    document.getElementById('mailbtn').src = '../site/assets/icons/letter.svg'
  }

  for (i in result.rooms) {
    let watching = (active_room === i);

    if (! document.hasFocus()) {
      watching = false
    }

    if (! watching) {
      console.log(i)
      let button = document.getElementById("room-button-" + i);
  
      if (button) {
        document.getElementById("room-button-" + i).style.color = 'white';
      }
  
      if (i.includes('/')) { //since DMs are the only kind of room that have the slash symbol (formatted as user1/user2), this plays the pop sound IF the new unread message is from a DM
        if (! (i in lastUnread.rooms)) {
          lastUnread.rooms[i] = 0
        }
  
        if (lastUnread.rooms[i] < result.rooms[i]) {
          lastUnread.rooms[i] = result.rooms[i];
      
          //pushNotif("You have new notifications");
          if (Settings.General['Notification Sounds']) {
            var audio = new Audio('../site/assets/audio/pop-notification.mp3');
            audio.play();
          }
        }
  
        totalUnreads += result.rooms[i]
      }
    }
  }

  if (totalUnreads > 0) {
    document.title = `LibreRooms (${totalUnreads})`
  } else {
    document.title = "LibreRooms"
  }
}

setInterval(updateUnreads, 5000)

let latestRange = -50;
var lastauth = null;
var lastdt = null;

const board = document.getElementById("msgs");
var prevheight = board.scrollHeight;





async function messageContextMenu(e, id, sender) {
  let roles = await getRoles(username);
  let personallySent = (sender === username)

  e.preventDefault();
  document.getElementById('msgctxmenu').hidden = false;
  document.getElementById('msgctxmenu').style.top = mouse.y + 'px';
  document.getElementById('msgctxmenu').style.left = mouse.x + 'px';

  if (roles.includes('Administrator') || roles.includes('Moderator') || personallySent) {
    let delbtn = document.getElementById('msgdelbtn');

    delbtn.display = 'inline-block';
  
    delbtn.onclick = async function () {
      await DB({'type':'remove-message', 'user':username, 'pass':userkey, 'room':active_room, 'messId':id});
      document.getElementById(`msg-inner-${id}`).innerHTML = '[removed]';
    };
  } else {
    delbtn.display = 'none';
  }


  document.getElementById('msgrepbtn').onclick = async function () {
    await DB({'type':'submit-report', 
    'contents':`Report by: ${username}; 
    Reported message id: ${id}; 
    Room id: ${active_room}; 
    Message contents: ${document.getElementById(`msg-inner-${id}`).innerHTML}; 
    Message sender: @${sender};
    `}); 
    
    addNotif('Your feedback has been recorded')
  };


  document.getElementById('msgblockbtn').onclick = async function () {
    let res = await DB({'type':'blockusr', 'user':username, 'pass':userkey, 'targuser':sender}); 

    if (res === 'NOAUTH') {
      addNotif('Authentication failed')
    } else if (res === 'ALREADYBLOCKED') {
      addNotif('You have already blocked this user')
    } else if (res === 'SELFBLOCK') {
      addNotif('You cannot block yourself')
    } else if (res === true) {
      addNotif(`Blocked @${sender}`)
    }
  };

  document.getElementById('msgunblockbtn').onclick = async function () {
    let res = await DB({'type':'unblockusr', 'user':username, 'pass':userkey, 'targuser':sender}); 

    if (res === 'NOAUTH') {
      addNotif('Authentication failed')
    } else if (res === 'NOTBLOCKED') {
      addNotif('You have not blocked this user')
    } else if (res === true) {
      addNotif(`Unblocked @${sender}`)
    }
  };

  document.getElementById('msgcopybtn').onclick = async function () {
    navigator.clipboard.writeText(document.getElementById(`msg-inner-${id}`).innerHTML)
  };
}

document.addEventListener('click', function() {document.getElementById('msgctxmenu').hidden = true});
board.addEventListener('scroll', function() {document.getElementById('msgctxmenu').hidden = true});





async function updateMessageBoard() {
  if (document.hasFocus()) {
    let requestedRoom = active_room;
    let result = await DB({'type':'getmsg', 'room':active_room, 'user':username, 'pass':userkey, 'beg':latestRange, 'noprofanity':Settings.Safety["Profanity Filter"]});
    latestRange = result.range;

    let startingRange = result.startingRange;
    console.log(startingRange)

    let boardcontent = ``;
  
    if (document.getElementById('msgs').children.length < 1) {
      document.getElementById('loading-ind').style.display = 'inline';
    }
  
    if (requestedRoom === active_room) {  
      let messages = result.contents;
  
      var pfp;
      var roles;
      var userDisplay;
  
      for (var msg of messages) {
        let display = true;
        if ((! Settings.General["Removed Annotations"]) && ['[ deleted ]', '[ removed ]', '[ removed by moderator ]', '[ deleted ]', '[ blocked ]'].includes(msg.text)) {
          display = false
        }

        if (display) {
          pfp = await getAvatar(msg['user']);

          roles = await getRoles(msg['user']);
          datetime = formatTime(msg.dt);
    
          userDisplay = msg['user'];
          for (var r in roles) {
            let role = roles[r];
            userDisplay += `<img src="../site/assets/icons/roles/${role}.svg" onclick="openMenu('badgeinfo', {badgename:'${role}'})" alt="roleicon" title="${role}" style="padding-left: 5px; height:15px;">`;
          }
          
          if (datetime) {
            userDisplay += ` • ${datetime.time}`;
          }
  
          if (lastdt && msg.dt) {
            if (lastdt.day < msg.dt.day) {
              boardcontent += `
              <div style="padding-top:10px; padding-bottom:10px">
                <div style="width: calc(100% - 40px); margin-left: 20px; height: 9px; border-bottom: 1px solid rgb(100, 100, 100); text-align: center">
                  <h1 style="font-size: 14px; color: rgb(150, 150, 150); font-weight:100; background-color: rgb(20, 20, 20); padding: 0 10px; display:inline">
                    ${datetime.date}
                  </h1>
                </div>
              </div>
              `;
              lastauth = null;
            }
          }
    
          contents = msg['text'].replace(/<[^>]*>/g, '<script type="text/plain">' + "$&" + '</script>');
          
          if (Settings.Safety["Clickable links"]) {
            contents = contents.replace(/(\bhttps?:\/\/\S+)/gi, (match) => {
              if (Settings.Safety['Embed Files']) {
                var filetype = match.slice(match.lastIndexOf("."));
      
                filetype = filetype.split("?")[0];
        
                if (filetype === ".mp4") {
                  return `
                  <br>
        
                  <video class="msg-content" controls>
                    <source src="${match}" type="video/mp4">
                    [ Your browser does not support the video element. ]
                  </video>
        
                  `;
        
                } else if ([".mp3"].includes(filetype)) {
                  return `
                  <br>
                  <audio controls>
                    <source src="${match}" type="audio/mpeg">
                  [ Your browser does not support the audio element. ]
                  </audio>
                  `;
        
                } else if ([".png", ".jpg", ".webp", ".gif", "svg"].includes(filetype)) {
                  return `<br><img class="msg-content" src="${match}"></img>`;
        
                } else {
                  return `<a target="_blank" rel="noopener noreferrer" href="${match}">${match}</a>`;
                }
              } else {
                return `<a target="_blank" rel="noopener noreferrer" href="${match}">${match}</a>`;
              }
            });
          }
  
          contents = contents.replace(/\B@\w+\b/g, (match) => {
            return `<div onclick="openMenu('profile', {user:'${match.substring(1)}'})" class='mention' title="User Mention">${match}</div>`
          });
  
          //FORMATTING
          contents = contents.replace(/\*\*([^]*?)\*\*/g, (match) => {
            return `<b>${match.slice(2).slice(0, -2)}</b>`
          });
          contents = contents.replace(/__(.*?)__/g, (match) => {
            return `<u>${match.slice(2).slice(0, -2)}</u>`
          });
  
          contents = contents.replace(/\*([^]*?)\*/g, (match) => {
            return `<i>${match.slice(1).slice(0, -1)}</i>`
          });
          //=======
    
          if (msg['user'] === 'System') {
            boardcontent += `
            <div id="msg-inner-${startingRange}" class="message-container" style="background-color: rgba(100, 100, 215, 0.06); width:100%; text-align: center; color: white; font-family: Standard; padding: 5px;" oncontextmenu="messageContextMenu(event, ${startingRange}, '${msg.user}')">
              ${contents}
            </div>
            `;
          } else {
            if (msg['user'] === username) {
              if (msg['user'] === lastauth) {
                boardcontent += `
                <div class="message-container" oncontextmenu="messageContextMenu(event, ${startingRange}, '${msg.user}')">
                  <div class='chat_bubble message-right' style='border-top-right-radius: 0'>
                    <span id="msg-inner-${startingRange}" class='message-content'>${contents}</span>
                  </div>
                </div>
                `;
              } else {
                boardcontent += `
  
                <div class="message-container" oncontextmenu="messageContextMenu(event, ${startingRange}, '${msg.user}')">
                  <div class='chat_bubble message-right' style='border-bottom-right-radius: 0;'>
                    <span id="msg-inner-${startingRange}" class='message-content'>${contents}</span>
                  </div>
                </div>
          
                `;
              }
      
      
            } else {
              if (msg['user'] === lastauth) {
      
                boardcontent += `
      
                <div class="message-container" oncontextmenu="messageContextMenu(event, ${startingRange}, '${msg.user}')">
                  <div class='chat_bubble' style='border-top-left-radius: 0; margin-left: 69px; margin-top: -5px; margin-bottom: 10px;'>
                      <span id="msg-inner-${startingRange}" class='message-content''>${contents}</span>
                  </div>
                </div>
      
                `;
                
              } else {
                boardcontent += `
      
                <div style="margin-bottom: 5px;" class="message-container" oncontextmenu="messageContextMenu(event, ${startingRange}, '${msg.user}')">
                  <div style='display:inline-block; vertical-align: bottom;'>
                    <img src='${pfp}' title="Open Profile" class="profilepic" onclick="openMenu('profile', {user:'${msg.user}'})">
                  </div>
                  
                  <div style='display:inline-block; width:80%'>
                    <span class='message-user'>${userDisplay}</span>
                    <div class='chat_bubble' style='border-bottom-left-radius: 0; max-width:100%;'>
                      <span id="msg-inner-${startingRange}" class='message-content'>${contents}</span>
                    </div>
                  </div>
                </div>
      
                `;
              };
            }
          }

          lastauth = msg['user'];
          lastdt = msg.dt;
        }

        startingRange += 1
      }
  
      document.getElementById('msgs').insertAdjacentHTML('beforeend', boardcontent);
      
      if (board.scrollHeight !== prevheight) {
        board.scrollBy(0, board.scrollHeight + prevheight);
      }

      prevheight = board.scrollHeight;

      let addthing = false;
      while (board.childElementCount > 50) {
        board.removeChild(board.children[0]);
        addthing = true
      }

      if (addthing) {
        board.insertAdjacentHTML('afterbegin', `
        <div style="text-align:center; width:100%">
          <h1>No more messages here... (ノへ￣、)</h1>
        </div>
        `)
      }





    
      let emptyIndicatior = String.raw`
      <h1 id="empty-indicator" style="text-align: center;">
      Looks like there's nothing here. <br>
      ¯\_(ツ)_/¯
      </h1>
      `
  
      if (document.getElementById('msgs').innerHTML === '') {
        document.getElementById('msgs').innerHTML = emptyIndicatior;
      }
  
      if (!(messages.length === 0)) {
        if (document.getElementById('empty-indicator')) {
          document.getElementById('empty-indicator').remove();
        }
      }
  
      document.getElementById('loading-ind').style.display = 'none';

      //console.log(messages.length)
      //if (messages.length > 0) {
      //  let msgs = document.getElementById("msgs");
      //
      //  msgs.scrollTop = msgs.scrollHeight + 10;
      //}
    };
  }

  setTimeout(updateMessageBoard, 3000)
}


async function joinRoom(r, public) {
  async function attempt(key) {
    let status = await DB({'type':'joinroom', 'room':r, 'user':username, 'pass':userkey, 'roomkey':key});
    console.log(status)

    if (status === true) {
      switch_room(r, r, "r");
      populateSidebar("r");
      closeMenu();
      addNotif(`Joined "${r}"`);
    } else {
      if (status === "ALREADYIN") {
        addNotif("You have already joined this room")
      } else if (status === "NOAUTH") {
        addNotif("Authentication error")
      } else if (status === "FULL") {
        addNotif("This room is full")
      }
    }
  }

  if (public) {
    attempt("");
  } else {
    authMenu(`This is a private room and requires a key to enter.
              <br><br>
              Enter the room key:`, attempt);
  }
}

function switch_room(room, displayname, mode, created=false) {
  //let trig = document.getElementById(`room-button-${room}`);
  //
  //if (trig) {
  //  document.getElementById(`room-button-${room}`).style.backgroundColor = 'rgb(100, 0, 100)';
  //}

  let button = document.getElementById("room-button-" + room);
  if (button) {
    document.getElementById("room-button-" + room).style.color = 'grey';
  }

  if (active_room !== room) {
    document.getElementById('loading-ind').style.display = 'inline';
    active_room = room;
    document.getElementById('room_name_display').textContent = displayname;
    document.getElementById('msgs').innerHTML = ``;
    lastauth = null;
    lastdt = null;
    latestRange = -50;
  
    if (mode === "r") {
      if (created === true) {
        document.getElementById('leavebtn').onclick = function() {openMenu("rconfig")};
        document.getElementById('leavebtn').src = "../site/assets/icons/wrench.svg";
        document.getElementById('leavebtn').title = "Configure Room";
      } else {
        document.getElementById('leavebtn').onclick = leaveroom;
        document.getElementById('leavebtn').src = "../site/assets/icons/door.svg";
        document.getElementById('leavebtn').title = "Leave Room";
      }
    } else {
      document.getElementById('leavebtn').onclick = unfriend;
      document.getElementById('leavebtn').src = "../site/assets/icons/unfriend.svg";
      document.getElementById('leavebtn').title = "Remove Friend";
    }
  
    if (mobileLayout) {
      sidebarBool = false;
      toggleSidebar();
    }
  }
}

switch_room("Main room", "Main room", "r")

const respondRequest = async function(mode, recipient) {
  await DB({type:'respond-request', mode: mode, user:username, pass:userkey, recipient:recipient})
  await populateSidebar("f");
}

function messageInputUpdate(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (! e.shiftKey) {
      sendMessage()
    }
  }

  let element = document.getElementById('msgtxt');
  element.style.height = "1px";
  element.style.height = (element.scrollHeight)+"px";

  document.getElementById('msgs').style.maxHeight = `calc(100% - (60px + ${document.getElementById('bottom_bar').clientHeight}px))`;
  document.getElementById('msgs').style.bottom = document.getElementById('bottom_bar').clientHeight + 'px';
  document.getElementById('msgs').scrollTo(0, document.getElementById('msgs').scrollHeight);
}

//messageInputUpdate();
document.getElementById('msgtxt').addEventListener("keyup", messageInputUpdate);

async function populateSidebar(mode) {

  document.getElementById('room-display').innerHTML = ''

  if (mode === 'r') {
    document.getElementById('rbtn').disabled = true;

    let result = await DB({'type':'getrooms', 'user':username, 'pass':userkey});

    let rooms = result['list'];

    for (var room in rooms) {
      document.getElementById('room-display').innerHTML += `
      
      <div style='width:100%; height:60px; padding:5px;'>
        <button id="room-button-${rooms[room].name}" onclick='switch_room("${rooms[room].name}", "${rooms[room].name}", "r", ${rooms[room].created});' style='width:calc(100% - 10px); height:100%; font-size: 20px; color:grey;'>${rooms[room].name}</button>
      </div>
      
      `;

      document.getElementById('addbtn').textContent = '+ Add room';
      document.getElementById('addbtn').onclick = function() {openMenu("room-browser")};
      document.getElementById('rbtn').style.backgroundColor = 'rgb(40, 40, 40)';
      document.getElementById('fbtn').style.backgroundColor = 'rgb(30, 30, 30)';
    }

    document.getElementById('rbtn').disabled = false;
  } else {
    document.getElementById('fbtn').disabled = true;

    let result = await DB({'type':'getfriends', 'user':username, 'pass':userkey});

    document.getElementById('addbtn').textContent = '+ Add friend';
    document.getElementById('addbtn').onclick = function() {addFriendMenu()};
    document.getElementById('fbtn').style.backgroundColor = 'rgb(40, 40, 40)';
    document.getElementById('rbtn').style.backgroundColor = 'rgb(30, 30, 30)';

    let friends = result.friends;
    let requests = result.requests;

    for (var friend in friends) {
      c = [friends[friend], username].sort();
      c = `${c[0]}/${c[1]}`;

      document.getElementById('room-display').innerHTML += `
      
      <div style='width:100%; height:30px; padding:5px;'>
        <button id="room-button-${c}" onclick='switch_room("${c}", "@${friends[friend]}", "f");' style='width:calc(100% - 10px); height:100%; font-size: 20px; color:grey;'>@${friends[friend]}</button>
      </div>
      
      `;
    }

    if (friends.length === 0) {
      document.getElementById('room-display').innerHTML += `
      <h1 style='font-weight:100; text-align:center; position:relative; top:50%'>No friends here... ಥ_ಥ</h1>
      `;
    }

    if (requests.length > 0) {
      document.getElementById('room-display').innerHTML += `<h1 style="font-weight:100; text-align:center;">Pending requests:</h1>`;
    }

    for (var request in requests) {
      r = requests[request];

      document.getElementById('room-display').innerHTML += `
      
      <div style='width:calc(100% - 10px); height:30px; margin:5px; border-radius: 10px; background-color: rgb(30, 30, 30); text-align:center;'>

        <button onclick='respondRequest("accept", "${r}")' style='height:100%; display:inline-block; vertical-align: top;'>
        <img style="height:calc(100% - 6px); padding:3px" src="../site/assets/icons/check.svg">
        </button> 

        <h1 style="display:inline-block; height:100%; margin-top:2px; font-weight:100">
        @${r}
        </h1>

        <button onclick='respondRequest("deny", "${r}")' style='height:100%; display:inline-block; vertical-align: top;'>
        <img style="height:calc(100% - 6px); padding:3px" src="../site/assets/icons/x.svg">
        </button> 
        
      </div>
      
      `;
    }

    document.getElementById('fbtn').disabled = false;
  }
}

populateSidebar('r')
document.getElementById('rbtn').onclick = function () { populateSidebar('r'); closeFriendMenu()};
document.getElementById('fbtn').onclick = function () { populateSidebar('f'); closeFriendMenu()};

//setInterval(updateMessageBoard, 3000);
updateMessageBoard();


async function sendMessage() {
  let val = document.getElementById('msgtxt').value.replace(/\n/g,'');
  document.getElementById('msgtxt').value = '';
  if (val.length > 0) {
    let res = await DB({type:'addmsg', room:active_room, contents: val, user:username, pass:userkey})

    if (res === 'NOAUTH') {
      addNotif('Authentication error')
    }
    if (res === 'TOOLONG') {
      addNotif('Message exceeds 500 character limit')
    }
  }
}

var sidebarBool = true;
function toggleSidebar() {
  sidebarBool = (! sidebarBool);

  if (mobileLayout) {
    document.getElementById('sidebar').style.width = "100%";

    document.getElementById('sidebartoggler').style.display = "inline";
  } else {
    document.getElementById('sidebar').style.width = "25%";
    
    document.getElementById('sidebartoggler').style.display = "none";
  }

  if (sidebarBool) {
    
    document.getElementById('sidebar').style.visibility = 'hidden';

    document.getElementById('msgs').style.width = '100%';
    document.getElementById('header_bar').style.width = '100%'; 
    document.getElementById('bottom_bar').style.width = '100%';
  } else {

    document.getElementById('sidebar').style.visibility = 'visible';

    document.getElementById('msgs').style.width = '75%';
    document.getElementById('header_bar').style.width = '75%';
    document.getElementById('bottom_bar').style.width = '75%';
  }
}


async function reportWindowSize() {
  if (mobileLayout) {
    sidebarBool = false;

    document.getElementById('personal-username-display').style.display = "none";
    document.getElementById('personal-profile-btn').style.backgroundColor = "rgba(0, 0, 0, 0)";

    document.getElementById('buttonmenu-btn').style.display = 'inline';
    document.getElementById('settingsbtn').style.display = 'none';
    document.getElementById('reportbtn').style.display = 'none';
    document.getElementById('mailbtn').style.display = 'none';
  } else {
    sidebarBool = true;

    document.getElementById('personal-username-display').style.display = "inline-block";
    document.getElementById('personal-profile-btn').style.backgroundColor = "rgb(30, 30, 30)";

    document.getElementById('buttonmenu-btn').style.display = 'none';
    document.getElementById('settingsbtn').style.display = 'inline';
    document.getElementById('reportbtn').style.display = 'inline';
    document.getElementById('mailbtn').style.display = 'inline';
  }

  toggleSidebar()
}


reportWindowSize();
window.addEventListener("resize", reportWindowSize);


var mouse = {x:0, y:0};

document.onmousemove = function(e) {
  mouse.x = e.clientX;
  mouse.y = e.clientY
}



let msgtxt = document.getElementById('msgtxt');
msgtxt.oninput = function() {
  if (msgtxt.value.slice(-1) === "@") {
    mentionPopup()
  } else {
    document.getElementById('mention-popup').style.display = 'none';
  }
}