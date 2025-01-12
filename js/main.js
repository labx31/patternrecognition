// This function reloads the specific canvas element
function reinitializeCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (canvas) {
      const ctx = canvas.getContext('2d');
  
      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
  
      // Re-initialize the specific art piece
      if (canvasId === 'memoryCanvas' && typeof initializeMemoryCanvas === 'function') {
        initializeMemoryCanvas();
      }
      // Add more conditions here for other art pieces as we create their respective pages
    }
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    // Memory page refresh button
    const memoryRefreshButton = document.getElementById('refreshButton');
    if (memoryRefreshButton) {
      memoryRefreshButton.addEventListener('click', () => {
        reinitializeCanvas('memoryCanvas');
      });
    }
  
    // Add event listeners to other refresh buttons as needed
  });