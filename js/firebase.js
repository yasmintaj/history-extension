var firebaseConfig = {
  apiKey: "AIzaSyBILNyaDYum_ga9XOuoJhnY1Gqp1947RFU",
  authDomain: "gyanpath-be124.firebaseapp.com",
  databaseURL: "https://gyanpath-be124.firebaseio.com",
  projectId: "gyanpath-be124",
  storageBucket: "gyanpath-be124.appspot.com",
  messagingSenderId: "952568695175",
  appId: "1:952568695175:web:274c525e6613be4b1fab22",
  measurementId: "G-5KX4FFCYRB",
};
firebase.initializeApp(firebaseConfig);

/** print logs */
var bkg = chrome.extension.getBackgroundPage();
var credential;

/** Firebase google sign-in */
const googleSignIn = document.getElementById("googleSignIn");
const googleSignOut = document.getElementById("googleSignOut");

var provider = new firebase.auth.GoogleAuthProvider();
provider.setCustomParameters({
  prompt: 'select_account'
});
googleSignIn.onclick = function (e) {
  bkg.console.log("login")
  firebase.auth().signInWithPopup(provider).then(function (result) {
    let userDetails = {
      token: result.credential.accessToken,
      userEmail: result.user.email,
      userName: result.user.displayName
    }
    if (userDetails) {
      chrome.storage.local.set({ "userDetails": userDetails })
      document.getElementById("sessionRecord").style.display = "inline";
      document.getElementById("loginPage").style.display = "none";
    }
  }).catch(function (error) {
    bkg.console.log(error)
  });
};

/** Firebase google sign-out */

googleSignOut.onclick = function (e) {
  firebase.auth().signOut().then(function () {
    document.getElementById("loginPage").style.display = "inline";
    document.getElementById("sessionRecord").style.display = "none";
    chrome.storage.local.clear(function (obj) {
      bkg.console.log("cleared");
    });
    bkg.console.log("SignOut Successful");
  },
    function (error) {
      bkg.console.log("SignOut failed", error);
    }
  );
};