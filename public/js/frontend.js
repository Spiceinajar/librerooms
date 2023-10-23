const apiUrl = `${window.location.origin}:${window.location.port}/server`;

//=====================================================

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

function getCookie(name) {
  var cookies = document.cookie.split('; ');
  console.log(cookies);
  for (var c in cookies) {
    let cookie = cookies[c];

    console.log(cookie);
    if (cookie.split('=')[0] === name) {
      return cookie.split('=')[1];
    }
  }
  return '';
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
  
    let twelveHourClock = true;
  
    let signature = "";
    if (twelveHourClock) {
      if (hour > 12) {
        hour -= 12;
        signature = " PM "
      } else {
        signature = " AM "
      }
    }
  
    return {day: day, month: month, year: year, hour: hour, minute: minute, signature: signature}
  }
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

//========================================================================

function chkLayout() {
  if (window.innerWidth < 700) {
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
        if (error.name === 'TypeError') {
          location.href = './error.html?err=connerror';
        }
      });

    return f.then(function(r) {
      if (r.res === "") {
        r.res = null;
      } else {
        r.res = JSON.parse(decrypt(r['res']));
        console.log(r)
        if (r.res.locked) {
          location.href = `./locked.html?reason=${r.res.reason}`;
        }
      }

      return r.res;
    });
}