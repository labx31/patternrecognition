class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
      this.history = [];
      this.maxHistory = 50;
      this.abstraction = Math.random();
    }
      
    update(flowFields, time) {
      const influences = flowFields.map(field => {
        const gridX = Math.floor(this.x / flowFieldResolution);
        const gridY = Math.floor(this.y / flowFieldResolution);
        return field[gridY]?.[gridX] || { dx: 0, dy: 0 };
      });
        
      this.vx = influences.reduce((acc, inf) => acc + inf.dx, 0) * 0.5;
      this.vy = influences.reduce((acc, inf) => acc + inf.dy, 0) * 0.5;
        
      this.x += this.vx;
      this.y += this.vy;
        
      if (this.x < 0) this.x = canvas.width;
      if (this.x > canvas.width) this.x = 0;
      if (this.y < 0) this.y = canvas.height;
      if (this.y > canvas.height) this.y = 0;
        
      this.history.push({ x: this.x, y: this.y });
      if (this.history.length > this.maxHistory) {
        this.history.shift();
      }
    }
      
    draw(ctx) {
      if (this.history.length < 2) return;
        
      ctx.beginPath();
      ctx.moveTo(this.history[0].x, this.history[0].y);
        
      for (let i = 1; i < this.history.length; i++) {
        const point = this.history[i];
        ctx.lineTo(point.x, point.y);
      }
        
      ctx.strokeStyle = `hsla(${this.abstraction * 240}, 70%, 50%, 0.1)`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  
  const canvas = document.getElementById('deepLearningCanvas');
  const ctx = canvas.getContext('2d');
  const particleCount = 1000;
  const flowFieldResolution = 20;
  const noise = new SimplexNoise();
  let particles = [];
  let flowFields = [];
  let time = 0;
  
  function createFlowField(scale) {
    const cols = Math.ceil(canvas.width / flowFieldResolution);
    const rows = Math.ceil(canvas.height / flowFieldResolution);
    const field = Array(rows).fill().map(() => Array(cols).fill().map(() => ({
      dx: 0,
      dy: 0
    })));
        
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const angle = noise.noise3D(x / scale, y / scale, time * 0.0002) * Math.PI * 2;
        field[y][x] = {
          dx: Math.cos(angle),
          dy: Math.sin(angle)
        };
      }
    }
    return field;
  }
  
  // Initialize particles
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle(
      Math.random() * canvas.width,
      Math.random() * canvas.height
    ));
  }
  
  function animate() {
    time++;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.01)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
        
    if (time % 60 === 0) {
      flowFields = [10, 20, 40].map(scale => createFlowField(scale));
    }
        
    particles.forEach(particle => {
      particle.update(flowFields, time);
      particle.draw(ctx);
    });
        
    requestAnimationFrame(animate);
  }
  
  // Initial flow fields creation
  flowFields = [10, 20, 40].map(scale => createFlowField(scale));
  
  // Initialize and run the animation
  window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('deepLearningCanvas');
      
    // Adjust canvas size for high-resolution displays
    const scale = window.devicePixelRatio;
    canvas.width = Math.floor(800 * scale);
    canvas.height = Math.floor(600 * scale);
    canvas.style.width = '800px';
    canvas.style.height = '600px';
    canvas.getContext('2d').scale(scale, scale);
      
    animate();
  });