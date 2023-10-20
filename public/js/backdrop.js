let canvas = document.getElementById('login_anim');
let ctx = canvas.getContext('2d');


function project(x, y, z) {
  // Define the isometric projection factors
  const factorX = Math.cos(Math.PI / 6);
  const factorY = Math.sin(Math.PI / 6);
  
  // Perform the isometric projection
  const projectedX = (x - y) * factorX;
  const projectedY = (x + y) * factorY - z;
  
  // Return the projected coordinates in a list
  return [projectedX, projectedY];
}

var spots;

function regen() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  let size;

  size = canvas.width+canvas.height;

  spots = [];
  let density = 100;
  for (var x = 0; x < (size / density); x++) {
    var column = [];
    for (var y = 0; y < (size / density); y++) {
      let proj = project((x*1.1) * density, (y*1.1) * density, 0);

      let yval = proj[1] - (canvas.height / 2);
      let xval = proj[0] + (canvas.width / 2);
      yval -= 80;

      column.push({x:xval, y:yval, depth:(Math.random() - .5)*3, direction:'up', anchor:yval+((Math.random() - .5)*20)});
    };

    spots.push(column);
  };
}
regen()

function updateAnim() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    var x;
    var y;

    ctx.clearRect(0,0,canvas.width,canvas.height);

    var index_y = 0;
    for (var c in spots) {
      let col = spots[c];
      var index_x = 0;
      for (var s in col) {
        let spot = col[s];

        spots[index_y][index_x].depth += (spot.y - spot.anchor)/80

        spots[index_y][index_x].y -= spots[index_y][index_x].depth;

        x = spot.x;
        y = spot.y;

        try {
          ctx.beginPath();
          ctx.strokeStyle = `rgb(60, 60, 100)`;
          ctx.moveTo(x, y);
          ctx.lineTo(spots[index_y][index_x + 1]['x'], spots[index_y][index_x + 1]['y']);
          ctx.lineTo(spots[index_y + 1][index_x + 1]['x'], spots[index_y + 1][index_x + 1]['y']);
          ctx.stroke();
        } catch {}

        index_x += 1;
      };

      index_y += 1;
    };
};

setInterval(updateAnim, 60);

window.addEventListener("resize", regen);