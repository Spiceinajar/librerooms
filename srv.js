const TESTING_MODE = false;

async function run() {
  try {
    const netCfg = require('./netconfig.json');

    const POLICY_VERSIONS = [2, 3];
    // privacy, tos

    //=================================

    var CryptoJS = require('crypto-js');
    var sha256 = require('js-sha256');

    function encrypt(input, key=process.env.CRYPT_KEY) {
      return CryptoJS.AES.encrypt(input, key).toString()
    }
    
    function decrypt(input, key=process.env.CRYPT_KEY) {
      const bytes = CryptoJS.AES.decrypt(input, key);
      const plaintext = bytes.toString(CryptoJS.enc.Utf8);
      return plaintext;
    }

    function getMDY(includetime=true) {
      let d = new Date();
      let result = {day:d.getUTCDate(), month:d.getUTCMonth(), year:d.getUTCFullYear()};
      
      if (includetime) {
        result.hour = d.getUTCHours();
        result.minute = d.getUTCMinutes();
      }

      return result;
    }

    var filter = require('leo-profanity');

    function profanityFilter(string) {
      return filter.clean(string, "-");
    }
  
    //=================================
  
    const express = require('express');
    const app = express();
    app.use(express.static('public'));

    //const EXRL = require('express-rate-limit');
    //
    //const limiter = EXRL({
    //  windowMs: 60000, //1 min
    //  limit: 50, //requests per minute
    //  standardHeaders: 'draft-7',
    //  legacyHeaders: false,
    //})
    //
    //app.use(limiter);
  
    var dat;
    const { MongoClient, ServerApiVersion } = require('mongodb');
    //================================
    const uri = `mongodb+srv://admin:${process.env.MONGO_KEY}@cluster0.jgmyraj.mongodb.net/?retryWrites=true&w=majority`;
  
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });
  
    async function mongoOperation(op) {
      try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Mongo connection successful...");
  
        const db = client.db('prlDB');
        const collection = db.collection("BACKUP");
        
        if (op === 'getDB') {
          let c = await collection.findOne({});
          return JSON.parse(decrypt(c.content, process.env.CRYPT_KEY_DATABASE))
        } else if (op === 'setDB') {
          await collection.bulkWrite( [
            {
              updateOne: {
                filter: {}, // Filter to find the item to update
                update: {$set:{content: encrypt(JSON.stringify(dat), process.env.CRYPT_KEY_DATABASE)}}, // New content to update
              },
            },
         ] );

         console.log("Database operation finished");
        }
      } finally {
        await client.close();
      }
    }
    
    //await mongoOperation('setDB');
    dat = await mongoOperation('getDB').catch(console.dir);



    if (! TESTING_MODE) {
      setInterval(function(){mongoOperation('setDB').catch(console.dir)}, 3600000); //Makes backup every hour (3600000 ms)
    }
  
    function authenticate(usern, sessID) {
      if (usern in dat.collections.users) {
        if ((sessions[usern] === sessID)) {
          console.log(`Successful authentication attempt to '${parsed.user}'`);
          return true;
        }
      }
  
      console.log(`Failed authentication attempt to '${parsed.user}'`);
      return false;
    }

    function passAuthenticate(usern, key) {
      if (usern in dat.collections.users) {
        if ((dat.collections.users[usern].key === sha256(key))) {
          console.log(`Successful password authentication attempt to '${parsed.user}'`);
          return true;
        }
      }
  
      console.log(`Failed password authentication attempt to '${parsed.user}'`);
      return false;
    }
  
    function wipeMessage(user) {
      for (var r in dat.collections.rooms) {
        for (var m in dat.collections.rooms[r].messages) {
          if (dat.collections.rooms[r].messages[m].user === user) {
            dat.collections.rooms[r].messages[m].user = '[ deleted ]';
            dat.collections.rooms[r].messages[m].text = '[ deleted ]';
          }
        }
        dat.collections.rooms[r].messages = dat.collections.rooms[r].messages.filter(msg => msg.user !== user);
      }
    }

    function checkChars(string) {
      let allowed = [
          'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 
          'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 
          '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ' '
      ];
  
      let passes = true;
  
      for (i of string) {
          if (! allowed.includes(i.toLowerCase())) {
              passes = false
          }
      }
  
      return passes;
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

    function sysMessage(text, room) {
      dat.collections.rooms[room].messages.push({'text':text, 'user':'System', 'dt': getMDY()});
    }

    function notify(user, contents) {
      if (user in dat.collections.users) {
        dat.collections.users[user].notifs.push(
          contents
        )

        while (dat.collections.users[user].notifs.length > 10) {
          dat.collections.users[user].notifs.shift()
        }
  
        dat.collections.users[user].unread.notifications += 1
      }
    }





    //for (let user in dat.collections.users) {
    //  dat.collections.users[user].settings = 'DEFAULT';
    //  dat.collections.users[user].consent.pop();
    //}





    let sessions = [];
    function makeID(user) {
      let id = '';
      let takenIds = Object.values(sessions);
      let chars = [...'qwertyuiopasdfghjklzxcvbnm1234567890QWERTYUIOPASDFGHJKLZXCVBNM'];

      while ((takenIds.includes(id)) || (id === '')) {
        id = '';
        for(let i = 0; i < 16; i++){
          id += chars[Math.floor(Math.random()*chars.length)]
        }
      }

      sessions[user] = id;
      return id
    }
  
    function processRequest(str) {
      try {
        parsed = JSON.parse(decrypt(str));

        let l = false;
        if (dat.collections.users[parsed.user]) {
          l = dat.collections.users[parsed.user].locked;
        }
  
    
        if (! l) {
          if (parsed.type === 'requestSession') {
            if (parsed.user in dat.collections.users) {
                if ((dat.collections.users[parsed.user].key === sha256(parsed.key))) {
                  console.log(`Granted session for '${parsed.user}'`);
                  return makeID(parsed.user)
                }
              }
          
              console.log(`Denied session for '${parsed.user}'`);
              return 'denied';
            };

          if (parsed.type === 'endSession') {
            if (authenticate(parsed.user, parsed.sessId)) {
              delete sessions[parsed.user]
            }
          };

          if (parsed.type === 'getmsg') {
            if (parsed.room in dat.collections.rooms) {
              if (authenticate(parsed.user, parsed.sessID)) {
                if (dat.collections.rooms[parsed.room].members.includes(parsed.user)) {
                  //console.log(`Client request of "${parsed.room}" contents`)
                  let fullLength = dat.collections.rooms[parsed.room].messages.length;
  
                  dat.collections.users[parsed.user].unread.rooms[parsed.room] = fullLength;

                  let processed = [];
                  let blocked = dat.collections.users[parsed.user].blocked;

                  let range = parsed.latestID;
                  if (range === null) {
                    if (fullLength >= 50) {
                      range = fullLength - 50;
                    } else {
                      range = 0
                    }
                  } else {
                    range += 1
                  }

                  let relId = 0
                  for (m of dat.collections.rooms[parsed.room].messages.slice(range)) {
                    let message = m;
                    if (blocked.includes(m.user)) {
                      message.text = '[ blocked ]'
                    }

                    if (parsed.noprofanity) {
                      message.text = profanityFilter(message.text)
                    }

                    message.id = dat.collections.rooms[parsed.room].messages.indexOf(message);

                    processed.push(message);
                    relId += 1;
                  }
  
                  return {
                    contents:processed
                  };
                }
              }
            }
          };
  
  
          if (parsed.type === 'getunreads') {
            let unread = {};
            for (u in dat.collections.users[parsed.user].unread.rooms) {
              if (dat.collections.rooms[u]) {
                fullLength = dat.collections.rooms[u].messages.length;
                if (dat.collections.users[parsed.user].unread.rooms[u] < fullLength) {
                  unread[u] = fullLength - dat.collections.users[parsed.user].unread.rooms[u];
                }
              } else {
                delete dat.collections.users[parsed.user].unread.rooms[u]
              }
            }
  
            return {notifications:dat.collections.users[parsed.user].unread.notifications, rooms:unread};
          };
      
      
          if (parsed.type === 'findrooms') {
            let r = [];
      
            for (var i in dat.collections.rooms) {
              var room = dat.collections.rooms[i];
              if (room['type'] === 'room') {
                r.push({name:i, 
                  banner:room['banner'], 
                  membercount:room.members.length,
                  maxmembers:room.maxmembers,
                  description:room['description'],
                  public:(room['password'] === "")});
              }
            }
      
            return {list:r};
          };
      
          if (parsed.type === 'getrooms') {
            if (authenticate(parsed.user, parsed.sessID)) {
              let r = [];
      
              for (var i in dat.collections.rooms) {
                if (dat.collections.rooms[i]['type'] === 'room') {
                  let rval = dat.collections.rooms[i];
                  if (rval.members.includes(parsed.user)) {
                    r.push({name:i, created:(rval.creator === parsed.user)});
                  }
                }
              }
        
              return {list:r};
            }
          };
      
      
          if (parsed.type === 'getfriends') {
            if (authenticate(parsed.user, parsed.sessID)) {
              return {friends:getFriends(parsed.user), requests:dat.collections.users[parsed.user].requests};
            }
          };

          if (parsed.type === 'getdata') {
            if (passAuthenticate(parsed.user, parsed.pass)) {
              return dat.collections.users[parsed.user];
            } else {
              return "NOAUTH"
            }
          };

          if (parsed.type === 'getsettings') {
            if (authenticate(parsed.user, parsed.sessID)) {
              return dat.collections.users[parsed.user].settings;
            } else {
              return "NOAUTH"
            }
          };

          if (parsed.type === 'updsettings') {
            if (authenticate(parsed.user, parsed.sessID)) {
              return dat.collections.users[parsed.user].settings = parsed.value;
            } else {
              return "NOAUTH"
            }
          };
  
          if (parsed.type === 'getconsent') {
            if (authenticate(parsed.user, parsed.sessID)) {
              return {userConsent:dat.collections.users[parsed.user].consent, latest:POLICY_VERSIONS};
            } else {
              return 'NOAUTH'
            }
          };
  
          if (parsed.type === 'updateconsent') {
            if (authenticate(parsed.user, parsed.sessID)) {
              dat.collections.users[parsed.user].consent = POLICY_VERSIONS
              return true
            } else {
              return 'NOAUTH'
            }
          };
      
          if (parsed.type === 'getnotifs') {
            if (authenticate(parsed.user, parsed.sessID)) {
              console.log(`Client request of notifications "${parsed.user}"`);
              dat.collections.users[parsed.user].unread.notifications = 0;

              let response = dat.collections.users[parsed.user].notifs;

              if (parsed.noprofanity) {
                for (r in response) {
                  response[r] = profanityFilter(response[r])
                }
              }
        
              try {
                return response;
              } catch {
                return []
              }
            }
          };
      
      
          if (parsed.type === 'getavatar') {
            console.log(`Client request of avatar "${parsed.targuser}"`)
      
            try {
              return {'obj':dat.collections.users[parsed.targuser].avatar};
            } catch {
              return {'obj':[9,0,1,null,null,null,null,[],null,0]}
            }
          };
      
          if (parsed.type === 'getdesc') {
            console.log(`Client request of description "${parsed.targuser}"`);

            let response = dat.collections.users[parsed.targuser].bio;
            if (parsed.noprofanity) {
              response = profanityFilter(response);
            }
      
            try {
              return {'contents':response};
            } catch {
              return {'contents':'Unavailable.'};
            }
          };
      
          if (parsed.type === 'getroles') {
            console.log(`Client request of roles "${parsed.targuser}"`)
      
            try {
              return {'list':dat.collections.users[parsed.targuser].roles};
            } catch {
              return {'list':[]};
            }
          };
  
          if (parsed.type === 'getjoindate') {
            console.log(`Client request of join date "${parsed.targuser}"`)
      
            try {
              return dat.collections.users[parsed.targuser].joindate;
            } catch {
              return {};
            }
          };
      
      
          if (parsed.type === 'updateavatar') {
            if (authenticate(parsed.user, parsed.sessID)) {
              dat.collections.users[parsed.user].avatar = parsed['obj'];
              console.log(`"${parsed.user}" updated their avatar.`);
              return true
            } else {
              return 'NOAUTH'
            }
          };
      
          if (parsed.type === 'changebio') {
            if (authenticate(parsed.user, parsed.sessID)) {
              dat.collections.users[parsed.user].bio = parsed.contents;
              console.log(`"${parsed.user}" changed their user description.`)
              return true
            } else {
              return 'NOAUTH'
            }
          };
      
      
          if (parsed.type === 'chkusr') {
            return authenticate(parsed.user, parsed.sessID);
          };


          if (parsed.type === 'blockusr') {
            if (authenticate(parsed.user, parsed.sessID)) {
              if (parsed.user === parsed.targuser) {
                return 'SELFBLOCK'
              } else {
                if (dat.collections.users[parsed.user].blocked.includes(parsed.targuser)) {
                  return 'ALREADYBLOCKED'
                } else {
                  if (dat.collections.users[parsed.targuser].roles.includes("Moderator") || dat.collections.users[parsed.targuser].roles.includes("Administrator")) {
                    return 'STAFFBLOCK'
                  } else {
                    dat.collections.users[parsed.user].blocked.push(parsed.targuser);
  
                    console.log(`@${parsed.user} has blocked @${parsed.targuser}.`)
                    return true
                  }
                }
              }
            } else {
              return 'NOAUTH'
            }
          };

          
          if (parsed.type === 'unblockusr') {
            if (authenticate(parsed.user, parsed.sessID)) {
              let blocked = dat.collections.users[parsed.user].blocked;

              var index = blocked.indexOf(parsed.targuser);
              if (index > -1) {
                dat.collections.users[parsed.user].blocked.splice(index, 1);

                console.log(`@${parsed.user} has unblocked @${parsed.targuser}.`)
                return true
              } else {
                return 'NOTBLOCKED'
              }
            } else {
              return 'NOAUTH'
            }
          };
  
          if (parsed.type === 'cr_user') {
            if (parsed.user in dat.collections.users) {
              return {"status":"exists"};
            } else {
              if (checkChars(parsed.user)) {
                if (parsed.user.length > 2) {
                  if (parsed.user.length < 16) {
                    dat.collections.users[parsed.user] = {'key':sha256(parsed.key), 'avatar':[9, 0, 0, null, null, null, 8, [], null, 0], 'bio':'This user has not yet created a description.', 'roles':[], 'notifs':[], 'unread':{notifications:0, rooms:{}}, 'requests':[], 'joindate':getMDY(false), 'blocked':[], 'consent':POLICY_VERSIONS, 'settings':'DEFAULT'};
                    notify(parsed.user, `Welcome to LibreRooms, ${parsed.user}! If you need help, you can see our guide at https://librerooms.org/guide/. If you want to suggest a change or report an issue or bug, please share feedback with the developer using the report menu.`);
                    dat.collections.rooms["Main room"].members.push(parsed.user);
                    dat.collections.rooms["updates"].members.push(parsed.user);
                    console.log(`Account '${parsed.user}' has been created.`);
                    sysMessage(`@${parsed.user} has joined LibreRooms for the first time!`, 'Main room')
                    return {"status":true};
                  } else {
                    return {"status":"longuser"};
                  }
                } else {
                  return {"status":"shortuser"};
                }
              } else {
                return {"status":"badchars"};
              }
            }
          };
      
          if (parsed.type === 'addmsg') {
            parsed.contents = parsed.contents;
  
            let spam = false;
  
            if (dat.collections.rooms[parsed.room].messages.length > 0) {
              let last = dat.collections.rooms[parsed.room].messages[dat.collections.rooms[parsed.room].messages.length-1]
              if (last.user === parsed.user) {
                if (parsed.contents === last.text) {
                  spam = true
                }
              }
            }
            
            if (! spam) {
              if (authenticate(parsed.user, parsed.sessID)) {
                if (parsed.contents.length < 500) {
                  dat.collections.rooms[parsed.room].messages.push({'text':parsed.contents, 'user':parsed.user, 'dt': getMDY()});
                  console.log(`[${parsed.room}] ${parsed.user}: "${parsed.contents}"`)
  
  
                  //PINGS
                  if (parsed.contents.includes('@')) {
                    for (i of parsed.contents.replace(/\B@\w+\b/g, (match) => {return ` ${match} `}).split(" ")) {
                      let us = i.substring(1);

                      if (us === 'all') {
                        if (dat.collections.users[parsed.user].roles.includes('Administrator')) {
                          for (let u in dat.collections.users) {
                            notify(u, `Public announcement: "${parsed.contents}"`)
                          }
                        }
                      } else if (dat.collections.rooms[parsed.room].members.includes(us)) {
                        if (us in dat.collections.users) {
                          if (! dat.collections.users[us].blocked.includes(parsed.user)) {
                            notify(us, `@${parsed.user} mentioned you in ${parsed.room}: "${parsed.contents}"`)
                          }
                        }
                      }
                    }
                  }
          
                  //COMMANDS
                  if (parsed.contents.charAt(0) === '~') {
                    const parts = parsed.contents.split(" ");
                    const cmd = parts.shift().substring(1).toUpperCase();
                    let args = {};
                    if (parts.length > 1) {
                      args = JSON.parse(parts.join(" "));
                    }
        
                    //for (a of args_raw) {
                    //  let key = a.split('=')[0];
                    //  let arg = a.split('=')[1];
                    //
                    //  args[key] = arg
                    //}
      
                    let hierarchy = [
                      'Administrator',
                      'Moderator',
                      'Developer'
                    ];
                    let permissions = {};
      
                    for (let r in hierarchy) {
                      let name = hierarchy[r];
      
                      if (dat.collections.users[parsed.user].roles.includes(name)) {
                        permissions[name] = true;
                      } else {
                        permissions[name] = false;
                      }
                    }
      
                    try {
                      if (permissions['Administrator']) {
                        if (cmd === "ADDROLE") { 
                          dat.collections.users[args.user].roles.push(args.role);
                          sysMessage(`Added role '${args.role}' to user @${args.user}.`, parsed.room)
                        }
            
                        if (cmd === "CLEARROLES") { 
                          dat.collections.users[args.user].roles = [];
                          sysMessage(`Cleared roles for user @${args.user}.`, parsed.room)
                        }
            
                        if (cmd === "DELROOM") { 
                          delete dat.collections.rooms[parsed.room];
                        }
            
                        if (cmd === "LOCK") { 
                          dat.collections.users[args.user].locked = args.reason;
                          sysMessage(`Locked account @${args.user} for "${args.reason}".`, parsed.room)
                        }
          
                        if (cmd === "UNLOCK") { 
                          dat.collections.users[args.user].locked = undefined;
                          sysMessage(`Unlocked account @${args.user}.`, parsed.room)
                        }
  
                        if (cmd === "READREPORTS") { 
                          sysMessage(dat.collections.reports.toString(), parsed.room)
                        }
  
                        if (cmd === "DELUSER") {
                          wipeMessage(args.user);
                          delete dat.collections.users[args.user];
                          sysMessage(`Deleted account "${args.user}".`);
                        }
  
                        if (cmd === "REVERT") { // Reverts to backup
                          (async () => {
                            dat = await mongoOperation('getDB').catch(console.dir);
                          })();
                        }
                      }
          
                      if (permissions['Administrator'] || permissions['Moderator']) {
                        if (cmd === "PURGE") { 
                          dat.collections.rooms[parsed.room].messages = dat.collections.rooms[parsed.room].messages.slice(0, -args.amount)
                          //sysMessage(`Removed last ${args.amount} messages from this room.`, parsed.room)
                        }
            
                        if (cmd === "CLEAR") { 
                          dat.collections.rooms[parsed.room].messages = [];
                          sysMessage(`Cleared all messages from this room.`, parsed.room)
                        }
          
                        if (cmd === "SETBANNER") { 
                          dat.collections.rooms[parsed.room].banner = args.link;
                          sysMessage(`Set banner for "${parsed.room}".`, parsed.room)
                        }
          
                        if (cmd === "SETDESCRIPTION") { 
                          dat.collections.rooms[parsed.room].description = args.value;
                          sysMessage(`Set description for "${parsed.room}".`, parsed.room)
                        }
      
                        if (cmd === "SETLIMIT") { 
                          dat.collections.rooms[parsed.room].maxmembers = Integer.parseInt(args.value);
                          sysMessage(`Set user limit for "${parsed.room}" to ${args.value}.`, parsed.room)
                        }
    
                        if (cmd === "KICK") { 
                          //dat.collections.rooms[parsed.room]
                          //sysMessage(`Kicked @${args.user} from "${parsed.room}".`, parsed.room)
                        }
    
                        if (cmd === "JOIN") { 
                          dat.collections.rooms[parsed.room].members.push(args.user)
                          sysMessage(`Joined @${args.user} to "${parsed.room}".`, parsed.room)
                        }
                      }
    
                      if (permissions['Developer'] || permissions['Administrator']) {
                        if (cmd === "BACKUP") {
                          mongoOperation('setDB').catch(console.dir)
                          sysMessage('Database backup has been made.', parsed.room)
                        }
                      }
      
                    } catch(err) {
                      sysMessage(`Command failed: ${err.stack}.`, parsed.room)
                    }
                  }
    
                  return true
                } else {
                  return 'TOOLONG'
                }
              } else {
                return 'NOAUTH'
              }
            }
          }
      
          if (parsed.type === 'joinroom') {
            if (authenticate(parsed.user, parsed.sessID)) {
              if (! dat.collections.rooms[parsed.room].members.includes(parsed.user)) {
                if (dat.collections.rooms[parsed.room]['password'] === parsed['roomkey']) {
                  if ((dat.collections.rooms[parsed.room].members.length < dat.collections.rooms[parsed.room].maxmembers) | (dat.collections.rooms[parsed.room].maxmembers === "inf")) {
                    dat.collections.rooms[parsed.room].members.push(parsed.user);
                    console.log(`User ${parsed.user} joined ${parsed.room}`);
                    sysMessage(`@${parsed.user} has joined the room`, parsed.room)
                    return true;
                  } else {
                    return "FULL";
                  }
                } else {
                  return "NOAUTH";
                }
              } else {
                return "ALREADYIN";
              }
            } else {
              return "NOAUTH";
            }
          }
      
          if (parsed.type === 'leaveroom') {
            if (authenticate(parsed.user, parsed.sessID)) {
              if (parsed.room == "Main room") {
                return "cannotleave"
              } else {
                let members = dat.collections.rooms[parsed.room].members;
                members.splice(members.indexOf(parsed.user), 1)
                console.log(`User ${parsed.user} left ${parsed.room}`)
                sysMessage(`@${parsed.user} has left the room`, parsed.room)
                return true
              }
            } else {
              return "NOAUTH"
            }
          }
      
          if (parsed.type === 'removefriend') {
            if (authenticate(parsed.user, parsed.sessID)) {
              let dm = [parsed.user, parsed.targ].sort();
              delete dat.collections.rooms[`${dm[0]}/${dm[1]}`];
              console.log(`User ${parsed.user} unfriended ${parsed.targ}`)
              return true
            } else {
              return "noauth"
            }
          }
      
          if (parsed.type === 'cr_room') {
            if (authenticate(parsed.user, parsed.sessID)) {
              if (parsed['rname'].length < 21) {
                if (parsed['rname'].length > 3) {
                  if (checkChars(parsed['rname'])) {
                    if (parsed.rname in dat.collections.rooms) {
                      return "exists"
                    } else {
                      
                      let ownedrooms = 0;
                      for (var r in dat.collections.rooms) {
                        let room = dat.collections.rooms[r];
                        if (room.creator === parsed.user) {
                          ownedrooms += 1
                        }
                      }
        
                      if (ownedrooms < 4) {
                        dat.collections.rooms[parsed['rname']] = {"messages":[], "members":[parsed.user], "type":"room", "banner":"https://librerooms.org/site/assets/icons/room_default.svg", "description":"This room has no description yet.", "password":parsed['roomkey'], "creator":parsed.user, "maxmembers":1000};
                        console.log(`User ${parsed.user} created room "${parsed['rname']}"`)
                        return true
                      } else {
                        return "limit"
                      }
                    }
                  } else {
                    return "forbiddenchars"
                  }
                } else {
                  return "tooshort"
                }
              } else {
                return "toolong"
              }
            } else {
              return "noauth"
            }
          }
      
          if (parsed.type === 'delaccount') {
            if (passAuthenticate(parsed.user, parsed.pass)) {
              wipeMessage(parsed.user);
              delete dat.collections.users[parsed.user];
              return true;
            } else {
              return "NOAUTH";
            }
          }
      
          if (parsed.type === 'delmsg') {
            if (passAuthenticate(parsed.user, parsed.pass)) {
              wipeMessage(parsed.user);
              return true;
            } else {
              return "NOAUTH";
            }
          }

          if (parsed.type === 'remove-message') {
            if (authenticate(parsed.user, parsed.sessID)) {
              let roles = dat.collections.users[parsed.user].roles;

              console.log(dat.collections.rooms[parsed.room].messages[parsed.messId], parsed.messId)

              if (dat.collections.rooms[parsed.room].messages[parsed.messId].user === parsed.user) {
                dat.collections.rooms[parsed.room].messages[parsed.messId].text = '[ removed ]'
                return true;
              } else if (roles.includes('Moderator') || roles.includes('Administrator')) {
                dat.collections.rooms[parsed.room].messages[parsed.messId].text = '[ removed by moderator ]'
                return true;
              } else {
                return "noauth";
              }
            } else {
              return "noauth";
            }
          }
      
          if (parsed.type === 'friend-request') {
            if (parsed.user === parsed.recipient) {
              return 'SELFREQUEST'
            } else {
              if (authenticate(parsed.user, parsed.sessID)) {
                if (parsed.recipient in dat.collections.users) {
                  if (getFriends(parsed.user).includes(parsed.recipient)) {
                    return "ALREADYADDED"
                  } else {
                    if (dat.collections.users[parsed.recipient].requests.includes(parsed.user)) {
                      return 'EXISTS'
                    } else {
                      dat.collections.users[parsed.recipient].requests.push(parsed.user)
                      notify(parsed.recipient, `You have a new incoming friend request from @${parsed.user}.`)
                      return true
                    }
                  }
                } else {
                  return 'NOUSER'
                }
              } else {
                return 'NOAUTH'
              }
            }
          }
      
          
          if (parsed.type === 'submit-report') {
            console.log(parsed.contents);
            dat.collections.reports.push(parsed.contents);
            return true
          }
      
          if (parsed.type === 'respond-request') {
            async function removeRequest() {
              dat.collections.users[parsed.user].requests.splice(
                dat.collections.users[parsed.user].requests.indexOf(parsed.recipient), 1)
            }
      
            if (authenticate(parsed.user, parsed.sessID)) {
              if (dat.collections.users[parsed.user].requests.includes(parsed.recipient)) {
                if (parsed.mode === "accept") {
                  if (getFriends(parsed.user).includes(parsed.recipient)) {
                    return 'exists'
                  } else {
                    let dm = [parsed.user, parsed.recipient].sort();
                    dat.collections.rooms[`${dm[0]}/${dm[1]}`] = {'messages':[], 'members':dm, 'type':'dm', 'maxmembers':2};
                    removeRequest();
      
                    notify(parsed.recipient, `Your friend request to @${parsed.user} was accepted.`);
          
                    return true
                  }
                } else if (parsed.mode === "deny") {
                  removeRequest();
      
                  notify(parsed.recipient, `Your friend request to @${parsed.user} was denied.`);
      
                  return true
                }
              } else {
                return 'norequest'
              }
      
            } else {
              return 'noauth'
            }
          }
        } else {
          return {'locked':true, 'reason':dat.collections.users[parsed.user].locked}
        }
      } catch(e) {
        console.log("CLIENT OPERATION FAILED:" + e.stack + e.name + e.message)
        return "OP_FAILURE";
      }
    }
  
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });

    //app.use((req, res) => {
    //  res.status(404).sendFile(__dirname + '/public/404.html');
    //});
  
    app.post('/server', (req, res) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
  
      req.on('end', () => {
        var v = processRequest(body);
        v = JSON.stringify(v);
        v = encrypt(v);
        v = {res:v};
        res.status(200).send(v);
      });
    });
  
    app.listen(netCfg.port, netCfg.address, () => {
      console.log(`Server running on port ${netCfg.port} and address ${netCfg.address}`);
    });
  } catch (error) {
    console.log(error)
    await mongoOperation('setDB').catch(console.dir)
  }
}

run()