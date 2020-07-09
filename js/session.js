var bkg = chrome.extension.getBackgroundPage();

class Session {
  isPaused = false;
  prevTabId;
  currentTabId;
  sessionId;
  url;
  title;

  constructor({ id: tabId, url, title }) {
    if (this.isPaused) {
      return;
    }
    // save starting session to database
    this.sessionId = uuidv4();
    this.currentTabId = tabId;
    this.url = url;
    this.title = title;
    this.saveSession();
  }

  updateSession({ id: newTabId, url, title }) {
    if (this.isPaused) {
      return;
    }
    this.prevTabId = this.currentTabId;
    this.currentTabId = newTabId;
    this.url = url;
    this.title = title;
    this.saveSession();
  }

  updateSessionStatus() {
    this.isPaused = !this.isPaused;
  }

  stopSession() {
    this.saveSession();
  }

  saveSession() {
    db.put({
      sessionId: this.sessionId,
      tabId: this.currentTabId,
      _id: Date.now().toString(),
      startTime: Date.now().toString(),
      url: this.url,
      title: this.title,
    });
  }
}

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
