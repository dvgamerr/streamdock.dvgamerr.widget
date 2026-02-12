// Web Worker thread: solve native timer throttling in background tabs
const TimerPond = {};

const Handle = {
  setInterval(data) {
    if (TimerPond[data.uuid]) return;
    TimerPond[data.uuid] = setInterval(() => {
      self.postMessage({ uuid: data.uuid, event: 'setInterval' });
    }, data.delay);
  },
  clearInterval(data) {
    clearInterval(TimerPond[data.uuid]);
    delete TimerPond[data.uuid];
  },
  setTimeout(data) {
    if (TimerPond[data.uuid]) {
      clearTimeout(TimerPond[data.uuid]);
      delete TimerPond[data.uuid];
    }
    TimerPond[data.uuid] = setTimeout(() => {
      self.postMessage({ uuid: data.uuid, event: 'setTimeout' });
      delete TimerPond[data.uuid];
    }, data.delay);
  },
  clearTimeout(data) {
    clearTimeout(TimerPond[data.uuid]);
    delete TimerPond[data.uuid];
  }
};

self.onmessage = function ({ data }) {
  Handle[data.event](data);
};
