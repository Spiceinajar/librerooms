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

function regen() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  let loopTime = canvas.clientWidth * canvas.clientHeight / 15000;

  spots = [];
  for (let i = 0; i < loopTime; i++) {
    spots.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, rad: Math.random() * 10 });
  };
}
regen()

function updateAnim() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (var s in spots) {
    let spot = spots[s];

    spot.y += .1 * spot.rad;

    if (spot.y > (canvas.height + 10)) {
      spot.y = -10;
      spot.x = Math.random() * canvas.width;
      spot.rad = Math.random() * 10;
    }

    drawCircle(ctx, spot.x, spot.y, spot.rad, `rgb(100, 100, ${100 + (spot.rad * 10)})`, `rgb(120, 100, ${100 + (spot.rad * 10)})`, 1);
  };
};

window.onresize = regen;
window.setInterval(updateAnim, 16);