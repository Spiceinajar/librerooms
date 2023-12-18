const apiUrl = `${window.location.origin}:${window.location.port}/server`;

let key = 't+mq5RKjh3l0x4S5lYHdL/f5XK+gogAtnvZ2o5b5YXUNqIWa67uBE3Es31vbfmNX';

function encrypt(input) {
  return CryptoJS.AES.encrypt(input, key).toString()
}

function decrypt(input) {
  const bytes = CryptoJS.AES.decrypt(input, key);
  const plaintext = bytes.toString(CryptoJS.enc.Utf8);
  return plaintext;
}

function getTime() {
  const dt = new Date();
  return { day: dt.getUTCDay(), month: dt.getUTCMonth(), year: dt.getUTCFullYear(), hour: dt.getUTCHours(), minute: dt.getUTCMinutes() };
}

function formatTime(time) {
  if (!(time === undefined)) {
    let day = time.day;
    let month = time.month;
    let year = time.year;
    let hour = time.hour;
    let minute = time.minute;

    let date = Date.UTC(year, month, day, hour, minute, 0);
    let localDate = new Date(date).toLocaleDateString("en-us", { day: '2-digit', month: '2-digit', year: '2-digit' });
    let localTime = new Date(date).toLocaleTimeString("en-us", { hour: '2-digit', minute: '2-digit' });

    //let twelveHourClock = true;
    //
    //let signature = "";
    //if (twelveHourClock) {
    //  if (hour > 12) {
    //    hour -= 12;
    //    signature = " PM "
    //  } else {
    //    signature = " AM "
    //  }
    //}

    return { "date": localDate, "time": localTime }//` • ${day}/${month}/${year} ${hour}:${minute} ${signature} UTC`
  }
}

//========================================================================

function getSession() {
  let sess = localStorage.getItem('LRSession');
  if (sess) {
    return JSON.parse(localStorage.getItem('LRSession'))
  } else {
    if (window.location.pathname === '/app/') {
      location.href = '../login';
    }
  }
}

async function newSession(user, key) {
  let sess = await DB({ type: 'requestSession', user: user, pass: key });
  localStorage.setItem('LRSession', JSON.stringify({ user: user, ID: sess }));
  JSON.stringify()
}

function chkLayout() {
  if (window.innerWidth < 800) {
    mobileLayout = true;
  } else {
    mobileLayout = false;
  }
}

chkLayout();
window.addEventListener("resize", chkLayout);
let lockNewRequests = false;

async function DB(data) {
  if (! lockNewRequests) {
    let session = getSession();
    if (session) {
      data.user = session.user;
      data.sessID = session.ID;
    }
  
    var f = fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: encrypt(JSON.stringify(data)),
    })
      .then(response => response.json())
      .then(data => {
        return data;
      })
      .catch(error => {
        console.error('Error:', error);
        if (error.name === 'TypeError') {
          Warn('Connection lost', 'Please check your connection.');
          lockNewRequests = true;
        }
      });
  
    return f.then(function (r) {
      if (r.res === "") {
        r.res = null;
      } else {
        r.res = JSON.parse(decrypt(r['res']));
        if (r.res.locked) {
          location.href = `../locked/?reason=${r.res.reason}`;
        }
  
        if (r.res === "BADSESSION") {
          localStorage.clear();
          location.href = '../login'
        }
      }
  
      return r.res;
    });
  }
}