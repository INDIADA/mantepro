import { useState } from 'react'
import { supabase } from './supabase'

export default function App() {
  const [rol, setRol] = useState('tecnico')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)

  async function ingresar() {
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else {
      setUser(data.user)
    }
    setLoading(false)
  }

  async function salir() {
    await supabase.auth.signOut()
    setUser(null)
    setEmail('')
    setPassword('')
  }

  if (user) {
    return (
      <div style={{minHeight:'100vh',background:'#185FA5',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'sans-serif'}}>
        <div style={{background:'#fff',borderRadius:16,padding:32,width:'100%',maxWidth:380,textAlign:'center'}}>
          <div style={{width:56,height:56,borderRadius:'50%',background:'#EAF3DE',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,margin:'0 auto 16px'}}>✓</div>
          <h2 style={{color:'#185FA5',fontWeight:500,marginBottom:8}}>¡Bienvenido!</h2>
          <p style={{color:'#888',fontSize:13,marginBottom:4}}>Rol: <strong>{rol}</strong></p>
          <p style={{color:'#888',fontSize:13,marginBottom:24}}>{user.email}</p>
          <button onClick={salir} style={{padding:'10px 24px',borderRadius:8,border:'0.5px solid #ddd',background:'transparent',cursor:'pointer',fontSize:14}}>
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh',background:'#185FA5',display:'flex',alignItems:'center',justifyContent:'center',padding:20,fontFamily:'sans-serif'}}>
      <div style={{background:'#fff',borderRadius:16,padding:32,width:'100%',maxWidth:380}}>
        <h1 style={{textAlign:'center',color:'#185FA5',fontWeight:500,marginBottom:4}}>MantePro</h1>
        <p style={{textAlign:'center',color:'#888',fontSize:13,marginBottom:20}}>Gestión de mantenimiento</p>

        <div style={{display:'flex',gap:6,background:'#f1f1f1',borderRadius:8,padding:3,marginBottom:16}}>
          {['admin','tecnico','reportador'].map(r => (
            <button key={r} onClick={() => setRol(r)} style={{
              flex:1, padding:'8px 4px', borderRadius:6, border:'none',
              background: rol===r ? '#fff' : 'transparent',
              color: rol===r ? '#185FA5' : '#888',
              fontWeight: rol===r ? 500 : 400,
              cursor:'pointer', fontSize:12,
              boxShadow: rol===r ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
            }}>
              {r.charAt(0).toUpperCase()+r.slice(1)}
            </button>
          ))}
        </div>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{width:'100%',padding:12,borderRadius:8,border:'0.5px solid #ddd',fontSize:14,marginBottom:10,boxSizing:'border-box' as const}}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{width:'100%',padding:12,borderRadius:8,border:'0.5px solid #ddd',fontSize:14,marginBottom:error?8:16,boxSizing:'border-box' as const}}
        />

        {error && (
          <p style={{color:'#A32D2D',fontSize:12,marginBottom:12,background:'#FCEBEB',padding:'8px 12px',borderRadius:6}}>
            {error}
          </p>
        )}

        <button
          onClick={ingresar}
          disabled={loading}
          style={{
            width:'100%', padding:13, borderRadius:8,
            background: loading ? '#7aafd4' : '#185FA5',
            color:'#fff', border:'none', fontSize:14,
            fontWeight:500, cursor:'pointer'
          }}
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </div>
    </div>
  )
}