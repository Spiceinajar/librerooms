function setMenu(x) {
  if (x === 'login') {
    document.getElementById('login-bg').innerHTML = `
    <div style="padding:6vh; max-width:100%;">
      <h1 style="font-family: Header; font-size: 4.5vh; width:fit-content; display:inline-block;">Log in</h1>
      <br>

      <h1 style="height:2.5vh; font-size:3vh; display:inline-block;">Username:</h1>
      <br>
      <textarea name="" id="user_input" cols="30" rows="1" oninput="this.value = this.value.replace(/\n/g,'')" style="width: 40vh; max-width:100%; height: 3.5vh; border-radius: 1vh; font-size: 3vh;"></textarea>
      <br>

      <h1 style="height:2.5vh; font-size:3vh; display:inline-block;">Password:</h1>
      <br>
      <textarea name="" id="pass_input" cols="30" rows="1" oninput="this.value = this.value.replace(/\n/g,'')" style="width: 40vh; max-width:100%; height: 3.5vh; border-radius: 1vh; font-size: 2.5vh; font-family: Block;"></textarea>

      <br>

      <button id="logbtn" style="width: 40vh; height: 10vh; font-size: 3vh; border-radius: 1vh; margin-top:3vh; max-width:100%;">Log in</button>

      <br>

      <button id="cr" style="width: 40vh; height: 5vh; font-size: 3vh; border-radius: 1vh; max-width:100%; margin-top:1.5vh">Create account</button>
    </div>
    `

    document.getElementById('logbtn').onclick = function () { login(document.getElementById('user_input').value, document.getElementById('pass_input').value); };
    document.getElementById('cr').onclick = function () { setMenu('signup') };

    document.getElementById('user_input').value = getCookie('user');
    document.getElementById('pass_input').value = getCookie('key');
  } else {
    document.getElementById('login-bg').innerHTML = `
    <div style="padding:6vh; max-width:100%;">
      <h1 style="font-family: Header; font-size: 4.5vh; width:fit-content; display:inline-block;">Sign up</h1>
      <br>

      <h1 style="height:2.5vh; font-size:3vh; display:inline-block;">Username:</h1>
      <br>
      <textarea name="" id="user_input" cols="30" rows="1" oninput="this.value = this.value.replace(/\n/g,'')" style="width: 40vh; max-width:100%; height: 3.5vh; border-radius: 1vh; font-size: 3vh;"></textarea>
      <br>

      <h1 style="height:2.5vh; font-size:3vh; display:inline-block;">Password:</h1>
      <br>
      <textarea name="" id="pass_input" cols="30" rows="1" oninput="this.value = this.value.replace(/\n/g,'')" style="width: 40vh; max-width:100%; height: 3.5vh; border-radius: 1vh; font-size: 2.5vh; font-family: Block;"></textarea>

      <br>

      <button id="crbtn" style="width: 40vh; height: 10vh; font-size: 3vh; border-radius: 1vh; margin-top:3vh; max-width:100%;">Create account</button>

      <br>

      <button id="backbtn" style="width: 40vh; height: 5vh; font-size: 3vh; border-radius: 1vh; max-width:100%; margin-top:1.5vh">Back</button>
    </div>
  `

  document.getElementById('crbtn').onclick = function () { cr_account(document.getElementById('user_input').value, document.getElementById('pass_input').value); };
  document.getElementById('backbtn').onclick = function () { setMenu('login') };
  }
}

setMenu('login')

//================================
async function login(user, key) {

  var result = await DB({type:'chkusr', user:user, pass:key})

  if (result['auth'] === true) {
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + 1);
    
    sessionStorage.setItem('pearlUserLogin', encrypt(`{"user":"${user}", "key":"${key}"}`), sameSite='lax');
    document.cookie = `user=${user}; samesite=strict; expires=${expirationDate.toUTCString()}; Secure`;
    document.cookie = `key=${key}; samesite=strict; expires=${expirationDate.toUTCString()}; Secure`;

    location.href = './app.html';
  } else {
    addNotif("Login failed")
  }
}

//==============================
async function cr_account(user, key) {
  var result = await DB({type:'cr_user', user:user, pass:key})
  result = result.status;

  if (result === true) {
    setMenu('login');
    addNotif('Account created')
  } else {
    if (result === "shortuser") {
      addNotif('Username must be at least 3 characters')
    } else {
      if (result === "exists") {
        addNotif('Username is taken')
      } else {
        if (result === "badchars") {
          addNotif('Usernames can only contain letters and numbers')
        }
      }
    }
  }
}
//==============================

async function reportWindowSize() {
  if (mobileLayout) {
    document.getElementById('login-bg').style.width = "calc(100% - 10px)";
    document.getElementById('login-bg').style.height = "calc(100% - 10px)";
    document.getElementById('login-bg').style.margin = "0";
  } else {
    document.getElementById('login-bg').style.width = "fit-content";
    document.getElementById('login-bg').style.height = "fit-content";
    document.getElementById('login-bg').style.margin = "6vh";
  }
}


reportWindowSize();
window.addEventListener("resize", reportWindowSize);