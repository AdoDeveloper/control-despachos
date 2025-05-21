import React from 'react';
import { useState, useEffect } from 'react';

const Loader = () => {
  const [loadingDots, setLoadingDots] = useState('');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <AnimatedLogoSVG />
      <div className="mt-2 text-xl font-bold text-gray-600 flex items-center">
        <span>Cargando</span>
        <span className="w-10 text-left">{loadingDots}</span>
      </div>
    </div>
  );
};

// Componente del SVG animado - Solo el logo como loader
const AnimatedLogoSVG = () => (
  <svg 
    width="150" 
    height="150" 
    viewBox="0 0 374 300" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className="animated-logo"
  >
    {/* Fondo transparente */}
    <rect width="374" height="300" fill="transparent"/>
    
    {/* Grupo principal del icono con animaciones */}
    <g className="main-icon">
      {/* Flechas naranjas con animación de opacidad */}
      <path 
        className="animate-pulse"
        style={{
          animationDelay: '0.2s',
          animationDuration: '1.5s'
        }}
        d="M192 237H152.5L180 221L281 84.5L253 64L346 49.5L356.5 139L333 125L291 180.5L265.5 215L250 237H243H226H192Z" 
        fill="#FF6508" 
      />
      <path 
        className="animate-pulse"
        style={{
          animationDelay: '0.5s',
          animationDuration: '1.3s'
        }}
        d="M36.5 243L130 235.5L93.5 210L184.5 87.5L197.5 73L203 69.5L209 67.5L226 63L141 59H125.5L118 66L41 173.5L17 150.5L36.5 243Z" 
        fill="#FF6508" 
      />
      
      {/* Bordes blancos */}
      <path d="M192 237H152.5L180 221L281 84.5L253 64L346 49.5L356.5 139L333 125L291 180.5L265.5 215L250 237H243H226H192Z" stroke="white" strokeWidth="1.5" />
      <path d="M36.5 243L130 235.5L93.5 210L184.5 87.5L197.5 73L203 69.5L209 67.5L226 63L141 59H125.5L118 66L41 173.5L17 150.5L36.5 243Z" stroke="white" strokeWidth="1.5" />
      
      {/* Rectángulos coloreados con animación de parpadeo escalonada */}
      <rect 
        className="animate-pulse" 
        style={{animationDelay: '0.1s'}}
        x="202.603" y="73" width="29.512" height="29.512" transform="rotate(36.6166 202.603 73)" 
        fill="#FF6508" 
      />
      <rect 
        className="animate-pulse" 
        style={{animationDelay: '0.2s'}}
        x="181.603" y="101" width="29.512" height="29.512" transform="rotate(36.6166 181.603 101)" 
        fill="#D9D9D9" 
      />
      <rect 
        className="animate-pulse" 
        style={{animationDelay: '0.3s'}}
        x="160.603" y="129" width="29.512" height="29.512" transform="rotate(36.6166 160.603 129)" 
        fill="#808082" 
      />
      <rect 
        className="animate-pulse" 
        style={{animationDelay: '0.4s'}}
        x="139.603" y="157" width="29.512" height="29.512" transform="rotate(36.6166 139.603 157)" 
        fill="#D9D9D9" 
      />
      <rect 
        className="animate-pulse" 
        style={{animationDelay: '0.5s'}}
        x="119.603" y="184" width="29.512" height="29.512" transform="rotate(36.6166 119.603 184)" 
        fill="#130C6F" 
      />
      <rect 
        className="animate-pulse" 
        style={{animationDelay: '0.6s'}}
        x="189.603" y="150" width="29.512" height="29.512" transform="rotate(36.6166 189.603 150)" 
        fill="#111393" 
      />
      <rect 
        className="animate-pulse" 
        style={{animationDelay: '0.7s'}}
        x="168.603" y="178" width="29.512" height="29.512" transform="rotate(36.6166 168.603 178)" 
        fill="#FF6508" 
      />
      <rect 
        className="animate-pulse" 
        style={{animationDelay: '0.8s'}}
        x="231.603" y="94" width="29.512" height="29.512" transform="rotate(36.6166 231.603 94)" 
        fill="#D9D9D9" 
      />
      <rect 
        className="animate-pulse" 
        style={{animationDelay: '0.9s'}}
        x="210.603" y="122" width="29.512" height="29.512" transform="rotate(36.6166 210.603 122)" 
        fill="#808082" 
      />
      <rect 
        className="animate-pulse" 
        style={{animationDelay: '1s'}}
        x="251.603" y="68" width="29.512" height="29.512" transform="rotate(36.6166 251.603 68)" 
        fill="#0D1573" 
      />
    </g>
  </svg>
);

export default Loader;