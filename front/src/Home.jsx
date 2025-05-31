import React, { Component } from 'react';
import jetImage from './assets/piloto.jpg';

class Home extends Component {
  render() {
    return (
      <>
        <img
          src={jetImage}
          alt="Jet"
          style={{
            width: '100vw',      // 100% ancho ventana
            height: '100vh',     // 100% alto ventana
            objectFit: 'cover',  // mantiene proporción y recorta si hace falta
            position: 'fixed',   // para que quede fija y no afecte scroll
            top: 0,
            left: 0,
            opacity: 0.9,    
          }}
        />
        <div className="container py-5 text-center" style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="display-4 text-primary mb-3">Bienvenido a FAC</h1>
          <p className="lead">Sube y administra tus videos fácilmente.</p>
        </div>
      </>
    );
  }
}

export default Home;
