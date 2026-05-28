// MantePro v1.0
import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

const VERSION = 'v1.0'

async function notificarAdmin(titulo: string, descripcion: string) {
  try {
    const { data } = await supabase.from('configuracion').select('valor').eq('clave', 'email_admin').single()
    if (!data) return
    await supabase.from('notificaciones').insert({
      usuario_id: null,
      orden_id: null,
      titulo,
      cuerpo: descripcion,
      leida: false,
    })
  } catch(e) { console.log('notif error', e) }
}

// ─── ADMIN ───────────────────────────────────────────────────────────────────
function DashboardAdmin({ email, onSalir }: { email: string, onSalir: () => void }) {
  const [vista, setVista] = useState<'dashboard'|'usuarios'|'categorias'|'reportes'|'config'>('dashboard')
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [reportes, setReportes] = useState<any[]>([])
  const [loadingReportes, setLoadingReportes] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoRol, setNuevoRol] = useState<'tecnico'|'reportador'|'admin'>('tecnico')
  const [nuevaClave, setNuevaClave] = useState('')
  const [nuevoEmail, setNuevoEmail] = useState('')
  const [creando, setCreando] = useState(false)
  const [msgUsuario, setMsgUsuario] = useState('')
  const [editando, setEditando] = useState<any>(null)
  const [catNombre, setCatNombre] = useState('')
  const [catColor, setCatColor] = useState('#E24B4A')
  const [editandoCat, setEditandoCat] = useState<any>(null)
  const [msgCat, setMsgCat] = useState('')
  const [reporteDetalle, setReporteDetalle] = useState<any>(null)
  const [tecnicos, setTecnicos] = useState<any[]>([])
  const [tecnicoAsignado, setTecnicoAsignado] = useState('')
  const [fechaEstimada, setFechaEstimada] = useState('')
  const [msgReporte, setMsgReporte] = useState('')
  const [emailAdmin, setEmailAdmin] = useState('')
  const [msgConfig, setMsgConfig] = useState('')
  const [filtroReporte, setFiltroReporte] = useState<'para_aprobar'|'en_curso'|'realizadas'|'todas'>('todas')

  async function cargarUsuarios() {
    const { data } = await supabase.from('usuarios').select('*').order('created_at', { ascending: false })
    if (data) setUsuarios(data)
  }
  async function cargarCategorias() {
    const { data } = await supabase.from('categorias').select('*').order('created_at', { ascending: true })
    if (data) setCategorias(data)
  }
  async function cargarReportes() {
    setLoadingReportes(true)
    const { data } = await supabase.from('ordenes_trabajo').select('*').order('created_at', { ascending: false })
    if (data) setReportes(data)
    setLoadingReportes(false)
  }
  async function cargarTecnicos() {
    const { data } = await supabase.from('usuarios').select('*').eq('rol', 'tecnico').order('nombre')
    if (data) setTecnicos(data)
  }
  async function cargarConfig() {
    const { data } = await supabase.from('configuracion').select('*')
    if (data) {
      const emailRow = data.find(d => d.clave === 'email_admin')
      if (emailRow) setEmailAdmin(emailRow.valor)
    }
  }
  async function guardarConfig() {
    setMsgConfig('')
    const { error } = await supabase.from('configuracion').upsert({ clave: 'email_admin', valor: emailAdmin }, { onConflict: 'clave' })
    if (!error) setMsgConfig('✓ Configuración guardada')
    else setMsgConfig('Error: ' + error.message)
  }
  async function aprobarReporte(id: string) {
    setMsgReporte('')
    const updates: any = { estado: 'en_curso', aprobado_por: email }
    if (fechaEstimada) updates.fecha_estimada = fechaEstimada
    if (tecnicoAsignado) updates.tecnico_id = tecnicoAsignado
    const { error } = await supabase.from('ordenes_trabajo').update(updates).eq('id', id)
    if (!error) {
      setMsgReporte('✓ Reporte aprobado y convertido en OT')
      setReporteDetalle(null); cargarReportes()
    } else setMsgReporte('Error: ' + error.message)
  }
  async function rechazarReporte(id: string) {
    if (!window.confirm('¿Rechazar este reporte?')) return
    const { error } = await supabase.from('ordenes_trabajo').update({ estado: 'cerrada' }).eq('id', id)
    if (!error) { setReporteDetalle(null); cargarReportes() }
  }
  async function crearUsuario() {
    if (!nuevoNombre) return
    setCreando(true); setMsgUsuario('')
    const { error } = await supabase.from('usuarios').insert({
      nombre: nuevoNombre, rol: nuevoRol,
      email: nuevoRol === 'admin' ? nuevoEmail : null,
      clave: nuevoRol !== 'reportador' ? nuevaClave : null,
    })
    if (!error) {
      setMsgUsuario(`✓ Usuario "${nuevoNombre}" creado`)
      setNuevoNombre(''); setNuevaClave(''); setNuevoEmail(''); cargarUsuarios()
    } else setMsgUsuario('Error: ' + error.message)
    setCreando(false)
  }
  async function guardarEdicion() {
    if (!editando) return
    const updates: any = { nombre: editando.nombre, rol: editando.rol }
    if (editando.clave) updates.clave = editando.clave
    const { error } = await supabase.from('usuarios').update(updates).eq('id', editando.id)
    if (!error) { setEditando(null); cargarUsuarios() } else alert('Error: ' + error.message)
  }
  async function eliminarUsuario(id: string, nombre: string) {
    if (!window.confirm(`¿Eliminar a "${nombre}"?`)) return
    const { error } = await supabase.from('usuarios').delete().eq('id', id)
    if (!error) setUsuarios(prev => prev.filter(u => u.id !== id))
    else alert('Error: ' + error.message)
  }
  async function crearCategoria() {
    if (!catNombre) return; setMsgCat('')
    const { error } = await supabase.from('categorias').insert({ nombre: catNombre, color: catColor })
    if (!error) { setMsgCat(`✓ Categoría "${catNombre}" creada`); setCatNombre(''); setCatColor('#E24B4A'); cargarCategorias() }
    else setMsgCat('Error: ' + error.message)
  }
  async function guardarCategoria() {
    if (!editandoCat) return
    const { error } = await supabase.from('categorias').update({ nombre: editandoCat.nombre, color: editandoCat.color }).eq('id', editandoCat.id)
    if (!error) { setEditandoCat(null); cargarCategorias() } else alert('Error: ' + error.message)
  }
  async function eliminarCategoria(id: string, nombre: string) {
    if (!window.confirm(`¿Eliminar categoría "${nombre}"?`)) return
    const { error } = await supabase.from('categorias').delete().eq('id', id)
    if (!error) setCategorias(prev => prev.filter(c => c.id !== id))
    else alert('Error: ' + error.message)
  }

  useEffect(() => {
    if (vista === 'usuarios') cargarUsuarios()
    if (vista === 'categorias') cargarCategorias()
    if (vista === 'reportes') { cargarReportes(); cargarTecnicos() }
    if (vista === 'config') cargarConfig()
  }, [vista])
  useEffect(() => { cargarReportes() }, [])

  const COLORES = [{hex:'#E24B4A'},{hex:'#EF9F27'},{hex:'#F5CC1E'},{hex:'#3B6D11'},{hex:'#185FA5'},{hex:'#8B5CF6'},{hex:'#888780'},{hex:'#0F6E56'}]
  const estadoColor: any = {
    pendiente:{bg:'#FAEEDA',c:'#633806',label:'Pendiente'},
    en_curso:{bg:'#E6F1FB',c:'#0C447C',label:'En curso'},
    realizada:{bg:'#EAF3DE',c:'#27500A',label:'Realizada'},
    cerrada:{bg:'#F1EFE8',c:'#888780',label:'Cerrada'},
  }

  const reportesFiltrados = reportes.filter(r => {
    if (filtroReporte === 'para_aprobar') return r.estado === 'pendiente' && !r.urgente
    if (filtroReporte === 'en_curso') return r.estado === 'en_curso'
    if (filtroReporte === 'realizadas') return r.estado === 'realizada' || r.estado === 'cerrada'
    return true
  })

  // ── Config ──
  if (vista === 'config') return (
    <div style={{minHeight:'100vh',background:'#F1EFE8',fontFamily:'sans-serif'}}>
      <div style={{background:'#185FA5',padding:'14px 20px',display:'flex',alignItems:'center',gap:10}}>
        <button onClick={()=>setVista('dashboard')} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',padding:'6px 12px',borderRadius:6,cursor:'pointer',fontSize:12}}>← Volver</button>
        <span style={{color:'#fff',fontSize:16,fontWeight:500,flex:1}}>Configuración</span>
        <span style={{color:'rgba(255,255,255,0.5)',fontSize:11}}>{VERSION}</span>
      </div>
      <div style={{padding:20,display:'flex',flexDirection:'column',gap:12}}>
        <div style={{background:'#fff',borderRadius:10,padding:16,border:'0.5px solid #E8E6DE'}}>
          <div style={{fontSize:13,fontWeight:500,marginBottom:14}}>Notificaciones</div>
          <div style={{fontSize:11,color:'#888',marginBottom:4}}>EMAIL DEL ADMINISTRADOR</div>
          <input value={emailAdmin} onChange={e=>setEmailAdmin(e.target.value)} placeholder="admin@empresa.com" type="email"
            style={{width:'100%',padding:10,borderRadius:8,border:'0.5px solid #ddd',fontSize:13,marginBottom:12,boxSizing:'border-box' as const}}/>
          <div style={{background:'#E6F1FB',borderRadius:8,padding:'8px 12px',fontSize:12,color:'#0C447C',marginBottom:12}}>
            ℹ️ A este email llegarán avisos cuando entren nuevas OT (urgentes o para aprobar).
          </div>
          {msgConfig && <div style={{background:msgConfig.startsWith('✓')?'#EAF3DE':'#FCEBEB',borderRadius:8,padding:'8px 12px',fontSize:12,color:msgConfig.startsWith('✓')?'#27500A':'#A32D2D',marginBottom:12}}>{msgConfig}</div>}
          <button onClick={guardarConfig} style={{width:'100%',padding:12,borderRadius:8,background:'#185FA5',color:'#fff',border:'none',fontSize:14,fontWeight:500,cursor:'pointer'}}>Guardar configuración</button>
        </div>
      </div>
    </div>
  )

  // ── Detalle reporte ──
  if (vista === 'reportes' && reporteDetalle) return (
    <div style={{minHeight:'100vh',background:'#F1EFE8',fontFamily:'sans-serif'}}>
      <div style={{background:'#185FA5',padding:'14px 20px',display:'flex',alignItems:'center',gap:10}}>
        <button onClick={()=>{setReporteDetalle(null);setMsgReporte('');setFechaEstimada('');setTecnicoAsignado('')}} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',padding:'6px 12px',borderRadius:6,cursor:'pointer',fontSize:12}}>← Volver</button>
        <span style={{color:'#fff',fontSize:15,fontWeight:500,flex:1}}>Detalle</span>
        {reporteDetalle.urgente && <span style={{background:'#E24B4A',color:'#fff',fontSize:10,padding:'3px 10px',borderRadius:100,fontWeight:500}}>🚨 URGENTE</span>}
        <span style={{color:'rgba(255,255,255,0.5)',fontSize:11}}>{VERSION}</span>
      </div>
      <div style={{padding:20,display:'flex',flexDirection:'column',gap:12}}>
        <div style={{background:'#fff',borderRadius:10,padding:16,border:'0.5px solid #E8E6DE'}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8,marginBottom:12}}>
            <div>
              <div style={{fontSize:14,fontWeight:500}}>{reporteDetalle.titulo}</div>
              <div style={{fontSize:11,color:'#888',marginTop:3}}>{new Date(reporteDetalle.created_at).toLocaleString('es-AR')}</div>
            </div>
            <span style={{background:estadoColor[reporteDetalle.estado]?.bg||'#F1EFE8',color:estadoColor[reporteDetalle.estado]?.c||'#888',fontSize:10,padding:'3px 10px',borderRadius:100,fontWeight:500,flexShrink:0}}>
              {estadoColor[reporteDetalle.estado]?.label||reporteDetalle.estado}
            </span>
          </div>
          {reporteDetalle.urgente && (
            <div style={{background:'#FCEBEB',borderRadius:8,padding:'8px 12px',fontSize:12,color:'#791F1F',marginBottom:12,fontWeight:500}}>
              🚨 OT URGENTE — fue al técnico directamente sin aprobación
            </div>
          )}
          {reporteDetalle.descripcion && <>
            <div style={{fontSize:11,color:'#888',marginBottom:4}}>DESCRIPCIÓN</div>
            <div style={{background:'#F1EFE8',borderRadius:8,padding:'10px 12px',fontSize:13,color:'#444',lineHeight:1.5,marginBottom:12}}>
              {reporteDetalle.descripcion.split('\n\n[archivos:')[0]}
            </div>
          </>}
          {reporteDetalle.descripcion?.includes('[archivos:') && <>
            <div style={{fontSize:11,color:'#888',marginBottom:8}}>ARCHIVOS ADJUNTOS</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginBottom:12}}>
              {reporteDetalle.descripcion.split('[archivos:')[1]?.replace(']','').split(',').map((url: string, i: number) => (
                <a key={i} href={url.trim()} target="_blank" rel="noopener noreferrer"
                  style={{aspectRatio:'1',borderRadius:8,overflow:'hidden',display:'block',background:'#F1EFE8',border:'0.5px solid #E8E6DE'}}>
                  {url.trim().match(/\.(mp4|mov|avi|webm)/i) ? <video src={url.trim()} style={{width:'100%',height:'100%',objectFit:'cover'}} muted/> : <img src={url.trim()} style={{width:'100%',height:'100%',objectFit:'cover'}} alt={`adjunto ${i+1}`}/>}
                </a>
              ))}
            </div>
          </>}
          {reporteDetalle.estado === 'pendiente' && !reporteDetalle.urgente && <>
            <div style={{fontSize:11,color:'#888',marginBottom:4}}>ASIGNAR TÉCNICO</div>
            <select value={tecnicoAsignado} onChange={e=>setTecnicoAsignado(e.target.value)}
              style={{width:'100%',padding:10,borderRadius:8,border:'0.5px solid #ddd',fontSize:13,marginBottom:12,boxSizing:'border-box' as const,background:'#fff'}}>
              <option value="">— Sin asignar —</option>
              {tecnicos.map(t=>(<option key={t.id} value={t.id}>{t.nombre}</option>))}
            </select>
            <div style={{fontSize:11,color:'#888',marginBottom:4}}>FECHA ESTIMADA</div>
            <input type="date" value={fechaEstimada} onChange={e=>setFechaEstimada(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              style={{width:'100%',padding:10,borderRadius:8,border:'0.5px solid #ddd',fontSize:13,marginBottom:12,boxSizing:'border-box' as const}}/>
          </>}
          {reporteDetalle.fecha_estimada && (
            <div style={{background:'#E6F1FB',borderRadius:8,padding:'8px 12px',fontSize:12,color:'#0C447C',marginBottom:12}}>
              📅 Fecha estimada: {new Date(reporteDetalle.fecha_estimada).toLocaleDateString('es-AR')}
            </div>
          )}
          {msgReporte && <div style={{background:msgReporte.startsWith('✓')?'#EAF3DE':'#FCEBEB',borderRadius:8,padding:'8px 12px',fontSize:12,color:msgReporte.startsWith('✓')?'#27500A':'#A32D2D',marginBottom:12}}>{msgReporte}</div>}
        </div>
        {reporteDetalle.estado === 'pendiente' && !reporteDetalle.urgente && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <button onClick={()=>rechazarReporte(reporteDetalle.id)} style={{padding:13,borderRadius:10,background:'#fff',border:'0.5px solid #F7C1C1',fontSize:13,fontWeight:500,cursor:'pointer',color:'#A32D2D'}}>✕ Rechazar</button>
            <button onClick={()=>aprobarReporte(reporteDetalle.id)} style={{padding:13,borderRadius:10,background:'#3B6D11',color:'#fff',border:'none',fontSize:13,fontWeight:500,cursor:'pointer'}}>✓ Aprobar OT</button>
          </div>
        )}
        {(reporteDetalle.estado !== 'pendiente' || reporteDetalle.urgente) && (
          <div style={{background:reporteDetalle.urgente?'#FCEBEB':estadoColor[reporteDetalle.estado]?.bg,borderRadius:10,padding:12,textAlign:'center',fontSize:13,color:reporteDetalle.urgente?'#791F1F':estadoColor[reporteDetalle.estado]?.c,fontWeight:500}}>
            {reporteDetalle.urgente ? '🚨 Urgente — fue directo al técnico' : `${estadoColor[reporteDetalle.estado]?.label} — no requiere acción`}
          </div>
        )}
      </div>
    </div>
  )

  // ── Lista reportes ──
  if (vista === 'reportes') return (
    <div style={{minHeight:'100vh',background:'#F1EFE8',fontFamily:'sans-serif'}}>
      <div style={{background:'#185FA5',padding:'14px 20px',display:'flex',alignItems:'center',gap:10}}>
        <button onClick={()=>setVista('dashboard')} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',padding:'6px 12px',borderRadius:6,cursor:'pointer',fontSize:12}}>← Volver</button>
        <span style={{color:'#fff',fontSize:16,fontWeight:500,flex:1}}>Reportes y OT</span>
        <button onClick={cargarReportes} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',padding:'6px 10px',borderRadius:6,cursor:'pointer',fontSize:11}}>↻</button>
      </div>

      {/* Tabs de clasificación */}
      <div style={{background:'#fff',borderBottom:'0.5px solid #E8E6DE',padding:'10px 16px',display:'flex',gap:6,overflowX:'auto' as const}}>
        {[
          {key:'todas',label:'Todas',count:reportes.length},
          {key:'para_aprobar',label:'Para aprobar',count:reportes.filter(r=>r.estado==='pendiente'&&!r.urgente).length,color:'#633806',bg:'#FAEEDA'},
          {key:'en_curso',label:'En curso',count:reportes.filter(r=>r.estado==='en_curso').length,color:'#0C447C',bg:'#E6F1FB'},
          {key:'realizadas',label:'Realizadas',count:reportes.filter(r=>r.estado==='realizada'||r.estado==='cerrada').length,color:'#27500A',bg:'#EAF3DE'},
        ].map(tab=>(
          <button key={tab.key} onClick={()=>setFiltroReporte(tab.key as any)} style={{
            padding:'6px 12px',borderRadius:100,border:'none',cursor:'pointer',fontSize:11,fontWeight:500,
            background:filtroReporte===tab.key?(tab.bg||'#185FA5'):'#F1EFE8',
            color:filtroReporte===tab.key?(tab.color||'#fff'):'#888',
            flexShrink:0
          }}>
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div style={{padding:16,display:'flex',flexDirection:'column',gap:8}}>
        {loadingReportes && <div style={{textAlign:'center',padding:20,color:'#888',fontSize:13}}>Cargando...</div>}
        {!loadingReportes && reportesFiltrados.length === 0 && <div style={{background:'#fff',borderRadius:10,padding:24,textAlign:'center',color:'#888',fontSize:13}}>No hay OT en esta categoría</div>}
        {reportesFiltrados.map(r=>(
          <div key={r.id} onClick={()=>{setReporteDetalle(r);setTecnicoAsignado('');setFechaEstimada('');setMsgReporte('')}}
            style={{background:'#fff',borderRadius:10,padding:'12px 14px',
              border:r.urgente?'0.5px solid #F09595':r.estado==='pendiente'?'0.5px solid #FAC775':'0.5px solid #E8E6DE',
              borderLeft:r.urgente?'3px solid #E24B4A':r.estado==='pendiente'?'3px solid #EF9F27':'3px solid #E8E6DE',
              cursor:'pointer'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:8}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                  {r.urgente && <span style={{fontSize:10}}>🚨</span>}
                  <div style={{fontSize:12,fontWeight:500,whiteSpace:'nowrap' as const,overflow:'hidden',textOverflow:'ellipsis'}}>{r.titulo}</div>
                </div>
                <div style={{fontSize:10,color:'#888'}}>{new Date(r.created_at).toLocaleDateString('es-AR')}</div>
                {r.fecha_estimada && <div style={{fontSize:10,color:'#185FA5',marginTop:2}}>📅 Est: {new Date(r.fecha_estimada).toLocaleDateString('es-AR')}</div>}
                {r.descripcion?.includes('[archivos:') && <div style={{fontSize:10,color:'#185FA5',marginTop:2}}>📎 Con archivos</div>}
              </div>
              <span style={{background:estadoColor[r.estado]?.bg||'#F1EFE8',color:estadoColor[r.estado]?.c||'#888',fontSize:10,padding:'2px 8px',borderRadius:100,fontWeight:500,flexShrink:0}}>
                {estadoColor[r.estado]?.label||r.estado}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // ── Categorías ──
  if (vista === 'categorias') return (
    <div style={{minHeight:'100vh',background:'#F1EFE8',fontFamily:'sans-serif'}}>
      <div style={{background:'#185FA5',padding:'14px 20px',display:'flex',alignItems:'center',gap:10}}>
        <button onClick={()=>setVista('dashboard')} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',padding:'6px 12px',borderRadius:6,cursor:'pointer',fontSize:12}}>← Volver</button>
        <span style={{color:'#fff',fontSize:16,fontWeight:500,flex:1}}>Categorías de OT</span>
      </div>
      <div style={{padding:20,display:'flex',flexDirection:'column',gap:12}}>
        <div style={{background:'#fff',borderRadius:10,padding:16,border:'0.5px solid #E8E6DE'}}>
          <div style={{fontSize:13,fontWeight:500,marginBottom:14}}>Nueva categoría</div>
          <div style={{fontSize:11,color:'#888',marginBottom:4}}>NOMBRE</div>
          <input value={catNombre} onChange={e=>setCatNombre(e.target.value)} placeholder="Ej: Urgente, Preventivo..."
            style={{width:'100%',padding:10,borderRadius:8,border:'0.5px solid #ddd',fontSize:13,marginBottom:12,boxSizing:'border-box' as const}}/>
          <div style={{fontSize:11,color:'#888',marginBottom:8}}>COLOR</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap' as const,marginBottom:12}}>
            {COLORES.map(c=>(<button key={c.hex} onClick={()=>setCatColor(c.hex)} style={{width:32,height:32,borderRadius:'50%',background:c.hex,border:catColor===c.hex?'3px solid #333':'2px solid transparent',cursor:'pointer'}}/>))}
            <input type="color" value={catColor} onChange={e=>setCatColor(e.target.value)} style={{width:32,height:32,borderRadius:'50%',border:'0.5px solid #ddd',cursor:'pointer',padding:2}}/>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
            <div style={{width:36,height:36,borderRadius:8,background:catColor,flexShrink:0}}></div>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500}}>{catNombre||'Vista previa'}</div><div style={{fontSize:11,color:'#888'}}>{catColor}</div></div>
            <span style={{background:catColor,color:'#fff',fontSize:11,padding:'3px 10px',borderRadius:100,fontWeight:500}}>{catNombre||'Categoría'}</span>
          </div>
          {msgCat && <div style={{background:msgCat.startsWith('✓')?'#EAF3DE':'#FCEBEB',borderRadius:8,padding:'8px 12px',fontSize:12,color:msgCat.startsWith('✓')?'#27500A':'#A32D2D',marginBottom:12}}>{msgCat}</div>}
          <button onClick={crearCategoria} disabled={!catNombre} style={{width:'100%',padding:12,borderRadius:8,background:catNombre?catColor:'#ccc',color:'#fff',border:'none',fontSize:14,fontWeight:500,cursor:'pointer'}}>Crear categoría</button>
        </div>
        <div style={{background:'#fff',borderRadius:10,padding:16,border:'0.5px solid #E8E6DE'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:500}}>Categorías ({categorias.length})</div>
            <button onClick={cargarCategorias} style={{fontSize:11,color:'#185FA5',background:'transparent',border:'none',cursor:'pointer'}}>Actualizar</button>
          </div>
          {categorias.map(c=>(
            <div key={c.id}>
              {editandoCat?.id === c.id ? (
                <div style={{padding:'10px 0',borderBottom:'0.5px solid #F1EFE8'}}>
                  <input value={editandoCat.nombre} onChange={e=>setEditandoCat({...editandoCat,nombre:e.target.value})} style={{width:'100%',padding:8,borderRadius:7,border:'0.5px solid #ddd',fontSize:13,marginBottom:8,boxSizing:'border-box' as const}}/>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap' as const,marginBottom:8}}>
                    {COLORES.map(col=>(<button key={col.hex} onClick={()=>setEditandoCat({...editandoCat,color:col.hex})} style={{width:28,height:28,borderRadius:'50%',background:col.hex,border:editandoCat.color===col.hex?'3px solid #333':'2px solid transparent',cursor:'pointer'}}/>))}
                    <input type="color" value={editandoCat.color} onChange={e=>setEditandoCat({...editandoCat,color:e.target.value})} style={{width:28,height:28,borderRadius:'50%',border:'0.5px solid #ddd',cursor:'pointer',padding:1}}/>
                  </div>
                  <div style={{display:'flex',gap:6}}>
                    <button onClick={guardarCategoria} style={{flex:1,padding:'8px',borderRadius:7,border:'none',background:'#185FA5',color:'#fff',fontSize:12,cursor:'pointer',fontWeight:500}}>✓ Guardar</button>
                    <button onClick={()=>setEditandoCat(null)} style={{flex:1,padding:'8px',borderRadius:7,border:'0.5px solid #ddd',background:'transparent',fontSize:12,cursor:'pointer'}}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:'0.5px solid #F1EFE8'}}>
                  <div style={{width:32,height:32,borderRadius:8,background:c.color,flexShrink:0}}></div>
                  <div style={{flex:1}}><div style={{fontSize:12,fontWeight:500}}>{c.nombre}</div><div style={{fontSize:10,color:'#888'}}>{c.color}</div></div>
                  <span style={{background:c.color,color:'#fff',fontSize:10,padding:'2px 10px',borderRadius:100,fontWeight:500}}>{c.nombre}</span>
                  <button onClick={()=>setEditandoCat({...c})} style={{padding:'4px 8px',borderRadius:6,border:'0.5px solid #ddd',background:'transparent',fontSize:11,cursor:'pointer',color:'#185FA5'}}>✏️</button>
                  <button onClick={()=>eliminarCategoria(c.id,c.nombre)} style={{padding:'4px 8px',borderRadius:6,border:'0.5px solid #F7C1C1',background:'transparent',fontSize:11,cursor:'pointer',color:'#A32D2D'}}>✕</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ── Usuarios ──
  if (vista === 'usuarios') return (
    <div style={{minHeight:'100vh',background:'#F1EFE8',fontFamily:'sans-serif'}}>
      <div style={{background:'#185FA5',padding:'14px 20px',display:'flex',alignItems:'center',gap:10}}>
        <button onClick={()=>setVista('dashboard')} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',padding:'6px 12px',borderRadius:6,cursor:'pointer',fontSize:12}}>← Volver</button>
        <span style={{color:'#fff',fontSize:16,fontWeight:500,flex:1}}>Gestión de usuarios</span>
      </div>
      <div style={{padding:20,display:'flex',flexDirection:'column',gap:12}}>
        <div style={{background:'#fff',borderRadius:10,padding:16,border:'0.5px solid #E8E6DE'}}>
          <div style={{fontSize:13,fontWeight:500,marginBottom:14}}>Crear nuevo usuario</div>
          <div style={{fontSize:11,color:'#888',marginBottom:4}}>NOMBRE</div>
          <input value={nuevoNombre} onChange={e=>setNuevoNombre(e.target.value)} placeholder="Ej: Juan Ramírez"
            style={{width:'100%',padding:10,borderRadius:8,border:'0.5px solid #ddd',fontSize:13,marginBottom:12,boxSizing:'border-box' as const}}/>
          <div style={{fontSize:11,color:'#888',marginBottom:4}}>ROL</div>
          <div style={{display:'flex',gap:6,marginBottom:12}}>
            {(['tecnico','reportador','admin'] as const).map(r=>(
              <button key={r} onClick={()=>setNuevoRol(r)} style={{flex:1,padding:'8px 4px',borderRadius:8,border:'0.5px solid',borderColor:nuevoRol===r?'#185FA5':'#ddd',background:nuevoRol===r?'#E6F1FB':'transparent',color:nuevoRol===r?'#185FA5':'#888',fontWeight:nuevoRol===r?500:400,cursor:'pointer',fontSize:12}}>
                {r==='tecnico'?'🔧 Técnico':r==='reportador'?'👤 Reportador':'🛡️ Admin'}
              </button>
            ))}
          </div>
          {nuevoRol === 'tecnico' && <><div style={{fontSize:11,color:'#888',marginBottom:4}}>CONTRASEÑA</div><input value={nuevaClave} onChange={e=>setNuevaClave(e.target.value)} placeholder="Contraseña" type="password" style={{width:'100%',padding:10,borderRadius:8,border:'0.5px solid #ddd',fontSize:13,marginBottom:12,boxSizing:'border-box' as const}}/></>}
          {nuevoRol === 'admin' && <><div style={{fontSize:11,color:'#888',marginBottom:4}}>EMAIL</div><input value={nuevoEmail} onChange={e=>setNuevoEmail(e.target.value)} placeholder="email@empresa.com" type="email" style={{width:'100%',padding:10,borderRadius:8,border:'0.5px solid #ddd',fontSize:13,marginBottom:8,boxSizing:'border-box' as const}}/><div style={{fontSize:11,color:'#888',marginBottom:4}}>CONTRASEÑA</div><input value={nuevaClave} onChange={e=>setNuevaClave(e.target.value)} placeholder="Contraseña segura" type="password" style={{width:'100%',padding:10,borderRadius:8,border:'0.5px solid #ddd',fontSize:13,marginBottom:12,boxSizing:'border-box' as const}}/></>}
          {nuevoRol === 'reportador' && <div style={{background:'#E6F1FB',borderRadius:8,padding:'8px 12px',fontSize:12,color:'#0C447C',marginBottom:12}}>ℹ️ El reportador solo necesita su nombre para ingresar.</div>}
          {msgUsuario && <div style={{background:msgUsuario.startsWith('✓')?'#EAF3DE':'#FCEBEB',borderRadius:8,padding:'8px 12px',fontSize:12,color:msgUsuario.startsWith('✓')?'#27500A':'#A32D2D',marginBottom:12}}>{msgUsuario}</div>}
          <button onClick={crearUsuario} disabled={!nuevoNombre||creando} style={{width:'100%',padding:12,borderRadius:8,background:nuevoNombre?'#185FA5':'#ccc',color:'#fff',border:'none',fontSize:14,fontWeight:500,cursor:'pointer'}}>{creando?'Creando...':'Crear usuario'}</button>
        </div>
        <div style={{background:'#fff',borderRadius:10,padding:16,border:'0.5px solid #E8E6DE'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:500}}>Usuarios ({usuarios.length})</div>
            <button onClick={cargarUsuarios} style={{fontSize:11,color:'#185FA5',background:'transparent',border:'none',cursor:'pointer'}}>Actualizar</button>
          </div>
          {usuarios.length === 0 ? <div style={{fontSize:12,color:'#888',textAlign:'center',padding:'12px 0'}}>No hay usuarios aún</div>
          : usuarios.map(u=>(
            <div key={u.id}>
              {editando?.id === u.id ? (
                <div style={{padding:'10px 0',borderBottom:'0.5px solid #F1EFE8'}}>
                  <input value={editando.nombre} onChange={e=>setEditando({...editando,nombre:e.target.value})} style={{width:'100%',padding:8,borderRadius:7,border:'0.5px solid #ddd',fontSize:13,marginBottom:8,boxSizing:'border-box' as const}}/>
                  <div style={{display:'flex',gap:5,marginBottom:8}}>
                    {(['tecnico','reportador','admin'] as const).map(r=>(<button key={r} onClick={()=>setEditando({...editando,rol:r})} style={{flex:1,padding:'6px 4px',borderRadius:6,border:'0.5px solid',borderColor:editando.rol===r?'#185FA5':'#ddd',background:editando.rol===r?'#E6F1FB':'transparent',color:editando.rol===r?'#185FA5':'#888',fontSize:11,cursor:'pointer'}}>{r==='tecnico'?'🔧':r==='reportador'?'👤':'🛡️'} {r}</button>))}
                  </div>
                  <input value={editando.clave||''} onChange={e=>setEditando({...editando,clave:e.target.value})} placeholder="Nueva contraseña (opcional)" type="password" style={{width:'100%',padding:8,borderRadius:7,border:'0.5px solid #ddd',fontSize:13,marginBottom:10,boxSizing:'border-box' as const}}/>
                  <div style={{display:'flex',gap:6}}>
                    <button onClick={guardarEdicion} style={{flex:1,padding:'8px',borderRadius:7,border:'none',background:'#185FA5',color:'#fff',fontSize:12,cursor:'pointer',fontWeight:500}}>✓ Guardar</button>
                    <button onClick={()=>setEditando(null)} style={{flex:1,padding:'8px',borderRadius:7,border:'0.5px solid #ddd',background:'transparent',fontSize:12,cursor:'pointer'}}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:'0.5px solid #F1EFE8'}}>
                  <div style={{width:32,height:32,borderRadius:'50%',background:u.rol==='tecnico'?'#EAF3DE':u.rol==='admin'?'#E6F1FB':'#E1F5EE',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>{u.rol==='tecnico'?'🔧':u.rol==='admin'?'🛡️':'👤'}</div>
                  <div style={{flex:1}}><div style={{fontSize:12,fontWeight:500}}>{u.nombre}</div><div style={{fontSize:10,color:'#888',marginTop:1,textTransform:'capitalize' as const}}>{u.rol}</div></div>
                  <button onClick={()=>setEditando({...u,clave:''})} style={{padding:'4px 8px',borderRadius:6,border:'0.5px solid #ddd',background:'transparent',fontSize:11,cursor:'pointer',color:'#185FA5'}}>✏️</button>
                  <button onClick={()=>eliminarUsuario(u.id,u.nombre)} style={{padding:'4px 8px',borderRadius:6,border:'0.5px solid #F7C1C1',background:'transparent',fontSize:11,cursor:'pointer',color:'#A32D2D'}}>✕</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ── Dashboard principal ──
  const pendientes = reportes.filter(r => r.estado === 'pendiente' && !r.urgente).length
  const urgentes = reportes.filter(r => r.urgente && r.estado === 'en_curso').length
  return (
    <div style={{minHeight:'100vh',background:'#F1EFE8',fontFamily:'sans-serif'}}>
      <div style={{background:'#185FA5',padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{color:'#fff',fontSize:16,fontWeight:500}}>MantePro — Admin</span>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{color:'rgba(255,255,255,0.5)',fontSize:11}}>{VERSION}</span>
          <button onClick={onSalir} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',padding:'6px 14px',borderRadius:6,cursor:'pointer',fontSize:12}}>Salir</button>
        </div>
      </div>
      <div style={{padding:20,display:'flex',flexDirection:'column',gap:12}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
          <div style={{background:'#FCEBEB',borderRadius:10,padding:'12px 10px',textAlign:'center',cursor:'pointer'}} onClick={()=>setVista('reportes')}>
            <div style={{fontSize:22,fontWeight:500,color:'#A32D2D'}}>{pendientes}</div>
            <div style={{fontSize:10,color:'#888',marginTop:3}}>Para aprobar</div>
          </div>
          <div style={{background:'#FAEEDA',borderRadius:10,padding:'12px 10px',textAlign:'center',cursor:'pointer'}} onClick={()=>setVista('reportes')}>
            <div style={{fontSize:22,fontWeight:500,color:'#854F0B'}}>{urgentes}</div>
            <div style={{fontSize:10,color:'#888',marginTop:3}}>🚨 Urgentes</div>
          </div>
          <div style={{background:'#E6F1FB',borderRadius:10,padding:'12px 10px',textAlign:'center'}}>
            <div style={{fontSize:22,fontWeight:500,color:'#185FA5'}}>{reportes.filter(r=>r.estado==='en_curso').length}</div>
            <div style={{fontSize:10,color:'#888',marginTop:3}}>En curso</div>
          </div>
        </div>

        {pendientes > 0 && (
          <div style={{background:'#FAEEDA',borderRadius:10,padding:'12px 14px',display:'flex',alignItems:'center',gap:10,cursor:'pointer',border:'0.5px solid #FAC775'}} onClick={()=>setVista('reportes')}>
            <span style={{fontSize:20}}>⚠️</span>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:500,color:'#633806'}}>{pendientes} reporte{pendientes>1?'s':''} esperando aprobación</div>
              <div style={{fontSize:11,color:'#854F0B'}}>Tocá para revisar</div>
            </div>
            <span style={{color:'#854F0B',fontSize:16}}>→</span>
          </div>
        )}

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <button onClick={()=>setVista('reportes')} style={{padding:12,borderRadius:10,background:'#fff',border:'0.5px solid #E8E6DE',fontSize:12,fontWeight:500,cursor:'pointer',color:'#185FA5'}}>📋 Reportes</button>
          <button onClick={()=>setVista('usuarios')} style={{padding:12,borderRadius:10,background:'#fff',border:'0.5px solid #E8E6DE',fontSize:12,fontWeight:500,cursor:'pointer',color:'#185FA5'}}>👥 Usuarios</button>
          <button onClick={()=>setVista('categorias')} style={{padding:12,borderRadius:10,background:'#fff',border:'0.5px solid #E8E6DE',fontSize:12,fontWeight:500,cursor:'pointer',color:'#185FA5'}}>🏷️ Categorías</button>
          <button onClick={()=>setVista('config')} style={{padding:12,borderRadius:10,background:'#fff',border:'0.5px solid #E8E6DE',fontSize:12,fontWeight:500,cursor:'pointer',color:'#185FA5'}}>⚙️ Config</button>
        </div>
        <button style={{width:'100%',padding:13,borderRadius:10,background:'#185FA5',color:'#fff',border:'none',fontSize:13,fontWeight:500,cursor:'pointer'}}>+ Nueva OT</button>
      </div>
    </div>
  )
}

// ─── TÉCNICO ─────────────────────────────────────────────────────────────────
function DashboardTecnico({ nombre, usuarioId, onSalir }: { nombre: string, usuarioId: string, onSalir: () => void }) {
  const [vista, setVista] = useState<'mis-ot'|'detalle'|'nueva-ot'>('mis-ot')
  const [misOT, setMisOT] = useState<any[]>([])
  const [otDetalle, setOtDetalle] = useState<any>(null)
  const [observaciones, setObservaciones] = useState<any[]>([])
  const [nuevaObs, setNuevaObs] = useState('')
  const [archivos, setArchivos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [ntTitulo, setNtTitulo] = useState('')
  const [ntDesc, setNtDesc] = useState('')
  const [ntUrgente, setNtUrgente] = useState(false)
  const [ntCreando, setNtCreando] = useState(false)
  const [ntMsg, setNtMsg] = useState('')

  async function cargarMisOT() {
    const { data } = await supabase.from('ordenes_trabajo').select('*')
      .eq('tecnico_id', usuarioId)
      .in('estado', ['en_curso','pendiente','realizada'])
      .order('created_at', { ascending: false })
    if (data) setMisOT(data)
  }

  async function abrirDetalle(ot: any) {
    setOtDetalle(ot); setVista('detalle'); setMsg(''); setNuevaObs(''); setArchivos([]); setPreviews([])
    const { data } = await supabase.from('observaciones').select('*').eq('orden_id', ot.id).order('created_at')
    if (data) setObservaciones(data)
  }

  async function agregarObservacion() {
    if (!nuevaObs.trim() || !otDetalle) return
    setGuardando(true)
    const { error } = await supabase.from('observaciones').insert({ orden_id: otDetalle.id, usuario_id: usuarioId, contenido: nuevaObs.trim() })
    if (!error) {
      setNuevaObs('')
      const { data } = await supabase.from('observaciones').select('*').eq('orden_id', otDetalle.id).order('created_at')
      if (data) setObservaciones(data)
    }
    setGuardando(false)
  }

  function agregarArchivos(files: FileList | null) {
    if (!files) return
    const nuevos = Array.from(files).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/')).slice(0, 5 - archivos.length)
    const nuevosArchivos = [...archivos, ...nuevos].slice(0, 5)
    setArchivos(nuevosArchivos); setPreviews(nuevosArchivos.map(f => URL.createObjectURL(f)))
  }

  function quitarArchivo(i: number) {
    const nuevos = archivos.filter((_,idx) => idx !== i)
    setArchivos(nuevos); setPreviews(nuevos.map(f => URL.createObjectURL(f)))
  }

  async function subirFotos() {
    if (!archivos.length || !otDetalle) return
    setGuardando(true); setMsg('Subiendo fotos...')
    for (let i = 0; i < archivos.length; i++) {
      const ext = archivos[i].name.split('.').pop()
      const path = `ot/${otDetalle.id}/${Date.now()}-${i}.${ext}`
      const { error } = await supabase.storage.from('fotos-ot').upload(path, archivos[i])
      if (!error) {
        const { data: urlData } = supabase.storage.from('fotos-ot').getPublicUrl(path)
        await supabase.from('fotos').insert({ orden_id: otDetalle.id, usuario_id: usuarioId, url: urlData.publicUrl, etiqueta: 'general' })
      }
    }
    setArchivos([]); setPreviews([])
    setMsg(`✓ ${archivos.length} foto${archivos.length>1?'s':''} subida${archivos.length>1?'s':''}`)
    setGuardando(false)
  }

  async function marcarRealizada() {
    if (!otDetalle || !window.confirm('¿Marcar esta OT como realizada?')) return
    setGuardando(true)
    const { error } = await supabase.from('ordenes_trabajo').update({ estado: 'realizada' }).eq('id', otDetalle.id)
    if (!error) { setMsg('✓ OT marcada como realizada. El admin fue notificado.'); setOtDetalle({...otDetalle,estado:'realizada'}); cargarMisOT() }
    else setMsg('Error: ' + error.message)
    setGuardando(false)
  }

  async function crearOTPropia() {
    if (!ntTitulo) return
    setNtCreando(true); setNtMsg('')
    const { error } = await supabase.from('ordenes_trabajo').insert({
      titulo: ntTitulo, descripcion: ntDesc,
      estado: ntUrgente ? 'en_curso' : 'realizada',
      prioridad: ntUrgente ? 'alta' : 'media',
      urgente: ntUrgente,
      tecnico_id: usuarioId,
      aprobado_por: 'auto-tecnico',
    })
    if (!error) {
      setNtMsg('✓ OT creada y cerrada')
      setNtTitulo(''); setNtDesc(''); setNtUrgente(false); cargarMisOT()
    } else setNtMsg('Error: ' + error.message)
    setNtCreando(false)
  }

  useEffect(() => { cargarMisOT() }, [])

  const estadoColor: any = {
    pendiente:{bg:'#FAEEDA',c:'#633806',label:'Pendiente'},
    en_curso:{bg:'#E6F1FB',c:'#0C447C',label:'En curso'},
    realizada:{bg:'#EAF3DE',c:'#27500A',label:'Realizada'},
    cerrada:{bg:'#F1EFE8',c:'#888780',label:'Cerrada'},
  }

  const otVencidas = misOT.filter(ot => ot.fecha_estimada && ot.estado === 'en_curso' && new Date(ot.fecha_estimada) <= new Date())

  if (vista === 'nueva-ot') return (
    <div style={{minHeight:'100vh',background:'#F1EFE8',fontFamily:'sans-serif'}}>
      <div style={{background:'#3B6D11',padding:'14px 20px',display:'flex',alignItems:'center',gap:10}}>
        <button onClick={()=>setVista('mis-ot')} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',padding:'6px 12px',borderRadius:6,cursor:'pointer',fontSize:12}}>← Volver</button>
        <span style={{color:'#fff',fontSize:15,fontWeight:500,flex:1}}>Crear OT propia</span>
        <span style={{color:'rgba(255,255,255,0.5)',fontSize:11}}>{VERSION}</span>
      </div>
      <div style={{padding:20,display:'flex',flexDirection:'column',gap:12}}>
        <div style={{background:'#E6F1FB',borderRadius:10,padding:'10px 14px',fontSize:12,color:'#0C447C'}}>
          ℹ️ Podés crear, resolver y cerrar esta OT vos mismo.
        </div>
        <div style={{background:'#fff',borderRadius:10,padding:16,border:'0.5px solid #E8E6DE'}}>
          <div style={{fontSize:11,color:'#888',marginBottom:4}}>TÍTULO *</div>
          <input value={ntTitulo} onChange={e=>setNtTitulo(e.target.value)} placeholder="Ej: Cambio de aceite compresor"
            style={{width:'100%',padding:10,borderRadius:8,border:'0.5px solid #ddd',fontSize:13,marginBottom:12,boxSizing:'border-box' as const}}/>
          <div style={{fontSize:11,color:'#888',marginBottom:4}}>DESCRIPCIÓN / SOLUCIÓN</div>
          <textarea value={ntDesc} onChange={e=>setNtDesc(e.target.value)} placeholder="Describí el trabajo realizado..."
            style={{width:'100%',padding:10,borderRadius:8,border:'0.5px solid #ddd',fontSize:13,marginBottom:12,minHeight:72,resize:'none' as const,boxSizing:'border-box' as const,fontFamily:'sans-serif'}}/>
          
          {/* Toggle urgente */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:ntUrgente?'#FCEBEB':'#F1EFE8',borderRadius:9,padding:'10px 12px',marginBottom:12,border:ntUrgente?'0.5px solid #F7C1C1':'0.5px solid #E8E6DE'}}>
            <div>
              <div style={{fontSize:12,fontWeight:500,color:ntUrgente?'#791F1F':'#444'}}>🚨 Marcar como urgente</div>
              <div style={{fontSize:10,color:ntUrgente?'#A32D2D':'#888',marginTop:2}}>Va directo al plan, sin aprobación</div>
            </div>
            <button onClick={()=>setNtUrgente(!ntUrgente)} style={{
              width:40,height:22,borderRadius:100,border:'none',cursor:'pointer',position:'relative',
              background:ntUrgente?'#E24B4A':'#ccc',transition:'background 0.2s'
            }}>
              <div style={{position:'absolute',top:2,left:ntUrgente?20:2,width:18,height:18,borderRadius:'50%',background:'#fff',transition:'left 0.2s'}}></div>
            </button>
          </div>

          {ntMsg && <div style={{background:ntMsg.startsWith('✓')?'#EAF3DE':'#FCEBEB',borderRadius:8,padding:'8px 12px',fontSize:12,color:ntMsg.startsWith('✓')?'#27500A':'#A32D2D',marginBottom:12}}>{ntMsg}</div>}
          <button onClick={crearOTPropia} disabled={!ntTitulo||ntCreando} style={{width:'100%',padding:12,borderRadius:8,background:ntTitulo?ntUrgente?'#E24B4A':'#3B6D11':'#ccc',color:'#fff',border:'none',fontSize:14,fontWeight:500,cursor:'pointer'}}>
            {ntCreando?'Creando...':`${ntUrgente?'🚨 Crear OT urgente':'✓ Crear y cerrar OT'}`}
          </button>
        </div>
      </div>
    </div>
  )

  if (vista === 'detalle' && otDetalle) return (
    <div style={{minHeight:'100vh',background:'#F1EFE8',fontFamily:'sans-serif'}}>
      <div style={{background:otDetalle.urgente?'#C0392B':'#3B6D11',padding:'14px 20px',display:'flex',alignItems:'center',gap:10}}>
        <button onClick={()=>{setVista('mis-ot');setOtDetalle(null)}} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',padding:'6px 12px',borderRadius:6,cursor:'pointer',fontSize:12}}>← Volver</button>
        <span style={{color:'#fff',fontSize:14,fontWeight:500,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{otDetalle.urgente?'🚨 ':''}{otDetalle.titulo}</span>
        <span style={{background:estadoColor[otDetalle.estado]?.bg,color:estadoColor[otDetalle.estado]?.c,fontSize:10,padding:'2px 8px',borderRadius:100,fontWeight:500,flexShrink:0}}>{estadoColor[otDetalle.estado]?.label}</span>
      </div>
      <div style={{padding:20,display:'flex',flexDirection:'column',gap:12}}>
        <div style={{background:'#fff',borderRadius:10,padding:14,border:'0.5px solid #E8E6DE'}}>
          {otDetalle.urgente && <div style={{background:'#FCEBEB',borderRadius:7,padding:'6px 10px',fontSize:11,color:'#791F1F',fontWeight:500,marginBottom:8}}>🚨 OT URGENTE</div>}
          {otDetalle.descripcion && <div style={{fontSize:13,color:'#444',lineHeight:1.5}}>{otDetalle.descripcion.split('\n\n[archivos:')[0]}</div>}
          {otDetalle.fecha_estimada && (
            <div style={{background:new Date(otDetalle.fecha_estimada)<=new Date()?'#FCEBEB':'#E6F1FB',borderRadius:7,padding:'6px 10px',fontSize:11,color:new Date(otDetalle.fecha_estimada)<=new Date()?'#A32D2D':'#0C447C',marginTop:8}}>
              {new Date(otDetalle.fecha_estimada)<=new Date()?'⚠️ Vencida — ':'📅 Fecha estimada: '}{new Date(otDetalle.fecha_estimada).toLocaleDateString('es-AR')}
            </div>
          )}
        </div>

        <div style={{background:'#fff',borderRadius:10,padding:14,border:'0.5px solid #E8E6DE'}}>
          <div style={{fontSize:12,fontWeight:500,marginBottom:10}}>Observaciones ({observaciones.length})</div>
          {observaciones.map((obs,i)=>(
            <div key={i} style={{background:'#F1EFE8',borderRadius:8,padding:'8px 10px',marginBottom:8,borderLeft:'2px solid #378ADD'}}>
              <div style={{fontSize:10,color:'#888',marginBottom:3}}>{new Date(obs.created_at).toLocaleString('es-AR')}</div>
              <div style={{fontSize:12,lineHeight:1.4}}>{obs.contenido}</div>
            </div>
          ))}
          <textarea value={nuevaObs} onChange={e=>setNuevaObs(e.target.value)} placeholder="Agregar observación..."
            style={{width:'100%',padding:9,borderRadius:8,border:'0.5px solid #ddd',fontSize:12,marginBottom:8,minHeight:60,resize:'none' as const,boxSizing:'border-box' as const,fontFamily:'sans-serif'}}/>
          <button onClick={agregarObservacion} disabled={!nuevaObs.trim()||guardando} style={{width:'100%',padding:9,borderRadius:8,background:nuevaObs.trim()?'#185FA5':'#ccc',color:'#fff',border:'none',fontSize:12,fontWeight:500,cursor:'pointer'}}>+ Agregar observación</button>
        </div>

        <div style={{background:'#fff',borderRadius:10,padding:14,border:'0.5px solid #E8E6DE'}}>
          <div style={{fontSize:12,fontWeight:500,marginBottom:10}}>Fotos del trabajo</div>
          {previews.length > 0 && (
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginBottom:10}}>
              {previews.map((url,i)=>(
                <div key={i} style={{position:'relative',aspectRatio:'1',borderRadius:8,overflow:'hidden',background:'#F1EFE8'}}>
                  {archivos[i]?.type.startsWith('video/')?<video src={url} style={{width:'100%',height:'100%',objectFit:'cover'}} muted/>:<img src={url} style={{width:'100%',height:'100%',objectFit:'cover'}} alt={`foto ${i+1}`}/>}
                  <div style={{position:'absolute',top:3,right:3,background:'rgba(0,0,0,0.5)',borderRadius:'50%',width:18,height:18,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#fff',fontSize:10}} onClick={()=>quitarArchivo(i)}>✕</div>
                </div>
              ))}
            </div>
          )}
          {archivos.length < 5 && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:archivos.length>0?8:0}}>
              <button onClick={()=>{if(inputRef.current){inputRef.current.accept='image/*';(inputRef.current as any).capture='environment';inputRef.current.click()}}} style={{padding:'9px',borderRadius:8,border:'0.5px dashed #3B6D11',background:'#EAF3DE',color:'#27500A',fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>📷 Sacar foto</button>
              <button onClick={()=>{if(inputRef.current){inputRef.current.accept='image/*,video/*';(inputRef.current as any).capture=undefined;inputRef.current.click()}}} style={{padding:'9px',borderRadius:8,border:'0.5px dashed #ddd',background:'#F1EFE8',color:'#555',fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>🖼️ Galería</button>
            </div>
          )}
          <input ref={inputRef} type="file" accept="image/*,video/*" multiple style={{display:'none'}} onChange={e=>agregarArchivos(e.target.files)}/>
          {archivos.length > 0 && <button onClick={subirFotos} disabled={guardando} style={{width:'100%',padding:9,borderRadius:8,background:'#3B6D11',color:'#fff',border:'none',fontSize:12,fontWeight:500,cursor:'pointer',marginTop:8}}>{guardando?'Subiendo...':'↑ Subir fotos'}</button>}
        </div>

        {msg && <div style={{background:msg.startsWith('✓')?'#EAF3DE':'#FCEBEB',borderRadius:9,padding:'10px 14px',fontSize:12,color:msg.startsWith('✓')?'#27500A':'#A32D2D'}}>{msg}</div>}

        {otDetalle.estado === 'en_curso' && <button onClick={marcarRealizada} disabled={guardando} style={{width:'100%',padding:13,borderRadius:10,background:'#3B6D11',color:'#fff',border:'none',fontSize:14,fontWeight:500,cursor:'pointer'}}>✓ Marcar como realizada</button>}
        {otDetalle.estado === 'realizada' && <div style={{background:'#EAF3DE',borderRadius:10,padding:12,textAlign:'center',fontSize:13,color:'#27500A',fontWeight:500}}>✓ Realizada — esperando confirmación del admin</div>}
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#F1EFE8',fontFamily:'sans-serif'}}>
      <div style={{background:'#3B6D11',padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{color:'#fff',fontSize:16,fontWeight:500}}>Hola, {nombre}</span>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{color:'rgba(255,255,255,0.5)',fontSize:11}}>{VERSION}</span>
          <button onClick={onSalir} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',padding:'6px 14px',borderRadius:6,cursor:'pointer',fontSize:12}}>Salir</button>
        </div>
      </div>
      <div style={{padding:20,display:'flex',flexDirection:'column',gap:12}}>
        {otVencidas.length > 0 && (
          <div style={{background:'#FCEBEB',borderRadius:10,padding:'12px 14px',border:'0.5px solid #F7C1C1'}}>
            <div style={{fontSize:12,fontWeight:500,color:'#791F1F',marginBottom:4}}>⚠️ {otVencidas.length} OT vencida{otVencidas.length>1?'s':''}</div>
            {otVencidas.map(ot=>(<div key={ot.id} style={{fontSize:11,color:'#A32D2D',cursor:'pointer'}} onClick={()=>abrirDetalle(ot)}>• {ot.titulo} — venció {new Date(ot.fecha_estimada).toLocaleDateString('es-AR')}</div>))}
          </div>
        )}
        <div style={{background:'#fff',borderRadius:10,padding:16,border:'0.5px solid #E8E6DE'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:500}}>Mis OT activas ({misOT.length})</div>
            <button onClick={cargarMisOT} style={{fontSize:11,color:'#3B6D11',background:'transparent',border:'none',cursor:'pointer'}}>↻</button>
          </div>
          {misOT.length === 0 ? <div style={{fontSize:12,color:'#888',textAlign:'center',padding:'16px 0'}}>No tenés OT asignadas</div>
          : misOT.map(ot=>(
            <div key={ot.id} onClick={()=>abrirDetalle(ot)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'0.5px solid #F1EFE8',cursor:'pointer'}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:500,whiteSpace:'nowrap' as const,overflow:'hidden',textOverflow:'ellipsis'}}>{ot.urgente?'🚨 ':''}{ot.titulo}</div>
                <div style={{fontSize:10,color:'#888',marginTop:2}}>{new Date(ot.created_at).toLocaleDateString('es-AR')}{ot.fecha_estimada&&` · 📅 ${new Date(ot.fecha_estimada).toLocaleDateString('es-AR')}`}</div>
              </div>
              <span style={{background:estadoColor[ot.estado]?.bg||'#F1EFE8',color:estadoColor[ot.estado]?.c||'#888',fontSize:10,padding:'2px 8px',borderRadius:100,fontWeight:500,flexShrink:0}}>{estadoColor[ot.estado]?.label||ot.estado}</span>
            </div>
          ))}
        </div>
        <button onClick={()=>setVista('nueva-ot')} style={{width:'100%',padding:13,borderRadius:10,background:'#3B6D11',color:'#fff',border:'none',fontSize:14,fontWeight:500,cursor:'pointer'}}>+ Crear OT propia</button>
      </div>
    </div>
  )
}

// ─── REPORTADOR ──────────────────────────────────────────────────────────────
function DashboardReportador({ nombre, onSalir }: { nombre: string, onSalir: () => void }) {
  const [titulo, setTitulo] = useState('')
  const [desc, setDesc] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [urgente, setUrgente] = useState(false)
  const [categorias, setCategorias] = useState<any[]>([])
  const [archivos, setArchivos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [progreso, setProgreso] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.from('categorias').select('*').order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setCategorias(data) })
  }, [])

  function agregarArchivos(files: FileList | null) {
    if (!files) return
    const nuevos = Array.from(files).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/')).slice(0, 5 - archivos.length)
    const nuevosArchivos = [...archivos, ...nuevos].slice(0, 5)
    setArchivos(nuevosArchivos); setPreviews(nuevosArchivos.map(f => URL.createObjectURL(f)))
  }

  function quitarArchivo(i: number) {
    const nuevos = archivos.filter((_,idx) => idx !== i)
    setArchivos(nuevos); setPreviews(nuevos.map(f => URL.createObjectURL(f)))
  }

  async function enviarReporte() {
    if (!titulo) return
    setEnviando(true)
    const urlsSubidas: string[] = []
    for (let i = 0; i < archivos.length; i++) {
      setProgreso(`Subiendo archivo ${i+1} de ${archivos.length}...`)
      const ext = archivos[i].name.split('.').pop()
      const path = `reportes/${Date.now()}-${i}.${ext}`
      const { error } = await supabase.storage.from('fotos-ot').upload(path, archivos[i])
      if (!error) {
        const { data } = supabase.storage.from('fotos-ot').getPublicUrl(path)
        urlsSubidas.push(data.publicUrl)
      }
    }
    setProgreso('Guardando reporte...')
    await supabase.from('ordenes_trabajo').insert({
      titulo,
      descripcion: desc + (urlsSubidas.length ? `\n\n[archivos:${urlsSubidas.join(',')}]` : ''),
      estado: urgente ? 'en_curso' : 'pendiente',
      prioridad: urgente ? 'alta' : 'media',
      urgente,
      categoria_id: categoriaId || null,
    })
    await notificarAdmin(
      urgente ? `🚨 OT URGENTE: ${titulo}` : `Nueva OT para aprobar: ${titulo}`,
      `Reportado por: ${nombre}`
    )
    setProgreso(''); setEnviando(false); setEnviado(true)
  }

  function reset() { setEnviado(false); setTitulo(''); setDesc(''); setCategoriaId(''); setUrgente(false); setArchivos([]); setPreviews([]) }
  const catSeleccionada = categorias.find(c => c.id === categoriaId)

  return (
    <div style={{minHeight:'100vh',background:'#F1EFE8',fontFamily:'sans-serif'}}>
      <div style={{background: urgente ? '#C0392B' : '#1D9E75',padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',transition:'background 0.3s'}}>
        <span style={{color:'#fff',fontSize:16,fontWeight:500}}>Hola, {nombre}</span>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{color:'rgba(255,255,255,0.5)',fontSize:11}}>{VERSION}</span>
          <button onClick={onSalir} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',padding:'6px 14px',borderRadius:6,cursor:'pointer',fontSize:12}}>Salir</button>
        </div>
      </div>
      <div style={{padding:20,display:'flex',flexDirection:'column',gap:12}}>
        {enviado ? (
          <div style={{background: urgente ? '#FCEBEB' : '#EAF3DE',borderRadius:10,padding:24,textAlign:'center'}}>
            <div style={{fontSize:32,marginBottom:8}}>{urgente?'🚨':'✓'}</div>
            <div style={{fontSize:14,fontWeight:500,color: urgente ? '#791F1F' : '#27500A'}}>
              {urgente ? 'OT URGENTE enviada' : 'Problema reportado'}
            </div>
            <div style={{fontSize:12,color: urgente ? '#A32D2D' : '#3B6D11',marginTop:8,marginBottom:16}}>
              {urgente ? 'Fue directo al plan. El admin fue notificado.' : 'El administrador lo revisará pronto.'}
            </div>
            <button onClick={reset} style={{padding:'8px 20px',borderRadius:8,border:`0.5px solid ${urgente?'#F7C1C1':'#C0DD97'}`,background:'transparent',cursor:'pointer',fontSize:12,color: urgente ? '#791F1F' : '#27500A'}}>Reportar otro</button>
          </div>
        ) : (
          <div style={{background:'#fff',borderRadius:10,padding:16,border:'0.5px solid #E8E6DE'}}>
            <div style={{fontSize:13,fontWeight:500,marginBottom:16}}>Reportar un problema</div>

            {/* Toggle urgente */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:urgente?'#FCEBEB':'#F1EFE8',borderRadius:9,padding:'10px 12px',marginBottom:12,border:urgente?'0.5px solid #F7C1C1':'0.5px solid #E8E6DE'}}>
              <div>
                <div style={{fontSize:12,fontWeight:500,color:urgente?'#791F1F':'#444'}}>🚨 Es urgente</div>
                <div style={{fontSize:10,color:urgente?'#A32D2D':'#888',marginTop:2}}>Va directo al técnico sin esperar aprobación</div>
              </div>
              <button onClick={()=>setUrgente(!urgente)} style={{width:40,height:22,borderRadius:100,border:'none',cursor:'pointer',position:'relative',background:urgente?'#E24B4A':'#ccc',transition:'background 0.2s'}}>
                <div style={{position:'absolute',top:2,left:urgente?20:2,width:18,height:18,borderRadius:'50%',background:'#fff',transition:'left 0.2s'}}></div>
              </button>
            </div>

            <div style={{fontSize:11,color:'#888',marginBottom:4}}>TÍTULO *</div>
            <input value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="Ej: Pérdida de aceite compresor #3"
              style={{width:'100%',padding:10,borderRadius:8,border:'0.5px solid #ddd',fontSize:13,marginBottom:12,boxSizing:'border-box' as const}}/>
            <div style={{fontSize:11,color:'#888',marginBottom:4}}>DESCRIPCIÓN</div>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Describí el problema con detalle..."
              style={{width:'100%',padding:10,borderRadius:8,border:'0.5px solid #ddd',fontSize:13,marginBottom:12,minHeight:72,resize:'none' as const,boxSizing:'border-box' as const,fontFamily:'sans-serif'}}/>
            {categorias.length > 0 && <>
              <div style={{fontSize:11,color:'#888',marginBottom:8}}>CATEGORÍA</div>
              <div style={{display:'flex',gap:7,flexWrap:'wrap' as const,marginBottom:12}}>
                {categorias.map(c=>(<button key={c.id} onClick={()=>setCategoriaId(categoriaId===c.id?'':c.id)} style={{padding:'7px 14px',borderRadius:100,border:'2px solid',borderColor:categoriaId===c.id?c.color:'transparent',background:categoriaId===c.id?c.color:'#F1EFE8',color:categoriaId===c.id?'#fff':'#555',fontSize:12,fontWeight:500,cursor:'pointer',transition:'all 0.15s'}}>{c.nombre}</button>))}
              </div>
            </>}
            <div style={{fontSize:11,color:'#888',marginBottom:8}}>FOTOS / VIDEOS (máx. 5)</div>
            {previews.length > 0 && (
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginBottom:10}}>
                {previews.map((url,i)=>(
                  <div key={i} style={{position:'relative',aspectRatio:'1',borderRadius:8,overflow:'hidden',background:'#F1EFE8'}}>
                    {archivos[i]?.type.startsWith('video/')?<video src={url} style={{width:'100%',height:'100%',objectFit:'cover'}} muted/>:<img src={url} style={{width:'100%',height:'100%',objectFit:'cover'}} alt={`archivo ${i+1}`}/>}
                    <div style={{position:'absolute',top:3,right:3,background:'rgba(0,0,0,0.5)',borderRadius:'50%',width:20,height:20,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#fff',fontSize:11}} onClick={()=>quitarArchivo(i)}>✕</div>
                    {archivos[i]?.type.startsWith('video/')&&<div style={{position:'absolute',bottom:3,left:3,background:'rgba(0,0,0,0.5)',borderRadius:4,padding:'1px 5px',fontSize:9,color:'#fff'}}>VIDEO</div>}
                  </div>
                ))}
              </div>
            )}
            {archivos.length < 5 && (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
                <button onClick={()=>{if(inputRef.current){inputRef.current.accept='image/*';(inputRef.current as any).capture='environment';inputRef.current.click()}}} style={{padding:'10px',borderRadius:8,border:'0.5px dashed #1D9E75',background:'#E1F5EE',color:'#085041',fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>📷 Sacar foto</button>
                <button onClick={()=>{if(inputRef.current){inputRef.current.accept='image/*,video/*';(inputRef.current as any).capture=undefined;inputRef.current.click()}}} style={{padding:'10px',borderRadius:8,border:'0.5px dashed #ddd',background:'#F1EFE8',color:'#555',fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>🖼️ Desde galería</button>
              </div>
            )}
            <input ref={inputRef} type="file" accept="image/*,video/*" multiple style={{display:'none'}} onChange={e=>agregarArchivos(e.target.files)}/>
            {progreso && <div style={{background:'#E6F1FB',borderRadius:8,padding:'8px 12px',fontSize:12,color:'#0C447C',marginBottom:10}}>⏳ {progreso}</div>}
            <button onClick={enviarReporte} disabled={!titulo||enviando} style={{
              width:'100%',padding:12,borderRadius:8,
              background:!titulo||enviando?'#ccc':urgente?'#E24B4A':catSeleccionada?catSeleccionada.color:'#1D9E75',
              color:'#fff',border:'none',fontSize:14,fontWeight:500,cursor:titulo&&!enviando?'pointer':'default',
              textShadow:'0 1px 2px rgba(0,0,0,0.15)'
            }}>
              {enviando?'Enviando...':`${urgente?'🚨 Enviar URGENTE':'Enviar reporte'}${archivos.length>0?` (${archivos.length} archivo${archivos.length>1?'s':''})`:''}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── LOGIN ───────────────────────────────────────────────────────────────────
export default function App() {
  const [rol, setRol] = useState<'admin'|'tecnico'|'reportador'>('admin')
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [listaUsuarios, setListaUsuarios] = useState<any[]>([])
  const [nombreLogueado, setNombreLogueado] = useState('')
  const [usuarioIdLogueado, setUsuarioIdLogueado] = useState('')

  useEffect(() => {
    if (rol === 'tecnico' || rol === 'reportador') {
      supabase.from('usuarios').select('*').eq('rol', rol).order('nombre')
        .then(({ data }) => { if (data) setListaUsuarios(data) })
    }
    setUsuarioSeleccionado(''); setError('')
  }, [rol])

  async function ingresar() {
    setLoading(true); setError('')
    if (rol === 'reportador') {
      const found = listaUsuarios.find(u => u.id === usuarioSeleccionado)
      if (!found) { setError('Seleccioná un usuario'); setLoading(false); return }
      setNombreLogueado(found.nombre); setUser({ tipo: 'reportador' }); setLoading(false); return
    }
    if (rol === 'tecnico') {
      const found = listaUsuarios.find(u => u.id === usuarioSeleccionado)
      if (!found) { setError('Seleccioná un usuario'); setLoading(false); return }
      if (found.clave && found.clave !== password) { setError('Contraseña incorrecta'); setLoading(false); return }
      setNombreLogueado(found.nombre); setUsuarioIdLogueado(found.id); setUser({ tipo: 'tecnico' }); setLoading(false); return
    }
    const { data, error: err } = await supabase.auth.signInWithPassword({ email: usuarioSeleccionado, password })
    if (err) setError('Email o contraseña incorrectos')
    else setUser({ ...data.user, tipo: 'admin' })
    setLoading(false)
  }

  async function salir() {
    if (user?.tipo === 'admin') await supabase.auth.signOut()
    setUser(null); setUsuarioSeleccionado(''); setPassword(''); setUsuarioIdLogueado('')
  }

  if (user?.tipo === 'admin') return <DashboardAdmin email={user.email} onSalir={salir} />
  if (user?.tipo === 'tecnico') return <DashboardTecnico nombre={nombreLogueado} usuarioId={usuarioIdLogueado} onSalir={salir} />
  if (user?.tipo === 'reportador') return <DashboardReportador nombre={nombreLogueado} onSalir={salir} />

  return (
    <div style={{minHeight:'100vh',background:'#185FA5',display:'flex',alignItems:'center',justifyContent:'center',padding:20,fontFamily:'sans-serif'}}>
      <div style={{background:'#fff',borderRadius:16,padding:32,width:'100%',maxWidth:380}}>
        <h1 style={{textAlign:'center',color:'#185FA5',fontWeight:500,marginBottom:4}}>MantePro</h1>
        <p style={{textAlign:'center',color:'#888',fontSize:13,marginBottom:4}}>Gestión de mantenimiento</p>
        <p style={{textAlign:'center',color:'#ccc',fontSize:11,marginBottom:20}}>{VERSION}</p>
        <div style={{display:'flex',gap:6,background:'#f1f1f1',borderRadius:8,padding:3,marginBottom:16}}>
          {(['admin','tecnico','reportador'] as const).map(r => (
            <button key={r} onClick={()=>setRol(r)} style={{flex:1,padding:'8px 4px',borderRadius:6,border:'none',background:rol===r?'#fff':'transparent',color:rol===r?'#185FA5':'#888',fontWeight:rol===r?500:400,cursor:'pointer',fontSize:12,boxShadow:rol===r?'0 1px 4px rgba(0,0,0,0.1)':'none'}}>{r.charAt(0).toUpperCase()+r.slice(1)}</button>
          ))}
        </div>
        {rol === 'admin' && <>
          <div style={{fontSize:11,color:'#888',marginBottom:4}}>EMAIL</div>
          <input type="email" placeholder="admin@mantepro.com" value={usuarioSeleccionado} onChange={e=>setUsuarioSeleccionado(e.target.value)} style={{width:'100%',padding:12,borderRadius:8,border:'0.5px solid #ddd',fontSize:14,marginBottom:10,boxSizing:'border-box' as const}}/>
          <div style={{fontSize:11,color:'#888',marginBottom:4}}>CONTRASEÑA</div>
          <input type="password" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)} style={{width:'100%',padding:12,borderRadius:8,border:'0.5px solid #ddd',fontSize:14,marginBottom:16,boxSizing:'border-box' as const}}/>
        </>}
        {(rol === 'tecnico' || rol === 'reportador') && <>
          <div style={{fontSize:11,color:'#888',marginBottom:4}}>{rol === 'tecnico' ? 'SELECCIONÁ TU USUARIO' : 'SELECCIONÁ TU NOMBRE'}</div>
          <select value={usuarioSeleccionado} onChange={e=>setUsuarioSeleccionado(e.target.value)} style={{width:'100%',padding:12,borderRadius:8,border:'0.5px solid #ddd',fontSize:14,marginBottom:rol==='tecnico'?10:16,boxSizing:'border-box' as const,background:'#fff',color:usuarioSeleccionado?'#333':'#888'}}>
            <option value="">— Seleccioná —</option>
            {listaUsuarios.map(u=>(<option key={u.id} value={u.id}>{u.nombre}</option>))}
          </select>
          {rol === 'tecnico' && <>
            <div style={{fontSize:11,color:'#888',marginBottom:4}}>CONTRASEÑA</div>
            <input type="password" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)} style={{width:'100%',padding:12,borderRadius:8,border:'0.5px solid #ddd',fontSize:14,marginBottom:16,boxSizing:'border-box' as const}}/>
          </>}
          {rol === 'reportador' && <div style={{background:'#E6F1FB',borderRadius:8,padding:'8px 12px',fontSize:12,color:'#0C447C',marginBottom:16}}>ℹ️ Solo seleccioná tu nombre para ingresar</div>}
        </>}
        {error && <p style={{color:'#A32D2D',fontSize:12,marginBottom:12,background:'#FCEBEB',padding:'8px 12px',borderRadius:6}}>{error}</p>}
        <button onClick={ingresar} disabled={loading||!usuarioSeleccionado} style={{width:'100%',padding:13,borderRadius:8,background:loading||!usuarioSeleccionado?'#ccc':'#185FA5',color:'#fff',border:'none',fontSize:14,fontWeight:500,cursor:'pointer'}}>{loading?'Ingresando...':'Ingresar'}</button>
      </div>
    </div>
  )
}