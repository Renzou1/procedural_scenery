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

  var waterInfo = await getObjInfo("hex_water.obj", gl, programInfo);

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var fieldOfViewRadians = degToRad(60);

  // Uniforms for each object.
  var waterUniforms = {
    u_matrix: m4.identity(),
  }

  var waterXRotation  = 0;
  var waterYRotation  = 0;
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
      cameraPosition[2] += 0.2;
    }
    if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
      cameraPosition[2] -= 0.2; 
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
    // declare all uniforms that are shared by all objects
    const sharedUniforms = {
      u_lightDirection: m4.normalize([-1, 3, 5]),
      u_view: viewMatrix,
      u_projection: projectionMatrix,
      u_viewWorldPosition: cameraPosition,
    };
    // set them internally
    twgl.setUniforms(programInfo, sharedUniforms);

    // ------ Repeat for all objects --------

    var waterTranslation  = [0, 0, 0];
    waterYRotation = 0;
    let u_world = m4.yRotation(0);
    waterUniforms.u_matrix = m4.translate(viewProjectionMatrix, ...waterTranslation);

    // Set the uniforms we just computed
    twgl.setUniforms(programInfo, waterUniforms);

    let { bufferInfo, vao, material } = waterInfo[0]; // make water Info be a singular element later

    // Bind the VAO
    gl.bindVertexArray(vao);
    
    // Set the uniforms
    twgl.setUniforms(programInfo, {
      u_world,
    }, material);
    
    // Draw the geometry
    twgl.drawBufferInfo(gl, bufferInfo);

    let z_distance_between_hexagons = 1.732; 

    for(let i = 0; i < 10; i++)
    {
      waterTranslation[0] += 2;
      waterUniforms.u_matrix = waterUniforms.u_matrix = m4.translate(viewProjectionMatrix, ...waterTranslation);
      twgl.setUniforms(programInfo, waterUniforms);
      // Draw the geometry
      twgl.drawBufferInfo(gl, bufferInfo);      
    }

    waterTranslation[1] = 1;
    for(let i = 0; i < 10; i++)
    {
      waterTranslation  = [1 + 2 * i, 0, z_distance_between_hexagons];
      waterUniforms.u_matrix = waterUniforms.u_matrix = m4.translate(viewProjectionMatrix, ...waterTranslation);

      twgl.setUniforms(programInfo, waterUniforms);
      // Draw the geometry
      twgl.drawBufferInfo(gl, bufferInfo);
    }

    // when done
    requestAnimationFrame(drawScene);
  }
}

main();
