import {DefaultAsteroid, Spaceship} from "./gameItems.js";
import {Point} from "./polygons.js";

export class Game {
    ASTEROID_SPEED = 160
    ASTEROID_SIZE = 15.0
    SPACESHIP_THRUST = 12.0 // 8
    SPACESHIP_DRAG = 0.05 // 0.05
    SPACESHIP_SIZE = 20
    SPACESHIP_ROTATION = 3.6 // * 1.5
    ASTEROID_INTERVAL = 3200
    FIRE_INTERVAL = 0.2
    MIN_SIZE = this.ASTEROID_SIZE * 0.6
    MAX_ASTEROIDS = 15 //10
    COLORS = ['green', 'purple', 'teal', 'fuchsia', 'aqua', 'lime', 'yellow', 'olive', 'orange', 'red'];
    FIGHTERS_THRESHOLD = 0
    SPAWN_FIGHTERS = true
    MAX_FIGHTERS = 5 // 5
    FIGHTER_SIZE_MULTIPLIER = 1.8 // 1.5
    FIGHTER_FIRE_CHANCE = 120 // 120
    FIGHTER_SPAWN_RARITY = 500 // 150

    constructor(fpsCap, width, height, movements) {

        this.movements = movements; // for communication. This is plainly incorrect, but easy to do
        this.fpsCap = fpsCap;
        this.width = width;
        this.height = height;
        this.asteroidInterval = this.ASTEROID_INTERVAL / fpsCap;

        this.bullets = [];
        this.spaceshipIDs = []
        this.spaceships = []
        this.spaceshipFireIntervals = []
        this.asteroids = [];
        this.fighters = [];
        this.allItems = [this.bullets, this.spaceships, this.fighters, this.asteroids];
        this.score = 0;
    }

    addSpaceship(id) {
        if (this.spaceshipIDs.indexOf(id) !== -1)
            return;
        let color = this.COLORS[Math.round(Math.random() * (this.COLORS.length - 1))];
        this.spaceshipIDs.push(id);
        let idx = this.spaceshipIDs.indexOf(id);
        this.spaceships[idx] = new Spaceship(this.SPACESHIP_SIZE, this.SPACESHIP_DRAG, this.SPACESHIP_THRUST / this.fpsCap, this.shipSpawn(), this.ASTEROID_SPEED / this.fpsCap * 4, color);
        this.spaceshipFireIntervals[idx] = this.FIRE_INTERVAL * this.fpsCap;
    }

    removeSpaceship(id) {
        let pos = this.spaceshipIDs.indexOf(id);
        this.spaceships.splice(pos, 1);
        this.spaceshipIDs.splice(pos, 1);
    }

    shipSpawn() {
        return new Point(this.width * Math.random(), this.height * Math.random());
    }

    update() {
        if (this.gameOver())
            this.restart();
        this.addAsteroids();
        this.addFighters();
        this.spaceshipActions(this.movements);
        this.fighterActions();
        this.moveAll();
        this.runCollisions();
    }

    moveAll() {
        this.allItems.forEach(arr => arr.forEach(elem => elem.move()));
    }

    restart() {
        this.score = 0;
        this.spaceships.forEach(v => {
            v.live = true;
            let p = this.shipSpawn();
            let dx = p.x - v.pointArray[0].x
            let dy = p.y - v.pointArray[0].y
            v.moveBy(dx, dy);
        })
        this.asteroids = [];
        this.bullets = [];
        this.fighters = [];
        this.allItems = [this.bullets, this.spaceships, this.fighters, this.asteroids];
        this.asteroidInterval = this.ASTEROID_INTERVAL / this.fpsCap;
    }

    gameOver() {
        return this.spaceships.filter(s => s.live).length === 0;
    }

    fighterActions() {
        if (!this.spaceships[0])
            return;
        let viableShips = this.spaceships.filter(s => s.live);
        this.fighters.forEach(f => {
            let victim = this.findClosest(f, viableShips);
            if (victim === undefined)
                victim = this.spaceships[0];
            f.rotateTowards(victim.centerPoint, this.SPACESHIP_ROTATION / this.fpsCap)
            f.doThrust();
            if (Math.random() < 1.0 / this.FIGHTER_FIRE_CHANCE)
                this.bullets.push(f.fire());
        });
    }

    findClosest(fighter, viableShips) {
        if (!viableShips)
            return undefined;

        function distComparison(s1, s2) {
            return Math.pow(s1.pointArray[0].x - s2.pointArray[0].x, 2) + Math.pow(s1.pointArray[0].y - s2.pointArray[0].y, 2);
        }

        let spaceship = viableShips[0];
        let d = distComparison(fighter, spaceship);
        viableShips.forEach(s => {
            let aux = distComparison(fighter, s)
            if (aux < d) {
                spaceship = s;
                d = aux;
            }
        })
        return spaceship;
    }

    spaceshipActions() {
        this.spaceshipIDs.forEach(((v, k) => {
            let s = this.spaceships[k];
            if (!this.movements[v])
                return;
            let actions = this.movements[v];
            if (s.live) {
                s.rotateBy(actions.turn * this.SPACESHIP_ROTATION / this.fpsCap);
                this.spaceshipFireIntervals[k]--;
                if (actions.fire && (this.spaceshipFireIntervals[k] <= 0)) {
                    this.bullets.push(s.fire());
                    this.spaceshipFireIntervals[k] = this.FIRE_INTERVAL * this.fpsCap;
                }
                if (actions.thrust)
                    s.doThrust();
            }
        }));
    }

    addAsteroids() {
        this.asteroidInterval--;
        if (this.asteroidInterval <= 0 && this.asteroids.length < this.MAX_ASTEROIDS) {
            this.asteroidInterval = this.ASTEROID_INTERVAL / this.fpsCap * 2 * Math.random();
            let toAdd = new DefaultAsteroid(this.ASTEROID_SPEED / this.fpsCap, Math.PI * 2 * Math.random(), (Math.random() * 1.5 + 0.5) * this.ASTEROID_SIZE, this.getSpawnSite());
            toAdd.rotateBy(Math.random() * 2 * Math.PI);
            this.asteroids.push(toAdd);
        }
    }

    addFighters() {
        if (this.score >= this.FIGHTERS_THRESHOLD && this.fighters.length < this.MAX_FIGHTERS && this.SPAWN_FIGHTERS && (Math.random() < (1.0 / this.FIGHTER_SPAWN_RARITY))) {
            this.fighters.push(new Spaceship(this.SPACESHIP_SIZE * this.FIGHTER_SIZE_MULTIPLIER, this.SPACESHIP_DRAG, this.SPACESHIP_THRUST / this.fpsCap / 1.5, this.getSpawnSite(), this.ASTEROID_SPEED / this.fpsCap * 1.2, 'gray'));
        }
    }

    setShipName(id, newName) {
        this.spaceships[this.spaceshipIDs.indexOf(id)].name = newName;
    }

    getSpawnSite() {
        let wall = Math.random() * 4;
        if (wall > 1) {
            if (wall > 2) {
                if (wall > 3) {
                    return new Point(this.width * -0.2, this.height * Math.random());
                }
                return new Point(this.width * 1.2, this.height * Math.random());
            }
            return new Point(this.width * Math.random(), this.height * -0.2);
        }
        return new Point(this.width * Math.random(), this.height * 1.2);
    }

    runCollisions() {
        let xLimit = this.width * 1.1, yLimit = this.height * 1.1;
        let zeroX = -this.width * 0.1, zeroY = -this.width * 0.1;
        this.asteroids.forEach((a, index) => {
            if (a.pointArray[0].x > xLimit)
                a.moveBy(-this.width * 1.2, 0);
            if (a.pointArray[0].x < zeroX)
                a.moveBy(this.width * 1.2, 0);
            if (a.pointArray[0].y > yLimit)
                a.moveBy(0, -this.height * 1.2);
            if (a.pointArray[0].y < zeroY)
                a.moveBy(0, this.height * 1.2);

            this.fighters.forEach((s, id) => {
                if (s.live && s.intersectedBy(a)) {
                    s.live = false;
                    this.fighters.splice(id, 1);
                    this.asteroids.splice(index, 1);
                }
            });
            this.spaceships.forEach((s) => {
                if (s.live && s.intersectedBy(a)) {
                    s.live = false;
                    this.asteroids.splice(index, 1);
                }
            });
        });

        this.bullets.forEach((b, bIndex) => {
            if (b.point.x > this.width || b.point.x < 0 || b.point.y > this.height || b.point.y < 0)
                this.bullets.splice(this.bullets.indexOf(b), 1);
            else {
                if (b.cooldown === 0) {
                    let ray = b.moveLine();
                    this.asteroids.some((a, index) => {
                        if (a.intersectedBy(ray)) {
                            if (a.size < this.MIN_SIZE || this.asteroids.length >= this.MAX_ASTEROIDS)
                                this.asteroids.splice(index, 1);
                            else
                                this.asteroids.push(a.break(Math.random() * 0.5 + 0.25, Math.PI / 2 * Math.random()));
                            this.bullets.splice(bIndex, 1);
                            this.score += 1;
                            return true;
                        }
                        return false;
                    })

                    this.fighters.some((s, id) => {
                        if (s.intersectedBy(ray)) {
                            s.live = false;
                            this.fighters.splice(id, 1);
                            this.bullets.splice(this.bullets.indexOf(b), 1);
                            this.score += 10;
                            return true;
                        }
                        return false;
                    });
                    this.spaceships.some((s) => {
                        if (s.live && s.intersectedBy(ray)) {
                            s.live = false;
                            this.bullets.splice(this.bullets.indexOf(b), 1);
                            return true;
                        }
                        return false;
                    });
                }
            }
        });

        this.spaceships.forEach(s => {
            if (s.live) {
                if (s.pointArray[0].x > this.width)
                    s.moveBy(-this.width, 0);
                if (s.pointArray[0].x < 0)
                    s.moveBy(this.width, 0);
                if (s.pointArray[0].y > this.height)
                    s.moveBy(0, -this.height);
                if (s.pointArray[0].y < 0)
                    s.moveBy(0, this.height);
            }
        });
        this.fighters.forEach(s => {
            if (s.live) {
                if (s.pointArray[0].x > this.width)
                    s.moveBy(-this.width, 0);
                if (s.pointArray[0].x < 0)
                    s.moveBy(this.width, 0);
                if (s.pointArray[0].y > this.height)
                    s.moveBy(0, -this.height);
                if (s.pointArray[0].y < 0)
                    s.moveBy(0, this.height);
            }
        });
    }
}