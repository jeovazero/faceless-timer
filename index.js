//
// UTILS
//

// "3" -> "03"
// "22" -> "22"
const padding = (str) => ("0" + str.toString()).slice(-2);

const mapRecord = (func, obj) => {
  const objn = {};
  for (const key in obj) {
    objn[key] = func(obj[key]);
  }
  return objn;
};

// hide element by id
const hide = (ids) => {
  for (const id of ids) {
    document.getElementById(id).classList.add("hidden");
  }
};

// show element by id
const show = (ids) => {
  for (const id of ids) {
    document.getElementById(id).classList.remove("hidden");
  }
};

// generate a random number between 0 and (num - 1)
const random = (num) => {
  const arr = new Uint8Array(1);
  const r = crypto.getRandomValues(arr);
  return ((r[0] * num) / 256) >> 0;
};

const delay = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

//
// VOICE
//

const voices = {
  nothingToSeeHere:
    "https://static.wikia.nocookie.net/dota2_gamepedia/images/8/8f/Vo_faceless_void_face_ability_chronos_failure_01.mp3",
  yesss:
    "https://static.wikia.nocookie.net/dota2_gamepedia/images/8/86/Vo_faceless_void_face_win_01.mp3",
  yourCronologyEnds:
    "https://static.wikia.nocookie.net/dota2_gamepedia/images/f/f4/Vo_faceless_void_face_kill_03.mp3",
  fromAPlaceBeyondTime:
    "https://static.wikia.nocookie.net/dota2_gamepedia/images/0/04/Vo_faceless_void_face_spawn_04.mp3",
  stopWhereYouAre:
    "https://static.wikia.nocookie.net/dota2_gamepedia/images/8/83/Vo_faceless_void_face_ability_chronos_06.mp3",
  ehNextTime:
    "https://static.wikia.nocookie.net/dota2_gamepedia/images/c/ca/Vo_faceless_void_face_ability_chronos_failure_04.mp3",
  timeIsMoney:
    "https://static.wikia.nocookie.net/dota2_gamepedia/images/b/b1/Vo_faceless_void_face_lasthit_08.mp3",
  iHaveSeenTheEnd:
    "https://static.wikia.nocookie.net/dota2_gamepedia/images/7/7e/Vo_faceless_void_face_respawn_03.mp3",
  aNewAgeBeging:
    "https://static.wikia.nocookie.net/dota2_gamepedia/images/0/01/Vo_faceless_void_face_respawn_04.mp3",
  noNoNoNo:
    "https://static.wikia.nocookie.net/dota2_gamepedia/images/8/83/Vo_faceless_void_face_deny_12.mp3"
};

const audios = mapRecord((v) => {
  const a = new Audio(v);
  a.volume = 0.4;
  return a;
}, voices);

const playInitial = async () => {
  await delay(500);
  audios.nothingToSeeHere.play();
};
const startAudios = [audios.aNewAgeBeging, audios.yesss, audios.timeIsMoney];
const pauseAudioss = [audios.noNoNoNo, audios.stopWhereYouAre];
const playStart = () => {
  const i = random(startAudios.length);
  startAudios[i].play();
};
const playPause = () => {
  const i = random(pauseAudioss.length);
  pauseAudioss[i].play();
};

window.addEventListener("DOMContentLoaded", () => {
  playInitial();
});

//
// Render timer
//

const minWrapper = document.getElementById("minutes");
const secWrapper = document.getElementById("seconds");
const hourWrapper = document.getElementById("hours");

const parseTime = ({ goal, elapsed }) => {
  const rest = goal - elapsed;
  const hours = (rest / 3600) >> 0;
  const minutes = ((rest % 3600) / 60) >> 0;
  const seconds = rest % 60;

  return { hours, minutes, seconds };
};

const renderTimer = ({ goal, elapsed }) => {
  const { hours, minutes, seconds } = parseTime({ goal, elapsed });
  const paddingHours = padding(hours);
  const paddingMinutes = padding(minutes);
  const paddingSeconds = padding(seconds);
  hourWrapper.innerHTML = paddingHours;
  minWrapper.innerHTML = paddingMinutes;
  secWrapper.innerHTML = paddingSeconds;
  document.title = [paddingHours, paddingMinutes, paddingSeconds]
    .map((el) => el.toString())
    .join(":");
};

const renderInputTimer = (goal, inputs) => {
  const values = parseTime({ goal, elapsed: 0 });
  const paddedValues = mapRecord(padding, values);
  console.log({ values, inputs, paddedValues });
  for (const key in inputs) {
    inputs[key].value = paddedValues[key];
  }
};

//
// INPUTS
//

const isDigit = (str) => !!str.match(/[0-9]/);
const isEraser = (str) => str == "Backspace" || str == "Delete";
const isArrow = (str) => !!str.match(/^Arrow/);

const inputsIds = ["hours", "minutes", "seconds"];

const digitInputHandler = (event) => {
  const isMaxLen = event.currentTarget.value.length == 2;
  const key = event.key;
  const canDigit = (isDigit(key) && !isMaxLen) || isEraser(key) || isArrow(key);
  if (canDigit) return void 0;
  event.preventDefault();
};

const inputsM = inputsIds.map((id) => {
  const input = document.getElementById("input-" + id);
  input.addEventListener("keydown", digitInputHandler);
  return [id, input];
});

const inputs = inputsM.reduce((acc, cur) => ({ ...acc, [cur[0]]: cur[1] }), {});

const readIntFromInput = (input) => {
  const initial = parseInt(input.value);
  if (isNaN(initial)) return 0;
  return initial;
};

const getInputTimeInSeconds = () => {
  const ins = mapRecord(readIntFromInput, inputs);
  const value = ins.hours * 3600 + ins.minutes * 60 + ins.seconds;
  return value;
};

//
// APP MSGS
//
const START_CLICK = Symbol();
const TIME_SELECT = Symbol();
const PAUSE = Symbol();
const TICK = Symbol();
const EDIT = Symbol();

//
// TIMER MSGS
//
const TIMER_RESTART = Symbol();
const TIMER_RESET = Symbol();
const TIMER_END = Symbol();
const TIMER_PAUSE = Symbol();
const TIMER_START = Symbol();

//
// Worker
//
let worker = new Worker("worker.js");

const makeWorkerListener = (goal, elapsed) => (event) => {
  const totalElapsed = elapsed + event.data;
  //console.log("END", goal, totalElapsed, goal - totalElapsed);
  renderTimer({ goal, elapsed: totalElapsed });
  machineSend({ type: TICK, msg: totalElapsed });

  if (goal - totalElapsed <= 0) {
    //console.log("END");
    timerMachine({ type: TIMER_END, msg: goal });
  }
};

//
// INITIAL STATE
//
const makeGoal = (t) => t * 60;
const TEN_MINUTES = makeGoal(10);
const ONE_MINUTE = makeGoal(1);
const FIVE_MINUTES = makeGoal(5);
const THIRTY_SECONDS = makeGoal(0.5);
const TWENTY_SECONDS = 20;
const INITIAL_GOAL = THIRTY_SECONDS;

let State = Object.freeze({
  goal: INITIAL_GOAL,
  editMode: true,
  elapsed: 0,
  _20pct: false,
  workerListener: makeWorkerListener(INITIAL_GOAL, 0)
});

//
// MAIN STATE MACHINE
//
const machine = (state, event) => {
  const { type, msg } = event;

  switch (type) {
    case START_CLICK:
      hide(["play"]);
      show(["pause"]);
      playStart();
      const workerListener = makeWorkerListener(state.goal, state.elapsed);
      const oldWorker = state.workerListener;
      return {
        nextState: { ...state, workerListener },
        runEffect: (nextState) => {
          // updating the worker listener
          worker.removeEventListener("message", oldWorker);
          worker.addEventListener("message", nextState.workerListener);
          timerMachine({ type: TIMER_START });
        }
      };
    case TIME_SELECT:
      if (!state.editMode) return { nextState: state };
      hide(["input-timer"]);
      show(["timer", "pause", "reset"]);
      const goal = getInputTimeInSeconds();
      console.log({ goal, state });

      return {
        nextState: {
          ...state,
          editMode: false,
          elapsed: 0,
          _20pct: false,
          goal: goal
        }
      };
    case PAUSE:
      playPause();
      hide(["pause"]);
      show(["play"]);
      return {
        nextState: state,
        runEffect: (nextState) => {
          timerMachine({ type: TIMER_PAUSE });
        }
      };
    case EDIT:
      audios.ehNextTime.play();
      hide(["pause", "reset", "timer"]);
      show(["play", "input-timer"]);
      return {
        nextState: { ...state, editMode: true },
        runEffect: (nextState) => {
          timerMachine({ type: TIMER_RESET, msg: state.goal });
        }
      };
    case TICK:
      const condition = state.goal >= TWENTY_SECONDS && !state._20pct;
      if (condition) {
        const elapsedPercent = Math.round((msg / state.goal) * 100);
        //console.log("Elapsed " + elapsedPercent + "%");
        if (elapsedPercent >= 80) {
          audios.iHaveSeenTheEnd.play();
          return {
            nextState: { ...state, elapsed: msg, _20pct: true }
          };
        }
      }
      return {
        nextState: { ...state, elapsed: msg }
      };
    default:
      return { nextState: State };
  }
};

const machineSend = (event) => {
  const { nextState, runEffect } = machine(State, event);
  // State assignment only in this function :)
  State = nextState;
  Object.freeze(State);

  if (runEffect) {
    runEffect(State);
  }
};

// Only the timer effects
const timerMachine = (event) => {
  const { type, msg } = event;
  switch (type) {
    case TIMER_START:
      worker.postMessage({ type: "START" });
      break;
    case TIMER_RESTART:
      timerMachine({ type: TIMER_RESET, msg });
      worker.postMessage({ type: "START" });
      break;

    case TIMER_RESET:
      worker.postMessage({ type: "STOP" });
      renderTimer({ goal: msg, elapsed: 0 });
      renderInputTimer(msg, inputs);
      break;

    case TIMER_PAUSE:
      worker.postMessage({ type: "STOP" });
      break;

    case TIMER_END:
      hide(["pause"]);
      worker.postMessage({ type: "STOP" });
      audios.yourCronologyEnds.play();
      break;

    default:
      timerMachine({ type: TIMER_RESET });
  }
};

//
// Play
//

const playButton = document.getElementById("play");
const pauseButton = document.getElementById("pause");
const resetButton = document.getElementById("reset");

playButton.addEventListener("click", () => {
  machineSend({ type: TIME_SELECT });
  machineSend({ type: START_CLICK });
});

pauseButton.addEventListener("click", () => {
  machineSend({ type: PAUSE });
});

resetButton.addEventListener("click", () => {
  machineSend({ type: EDIT });
});

// Set initial timer
renderInputTimer(INITIAL_GOAL, inputs);
