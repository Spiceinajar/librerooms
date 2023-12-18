function setMenu(x) {
  if (x === 'login') {
    document.getElementById('login-bg').innerHTML = `
    <div class="login-sub-bg">
      <form id="loginForm">
        <h1 class="login-header">Log in</h1>
        <br>

        <h1 class="login-label">Username:</h1>
        <br>
        <input class="textinput" type="text" id="username" name="username" required autocomplete="username">
        <br>

        <h1 class="login-label">Password:</h1>
        <br>
        <input class="textinput" type="password" id="password" name="password" required autocomplete="current-password">

        <br>

        <button type="submit" id="logbtn" class="login-btn">Log in</button>

        <br>

        <button id="cr" class="login-btn login-button-small">Create account</button>
      </form>
    </div>
    `

    //document.getElementById('loginForm').onsubmit = function (e) {e.preventDefault(); login(document.getElementById('username').value, document.getElementById('password').value); };

    document.getElementById("loginForm").addEventListener("submit", function (event) {
      event.preventDefault();

      login(document.getElementById('username').value, document.getElementById('password').value)
    });
    document.getElementById('cr').onclick = function () { setMenu('signup') };
  } else {
    document.getElementById('login-bg').innerHTML = `
    <div class="login-sub-bg">
      <form id="crForm" autocomplete="off">
        <h1 class="login-header">Sign up</h1>
        <br>

        <h1 class="login-label">Username:</h1>
        <br>
        <input class="textinput" type="text" id="signup-username" name="username" required autocomplete="off">
        <br>

        <h1 class="login-label">Password:</h1>
        <br>
        <input class="textinput" style="font-family: Block" id="signup-password" name="password" required autocomplete="off">

        <div style="padding:1vh">
          <label class="standardText"><input id="agreement" type="checkbox" name="terms" required> I agree to the <a href="../policies/terms.html" target="_blank" rel="noopener noreferrer" class="claim-link">Terms of Service</a> <br> and <a href="../policies/privacy.html" target="_blank" rel="noopener noreferrer" class="claim-link">Privacy Policy</a>.</label>
        </div>

        <br>

        <button style="margin-top: 0" type="submit" id="crbtn" class="login-btn">Create account</button>

        <br>

        <button id="backbtn" class="login-btn login-button-small">Back</button>
      </form>
    </div>
  `

    document.getElementById("crForm").addEventListener("submit", function (event) {
      event.preventDefault();

      cr_account(document.getElementById('signup-username').value, document.getElementById('signup-password').value)
    });

    document.getElementById('backbtn').onclick = function () { setMenu('login') };
  }
}

setMenu('login');

let sess = getSession();
if (sess) {
  location.href = '../app';
}

//================================
async function login(user, key) {
  document.getElementById('logbtn').textContent = '...';

  var result = getSession();
  if (! result) {
    await newSession(user, key);
    result = getSession();
  }

  var sett = await DB({ 'type': 'getsettings', 'user': user, 'sessID': result });

  if (result.ID === 'NOAUTH') {
    addNotif("Login failed");
  } else {
    localStorage.setItem('LRSettings', JSON.stringify(sett), sameSite = 'lax');

    location.href = '../app';
  }

  document.getElementById('logbtn').textContent = 'Log in';
}

//==============================
async function cr_account(user, key) {
  if (document.getElementById('agreement').checked) {
    document.getElementById('crbtn').textContent = '...';
    var result = await DB({ type: 'cr_user', name: user, key: key })

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