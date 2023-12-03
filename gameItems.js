import {fullPolygon, Line, Point, SpinningPolygon} from "./polygons.js";

export class Bullet {
    constructor(velocity, direction, color, point) {
        this.point = new Point(point.x, point.y);
        this.velocity = velocity;
        this.direction = direction;
        this.color = color;
        this.cooldown = 1;
    }

    move() {
        this.point.moveBy(this.dx(), this.dy());
        if (this.cooldown !== 0)
            this.cooldown--;
    }

    moveLine() {
        return new Line(this.point.getClone(), new Point(this.point.x + this.dx(), this.point.y + this.dy()));
    }

    dx() {
        return this.velocity * Math.cos(this.direction);
    }

    dy() {
        return this.velocity * Math.sin(this.direction);
    }

    draw(context) {
        this.point.draw(context, this.color);
    }

    getPointCollection() {
        let points = [this.point.getClone()];
        return {fillColor: this.color, points: points};
    }
}

export class Asteroid extends SpinningPolygon {
    constructor(velocity, direction, points) {
        super(velocity, direction, points[0], points);
        this.firstVelocity = velocity;
        this.size = 1;
    }

    clone() {
        return new Asteroid(this.velocity(), this.direction(), this.copyPoints());
    }

    scaleTo(factor) {
        super.scaleTo(factor);
        this.size *= factor;
    }

    break(sizeFactor, separatingAngle) {
        let other = this.clone();
        other.firstVelocity = this.firstVelocity;
        other.size = this.size;
        other.scaleTo(Math.pow(1 - sizeFactor, 0.5));
        this.scaleTo(Math.pow(sizeFactor, 0.5));
        this.changeDirBy(separatingAngle);
        other.changeDirBy(-separatingAngle);
        other.rotateBy(Math.random() * 0.5 * Math.PI);
        let dv = Math.random() + 0.5;
        let auxV = (Math.pow(this.xVelocity, 2) + Math.pow(this.yVelocity, 2)) * dv;

        if (auxV <= (Math.pow(this.firstVelocity, 2)) * 2.25 && auxV >= Math.pow(this.firstVelocity, 2) * 0.25) {
            this.xVelocity *= dv;
            this.yVelocity *= dv;
        }
        console.log(other)
        console.log(other.xVelocity)
        console.log(other.yVelocity)
        auxV = (Math.pow(other.xVelocity, 2) + Math.pow(other.yVelocity, 2)) * (2 - dv);
        console.log(auxV)
        if (auxV <= (Math.pow(other.firstVelocity, 2)) * 2.25 && auxV >= Math.pow(other.firstVelocity, 2) * 0.25) {
            console.log('in2')
            other.xVelocity *= (2 - dv);
            other.yVelocity *= (2 - dv);
        }
        return other;
    }

    draw(context) {
        //if(this.size > 0.6)
        super.draw(context, 'white', 'black');
        // else
        //   super.draw(context, 'white', 'red');
    }

    getPointCollection() {
        return super.getPointCollection('white', 'black');
    }
}

export class DefaultAsteroid extends Asteroid {
    static randomDisplacement(scale) {
        return (Math.random() - 0.5) * scale
    }

    constructor(velocity, direction, scale, point) {
        let relX = point.x, relY = point.y;
        let p1 = new Point(relX, relY),
            p2 = new Point(relX + 1 * scale + DefaultAsteroid.randomDisplacement(scale), relY - 1 * scale + DefaultAsteroid.randomDisplacement(scale)),
            p3 = new Point(relX + 3 * scale + DefaultAsteroid.randomDisplacement(scale), relY - 1 * scale + DefaultAsteroid.randomDisplacement(scale)),
            p4 = new Point(relX + 4 * scale + DefaultAsteroid.randomDisplacement(scale), relY + DefaultAsteroid.randomDisplacement(scale)),
            p5 = new Point(relX + 3 * scale + DefaultAsteroid.randomDisplacement(scale), relY + 1 * scale + DefaultAsteroid.randomDisplacement(scale)),
            p6 = new Point(relX + 4 * scale + DefaultAsteroid.randomDisplacement(scale), relY + 2 * scale + DefaultAsteroid.randomDisplacement(scale)),
            p7 = new Point(relX + 3 * scale + DefaultAsteroid.randomDisplacement(scale), relY + 3 * scale + DefaultAsteroid.randomDisplacement(scale)),
            p8 = new Point(relX + 2 * scale + DefaultAsteroid.randomDisplacement(scale), relY + 2 * scale + DefaultAsteroid.randomDisplacement(scale)),
            p9 = new Point(relX + 1 * scale + DefaultAsteroid.randomDisplacement(scale), relY + 3 * scale + DefaultAsteroid.randomDisplacement(scale)),
            p10 = new Point(relX + DefaultAsteroid.randomDisplacement(scale), relY + 2 * scale + DefaultAsteroid.randomDisplacement(scale));
        super(velocity, direction, [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10]);
        this.size = scale;
        this.centerPoint = new Point(relX + 2 * scale, relY + 2 * scale);
    }

}

export class Spaceship extends fullPolygon {
    constructor(size, drag, thrustPower, basePoint, bulletVelocity, color, name) {
        if (!(basePoint instanceof Point))
            throw 'not a point';
        super(drag, thrustPower, 0, 0, basePoint, [new Point(basePoint.x, basePoint.y + size), new Point(basePoint.x - size / 3, basePoint.y), new Point(basePoint.x + size / 3, basePoint.y)]); // makes a little triangle
        this.angle = Math.PI / 2;
        this.live = true;
        this.color = color;
        this.bulletVelocity = bulletVelocity;
        this.name = name;
    }

    fire() {
        return new Bullet(this.bulletVelocity, this.angle, this.color, new Point(this.pointArray[0].x, this.pointArray[0].y));
    }

    move() {
        if (this.live)
            super.move();
    }

    rotateBy(angle) {
        if (this.live)
            super.rotateBy(angle);
    }

    draw(context) {
        if (this.live)
            super.draw(context, 'white', this.color);
    }

    getPointCollection() {
        if (this.live) {
            let aux = this.pointArray.map(p => p.x);
            return {
                ...super.getPointCollection('white', this.color),
                name: this.name,
                namePoint: new Point(aux.reduce((s1, s2) => s1 + s2) / aux.length, Math.max(...this.pointArray.map(p => p.y)) + 12)
            };
        }
        return undefined;
    }
}