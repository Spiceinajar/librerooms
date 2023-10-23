var username = '';
var userkey = '';
var personalpfp = './assets/icons/missing.svg'
var active_room = ''


try {
  let ss = JSON.parse(decrypt(sessionStorage.getItem('pearlUserLogin')));
  username = ss['user']
  userkey = ss['key']
} catch {
  location.href = './login.html';
}

cachedPfps = {};
async function getPFP(us) {
  var pic;

  if (us in cachedPfps) {
    pic = cachedPfps[us];
  } else {
    let result = await DB({'type':'getpfp', 'targuser':us});

    pic = result['url'];
    cachedPfps[us] = pic;
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
  personalpfp = await getPFP(username);
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

var lastauth = null;
var boardContentLength = -1;
async function updateMessageBoard() {
  let requestedRoom = active_room;
  let result = await DB({'type':'getmsg', 'room':active_room, 'user':username, 'pass':userkey, 'after':boardContentLength});

  if (document.getElementById('msgs').children.length < 1) {
    document.getElementById('loading-ind').style.display = 'inline';
  }

  if (requestedRoom === active_room) {  
    let messages = result['contents'];

    var pfp;
    var roles;
    var userDisplay;

    for (var msg of messages) {
      pfp = await getPFP(msg['user']);
      roles = await getRoles(msg['user']);
      datetime = formatTime(msg.dt);
      console.log(datetime);

      userDisplay = msg['user'];
      for (var r in roles) {
        let role = roles[r];
        userDisplay += `<img src="./assets/icons/roles/${role}.svg" alt="roleicon" title="${role}" style="padding-left: 5px; height:15px;">`;
      }

      //const now = new Date();
      
      if (datetime) {
        //let TZ_offset = now.getTimezoneOffset();

        //let hourOffset = TZ_offset/60;
        //let minOffset = TZ_offset % TZ_offset;

        userDisplay += ` • UTC ${datetime.hour}:${datetime.minute}${datetime.signature}`;
      }

      boardContentLength += 1;

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

      if (msg['user'] === username) {
        if (msg['user'] === lastauth) {
          document.getElementById('msgs').insertAdjacentHTML("beforeend", `
          <div>
            <div class='chat_bubble message-right' style='border-top-right-radius: 0'>
              <span class='message-content'>${contents}</span>
            </div>
          </div>
          `);
        } else {
          document.getElementById('msgs').insertAdjacentHTML("beforeend", `
    
          <div class='chat_bubble message-right' style='border-bottom-right-radius: 0;'>
            <span class='message-content'>${contents}</span>
          </div>
    
          `);
        }


      } else {
        if (msg['user'] === lastauth) {

          document.getElementById('msgs').insertAdjacentHTML("beforeend", `

          <div>
            <div class='chat_bubble' style='border-top-left-radius: 0; margin-left: 69px;'>
                <span class='message-content''>${contents}</span>
            </div>
          </div>

          `);
          
        } else {
          document.getElementById('msgs').insertAdjacentHTML("beforeend", `

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

          `);
        };
      }

      lastauth = msg['user'];
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

    console.log(messages)
    if (!(messages.length === 0)) {
      if (document.getElementById('empty-indicator')) {
        document.getElementById('empty-indicator').remove();
      }
    }

    document.getElementById('loading-ind').style.display = 'none';
  };
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
      } else if (status === "autherror") {
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
  boardContentLength = -1;
  lastauth = null;

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
}

switch_room("Main room", "Main room", "r")

const respondRequest = async function(mode, recipient) {
  let cumfart = await DB({type:'respond-request', mode: mode, user:username, pass:userkey, recipient:recipient})
  console.log(cumfart);
  await populateSidebar("f");
}

function messageInputUpdate(e) {
  let element = document.getElementById('msgtxt');
  element.style.height = "1px";
  element.style.height = (element.scrollHeight)+"px";

  if (e.key === 'Enter') {
    if (! e.shiftKey) {
      sendMessage()
    }
  }
}
document.getElementById('msgtxt').addEventListener("keydown", messageInputUpdate);

async function populateSidebar(mode) {

  document.getElementById('room-display').innerHTML = ''

  if (mode === 'r') {
    let result = await DB({'type':'getrooms', 'user':username});

    let rooms = result['list'];

    for (var room in rooms) {
      document.getElementById('room-display').innerHTML += `
      
      <div style='width:100%; height:60px; padding:5px;'>
        <button onclick='switch_room("${rooms[room].name}", "${rooms[room].name}", "r", ${rooms[room].created});' style='width:calc(100% - 10px); height:100%; font-size: 20px;'>${rooms[room].name}</button>
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

    console.log(requests);

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

setInterval(updateMessageBoard, 3000);


async function sendMessage() {
  if (! (document.getElementById('msgtxt').value === '')) {
    await DB({type:'addmsg', room:active_room, contents: document.getElementById('msgtxt').value, user:username, pass:userkey, dt:getTime()})
  }

  document.getElementById('msgtxt').value = '';
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

    document.getElementById('personal-pfp-display').style.borderRadius = "0";
    document.getElementById('personal-pfp-display').src = './assets/icons/profile.svg';
    document.getElementById('personal-username-display').style.display = "none";
    document.getElementById('personal-profile-btn').style.backgroundColor = "rgba(0, 0, 0, 0)";

    document.getElementById('buttonmenu-btn').style.display = 'inline';
    document.getElementById('settingsbtn').style.display = 'none';
    document.getElementById('reportbtn').style.display = 'none';
    document.getElementById('mailbtn').style.display = 'none';
  } else {
    sidebarBool = true;

    document.getElementById('personal-pfp-display').style.borderRadius = "50%";
    document.getElementById('personal-pfp-display').src = personalpfp;
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
  if (element.scrollHeight != prevheight) {
    board.scrollBy(0, element.scrollHeight + prevheight);
  }

  prevheight = element.scrollHeight;
}

setInterval(updScroll, 100);