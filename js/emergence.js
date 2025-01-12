// Agent class implementation
class Agent {
    constructor(x, y, dimensions) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * 2;
      this.vy = (Math.random() - 0.5) * 2;
      this.phase = 'individual';
      this.neighbors = [];
      this.alignment = 0;
      this.cohesion = { x: 0, y: 0 };
      this.separation = { x: 0, y: 0 };
      this.history = [];
      this.maxHistory = 20;
      this.emergenceLevel = 0;
      this.dimensions = dimensions;
    }
  
    update(agents, diffusionField) {
      this.neighbors = agents.filter(agent => 
        agent !== this && this.distanceTo(agent) < 50
      );
  
      this.calculateAlignment();
      this.calculateCohesion();
      this.calculateSeparation();
      this.updatePhase();
      this.applyPhaseForces();
  
      const fieldForce = diffusionField.getForceAt(this.x, this.y);
      this.vx += fieldForce.x * 0.1;
      this.vy += fieldForce.y * 0.1;
  
      this.x += this.vx;
      this.y += this.vy;
  
      // Boundary wrapping
      if (this.x < 0) this.x = this.dimensions.width;
      if (this.x > this.dimensions.width) this.x = 0;
      if (this.y < 0) this.y = this.dimensions.height;
      if (this.y > this.dimensions.height) this.y = 0;
  
      this.history.push({ x: this.x, y: this.y });
      if (this.history.length > this.maxHistory) this.history.shift();
  
      diffusionField.addChemical(this.x, this.y, 0.1 * this.emergenceLevel);
    }
  
    calculateAlignment() {
      if (this.neighbors.length === 0) return;
      let avgVx = 0, avgVy = 0;
      this.neighbors.forEach(neighbor => {
        avgVx += neighbor.vx;
        avgVy += neighbor.vy;
      });
      this.alignment = Math.sqrt(
        (avgVx / this.neighbors.length) ** 2 + 
        (avgVy / this.neighbors.length) ** 2
      );
    }
  
    calculateCohesion() {
      if (this.neighbors.length === 0) return;
      let avgX = 0, avgY = 0;
      this.neighbors.forEach(neighbor => {
        avgX += neighbor.x;
        avgY += neighbor.y;
      });
      this.cohesion = {
        x: avgX / this.neighbors.length,
        y: avgY / this.neighbors.length
      };
    }
  
    calculateSeparation() {
      if (this.neighbors.length === 0) return;
      let sepX = 0, sepY = 0;
      this.neighbors.forEach(neighbor => {
        const dist = this.distanceTo(neighbor);
        sepX += (this.x - neighbor.x) / (dist * dist);
        sepY += (this.y - neighbor.y) / (dist * dist);
      });
      this.separation = { x: sepX, y: sepY };
    }
  
    updatePhase() {
      const alignmentStrength = this.alignment;
      const neighborCount = this.neighbors.length;
  
      if (neighborCount < 3) {
        this.phase = 'individual';
        this.emergenceLevel = 0;
      } else if (alignmentStrength > 0.8) {
        this.phase = 'collective';
        this.emergenceLevel = 1;
      } else {
        this.phase = 'clustering';
        this.emergenceLevel = 0.5;
      }
    }
  
    applyPhaseForces() {
      const maxSpeed = 2;
      const steerStrength = 0.1;
  
      switch(this.phase) {
        case 'individual':
          this.vx += (Math.random() - 0.5) * 0.2;
          this.vy += (Math.random() - 0.5) * 0.2;
          break;
        case 'clustering':
          this.vx += (this.cohesion.x - this.x) * steerStrength;
          this.vy += (this.cohesion.y - this.y) * steerStrength;
          break;
        case 'collective':
          this.vx += this.separation.x * steerStrength;
          this.vy += this.separation.y * steerStrength;
          break;
      }
  
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > maxSpeed) {
        this.vx = (this.vx / speed) * maxSpeed;
        this.vy = (this.vy / speed) * maxSpeed;
      }
    }
  
    distanceTo(other) {
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      return Math.sqrt(dx * dx + dy * dy);
    }
  
    draw(ctx) {
      if (this.history.length > 1) {
        ctx.beginPath();
        ctx.moveTo(this.history[0].x, this.history[0].y);
        this.history.forEach(pos => ctx.lineTo(pos.x, pos.y));
        
        let hue, saturation, lightness, alpha;
        switch(this.phase) {
          case 'individual':
            hue = 220;
            saturation = 70;
            lightness = 60;
            alpha = 0.2;
            break;
          case 'clustering':
            hue = 280;
            saturation = 80;
            lightness = 65;
            alpha = 0.3;
            break;
          case 'collective':
            hue = 340;
            saturation = 90;
            lightness = 70;
            alpha = 0.4;
            break;
        }
        
        ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
        ctx.lineWidth = 1 + this.emergenceLevel;
        ctx.stroke();
      }
    }
  }
  
  // DiffusionField class implementation
  class DiffusionField {
    constructor(dimensions) {
      this.resolution = 20;
      this.cols = Math.ceil(dimensions.width / this.resolution);
      this.rows = Math.ceil(dimensions.height / this.resolution);
      this.field = Array(this.rows).fill().map(() => 
        Array(this.cols).fill().map(() => ({
          chemical: 0,
          vx: 0,
          vy: 0
        }))
      );
    }
  
    update() {
      const newField = Array(this.rows).fill().map(() => 
        Array(this.cols).fill().map(() => ({
          chemical: 0,
          vx: 0,
          vy: 0
        }))
      );
  
      for (let y = 0; y < this.rows; y++) {
        for (let x = 0; x < this.cols; x++) {
          let sum = 0;
          let count = 0;
          
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const ny = (y + dy + this.rows) % this.rows;
              const nx = (x + dx + this.cols) % this.cols;
              sum += this.field[ny][nx].chemical;
              count++;
            }
          }
          
          newField[y][x].chemical = (sum / count) * 0.99;
          
          const dx = this.field[y][(x + 1) % this.cols].chemical - 
                    this.field[y][(x - 1 + this.cols) % this.cols].chemical;
          const dy = this.field[(y + 1) % this.rows][x].chemical - 
                    this.field[(y - 1 + this.rows) % this.rows][x].chemical;
          
          newField[y][x].vx = dx * 0.1;
          newField[y][x].vy = dy * 0.1;
        }
      }
      
      this.field = newField;
    }
  
    addChemical(x, y, amount) {
      const gridX = Math.floor(x / this.resolution);
      const gridY = Math.floor(y / this.resolution);
      
      if (gridX >= 0 && gridX < this.cols && gridY >= 0 && gridY < this.rows) {
        this.field[gridY][gridX].chemical += amount;
      }
    }
  
    getForceAt(x, y) {
      const gridX = Math.floor(x / this.resolution);
      const gridY = Math.floor(y / this.resolution);
      
      if (gridX >= 0 && gridX < this.cols && gridY >= 0 && gridY < this.rows) {
        return {
          x: this.field[gridY][gridX].vx,
          y: this.field[gridY][gridX].vy
        };
      }
      return { x: 0, y: 0 };
    }
  
    draw(ctx) {
      for (let y = 0; y < this.rows; y++) {
        for (let x = 0; x < this.cols; x++) {
          const chemical = this.field[y][x].chemical;
          if (chemical > 0.01) {
            ctx.fillStyle = `rgba(255, 255, 255, ${chemical * 0.1})`;
            ctx.fillRect(
              x * this.resolution,
              y * this.resolution,
              this.resolution,
              this.resolution
            );
          }
        }
      }
    }
  }
  
  // Initialize and run the animation
  window.addEventListener('DOMContentLoaded', () => {
    // Main initialization
    const canvas = document.getElementById('emergenceCanvas');
    const ctx = canvas.getContext('2d');
    
    const dimensions = {
      width: canvas.width,
      height: canvas.height
    };
      
    // Adjust canvas size for high-resolution displays
    const scale = window.devicePixelRatio;
    canvas.width = Math.floor(800 * scale);
    canvas.height = Math.floor(600 * scale);
    canvas.style.width = '800px';
    canvas.style.height = '600px';
    ctx.scale(scale, scale);
    
    // Create agents and diffusion field
    const agents = Array(200).fill().map(() => new Agent(
      Math.random() * dimensions.width,
      Math.random() * dimensions.height,
      dimensions
    ));
    
    const diffusionField = new DiffusionField(dimensions);
    
    // Animation loop
    function animate() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
      
      diffusionField.update();
      diffusionField.draw(ctx);
      
      agents.forEach(agent => {
        agent.update(agents, diffusionField);
        agent.draw(ctx);
      });
      
      requestAnimationFrame(animate);
    }
    
    animate();
  });