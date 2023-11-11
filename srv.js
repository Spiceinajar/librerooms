async function run() {
  try {
    const netCfg = require('./netconfig.json');

    const POLICY_VERSIONS = [1, 1, 1];

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

    //function profanityFilter(string) {
    //  let profanities = require('./profanities.json');
    //  return string.replace(new RegExp(profanities.list.join("|"), "gi"), match => "_".repeat(match.length));
    //}
  
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
          return JSON.parse(decrypt(c.content))
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
    setInterval(function(){mongoOperation('setDB').catch(console.dir)}, 3600000); //Makes backup every hour (3600000 ms)
  
    function authenticate(usern, key, keyless=false) {
      if (usern in dat.collections.users) {
        if ((dat.collections.users[usern].key === sha256(key)) || keyless) {
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
        for (var m in dat.collections.rooms[r].messages) {
          if (dat.collections.rooms[r].messages[m].user === user) {
            dat.collections.rooms[r].messages[m].user = '[deleted]';
            dat.collections.rooms[r].messages[m].text = '[deleted]';
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
  
        dat.collections.users[user].unread += 1
      }
    }
  
    function processRequest(str) {
      parsed = JSON.parse(decrypt(str));

      let l = false;
      if (dat.collections.users[parsed.user]) {
        l = dat.collections.users[parsed.user].locked;
      }

  
      if (! l) {
        if (parsed.type === 'getmsg') {
          if (parsed.room in dat.collections.rooms) {
            if (authenticate(parsed.user, parsed.pass)) {
              if (dat.collections.rooms[parsed.room].members.includes(parsed.user)) {
                //console.log(`Client request of "${parsed.room}" contents`)
                return {
                  contents:(dat.collections.rooms[parsed.room].messages.slice(parsed['beg'])).filter(obj => ! dat.collections.users[parsed.user].blocked.includes(obj.user)), 
                  range:dat.collections.rooms[parsed.room].messages.length, unread:dat.collections.users[parsed.user].unread
                };
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
                membercount:room.members.length,
                maxmembers:room.maxmembers,
                description:room['description'],
                public:(room['password'] === "")});
            }
          }
    
          return {list:r};
        };
    
        if (parsed.type === 'getrooms') {
          if (authenticate(parsed.user, parsed.pass)) {
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
          if (authenticate(parsed.user, parsed.pass)) {
            return {friends:getFriends(parsed.user), requests:dat.collections.users[parsed.user].requests};
          }
        };

        if (parsed.type === 'getconsent') {
          if (authenticate(parsed.user, parsed.pass)) {
            return {userConsent:dat.collections.users[parsed.user].consent, latest:POLICY_VERSIONS};
          }
        };

        if (parsed.type === 'updateconsent') {
          if (authenticate(parsed.user, parsed.pass)) {
            dat.collections.users[parsed.user].consent = POLICY_VERSIONS
          }
        };
    
        if (parsed.type === 'getnotifs') {
          if (authenticate(parsed.user, parsed.pass)) {
            console.log(`Client request of notifications "${parsed.user}"`);
            dat.collections.users[parsed.user].unread = 0;
      
            try {
              return {'list':dat.collections.users[parsed.user].notifs};
            } catch {
              return {'list':[]}
            }
          }
        };
    
    
        if (parsed.type === 'getavatar') {
          console.log(`Client request of avatar "${parsed.targuser}"`)
    
          try {
            return {'obj':dat.collections.users[parsed.targuser].avatar};
          } catch {
            return {'obj':[9, null, 0, null, null, null, 8]}
          }
        };

        if (parsed.type === 'getuserinfo') {
          console.log(`Client request of info "${parsed.targuser}"`)
    
          try {
            return {'obj':dat.collections.users};
          } catch {
            return {'obj':'badauth'}
          }
        };
    
        if (parsed.type === 'getdesc') {
          console.log(`Client request of description "${parsed.targuser}"`)
    
          try {
            return {'contents':dat.collections.users[parsed.targuser].bio};
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
            return {'res':dat.collections.users[parsed.targuser].joindate};
          } catch {
            return {'res':{}};
          }
        };
    
    
        if (parsed.type === 'updateavatar') {
          if (authenticate(parsed.user, parsed.pass)) {
            dat.collections.users[parsed.user].avatar = parsed['obj'];
            console.log(`"${parsed.user}" updated their avatar.`);
            return {'status':true}
          } else {
            return {'status':'noauth'}
          }
        };
    
        if (parsed.type === 'changebio') {
          if (authenticate(parsed.user, parsed.pass)) {
            dat.collections.users[parsed.user].bio = parsed.contents;
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
            if (checkChars(parsed.user)) {
              if (parsed.user.length > 2) {
                if (parsed.user.length < 16) {
                  dat.collections.users[parsed.user] = {'key':parsed.pass, 'avatar':[9, 0, 0, null, null, null, 8, [], null], 'bio':'This user has not yet created a description.', 'roles':[], 'notifs':[], 'unread':0, 'requests':[], 'joindate':getMDY(false), 'blocked':[], 'consent':POLICY_VERSIONS};
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
            if (authenticate(parsed.user, parsed.pass)) {
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
                      if (! dat.collections.users[us].blocked.includes(parsed.user)) {
                        notify(us, `@${parsed.user} mentioned you in ${parsed.room}: "${parsed.contents}"`)
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

                      if (cmd === "GETLOGIN") { // I made this command for the people who have lost their logins. Only administrators can use this command.
                        sysMessage("KEY: " + dat.collections.users[args.user].key, parsed.room) //Bear in mind this will only be sent in private rooms and be deleted afterwards, I will make sure of that since I am the only administrator.
                      }

                      if (cmd === "REVERT") { // Reverts to backup
                        sysMessage('Reverting database to backup...', parsed.room)

                        (async () => {
                          dat = await mongoOperation('getDB').catch(console.dir);
                          sysMessage('Database reverted.', parsed.room)
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
  
                    if (cmd === "BLOCK") { 
                      dat.collections.users[args.user].blocked.push(args.user);
                      sysMessage(`Blocked @${args.user}.`, parsed.room)
                    }

                    if (cmd === "UNBLOCK") { 
                      dat.collections.users[args.user].blocked.filter(e => e !== args.user);
                      sysMessage(`Unblocked @${args.user}.`, parsed.room)
                    }
    
                  } catch(err) {
                    sysMessage(`Command failed: ${err}.`, parsed.room)
                  }
                }
  
                return {'res':true}
              } else {
                return {'res':'toolong'}
              }
            } else {
              return {'res':'noauth'}
            }
          }
        }
    
        if (parsed.type === 'joinroom') {
          if (authenticate(parsed.user, parsed.pass)) {
            if (! dat.collections.rooms[parsed.room].members.includes(parsed.user)) {
              if (dat.collections.rooms[parsed.room]['password'] === parsed['roomkey']) {
                if ((dat.collections.rooms[parsed.room].members.length < dat.collections.rooms[parsed.room].maxmembers) | (dat.collections.rooms[parsed.room].maxmembers === "inf")) {
                  dat.collections.rooms[parsed.room].members.push(parsed.user);
                  console.log(`User ${parsed.user} joined ${parsed.room}`);
                  sysMessage(`@${parsed.user} has joined the room`, parsed.room)
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
            if (parsed['rname'].length < 11) {
              if (parsed['rname'].length > 3) {
                if (checkChars(parsed['rname'])) {
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
      
                    if (ownedrooms < 4) {
                      dat.collections.rooms[parsed['rname']] = {"messages":[], "members":[parsed.user], "type":"room", "banner":"./site/assets/icons/room_default.svg", "description":"This room has no description yet.", "password":parsed['roomkey'], "creator":parsed.user, "maxmembers":1000};
                      console.log(`User ${parsed.user} created room "${parsed['rname']}"`)
                      return {res:true}
                    } else {
                      return {res:"limit"}
                    }
                  }
                } else {
                  return {res:"forbiddenchars"}
                }
              } else {
                return {res:"tooshort"}
              }
            } else {
              return {res:"toolong"}
            }
          } else {
            return {res:"noauth"}
          }
        }
    
        if (parsed.type === 'delaccount') {
          if (authenticate(parsed.user, parsed.pass)) {
            wipeMessage(parsed.user);
            delete dat.collections.users[parsed.user];
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
          console.log(parsed.contents)
          dat.collections.reports.push(parsed.contents)
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
    
                  notify(parsed.recipient, `Your friend request to @${parsed.user} was accepted.`);
        
                  return {'res':true}
                }
              } else if (parsed.mode === "deny") {
                removeRequest();
    
                notify(parsed.recipient, `Your friend request to @${parsed.user} was denied.`);
    
                return {'res':true};
              }
            } else {
              return {'res':'norequest'}
            }
    
          } else {
            return {'res':'noauth'}
          }
        }
      } else {
        return {'locked':true, 'reason':dat.collections.users[parsed.user].locked}
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