export class Point {

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    moveBy(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    distance(other) {
        return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
    }

    angle(other) {
        if (this.dy(other) >= 0) {
            return Math.acos(this.dx(other) / this.distance(other));
        } else
            return Math.acos(-this.dx(other) / this.distance(other)) + Math.PI;
    }

    rotate_about(other, angle) {
        let rel_x = this.dx(other);
        let rel_y = this.dy(other);
        this.x = this.x + (rel_x - (rel_x * Math.cos(angle) + rel_y * Math.sin(angle)));
        this.y = this.y + (rel_y - (-rel_x * Math.sin(angle) + rel_y * Math.cos(angle)));
    }


    dx(other) {
        return other.x - this.x;
    }

    dy(other) {
        return other.y - this.y;
    }

    toString() {
        return '{x},{y}';
    }

// hashCode is not overwritten. This ensures that HashSet will only consider points to be equal if they are the same object. This is correct.
// This way, if a SpinningPolygon is given a centerPoint that lies on another of its points point, both will be moved. But if it is given one of its points as its centerPoint, it will only be moved once, as it will only appear in points() once.
    equals(other) {
        return this === other || (other && other.x.equals(this.x) && other.y.equals(this.y));
    }

    compareTo(other) {
        let cmp = this.x - other.x;
        if (cmp !== 0)
            return cmp;
        return this.y - other.y;
    }

    points() {
        return [this];
    }

    lines() {
        return [];
    }

    getClone() {
        return new Point(this.x, this.y);
    }

    draw(context, color) {
        context.fillStyle = color;
        context.fillRect(this.x, this.y, 3, 3);
    }
}

export class Line {

    constructor(p1, p2) {
        if (p1.compareTo(p2) > 0) {
            this.p1 = p1;
            this.p2 = p2;
        } else {
            this.p1 = p2;
            this.p2 = p1;
        }
    }

    getP1() {
        return this.p1;
    }

    getP2() {
        return this.p2;
    }

    intersects(other) {
        let o1 = this.orientation(this.p1, this.p2, other.p1);
        let o2 = this.orientation(this.p1, this.p2, other.p2);
        let o3 = this.orientation(other.p1, other.p2, this.p1);
        let o4 = this.orientation(other.p1, other.p2, this.p2);
        return (o1 !== o2 && o3 !== o4) || (o1 === 0 && this.onSegment(this.p1, other.p1, this.p2)) || (o2 === 0 && this.onSegment(this.p1, other.p2, this.p2)) || (o3 === 0 && this.onSegment(other.p1, this.p1, other.p2)) || (o4 === 0 && this.onSegment(other.p1, this.p2, other.p2));
    }

    onSegment(p1, p2, p3) {
        return p2.x <= Math.max(p1.x, p3.x) && p2.x >= Math.min(p1.x, p3.x) && p2.y <= Math.max(p1.y, p3.y) && p2.y >= Math.min(p1.y, p3.y);
    }

    orientation(p1, p2, p3) {
        let val = (p2.y - p1.y) * (p3.x - p2.x) - (p2.x - p1.x) * (p3.y - p2.y);
        return val === 0 ? 0 : val > 0 ? 1 : 2;
    }

    equals(o) {
        return this === o || (o.p1.equals(this.p1) && o.p2.equals(this.p2));
    }

// hashCode is not overwritten. This ensures that HashSet will only consider lines to be equal if they are the same object. This is correct.

    compareTo(other) {
        let cmp = this.p1.compareTo(other.getP1);
        if (cmp !== 0)
            return cmp;
        return this.p2.compareTo(other.getP2);
    }

    points() {
        return [this.p1, this.p2];
    }

    lines() {
        return [this];
    }

    draw(context, color) {
        context.strokeStyle = color;
        context.beginPath();
        context.moveTo(this.p1.x, this.p1.y);
        context.lineTo(this.p2.x, this.p2.y);
        context.closePath();
        context.stroke();
    }
}

class BoundingBox {
    Codes = {
        INSIDE: Number(0),
        LEFT: Number(1),
        RIGHT: Number(2),
        BOTTOM: Number(4),
        TOP: Number(8),
    }

    constructor(minX, minY, maxX, maxY) {
        this.minX = minX;
        this.minY = minY;
        this.maxY = maxY;
        this.maxX = maxX;
    }

    move(dx, dy) {
        this.minX += dx;
        this.maxX += dx;
        this.minY += dy;
        this.maxY += dy;
    }

    computeOutCode(point) {
        let code = this.Codes.INSIDE;
        if (point.x < this.minX)
            code |= this.Codes.LEFT;
        else if (point.x > this.maxX)
            code |= this.Codes.RIGHT;
        if (point.y < this.minY)
            code |= this.Codes.BOTTOM;
        else if (point.y > this.maxY)
            code |= this.Codes.TOP;
        return code;
    }

    cohenSutherlandLineClip(line) {
        let accept = false, outcode0 = this.computeOutCode(line.p1),
            outcode1 = this.computeOutCode(line.p2);
        while (true) {
            if (!(outcode0 | outcode1)) {
                // bitwise OR is 0: both points inside window; trivially accept and exit loop
                accept = true;
                break;
            } else if (outcode0 & outcode1) {
                // bitwise AND is not 0: both points share an outside zone (LEFT, RIGHT, TOP,
                // or BOTTOM), so both must be outside window; exit loop (accept is false)
                break;
            } else {
                // failed both tests, so calculate the line segment to clip
                // from an outside point to an intersection with clip edge
                let x = 0, y = 0,
                    x0 = line.p1.x, x1 = line.p2.x,
                    y0 = line.p1.y, y1 = line.p2.y;

                // At least one endpoint is outside the clip rectangle; pick it.
                let outcodeOut = outcode1 > outcode0 ? outcode1 : outcode0;

                // Now find the intersection point;
                // use formulas:
                //   slope = (y1 - y0) / (x1 - x0)
                //   x = x0 + (1 / slope) * (ym - y0), where ym is ymin or ymax
                //   y = y0 + slope * (xm - x0), where xm is xmin or xmax
                // No need to worry about divide-by-zero because, in each case, the
                // outcode bit being tested guarantees the denominator is non-zero
                if (outcodeOut & this.Codes.TOP) {           // point is above the clip window
                    x = x0 + (x1 - x0) * (this.maxY - y0) / (y1 - y0);
                    y = this.maxY;
                } else if (outcodeOut & this.Codes.BOTTOM) { // point is below the clip window
                    x = x0 + (x1 - x0) * (this.minY - y0) / (y1 - y0);
                    y = this.minY;
                } else if (outcodeOut & this.Codes.RIGHT) {  // point is to the right of clip window
                    y = y0 + (y1 - y0) * (this.maxX - x0) / (x1 - x0);
                    x = this.maxX;
                } else if (outcodeOut & this.Codes.LEFT) {   // point is to the left of clip window
                    y = y0 + (y1 - y0) * (this.minX - x0) / (x1 - x0);
                    x = this.minX;
                }
                // Now we move outside point to intersection point to clip
                // and get ready for next pass.
                if (outcodeOut === outcode0) {
                    outcode0 = this.computeOutCode(new Point(x, y));
                } else {
                    outcode1 = this.computeOutCode(new Point(x, y));
                }
            }
        }
        return accept;
    }

    draw(context) {
        context.fillStyle = 'darkred';
        context.fillRect(this.minX, this.minY, this.maxX - this.minX, this.maxY - this.minY);
    }
}

class Polygon {
    constructor(points) {
        points.forEach(p => {
            if (!(p instanceof Point))
                throw `not a point, is a ${p.className} instead`;
        })
        this.pointArray = points;
        this.lineArray = [];
        this.boundingBox = new BoundingBox(0, 0, 0, 0);
        this.setLines();
        this.setBoundingBox();
    }

    copyPoints() {
        let newPoints = [];
        this.pointArray.forEach(p => newPoints.push(new Point(p.x, p.y)));
        return newPoints;
    }

    setLines() {
        this.lineArray.push(new Line(this.pointArray.reduce((p1, p2) => {
            this.lineArray.push(new Line(p1, p2));
            return p2;
        }), this.pointArray[0]));
    }

    moveBy(dx, dy) {
        this.pointArray.forEach(p => p.moveBy(dx, dy));
        this.boundingBox.move(dx, dy);
    }

    setBoundingBox() {
        if (this.pointArray.length === 0)
            return;
        let minX = this.pointArray[0].x, maxX = minX, minY = this.pointArray[0].y, maxY = minY;
        this.pointArray.forEach(p => {
            if (p.x > maxX)
                maxX = p.x;
            if (p.x < minX)
                minX = p.x;
            if (p.y > maxY)
                maxY = p.y;
            if (p.y < minY)
                minY = p.y;
        })
        this.boundingBox = new BoundingBox(minX, minY, maxX, maxY);
    }

    scaleTo(factor) {
        let p0 = this.pointArray[0];
        this.pointArray.forEach(p => {
            p.x = p0.x + factor * (p.x - p0.x);
            p.y = p0.y + factor * (p.y - p0.y);
        });
        this.setBoundingBox();
    }

    compareTo(other) {
        let i1 = this.lines().iterator(), i2 = other.lines().iterator();
        let aux;
        let res1 = i1.next(), res2 = i2.next();
        while (!i1.done && !i2.done) {
            aux = res1.value.compareTo(res2.value());
            if (aux !== 0)
                return aux;
            res1 = i1.next();
            res2 = i2.next();
        }
        return 0;
    }

    intersectedBy(other) {
        return other.lines().some(l1 => this.boundingBox.cohenSutherlandLineClip(l1) && this.lines().some(l2 => l1.intersects(l2))); // cohenSutherlandLineClip is a fast algorithm to check whether a line is within a polygon's bounding box. Part of my futile efforts to make this viable for several players
    }

    points() {
        return this.pointArray.copyWithin(0);
    }

    lines() {
        return this.lineArray;
    }

    draw(context, strokeColor, fillColor) {

        // this.boundingBox.draw(context);

        this.lineArray.forEach(l => l.draw(context, strokeColor));
        context.fillStyle = fillColor;
        context.beginPath();
        context.moveTo(this.pointArray[0].x, this.pointArray[0].y);
        this.pointArray.forEach(p => context.lineTo(p.x, p.y));
        context.closePath();
        context.fill();
    }

    getPointCollection(strokeColor, fillColor) {
        return {fillColor: fillColor, strokeColor: strokeColor, points: this.copyPoints()};
    }

}

class MovingPolygon extends Polygon {
    constructor(velocity, direction, points) {
        super(points);
        this.xVelocity = velocity * Math.cos(direction);
        this.yVelocity = velocity * Math.sin(direction);
    }

    velocity() {
        return Math.sqrt(this.xVelocity * this.xVelocity + this.yVelocity * this.yVelocity);
    }
    direction(){
        return this.pointArray[0].angle(new Point(this.pointArray[0].x+this.dx(),this.pointArray[0].y+this.dy()));
    }

    changeDirection(newDirection) {
        let v = this.velocity();
        this.xVelocity = v * Math.cos(newDirection);
        this.yVelocity = v * Math.sin(newDirection);
    }
    changeDirBy(deltaDirection){
        this.changeDirection(this.direction() + deltaDirection);
    }

    move() {
        this.moveBy(this.dx(), this.dy());
    }

    dx() {
        return this.xVelocity;
    }

    dy() {
        return this.yVelocity;
    }
}

export class SpinningPolygon extends MovingPolygon {
    ANGLE_TOLERANCE = 0.1

    constructor(velocity, direction, centerPoint, points) {
        super(velocity, direction, points);
        this.centerPoint = centerPoint;
        this.angle = direction;
    }

    clone() {
        return new SpinningPolygon(this.velocity, this.direction, this.centerPoint.getClone(), this.copyPoints());
    }

    moveBy(dx, dy) {
        super.moveBy(dx, dy);
        if (!this.pointArray.some(p => p === this.centerPoint)) {
            this.centerPoint.moveBy(dx, dy);
        }
    }

    rotateBy(angle) {
        this.angle = (this.angle - angle) % (Math.PI * 2);
        this.pointArray.forEach(p => p.rotate_about(this.centerPoint, angle));
        this.setBoundingBox();
    }

    rotateTowards(point, angle) {
        let da = this.angle - this.pointArray[0].angle(point);
        if (Math.abs(da) > this.ANGLE_TOLERANCE) {
            if ((da > -2 * Math.PI && da < -Math.PI) || (da > 0 && da < Math.PI)) {
                this.rotateBy(angle);
            } else
                this.rotateBy(-angle);
        }
    }

    scaleTo(factor) {
        let p0 = this.pointArray[0];
        super.scaleTo(factor);
        if (!this.pointArray.some(p => p === this.centerPoint)) {
            this.centerPoint.moveBy(p0.x + factor * (this.centerPoint.x - p0.x), p0.y + factor * (this.centerPoint.y - p0.y));
        }

    }

    points() {
        let toRet = super.points();
        toRet.push(this.centerPoint);
        return toRet;
    }
}

export class fullPolygon extends SpinningPolygon {
    constructor(drag, thrust, velocity, direction, centerPoint, ...points) {
        super(velocity, direction, centerPoint, ...points);
        this.drag = drag;
        this.thrust = thrust;
    }

    doThrust() {
        this.xVelocity += this.thrust * Math.cos(this.angle);
        this.yVelocity += this.thrust * Math.sin(this.angle);
    }

    move() {
        super.move();
        this.doDrag();
    }

    doDrag() {
        this.xVelocity *= (1 - this.drag);
        this.yVelocity *= (1 - this.drag);
    }
}