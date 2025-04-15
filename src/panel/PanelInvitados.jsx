import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useBoda } from '../hooks/useBoda';

function PanelInvitados() {
  const { bodaId, loading } = useBoda();
  const [invitados, setInvitados] = useState([]);
  const [layoutMesas, setLayoutMesas] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [invitadoAsignando, setInvitadoAsignando] = useState(null);
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [asientoSeleccionado, setAsientoSeleccionado] = useState(null);
  const [nuevo, setNuevo] = useState({
    nombre: '',
    apellido: '',
    parentezco: '',
    confirmado: false,
    registrado: false,
    email: '',
  });
  const [fotoFile, setFotoFile] = useState(null);

  useEffect(() => {
    if (bodaId) {
      cargarInvitados();
      cargarLayout();
    }
  }, [bodaId]);

  const cargarInvitados = async () => {
    const { data, error } = await supabase
      .from('invitados')
      .select('*')
      .eq('boda_id', bodaId);

    if (error) console.error('Error al cargar invitados:', error.message);
    else setInvitados(data);
  };

  const cargarLayout = async () => {
    const { data, error } = await supabase
      .from('bodas')
      .select('layout_mesas')
      .eq('id', bodaId)
      .single();

    if (!error && data.layout_mesas) {
      setLayoutMesas(data.layout_mesas);
    }
  };

  const subirFoto = async () => {
    if (!fotoFile) return null;
    const filename = `invitado_${Date.now()}_${fotoFile.name}`;
    const { error } = await supabase.storage.from('imagenes').upload(filename, fotoFile);
    if (error) {
      console.error('Error al subir foto:', error.message);
      return null;
    }
    const { data } = supabase.storage.from('imagenes').getPublicUrl(filename);
    return data.publicUrl;
  };

  const agregarManual = async () => {
    if (!nuevo.nombre) return alert('Nombre obligatorio');
    const foto = await subirFoto();

    const { error } = await supabase.from('invitados').insert({
      ...nuevo,
      boda_id: bodaId,
      foto,
      registrado: false,
    });

    if (error) {
      alert('Error al guardar');
      console.error(error.message);
    } else {
      setNuevo({ nombre: '', apellido: '', parentezco: '', confirmado: false, registrado: false, email: '' });
      setFotoFile(null);
      setMostrarFormulario(false);
      cargarInvitados();
    }
  };

  const marcarConfirmado = async (id, estado) => {
    await supabase.from('invitados').update({ confirmado: estado }).eq('id', id);
    cargarInvitados();
  };

  const abrirAsignador = (invitado) => {
    setInvitadoAsignando(invitado);
    setMesaSeleccionada(null);
    setAsientoSeleccionado(null);
  };

  const asignarInvitado = async () => {
    if (!mesaSeleccionada || !asientoSeleccionado) {
      alert('Selecciona una mesa y un asiento');
      return;
    }

    const nuevaDistribucion = layoutMesas.map((mesa) => {
      if (mesa.id === mesaSeleccionada.id) {
        return {
          ...mesa,
          asientos: {
            ...mesa.asientos,
            [asientoSeleccionado]: invitadoAsignando.id,
          },
        };
      }
      return mesa;
    });

    const { error } = await supabase
      .from('bodas')
      .update({ layout_mesas: nuevaDistribucion })
      .eq('id', bodaId);

    if (error) {
      alert('Error al asignar invitado');
      console.error(error.message);
    } else {
      setLayoutMesas(nuevaDistribucion);
      setInvitadoAsignando(null);
    }
  };

  if (loading) return <p>Cargando invitados...</p>;

  const registrados = invitados.filter((i) => i.registrado);
  const manuales = invitados.filter((i) => !i.registrado);

  const mesasDisponibles = layoutMesas.map((mesa) => ({
    ...mesa,
    asientosLibres: Object.entries(mesa.asientos)
      .filter(([_, val]) => val === null)
      .map(([num]) => num),
  }));

  return (
    <div style={styles.container}>
      <h2>Panel de Invitados 🎟️</h2>

      <button onClick={() => setMostrarFormulario(!mostrarFormulario)} style={styles.boton}>
        {mostrarFormulario ? 'Cancelar' : '➕ Agregar Invitado Manual'}
      </button>

      {mostrarFormulario && (
        <div style={styles.form}>
          <input type="text" placeholder="Nombre" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} style={styles.input} />
          <input type="text" placeholder="Apellido" value={nuevo.apellido} onChange={(e) => setNuevo({ ...nuevo, apellido: e.target.value })} style={styles.input} />
          <input type="text" placeholder="Parentezco" value={nuevo.parentezco} onChange={(e) => setNuevo({ ...nuevo, parentezco: e.target.value })} style={styles.input} />
          <input type="email" placeholder="Email" value={nuevo.email} onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })} style={styles.input} />
          <input type="file" accept="image/*" onChange={(e) => setFotoFile(e.target.files[0])} />
          <button onClick={agregarManual} style={styles.boton}>Guardar</button>
        </div>
      )}

      {layoutMesas.length === 0 && (
        <p style={{ color: 'red', marginTop: '1rem' }}>
          ⚠️ Aún no puedes asignar invitados. Primero crea el layout de mesas en el panel correspondiente.
        </p>
      )}

      <hr />
      <h3>Registrados por la app</h3>
      <div style={styles.grid}>
        {registrados.map((inv) => (
          <InvitadoCard key={inv.id} invitado={inv} confirmar={marcarConfirmado} abrirAsignador={abrirAsignador} layoutDisponible={layoutMesas.length > 0} />
        ))}
      </div>

      <h3 style={{ marginTop: '2rem' }}>Agregados manualmente</h3>
      <div style={styles.grid}>
        {manuales.map((inv) => (
          <InvitadoCard key={inv.id} invitado={inv} confirmar={marcarConfirmado} abrirAsignador={abrirAsignador} layoutDisponible={layoutMesas.length > 0} />
        ))}
      </div>

      {invitadoAsignando && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3>Asignar a {invitadoAsignando.nombre}</h3>
            <select onChange={(e) => {
              const mesa = layoutMesas.find(m => m.id === parseInt(e.target.value));
              setMesaSeleccionada(mesa);
              setAsientoSeleccionado(null);
            }} style={styles.input}>
              <option value="">Selecciona una mesa</option>
              {mesasDisponibles.map((m) => (
                <option key={m.id} value={m.id}>Mesa {m.numero}</option>
              ))}
            </select>
            {mesaSeleccionada && (
              <select onChange={(e) => setAsientoSeleccionado(e.target.value)} style={styles.input}>
                <option value="">Selecciona asiento</option>
                {mesaSeleccionada.asientosLibres.map((n) => (
                  <option key={n} value={n}>Asiento {n}</option>
                ))}
              </select>
            )}
            <div style={{ marginTop: '1rem' }}>
              <button onClick={asignarInvitado} style={{ ...styles.boton, marginRight: 10 }}>Asignar</button>
              <button onClick={() => setInvitadoAsignando(null)} style={styles.boton}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InvitadoCard({ invitado, confirmar, abrirAsignador, layoutDisponible }) {
  const advertencia = !invitado.email && !invitado.registrado;

  return (
    <div style={styles.card}>
      <img src={invitado.foto || 'https://via.placeholder.com/50'} alt={invitado.nombre} style={styles.foto} />
      <p><strong>{invitado.nombre} {invitado.apellido}</strong></p>
      <p>{invitado.parentezco}</p>
      <p>{invitado.confirmado ? '✅ Confirmado' : '❌ No confirmado'}</p>
      {advertencia && <p style={{ color: 'red', fontSize: '0.9rem' }}>⚠️ Sin email</p>}
      <button onClick={() => confirmar(invitado.id, !invitado.confirmado)} style={{ ...styles.boton, backgroundColor: invitado.confirmado ? '#c0392b' : '#27ae60' }}>
        {invitado.confirmado ? 'Desconfirmar' : 'Confirmar'}
      </button>
      {layoutDisponible && (
        <button onClick={() => abrirAsignador(invitado)} style={{ ...styles.boton, marginTop: 6, backgroundColor: '#8e44ad' }}>
          Asignar a mesa
        </button>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '2rem', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' },
  form: { marginTop: '1rem', marginBottom: '2rem', padding: '1rem', background: '#f7f7f7', borderRadius: '10px' },
  input: { width: '100%', padding: '10px', marginBottom: '1rem', borderRadius: '6px', border: '1px solid #ccc' },
  boton: { backgroundColor: '#3498db', color: '#fff', padding: '8px 15px', borderRadius: '6px', border: 'none', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' },
  card: { backgroundColor: '#f9f9f9', padding: '1rem', borderRadius: '10px', textAlign: 'center', boxShadow: '0 0 5px rgba(0,0,0,0.05)' },
  foto: { width: 50, height: 50, borderRadius: '50%', objectFit: 'cover', marginBottom: '0.5rem' },
  modal: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalContent: { background: '#fff', padding: '2rem', borderRadius: '10px', minWidth: '300px' },
};

export default PanelInvitados;
