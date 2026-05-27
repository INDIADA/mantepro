import { useState } from 'react'
import { supabase } from './supabase'

// Pantalla Admin
function DashboardAdmin({ email, onSalir }: { email: string, onSalir: () => void }) {
  return (
    <div style={{minHeight:'100vh',background:'#F1EFE8',fontFamily:'sans-serif'}}>
      <div style={{background:'#185FA5',padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{color:'#fff',fontSize:16,fontWeight:500}}>MantePro — Admin</span>
        <button onClick={onSalir} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',padding:'6px 14px',borderRadius:6,cursor:'pointer',fontSize:12}}>Salir</button>
      </div>
      <div style={{padding:20,display:'flex',flexDirection:'column',gap:12}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
          {[['6','Pendientes','#FCEBEB','#A32D2D'],['3','Por cerrar','#E6F1FB','#185FA5'],['24','Total OT','#F1EFE8','#444']].map(([v,l,bg,c])=>(
            <div key={l} style={{background:bg,borderRadius:10,padding:'14px 12px',textAlign:'center'}}>
              <div style={{fontSize:24,fontWeight:500,color:c}}>{v}</div>
              <div style={{fontSize:11,color:'#888',marginTop:4}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{background:'#fff',borderRadius:10,padding:16,border:'0.5px solid #E8E6DE'}}>
          <div style={{fontSize:13,fontWeight:500,marginBottom:12}}>Pendientes de aprobación</div>
          {[
            {id:'REP-041',titulo:'Pérdida de aceite compresor',de:'Reportador',urgente:false},
            {id:'REP-040',titulo:'Portón sector B no cierra',de:'Reportador',urgente:true},
            {id:'OT-254',titulo:'Compresor aux. — cerrada por técnico',de:'Técnico',urgente:false},
          ].map(ot=>(
            <div key={ot.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'0.5px solid #F1EFE8'}}>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:500}}>{ot.titulo}</div>
                <div style={{fontSize:10,color:'#888',marginTop:2}}>{ot.id} · {ot.de}</div>
              </div>
              {ot.urgente && <span style={{background:'#FCEBEB',color:'#A32D2D',fontSize:10,padding:'2px 8px',borderRadius:100,fontWeight:500}}>Urgente</span>}
              <div style={{display:'flex',gap:5}}>
                <button style={{padding:'5px 10px',borderRadius:6,border:'0.5px solid #ddd',background:'transparent',fontSize:11,cursor:'pointer'}}>✕</button>
                <button style={{padding:'5px 10px',borderRadius:6,border:'none',background:'#3B6D11',color:'#fff',fontSize:11,cursor:'pointer'}}>✓</button>
              </div>
            </div>
          ))}
        </div>
        <button style={{width:'100%',padding:13,borderRadius:10,background:'#185FA5',color:'#fff',border:'none',fontSize:14,fontWeight:500,cursor:'pointer'}}>
          + Nueva OT
        </button>
      </div>
    </div>
  )
}

// Pantalla Técnico
function DashboardTecnico({ email, onSalir }: { email: string, onSalir: () => void }) {
  return (
    <div style={{minHeight:'100vh',background:'#F1EFE8',fontFamily:'sans-serif'}}>
      <div style={{background:'#3B6D11',padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{color:'#fff',fontSize:16,fontWeight:500}}>MantePro — Técnico</span>
        <button onClick={onSalir} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',padding:'6px 14px',borderRadius:6,cursor:'pointer',fontSize:12}}>Salir</button>
      </div>
      <div style={{padding:20,display:'flex',flexDirection:'column',gap:12}}>
        <div style={{background:'#FCEBEB',borderRadius:10,padding:'12px 14px',display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:20}}>⚠️</span>
          <div>
            <div style={{fontSize:12,fontWeight:500,color:'#791F1F'}}>OT Urgente asignada</div>
            <div style={{fontSize:11,color:'#A32D2D'}}>#0253 — Falla compresor #3 · Planta Norte</div>
          </div>
        </div>
        <div style={{background:'#fff',borderRadius:10,padding:16,border:'0.5px solid #E8E6DE'}}>
          <div style={{fontSize:13,fontWeight:500,marginBottom:12}}>Mis OT activas</div>
          {[
            {id:'#0253',titulo:'Falla compresor #3',estado:'Urgente',color:'#A32D2D',bg:'#FCEBEB'},
            {id:'#0250',titulo:'Cambio de aceite motor',estado:'En curso',color:'#185FA5',bg:'#E6F1FB'},
            {id:'#0249',titulo:'Revisión frenos traseros',estado:'Pendiente',color:'#854F0B',bg:'#FAEEDA'},
          ].map(ot=>(
            <div key={ot.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'0.5px solid #F1EFE8'}}>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:500}}>{ot.titulo}</div>
                <div style={{fontSize:10,color:'#888',marginTop:2}}>{ot.id}</div>
              </div>
              <span style={{background:ot.bg,color:ot.color,fontSize:10,padding:'2px 8px',borderRadius:100,fontWeight:500}}>{ot.estado}</span>
            </div>
          ))}
        </div>
        <button style={{width:'100%',padding:13,borderRadius:10,background:'#3B6D11',color:'#fff',border:'none',fontSize:14,fontWeight:500,cursor:'pointer'}}>
          + Crear OT propia
        </button>
      </div>
    </div>
  )
}

// Pantalla Reportador
function DashboardReportador({ email, onSalir }: { email: string, onSalir: () => void }) {
  const [titulo, setTitulo] = useState('')
  const [desc, setDesc] = useState('')
  const [enviado, setEnviado] = useState(false)

  return (
    <div style={{minHeight:'100vh',background:'#F1EFE8',fontFamily:'sans-serif'}}>
      <div style={{background:'#1D9E75',padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{color:'#fff',fontSize:16,fontWeight:500}}>MantePro — Reportador</span>
        <button onClick={onSalir} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',padding:'6px 14px',borderRadius:6,cursor:'pointer',fontSize:12}}>Salir</button>
      </div>
      <div style={{padding:20,display:'flex',flexDirection:'column',gap:12}}>
        {enviado ? (
          <div style={{background:'#EAF3DE',borderRadius:10,padding:24,textAlign:'center'}}>
            <div style={{fontSize:32,marginBottom:8}}>✓</div>
            <div style={{fontSize:14,fontWeight:500,color:'#27500A'}}>Problema reportado</div>
            <div style={{fontSize:12,color:'#3B6D11',marginTop:4}}>El administrador lo revisará pronto</div>
            <button onClick={()=>{setEnviado(false);setTitulo('');setDesc('')}} style={{marginTop:16,padding:'8px 20px',borderRadius:8,border:'0.5px solid #C0DD97',background:'transparent',cursor:'pointer',fontSize:12,color:'#27500A'}}>
              Reportar otro
            </button>
          </div>
        ) : (
          <div style={{background:'#fff',borderRadius:10,padding:16,border:'0.5px solid #E8E6DE'}}>
            <div style={{fontSize:13,fontWeight:500,marginBottom:16}}>Reportar un problema</div>
            <div style={{fontSize:11,color:'#888',marginBottom:4}}>TÍTULO</div>
            <input value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="Ej: Pérdida de aceite compresor #3"
              style={{width:'100%',padding:10,borderRadius:8,border:'0.5px solid #ddd',fontSize:13,marginBottom:12,boxSizing:'border-box' as const}}/>
            <div style={{fontSize:11,color:'#888',marginBottom:4}}>DESCRIPCIÓN</div>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Describí el problema con el mayor detalle posible..."
              style={{width:'100%',padding:10,borderRadius:8,border:'0.5px solid #ddd',fontSize:13,marginBottom:16,minHeight:80,resize:'none' as const,boxSizing:'border-box' as const,fontFamily:'sans-serif'}}/>
            <button onClick={()=>titulo&&setEnviado(true)} style={{width:'100%',padding:12,borderRadius:8,background:titulo?'#1D9E75':'#ccc',color:'#fff',border:'none',fontSize:14,fontWeight:500,cursor:titulo?'pointer':'default'}}>
              Enviar reporte
            </button>
          </div>
        )}
        <div style={{background:'#fff',borderRadius:10,padding:16,border:'0.5px solid #E8E6DE'}}>
          <div style={{fontSize:13,fontWeight:500,marginBottom:12}}>Mis reportes</div>
          {[
            {id:'REP-039',titulo:'Falta lubricación cinta',estado:'Aprobado',color:'#185FA5',bg:'#E6F1FB'},
            {id:'REP-038',titulo:'Ruido en compresor #2',estado:'Resuelto',color:'#27500A',bg:'#EAF3DE'},
          ].map(r=>(
            <div key={r.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'0.5px solid #F1EFE8'}}>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:500}}>{r.titulo}</div>
                <div style={{fontSize:10,color:'#888',marginTop:2}}>{r.id}</div>
              </div>
              <span style={{background:r.bg,color:r.color,fontSize:10,padding:'2px 8px',borderRadius:100,fontWeight:500}}>{r.estado}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// App principal
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
    if (rol === 'admin') return <DashboardAdmin email={user.email} onSalir={salir} />
    if (rol === 'tecnico') return <DashboardTecnico email={user.email} onSalir={salir} />
    return <DashboardReportador email={user.email} onSalir={salir} />
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
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}
          style={{width:'100%',padding:12,borderRadius:8,border:'0.5px solid #ddd',fontSize:14,marginBottom:10,boxSizing:'border-box' as const}}/>
        <input type="password" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)}
          style={{width:'100%',padding:12,borderRadius:8,border:'0.5px solid #ddd',fontSize:14,marginBottom:error?8:16,boxSizing:'border-box' as const}}/>
        {error && <p style={{color:'#A32D2D',fontSize:12,marginBottom:12,background:'#FCEBEB',padding:'8px 12px',borderRadius:6}}>{error}</p>}
        <button onClick={ingresar} disabled={loading} style={{
          width:'100%', padding:13, borderRadius:8,
          background: loading ? '#7aafd4' : '#185FA5',
          color:'#fff', border:'none', fontSize:14, fontWeight:500, cursor:'pointer'
        }}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </div>
    </div>
  )
}