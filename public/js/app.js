var username = '';
var userkey = '';
var personalpfp = './assets/icons/missing.png'
var active_room = ''

const delay = ms => new Promise(res => setTimeout(res, ms));

try {
  let ss = JSON.parse(decrypt(sessionStorage.getItem('pearlUserLogin')));
  username = ss['user']
  userkey = ss['key']
} catch {
  location.href = './login.html';
}



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
  ],

  "haircolors":[
    [25, 100, 15],
    [70, 35, 300],
    [0, 0, 300],
    [0, 0, 10],
  ],

  "backgrounds":[
      "default",
      "void",
      "tunnel",
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
  ],

  "eyes":[
      "happy",
      "soulless",
      "closed",
      "eyebrows",
      "wide",
      "wide 2",
      "small",
      "shades",
  ],

  "hair":[
      "buzz cut",
      "long",
      "short fluffy",
      "afro",
      "squared afro",
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
  ],
}

async function loadAvatar(arr) {

  // [skin color rgb [r, g, b], hair color hsv [h, s, v], background id, shirt id, eye id, hair id, mouth id]

  var assembler = document.getElementById('avatarassembler');
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

  await pasteImage(`./assets/avatar/backgrounds/${catalog.backgrounds[arr[2]]}.png`, {x:0, y:0})

  if (! (arr[3] === null)) {
    await pasteImage(`./assets/avatar/shirts/${catalog.shirts[arr[3]]}.png`, {x:0, y:12})
  }

  if (! (arr[4] === null)) {
    await pasteImage(`./assets/avatar/eyes/${catalog.eyes[arr[4]]}.png`, {x:3, y:6})
  }

  if (! (arr[5] === null)) {
    let st = catalog.haircolors[arr[1]]
    ctx.filter = `hue-rotate(${st[0]}deg) saturate(${st[1]}%) brightness(${st[2]}%)`;
    await pasteImage(`./assets/avatar/hair/${catalog.hair[arr[5]]}.png`, {x:0, y:0})
    ctx.filter = 'none';
  }

  if (! (arr[6] === null)) {
    await pasteImage(`./assets/avatar/mouths/${catalog.mouths[arr[6]]}.png`, {x:5, y:9})
      //html += `\n<img src="./assets/avatar/mouths/${catalog.mouths[arr[6]]}.png" id="mouth" class="avatar-layer avatar-mouth">`
  }

  return assembler.toDataURL('image/png');
}

cachedAvs = {};
async function getAvatar(us) {
  var pic;

  if (us in cachedAvs) {
    pic = cachedAvs[us];
  } else {
    let result = await DB({'type':'getavatar', 'targuser':us});

    pic = result['obj'];
    cachedAvs[us] = pic;
  }

  return pic;
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
  await loadAvatar(await getAvatar(username)); //I'm doing this twice because for some reason the system doesnt function correctly the first time, I have no idea why
  personalpfp = await loadAvatar(await getAvatar(username));
  document.getElementById('personal-pfp-display').src = personalpfp;
})();

document.getElementById('personal-username-display').textContent = '@' + username;
document.getElementById('personal-profile-btn').onclick = function () { openMenu('profile', {user:username}); };


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
    if (status === "noauth") {
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

  if (res === "noauth") {
    addNotif("Authentication error")
  } else if (res === true) {
    addNotif(`Unfriended @${user}`)
    switch_room("Main room", "Main room", "r")
    populateSidebar("r");
  }
}

if (Settings.fancyGFX) {
  document.body.insertAdjacentHTML('afterbegin', '<img id="loading-ind" style="position: absolute; bottom: 80px; left: 20px; z-index: 5; height: 150px; max-width: 50%;" src="./assets/icons/loading.gif" alt="loading">')
} else {
  document.body.insertAdjacentHTML('afterbegin', '<h1 id="loading-ind" style="position: absolute; bottom: 80px; left: 20px; z-index: 5; font-size: 30px;">Loading...</h1>')
}

let latestRange = -50;
var lastauth = null;
var lastdt = null;
let lastUnread = 0;
async function updateMessageBoard() {
  if (document.hasFocus()) {
    let requestedRoom = active_room;
    let result = await DB({'type':'getmsg', 'room':active_room, 'user':username, 'pass':userkey, 'beg':latestRange});
    latestRange = result.range;

    //notif
    if (lastUnread < result.unread) {
      lastUnread = result.unread;

      var audio = new Audio('assets/audio/pop-notification.mp3');
      audio.play();
    }

    if (result.unread > 0) {
      document.getElementById('mailbtn').src = 'assets/icons/letter-notif.svg'
    } else {
      document.getElementById('mailbtn').src = 'assets/icons/letter.svg'
    }
    //notif

    let boardcontent = ``;
  
    if (document.getElementById('msgs').children.length < 1) {
      document.getElementById('loading-ind').style.display = 'inline';
    }
  
    if (requestedRoom === active_room) {  
      let messages = result['contents'];
  
      var pfp;
      var roles;
      var userDisplay;
  
      for (var msg of messages) {
        pfp = await getAvatar(msg['user']);
        pfp = await loadAvatar(pfp);

        roles = await getRoles(msg['user']);
        datetime = formatTime(msg.dt);

        let div = document.getElementById("msgs")
        while (div.childElementCount > 50) {
          let firstElement = div.firstChild;
          div.removeChild(firstElement);
        }
  
        userDisplay = msg['user'];
        for (var r in roles) {
          let role = roles[r];
          userDisplay += `<img src="./assets/icons/roles/${role}.svg" alt="roleicon" title="${role}" style="padding-left: 5px; height:15px;">`;
        }
        
        if (datetime) {
          userDisplay += ` • ${datetime.time}`;
        }

        if (lastdt && msg.dt) {
          if (lastdt.day < msg.dt.day) {
            boardcontent += `
            <div style="padding-top:10px; padding-bottom:10px">
              <div style="width: 100%; height: 9px; border-bottom: 1px solid white; text-align: center">
                <h1 style="font-size: 14px; background-color: rgb(20, 20, 20); padding: 0 10px; display:inline">
                  ${datetime.date}
                </h1>
              </div>
            </div>
            `
          }
        }
  
        contents = msg['text'].replace(/<[^>]*>/g, '<script type="text/plain">' + "$&" + '</script>');
  
        contents = contents.replace(/(\bhttps?:\/\/\S+)/gi, (match) => {
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
  
          } else if ([".png", ".jpg", ".webp", ".gif"].includes(filetype)) {
            return `<br><img class="msg-content" src="${match}"></img>`;
  
          } else if (match.startsWith('https://www.youtube.com/watch?v')) {
            return `<br><iframe class="msg-content" width="560" height="315" src="https://www.youtube.com/embed/${match.split("watch?v=")[1]}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`
          
          } else {
            return `<a target="_blank" rel="noopener noreferrer" href="${match}">${match}</a>`;
          }
        });

        contents = contents.replace(/\B@\w+\b/g, (match) => {
          return `<div onclick="openMenu('profile', {user:'${match.substring(1)}'})" class='mention'>${match}</div>`
        });
  
        if (msg['user'] === 'System') {
          boardcontent += `
          <div style="background-color: rgba(100, 100, 215, 0.06); width:100%; text-align: center; color: white; font-family: Standard; padding: 5px;">
            ${contents}
          </div>
          `;
        } else {
          if (msg['user'] === username) {
            if (msg['user'] === lastauth) {
              boardcontent += `
              <div>
                <div class='chat_bubble message-right' style='border-top-right-radius: 0'>
                  <span class='message-content'>${contents}</span>
                </div>
              </div>
              `;
            } else {
              boardcontent += `
        
              <div class='chat_bubble message-right' style='border-bottom-right-radius: 0;'>
                <span class='message-content'>${contents}</span>
              </div>
        
              `;
            }
    
    
          } else {
            if (msg['user'] === lastauth) {
    
              boardcontent += `
    
              <div>
                <div class='chat_bubble' style='border-top-left-radius: 0; margin-left: 69px;'>
                    <span class='message-content''>${contents}</span>
                </div>
              </div>
    
              `;
              
            } else {
              boardcontent += `
    
              <div>
                <div style='display:inline-block; vertical-align: bottom; margin-bottom:-10px'>
                  <img src='${pfp}' class="profilepic" onclick="openMenu('profile', {user:'${msg.user}'})">
                </div>
                
                <div style='display:inline-block; width:80%'>
                  <span class='message-user'>${userDisplay}</span>
                  <div class='chat_bubble' style='border-bottom-left-radius: 0; max-width:100%;'>
                    <span class='message-content'>${contents}</span>
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
  
      document.getElementById('msgs').insertAdjacentHTML('beforeend', boardcontent);
    
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
    };
  }

  setTimeout(updateMessageBoard, 3000)
}


const board = document.getElementById("msgs");


async function joinRoom(r, public) {
  async function attempt(key) {
    let status = await DB({'type':'joinroom', 'room':r, 'user':username, 'pass':userkey, 'roomkey':key});
    status = status.status;

    if (status === true) {
      switch_room(r, r, "r");
      populateSidebar("r");
      closeMenu();
      addNotif(`Joined "${r}"`);
    } else {
      if (status === "alreadyin") {
        addNotif("You have already joined this room")
      } else if (status === "noauth") {
        addNotif("Authentication error")
      } else if (status === "full") {
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
      document.getElementById('leavebtn').src = "assets/icons/wrench.svg";
    } else {
      document.getElementById('leavebtn').onclick = leaveroom;
      document.getElementById('leavebtn').src = "assets/icons/door.svg";
    }
  } else {
    document.getElementById('leavebtn').onclick = unfriend;
    document.getElementById('leavebtn').src = "assets/icons/unfriend.svg";
  }

  if (mobileLayout) {
    sidebarBool = false;
    toggleSidebar();
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
    let result = await DB({'type':'getrooms', 'user':username});

    let rooms = result['list'];

    for (var room in rooms) {
      document.getElementById('room-display').innerHTML += `
      
      <div style='width:100%; height:60px; padding:5px;'>
        <button id="room-button-${rooms[room].name}" onclick='switch_room("${rooms[room].name}", "${rooms[room].name}", "r", ${rooms[room].created});' style='width:calc(100% - 10px); height:100%; font-size: 20px;'>${rooms[room].name}</button>
      </div>
      
      `;

      document.getElementById('addbtn').textContent = '+ Add room';
      document.getElementById('addbtn').onclick = function() {openMenu("room-browser")};
      document.getElementById('rbtn').style.backgroundColor = 'rgb(40, 40, 40)';
      document.getElementById('fbtn').style.backgroundColor = 'rgb(30, 30, 30)';
    }
  } else {
    let result = await DB({'type':'getfriends', 'user':username});

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
        <button onclick='switch_room("${c}", "@${friends[friend]}", "f");' style='width:calc(100% - 10px); height:100%; font-size: 20px;'>@${friends[friend]}</button>
      </div>
      
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
        <img style="height:calc(100% - 6px); padding:3px" src="./assets/icons/check.svg">
        </button> 

        <h1 style="display:inline-block; height:100%; margin-top:2px; font-weight:100">
        @${r}
        </h1>

        <button onclick='respondRequest("deny", "${r}")' style='height:100%; display:inline-block; vertical-align: top;'>
        <img style="height:calc(100% - 6px); padding:3px" src="./assets/icons/x.svg">
        </button> 
        
      </div>
      
      `;
    }
  }
}

populateSidebar('r')
document.getElementById('rbtn').onclick = function () { populateSidebar('r'); closeFriendMenu()};
document.getElementById('fbtn').onclick = function () { populateSidebar('f'); closeFriendMenu()};

//setInterval(updateMessageBoard, 3000);
updateMessageBoard();


async function sendMessage() {
  let val = document.getElementById('msgtxt').value;
  document.getElementById('msgtxt').value = '';
  if (val.length > 1) {
    let res = await DB({type:'addmsg', room:active_room, contents: val, user:username, pass:userkey})
    res = res.res;

    if (res === 'noauth') {
      addNotif('Authentication error')
    }
    if (res === 'toolong') {
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




var element = document.getElementById("msgs");
var prevheight = element.scrollHeight;
async function updScroll() {
  if (element.scrollHeight !== prevheight) {
    board.scrollBy(0, element.scrollHeight + prevheight);
  }

  prevheight = element.scrollHeight;
}

setInterval(updScroll, 100);