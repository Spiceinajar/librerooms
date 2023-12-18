var Settings;
var personalpfp = '../site/assets/icons/missing.png';
var active_room = '';

var username = '';

try {
  username = getSession().user;
  Settings = localStorage.getItem('LRSettings');

  if (['"NOAUTH"', '"DEFAULT"'].includes(Settings)) {
    Settings = {
      "Safety": {
        "Profanity Filter": false,
        "Embed Files": false,
        "Clickable links": true,
        "Room Banners": true,
      },

      "General": {
        "Notification Sounds": true,
        "Removed Annotations": false,
      },

      "Accessibility": {
        "Fancy Graphics": true,
        "Load Avatars": true,
      }
    }
  } else {
    Settings = JSON.parse(Settings);
  }
} catch {
  location.href = '../login';
}

//window.onbeforeunload = async function(){
//  await DB({type:'changestatus', value:'Offline'})
//};

const board = document.getElementById("msgs");
var prevheight = board.scrollHeight;

const sidebarLowerButton = document.getElementById('addbtn');

const delay = ms => new Promise(res => setTimeout(res, ms));

(async () => {
  let consent = await DB({ 'type': 'getconsent', 'user': username });

  let pendingConsent = "";
  let docs = [
    { name: 'Privacy Policy', link: '../policies/privacy.html' },
    { name: 'Terms of Service', link: '../policies/terms.html' }
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
    `, "Accept", function () { DB({ 'type': 'updateconsent', 'user': username }) })
  }
})();


let catalog = {
  "skintones": [
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
    [255, 20, 20],
  ],

  "haircolors": [
    [38, 16, 0],
    [240, 255, 166],
    [255, 136, 51],
    [255, 255, 255],
    [10, 10, 10],
    [64, 11, 0],
    [0, 106, 255],
    [21, 255, 0],
    [255, 50, 50],
    [255, 128, 0],
    [149, 0, 255],
    [234, 100, 255],
  ],

  "eyecolors": [
    [5, 5, 5],
    [42, 50, 192],
    [46, 19, 0],
    [42, 192, 50],
    [192, 42, 50],
    [192, 42, 192],
    [192, 42, 192],
    [50, 192, 192],
    [50, 192, 100],
  ],

  "backgrounds": [
    "default",
    "void",
    "tunnel",
    "white stripes",
    "bricks 01",
    "bricks 02",
    "sun rays",
    "colors",
    "white void",
    "snow",
    "fire",
  ],

  "shirts": [
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
    "black jacket",
    "white jacket",
    "red jacket",
    "green jacket",
    "blue jacket",
    "pink jacket",
    "yellow jacket",
    "tank top",
    "red dress",
    "blue dress",
    "black dress",
    "white dress",
    "strapless white dress",
    "strapless black dress",
    "fancy red robe",
    "fancy yellow robe",
  ],

  "eyes": [
    "happy",
    "soulless",
    "closed",
    "eyebrows",
    "wide",
    "wide 2",
    "small",
    "vertical",
  ],

  "hair": [
    "buzz cut",
    "long",
    "short fluffy",
    "afro",
    "squared afro",
    "mohawk",
    "receding",
    "medium",
    "bun",
    "pig tails",
    "side part",
    "draped long hair",
  ],

  "facialhair": [
    "short beard",
    "long beard",
    "mustache",
    "horseshoe mustache",
    "goatee",
    "thick goatee",
    "pointy mustache",
    "skinny long beard",
  ],

  "mouths": [
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

  "accessories": [
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
    "spooky pumpkin",
    "holiday hat",
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
    "pumpkin",
    "quan's bear hat",
    "backwards cap",
    "backwards red cap",
    "backwards blue cap",
    "hyper's hoodie",
  ],
}

let canvasID = 0;
async function loadAvatar(arr) {
  canvasID += 1;
  if (Settings.Accessibility['Load Avatars']) {
    try {
      // [skin color rgb [r, g, b], hair color hsv [h, s, v], background id, shirt id, eye id, hair id, mouth id]

      let id = `avatarassembler-${canvasID}`
      document.body.insertAdjacentHTML('beforebegin', `<canvas style="display: none;" width="16" height="16" id="${id}"></canvas>`)

      var assembler = document.getElementById(id);
      var ctx = assembler.getContext("2d", { alpha: false, willReadFrequently: true });

      function replaceColor(canvas, oldColor, newColor) {
        // Get the 2D rendering context
        var ctx = canvas.getContext("2d");

        // Get the image data of the canvas
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = imageData.data;

        // Loop through the pixel data
        for (var i = 0; i < data.length; i += 4) {
          // Check if the current pixel matches the oldColor
          if (data[i] === oldColor[0] && data[i + 1] === oldColor[1] && data[i + 2] === oldColor[2]) {
            // Replace the old color with the new color
            data[i] = newColor[0];
            data[i + 1] = newColor[1];
            data[i + 2] = newColor[2];
          }
        }

        // Put the modified image data back onto the canvas
        ctx.putImageData(imageData, 0, 0);
      }

      //assembler.style.backgroundColor = `rgb(${arr[0][0]}, ${arr[0][1]}, ${arr[0][2]})`;

      if (!(arr[0] === null)) {
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

      await pasteImage(`../site/assets/avatar/backgrounds/${catalog.backgrounds[arr[2]]}.png`, { x: 0, y: 0 })

      if (!(arr[3] === null)) {
        await pasteImage(`../site/assets/avatar/shirts/${catalog.shirts[arr[3]]}.png`, { x: 0, y: 12 })
      }

      if (!(arr[4] === null)) {
        await pasteImage(`../site/assets/avatar/eyes/${catalog.eyes[arr[4]]}.png`, { x: 3, y: 6 })
      }

      if (!(arr[5] === null)) {
        await pasteImage(`../site/assets/avatar/hair/${catalog.hair[arr[5]]}.png`, { x: 0, y: 0 })
      }

      if (!(arr[6] === null)) {
        await pasteImage(`../site/assets/avatar/mouths/${catalog.mouths[arr[6]]}.png`, { x: 5, y: 9 })
      }

      if (!(arr[8] === null)) {
        await pasteImage(`../site/assets/avatar/facialhair/${catalog.facialhair[arr[8]]}.png`, { x: 3, y: 6 })
      }

      if (arr[7].length > 0) {
        for (a of arr[7]) {
          await pasteImage(`../site/assets/avatar/accessories/${catalog.accessories[a]}.png`, { x: 0, y: 0 })
        }
      }

      let haircolor = catalog.haircolors[arr[1]];
      let eyecolor = catalog.eyecolors[arr[9]];

      replaceColor(assembler, [169, 89, 231], haircolor); //123, 12, 69 is the color of the hair in the source images, i just have to make sure none of the other items contain this color
      replaceColor(assembler, [46, 42, 39], eyecolor);

      let bs4 = assembler.toDataURL('image/png');
      assembler.parentNode.removeChild(assembler);

      return bs4;
    } catch (err) {
      console.log(err, arr)
      return "../site/assets/icons/missing.png"
    }
  } else {
    return "../site/assets/icons/missing.png"
  }
}

cachedAvs = {};
let avatarQueue = [];
async function getAvatar(us, preParse = true) {
  var pic;

  if (us in cachedAvs) {
    pic = cachedAvs[us];
  } else {
    let result = await DB({ 'type': 'getavatar', 'targuser': us });

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
    let result = await DB({ 'type': 'getroles', 'targuser': us });

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
document.getElementById('personal-profile-btn').onclick = function () { openMenu('profile', { user: username }); };


async function leaveroom() {
  let status = await DB({ 'type': 'leaveroom', 'room': active_room, 'user': username });

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

  let res = await DB({ 'type': 'removefriend', 'targ': user, 'user': username });

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
let lastUnread = { notifications: 0, rooms: {} }
async function updateUnreads() {
  let result = await DB({ 'type': 'getunreads', 'user': username });

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

    if (!document.hasFocus()) {
      watching = false
    }

    if (!watching) {
      let button = document.getElementById("room-button-" + i);

      if (button) {
        document.getElementById("unread-ind-" + i).style.backgroundColor = 'white';
      }

      if (i.includes('/')) { //since DMs are the only kind of room that have the slash symbol (formatted as user1/user2), this plays the pop sound IF the new unread message is from a DM
        if (!(i in lastUnread.rooms)) {
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

let latestMsgId = null;
var lastauth = null;
var lastdt = null;





async function messageContextMenu(e, id, sender) {
  let roles = await getRoles(username);
  let personallySent = (sender === username)

  let ctxmenu = document.getElementById('msgctxmenu');

  e.preventDefault();
  ctxmenu.hidden = false;

  ctxmenu.style.top = mouse.y + 'px';
  ctxmenu.style.left = mouse.x + 'px';


  if (ctxmenu.getBoundingClientRect().bottom > window.innerHeight) {
    ctxmenu.style.top = (mouse.y - 150) + 'px';
  }

  if (ctxmenu.getBoundingClientRect().right > board.clientWidth) {
    ctxmenu.style.left = (mouse.x - 100) + 'px';
  }

  let delbtn = document.getElementById('msgdelbtn');
  if (roles.includes('Administrator') || roles.includes('Moderator') || personallySent) {
    delbtn.display = 'inline-block';

    delbtn.onclick = async function () {
      await DB({ 'type': 'remove-message', 'user': username, 'room': active_room, 'messId': id });
      document.getElementById(`msg-inner-${id}`).innerHTML = '[removed]';
    };
  } else {
    delbtn.display = 'none';
  }


  document.getElementById('msgrepbtn').onclick = async function () {
    await DB({
      'type': 'submit-report',
      'contents': `Report by: ${username}; 
    Reported message id: ${id}; 
    Room id: ${active_room}; 
    Message contents: ${document.getElementById(`msg-inner-${id}`).innerHTML}; 
    Message sender: @${sender};
    `});

    addNotif('Your feedback has been recorded')
  };


  document.getElementById('msgblockbtn').onclick = async function () {
    let res = await DB({ 'type': 'blockusr', 'user': username, 'targuser': sender });

    if (res === 'NOAUTH') {
      addNotif('Authentication failed')
    } else if (res === 'ALREADYBLOCKED') {
      addNotif('You have already blocked this user')
    } else if (res === 'SELFBLOCK') {
      addNotif('You cannot block yourself')
    } else if (res === 'STAFFBLOCK') {
      addNotif('You cannot block a staff member')
    } else if (res === true) {
      addNotif(`Blocked @${sender}`)
    }
  };

  document.getElementById('msgunblockbtn').onclick = async function () {
    let res = await DB({ 'type': 'unblockusr', 'user': username, 'targuser': sender });

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

document.addEventListener('click', function () { document.getElementById('msgctxmenu').hidden = true });
board.addEventListener('scroll', function () { document.getElementById('msgctxmenu').hidden = true });





async function updateMessageBoard() {
  if (document.hasFocus()) {
    let requestedRoom = active_room;

    let result = await DB({ 'type': 'getmsg', 'room': active_room, 'user': username, 'latestID': latestMsgId, 'noprofanity': Settings.Safety["Profanity Filter"] });
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
        if ((!Settings.General["Removed Annotations"]) && ['[ deleted ]', '[ removed ]', '[ removed by moderator ]', '[ deleted ]', '[ blocked ]'].includes(msg.text)) {
          display = false
        }

        msgId = msg.id;

        if (display) {
          pfp = await getAvatar(msg.user);

          roles = await getRoles(msg.user);
          datetime = formatTime(msg.dt);

          userDisplay = msg.user;
          for (var r in roles) {
            let role = roles[r];
            userDisplay += `<img src="../site/assets/icons/roles/${role}.svg" alt="roleicon" title="${role}" style="padding-left: 5px; height:15px;">`;
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

          contents = msg.text.replace(/</g, '').replace(/>/g, '');

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

          let emojiIndex = [
            'smile',
            'frown',
            'blank',
            'unamused',
            'mad',
            'angry',
          ]

          let emojiFormatted = "";
          for (c of contents.split(":")) {
            if (emojiIndex.includes(c)) {
              emojiFormatted += `<img class="emoji" src="../site/assets/emoticons/${c}.svg">`
            } else {
              emojiFormatted += c
            }
          }
          contents = emojiFormatted

          if (msg['user'] === 'System') {
            boardcontent += `
            <div id="msg-inner-${msgId}" class="message-container" style="background-color: rgba(100, 100, 215, 0.06); width:100%; text-align: center; color: white; font-family: Standard; padding: 5px;" oncontextmenu="messageContextMenu(event, ${msgId}, '${msg.user}')">
              ${contents}
            </div>
            `;
          } else {
            if (msg['user'] === username) {
              if (msg['user'] === lastauth) {
                boardcontent += `
                <div class="message-container" oncontextmenu="messageContextMenu(event, ${msgId}, '${msg.user}')">
                  <div class='chat_bubble message-right highlighted' style='border-top-right-radius: 0'>
                    <span id="msg-inner-${msgId}" class='message-content'>${contents}</span>
                  </div>
                </div>
                `;
              } else {
                boardcontent += `
  
                <div class="message-container" oncontextmenu="messageContextMenu(event, ${msgId}, '${msg.user}')">
                  <div class='chat_bubble message-right highlighted' style='border-bottom-right-radius: 0;'>
                    <span id="msg-inner-${msgId}" class='message-content'>${contents}</span>
                  </div>
                </div>
          
                `;
              }


            } else {
              if (msg['user'] === lastauth) {

                boardcontent += `
      
                <div class="message-container" oncontextmenu="messageContextMenu(event, ${msgId}, '${msg.user}')">
                  <div class='chat_bubble highlighted' style='border-top-left-radius: 0; margin-left: 69px; margin-top: -5px; margin-bottom: 10px;'>
                      <span id="msg-inner-${msgId}" class='message-content''>${contents}</span>
                  </div>
                </div>
      
                `;

              } else {
                boardcontent += `
      
                <div style="margin-bottom: 5px;" class="message-container" oncontextmenu="messageContextMenu(event, ${msgId}, '${msg.user}')">
                  <div style='display:inline-block; vertical-align: bottom;'>
                    <img src='${pfp}' title="Open Profile" class="profilepic" onclick="openMenu('profile', {user:'${msg.user}'})">
                  </div>
                  
                  <div style='display:inline-block; width:80%'>
                    <span class='message-user'>${userDisplay}</span>
                    <div class='chat_bubble highlighted' style='border-bottom-left-radius: 0; max-width:100%;'>
                      <span id="msg-inner-${msgId}" class='message-content'>${contents}</span>
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

        latestMsgId = msgId;
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
          <h1>The above messages have been hidden for device performance.</h1>
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
    let status = await DB({ 'type': 'joinroom', 'room': r, 'user': username, 'roomkey': key });

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

function switch_room(room, displayname, mode, created = false) {
  //let trig = document.getElementById(`room-button-${room}`);
  //
  //if (trig) {
  //  document.getElementById(`room-button-${room}`).style.backgroundColor = 'rgb(100, 0, 100)';
  //}

  let button = document.getElementById("room-button-" + room);
  if (button) {
    document.getElementById("unread-ind-" + room).style.backgroundColor = 'transparent';
  }

  if (active_room !== room) {
    document.getElementById('loading-ind').style.display = 'inline';
    active_room = room;
    document.getElementById('room_name_display').textContent = displayname;
    document.getElementById('msgs').innerHTML = ``;
    lastauth = null;
    lastdt = null;
    latestMsgId = null;

    if (mode === "r") {
      if (created === true) {
        document.getElementById('leavebtn').onclick = function () { openMenu("rconfig") };
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

const respondRequest = async function (mode, recipient) {
  await DB({ type: 'respond-request', mode: mode, recipient: recipient })
  await populateSidebar("f");
}

function messageInputUpdate(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (!e.shiftKey) {
      sendMessage()
    }
  }

  let element = document.getElementById('msgtxt');
  element.style.height = "1px";
  element.style.height = (element.scrollHeight) + "px";

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

    let result = await DB({ 'type': 'getrooms', 'user': username });

    let rooms = result['list'];

    for (var room in rooms) {
      document.getElementById('room-display').innerHTML += `
      <button id="room-button-${rooms[room].name}" onclick='switch_room("${rooms[room].name}", "${rooms[room].name}", "r", ${rooms[room].created});' class="room-button"><span class="unread-ind" id="unread-ind-${rooms[room].name}"></span>${rooms[room].name}</button>
      `;

      sidebarLowerButton.textContent = '+ Add room';
      sidebarLowerButton.onclick = function () { openMenu("room-browser") };
      document.getElementById('rbtn').style.backgroundColor = 'rgb(50, 50, 50)';
      document.getElementById('fbtn').style.backgroundColor = 'rgb(40, 40, 40)';
    }

    document.getElementById('rbtn').disabled = false;
  } else if (mode === 'f') {
    document.getElementById('fbtn').disabled = true;

    let result = await DB({ 'type': 'getfriends', 'user': username });

    sidebarLowerButton.textContent = '+ Add friend';
    sidebarLowerButton.onclick = function () { addFriendMenu() };
    document.getElementById('fbtn').style.backgroundColor = 'rgb(50, 50, 50)';
    document.getElementById('rbtn').style.backgroundColor = 'rgb(40, 40, 40)';

    let friends = result.friends;
    let requests = result.requests;

    for (var friend in friends) {
      c = [friends[friend], username].sort();
      c = `${c[0]}/${c[1]}`;

      document.getElementById('room-display').innerHTML += `
      <button id="room-button-${c}" onclick='switch_room("${c}", "@${friends[friend]}", "f");' class="room-button" style="height:30px"><span class="unread-ind" id="unread-ind-${c}"></span>@${friends[friend]}</button>
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
document.getElementById('rbtn').onclick = function () { populateSidebar('r'); closeFriendMenu() };
document.getElementById('fbtn').onclick = function () { populateSidebar('f'); closeFriendMenu() };

//setInterval(updateMessageBoard, 3000);
updateMessageBoard();


async function sendMessage() {
  let val = document.getElementById('msgtxt').value.replace(/\n/g, '');
  document.getElementById('msgtxt').value = '';
  if (val.length > 0) {
    let res = await DB({ type: 'addmsg', room: active_room, contents: val, user: username })

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
  sidebarBool = (!sidebarBool);

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
  sidebarBool = (!sidebarBool);

  if (mobileLayout) {
    document.getElementById('personal-username-display').style.display = "none";

    document.getElementById('buttonmenu-btn').style.display = 'inline';
    document.getElementById('settingsbtn').style.display = 'none';
    document.getElementById('reportbtn').style.display = 'none';
    document.getElementById('mailbtn').style.display = 'none';
  } else {
    document.getElementById('personal-username-display').style.display = "inline-block";

    document.getElementById('buttonmenu-btn').style.display = 'none';
    document.getElementById('settingsbtn').style.display = 'inline';
    document.getElementById('reportbtn').style.display = 'inline';
    document.getElementById('mailbtn').style.display = 'inline';
  }

  toggleSidebar()
}

sidebarBool = false;
reportWindowSize();
window.addEventListener("resize", reportWindowSize);


var mouse = { x: 0, y: 0 };

document.onmousemove = function (e) {
  mouse.x = e.clientX;
  mouse.y = e.clientY
}



let msgtxt = document.getElementById('msgtxt');
msgtxt.oninput = function () {
  if (msgtxt.value.slice(-1) === "@") {
    mentionPopup()
  } else {
    document.getElementById('mention-popup').style.display = 'none';
  }
}