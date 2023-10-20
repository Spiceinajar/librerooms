let canvas = document.getElementById('login_anim');
let ctx = canvas.getContext('2d');

function drawCircle(ctx, x, y, radius, fill, stroke, strokeWidth) {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false)
    if (fill) {
      ctx.fillStyle = fill
      ctx.fill()
    }
    if (stroke) {
      ctx.lineWidth = strokeWidth
      ctx.strokeStyle = stroke
      ctx.stroke()
    }
};

var spots;

const loopTime = 100;
function regen() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  spots = [];
  for (let i = 0; i < loopTime; i++) {
    spots.push({x:Math.random() * canvas.width, y:Math.random() * canvas.height, rad:Math.random() * 10, col:Math.random() * 55, depth:Math.random() * 10});
  };
}
regen()

function updateAnim(event) {
    var mouseX = event.clientX;
    var mouseY = event.clientY;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    ctx.clearRect(0,0,canvas.width,canvas.height);
    for (var s in spots) {
        let spot = spots[s];

        let x = (spot.x - ((mouseX / 8) / spot.depth) / 2)
        let y = (spot.y - ((mouseY / 8) / spot.depth) / 2)

        drawCircle(ctx, x, y, spot.rad, `rgb(50, 50, ${200 + spot.col})`, `rgb(50, 50, ${200 + spot.col})`, 1);
    };
};

window.onresize = regen;
document.addEventListener('mousemove', updateAnim);