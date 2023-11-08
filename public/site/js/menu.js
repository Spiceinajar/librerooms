async function closeMenu() {
  async function fadeout() {
    var m = document.getElementById('menu');
    var i = 10;
    var iterator = setInterval(function(){ 
        if (i < 0)
        {
            clearInterval(iterator);
            document.getElementById("menu").remove();
        }
        i--;
        m.style.opacity = i/10;
    }, 10);
  }

  if (Settings.fancyGFX) {
    await fadeout();
  } else {
    document.getElementById("menu").remove();
  }
}

async function openMenu(m_id, args={}) {
  if (document.getElementById("menu")) {
    document.getElementById("menu").remove();
    switched = true;
  } else {
    switched = false;
  }

  document.body.insertAdjacentHTML("beforeend", `
  
  <div id="menu" style="position:fixed; z-index: 2; width:100%; height:100%; top:0; left:0; right:0; background-color: rgba(0, 0, 0, 0.5); opacity:0;">
    <div id="center_div" class="center_div" style="max-width:100%; max-height:100%;">
      <div id="menu-bg" style="width:850px; height:500px;">
        <div style='width=100%; text-align: right; margin-bottom:-20px'>
          <button id="xbtn" title="Close" style="width:25px; height:25px; background-color: red; border-radius:5">X</button>
        </div>
      </div>
    </div>
  </div>
  
  `);

  if (Settings.fancyGFX) {
    document.getElementById('menu-bg').style['box-shadow'] = '0px 0px 10px black';
  }

  function updLayout() {
    if (mobileLayout) {
      document.getElementById("menu-bg").style.width = 'calc(100% - 20px)';
      document.getElementById("menu-bg").style.height = 'calc(100% - 20px)';
    } else {
      document.getElementById("menu-bg").style.width = '850px';
      document.getElementById("menu-bg").style.height = '500px';
    }

    let xbtn = document.getElementById("xbtn");
    let bg = document.getElementById("center_div");

    xbtn.style.bottom = `calc(50% - ${bg.clientHeight/2}px)`;
    xbtn.style.right = `calc(50% + (${bg.clientWidth/2}px - ${xbtn.clientHeight}px))`;
  }

  window.addEventListener("resize", updLayout);
  updLayout()

  document.getElementById("xbtn").onclick = closeMenu;

  if (m_id === 'profile') {
    document.getElementById("menu-bg").insertAdjacentHTML('beforeend', `
    <div id="profile_bg" style="width: 100%; height: 100%;">

      <div style="height:50px;"></div>

      <button id="pfp-button" for="fileInput" style="height:100px; aspect-ratio:1/1; background-color:rgba(0, 0, 0, 0); padding-top:0;">
        <img class="profilepic" id="profile-avatar-display" style="height:100%; width:calc(100% + 12px); padding:0;" alt="user-profile-image">
      </button>
      <br>
      <h1 style="font-size: 30px" id="profile-username-display">Loading...</h1>

      <textarea id="profile-desc" class="userdescription" readonly>Loading...</textarea>

      <h1 id="profile-joindate" style="font-size: 15px; font-weight: 200">Joined __/__/__</h1>
    </div>
    `);

    let roles = await getRoles(args.user);
    let joinDate = await DB({'type':'getjoindate', 'targuser':args.user});

    let userDisplay = args.user;
    for (var r in roles) {
      let role = roles[r];
      userDisplay += `<img src="../site/assets/icons/roles/${role}.svg" alt="roleicon" onclick="openMenu('badgeinfo', {badgename:'${role}'})" title="${role}" style="padding-left: 1vh; height:100%;">`;
    }

    document.getElementById('profile-avatar-display').src = await getAvatar(args.user);
    document.getElementById('profile-desc').textContent = (await DB({'type':'getdesc', 'targuser':args.user})).contents;
    document.getElementById('profile-username-display').innerHTML = userDisplay;
    document.getElementById('profile-joindate').textContent = `Joined ${joinDate.res.day}/${joinDate.res.month+1}/${joinDate.res.year}`;

    if (args.user === username) {
      let userDesc = document.getElementById('profile-desc');
      document.getElementById('pfp-button').onclick = function() {openMenu('avatar-editor')};
      userDesc.readOnly = false;

      userDesc.addEventListener("blur", async function() {
        await DB({'type':'changebio', 'contents':userDesc.value, 'user':username, 'pass':userkey});
        addNotif('Revision saved.');
      });
    }
  }

  if (m_id === 'settings') {
    document.getElementById("menu-bg").insertAdjacentHTML('beforeend', `
    <h1 class='settings-header'>Settings</h1>
    <hr class="softhr">

    <div style="overflow-y:scroll; height:calc(100% - 140px)">
      <h1 class="settings-section-header">Account</h1>
      
      <button id="logbtn" class="bar-btn">Log Out</button>
      <br>
      <button id="delbtn" class="bar-btn" style="background-color: rgb(255, 100, 100)">Delete Account</button>
      <br>
      <button id="erbtn" class="bar-btn" style="background-color: rgb(255, 100, 100)">Erase All Messages</button>

      <h1 style="font-size:10px;">Version: 1.1.9 [Public Release]</h1>
    </div>
    `);

    document.getElementById('delbtn').onclick = function () {authMenu(
      "This will permanently delete your account and its associated data. To confirm, please enter your password below:", 
      async function(enteredkey){

        let result = await DB({'type':'delaccount', 'user':username, 'pass':enteredkey});
        if (result === true) {
          location.href = './login.html';
        } else {
          if (result === "noauth") {
            addNotif("Password is incorrect")
          } else {
            addNotif("Operation failed")
          }
        }
      
      })}

    document.getElementById('erbtn').onclick = function () {authMenu(
      "This will permanently delete all of your messages. To confirm, please enter your password below:", 
      async function(enteredkey){
        let result = await DB({'type':'delmsg', 'user':username, 'pass':enteredkey});
        if (result === true) {
          addNotif("Messages erased")
        } else {
          if (result === "noauth") {
            addNotif("Password is incorrect")
          } else {
            addNotif("Operation failed")
          }
        }
      
      })}

      document.getElementById('logbtn').onclick = function () {location.href = '../login';}
  }

  if (m_id === "room-browser") {
    let result = await DB({'type':'findrooms', 'user':username});
    let rooms = result['list'].sort((a, b) => a.membercount - b.membercount).reverse();

    document.getElementById("menu-bg").insertAdjacentHTML('beforeend', `
    <h1 style="font-size:20px; display: inline; vertical-align: top;">Room Browser</h1>

    <textarea name="" id="room_search" style="width: 100px; height:30px; padding:0; display: inline; vertical-align: top; border-radius: 5px; border-top-right-radius:0; border-bottom-right-radius:0; margin-right: -5px; background-color: rgb(40, 40, 40); margin-left: 20px"></textarea>
    <button id="room-search-button" style="height:30px; width:30px; border-radius: 5px; border-top-left-radius:0; border-bottom-left-radius:0; background-color: rgb(100, 100, 215);">🔎︎</button>

    <hr class="softhr">

    <div id="rcontainer" style="display:flex; justify-content: center; width:100%; height:calc(100% - 70px); align-items: flex-start; flex-wrap: wrap; overflow-y: auto; overflow-x: hidden;">
    </div>
    `
    );

    function populateMenu(filter) {
      document.getElementById("rcontainer").innerHTML = `
        <button onclick='openMenu("room-creator");' class="roombrowser-card">
        <img src="../site/assets/icons/create_room_banner.svg" style="width:100%; border-radius:inherit; margin-top:5px;">

        <div class="center-div" style="width:100%;">
        
        <h1 style="font-size: 25px; display: inline-block;">Create Room</h1>

        <h1 style="font-weight: 100;">Make a room of your very own!</h1>
        </div>
        </button>
      `;

      for (var r in rooms) {
        let room = rooms[r];

        if (! room.public) {
          if (filter.publicOnly) {
            continue
          }
        }

        if (! room.name.toLowerCase().includes(filter.contains)) {
          continue
        }
  
        let rbadge;
  
        if (room.public === true) {
          rbadge = "globe";
        } else {
          rbadge = "lock";
        }
  
        document.getElementById("rcontainer").insertAdjacentHTML('beforeend', `
        <button onclick='joinRoom("${room.name}", ${room.public});' class="roombrowser-card">
        <img src="${room.banner}" style="width:100%; border-radius:inherit; margin-top:5px; aspect-ratio:1200/640">
        <img style="height:30px; position:absolute; top:10px; left:10px" src="../site/assets/icons/${rbadge}.svg" title="${rbadge}">

        <span style="font-size: 20px; font-weight: 100; position:absolute; top:10px; right:10px; background-color: rgba(0, 0, 0, .5); border-radius:5px; padding:5px"><img style="height:20px;" src="../site/assets/icons/members.svg" title="Member Count"> ${room.membercount}/${room.maxmembers}</span>
  
        <div class="center-div" style="width:100%;">
        
        <div style="width:100%">
          <h1 style="font-size: 25px; display: inline;">${room.name}</h1>
        </div>
  
        <h1 style="font-weight: 100;">${room.description}</h1>
        </div>
        </button>
        `);
      }
    }

    populateMenu({contains:"", publicOnly:false})

    document.getElementById('room-search-button').onclick = function() {
      let query = document.getElementById('room_search').value;
      //this.value = this.value.replace(/\n/g,'');

      populateMenu({contains:query.toLowerCase(), publicOnly:false})
    }
  }


  if (m_id === "room-creator") {
    document.getElementById("menu-bg").insertAdjacentHTML('beforeend', `
    <h1 style="font-size:40px">Create Room</h1>
    <hr style="width:70%;">

    <h1>Room name: </h1>
    <textarea name="" id="room_name_input" cols="30" rows="1" oninput="this.value = this.value.replace(/\n/g,'')" style="width: 350px;"></textarea>
    <h1>Room password: (leave blank if public)</h1>
    <textarea name="" id="room_pass_input" cols="30" rows="1" oninput="this.value = this.value.replace(/\n/g,'')" style="width: 350px;"></textarea>

    <h1 style="font-size:10px; color:rgb(100, 100, 100)">Other prefrences such as your room's banner image can be changed later in room settings.</h1>

    <br>
    <button id="crbtn" style="width: 350px; height: 60px; font-size: 30px; border-radius: 10px; margin-top:20px;">Create room</button>
    `);

    document.getElementById("crbtn").onclick = async function() {
      let res = await DB({'type':'cr_room', 'rname':document.getElementById("room_name_input").value, 'roomkey':document.getElementById("room_pass_input").value, 'user':username, 'pass':userkey});
      res = res.res;

      if (res === true) {
        addNotif("Room created");
        closeMenu();
        populateSidebar("r")
      } else if (res === "noauth") {
        addNotif("Authentication error");
      } else if (res === "exists") {
        addNotif("Room name is taken");
      } else if (res === "limit") {
        addNotif("You already have created the maximum number of rooms allowed");
      } else if (res === "forbiddenchars") {
        addNotif("Room name must only contain letters and numbers");
      } else if (res === "tooshort") {
        addNotif("Room name must be at least 4 characters long");
      } else if (res === "toolong") {
        addNotif("Room name cannot exceed 10 characters");
      }
    }
  }

  if (m_id === "notifications") {
    document.getElementById("menu-bg").insertAdjacentHTML('beforeend', `
    <h1>Notifications</h1>
    <div id="notif-board" style="width:100%; height:80%; position:relative; bottom:0; left:0; background-color:rgb(15, 15, 15); overflow-y:auto;">
    </div>
    `);

    let result = await DB({'type':'getnotifs', 'user':username, 'pass':userkey})
    result = result.list;

    for (var n in result) {
      let notif = result[n];

      document.getElementById("notif-board").insertAdjacentHTML('afterbegin', `
      <div>
      <h1 style="font-weight:100;">${notif}</h1>
      </div>
      <hr style="border-color: rgb(20, 20, 20); width:90%">
      `);
    }

    lastUnread = 0;
  }

  if (m_id === "badgeinfo") {
    let descriptions = {
      AlphaTester:`
      This badge was given to members who joined during LibreRooms' 
      alpha development stage. This badge is no longer obtainable.
      `,

      BetaTester:`
      This badge was given to members who joined during LibreRooms' 
      beta development stage. This badge is no longer obtainable.
      `,

      Founder:`
      This badge was given to the founder of LibreRooms.
      `,

      Administrator:`
      This badge is given to LibreRooms admins.
      `,

      Moderator:`
      This badge is given to LibreRooms moderators.
      `,

      Contributor:`
      This badge is given to Members who have directly contributed
      to LibreRooms.
      `,

      Developer:`
      This badge is given to Members who have directly and repeatedly
      contributed to LibreRooms' source code repeatedly.
      `,

      Donor:`
      This badge is given to Members who have financially supported
      LibreRooms.
      `,

      System:`
      This badge is given to automated LibreRooms accounts. This badge 
      is completely unobtainable.
      `,
    }

    document.getElementById("menu-bg").insertAdjacentHTML('beforeend', `
    <img src="../site/assets/icons/roles/${args.badgename}.svg" alt="roleicon" title="${args.badgename}" style="height:100px;">
    <h1>${args.badgename} Badge</h1>

    <span style="background-color: rgb(10, 10, 10); font-weight:100; color:white; border-radius:5px; margin:5px; width:300px; max-width:90%; display: inline-block; font-family: Standard; font-size: 22px">${descriptions[args.badgename]}</span>
    `);
  }

  if (m_id === "rconfig") {
    document.getElementById("menu-bg").insertAdjacentHTML('beforeend', `
    <h1 style="font-size:40px">Configure Room</h1>
    <hr style="width:70%;">

    <h1 style="font-size:20px; display: inline;">This feature is under development. Please get staff to help you instead.</h1>
    `);
  }

  if (m_id === "report") {
    document.getElementById("menu-bg").insertAdjacentHTML('beforeend', `
    <h1 style="font-size:30px">Report</h1>
    <hr style="width:70%;">

    <h1 style="font-weight:100">
    Use this menu to report bugs, report users, or send feedback. Please be as specific as possible. All reports are anonymous.
    </h1>

    <textarea name="" id="reportentry" cols="30" rows="1" oninput="this.value = this.value.replace(/\n/g,'')" style="width: 90%; height: 50%;"></textarea>

    <button id="sendreportbtn" style="width:200px; height:50px; background-color: rgb(100, 100, 215); margin:10px">Send</button>
    `);

    document.getElementById('sendreportbtn').onclick = function() {DB({'type':'submit-report', 'contents':document.getElementById('reportentry').value}); closeMenu(); addNotif('Thank you for your feedback')}
  }

  if (m_id === "buttonmenu") {
    document.getElementById("menu-bg").insertAdjacentHTML('beforeend', `
    <button onclick="openMenu('settings')" id="logbtn" class="bar-btn">Settings</button>
    <br>
    <button onclick="openMenu('report')" id="logbtn" class="bar-btn">Report</button>
    <br>
    <button onclick="openMenu('notifications')" id="logbtn" class="bar-btn">Notifications</button>
    <br>
    `);
  }

  if (m_id === "avatar-editor") {
    document.getElementById("menu-bg").insertAdjacentHTML('beforeend', `
      <h1 style="font-size:20px">Avatar Editor</h1>

      <img class="profilepic" id="avatar-editor-display" style="height:100px; width:100px" alt="user-profile-image">

      <div class="catalog-container">
        <div class="catalog-splitter">
          Skin tone
        </div>
        <span id="catalog-0" class="catalog-row">
        </span>

        <div class="catalog-splitter">
          Hair color
        </div>
        <span id="catalog-1" class="catalog-row">
        </span>

        <div class="catalog-splitter">
          Background
        </div>
        <span id="catalog-2" class="catalog-row">
        </span>

        <div class="catalog-splitter">
          Shirt
        </div>
        <span id="catalog-3" class="catalog-row">
        </span>

        <div class="catalog-splitter">
          Eyes
        </div>
        <span id="catalog-4" class="catalog-row">
        </span>

        <div class="catalog-splitter">
          Mouths
        </div>
        <span id="catalog-6" class="catalog-row">
        </span>

        <div class="catalog-splitter">
          Hair
        </div>
        <span id="catalog-5" class="catalog-row">
        </span>

        <div class="catalog-splitter">
          Facial Hair
        </div>
        <span id="catalog-8" class="catalog-row">
        </span>

        <div class="catalog-splitter">
          Accessories
        </div>
        <span id="catalog-7" class="catalog-row">
        </span>
      </div>
    `);

    let avObj = await getAvatar(username, false);

    async function updateDisplay() {
      document.getElementById("avatar-editor-display").src = await loadAvatar(avObj)
    }

    updateDisplay();

    let categories = ["skintones", "haircolors", "backgrounds", "shirts", "eyes", "hair", "mouths", "accessories", "facialhair"];
    for (c in categories) {
      let catId = c;
      let catName = categories[catId];

      if (['3', '4', '5', '7', '8'].includes(c)) { //makes hair, shirts and eyes removable (don't ask me why I'm making eyes removable) =============
        document.getElementById(`catalog-${c}`).insertAdjacentHTML('afterbegin', `
        <div class="catalog-item" id="catalog-selector" title="remove">
          <img class="catalog-item-img"  src="../site/assets/icons/remove.png" alt="remove">
        <div>
        `);

        document.getElementById(`catalog-selector`).onclick = function() {
          let category = this.id.split('-')[1];

          if (category === '7') {
            avObj[category] = [];
          } else {
            avObj[category] = null;
          }
          
          updateDisplay()
        }
  
        document.getElementById(`catalog-selector`).id = `remove-${catId}`;
      }

      //======================

      for (item in catalog[catName]) {
        if (catId > 1) {
          document.getElementById(`catalog-${catId}`).insertAdjacentHTML('beforeend', `
          <div class="catalog-item" id="catalog-selector" title="${catalog[catName][item]}">
            <img class="catalog-item-img"  src="../site/assets/avatar/${catName}/${catalog[catName][item]}.png" alt="item">
          <div>
          `);
        } else {
          document.getElementById(`catalog-${catId}`).insertAdjacentHTML('beforeend', `
          <div class="catalog-item" id="catalog-selector" width: 70px; height: 70px" title="color">
          <div>
          `);

          let col;
          if (catId === '1') {
            let st = catalog.haircolors[item];
            document.getElementById(`catalog-selector`).style.backgroundColor = 'red';
            document.getElementById(`catalog-selector`).style.filter = `hue-rotate(${st[0]}deg) saturate(${st[1]}%) brightness(${st[2]}%)`;
          } else {
            let st = catalog.skintones[item];
            col = `rgb(${st[0]}, ${st[1]}, ${st[2]})`;
            document.getElementById(`catalog-selector`).style.backgroundColor = col;
          }
        }
  
        document.getElementById(`catalog-selector`).onclick = function() {
          let category = this.id.split('-')[0];
          let itemid = this.id.split('-')[1];

          if (category === '7') {
            if (avObj[category].includes(itemid)) {
              avObj[category] = avObj[category].filter(item => item !== itemid);;
            } else {
              avObj[category].push(itemid);
            }
          } else {
            avObj[category] = itemid;
          }
          
          updateDisplay()
        }

        document.getElementById(`catalog-selector`).id = `${catId}-${item}`;
      }
    }

    document.getElementById('xbtn').onclick = async function() {
      await DB({'type':'updateavatar', 'obj':avObj, 'user':username, 'pass':userkey});
      //delete cachedAvs[username];
      addNotif("Avatar updated."); 
      closeMenu();
    }
  }

  var m = document.getElementById('menu');

  async function fadeIn() {
    var i = 0;
    var iterator = setInterval(function(){ 
        if (i > 10)
        {
            clearInterval(iterator);
        }
        i++;
        m.style.opacity = i/10;
    }, 10);
  }

  if (switched || (! Settings.fancyGFX)) {
    m.style.opacity = 1
  } else {
    await fadeIn()
  }

}

async function authMenu(query, ondone) {
  document.body.insertAdjacentHTML("beforeend", `
  
  <div id="authmenu" style="position:fixed; z-index: 2; width:100%; height:100%; top:0; left:0; right:0; left:0; background-color: rgba(0, 0, 0, 0.5);">
    <div class="center_div" style="max-width:100%; max-height:100%;">
      <div id="menu-bg" style="width: 400px">
        <h1 style="margin:2vh">${query}</h1>

        <textarea name="" id="entry" cols="30" rows="1" style="width: 90%; height: 3.5vh; border-radius: 1vh; font-size: 2.5vh; font-family: Block;"></textarea>
        
        <br>
        <button id="continuebtn" style="width:20%; height:4vh; background-color: rgb(100, 100, 215); border-radius: 5; margin:1vh">Continue</button>
        <button id="cancelbtn" style="width:20%; height:4vh; background-color: rgb(100, 100, 215); border-radius: 5; margin:1vh">Cancel</button>
      </div>
    </div>
  </div>
  
  `);

  document.getElementById('continuebtn').onclick = function() {
    ondone(document.getElementById('entry').value);
    document.getElementById('authmenu').remove();
    closeMenu();
  };

  document.getElementById('cancelbtn').onclick = function() {
    document.getElementById('authmenu').remove();
  };
}


async function Warn(header, content, closeterm="Ok", onclose=null) {
  document.body.insertAdjacentHTML("beforeend", `
  
  <div id="menu" style="position:fixed; z-index: 2; width:100%; height:100%; top:0; left:0; right:0; left:0; background-color: rgba(0, 0, 0, 0.5);">
    <div class="center_div" style="max-width:100%; max-height:100%;">
      <div id="menu-bg" style="width: 400px; padding:10px">
        <h1 style="font-size: 25px">${header}</h1>
        <hr class="softhr">

        <h1 style="font-weight: 100">${content}</h1>

        <button id="continuebtn" style="width:20%; height:4vh; background-color: rgb(100, 100, 215); border-radius: 5; margin:1vh">${closeterm}</button>
      </div>
    </div>
  </div>
  
  `);

  document.getElementById('continuebtn').onclick = function() {
    if (onclose) {
      onclose()
    }
    closeMenu();
  };
}




async function closeFriendMenu() {
  document.getElementById('addbtn').textContent = '+ Add friend';
  document.getElementById('addbtn').onclick = addFriendMenu;
  document.getElementById('room-display').style.height = 'calc(100% - 130px)';
  document.getElementById('addfrmenu').remove();
}

async function addFriendMenu() {
  document.getElementById('addbtn').textContent = 'Cancel';
  document.getElementById('addbtn').onclick = closeFriendMenu;
  document.getElementById('room-display').style.height = 'calc(100% - 240px)';
  document.getElementById('room-display').insertAdjacentHTML('afterend', `
  
  <div id="addfrmenu" style="height:100px; text-align:center;">
  <hr class="softhr">
  <h1 style="font-weight:100">Recipient username: (case sensitive)</h1>
  
  <span>
  <textarea name="" id="requser" cols="30" rows="1" oninput="this.value = this.value.replace(/\n/g,'')" style="width: 70%; height: 25px; border-radius: 1vh; font-size: 20px; vertical-align: top;"></textarea>
  <button id="reqbtn" style="width:20%; height:29px; background-color: rgb(100, 100, 215); border-radius: 5; vertical-align: top;">Send</button>
  </span>
  </div>
  
  `)

  document.getElementById('reqbtn').onclick = async function() {
    let res = await DB({'type':'friend-request', 'recipient':document.getElementById('requser').value, 'user':username, 'pass':userkey});
    res = res.res;

    if (res === true) {
      addNotif("Request sent");
      closeFriendMenu();
    } else {
      if (res === "nouser") {
        addNotif("That user does not exist")
      } else {
        if (res === "noauth") {
          addNotif("Authentication error")
        } else {
          if (res === "exists") {
            addNotif("You already have a pending request to this user")
          } else {
            if (res === "alreadyadded") {
              addNotif("You already have this user added as a friend")
            } else {
              if (res === "selfrequest") {
              addNotif("You cannot add yourself as a friend")
            }}
          }
        }
      }
    }
    
  };
}


function addNotif(ct) {
  document.body.insertAdjacentHTML("beforebegin", `
  
  <div id="notif" class="notif">
    <h1 style="margin-top:20px">${ct}</h1>
  </div>

  `)
  
  let notif_element = document.querySelector(".notif");
  
  notif_element.classList.add("notif_anim");
  notif_element.addEventListener("animationend", () => {
    document.getElementById("notif").remove("animate");
  });
}