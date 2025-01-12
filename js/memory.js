// Particle System Classes
class Particle {
    constructor(x, y, layer, dimensions) {
      this.x = x;
      this.y = y;
      this.layer = layer;
      this.dimensions = dimensions;
      this.vx = (Math.random() - 0.5) * this.getSpeedByLayer();
      this.vy = (Math.random() - 0.5) * this.getSpeedByLayer();
      this.history = [];
      this.connections = [];
      this.intensity = 1;
    }
  
    getSpeedByLayer() {
      const speeds = {
        deep: 0.2,
        middle: 0.5,
        surface: 1
      };
      return speeds[this.layer] || 0.5;
    }
  
    update(particles, flowField) {
      flowField.addMemoryTrace(this.x, this.y, 0.05 * this.intensity);
  
      const fieldForce = flowField.getForce(this.x, this.y);
      this.vx += fieldForce.x * 0.1;
      this.vy += fieldForce.y * 0.1;
  
      this.x += this.vx;
      this.y += this.vy;
  
      if (this.x < 0) this.x = this.dimensions.width;
      if (this.x > this.dimensions.width) this.x = 0;
      if (this.y < 0) this.y = this.dimensions.height;
      if (this.y > this.dimensions.height) this.y = 0;
  
      this.history.push({ x: this.x, y: this.y });
      if (this.history.length > 50) this.history.shift();
  
      this.updateConnections(particles);
      this.intensity *= 0.995;
    }
  
    updateConnections(particles) {
      this.connections = particles
        .filter(p => p !== this && this.distanceTo(p) < 50)
        .slice(0, 3);
    }
  
    distanceTo(other) {
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      return Math.sqrt(dx * dx + dy * dy);
    }
  }
  
  class FlowField {
    constructor(dimensions) {
      this.dimensions = dimensions;
      this.resolution = 20;
      this.cols = Math.floor(dimensions.width / this.resolution);
      this.rows = Math.floor(dimensions.height / this.resolution);
      this.field = this.initField();
      this.time = 0;
      this.memoryTraces = Array(this.rows).fill().map(() => 
        Array(this.cols).fill().map(() => ({
          strength: 0,
          age: 0
        }))
      );
    }
  
    initField() {
      return Array(this.rows).fill().map((_, y) => 
        Array(this.cols).fill().map((_, x) => {
          const angle = Math.sin(x * 0.1) * Math.cos(y * 0.1) * Math.PI * 2;
          return { x: Math.cos(angle), y: Math.sin(angle) };
        })
      );
    }
  
    update() {
      this.time += 0.001;
  
      for (let y = 0; y < this.rows; y++) {
        for (let x = 0; x < this.cols; x++) {
          const angle = Math.sin(x * 0.1 + this.time) * Math.cos(y * 0.1 - this.time) * Math.PI * 2;
          this.field[y][x] = { 
            x: Math.cos(angle + this.time), 
            y: Math.sin(angle - this.time) 
          };
  
          const trace = this.memoryTraces[y][x];
          trace.strength *= 0.999;
          trace.age += 0.01;
        }
      }
    }
  
    getForce(x, y) {
      const col = Math.floor(x / this.resolution);
      const row = Math.floor(y / this.resolution);
  
      if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
        const baseForce = this.field[row][col];
        const trace = this.memoryTraces[row][col];
        const traceInfluence = Math.min(trace.strength, 0.8);
  
        return {
          x: baseForce.x * (1 - traceInfluence) + (Math.cos(trace.age) * traceInfluence),
          y: baseForce.y * (1 - traceInfluence) + (Math.sin(trace.age) * traceInfluence)
        };
      }
      return { x: 0, y: 0 };
    }
  
    addMemoryTrace(x, y, intensity) {
      const col = Math.floor(x / this.resolution);
      const row = Math.floor(y / this.resolution);
  
      if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
        const trace = this.memoryTraces[row][col];
        trace.strength = Math.min(trace.strength + intensity, 1);
      }
    }
  }
  
  // Initialize and animate the simulation
  function initializeMemory(canvasId) {
    const canvas = document.getElementById(canvasId);
    const dimensions = { width: canvas.width, height: canvas.height };
    const ctx = canvas.getContext('2d');
  
    const flowField = new FlowField(dimensions);
    const particles = [
      ...Array(20).fill().map(() => new Particle(
        Math.random() * dimensions.width,
        Math.random() * dimensions.height,
        'deep',
        dimensions
      )),
      ...Array(30).fill().map(() => new Particle(
        Math.random() * dimensions.width,
        Math.random() * dimensions.height,
        'middle',
        dimensions
      )),
      ...Array(50).fill().map(() => new Particle(
        Math.random() * dimensions.width,
        Math.random() * dimensions.height,
        'surface',
        dimensions
      ))
    ];
  
    function animate() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
  
      flowField.update();
  
      particles.forEach(particle => {
        particle.update(particles, flowField);
  
        ctx.beginPath();
        ctx.moveTo(particle.history[0]?.x, particle.history[0]?.y);
        particle.history.forEach(pos => {
          ctx.lineTo(pos.x, pos.y);
        });
  
        const alpha = particle.intensity * 0.5;
        const colors = {
          deep: `rgba(64, 96, 255, ${alpha})`,
          middle: `rgba(128, 192, 255, ${alpha})`,
          surface: `rgba(192, 224, 255, ${alpha})`
        };
        const lineWidths = { deep: 2, middle: 1.5, surface: 1 };
  
        ctx.strokeStyle = colors[particle.layer];
        ctx.lineWidth = lineWidths[particle.layer];
        ctx.stroke();
  
        particle.connections.forEach(other => {
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        });
      });
    }
    
    return { animate };
  }
  
  // Create a function to initialize the animation and attach it to the global scope
  window.initializeMemoryCanvas = () => {
    const canvas = document.getElementById('memoryCanvas');
    
    // Check if the canvas exists
    if (!canvas) {
      console.error('Canvas element with ID "memoryCanvas" not found.');
      return;
    }
  
    // Adjust canvas size for high-resolution displays
    const scale = window.devicePixelRatio;
    canvas.width = Math.floor(800 * scale);
    canvas.height = Math.floor(600 * scale);
    canvas.style.width = '800px';
    canvas.style.height = '600px';
    canvas.getContext('2d').scale(scale, scale);
    
    const memoryAnimation = initializeMemory('memoryCanvas');
    
    function loop() {
      memoryAnimation.animate();
      requestAnimationFrame(loop);
    }
    
    loop();
  };
  
  // Initialize the canvas when the page loads
  window.addEventListener('DOMContentLoaded', initializeMemoryCanvas);