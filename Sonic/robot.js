var roads = [
  "Bob's House-Post Office",
  "Alice's House-Bob's House",   "Bob's House-Cabin",
  "Cabin-Shop",
  "Daria's House-Ernie's House", "Daria's House-Cabin",
  "Ernie's House-Farm", "Grete's House-Farm",
  "Marketplace-Grete's House",         
];

function buildGraph(edges) {
  let graph = Object.create(null);
  function addEdge(from, to) {
    if (graph[from] == null) {
      graph[from] = [to];
    } else {
      graph[from].push(to);
    }
  }
  for (let [from, to] of edges.map(r => r.split("-"))) {
    addEdge(from, to);
    addEdge(to, from);
  }
  return graph;
}

var roadGraph = buildGraph(roads);

var VillageState = class VillageState {
  constructor(place, parcels) {
    this.place = place;
    this.parcels = parcels;
  }

  move(destination) {
    if (!roadGraph[this.place].includes(destination)) {
      return this;
    } else {
      let parcels = this.parcels.map(p => {
        if (p.place != this.place) return p;
        return {place: destination, address: p.address};
      }).filter(p => p.place != p.address);
      return new VillageState(destination, parcels);
    }
  }
}

function runRobot(state, robot, memory) {
  for (let turn = 0;; turn++) {
    if (state.parcels.length == 0) {
      console.log(`Done in ${turn} turns`);
      break;
    }
    let action = robot(state, memory);
    state = state.move(action.direction);
    memory = action.memory;
    console.log(`Moved to ${action.direction}`);
  }
}

function randomPick(array) {
  let choice = Math.floor(Math.random() * array.length);
  return array[choice];
}

function randomRobot(state) {
  return {direction: randomPick(roadGraph[state.place])};
}

VillageState.random = function(parcelCount = 5) {
  let parcels = [];
  for (let i = 0; i < parcelCount; i++) {
    let address = randomPick(Object.keys(roadGraph));
    let place;
    do {
      place = randomPick(Object.keys(roadGraph));
    } while (place == address);
    parcels.push({place, address});
  }
  return new VillageState("Post Office", parcels);
};

var mailRoute = [
  "Alice's House", "Cabin", "Alice's House", "Bob's House",
   "Daria's House", "Ernie's House",
  "Grete's House", "Shop", "Grete's House", "Farm",
  "Marketplace", "Post Office"
];

function routeRobot(state, memory) {
  if (memory.length == 0) {
    memory = mailRoute;
  }
  return {direction: memory[0], memory: memory.slice(1)};
}

function findRoute(graph, from, to) {
  let work = [{at: from, route: []}];
  for (let i = 0; i < work.length; i++) {
    let {at, route} = work[i];
    for (let place of graph[at]) {
      if (place == to) return route.concat(place);
      if (!work.some(w => w.at == place)) {
        work.push({at: place, route: route.concat(place)});
      }
    }
  }
}

function goalOrientedRobot({place, parcels}, route) {
  if (route.length == 0) {
    let parcel = parcels[0];
    if (parcel.place != place) {
      route = findRoute(roadGraph, place, parcel.place);
    } else {
      route = findRoute(roadGraph, place, parcel.address);
    }
  }
  return {direction: route[0], memory: route.slice(1)};
}
(function() {
  "use strict"

  let active = null

  const places = {
    "Alice's House": {x: 184, y: 233},
    "Bob's House": {x: 283, y: 96},
    "Cabin": {x: 342, y: 210},
    "Daria's House": {x: 470, y: 215},
    "Ernie's House": {x: 579, y: 182},
    "Farm": {x: 597, y: 86},
    "Grete's House": {x: 746, y: 82},
    "Marketplace": {x: 841, y: 139},
    "Post Office": {x: 118, y: 99},
    "Shop": {x: 346, y: 328},
   
  } /// biến tọa độ vị trí ox ,oy
  const placeKeys = Object.keys(places)

  const speed = 1; // biến tăng tốc độ sonice

  class Animation {
    constructor(worldState, robot, robotState) {
      this.worldState = worldState
      this.robot = robot
      this.robotState = robotState
      this.turn = 0

      let outer = (window.__sandbox ? window.__sandbox.output.div : document.body), doc = outer.ownerDocument
      this.node = outer.appendChild(doc.createElement("div"))
      this.node.style.cssText = "position: relative; line-height: 0.1; margin-left: 10px"
      this.map = this.node.appendChild(doc.createElement("img"))
      this.map.src = "./asset/map.jpg"
      this.map.style.cssText = "vertical-align: -8px"
      this.robotElt = this.node.appendChild(doc.createElement("div"))
      this.robotElt.style.cssText = `position: absolute; transition: left ${0.8 / speed}s, top ${0.8 / speed}s;`
      let robotPic = this.robotElt.appendChild(doc.createElement("img"))
      robotPic.src = "./asset/robot-moveing2x.gif"
      robotPic.style.height="60px"
      this.parcels = []

      this.text = this.node.appendChild(doc.createElement("span"))
      this.button = this.node.appendChild(doc.createElement("button"))
      this.button.style.cssText = "color: white; background: #28b; border:; border-radius: 2px; padding: 2px 5px; line-height: 1.1; font-family: sans-serif; font-size: 80%"
      this.button.textContent = "Stop"

      this.button.addEventListener("click", () => this.clicked())
      this.schedule()

      this.updateView()
      this.updateParcels()

      this.robotElt.addEventListener("transitionend", () => this.updateParcels())
    }


    updateView() {
      let pos = places[this.worldState.place]
      this.robotElt.style.top = (pos.y - 38) + "px"
      this.robotElt.style.left = (pos.x - 16) + "px"

      this.text.textContent = ` Turn ${this.turn} `
    }

    updateParcels() {
      while (this.parcels.length) this.parcels.pop().remove()
      let heights = {}
      for (let {place, address} of this.worldState.parcels) {
        let height = heights[place] || (heights[place] = 0)
        heights[place] += 14
        let node = document.createElement("div")
        let offset = placeKeys.indexOf(address) * 16
        node.style.cssText = "position: absolute; height: 10px; width: 10px; background-image: url(./asset/map1.gif); background-position: 0 -" + offset + "px";
        if (place == this.worldState.place) {
          node.style.left = "25px"
          node.style.bottom = (20 + height) + "px"
          this.robotElt.appendChild(node)
        } else {
          let pos = places[place]
          node.style.left = (pos.x - 5) + "px"
          node.style.top = (pos.y - 10 - height) + "px"
          this.node.appendChild(node)
        }
        this.parcels.push(node)
      }
    }

    tick() {
      let {direction, memory} = this.robot(this.worldState, this.robotState)
      this.worldState = this.worldState.move(direction)
      this.robotState = memory
      this.turn++
      this.updateView()
      if (this.worldState.parcels.length == 0) {
        this.button.remove()
        this.text.textContent = ` Finished after ${this.turn} turns`
        this.robotElt.firstChild.src = "./asset/rsz_sonicstand.png"
      } else {
        this.schedule()
      }
    }

    schedule() {
      this.timeout = setTimeout(() => this.tick(), 1000 / speed)
    }

    clicked() {
      if (this.timeout == null) {
        this.schedule()
        this.button.textContent = "Stop"
        this.robotElt.firstChild.src = "./asset/robot-moveing2x.gif"
      } else {
        clearTimeout(this.timeout)
        this.timeout = null
        this.button.textContent = "Start"
        this.robotElt.firstChild.src = "./asset/rsz_sonicstand.png"
      }
    }
  }

  window.runRobotAnimation = function(worldState, robot, robotState) {
    if (active && active.timeout != null)
      clearTimeout(active.timeout)
    active = new Animation(worldState, robot, robotState)
  }
})()
// runRobotAnimation(VillageState.random(),
//                   goalOrientedRobot, []);
function compareRobots(robot1, memory1, robot2, memory2) {
  // Your code here
  runRobotAnimation(VillageState.random(),
                   goalOrientedRobot, []);
}

compareRobots(routeRobot, [], goalOrientedRobot, []);