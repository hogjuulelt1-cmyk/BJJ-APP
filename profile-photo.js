/* Client-side profile cropping. Only the 50px JPEG leaves the browser. */
(function () {
  'use strict';
  window.ARROW_PHOTO = {
    async crop(host, file, onChange, isCurrent, size = 50) {
      const url = URL.createObjectURL(file), image = new Image();
      try { image.src = url; await image.decode(); }
      finally { URL.revokeObjectURL(url); }
      if (!host.isConnected || (isCurrent && !isCurrent())) return;
      host.innerHTML = '<p class="lbl">Crop your photo</p><p class="muted small">Drag to position. Zoom to crop.</p><canvas class="avatar-crop" width="360" height="360" tabindex="0" role="img" aria-label="Photo crop: drag or use arrow keys to position"></canvas><label class="crop-zoom">Zoom<input type="range" min="1" max="4" step="0.01" value="1" aria-label="Photo zoom"></label><p class="muted small">Saved as ' + size + ' × ' + size + ' px</p>';
      const canvas = host.querySelector('canvas'), slider = host.querySelector('input');
      const state = { zoom: 1, x: 0, y: 0 }, side = 360;
      const fit = side / Math.min(image.naturalWidth, image.naturalHeight);
      function paint() {
        const scale = fit * state.zoom;
        const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
        state.x = Math.max(-(width-side)/2, Math.min((width-side)/2, state.x));
        state.y = Math.max(-(height-side)/2, Math.min((height-side)/2, state.y));
        const x = (side-width)/2+state.x, y = (side-height)/2+state.y;
        const context = canvas.getContext('2d');
        context.fillStyle = '#fff'; context.fillRect(0, 0, side, side);
        context.drawImage(image, x, y, width, height);
        const output = document.createElement('canvas'); output.width = output.height = size;
        const out = output.getContext('2d');
        out.imageSmoothingEnabled = true; out.imageSmoothingQuality = 'high';
        out.drawImage(canvas, 0, 0, size, size);
        onChange(output.toDataURL('image/jpeg', 0.72));
      }
      slider.oninput = () => { state.zoom = +slider.value; paint(); };
      let previous = null;
      canvas.onpointerdown = (event) => { previous = { x: event.clientX, y: event.clientY }; canvas.setPointerCapture(event.pointerId); };
      canvas.onpointermove = (event) => {
        if (!previous) return;
        const factor = side / canvas.getBoundingClientRect().width;
        state.x += (event.clientX-previous.x)*factor; state.y += (event.clientY-previous.y)*factor;
        previous = { x: event.clientX, y: event.clientY }; paint();
      };
      canvas.onpointerup = canvas.onpointercancel = () => { previous = null; };
      canvas.onkeydown = (event) => {
        const steps = { ArrowLeft: [-12,0], ArrowRight: [12,0], ArrowUp: [0,-12], ArrowDown: [0,12] };
        if (!steps[event.key]) return;
        event.preventDefault(); state.x += steps[event.key][0]; state.y += steps[event.key][1]; paint();
      };
      paint();
    }
  };
})();
