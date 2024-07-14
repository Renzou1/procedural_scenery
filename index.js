let waterIndex = 0;
let grassIndex = 1;
let archeryIndex = 0;
let barracksIndex = 1;
let homeAIndex = 2;
let homeBIndex = 3;
let marketIndex = 4;
let tavernIndex = 5;

let numberOfRows = 10;
let numberOfCols = 10;

let floor_matrix;
let buildings_matrix;

let floorOptions;
let buildingsOptions;

let z_distance_between_hexagons = 1.732; 

async function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector("#canvas");
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }
  // setup GLSL program
  var programInfo = twgl.createProgramInfo(gl, [vs, fs]);
  
  // Tell the twgl to match position with a_position, n
  // normal with a_normal etc..
  twgl.setAttributePrefix("a_");

  let waterInfo = await getObjInfo("hex_water.obj", gl, programInfo);
  let grassInfo = await getObjInfo("hex_grass.obj", gl, programInfo);
  let archeryInfo = await getObjInfo("building_church_blue.obj", gl, programInfo);
  let barracksInfo = await getObjInfo("building_barracks_blue.obj", gl, programInfo);
  let homeAInfo = await getObjInfo("building_home_A_blue.obj", gl, programInfo);
  let homeBInfo = await getObjInfo("building_home_B_blue.obj", gl, programInfo);
  let marketInfo = await getObjInfo("building_market_blue.obj", gl, programInfo);
  let tavernInfo = await getObjInfo("building_tavern_blue.obj", gl, programInfo);

  floorOptions = [waterInfo, grassInfo];
  buildingsOptions = [archeryInfo, barracksInfo, homeAInfo, homeBInfo, marketInfo, tavernInfo];

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var fieldOfViewRadians = degToRad(60);

  // Uniform for object position
  var currentUniforms = {
    u_matrix: m4.identity(),
  }

  let cameraPosition = [0, 2, 3];
  let target = [10, 2, 0];
  window.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
      cameraPosition[0] -= 0.2;
    }
    if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
      cameraPosition[0] += 0.2;
    }
    if (event.key === "ArrowDown" || event.key === "s" || event.key === "S") {
      cameraPosition[1] -= 0.2;
    }
    if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
      cameraPosition[1] += 0.2; 
    }

    if (event.key === " ") {
      cameraPosition[0] = 0;
      cameraPosition[1] = 2;
      cameraPosition[2] = 3;
    }
  });

  window.addEventListener("wheel", event => {
    const delta = Math.sign(event.deltaY);
    cameraPosition[2] += delta/5;
  });

  function computeMatrix(viewProjectionMatrix, translation, xRotation, yRotation) {
    var matrix = m4.translate(viewProjectionMatrix,
        translation[0],
        translation[1],
        translation[2]);
    matrix = m4.xRotate(matrix, xRotation);
    return m4.yRotate(matrix, yRotation);
  }

  function generateNewWorld(){
    floor_matrix = [];
    buildings_matrix = [];
    for (let i = 0; i < numberOfRows; i++) {
        floor_matrix[i] = [];
        buildings_matrix[i] = [];
        for (let j = 0; j < numberOfCols; j++) {
            buildings_matrix[i][j] = -1;
        }
    }

    for (let i = 0; i < numberOfRows; i++)
    {
      for(let j = 0; j < numberOfCols; j++)
      {
        floor_matrix[i][j] = Math.round(Math.random());
      }
    }
  }

  generateNewWorld(); 
  requestAnimationFrame(drawScene);

  // Draw the scene.
  function drawScene(time) {
    time = time * 0.001;
    twgl.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // Compute the projection matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix =
        m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

    // Compute the camera's matrix using look at.
    var up = [0, 1, 0];
    var cameraMatrix = m4.lookAt(cameraPosition, target, up);

    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);

    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    gl.useProgram(programInfo.program);

    let u_world = m4.yRotation(0);

    // declare all uniforms that are shared by all objects
    const sharedUniforms = {
      u_lightDirection: m4.normalize([-1, 3, 5]),
      u_view: viewMatrix,
      u_projection: projectionMatrix,
      u_viewWorldPosition: cameraPosition,
    };


    // set them internally
    twgl.setUniforms(programInfo, sharedUniforms);

    // draws floors
    for(let i = 0; i < numberOfRows; i++)
    {
      let z = z_distance_between_hexagons * i;
      for(let j = 0; j < numberOfCols; j++)
      {
        let currentIndex = floor_matrix[i][j];
        let translation = [2 * j + (i % 2), 0, z];
        let { bufferInfo, vao, material } = floorOptions[currentIndex];

        // Bind the VAO
        gl.bindVertexArray(vao);
        
        // Set the uniforms
        twgl.setUniforms(programInfo, {
          u_world,
        }, material);
        

        currentUniforms.u_matrix = m4.translate(viewProjectionMatrix, ...translation);
        twgl.setUniforms(programInfo, currentUniforms);
        // Draw the geometry
        twgl.drawBufferInfo(gl, bufferInfo);
      }
    }

    requestAnimationFrame(drawScene);
  }
}

main();
