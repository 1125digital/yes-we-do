import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import Navbar from './Navbar';
import { useEffect } from 'react';
import { supabase } from './supabaseClient';


function AppLayout() {
  const { slug } = useParams();
useEffect(() => {
  const actualizarOnline = async () => {
    const invitado = JSON.parse(localStorage.getItem('yeswedo_invitado'));
    if (invitado?.boda_id && invitado?.nombre) {
      await supabase
        .from('invitados')
        .update({ ultimo_online: new Date().toISOString() })
        .eq('boda_id', invitado.boda_id)
        .eq('nombre', invitado.nombre);
    }
  };

  actualizarOnline();

  const intervalo = setInterval(actualizarOnline, 30000); // cada 30 segundos

  return () => clearInterval(intervalo);
}, []);


  return (
    <div style={{ paddingBottom: 90 }}>
      <Outlet />
      {slug && <Navbar slug={slug} />}
    </div>
  );
}

export default AppLayout;

