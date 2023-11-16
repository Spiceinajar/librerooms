function setMenu(x) {
  if (x === 'login') {
    document.getElementById('login-bg').innerHTML = `
    <div class="login-sub-bg">
      <h1 class="login-header">Log in</h1>
      <br>

      <h1 class="login-label">Username:</h1>
      <br>
      <textarea id="user_input" cols="30" rows="1" onkeydown="if(event.keyCode === 13) event.preventDefault()" class="login-textarea"></textarea>
      <br>

      <h1 class="login-label">Password:</h1>
      <br>
      <textarea id="pass_input" cols="30" rows="1" onkeydown="if(event.keyCode === 13) event.preventDefault()" class="login-textarea" style="font-family: Block;"></textarea>

      <br>

      <button id="logbtn" class="login-btn">Log in</button>

      <br>

      <button id="cr" class="login-btn login-button-small">Create account</button>
    </div>
    `

    document.getElementById('logbtn').onclick = function () { login(document.getElementById('user_input').value, document.getElementById('pass_input').value); };
    document.getElementById('cr').onclick = function () { setMenu('signup') };

    document.getElementById('user_input').value = decrypt(getCookie('user'));
    document.getElementById('pass_input').value = decrypt(getCookie('key'));
  } else {
    document.getElementById('login-bg').innerHTML = `
    <div class="login-sub-bg">
      <h1 class="login-header">Sign up</h1>
      <br>

      <h1 class="login-label">Username:</h1>
      <br>
      <textarea id="user_input" cols="30" rows="1" onkeydown="if(event.keyCode === 13) event.preventDefault()" class="login-textarea"></textarea>
      <br>

      <h1 class="login-label">Password:</h1>
      <br>
      <textarea id="pass_input" cols="30" rows="1" onkeydown="if(event.keyCode === 13) event.preventDefault()" class="login-textarea" style="font-family: Block;"></textarea>

      <div style="padding:1vh">
        <input type="checkbox" id="agreement">
        <label class="agreement-label" for="agreement">I agree to the <a href="../policies/terms.html" target="_blank" rel="noopener noreferrer" class="claim-link">Terms of Service</a>, <br> <a href="../policies/cookies.html" target="_blank" rel="noopener noreferrer" class="claim-link">Cookie Policy</a> and <a href="../policies/privacy.html" target="_blank" rel="noopener noreferrer" class="claim-link">Privacy Policy</a>.</label>
      </div>

      <br>

      <button id="crbtn" class="login-btn" style="margin-top:0">Create account</button>

      <br>

      <button id="backbtn" class="login-btn login-button-small">back</button>
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

  if (result) {
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
  if (document.getElementById('agreement').checked) {
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
  } else {
    addNotif('You must agree to the listed terms and policies')
  }
}
//==============================

async function reportWindowSize() {
  if (mobileLayout) {
    document.getElementById('login-bg').style.width = "calc(100% - 1vh)";
    document.getElementById('login-bg').style.height = "calc(100% - 1vh)";
    document.getElementById('login-bg').style.margin = "0";
  } else {
    document.getElementById('login-bg').style.width = "fit-content";
    document.getElementById('login-bg').style.height = "fit-content";
    document.getElementById('login-bg').style.margin = "6vh";
  }
}


reportWindowSize();
window.addEventListener("resize", reportWindowSize);