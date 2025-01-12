// Helper function to calculate distance between two points
function distance(x1, y1, x2, y2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
}

class Agent {
  constructor(x, y, svgWidth, svgHeight) {
    this.x = x;
    this.y = y;
    this.size = 2 + Math.random(); // Reduced size variation
    this.vx = (Math.random() - 0.5) * 1; // Reduced velocity
    this.vy = (Math.random() - 0.5) * 1; // Reduced velocity
    this.baseColor = Math.random() * 360; // Base hue
    this.color = `hsl(${this.baseColor}, 70%, 50%)`;
    this.connections = [];
    this.maxConnections = 2; // Reduced max connections
    this.memory = [];
    this.maxMemory = 10; // Reduced memory length
    this.svgWidth = svgWidth;
    this.svgHeight = svgHeight;
  }

  update(agents) {
    this.connections = this.connections.filter(c => c.strength > 0);
    this.findConnections(agents);

    // Update velocity based on connections
    this.connections.forEach(conn => {
      const angle = Math.atan2(conn.to.y - this.y, conn.to.x - this.x);
      const strength = conn.strength * 0.025; // Reduced connection strength
      this.vx += Math.cos(angle) * strength;
      this.vy += Math.sin(angle) * strength;
    });

    // Add some random movement
    this.vx += (Math.random() - 0.5) * 0.1; // Reduced random movement
    this.vy += (Math.random() - 0.5) * 0.1; // Reduced random movement

    // Limit velocity
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    const maxSpeed = 1; // Reduced max speed
    if (speed > maxSpeed) {
      this.vx = (this.vx / speed) * maxSpeed;
      this.vy = (this.vy / speed) * maxSpeed;
    }

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Keep agent within bounds
    if (this.x < 0) this.x = this.svgWidth;
    if (this.x > this.svgWidth) this.x = 0;
    if (this.y < 0) this.y = this.svgHeight;
    if (this.y > this.svgHeight) this.y = 0;

    // Add current state to memory
    this.memory.push({ x: this.x, y: this.y });
    if (this.memory.length > this.maxMemory) {
      this.memory.shift();
    }
  }

  findConnections(agents) {
    const potentialConnections = agents
      .filter(agent => agent !== this && distance(this.x, this.y, agent.x, agent.y) < 80) // Reduced connection distance
      .map(agent => ({
        agent,
        distance: distance(this.x, this.y, agent.x, agent.y),
        patternSimilarity: this.calculatePatternSimilarity(agent)
      }))
      .filter(pc => pc.patternSimilarity > 0.8) // Increased similarity threshold
      .sort((a, b) => b.patternSimilarity - a.patternSimilarity) // Sort by similarity (descending)
      .slice(0, this.maxConnections);

    potentialConnections.forEach(pc => {
      const existingConnection = this.connections.find(c => c.to === pc.agent);
      if (existingConnection) {
        existingConnection.strength = Math.min(existingConnection.strength + 0.025, 1); // Reduced connection strength increment
      } else if (this.connections.length < this.maxConnections) {
        this.connections.push({ to: pc.agent, strength: 0.05 }); // Reduced initial connection strength
      }
    });

    // Decrease strength of connections not in potentialConnections
    this.connections.forEach(conn => {
      if (!potentialConnections.some(pc => pc.agent === conn.to)) {
        conn.strength -= 0.025; // Reduced connection strength decrement
      }
    });
  }

  // Calculate pattern similarity based on color (hue)
  calculatePatternSimilarity(otherAgent) {
    const hueDiff = Math.abs(this.baseColor - otherAgent.baseColor);
    const normalizedDiff = Math.min(hueDiff, 360 - hueDiff) / 180;
    return 1 - normalizedDiff;
  }

  draw(svg) {
    // Draw memory trail
    for (let i = 0; i < this.memory.length - 1; i++) {
      const start = this.memory[i];
      const end = this.memory[i + 1];
      const opacity = (i / this.memory.length) * 0.4; // Reduced trail opacity

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', start.x);
      line.setAttribute('y1', start.y);
      line.setAttribute('x2', end.x);
      line.setAttribute('y2', end.y);
      line.setAttribute('stroke', this.color);
      line.setAttribute('stroke-width', 0.5); // Reduced trail width
      line.setAttribute('opacity', opacity);
      svg.appendChild(line);
    }

    // Draw connections
    this.connections.forEach(conn => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', this.x);
      line.setAttribute('y1', this.y);
      line.setAttribute('x2', conn.to.x);
      line.setAttribute('y2', conn.to.y);
      line.setAttribute('stroke', this.color);
      line.setAttribute('stroke-width', conn.strength * 0.5); // Reduced connection width
      line.setAttribute('opacity', conn.strength * 0.4); // Reduced connection opacity
      svg.appendChild(line);
    });

    // Draw agent
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', this.x);
    circle.setAttribute('cy', this.y);
    circle.setAttribute('r', this.size);
    circle.setAttribute('fill', this.color);
    circle.setAttribute('opacity', 0.7); // Reduced agent opacity
    svg.appendChild(circle);
  }
}

// Function to create dynamic fields
function createFields(agents) {
  const fields = [];
  const clusters = findClusters(agents);

  clusters.forEach(cluster => {
    const center = calculateClusterCenter(cluster);
    const radius = calculateClusterRadius(cluster, center);
    const color = calculateClusterColor(cluster);

    fields.push({
      x: center.x,
      y: center.y,
      radius: radius,
      color: color,
      agents: cluster
    });
  });

  return fields;
}

// Function to find clusters using a simple distance-based approach
function findClusters(agents) {
  const clusters = [];
  const visited = new Set();

  agents.forEach(agent => {
    if (!visited.has(agent)) {
      const cluster = [];
      const queue = [agent];
      visited.add(agent);

      while (queue.length > 0) {
        const currentAgent = queue.shift();
        cluster.push(currentAgent);

        currentAgent.connections.forEach(conn => {
          const connectedAgent = conn.to;
          if (!visited.has(connectedAgent)) {
            visited.add(connectedAgent);
            queue.push(connectedAgent);
          }
        });
      }
      clusters.push(cluster);
    }
  });

  return clusters.filter(cluster => cluster.length >= 2); // Reduced cluster size
}

// Function to calculate the center of a cluster
function calculateClusterCenter(cluster) {
  let sumX = 0;
  let sumY = 0;
  cluster.forEach(agent => {
    sumX += agent.x;
    sumY += agent.y;
  });
  return {
    x: sumX / cluster.length,
    y: sumY / cluster.length
  };
}

// Function to calculate the radius of a cluster
function calculateClusterRadius(cluster, center) {
  let maxDistance = 0;
  cluster.forEach(agent => {
    const dist = distance(agent.x, agent.y, center.x, center.y);
    if (dist > maxDistance) {
      maxDistance = dist;
    }
  });
  return maxDistance + 10; // Reduced field radius
}

// Function to calculate the color of a cluster (weighted average based on agent connections)
function calculateClusterColor(cluster) {
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let totalWeight = 0;

  cluster.forEach(agent => {
    agent.connections.forEach(conn => {
      const weight = conn.strength;
      const color = conn.to.color.match(/\d+/g);
      totalR += parseInt(color[0]) * weight;
      totalG += parseInt(color[1]) * weight;
      totalB += parseInt(color[2]) * weight;
      totalWeight += weight;
    });
  });

  const r = totalWeight > 0 ? Math.round(totalR / totalWeight) : 0;
  const g = totalWeight > 0 ? Math.round(totalG / totalWeight) : 0;
  const b = totalWeight > 0 ? Math.round(totalB / totalWeight) : 0;

  return `hsl(${r}, ${g}%, ${b}%)`;
}

// Function to draw a field with a gradient and a blurred edge
function drawField(svg, field) {
  // Create a filter for the blur effect
  const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
  filter.setAttribute('id', `field-blur-${field.x}-${field.y}`);
  const blur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
  blur.setAttribute('in', 'SourceGraphic');
  blur.setAttribute('stdDeviation', '5'); // Reduced blur radius
  filter.appendChild(blur);
  svg.appendChild(filter);

  // Create a radial gradient for the field
  const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
  gradient.setAttribute('id', `gradient-${field.x}-${field.y}`);
  gradient.setAttribute('cx', '50%');
  gradient.setAttribute('cy', '50%');
  gradient.setAttribute('r', '50%');
  gradient.setAttribute('fx', '50%');
  gradient.setAttribute('fy', '50%');

  // Create gradient stops
  const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stop-color', field.color);
  stop1.setAttribute('stop-opacity', '0.4'); // Reduced opacity
  gradient.appendChild(stop1);

  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop2.setAttribute('offset', '90%'); // Fading out slightly before the edge
  stop2.setAttribute('stop-color', field.color);
  stop2.setAttribute('stop-opacity', '0.05'); // Reduced opacity
  gradient.appendChild(stop2);

  const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop3.setAttribute('offset', '100%');
  stop3.setAttribute('stop-color', field.color);
  stop3.setAttribute('stop-opacity', '0'); // Fully transparent at the edge
  gradient.appendChild(stop3);

  // Add the gradient to the SVG
  svg.appendChild(gradient);

  // Draw the field circle with the gradient and blur
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', field.x);
  circle.setAttribute('cy', field.y);
  circle.setAttribute('r', field.radius);
  circle.setAttribute('fill', `url(#gradient-${field.x}-${field.y})`);
  circle.setAttribute('filter', `url(#field-blur-${field.x}-${field.y})`); // Apply blur filter
  svg.appendChild(circle);
}

// Function to add a simplified bloom effect using a separate canvas
function addBloomEffect(svg, fields) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = svg.width.baseVal.value;
  canvas.height = svg.height.baseVal.value;
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.pointerEvents = 'none'; // Ensure the canvas doesn't interfere with mouse events
  svg.parentNode.insertBefore(canvas, svg); // Insert the canvas before the SVG

  function drawBloom() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'screen'; // Use screen blending mode

    // Draw fields with bloom (simplified)
    fields.forEach(field => {
      const glowSize = field.radius * 0.3; // Reduced glow size
      const gradient = ctx.createRadialGradient(field.x, field.y, 0, field.x, field.y, glowSize);
      gradient.addColorStop(0, `${field.color.replace('hsl', 'hsla').replace(')', ', 0.1)')}`); // Reduced opacity
      gradient.addColorStop(1, `${field.color.replace('hsl', 'hsla').replace(')', ', 0)')}`);

      ctx.beginPath();
      ctx.arc(field.x, field.y, glowSize, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();
    });

    ctx.globalCompositeOperation = 'source-over'; // Reset blending mode
  }

  return drawBloom;
}

function initializeIntelligence(svgId) {
  const svg = document.getElementById(svgId);
  const agents = [];
  const numAgents = 100; // Reduced number of agents

  // Create agents
  for (let i = 0; i < numAgents; i++) {
    agents.push(new Agent(
      Math.random() * svg.width.baseVal.value,
      Math.random() * svg.height.baseVal.value,
      svg.width.baseVal.value,
      svg.height.baseVal.value
    ));
  }

  let drawBloom = null; // Will hold the bloom drawing function

  function animate() {
    // Clear the SVG
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    // Update and draw agents
    agents.forEach(agent => {
      agent.update(agents);
      agent.draw(svg);
    });

    // Create and draw fields
    const fields = createFields(agents);
    fields.forEach(field => {
      drawField(svg, field);
    });

    // Initialize bloom effect (only on the first frame)
    if (!drawBloom) {
      drawBloom = addBloomEffect(svg, fields);
    }
    
    // Draw bloom effect on the separate canvas
    drawBloom();

    requestAnimationFrame(animate);
  }

  animate();
}

window.addEventListener('DOMContentLoaded', () => {
  initializeIntelligence('intelligenceSvg');
});