import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export function useBoda() {
  const [bodaId, setBodaId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const slug = window.location.pathname.split('/')[1] || 'demo' // fallback por si es root
    const fetchBoda = async () => {
      const { data, error } = await supabase
        .from('bodas')
        .select('id')
        .eq('slug', slug)
        .single()

      if (data) setBodaId(data.id)
      setLoading(false)
    }

    fetchBoda()
  }, [])

  return { bodaId, loading }
}
