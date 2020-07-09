formatDuration = d => {
  // console.log("ddddddd", d)
  if (d < 0) {
    return "yet to start";
  }
  var divisor = d < 3600000 ? [60000, 1000] : [3600000, 60000];
  function pad(x) {
    return x < 10 ? "0" + x : x;
  }
  return (
    Math.floor(d / divisor[0]) +
    "." +
    pad(Math.floor((d % divisor[0]) / divisor[1]))
  );
};

function SessionTimer(id, time, preDuration, updatedSessionDuration) {
  this.tabId = id;
  this.startTime = time;
  this.preDuration = preDuration;
  this.timerId;
  this.duration;
  // if(this.preDuration){
  //   durationMillSec = Math.floor(updatedSessionDuration* 100 * 1000);
  //   this.startTime.setMilliseconds(this.startTime.getMilliseconds() + durationMillSec);
  // }

  updateTime = () => {
    var now = new Date();
    this.duration = formatDuration(now - this.startTime);
  };

  this.start = () => {
    this.timerId = setInterval(updateTime, 1000);
  };

  this.stop = () => {
    clearInterval(this.timerId);
    // update duration in local database
  };

  return;
}
