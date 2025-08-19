import React from 'react';

export function DitheredBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Subtle dithered texture */}
      <div className="absolute inset-0 dithered-bg opacity-20"></div>
      
      {/* Gentle scanlines effect */}
      <div className="absolute inset-0 scanlines"></div>
      
      {/* Ambient light particles */}
      <div 
        className="absolute inset-0 opacity-5 float-animation"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(255, 42, 42, 0.3) 1px, transparent 1px),
            radial-gradient(circle at 80% 70%, rgba(0, 255, 136, 0.2) 1px, transparent 1px),
            radial-gradient(circle at 60% 20%, rgba(0, 170, 255, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px, 150px 150px, 120px 120px',
          backgroundPosition: '0 0, 50px 50px, 25px 75px'
        }}
      ></div>
      
      {/* Subtle grid overlay */}
      <div 
        className="absolute inset-0 opacity-3"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      ></div>

      {/* Ambient gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-blue-500/5"></div>
    </div>
  );
}