class AttentionVisualization {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas.getContext('2d');
      this.particles = [];
      this.attentionFields = [];
      this.time = 0;
      
      this.init();
      this.animate();
    }
  
    init() {
      // Create particles
      for(let i = 0; i < 1000; i++) {
        this.particles.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2
        });
      }
  
      // Create attention fields
      for(let i = 0; i < 3; i++) {
        this.attentionFields.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          strength: Math.random() * 2 - 1,
          phase: Math.random() * Math.PI * 2,
          frequency: 0.5 + Math.random()
        });
      }
    }
  
    updateParticles() {
      this.particles = this.particles.map(particle => {
        let fx = 0;
        let fy = 0;
        
        this.attentionFields.forEach(field => {
          const dx = particle.x - field.x;
          const dy = particle.y - field.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const strength = field.strength * Math.sin(this.time * field.frequency + field.phase);
          
          fx += (dx / (distance + 1)) * strength;
          fy += (dy / (distance + 1)) * strength;
        });
  
        const vx = (particle.vx - fx * 0.1) * 0.99;
        const vy = (particle.vy - fy * 0.1) * 0.99;
        const x = (particle.x + vx + this.canvas.width) % this.canvas.width;
        const y = (particle.y + vy + this.canvas.height) % this.canvas.height;
  
        return { x, y, vx, vy };
      });
    }
  
    draw() {
      // Clear with fade effect
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  
      // Draw particles
      this.ctx.beginPath();
      const particleColor = `hsla(${this.time * 10 % 360}, 70%, 70%, 0.6)`;
      this.ctx.fillStyle = particleColor;
      
      this.particles.forEach(particle => {
        this.ctx.moveTo(particle.x, particle.y);
        this.ctx.arc(particle.x, particle.y, 1, 0, Math.PI * 2);
      });
      this.ctx.fill();
  
      // Draw attention fields
      this.attentionFields.forEach(field => {
        const strength = field.strength * Math.sin(this.time * field.frequency + field.phase);
        const radius = Math.abs(strength) * 40;
        
        const gradient = this.ctx.createRadialGradient(
          field.x, field.y, 0,
          field.x, field.y, radius
        );
        
        const alpha = Math.abs(strength) * 0.5;
        if (strength > 0) {
          gradient.addColorStop(0, `rgba(255, 210, 230, ${alpha})`);
          gradient.addColorStop(0.4, `rgba(230, 140, 180, ${alpha * 0.7})`);
          gradient.addColorStop(1, 'rgba(180, 100, 140, 0)');
        } else {
          gradient.addColorStop(0, `rgba(210, 230, 255, ${alpha})`);
          gradient.addColorStop(0.4, `rgba(140, 180, 230, ${alpha * 0.7})`);
          gradient.addColorStop(1, 'rgba(100, 140, 180, 0)');
        }
  
        // Main field
        this.ctx.beginPath();
        this.ctx.arc(field.x, field.y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
  
        // Bloom effect
        this.ctx.beginPath();
        this.ctx.arc(field.x, field.y, radius * 0.5, 0, Math.PI * 2);
        this.ctx.fillStyle = strength > 0 
          ? `rgba(255, 230, 240, ${alpha * 0.3})`
          : `rgba(230, 240, 255, ${alpha * 0.3})`;
        this.ctx.fill();
      });
    }
  
    animate = () => {
      this.updateParticles();
      this.draw();
      this.time += 0.01;
      requestAnimationFrame(this.animate);
    }
  }
  
  // Initialize visualization
  window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('attentionCanvas');
      
    // Adjust canvas size for high-resolution displays
    const scale = window.devicePixelRatio;
    canvas.width = Math.floor(800 * scale);
    canvas.height = Math.floor(600 * scale);
    canvas.style.width = '800px';
    canvas.style.height = '600px';
    canvas.getContext('2d').scale(scale, scale);
      
    new AttentionVisualization('attentionCanvas');
  });