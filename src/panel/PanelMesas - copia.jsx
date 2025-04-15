// PanelMesas.jsx
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useBoda } from '../hooks/useBoda';

function PanelMesas() {
  const { bodaId, loading } = useBoda();
  const fileInputRef = useRef(null);
  const [planoURL, setPlanoURL] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState('circular');
  const [nuevoAsientos, setNuevoAsientos] = useState(6);
  const [mesas, setMesas] = useState([]);
  const [invitados, setInvitados] = useState([]);
  const [asignando, setAsignando] = useState(null);

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

  const subirPlano = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const filename = `plano_${bodaId}_${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('imagenes').upload(filename, file);

    if (error) {
      alert('Error al subir imagen: ' + error.message);
      return;
    }

    const { data } = supabase.storage.from('imagenes').getPublicUrl(filename);
    setPlanoURL(data.publicUrl);
    await supabase.from('bodas').update({ plano_url: data.publicUrl }).eq('id', bodaId);
  };

  const agregarMesa = () => {
    const nueva = {
      id: Date.now(),
      tipo: nuevoTipo || 'circular',
      x: 100,
      y: 100,
      rotacion: 0,
      numero: mesas.length + 1,
      total_asientos: Number(nuevoAsientos) || 6,
      asientos: {},
      width: nuevoTipo === 'circular' ? 100 : 120,
      height: 100,
    };
    setMesas((prev) => [...prev, nueva]);
  };

  const moverMesa = (id, x, y) => {
    setMesas((prev) => {
      const actualizadas = prev.map((m) => (m.id === id ? { ...m, x, y } : m));
      guardarMesasDirecto(actualizadas);
      return actualizadas;
    });
  };

  const redimensionarMesa = (id, width, height) => {
    setMesas((prev) => {
      const actualizadas = prev.map((m) => (m.id === id ? { ...m, width, height } : m));
      guardarMesasDirecto(actualizadas);
      return actualizadas;
    });
  };

  const eliminarMesa = (id) => {
    setMesas((prev) => {
      const nuevas = prev.filter((m) => m.id !== id);
      guardarMesasDirecto(nuevas);
      return nuevas;
    });
  };

  const guardarMesas = async () => {
    const { error } = await supabase
      .from('bodas')
      .update({ layout_mesas: mesas })
      .eq('id', bodaId);

    if (error) alert('Error al guardar');
    else alert('Mesas guardadas ✅');
  };

  const guardarMesasDirecto = async (nuevasMesas) => {
    await supabase
      .from('bodas')
      .update({ layout_mesas: nuevasMesas })
      .eq('id', bodaId);
  };

  const asignarInvitado = (mesaId, asientoId, invitadoId) => {
    setMesas((prev) =>
      prev.map((m) => {
        if (m.id !== mesaId) return m;
        const asientos = { ...m.asientos, [asientoId]: invitadoId };
        return { ...m, asientos };
      })
    );
    setAsignando(null);
  };

  const desasignarInvitado = (mesaId, asientoId) => {
    setMesas((prev) =>
      prev.map((m) => {
        if (m.id !== mesaId) return m;
        const asientos = { ...m.asientos };
        delete asientos[asientoId];
        return { ...m, asientos };
      })
    );
    setAsignando(null);
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
      asientos.push(
        <div
          key={i}
          onClick={() => setAsignando({ mesaId: mesa.id, asientoId: i + 1 })}
          style={{
            ...styles.asiento,
            left: x - 10,
            top: y - 10,
            backgroundColor: invitado ? '#27ae60' : '#ccc',
            position: 'absolute',
          }}
          title={invitado ? invitado.nombre : 'Sin asignar'}
        >
          {invitado ? '✓' : i + 1}
        </div>
      );
    }
    return asientos;
  };

 const Mesa = ({ mesa }) => {
  const mesaRef = useRef(null);
  const dragging = useRef(false);
  const initialMouse = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });

  // Inicio de arrastre
  const startDrag = (clientX, clientY) => {
    dragging.current = true;
    initialMouse.current = { x: clientX, y: clientY };
    initialPos.current = { x: mesa.x, y: mesa.y };
  };

  const onMove = (clientX, clientY) => {
    if (!dragging.current) return;
    const dx = clientX - initialMouse.current.x;
    const dy = clientY - initialMouse.current.y;
    moverMesa(mesa.id, initialPos.current.x + dx, initialPos.current.y + dy);
  };

  const stopDrag = () => {
    dragging.current = false;
  };

  // Handlers mouse
  const handleMouseDown = (e) => {
    if (e.target.closest('button')) return;
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    onMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    stopDrag();
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Handlers touch
  const handleTouchStart = (e) => {
    if (e.target.closest('button')) return;
    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  };

  const handleTouchMove = (e) => {
    e.preventDefault(); // Evita el scroll del navegador mientras se arrastra
    const touch = e.touches[0];
    onMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    stopDrag();
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  };

  // Resize igual que antes
  const startResize = (e) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = mesa.width;
    const startHeight = mesa.height;

    const doResize = (eMove) => {
      const deltaX = eMove.clientX - startX;
      const deltaY = eMove.clientY - startY;
      const newWidth = Math.max(80, startWidth + deltaX);
      const newHeight = Math.max(80, startHeight + deltaY);
      redimensionarMesa(mesa.id, newWidth, newHeight);
    };

    const stopResize = () => {
      document.removeEventListener('mousemove', doResize);
      document.removeEventListener('mouseup', stopResize);
    };

    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResize);
  };

  return (
    <div
      ref={mesaRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{
        ...styles.mesa,
        width: mesa.width,
        height: mesa.height,
        left: mesa.x,
        top: mesa.y,
        position: 'absolute',
        borderRadius: mesa.tipo === 'circular' ? '50%' : '8px',
        touchAction: 'none' // ¡Muy importante para permitir arrastre en móvil!
      }}
    >
      <div style={styles.mesaNumero}>{`Mesa ${mesa.numero}`}</div>
      <div style={styles.actions}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            eliminarMesa(mesa.id);
          }}
          style={styles.iconBtn}
        >
          🗑️
        </button>
      </div>
      {renderAsientos(mesa)}
      <div
        style={styles.resizeHandle}
        onMouseDown={startResize}
        title="Arrastra para redimensionar"
      />
    </div>
  );
};




  if (loading) return <p>Cargando plano...</p>;
  if (!bodaId) return <p>Boda no encontrada.</p>;

  return (
    <div style={styles.container}>
      <h2>Distribución de Mesas 🪑</h2>
      <input type="file" accept="image/*" ref={fileInputRef} onChange={subirPlano} style={styles.file} />
      <p>Sube el plano del venue si aún no lo has hecho</p>
      {planoURL && (
        <>
          <div style={styles.controls}>
            <select value={nuevoTipo} onChange={(e) => setNuevoTipo(e.target.value)} style={styles.select}>
              <option value="circular">Mesa Circular</option>
              <option value="rectangular">Mesa Rectangular</option>
            </select>
            <input
              type="number"
              min={1}
              max={20}
              value={nuevoAsientos}
              onChange={(e) => setNuevoAsientos(Number(e.target.value))}
              style={{ width: '60px' }}
            />
            <button onClick={agregarMesa} style={styles.boton}>➕ Agregar Mesa</button>
            <button onClick={guardarMesas} style={styles.botonSecundario}>💾 Guardar</button>
          </div>
          <div style={styles.canvas}>
            <img src={planoURL} alt="Plano del lugar" style={styles.plano} />
            {mesas.map((mesa) => (
              <Mesa key={mesa.id} mesa={mesa} />
            ))}
          </div>
        </>
      )}
      {asignando && (
        <div style={styles.modal}>
          <div style={styles.modalContenido}>
            <h3>Asignar invitado al asiento {asignando.asientoId}</h3>
            <div style={styles.invitadosGrid}>
              {invitados.map((inv) => (
                <div
                  key={inv.id}
                  style={styles.invitadoCard}
                  onClick={() => asignarInvitado(asignando.mesaId, asignando.asientoId, inv.id)}
                >
                  <img src={inv.foto || 'https://via.placeholder.com/50'} alt={inv.nombre} style={styles.foto} />
                  <p>{inv.nombre}</p>
                  <small>{inv.parentezco}</small>
                </div>
              ))}
            </div>
            <button onClick={() => desasignarInvitado(asignando.mesaId, asignando.asientoId)} style={styles.botonDesasignar}>❌ Desasignar asiento</button>
            <button onClick={() => setAsignando(null)} style={styles.cerrarModal}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '2rem', fontFamily: 'sans-serif', maxWidth: '1000px', margin: '0 auto' },
  file: { marginBottom: '1rem' },
  controls: { display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' },
  select: { padding: '8px', borderRadius: '6px', border: '1px solid #ccc' },
  boton: { backgroundColor: '#3498db', color: '#fff', padding: '8px 15px', borderRadius: '6px', border: 'none', cursor: 'pointer' },
  botonSecundario: { backgroundColor: '#27ae60', color: '#fff', padding: '8px 15px', borderRadius: '6px', border: 'none', cursor: 'pointer' },
  canvas: { position: 'relative', border: '1px solid #ccc', width: '100%', height: '700px', overflow: 'hidden', marginTop: '1rem' },
  plano: { width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0, zIndex: 0 },
  mesa: { backgroundColor: '#f39c12', zIndex: 1, textAlign: 'center', color: '#fff', touchAction: 'none', cursor: 'move' },
  mesaNumero: { fontWeight: 'bold' },
  asiento: { width: 20, height: 20, borderRadius: '50%', backgroundColor: '#ccc', textAlign: 'center', lineHeight: '20px', fontSize: '0.7rem', cursor: 'pointer' },
  modal: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  modalContenido: { background: '#fff', padding: '2rem', borderRadius: '10px', maxWidth: '600px', width: '100%', maxHeight: '80vh', overflowY: 'auto' },
  invitadosGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem', marginTop: '1rem' },
  invitadoCard: { border: '1px solid #ccc', borderRadius: '8px', padding: '10px', textAlign: 'center', cursor: 'pointer' },
  foto: { width: 50, height: 50, borderRadius: '50%', objectFit: 'cover', marginBottom: '0.5rem' },
  cerrarModal: { marginTop: '1rem', padding: '8px 15px', backgroundColor: '#bdc3c7', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  botonDesasignar: { marginTop: '1rem', marginRight: '1rem', padding: '8px 15px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  resizeHandle: { position: 'absolute', width: '12px', height: '12px', backgroundColor: '#fff', border: '2px solid #000', right: '0', bottom: '0', cursor: 'nwse-resize', zIndex: 2 },
  actions: { position: 'absolute', top: '2px', right: '2px', display: 'flex', gap: '4px' },
  iconBtn: { background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px' }
};

export default PanelMesas;
