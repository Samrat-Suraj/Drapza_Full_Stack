'use client';

import React, { useEffect, useRef } from 'react';

export const DotMatrixHero = ({
  color = '#969992',
  dotSize = 2,
  spacing = 5,
  opacity = 0.9,
  delay = 1.125
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId = null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      if (!canvas) return;
      const w = canvas.offsetWidth || canvas.parentElement?.offsetWidth || window.innerWidth;
      const h = canvas.offsetHeight || canvas.parentElement?.offsetHeight || window.innerHeight;
      canvas.width = Math.max(w * dpr, 100);
      canvas.height = Math.max(h * dpr, 100);
    };
    resize();
    window.addEventListener('resize', resize);

    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => resize());
      if (canvas.parentElement) ro.observe(canvas.parentElement);
      ro.observe(canvas);
    }

    // Parse hex color into normalized rgb
    let r = 150 / 255;
    let g = 153 / 255;
    let b = 146 / 255;
    const hexMatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    if (hexMatch) {
      r = parseInt(hexMatch[1], 16) / 255;
      g = parseInt(hexMatch[2], 16) / 255;
      b = parseInt(hexMatch[3], 16) / 255;
    }

    // Try WebGL2
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false
    });

    if (gl) {
      const vsSource = `#version 300 es
        precision highp float;
        in vec2 coordinates;
        uniform vec2 u_resolution;
        out vec2 fragCoord;
        void main(void) {
          gl_Position = vec4(coordinates, 0.0, 1.0);
          fragCoord = (coordinates + 1.0) * 0.5 * u_resolution;
          fragCoord.y = u_resolution.y - fragCoord.y;
        }
      `;

      const fsSource = `#version 300 es
        precision highp float;
        in vec2 fragCoord;
        uniform float u_time;
        uniform vec2 u_resolution;
        out vec4 fragColor;

        const float u_total_size = ${Number(spacing).toFixed(2)};
        const float u_dot_size = ${Number(dotSize).toFixed(2)};
        const float u_base_opacity = ${Number(opacity).toFixed(2)};
        const float u_delay = ${Number(delay).toFixed(2)};

        const float PHI = 1.61803398874989484820459;

        float random(vec2 xy) {
          return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
        }

        void main() {
          vec2 st = fragCoord.xy;
          st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));

          float op = step(0.0, st.x) * step(0.0, st.y);
          vec2 st2 = vec2(floor(st.x / u_total_size), floor(st.y / u_total_size));

          float show_offset = random(st2);
          float rand = random(st2 * floor((u_time / 5.0) + show_offset + 5.0) + 1.0);

          op *= u_base_opacity * (0.35 + 0.65 * rand);
          op *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
          op *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

          ${delay > 0 ? `
          // Center expansion ripple
          float intro_offset = distance(u_resolution / 2.0 / u_total_size, st2) * 0.01 + (random(st2) * 0.15);
          op *= step(intro_offset, u_time - u_delay);
          op *= clamp((1.0 - step(intro_offset + 0.1, u_time - u_delay)) * 1.25, 1.0, 1.25);
          ` : ''}

          vec3 col = vec3(${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)});
          fragColor = vec4(col, op);
          fragColor.rgb *= fragColor.a;
        }
      `;

      const compileShader = (type, src) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vs = compileShader(gl.VERTEX_SHADER, vsSource);
      const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);

      if (vs && fs) {
        const prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        gl.useProgram(prog);

        const posBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
          gl.STATIC_DRAW
        );

        const posLoc = gl.getAttribLocation(prog, 'coordinates');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        const resLoc = gl.getUniformLocation(prog, 'u_resolution');
        const timeLoc = gl.getUniformLocation(prog, 'u_time');

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        let start = null;
        const render = (now) => {
          if (!start) start = now;
          const elapsed = (now - start) / 1000;

          gl.viewport(0, 0, canvas.width, canvas.height);
          gl.uniform2f(resLoc, canvas.width / dpr, canvas.height / dpr);
          gl.uniform1f(timeLoc, elapsed);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

          animId = requestAnimationFrame(render);
        };
        animId = requestAnimationFrame(render);

        return () => {
          cancelAnimationFrame(animId);
          window.removeEventListener('resize', resize);
          if (ro) ro.disconnect();
        };
      }
    }

    // 2D Canvas Fallback
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const render2D = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.03;

      const totalSize = spacing * dpr;
      const size = dotSize * dpr;

      ctx.fillStyle = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${opacity})`;

      for (let x = 0; x < canvas.width; x += totalSize) {
        for (let y = 0; y < canvas.height; y += totalSize) {
          const noise = Math.sin(x * 0.005 + time) * Math.cos(y * 0.005 + time);
          if (noise > 0) {
            ctx.fillRect(x, y, size, size);
          }
        }
      }
      animId = requestAnimationFrame(render2D);
    };
    animId = requestAnimationFrame(render2D);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      if (ro) ro.disconnect();
    };
  }, [color, dotSize, spacing, opacity, delay]);

  return (
    <div className="dot-matrix-wrapper absolute inset-0 w-full h-full pointer-events-none will-change-transform -z-10 [transform:translateZ(0)]">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="w-full h-full block"
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
};
