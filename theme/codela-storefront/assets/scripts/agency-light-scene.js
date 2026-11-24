/* Codela architectural spotlight canvas, adapted from approved source. */
(() => {
      // Support each editor-managed Studio instance without touching other pages.
      document.querySelectorAll('.sf-agency-widget--studio .codela-monolith').forEach(container => {
      const canvas = container ? container.querySelector('.codela-monolith__canvas') : null;
      const toggleBtn = container ? container.querySelector('.codela-monolith__control') : null;
      if (!container || !canvas) return;

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      const finePointer = window.matchMedia('(pointer: fine)');

      let width = 0;
      let height = 0;
      let dpr = 1;
      let rafId = 0;
      let isPaused = false;
      let isVisible = true;
      let isReduced = reducedQuery.matches;
      let elapsed = 0;
      let lastTime = 0;
      let lastDraw = 0;
      let drawCost = 0;
      let initialized = false;
      const frameBudget = () => Math.min(100, Math.max(finePointer.matches ? 33 : 50, drawCost * 2.4));
      function paint(time) {
        const start = performance.now();
        drawScene(time);
        const cost = performance.now() - start;
        drawCost = drawCost ? drawCost * .75 + cost * .25 : cost;
      }
      let pointerX = 0;
      let pointerY = 0;
      let smoothPointerX = 0;
      let smoothPointerY = 0;

      // Subtle precomputed studio micro-grain for silky matte obsidian finish
      const grainCanvas = document.createElement('canvas');
      grainCanvas.width = 160;
      grainCanvas.height = 160;
      const gCtx = grainCanvas.getContext('2d');
      if (gCtx) {
        const img = gCtx.createImageData(160, 160);
        const d = img.data;
        let seed = 4219;
        for (let i = 0; i < d.length; i += 4) {
          seed = (seed * 16807) % 2147483647;
          const v = (seed & 255);
          d[i] = v;
          d[i + 1] = v;
          d[i + 2] = v;
          d[i + 3] = 6;
        }
        gCtx.putImageData(img, 0, 0);
      }
      let grainPattern = null;

      function lerp(a, b, t) {
        return a + (b - a) * t;
      }

      function clamp(v, min, max) {
        return v < min ? min : v > max ? max : v;
      }

      function smoothstep(edge0, edge1, x) {
        const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
        return t * t * (3 - 2 * t);
      }

      function getStage() {
        const targetAspect = 1.32;
        let sw = width;
        let sh = height;
        if (width / height > targetAspect) {
          sh = height;
          sw = sh * targetAspect;
        } else {
          sw = width;
          sh = sw / targetAspect;
        }
        const scale = width < 640 ? 1.08 : 1.0;
        sw *= scale;
        sh *= scale;
        const ox = (width - sw) * 0.5;
        const oy = (height - sh) * 0.5;
        return { ox, oy, sw, sh };
      }

      function pt(stage, nx, ny) {
        return {
          x: stage.ox + nx * stage.sw,
          y: stage.oy + ny * stage.sh
        };
      }

      // Evaluate warm diagonal light shaft intensity at normalized (nx, ny)
      function beamIntensity(nx, ny, shift) {
        const beamCenter = (nx - (0.45 + shift)) * 0.84 - (ny - 0.36) * 0.54;
        const core = Math.exp(-(beamCenter * beamCenter) / (2 * 0.095 * 0.095));
        const halo = Math.exp(-(beamCenter * beamCenter) / (2 * 0.185 * 0.185));
        const vFade = smoothstep(0.1, 0.3, ny) * (1 - 0.16 * smoothstep(0.68, 0.92, ny));
        return clamp((core * 0.92 + halo * 0.28) * vFade, 0, 1);
      }

      // Draw off-camera diagonal warm light shaft in studio air (no round spotlight source)
      function drawDiagonalAirShaft(stage, lightShift, intensity, frontPass) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        // Seamless full-viewport perpendicular gradient (zero hard polygon edges)
        const cx = stage.ox + stage.sw * (0.44 + lightShift * 0.95);
        const cy = stage.oy + stage.sh * 0.44;
        const perpSpan = stage.sw * (frontPass ? 0.22 : 0.28);
        const angle = 0.88;
        const dx = Math.cos(angle) * perpSpan;
        const dy = -Math.sin(angle) * perpSpan;

        const airGrad = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
        const peak = frontPass ? 0.085 * intensity : 0.16 * intensity;
        airGrad.addColorStop(0, 'rgba(231, 207, 178, 0)');
        airGrad.addColorStop(0.22, `rgba(222, 188, 146, ${peak * 0.32})`);
        airGrad.addColorStop(0.5, `rgba(252, 230, 198, ${peak})`);
        airGrad.addColorStop(0.78, `rgba(218, 182, 140, ${peak * 0.32})`);
        airGrad.addColorStop(1, 'rgba(231, 207, 178, 0)');

        ctx.fillStyle = airGrad;
        ctx.fillRect(0, 0, width, height);

        // Soft vertical atmospheric fade so the shaft dissolves naturally toward the floor
        if (!frontPass) {
          const entryGlow = ctx.createRadialGradient(
            stage.ox + stage.sw * (0.16 + lightShift * 0.6),
            stage.oy - stage.sh * 0.04,
            0,
            stage.ox + stage.sw * (0.16 + lightShift * 0.6),
            stage.oy - stage.sh * 0.04,
            stage.sw * 0.52
          );
          entryGlow.addColorStop(0, `rgba(248, 224, 190, ${0.13 * intensity})`);
          entryGlow.addColorStop(0.5, `rgba(215, 182, 142, ${0.045 * intensity})`);
          entryGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = entryGlow;
          ctx.fillRect(0, 0, width, height);
        }

        ctx.restore();
      }

      function drawScene(timeSec) {
        const stage = getStage();

        // Smooth opening reveal + clearly visible slow architectural light sweep
        const intro = isReduced ? 1 : smoothstep(0, 1.5, timeSec);
        const drift = isReduced ? 0 : Math.sin(timeSec * 0.52) * 0.105 + Math.sin(timeSec * 0.23) * 0.025;
        const lightShift = drift + smoothPointerX * 0.055;
        const breathe = isReduced ? 1 : 0.92 + 0.08 * Math.cos(timeSec * 0.52);

        // 1. Seamless dark studio backdrop & floor
        const horizonY = stage.oy + stage.sh * 0.745;

        const wallGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
        wallGrad.addColorStop(0, '#08090c');
        wallGrad.addColorStop(0.55, '#0c0d11');
        wallGrad.addColorStop(1, '#101116');
        ctx.fillStyle = wallGrad;
        ctx.fillRect(0, 0, width, horizonY + 2);

        // Matte studio floor
        const floorGrad = ctx.createLinearGradient(0, horizonY, 0, height);
        floorGrad.addColorStop(0, '#0b0c10');
        floorGrad.addColorStop(0.28, '#08090c');
        floorGrad.addColorStop(1, '#050507');
        ctx.fillStyle = floorGrad;
        ctx.fillRect(0, horizonY, width, height - horizonY);

        // Soft studio horizon transition
        const seamGrad = ctx.createLinearGradient(0, horizonY - 14, 0, horizonY + 18);
        seamGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        seamGrad.addColorStop(0.5, 'rgba(22, 23, 28, 0.5)');
        seamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = seamGrad;
        ctx.fillRect(0, horizonY - 14, width, 32);

        // Background pass of the off-camera diagonal warm light shaft cutting through studio air
        drawDiagonalAirShaft(stage, lightShift, intro * breathe, false);

        // Monolith coordinates (back-right architectural obsidian block)
        const mTL = pt(stage, 0.392, 0.274);
        const mTR = pt(stage, 0.662, 0.236);
        const mBR = pt(stage, 0.662, 0.828);
        const mBL = pt(stage, 0.392, 0.812);
        const mSideTR = pt(stage, 0.752, 0.264);
        const mSideBR = pt(stage, 0.752, 0.805);

        // Fluted glass panel coordinates (front-left tall ribbed glass)
        const gTL = pt(stage, 0.256, 0.186);
        const gTR = pt(stage, 0.528, 0.122);
        const gBR = pt(stage, 0.528, 0.836);
        const gBL = pt(stage, 0.256, 0.806);

        // 2. Ground contact shadow under monolith & glass
        ctx.save();
        const shGrad = ctx.createRadialGradient(
          stage.ox + stage.sw * 0.54,
          stage.oy + stage.sh * 0.825,
          stage.sw * 0.04,
          stage.ox + stage.sw * 0.54,
          stage.oy + stage.sh * 0.825,
          stage.sw * 0.34
        );
        shGrad.addColorStop(0, 'rgba(2, 2, 4, 0.92)');
        shGrad.addColorStop(0.55, 'rgba(3, 3, 5, 0.48)');
        shGrad.addColorStop(1, 'rgba(3, 3, 5, 0)');
        ctx.fillStyle = shGrad;
        ctx.beginPath();
        ctx.ellipse(
          stage.ox + stage.sw * 0.52,
          stage.oy + stage.sh * 0.836,
          stage.sw * 0.33,
          stage.sh * 0.052,
          0.02,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.restore();

        // 3. Pronounced horizontal warm champagne caustic light streak on floor to the right
        ctx.save();
        const cStart = pt(stage, 0.526, 0.838);
        const cEnd = pt(stage, 0.96 + lightShift * 0.55, 0.828);
        const causticAlpha = (0.48 + 0.16 * Math.cos(timeSec * 0.52)) * intro;
        const cGrad = ctx.createLinearGradient(cStart.x, cStart.y, cEnd.x, cEnd.y);
        cGrad.addColorStop(0, `rgba(252, 226, 188, ${causticAlpha * 0.9})`);
        cGrad.addColorStop(0.28, `rgba(232, 198, 152, ${causticAlpha * 0.72})`);
        cGrad.addColorStop(0.68, `rgba(196, 160, 118, ${causticAlpha * 0.26})`);
        cGrad.addColorStop(1, 'rgba(196, 160, 118, 0)');

        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = cGrad;
        ctx.beginPath();
        ctx.moveTo(cStart.x, cStart.y - 3);
        ctx.lineTo(cEnd.x, cEnd.y - 5.5);
        ctx.lineTo(cEnd.x, cEnd.y + 6.5);
        ctx.lineTo(cStart.x, cStart.y + 5);
        ctx.closePath();
        ctx.fill();

        const cBloom = ctx.createRadialGradient(
          stage.ox + stage.sw * (0.69 + lightShift * 0.35),
          stage.oy + stage.sh * 0.834,
          2,
          stage.ox + stage.sw * (0.69 + lightShift * 0.35),
          stage.oy + stage.sh * 0.834,
          stage.sw * 0.25
        );
        cBloom.addColorStop(0, `rgba(242, 212, 172, ${causticAlpha * 0.3})`);
        cBloom.addColorStop(1, 'rgba(235, 204, 165, 0)');
        ctx.fillStyle = cBloom;
        ctx.fillRect(cStart.x - 20, cStart.y - 40, stage.sw * 0.54, 80);
        ctx.restore();

        // 4. Matte Obsidian Monolith — Front Face (receiving luminous diagonal champagne shaft)
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(mTL.x, mTL.y);
        ctx.lineTo(mTR.x, mTR.y);
        ctx.lineTo(mBR.x, mBR.y);
        ctx.lineTo(mBL.x, mBL.y);
        ctx.closePath();
        ctx.clip();

        const monoBase = ctx.createLinearGradient(mTL.x, mTL.y, mBR.x, mBR.y);
        monoBase.addColorStop(0, '#1e1d20');
        monoBase.addColorStop(0.5, '#141518');
        monoBase.addColorStop(1, '#0b0c0f');
        ctx.fillStyle = monoBase;
        ctx.fillRect(mTL.x - 2, mTR.y - 2, mTR.x - mTL.x + 4, mBR.y - mTR.y + 4);

        // Rich, unmistakable diagonal warm champagne light band on the monolith face
        const beamAngle = 0.9;
        const bCx = stage.ox + stage.sw * (0.545 + lightShift);
        const bCy = stage.oy + stage.sh * (0.52 + smoothPointerY * 0.025);
        const span = stage.sw * 0.29;
        const dx = Math.cos(beamAngle) * span;
        const dy = -Math.sin(beamAngle) * span;

        const beamGrad = ctx.createLinearGradient(bCx - dx, bCy - dy, bCx + dx, bCy + dy);
        const k = intro * breathe;
        beamGrad.addColorStop(0, 'rgba(18, 16, 15, 0)');
        beamGrad.addColorStop(0.2, `rgba(116, 92, 68, ${0.44 * k})`);
        beamGrad.addColorStop(0.37, `rgba(218, 182, 140, ${0.88 * k})`);
        beamGrad.addColorStop(0.5, `rgba(255, 232, 196, ${0.98 * k})`);
        beamGrad.addColorStop(0.63, `rgba(210, 172, 130, ${0.82 * k})`);
        beamGrad.addColorStop(0.8, `rgba(92, 72, 54, ${0.34 * k})`);
        beamGrad.addColorStop(1, 'rgba(14, 14, 16, 0)');

        ctx.fillStyle = beamGrad;
        ctx.fillRect(mTL.x - 2, mTR.y - 2, mTR.x - mTL.x + 4, mBR.y - mTR.y + 4);

        // Warm floor bounce along lower monolith edge
        const bounceGrad = ctx.createLinearGradient(0, mBR.y - stage.sh * 0.22, 0, mBR.y);
        bounceGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        bounceGrad.addColorStop(1, `rgba(182, 146, 108, ${0.18 * k})`);
        ctx.fillStyle = bounceGrad;
        ctx.fillRect(mTL.x, mBR.y - stage.sh * 0.22, mTR.x - mTL.x, stage.sh * 0.24);

        // Natural vignette falloff on monolith corners
        const cornerShade = ctx.createLinearGradient(mTR.x, mTR.y, mBL.x, mBL.y);
        cornerShade.addColorStop(0, 'rgba(7, 8, 10, 0.66)');
        cornerShade.addColorStop(0.25, 'rgba(7, 8, 10, 0)');
        cornerShade.addColorStop(0.76, 'rgba(7, 8, 10, 0)');
        cornerShade.addColorStop(1, 'rgba(5, 6, 8, 0.78)');
        ctx.fillStyle = cornerShade;
        ctx.fillRect(mTL.x - 2, mTR.y - 2, mTR.x - mTL.x + 4, mBR.y - mTR.y + 4);

        if (grainPattern) {
          ctx.fillStyle = grainPattern;
          ctx.fillRect(mTL.x, mTR.y, mTR.x - mTL.x, mBR.y - mTR.y);
        }
        ctx.restore();

        // 5. Matte Obsidian Monolith — Right Side Face
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(mTR.x, mTR.y);
        ctx.lineTo(mSideTR.x, mSideTR.y);
        ctx.lineTo(mSideBR.x, mSideBR.y);
        ctx.lineTo(mBR.x, mBR.y);
        ctx.closePath();

        const sideGrad = ctx.createLinearGradient(mTR.x, mTR.y, mSideBR.x, mSideBR.y);
        sideGrad.addColorStop(0, '#36373b');
        sideGrad.addColorStop(0.36, '#232428');
        sideGrad.addColorStop(0.74, '#111216');
        sideGrad.addColorStop(1, '#08090b');
        ctx.fillStyle = sideGrad;
        ctx.fill();

        if (grainPattern) {
          ctx.clip();
          ctx.fillStyle = grainPattern;
          ctx.fillRect(mTR.x, mTR.y, mSideTR.x - mTR.x, mBR.y - mTR.y);
        }
        ctx.restore();

        // Crisp architectural ridge highlight between front & side faces
        ctx.save();
        const ridgeGrad = ctx.createLinearGradient(mTR.x, mTR.y, mBR.x, mBR.y);
        ridgeGrad.addColorStop(0, 'rgba(196, 186, 174, 0.45)');
        ridgeGrad.addColorStop(0.35, 'rgba(182, 164, 144, 0.26)');
        ridgeGrad.addColorStop(0.65, `rgba(244, 214, 174, ${0.32 * k})`);
        ridgeGrad.addColorStop(1, 'rgba(90, 82, 74, 0.12)');
        ctx.strokeStyle = ridgeGrad;
        ctx.lineWidth = 1.15;
        ctx.beginPath();
        ctx.moveTo(mTR.x, mTR.y);
        ctx.lineTo(mBR.x, mBR.y);
        ctx.stroke();

        const topMonoGrad = ctx.createLinearGradient(mTL.x, mTL.y, mTR.x, mTR.y);
        topMonoGrad.addColorStop(0, 'rgba(244, 214, 176, 0.38)');
        topMonoGrad.addColorStop(0.6, 'rgba(204, 186, 164, 0.24)');
        topMonoGrad.addColorStop(1, 'rgba(160, 154, 148, 0.28)');
        ctx.strokeStyle = topMonoGrad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(mTL.x, mTL.y);
        ctx.lineTo(mTR.x, mTR.y);
        ctx.lineTo(mSideTR.x, mSideTR.y);
        ctx.stroke();
        ctx.restore();

        // 6. Soft elliptical floor glow under the glass panel
        ctx.save();
        const glassFloorGrad = ctx.createRadialGradient(
          stage.ox + stage.sw * (0.45 + lightShift * 0.2),
          stage.oy + stage.sh * 0.835,
          stage.sw * 0.02,
          stage.ox + stage.sw * (0.45 + lightShift * 0.2),
          stage.oy + stage.sh * 0.835,
          stage.sw * 0.24
        );
        glassFloorGrad.addColorStop(0, `rgba(236, 208, 172, ${0.18 * intro})`);
        glassFloorGrad.addColorStop(0.55, `rgba(186, 160, 130, ${0.055 * intro})`);
        glassFloorGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glassFloorGrad;
        ctx.beginPath();
        ctx.ellipse(
          stage.ox + stage.sw * (0.45 + lightShift * 0.2),
          stage.oy + stage.sh * 0.84,
          stage.sw * 0.24,
          stage.sh * 0.038,
          0.03,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.restore();

        // 7. Tall Translucent Fluted / Ribbed Glass Panel (24 perspective-foreshortened cylindrical lenses)
        const fluteCount = 24;
        const stops = [];
        for (let i = 0; i <= fluteCount; i++) {
          stops.push(Math.pow(i / fluteCount, 0.94));
        }

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(gTL.x, gTL.y);
        ctx.lineTo(gTR.x, gTR.y);
        ctx.lineTo(gBR.x, gBR.y);
        ctx.lineTo(gBL.x, gBL.y);
        ctx.closePath();
        const glassTint = ctx.createLinearGradient(gTL.x, gTL.y, gTR.x, gBR.y);
        glassTint.addColorStop(0, 'rgba(18, 19, 22, 0.4)');
        glassTint.addColorStop(0.55, 'rgba(24, 22, 20, 0.28)');
        glassTint.addColorStop(1, 'rgba(16, 15, 16, 0.46)');
        ctx.fillStyle = glassTint;
        ctx.fill();
        ctx.clip();

        for (let i = 0; i < fluteCount; i++) {
          const u0 = stops[i];
          const u1 = stops[i + 1];
          const um = (u0 + u1) * 0.5;

          const x0 = lerp(gTL.x, gTR.x, u0);
          const x1 = lerp(gTL.x, gTR.x, u1);
          const fw = x1 - x0;
          const topY0 = lerp(gTL.y, gTR.y, u0);
          const topY1 = lerp(gTL.y, gTR.y, u1);
          const botY0 = lerp(gBL.y, gBR.y, u0);
          const botY1 = lerp(gBL.y, gBR.y, u1);

          const nx = lerp(0.256, 0.528, um);
          const overlapMonolith = nx >= 0.386;
          const monoTopNorm = lerp(0.274, 0.236, clamp((nx - 0.392) / (0.662 - 0.392), 0, 1));
          const monoTopY = stage.oy + monoTopNorm * stage.sh;

          // Also catch subtle diagonal air-shaft grazing light even on left flutes!
          const airGlint = beamIntensity(nx + 0.04, 0.34, lightShift) * 0.42;
          const litTop = overlapMonolith ? beamIntensity(nx + 0.014, monoTopNorm + 0.05, lightShift) : 0;
          const litMid = overlapMonolith ? beamIntensity(nx + 0.012, 0.46, lightShift) : 0;
          const litLow = overlapMonolith ? beamIntensity(nx + 0.01, 0.68, lightShift) : 0;
          const fluteWarmth = Math.max(litTop, litMid, litLow, airGlint) * intro * breathe;

          const reedGrad = ctx.createLinearGradient(x0, 0, x1, 0);
          const edgeBright = 0.22 + fluteWarmth * 0.42;
          const warmR = Math.round(lerp(204, 252, fluteWarmth));
          const warmG = Math.round(lerp(202, 228, fluteWarmth));
          const warmB = Math.round(lerp(198, 190, fluteWarmth));

          reedGrad.addColorStop(0.0, 'rgba(6, 7, 9, 0.86)');
          reedGrad.addColorStop(0.14, `rgba(${warmR}, ${warmG}, ${warmB}, ${edgeBright})`);
          reedGrad.addColorStop(0.32, `rgba(14, 14, 17, ${0.74 - fluteWarmth * 0.3})`);
          reedGrad.addColorStop(0.54, `rgba(${warmR}, ${warmG}, ${warmB}, ${0.09 + fluteWarmth * 0.32})`);
          reedGrad.addColorStop(0.76, 'rgba(10, 10, 13, 0.78)');
          reedGrad.addColorStop(0.91, `rgba(${warmR}, ${warmG}, ${warmB}, ${0.14 + fluteWarmth * 0.28})`);
          reedGrad.addColorStop(1.0, 'rgba(5, 6, 8, 0.9)');

          ctx.fillStyle = reedGrad;
          ctx.beginPath();
          ctx.moveTo(x0, topY0);
          ctx.lineTo(x1 + 0.4, topY1);
          ctx.lineTo(x1 + 0.4, botY1);
          ctx.lineTo(x0, botY0);
          ctx.closePath();
          ctx.fill();

          // Vertically refracted warm champagne glow inside overlapping flutes
          if (overlapMonolith && fluteWarmth > 0.02) {
            const vGrad = ctx.createLinearGradient(0, monoTopY - 6, 0, botY1);
            vGrad.addColorStop(0, 'rgba(255, 232, 196, 0)');
            vGrad.addColorStop(0.03, `rgba(255, 232, 196, ${clamp(litTop * 0.88 * intro, 0, 0.9)})`);
            vGrad.addColorStop(0.35, `rgba(238, 202, 158, ${clamp(litMid * 0.76 * intro, 0, 0.82)})`);
            vGrad.addColorStop(0.76, `rgba(190, 154, 112, ${clamp(litLow * 0.38 * intro, 0, 0.48)})`);
            vGrad.addColorStop(1, 'rgba(130, 104, 76, 0.04)');

            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = vGrad;
            const innerX = x0 + fw * 0.15;
            const innerW = fw * 0.56;
            ctx.fillRect(innerX, monoTopY - 4, innerW, botY1 - monoTopY + 4);
            ctx.restore();
          }

          // Fine vertical specular filament along each flute crest
          const crestAlpha = (0.15 + (1 - Math.abs(um - 0.55)) * 0.12 + fluteWarmth * 0.28) * intro;
          const crestGrad = ctx.createLinearGradient(0, topY0, 0, botY0);
          crestGrad.addColorStop(0, `rgba(252, 238, 218, ${crestAlpha * 1.18})`);
          crestGrad.addColorStop(0.45, `rgba(240, 220, 194, ${crestAlpha})`);
          crestGrad.addColorStop(0.85, `rgba(194, 176, 154, ${crestAlpha * 0.38})`);
          crestGrad.addColorStop(1, `rgba(226, 204, 176, ${crestAlpha * 0.72})`);

          ctx.strokeStyle = crestGrad;
          ctx.lineWidth = Math.max(0.85, fw * 0.095);
          ctx.beginPath();
          ctx.moveTo(x0 + fw * 0.18, topY0);
          ctx.lineTo(x0 + fw * 0.18, botY0);
          ctx.stroke();
        }
        ctx.restore();

        // 8. Polished glass panel thickness & bevel highlights
        ctx.save();
        const rimW = Math.max(2.5, stage.sw * 0.0042);
        const rimGrad = ctx.createLinearGradient(0, gTR.y, 0, gBR.y);
        rimGrad.addColorStop(0, `rgba(252, 236, 212, ${0.65 * intro})`);
        rimGrad.addColorStop(0.28, `rgba(238, 210, 174, ${0.48 * intro})`);
        rimGrad.addColorStop(0.65, `rgba(175, 152, 128, ${0.22 * intro})`);
        rimGrad.addColorStop(0.92, `rgba(222, 196, 162, ${0.38 * intro})`);
        rimGrad.addColorStop(1, `rgba(250, 228, 196, ${0.62 * intro})`);
        ctx.fillStyle = rimGrad;
        ctx.fillRect(gTR.x - rimW * 0.35, gTR.y, rimW, gBR.y - gTR.y);

        const topBevel = ctx.createLinearGradient(gTL.x, gTL.y, gTR.x, gTR.y);
        topBevel.addColorStop(0, 'rgba(224, 218, 210, 0.3)');
        topBevel.addColorStop(0.65, 'rgba(240, 226, 206, 0.46)');
        topBevel.addColorStop(1, 'rgba(255, 240, 216, 0.72)');
        ctx.strokeStyle = topBevel;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(gTL.x, gTL.y);
        ctx.lineTo(gTR.x + rimW * 0.6, gTR.y);
        ctx.stroke();

        const botBevel = ctx.createLinearGradient(gBL.x, gBL.y, gBR.x, gBR.y);
        botBevel.addColorStop(0, 'rgba(180, 172, 162, 0.14)');
        botBevel.addColorStop(0.7, 'rgba(224, 200, 168, 0.32)');
        botBevel.addColorStop(1, 'rgba(252, 228, 194, 0.62)');
        ctx.strokeStyle = botBevel;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(gBL.x, gBL.y);
        ctx.lineTo(gBR.x + rimW * 0.6, gBR.y);
        ctx.stroke();
        ctx.restore();

        // 9. Subtle foreground atmospheric light pass so the diagonal shaft visibly wraps the scene
        drawDiagonalAirShaft(stage, lightShift, intro * breathe, true);
      }

      function resize() {
        const rect = container.getBoundingClientRect();
        const nextWidth = Math.max(1, Math.round(rect.width));
        const nextHeight = Math.max(1, Math.round(rect.height));
        const nextDpr = Math.min(window.devicePixelRatio || 1, finePointer.matches ? 1.5 : 1);
        if (width === nextWidth && height === nextHeight && dpr === nextDpr && initialized) return;
        width = nextWidth; height = nextHeight; dpr = nextDpr;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        grainPattern = ctx.createPattern(grainCanvas, 'repeat');
        paint(isReduced ? 2.4 : elapsed);
      }

      function tick(now) {
        if (!lastTime) lastTime = now;
        const dt = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        if (!isPaused && isVisible && !isReduced) {
          // Keep the last painted image while native stage scrolling owns the frame.
          if (document.documentElement.classList.contains('sf-agency-stage-moving')) {
            rafId = window.requestAnimationFrame(tick);
            return;
          }
          elapsed += dt;
          smoothPointerX += (pointerX - smoothPointerX) * 0.055;
          smoothPointerY += (pointerY - smoothPointerY) * 0.055;
          if (now-lastDraw >= frameBudget()) { paint(elapsed); lastDraw=now; }
          rafId = window.requestAnimationFrame(tick);
        } else {
          rafId = 0;
        }
      }

      function syncLoop() {
        const shouldRun = initialized && !isPaused && isVisible && !isReduced && !document.hidden;
        if (shouldRun && !rafId) {
          lastTime = 0;
          rafId = window.requestAnimationFrame(tick);
        } else if (!shouldRun && rafId) {
          window.cancelAnimationFrame(rafId);
          rafId = 0;
        }
        if (isReduced && initialized && isVisible && !document.hidden) {
          paint(2.4);
        }
      }

      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          isPaused = !isPaused;
          container.dataset.paused = String(isPaused);
          toggleBtn.setAttribute('aria-pressed', String(isPaused));
          toggleBtn.setAttribute('aria-label', isPaused ? 'Animasyonu sürdür' : 'Animasyonu duraklat');
          syncLoop();
        });
      }

      if (finePointer.matches) {
        container.addEventListener('pointermove', (e) => {
          const rect = container.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          pointerX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
          pointerY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        });
        container.addEventListener('pointerleave', () => {
          pointerX = 0;
          pointerY = 0;
        });
      }

      window.addEventListener('resize', () => { if (initialized) resize(); }, { passive: true });
      if ('ResizeObserver' in window) {
        const sizeObserver = new ResizeObserver(() => { if (initialized) resize(); });
        sizeObserver.observe(container);
      }
      document.addEventListener('visibilitychange', syncLoop);

      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(
          ([entry]) => {
            isVisible = entry.isIntersecting;
            syncLoop();
          },
          { threshold: 0 }
        );
        observer.observe(container);
      }

      reducedQuery.addEventListener('change', (e) => {
        isReduced = e.matches;
        syncLoop();
      });

      requestAnimationFrame(() => requestAnimationFrame(() => {
        elapsed = 1.5;
        resize();
        initialized = true;
        container.dataset.sceneReady = 'true';
        syncLoop();
      }));
      });
    })();
