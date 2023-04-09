let tickTimer;

onmessage = function (event) {
  let data = event.data;
  let base = 0;
  if (data.type === "STOP") {
    clearTimeout(tickTimer);
    base = 0;
    console.info("stop!");
  } else {
    console.info("started!");
    base = performance.now();
    const tick = () => {
      const current = performance.now();
      postMessage(((current - base) / 1000) >> 0);
      tickTimer = setTimeout(tick, 500);
    };
    tick();
  }
};
