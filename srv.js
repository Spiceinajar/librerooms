const netCfg = require('./netconfig.json');
const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({
  auth: process.env.gitKey,
});


//=================================

var chars = [' ', '!', '"', '#', '$', '%', '&', "'", '(', ')', '*', '+', ',', '-', '.', '/', ':', ';', '<', '=', '>', '?', '@', '[', '\\', ']', '^', '_', '`', '{', '|', '}', '~', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', "á", "é", "í", "ó", "ú", "ü", "ñ", "•"]
var key = ['t', 'V', 'R', '0', 'u', "'", '|', 'U', 'x', 'Y', 'r', 'g', 'P', ',', 'X', 'H', '@', '+', 'e', '5', 'B', ' ', 's', '>', '7', 'M', '{', 'G', '=', '6', 'w', '/', 'Q', '.', 'c', 'i', '"', '-', 'K', '^', 'C', '*', '~', 'f', '}', 'a', '#', ';', 'W', '`', 'n', '4', '&', 'I', 'O', '3', 'S', '(', 'J', 'l', 'p', ':', 'L', 'm', 'N', '1', 'v', 'y', 'd', '!', 'E', 'h', 'q', '\\', '_', '2', 'D', 'F', 'o', '9', ')', 'b', 'A', 'j', 'k', 'Z', '[', '<', 'z', 'T', '$', '8', ']', '%', '?', "á", "é", "í", "ó", "ú", "ü", "ñ", "•"]

function encrypt(string) {
  let encrypted_str = ""
  for (var ch in string) {
    let char = string[ch];
    if (key.includes(char)) {
      encrypted_str += key[chars.indexOf(char)];
    } else {
      encrypted_str += char;
    }
  }

  return encrypted_str
}

function decrypt(string) {
    let decrypted_str = ""
    for (var ch in string) {
      let char = string[ch]
      if (key.includes(char)) {
        decrypted_str += chars[key.indexOf(char)]
      } else {
        decrypted_str += char;
      }
    }

    return decrypted_str
}

//=================================

const express = require('express');
const app = express();
app.use(express.static('public'));
//const https = require('https')
//const http = require('http')

const fs = require('fs');

function saveJSON(jsonData, filePath) {
  const jsonString = JSON.stringify(jsonData);

  octokit.repos.createOrUpdateFileContents({
    owner: "Spiceinajar",
    repo: "pearl",
    branch: "main",
    path: "dat.json",
    message: "Update file",
    content: Buffer.from(JSON.stringify(encrypt(jsonString))).toString("base64"),,
  })
    .then(response => {
      console.log('Server backup successful');
  })
    .catch(error => {
      console.error('Server backup failed:', error);
  });
}

setInterval(function(){saveJSON(dat , 'dat.json')}, 60000); //Makes backup every hour 3600000

var dat;

try {
  dat = json.parse(decrypt(require('./dat.json')));
} catch {
  dat = {
    'collections':{
      'users':{
      },
  
      'rooms':{
        "Main room":{"messages":[],"members":[],"type":"room","banner":"./assets/icons/room_default.svg","description":"This room has no description yet.","password":"","creator":"Spiceinajar","maxmembers":'inf'},
      },

      'reports':[
      ]
    }
  };
}

function authenticate(usern, key, keyless=false) {
  if (usern in dat.collections.users) {
    if ((dat.collections.users[usern].key === key) || keyless) {
      if (! keyless) {
        console.log(`Successful authentication attempt to '${parsed.user}'`);
      }
      return true;
    }
  }

  console.log(`Failed authentication attempt to '${parsed.user}'`);
  return false;
}

function wipeMessage(user) {
  for (var r in dat.collections.rooms) {
    dat.collections.rooms[r].messages = dat.collections.rooms[r].messages.filter(msg => msg.user !== user);
  }
}

function getFriends(user) {
  let f = [];

  for (var i in dat.collections.rooms) {
    if (dat.collections.rooms[i]['type'] === 'dm') {
      let mem = i.split('/');

      if (mem.includes(user)) {
        if (mem[0] === user) {
          f.push(mem[1]);
        } else if (mem[1] === user) {
          f.push(mem[0]);
        }
      }
    }
  }

  return f;
}

function process(str) {
  parsed = JSON.parse(decrypt(str));

  if (parsed.type === 'getmsg') {
    if (parsed.room in dat.collections.rooms) {
      if (authenticate(parsed.user, parsed.pass)) {
        if (dat.collections.rooms[parsed['room']]['members'].includes(parsed.user)) {
          //console.log(`Client request of "${parsed['room']}" contents`)
          return {contents:dat.collections.rooms[parsed['room']]['messages'].slice(parsed['after'] + 1)};
        }
      }
    }
  };


  if (parsed.type === 'findrooms') {
    let r = [];

    for (var i in dat.collections.rooms) {
      var room = dat.collections.rooms[i];
      if (room['type'] === 'room') {
        r.push({name:i, 
          banner:room['banner'], 
          membercount:room['members'].length,
          maxmembers:room.maxmembers,
          description:room['description'],
          public:(room['password'] === "")});
      }
    }

    return {list:r};
  };


  if (parsed.type === 'getrooms') {
    let r = [];

    for (var i in dat.collections.rooms) {
      if (dat.collections.rooms[i]['type'] === 'room') {
        let rval = dat.collections.rooms[i];
        if (rval['members'].includes(parsed.user)) {
          r.push({name:i, created:(rval.creator === parsed.user)});
        }
      }
    }

    return {list:r};
  };


  if (parsed.type === 'getfriends') {
    return {friends:getFriends(parsed.user), requests:dat.collections.users[parsed.user].requests};
  };


  if (parsed.type === 'getnotifs') {
    console.log(`Client request of notifications "${parsed.user}"`)

    try {
      return {'list':dat.collections.users[parsed.user].notifs};
    } catch {
      return {'list':[]}
    }
  };


  if (parsed.type === 'getpfp') {
    console.log(`Client request of profile picture "${parsed.user}"`)

    try {
      return {'url':dat.collections.users[parsed.user].pfp};
    } catch {
      return {'url':'./assets/icons/missing.svg'}
    }
  };

  if (parsed.type === 'getdesc') {
    console.log(`Client request of description "${parsed.user}"`)

    try {
      return {'contents':dat.collections.users[parsed.user].bio};
    } catch {
      return {'contents':'Unavailable.'};
    }
  };

  if (parsed.type === 'getroles') {
    console.log(`Client request of roles "${parsed.user}"`)

    try {
      return {'list':dat.collections.users[parsed.user].roles};
    } catch {
      return {'list':[]};
    }
  };


  if (parsed.type === 'changepfp') {
    if (authenticate(parsed.user, parsed.pass)) {
      dat.collections.users[parsed.user].pfp = parsed['link'];
      console.log(`"${parsed.user}" changed their profile picture.`)
    }
  };

  if (parsed.type === 'changebio') {
    if (authenticate(parsed.user, parsed.pass)) {
      dat.collections.users[parsed.user].bio = parsed['contents'];
      console.log(`"${parsed.user}" changed their user description.`)
    }
  };


  if (parsed.type === 'chkusr') {
    return {auth:authenticate(parsed.user, parsed.pass)};
  };

  if (parsed.type === 'cr_user') {


    if (authenticate(parsed.user, null, true)) {
      return {"status":"exists"};
    } else {
      if (parsed["user"].length > 2) {
        dat.collections.users[parsed.user] = {'key':parsed.pass, 'pfp':'./assets/icons/default.svg', 'bio':'This user has not yet created a description.', 'roles':['AlphaTester'], 'notifs':[`Welcome to Pearl, ${parsed.user}! If you need help, you can see our guide at https://pearlapp.org/guide.html. Because you joined during Pearl's alpha stage, you've been given the [AlphaTester] badge. This also means many things are subject to change for the time being. If you want to suggest a change or report an issue or bug, please share feedback with the developer using the report menu.`], 'requests':[]};
        dat.collections.rooms["Main room"]['members'].push(parsed.user);
        dat.collections.rooms["updates"]['members'].push(parsed.user);
        console.log(`Account '${parsed.user}' has been created.`);
        return {"status":true};
      } else {
        return {"status":"shortuser"};
      }
    }
  };

  if (parsed.type === 'addmsg') {
    if (authenticate(parsed.user, parsed.pass)) {
      dat.collections.rooms[parsed['room']]['messages'].push({'text':parsed['contents'], 'user':parsed.user, 'dt': parsed['dt']});
      console.log(`[${parsed['room']}] ${parsed.user}: "${parsed['contents']}"`)
    }
  }

  if (parsed.type === 'joinroom') {
    if (authenticate(parsed.user, parsed.pass)) {
      if (! dat.collections.rooms[parsed['room']]['members'].includes(parsed.user)) {
        if (dat.collections.rooms[parsed['room']]['password'] === parsed['roomkey']) {
          if ((dat.collections.rooms[parsed['room']].members.length < dat.collections.rooms[parsed['room']].maxmembers) | (dat.collections.rooms[parsed['room']].maxmembers === "inf")) {
            dat.collections.rooms[parsed['room']]['members'].push(parsed.user);
            console.log(`User ${parsed.user} joined ${parsed['room']}`);
            return {"status":true};
          } else {
            return {"status":"full"};
          }
        } else {
          return {"status":"noauth"};
        }
      } else {
        return {"status":"alreadyin"};
      }
    } else {
      return {"status":"noauth"};
    }
  }

  if (parsed.type === 'leaveroom') {
    if (authenticate(parsed.user, parsed.pass)) {
      if (parsed['room'] == "Main room") {
        return "cannotleave"
      } else {
        let members = dat.collections.rooms[parsed['room']]['members'];
        members.splice(members.indexOf(parsed.user), 1)
        console.log(`User ${parsed.user} left ${parsed['room']}`)
        return true
      }
    } else {
      return "noauth"
    }
  }

  if (parsed.type === 'removefriend') {
    if (authenticate(parsed.user, parsed.pass)) {
      let dm = [parsed.user, parsed.targ].sort();
      delete dat.collections.rooms[`${dm[0]}/${dm[1]}`];
      console.log(`User ${parsed.user} unfriended ${parsed.targ}`)
      return true
    } else {
      return "noauth"
    }
  }

  if (parsed.type === 'cr_room') {
    if (authenticate(parsed.user, parsed.pass)) {
      if (parsed.rname in dat.collections.rooms) {
        return {res:"exists"}
      } else {
        
        let ownedrooms = 0;
        for (var r in dat.collections.rooms) {
          let room = dat.collections.rooms[r];
          if (room.creator === parsed.user) {
            ownedrooms += 1
          }
        }

        console.log(ownedrooms);
        if (ownedrooms < 4) {
          dat.collections.rooms[parsed['rname']] = {"messages":[], "members":[parsed.user], "type":"room", "banner":"./assets/icons/room_default.svg", "description":"This room has no description yet.", "password":parsed['roomkey'], "creator":parsed.user, "maxmembers":1000};
          console.log(`User ${parsed.user} created room "${parsed['rname']}"`)
          return {res:true}
        } else {
          return {res:"limit"}
        }
      }
    } else {
      return {res:"noauth"}
    }
  }

  if (parsed.type === 'delaccount') {
    if (authenticate(parsed.user, parsed.pass)) {
      delete dat.collections.users[parsed.user]
      wipeMessage(parsed.user);
      return true;
    } else {
      return "noauth";
    }
  }

  if (parsed.type === 'delmsg') {
    if (authenticate(parsed.user, parsed.pass)) {
      wipeMessage(parsed.user);
      return true;
    } else {
      return "noauth";
    }
  }

  if (parsed.type === 'friend-request') {
    if (parsed.user === parsed.recipient) {
      return {'res':'selfrequest'}
    } else {
      if (authenticate(parsed.user, parsed.pass)) {
        if (parsed.recipient in dat.collections.users) {
          if (getFriends(parsed.user).includes(parsed.recipient)) {
            return {'res':"alreadyadded"}
          } else {
            if (dat.collections.users[parsed.recipient].requests.includes(parsed.user)) {
              return {'res':'exists'}
            } else {
              dat.collections.users[parsed.recipient].requests.push(parsed.user)
              return {'res':true}
            }
          }
        } else {
          return {'res':'nouser'}
        }
      } else {
        return {'res':'noauth'}
      }
    }
  }

  
  if (parsed.type === 'submit-report') {
    dat.collections.reports.push(parsed['contents'])
  }

  if (parsed.type === 'respond-request') {
    async function removeRequest() {
      dat.collections.users[parsed.user].requests.splice(
        dat.collections.users[parsed.user].requests.indexOf(parsed.recipient), 1)
    }

    if (authenticate(parsed.user, parsed.pass)) {
      if (dat.collections.users[parsed.user].requests.includes(parsed.recipient)) {
        if (parsed.mode === "accept") {
          if (getFriends(parsed.user).includes(parsed.recipient)) {
            return {'res':'exists'}
          } else {
            let dm = [parsed.user, parsed.recipient].sort();
            dat.collections.rooms[`${dm[0]}/${dm[1]}`] = {'messages':[], 'members':dm, 'type':'dm', 'maxmembers':2};
            removeRequest();

            dat.collections.users[parsed.recipient].notifs.push(
              `Your friend request to @${parsed.user} was accepted.`
            )
  
            return {'res':true}
          }
        } else if (parsed.mode === "deny") {
          removeRequest();

          dat.collections.users[parsed.recipient].notifs.push(
            `Your friend request to @${parsed.user} was denied.`
          )

          return {'res':true};
        }
      } else {
        return {'res':'norequest'}
      }

    } else {
      return {'res':'noauth'}
    }
  }
}

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.post('/server', (req, res) => {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    var v = process(body);
    v = JSON.stringify(v);
    v = encrypt(v);
    v = {res:v};
    res.status(200).send(v);
  });
});

app.listen(netCfg.port, netCfg.address, () => {
  console.log(`Server running on port ${netCfg.port} and address ${netCfg.address}`);
});
