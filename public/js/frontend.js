width = 1920;
height = 1080;
FPS_CAP = 60;
window.addEventListener('load', function () {
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');

    const socket = io();
    const devicePixelRatio = window.devicePixelRatio || 1;

    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;

    const frontendItems = [];

    socket.on('updatePlayers', (allItems) => {
        frontendItems.splice(0,frontendItems.length);
        allItems.forEach(i => frontendItems.push(i));
    })

    socket.on('dimensions', (dims) =>{
        canvas.width = dims.width * devicePixelRatio;
        canvas.height = dims.height * devicePixelRatio;
    })

    window.addEventListener('keydown', (event) => {
        socket.emit('keydown',event.key);
    })
    window.addEventListener('keyup', (event) => {
        socket.emit('keyup',event.key);
    })

    let lastTime = 0;
    function animate(timeStamp) {
        const deltaTime = timeStamp - lastTime;
        if(deltaTime >= 60 / this.FPS_CAP) {
            lastTime = timeStamp;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            frontendItems.forEach(pointCollection => draw(pointCollection));
        }
        requestAnimationFrame(animate);
    }

    animate();

    function draw(pointCollection){
        ctx.fillStyle = pointCollection.fillColor;
        if(pointCollection.points.length <= 1){
            ctx.fillStyle = pointCollection.fillColor;
            ctx.fillRect(pointCollection.points[0].x,pointCollection.points[0].y,4,4)
            return;
        }
        ctx.strokeStyle = pointCollection.strokeColor;
        ctx.beginPath();
        ctx.moveTo(pointCollection.points[0].x,pointCollection.points[0].y);
        pointCollection.points.forEach(p =>{
            ctx.lineTo(p.x,p.y)
        })
        ctx.lineTo(pointCollection.points[0].x,pointCollection.points[0].y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

});
