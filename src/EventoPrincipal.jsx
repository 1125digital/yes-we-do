import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

function EventoPrincipal() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [boda, setBoda] = useState(null);
  const [invitado, setInvitado] = useState(null);

  useEffect(() => {
    const invitadoLocal = JSON.parse(localStorage.getItem('yeswedo_invitado'));
    if (!invitadoLocal || !invitadoLocal.boda_id) {
      navigate(`/${slug}/registro`);
      return;
    }

    setInvitado(invitadoLocal);
    cargarBoda(invitadoLocal.boda_id);
  }, [slug]);

  const cargarBoda = async (bodaId) => {
    const { data, error } = await supabase
      .from('bodas')
      .select('*')
      .eq('id', bodaId)
      .single();

    if (!error) setBoda(data);
  };

  return (
    <div style={{
      maxWidth: 600,
      margin: '0 auto',
      padding: '1.5rem',
      fontFamily: 'Georgia, serif',
      backgroundColor: '#fffdf9',
      minHeight: '100vh'
    }}>
      <button
        onClick={() => navigate(`/${slug}/muro`)}
        style={{
          marginBottom: 20,
          padding: '6px 14px',
          borderRadius: 6,
          backgroundColor: '#ccc',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        ← Regresar al Muro
      </button>

      <h2 style={{
        textAlign: 'center',
        fontSize: '1.8rem',
        color: '#b76e79',
        marginBottom: 10
      }}>
        💌 {boda?.nombre_novios}
      </h2>

      {!boda && <p style={{ textAlign: 'center' }}>Cargando invitación...</p>}

      {boda && (
        <div style={{
          background: '#fff',
          borderRadius: 12,
          padding: 20,
          boxShadow: '0 0 10px rgba(0,0,0,0.05)'
        }}>
          <p><strong>📅 Fecha:</strong>{' '}
            {new Date(boda.fecha_boda).toLocaleDateString('es-MX', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>

          <p><strong>⏰ Hora:</strong>{' '}
            {new Date(boda.fecha_boda).toLocaleTimeString('es-MX', {
              hour: '2-digit',
              minute: '2-digit'
            })} hrs
          </p>

          {boda.ubicacion && (
            <p><strong>📍 Ubicación:</strong> {boda.ubicacion}</p>
          )}

          {boda.nombre_venue && (
            <p><strong>🏛️ Venue:</strong> {boda.nombre_venue}</p>
          )}

          {boda.descripcion && (
            <div style={{ marginTop: 10 }}>
              <p><strong>📝 Descripción:</strong></p>
              <p>{boda.descripcion}</p>
            </div>
          )}

          {boda.foto_url && (
            <img
              src={boda.foto_url}
              alt="Foto del evento"
              style={{ marginTop: 15, maxWidth: '100%', borderRadius: 10 }}
            />
          )}

          {/* Galería de fotos del lugar */}
          {boda.direccion_fotos_venue && (
            <div style={{ marginTop: 20 }}>
              <p><strong>📸 Fotos del lugar:</strong></p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {typeof boda.direccion_fotos_venue === 'string'
                  ? boda.direccion_fotos_venue.split(',').map((url, i) => (
                      <img
                        key={i}
                        src={url.trim()}
                        alt={`Foto venue ${i + 1}`}
                        style={{ width: '100%', borderRadius: 10 }}
                      />
                    ))
                  : Array.isArray(boda.direccion_fotos_venue) &&
                    boda.direccion_fotos_venue.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Foto venue ${i + 1}`}
                        style={{ width: '100%', borderRadius: 10 }}
                      />
                    ))}
              </div>
            </div>
          )}

          {boda.maps_link && (
            <iframe
              src={boda.maps_link}
              title="Mapa del evento"
              style={{
                marginTop: 20,
                width: '100%',
                height: 250,
                border: 'none',
                borderRadius: 10
              }}
              loading="lazy"
              allowFullScreen
            />
          )}
        </div>
      )}

      {/* Footer / menú */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        background: '#fff',
        borderTop: '1px solid #eee',
        padding: '10px 0',
        textAlign: 'center',
        fontSize: 14,
        color: '#777'
      }}>
        <span onClick={() => navigate(`/${slug}/muro`)} style={{ cursor: 'pointer' }}>🏠 Muro</span>
        {' · '}
        <span onClick={() => navigate(`/${slug}/notificaciones`)} style={{ cursor: 'pointer' }}>🔔 Eventos</span>
      </div>
    </div>
  );
}

export default EventoPrincipal;
