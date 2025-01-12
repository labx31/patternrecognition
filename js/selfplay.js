class Pattern {
    constructor(x, y, rules) {
      this.points = [{x, y}];
      this.velocity = {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2
      };
      this.rules = rules;
      this.complexity = 0;
      this.selfInteractions = 0;
      this.success = 0;
      this.significance = 0;
    }
    
    update(canvas) {
      const lastPoint = this.points[this.points.length - 1];
      const newPoint = {
        x: lastPoint.x + this.velocity.x,
        y: lastPoint.y + this.velocity.y
      };
      
      if (newPoint.x < 0 || newPoint.x > canvas.width) {
        this.velocity.x *= -1;
        this.selfInteractions++;
      }
      if (newPoint.y < 0 || newPoint.y > canvas.height) {
        this.velocity.y *= -1; 
        this.selfInteractions++;
      }
      
      this.points.push(newPoint);
      if (this.points.length > 50) this.points.shift();
      
      this.observeSelf();
    }
    
    observeSelf() {
      for (let i = 0; i < this.points.length - 2; i++) {
        const dist = Math.hypot(
          this.points[i].x - this.points[this.points.length - 1].x,
          this.points[i].y - this.points[this.points.length - 1].y
        );
        if (dist < 20) {
          this.selfInteractions++;
          this.complexity += 0.1;
          
          this.velocity.x += (Math.random() - 0.5) * this.rules.mutationRate;
          this.velocity.y += (Math.random() - 0.5) * this.rules.mutationRate;
        }
      }
      
      this.success = (this.complexity * this.rules.complexityWeight + 
                     this.selfInteractions * this.rules.noveltyWeight) / 100;
      this.significance = Math.min(this.success, 1);
    }
    
    shouldSpawn() {
      return this.success > this.rules.spawnThreshold && Math.random() < 0.01;
    }
    
    spawn() {
      return new Pattern(
        this.points[this.points.length - 1].x,
        this.points[this.points.length - 1].y,
        this.rules
      );
    }
    
    getComplexity() { return this.complexity; }
    getSelfInteractions() { return this.selfInteractions; }
  }
  
  class PatternSystem {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.patterns = [];
      this.rules = {
        spawnThreshold: 0.7,
        mutationRate: 0.1,
        complexityWeight: 0.5,
        noveltyWeight: 0.5,
        threshold: 0.6
      };
      
      for (let i = 0; i < 5; i++) {
        this.patterns.push(new Pattern(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          this.rules
        ));
      }
    }
    
    updateMicroLevel() {
      this.patterns.forEach(pattern => {
        pattern.update(this.canvas);
      });
    }
    
    updateMesoLevel() {
      const newPatterns = [];
      this.patterns.forEach(pattern => {
        if (pattern.shouldSpawn()) {
          newPatterns.push(pattern.spawn());
        }
      });
      this.patterns.push(...newPatterns);
      
      if (this.patterns.length > 20) {
        this.patterns = this.patterns.slice(-20);
      }
    }
    
    updateMacroLevel() {
      const avgSuccess = this.patterns.reduce((sum, p) => sum + p.success, 0) / this.patterns.length;
      this.rules.mutationRate = 0.1 + (avgSuccess * 0.1);
    }
    
    update() {
      this.updateMicroLevel();
      this.updateMesoLevel();
      this.updateMacroLevel();
    }
    
    draw() {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.patterns.forEach(pattern => {
        if (pattern.points.length < 2) return;
        
        this.ctx.beginPath();
        this.ctx.moveTo(pattern.points[0].x, pattern.points[0].y);
        pattern.points.forEach(point => {
          this.ctx.lineTo(point.x, point.y);
        });
        
        this.ctx.strokeStyle = `hsla(${pattern.getComplexity() % 360}, 
          ${pattern.getSelfInteractions()}%, 
          ${50 + (pattern.success * 20)}%, 
          ${0.1 + (pattern.significance * 0.5)})`;
        this.ctx.stroke();
      });
    }
  }
  
  window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('selfPlayCanvas');
      
    // Adjust canvas size for high-resolution displays
    const scale = window.devicePixelRatio;
    canvas.width = Math.floor(800 * scale);
    canvas.height = Math.floor(600 * scale);
    canvas.style.width = '800px';
    canvas.style.height = '600px';
    canvas.getContext('2d').scale(scale, scale);
      
    const system = new PatternSystem(canvas);
  
    function animate() {
      system.update();
      system.draw();
      requestAnimationFrame(animate);
    }
  
    animate();
  });