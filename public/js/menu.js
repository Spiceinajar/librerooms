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
      <div id="menu-bg" style="border-radius: 10px; background-color: rgb(25, 25, 25); text-align: center; width:850px; height:500px; max-height: calc(100% - 20px); max-width: calc(100% - 20px);">
        <div style='width=100%; text-align: right; margin-bottom:-20px'>
          <button id="xbtn" style="width:25px; height:25px; background-color: red; border-radius:5">X</button>
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

    let roles = await getRoles(args.user);
    let joinDate = await DB({'type':'getjoindate', 'targuser':args.user});

    let userDisplay = args.user;
    for (var r in roles) {
      let role = roles[r];
      userDisplay += `<img src="./assets/icons/roles/${role}.svg" alt="roleicon" title="${role}" style="padding-left: 1vh; height:100%;">`;
    }

    document.getElementById("menu-bg").insertAdjacentHTML('beforeend', `
    <div id="profile_bg" style="width: 100%; height: 100%;">

      <div style="height:50px;"></div>

      <button id="pfp-button" for="fileInput" style="height:100px; aspect-ratio:1/1; background-color:rgba(0, 0, 0, 0); padding-top:0;">
        <img class="profilepic" style="height:100%; width:calc(100% + 12px); padding:0;" src="${await loadAvatar(await getAvatar(args.user))}" alt="user-profile-image">
      </button>
      <br>
      <h1 style="font-size: 30px" id="personal-username-display">${userDisplay}</h1>

      <textarea id="desc" class="userdescription" readonly>${(await DB({'type':'getdesc', 'targuser':args.user})).contents}</textarea>

      <h1 style="font-size: 15px; font-weight: 200">Joined ${joinDate.res.day}/${joinDate.res.month+1}/${joinDate.res.year}</h1>
    </div>
    `);

    if (args.user === username) {
      let userDesc = document.getElementById('desc');
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
    <hr style="width:70%;">

    <div style="overflow-y:scroll; height:calc(100% - 140px)">
      <h1 class="settings-section-header">Account</h1>
      
      <button id="logbtn" class="bar-btn">Log Out</button>
      <br>
      <button id="delbtn" class="bar-btn" style="background-color: rgb(255, 100, 100)">Delete Account</button>
      <br>
      <button id="erbtn" class="bar-btn" style="background-color: rgb(255, 100, 100)">Erase All Messages</button>

      <h1 style="font-size:10px;">Version: 1.1.8.9 [Beta]</h1>
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

      document.getElementById('logbtn').onclick = function () {location.href = './login.html';}
  }

  if (m_id === "room-browser") {
    let result = await DB({'type':'findrooms', 'user':username});
    let rooms = result['list'].sort((a, b) => a.membercount - b.membercount).reverse();

    document.getElementById("menu-bg").insertAdjacentHTML('beforeend', `
    <h1 style="font-size:20px">Room Browser</h1>
    <hr style="width:80%;">

    <div id="rcontainer" style="display:flex; justify-content: center; width:100%; height:calc(100% - 70px); align-items: flex-start; flex-wrap: wrap; overflow-y: auto; overflow-x: hidden;">
      <button onclick='openMenu("room-creator");' class="roombrowser-card">
      <img src="./assets/icons/create_room_banner.svg" style="width:100%; border-radius:inherit; margin-top:5px;">

      <div class="center-div" style="width:100%;">
      
      <h1 style="font-size: 25px; display: inline-block;">Create Room</h1>

      <h1 style="font-weight: 100;">Make a room of your very own!</h1>
      </div>
      </button>


    </div>
    `
    );

    for (var r in rooms) {
      let room = rooms[r];

      let rbadge;

      if (room.public === true) {
        rbadge = "globe";
      } else {
        rbadge = "lock";
      }

      document.getElementById("rcontainer").insertAdjacentHTML('beforeend', `
      <button onclick='joinRoom("${room.name}", ${room.public});' class="roombrowser-card">
      <img src="${room.banner}" style="width:100%; border-radius:inherit; margin-top:5px; aspect-ratio:1200/640">

      <div class="center-div" style="width:100%;">
      
      <div style="width:100%">
        <img style="height:30px; display: inline-block; float:left; padding-top:20px; padding-left:20px;" src="./assets/icons/${rbadge}.svg">
        <h1 style="font-size: 25px; display: inline-block;">${room.name}</h1>
        <h1 style="font-size: 20px; font-weight: 100; display: inline-block; float:right; padding-top:10px; padding-right:20px;"><img style="height:20px;" src="./assets/icons/members.svg"> ${room.membercount}/${room.maxmembers}</h1>
      </div>

      <h1 style="font-weight: 100;">${room.description}</h1>
      </div>
      </button>
      `);
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

    let result = await DB({'type':'getnotifs', 'user':username})
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

  if (m_id === "rconfig") {
    document.getElementById("menu-bg").insertAdjacentHTML('beforeend', `
    <h1 style="font-size:40px">Configure Room</h1>
    <hr style="width:70%;">

    <h1 style="font-size:2vh; display: inline;">This feature is under development. Please get staff to help you instead.</h1>
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

    document.getElementById('sendreportbtn').onclick = function() {DB({'type':'submit-report', 'contents':document.getElementById('sendreportbtn').value}); closeMenu(); addNotif('Thank you for your feedback')}
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
          Accessories
        </div>
        <span id="catalog-7" class="catalog-row">
        </span>

        <button id="save-avatar-btn" style="width:200px; height:50px; background-color: rgb(100, 100, 215); margin:10px">Save</button>
      </div>
    `);

    let avObj = await getAvatar(username);

    async function updateDisplay() {
      document.getElementById("avatar-editor-display").src = await loadAvatar(avObj)
    }

    updateDisplay();

    let categories = ["skintones", "haircolors", "backgrounds", "shirts", "eyes", "hair", "mouths", "accessories"];
    for (c in categories) {
      let catId = c;
      let catName = categories[catId];

      if (['3', '4', '5', '7'].includes(c)) { //makes hair, shirts and eyes removable (don't ask me why I'm making eyes removable) =============
        document.getElementById(`catalog-${c}`).insertAdjacentHTML('afterbegin', `
        <div class="catalog-item" id="catalog-selector">
          <img class="catalog-item-img"  src="./assets/icons/remove.png" alt="remove">
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
          <div class="catalog-item" id="catalog-selector">
            <img class="catalog-item-img"  src="./assets/avatar/${catName}/${catalog[catName][item]}.png" alt="item">
          <div>
          `);
        } else {
          document.getElementById(`catalog-${catId}`).insertAdjacentHTML('beforeend', `
          <div class="catalog-item" id="catalog-selector" width: 70px; height: 70px">
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

    document.getElementById('save-avatar-btn').onclick = async function() {
      await DB({'type':'updateavatar', 'obj':avObj, 'user':username, 'pass':userkey});
      //delete cachedAvs[username];
      addNotif("Avatar updated."); 
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
      <div id="menu-bg" style="border-radius: 10px; background-color: rgb(25, 25, 25); text-align: center; max-height: calc(100% - 20px); max-width: calc(100% - 20px); width:4in; box-shadow: 0px 0px 10px black;">
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
  <hr>
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
      addNotif("Request sent")
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