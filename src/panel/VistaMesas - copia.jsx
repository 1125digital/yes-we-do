// src/panel/VistaMesas.jsx
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useBoda } from '../hooks/useBoda';
import { useNavigate } from 'react-router-dom';

function VistaMesas() {
  const { bodaId, loading } = useBoda();
  const [planoURL, setPlanoURL] = useState('');
  const [mesas, setMesas] = useState([]);
  const [invitados, setInvitados] = useState([]);
  const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0 });
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!bodaId) return;
    cargarPlanoYMesas();
    cargarInvitados();
  }, [bodaId]);

  const cargarPlanoYMesas = async () => {
    const { data, error } = await supabase
      .from('bodas')
      .select('plano_url, layout_mesas')
      .eq('id', bodaId)
      .single();

    if (data) {
      setPlanoURL(data.plano_url || '');
      const layout = (data.layout_mesas || []).map((mesa) => ({
        ...mesa,
        x: typeof mesa.x === 'number' ? mesa.x : 0,
        y: typeof mesa.y === 'number' ? mesa.y : 0,
        rotacion: typeof mesa.rotacion === 'number' ? mesa.rotacion : 0,
        total_asientos: typeof mesa.total_asientos === 'number' ? mesa.total_asientos : 6,
        asientos: mesa.asientos || {},
        width: mesa.width || (mesa.tipo === 'circular' ? 100 : 120),
        height: mesa.height || 100
      }));
      setMesas(layout);
    }

    if (error) {
      console.error('Error al cargar plano:', error.message);
    }
  };

  const cargarInvitados = async () => {
    const { data, error } = await supabase
      .from('invitados')
      .select('*')
      .eq('boda_id', bodaId);

    if (data) setInvitados(data);
    if (error) console.error('Error al cargar invitados:', error.message);
  };

  const renderAsientos = (mesa) => {
    const total = mesa.total_asientos || 1;
    const anguloPaso = 360 / total;
    const radio = Math.min(mesa.width, mesa.height) / 2 - 15;
    const centerX = mesa.width / 2;
    const centerY = mesa.height / 2;
    const asientos = [];

    for (let i = 0; i < total; i++) {
      const rad = ((i * anguloPaso - (mesa.rotacion || 0)) * Math.PI) / 180;
      const x = centerX + radio * Math.cos(rad);
      const y = centerY + radio * Math.sin(rad);
      const invitadoId = mesa.asientos?.[i + 1];
      const invitado = invitados.find((inv) => inv.id === invitadoId);
      const slugInvitado = invitado?.nombre?.toLowerCase().replace(/\s+/g, '-');

      asientos.push(
        <div
          key={i}
          onClick={() => {
            if (invitado && slugInvitado) {
              navigate(`/${bodaId}/invitado/${slugInvitado}`);
            }
          }}
          onTouchStart={(e) => {
            if (invitado) setTooltip({ visible: true, text: invitado.nombre, x: e.touches[0].clientX, y: e.touches[0].clientY });
          }}
          onTouchEnd={() => setTooltip({ visible: false, text: '', x: 0, y: 0 })}
          onMouseEnter={(e) => {
            if (invitado) setTooltip({ visible: true, text: invitado.nombre, x: e.clientX, y: e.clientY });
          }}
          onMouseLeave={() => setTooltip({ visible: false, text: '', x: 0, y: 0 })}
          style={{
            ...styles.asiento,
            left: x - 10,
            top: y - 10,
            backgroundColor: invitado ? '#27ae60' : '#ccc',
            position: 'absolute',
            cursor: invitado ? 'pointer' : 'default'
          }}
        >
          {invitado ? '✓' : i + 1}
        </div>
      );
    }
    return asientos;
  };

  const Mesa = ({ mesa }) => (
    <div
      style={{
        ...styles.mesa,
        width: mesa.width,
        height: mesa.height,
        left: mesa.x,
        top: mesa.y,
        position: 'absolute',
        borderRadius: mesa.tipo === 'circular' ? '50%' : '8px'
      }}
    >
      <div style={styles.mesaNumero}>{`Mesa ${mesa.numero}`}</div>
      {renderAsientos(mesa)}
    </div>
  );

  if (loading) return <p>Cargando plano...</p>;
  if (!bodaId) return <p>Boda no encontrada.</p>;

  return (
    <div style={styles.container}>
      <h2>Distribución de Mesas 🪑</h2>
      {planoURL ? (
        <div
          ref={canvasRef}
          style={styles.canvas}
        >
          <img src={planoURL} alt="Plano del lugar" style={styles.plano} />
          {mesas.map((mesa) => (
            <Mesa key={mesa.id} mesa={mesa} />
          ))}
          {tooltip.visible && (
            <div style={{
              ...styles.tooltip,
              left: tooltip.x + 10,
              top: tooltip.y + 10
            }}>
              {tooltip.text}
            </div>
          )}
        </div>
      ) : (
        <p>No se ha subido un plano aún.</p>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '1rem',
    fontFamily: 'sans-serif',
    width: '100%',
    height: '100vh',
    boxSizing: 'border-box'
  },
  canvas: {
    position: 'relative',
    border: '1px solid #ccc',
    width: '100%',
    height: 'calc(100vh - 150px)',
    overflow: 'scroll',
    marginTop: '1rem'
  },
  plano: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 0
  },
  mesa: { backgroundColor: '#f39c12', zIndex: 1, textAlign: 'center', color: '#fff' },
  mesaNumero: { fontWeight: 'bold' },
  asiento: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    textAlign: 'center',
    lineHeight: '20px',
    fontSize: '0.7rem'
  },
  tooltip: {
    position: 'fixed',
    backgroundColor: '#333',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    pointerEvents: 'none',
    zIndex: 1000
  }
};

export default VistaMesas;
