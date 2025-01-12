const createSystemState = (depth = 0, parentState = null) => ({
    depth,
    iterations: 0,
    memory: new Map(),
    childStates: depth < 3 ? Array(3).fill().map((_, i) => 
      createSystemState(depth + 1, parentState)
    ) : [],
    transformationRules: generateTransformationRules(depth, parentState),
    boundaryConditions: defineBoundaryConditions(depth, parentState)
  });
  
  const generateTransformationRules = (depth, parentRules = null) => {
    const baseRules = {
      angle: (t) => t * Math.PI * 2,
      scale: (t) => 0.7 + Math.sin(t * 0.1) * 0.2,
      color: (t) => t * 60
    };
    
    if (depth === 0 || !parentRules) return baseRules;
    
    return {
      angle: (t) => parentRules.angle(t) * (1 + depth * 0.1),
      scale: (t) => parentRules.scale(t) * (0.9 - depth * 0.05),
      color: (t) => parentRules.color(t) + depth * 30
    };
  };
  
  const defineBoundaryConditions = (depth, parentConditions = null) => {
    const baseCondition = (size, iterations) => 
      Math.sin(iterations * 0.05) * 0.5 + 0.5;
    
    if (depth === 0) return baseCondition;
    
    return (size, iterations) => 
      baseCondition(size, iterations) * (1 - depth * 0.2);
  };
  
  const generatePattern = (svg, x, y, size, state, parentPattern = null) => {
    if (state.depth > 7) return;
  
    const rules = state.transformationRules;
    const angle = rules.angle(state.iterations);
    const scale = rules.scale(state.iterations);
    const color = rules.color(state.iterations);
  
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${x} ${y} l ${size} 0 l ${-size/2} ${size * Math.sqrt(3)/2} z`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', `hsla(${color}, 70%, 50%, ${0.8 - state.depth * 0.1})`);
    path.setAttribute('stroke-width', `${2 / (state.depth + 1)}`);
    path.setAttribute('transform', `rotate(${angle * 180/Math.PI}, ${x}, ${y})`);
    svg.appendChild(path);
  
    state.childStates.forEach((childState, i) => {
      const newAngle = angle + (i * Math.PI * 2) / 3;
      const newX = x + Math.cos(newAngle) * size * scale;
      const newY = y + Math.sin(newAngle) * size * scale;
      generatePattern(
        svg,
        newX, newY,
        size * scale,
        { ...childState, iterations: state.iterations + 1 },
        {x, y, size, angle}
      );
    });
  };
  
  const initializeRecursion = (svgId) => {
    const svg = document.getElementById(svgId);
    const systemState = createSystemState();
  
    const animate = () => {
      svg.innerHTML = ''; // Clear the SVG
      generatePattern(svg, 0, 0, 100, systemState);
  
      systemState.iterations++;
      systemState.childStates.forEach(child => {
        child.iterations++;
      });
  
      requestAnimationFrame(animate);
    };
  
    animate();
  };
  
  window.addEventListener('DOMContentLoaded', () => {
    initializeRecursion('recursionSVG');
  });