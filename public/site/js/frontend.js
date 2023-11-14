function getCookie(name) {
  var cookies = document.cookie.split('; ');
  for (var c in cookies) {
    let cookie = cookies[c];

    if (cookie.split('=')[0] === name) {
      return cookie.split('=')[1];
    }
  }
  return '';
}

const apiUrl = `${window.location.origin}:${window.location.port}/server`;

var Settings = {fancyGFX:true, embedFiles:false};

//=====================================================


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
  return {day: dt.getUTCDay(), month: dt.getUTCMonth(), year: dt.getUTCFullYear(), hour: dt.getUTCHours(), minute: dt.getUTCMinutes()};
}

function formatTime(time) {
  if (!(time === undefined)) {
    let day = time.day;
    let month = time.month;
    let year = time.year;
    let hour = time.hour;
    let minute = time.minute;

    let date = Date.UTC(year, month, day, hour, minute, 0);
    let localDate = new Date(date).toLocaleDateString("en-us", {day: '2-digit', month:'2-digit', year:'2-digit'});
    let localTime = new Date(date).toLocaleTimeString("en-us", {hour: '2-digit', minute:'2-digit'});
  
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
  
    return {"date":localDate, "time":localTime}//` • ${day}/${month}/${year} ${hour}:${minute} ${signature} UTC`
  }
}

//========================================================================

function chkLayout() {
  if (window.innerWidth < 800) {
    mobileLayout = true;
  } else {
    mobileLayout = false;
  }
}

chkLayout();
window.addEventListener("resize", chkLayout);

async function DB(data) {
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
        console.log(response)
        if (error.name === 'TypeError') {
          Warn('Connection lost', 'Please check your connection.');
        }
      });

    return f.then(function(r) {
      if (r.res === "") {
        r.res = null;
      } else {
        r.res = JSON.parse(decrypt(r['res']));
        if (r.res.locked) {
          location.href = `./locked.html?reason=${r.res.reason}`;
        }
      }

      return r.res;
    });
}





function pushNotif(string) {
  if (!("Notification" in window)) {
    // Check if the browser supports notifications
    alert("This browser does not support push notifications");
  } else if (Notification.permission === "granted") {
    // Check whether notification permissions have already been granted;
    // if so, create a notification
    new Notification(string);
  } else if (Notification.permission !== "denied") {
    // We need to ask the user for permission
    Notification.requestPermission().then((permission) => {
      // If the user accepts, let's create a notification
      if (permission === "granted") {
        new Notification(string);
        // …
      }
    });
  }

  // At last, if the user has denied notifications, and you
  // want to be respectful there is no need to bother them anymore.
}