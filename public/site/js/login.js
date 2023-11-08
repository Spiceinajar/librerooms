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

    document.getElementById('user_input').value = decrypt(getCookie('user'));
    document.getElementById('pass_input').value = decrypt(getCookie('key'));
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

      <h1 style="display:inline-block;" class="copyright-claim">By proceeding, you agree to our <a href="../policies/terms.html" target="_blank" rel="noopener noreferrer" class="claim-link">Terms of Service</a>, <a href="../policies/cookies.html" target="_blank" rel="noopener noreferrer" class="claim-link">Cookie Policy</a> and <a href="../policies/privacy.html" target="_blank" rel="noopener noreferrer" class="claim-link">Privacy Policy</a>.</h1>
 
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
  document.getElementById('logbtn').textContent = '...';

  var result = await DB({type:'chkusr', user:user, pass:key})

  if (result['auth'] === true) {
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + 1);
    
    sessionStorage.setItem('LRUserLogin', encrypt(`{"user":"${user}", "key":"${key}"}`), sameSite='lax');
    document.cookie = `user=${encrypt(user)}; samesite=strict; expires=${expirationDate.toUTCString()}; Secure`;
    document.cookie = `key=${encrypt(key)}; samesite=strict; expires=${expirationDate.toUTCString()}; Secure`;

    location.href = '../app';
  } else {
    addNotif("Login failed");
  }

  document.getElementById('logbtn').textContent = 'Log in';
}

//==============================
async function cr_account(user, key) {
  document.getElementById('crbtn').textContent = '...';
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
          addNotif('Username can only contain letters and numbers')
        } else {
          if (result === "longuser") {
            addNotif('Username must be shorter than 16 characters')
          }
        }
      }
    }
  }

  document.getElementById('crbtn').textContent = 'Create account';
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