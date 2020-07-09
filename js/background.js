/** Session record action */

/** print logs */
var bkg = chrome.extension.getBackgroundPage();

// create a global session object
// this will have the reference
var currentSession,
  sessionPrerequisite,
  timer,
  pause,
  resume,
  value,
  userEmail,
  userName,
  sessionData,
  sessionRemain,
  sessionDetails,
  endTime;

let db = initDatabase();

/** connect pouchdb */
function initDatabase() {
  return new PouchDB("session");
}

/** Start and stop session record */
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("startRecord").addEventListener("click", function () {
    chrome.runtime.sendMessage({ action: "StartRecord" }, function (
      response
    ) { });
    var today = new Date();
    var sessionStartTime =
      today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    sessionPrerequisite = {
      sessionStartTime: sessionStartTime.toString(),
      sessionDuration: sessionDuration.value,
      excludedUrl: document.getElementById('excludeurl').value
    }
    chrome.storage.local.set({ "sessionPrerequisite": sessionPrerequisite })
    displayCounter();
    let sessionDur = sessionPrerequisite.sessionDuration;
    let dur = sessionDur.split(':');
    let h = dur[0];
    let m = dur[1];
    let s = dur[2];
    timeCounter(h, m, s);
  });

  document.getElementById("stopRecord").addEventListener("click", function () {
    reset();
    chrome.runtime.sendMessage({ action: "StopRecord" }, function (
      response
    ) { });
  });
});

/** start and stop record action*/
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "StartRecord") {
    // listener on current tab
    chrome.tabs.query({ currentWindow: true, active: true }, (tab) => {
      bkg.console.log("start session");
      onStartSession(tab);
    });
    // listener when new tab is created
    chrome.tabs.onUpdated.addListener(onUpdateTab);
    // listener when tab is switched
    chrome.tabs.onActivated.addListener(onSwitchTabs);
    sendResponse({ Record: "Started" });
  } else if (request.action === "StopRecord") {
    stopSession();
  }
});

/** stop session */
async function stopSession() {
  endTime = new Date();
  currentSession.stopSession();
  currentSession = null;
  const sessionRecords = await getSessionFromDb();
  chrome.storage.local.set({ 'sessionId': sessionRecords[0].sessionId });
  chrome.storage.local.get('userDetails', function (items) {
    if (Object.keys(items).length !== 0) {
      sessionData = {
        records: sessionRecords,
        emailId: items.userDetails.userEmail,
        userName: items.userDetails.userName
      }
      sendSessionData(sessionData);
    }
  });
}

/** store session details into local database */
function sendSessionData(sessionRecords) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "http://localhost:3000/api/session", true);
  xhr.setRequestHeader("Content-type", "application/json");
  xhr.onreadystatechange = function () {
    //Call a function when the state changes.
    if (xhr.readyState == 4 && xhr.status == 200) {
      console.log(xhr.responseText);
    }
  };
  xhr.send(JSON.stringify(sessionRecords));
  clearPouchdb();
}

async function getSessionFromDb() {
  await db.compact();
  const result = await db.allDocs({ include_docs: true, attachments: true });

  return result.rows.map((record) => {
    const { _id, _rev, ...data } = record.doc;
    return data;
  });
}

/** clear pouchdb after a session record */
function clearPouchdb() {
  bkg.console.log("clearpouchdb")
  db.destroy()
    .then(function (response) {
      console.log(response);
      db = new PouchDB("session");
    })
    .catch(function (err) {
      console.log(err);
    });
}

/**
 * listener for when tab is switched
 * @param {Object} activeInfo
 */
function onSwitchTabs(activeInfo) {
  chrome.tabs.get(activeInfo.tabId, async function (tab) {
    if (tab.url === "" || tab.url === "chrome://newtab/") {
      return;
    }
    bkg.console.log(" on tab switched");
    currentSession.updateSession(tab);
  });
}

function onStartSession(chromeTab) {
  const tab = chromeTab[0];
  if (tab.url !== "chrome://newtab/" && tab.status === "complete") {
    if (tab.active) {
      currentSession = new Session(tab);
    }
  }
}

/**
 * listener called when tab is updated
 * @param {String} tabId
 * @param {String} changeInfo
 * @param {Object} tab
 */
function onUpdateTab(tabId, changeInfo, tab) {
  if (tab.url !== "chrome://newtab/" && tab.status === "complete") {
    if (tab.active) {
      currentSession.updateSession(tab);
    }
  }
}

/** get user details and render duration options*/
sessionDuration = document.getElementById('setDuration');
const durations = ['00:00:10', '00:30:00', '00:45:00', '01:00:00', '01:15:00', '01:30:00'];
for (let duration of durations) {
  sessionDuration.add(new Option(duration));
}

chrome.storage.local.get('userDetails', function (items) {
  if (Object.keys(items).length !== 0) {
    bkg.console.log(items)
    document.getElementById("sessionRecord").style.display = "inline";
    document.getElementById("loginPage").style.display = "none";
    displayCounter();
  } else {
    document.getElementById("sessionRecord").style.display = "none";
    document.getElementById("loginPage").style.display = "inline";
  }
});

/** continue the time runner on change of tabs */
chrome.storage.local.get('sessionPrerequisite', function (item) {
  if (Object.keys(item).length !== 0 && item.sessionPrerequisite.sessionDuration) {
    todayCurrentTime = new Date();
    var timeCur =
      todayCurrentTime.getHours() +
      ":" +
      todayCurrentTime.getMinutes() +
      ":" +
      todayCurrentTime.getSeconds();
    sessionStartTime = item.sessionPrerequisite.sessionStartTime;
    duration = item.sessionPrerequisite.sessionDuration;
    durationSplit = duration.split(":");
    startTimeSplit = sessionStartTime.split(":")
    currentTime = parseInt(
      todayCurrentTime.getHours() * 3600 +
      todayCurrentTime.getMinutes() * 60 +
      todayCurrentTime.getSeconds()
    );
    var startTimeSplitSec =
      parseInt(startTimeSplit[0] * 3600) +
      parseInt(startTimeSplit[1] * 60) +
      parseInt(startTimeSplit[2]);
    timeDifference = currentTime - startTimeSplitSec;
    splitLocalTimeSec =
      parseInt(durationSplit[0] * 3600) +
      parseInt(durationSplit[1] * 60) +
      parseInt(durationSplit[2]);
    timerRunning = splitLocalTimeSec - timeDifference;
    timeConvert(timerRunning);
  }
});

//display timer countdown elements
function displayCounter() {
  chrome.storage.local.get('sessionPrerequisite', function (item) {
    if (Object.keys(item).length !== 0 && item.sessionPrerequisite.sessionDuration) {
      document.getElementById("setValues").style.display = "none";
      document.getElementById("sessionCounter").style.display = "inline";
    } else {
      document.getElementById("setValues").style.display = "inline";
      document.getElementById("sessionCounter").style.display = "none";
    }
  })
}

/** count down timer */
timer = document.querySelector("#timer");
pause = document.getElementById("pause");
resume = document.getElementById("resume");
value = "00:00:00";
function timeCounter(h, m, s) {
  bkg.console.log(h, m, s);
  chrome.storage.local.set({ 'timer': h, m, s })
  sessionRemain = h + ":" + m + ":" + s;
  timer.textContent = h + ":" + m + ":" + s;
  if (s == 0) {
    if (m == 0) {
      if (h == 0) {
        reset();
        return;
      } else if (h != 0) {
        h = h - 1;
        m = 60;
        s = 60;
      }
    } else if (m != 0) {
      m = m - 1;
      s = 60;
    }
  }
  s = s - 1;
  id = setTimeout(function () {
    timeCounter(h, m, s)
  }, 1000);
}

function pauseTimer() {
  value = timer.textContent;
  clearTimeout(id);
  session.isPaused = true;
}

function resumeTimer() {
  var t = value.split(":");
  timeCounter(parseInt(t[0], 10), parseInt(t[1], 10), parseInt(t[2], 10));
  session.isPaused = false;
}

pause.addEventListener("click", pauseTimer, false);

resume.addEventListener("click", resumeTimer, false);


/** Add button excluded url */
document.getElementById("addUrl").addEventListener("click", function () {
  document.getElementById('excludeurl').value = "";
})

chrome.browserAction.onClicked.addListener(function (tab) {
  chrome.tabs.create({ 'url': chrome.extension.getURL('f.html') }, function (tab) {
    // Tab opened.
  });
});
document.getElementById("viewRecord").addEventListener("click", function () {
  chrome.storage.local.get('sessionId', function (sessionId) {
    getSessionId(sessionId.sessionId)
  });
  chrome.tabs.create({ 'url': chrome.extension.getURL('./views/reports.html') }, function (tab) {
    // Tab opened.
  });
})

function timeConvert(n) {
  var time = n;
  bkg.console.log(time)

  var minutes = Math.floor(time / 60);

  var seconds = time - minutes * 60;

  var hours = Math.floor(time / 3600);

  timer = document.querySelector("#timer");

  var timerDuration = [hours, minutes, seconds];
  bkg.console.log(hours, minutes, seconds)
  timeCounter(hours, minutes, seconds);
}

function reset() {
  alert('Session recorded successfully');
  chrome.runtime.sendMessage({ action: "StopRecord" }, function (
    response
  ) { });
  chrome.storage.local.remove('sessionPrerequisite');
  sessionDuration.value = '';
  document.getElementById('excludeurl').value = '';
  document.getElementById("setValues").style.display = "inline";
  document.getElementById("sessionCounter").style.display = "none";
  timer.textContent = "00:00:00"
  clearTimeout(id);
}

function getSessionId(sessionId) {
  bkg.console.log(sessionId);
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "http://localhost:3000/api/session/" + sessionId, true);
  xhr.responseType = 'json';
  xhr.onload = function (e) {
    if (this.status == 200) {
      sessionDetails = this.response;
      bkg.console.log('response', sessionDetails); // JSON response  
      for (sessionDetail of sessionDetails) {
        bkg.console.log('response', sessionDetail);
        var domainName = sessionDetail.domain;
        var duration = sessionDetail.group[0].duration;
        var url = sessionDetail.group[0].url;
        var startTime = sessionDetail.group[0].startTime;;
        var title = sessionDetail.group[0].title
        bkg.console.log(domainName, duration, url, startTime, title)
        $("<tr>").appendTo($("#result"))      // Create new row, append it to the table's html.
          .append('<td>' + domainName + '</td>')   // Add all the data to the table.
          .append('<td>' + duration + '</td>')
          .append('<td>' + url + '</td>')
          .append('<td>' + startTime + '</td>')
          .append('<td>' + title + '</td>');
      }
    }
  }
  xhr.send();
}