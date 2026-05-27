// MantePro v0.6
import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

const VERSION = 'v0.6'

// ─── ADMIN ───────────────────────────────────────────────────────────────────
function DashboardAdmin({ email, onSalir }: { email: string, onSalir: () => void }) {
  const [vista, setVista] = useState<'dashboard'|'usuarios'|'categorias'>('dashboard')
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoRol, setNuevoRol] = useState<'tecnico'|'reportador'|'admin'>('tecnico')
  const [nuevaClave, setNuevaClave] = useState('')
  const [nuevoEmail, setNuevoEmail] = useState('')
  const [creando, setCreando] = useState(false)
  const [msgUsuario, setMsgUsuario] = useState('')
  const [editando, setEditando] = useState<any>(null)
  // categorias
  const [catNombre, setCatNombre] = useState('')
  const [catColor, setCatColor] = useState('#E24B4A')
  const [editandoCat, setEditandoCat] = useState<any>(null)
  const [msgCat, setMsgCat] = useState('')

  async function cargarUsuarios() {
    const { data } = await supabase.from('usuarios').select('*').order('created_at', { ascending: false })
    if (data) setUsuarios(data)
  }

  async function cargarCategorias() {
    const { data } = await supabase.from('categorias').select('*').order('created_at', { ascending: true })
    if (data) setCategorias(data)
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
      setNuevoNombre(''); setNuevaClave(''); setNuevoEmail('')
      cargarUsuarios()
    } else setMsgUsuario('Error: ' + error.message)
    setCreando(false)
  }

  async function guardarEdicion() {
    if (!editando) return
    const updates: any = { nombre: editando.nombre, rol: editando.rol }
    if (editando.clave) updates.clave = editando.clave
    const { error } = await supabase.from('usuarios').update(updates).eq('id', editando.id)
    if (!error) { setEditando(null); cargarUsuarios() }
    else alert('Error: ' + error.message)
  }

  async function eliminarUsuario(id: string, nombre: string) {
    if (!window.confirm(`¿Eliminar a "${nombre}"?`)) return
    const { error } = await supabase.from('usuarios').delete().eq('id', id)
    if (!error) setUsuarios(prev => prev.filter(u => u.id !== id))
    else alert('Error: ' + error.message)
  }

  async function crearCategoria() {
    if (!catNombre) return
    setMsgCat('')
    const { error } = await supabase.from('categorias').insert({ nombre: catNombre, color: catColor })
    if (!error) {
      setMsgCat(`✓ Categoría "${catNombre}" creada`)
      setCatNombre(''); setCatColor('#E24B4A')
      cargarCategorias()
    } else setMsgCat('Error: ' + error.message)
  }

  async function guardarCategoria() {
    if (!editandoCat) return
    const { error } = await supabase.from('categorias').update({ nombre: editandoCat.nombre, color: editandoCat.color }).eq('id', editandoCat.id)
    if (!error) { setEditandoCat(null); cargarCategorias() }
    else alert('Error: ' + error.message)
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
  }, [vista])

  const COLORES_RAPIDOS = [
    {hex:'#E24B4A',label:'Rojo'},
    {hex:'#EF9F27',label:'Naranja'},
    {hex:'#F5CC1E',label:'Amarillo'},
    {hex:'#3B6D11',label:'Verde'},
    {hex:'#185FA5',label:'Azul'},
    {hex:'#8B5CF6',label:'Violeta'},
    {hex:'#888780',label:'Gris'},
    {hex:'#0F6E56',label:'Teal'},
  ]

  if (vista === 'categorias') return (
    <div style={{minHeight:'100vh',background:'#F1EFE8',fontFamily:'sans-serif'}}>
      <div style={{background:'#185FA5',padding:'14px 20px',display:'flex',alignItems:'center',gap:10}}>
        <button onClick={()=>setVista('dashboard')} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',padding:'6px 12px',borderRadius:6,cursor:'pointer',fontSize:12}}>← Volver</button>
        <span style={{color:'#fff',fontSize:16,fontWeight:500,flex:1}}>Categorías de OT</span>
        <span style={{color:'rgba(255,255,255,0.5)',fontSize:11}}>{VERSION}</span>
      </div>
      <div style={{padding:20,display:'flex',flexDirection:'column',gap:12}}>

        <div style={{background:'#fff',borderRadius:10,padding:16,border:'0.5px solid #E8E6DE'}}>
          <div style={{fontSize:13,fontWeight:500,marginBottom:14}}>Nueva categoría</div>
          <div style={{fontSize:11,color:'#888',marginBottom:4}}>NOMBRE</div>
          <input value={catNombre} onChange={e=>setCatNombre(e.target.value)} placeholder="Ej: Urgente, Preventivo, Correctivo..."
            style={{width:'100%',padding:10,borderRadius:8,border:'0.5px solid #ddd',fontSize:13,marginBottom:12,boxSizing:'border-box' as const}}/>
          <div style={{fontSize:11,color:'#888',marginBottom:8}}>COLOR</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap' as const,marginBottom:12}}>
            {COLORES_RAPIDOS.map(c=>(
              <button key={c.hex} onClick={()=>setCatColor(c.hex)} title={c.label} style={{
                width:32,height:32,borderRadius:'50%',background:c.hex,border:catColor===c.hex?'3px solid #333':'2px solid transparent',cursor:'pointer',flexShrink:0
              }}/>
            ))}
            <input type="color" value={catColor} onChange={e=>setCatColor(e.target.value)}
              title="Color personalizado"
              style={{width:32,height:32,borderRadius:'50%',border:'0.5px solid #ddd',cursor:'pointer',padding:2}}/>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
            <div style={{width:36,height:36,borderRadius:8,background:catColor,flexShrink:0}}></div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:500}}>{catNombre||'Vista previa'}</div>
              <div style={{fontSize:11,color:'#888'}}>{catColor}</div>
            </div>
            <span style={{background:catColor,color:'#fff',fontSize:11,padding:'3px 10px',borderRadius:100,fontWeight:500,textShadow:'0 1px 2px rgba(0,0,0,0.3)'}}>
              {catNombre||'Categoría'}
            </span>
          </div>
          {msgCat && (
            <div style={{background:msgCat.startsWith('✓')?'#EAF3DE':'#FCEBEB',borderRadius:8,padding:'8px 12px',fontSize:12,color:msgCat.startsWith('✓')?'#27500A':'#A32D2D',marginBottom:12}}>
              {msgCat}
            </div>
          )}
          <button onClick={crearCategoria} disabled={!catNombre} style={{
            width:'100%',padding:12,borderRadius:8,background:catNombre?catColor:'#ccc',
            color:'#fff',border:'none',fontSize:14,fontWeight:500,cursor:'pointer',
            textShadow:'0 1px 2px rgba(0,0,0,0.2)'
          }}>Crear categoría</button>
        </div>

        <div style={{background:'#fff',borderRadius:10,padding:16,border:'0.5px solid #E8E6DE'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:500}}>Categorías ({categorias.length})</div>
            <button onClick={cargarCategorias} style={{fontSize:11,color:'#185FA5',background:'transparent',border:'none',cursor:'pointer'}}>Actualizar</button>
          </div>
          {categorias.length === 0 ? (
            <div style={{fontSize:12,color:'#888',textAlign:'center',padding:'12px 0'}}>No hay categorías</div>
          ) : categorias.map(c=>(
            <div key={c.id}>
              {editandoCat?.id === c.id ? (
                <div style={{padding:'10px 0',borderBottom:'0.5px solid #F1EFE8'}}>
                  <div style={{fontSize:11,color:'#888',marginBottom:4}}>NOMBRE</div>
                  <input value={editandoCat.nombre} onChange={e=>setEditandoCat({...editandoCat,nombre:e.target.value})}
                    style={{width:'100%',padding:8,borderRadius:7,border:'0.5px solid #ddd',fontSize:13,marginBottom:8,boxSizing:'border-box' as const}}/>
                  <div style={{fontSize:11,color:'#888',marginBottom:8}}>COLOR</div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap' as const,marginBottom:8}}>
                    {COLORES_RAPIDOS.map(col=>(
                      <button key={col.hex} onClick={()=>setEditandoCat({...editandoCat,color:col.hex})} title={col.label} style={{
                        width:28,height:28,borderRadius:'50%',background:col.hex,
                        border:editandoCat.color===col.hex?'3px solid #333':'2px solid transparent',cursor:'pointer'
                      }}/>
                    ))}
                    <input type="color" value={editandoCat.color} onChange={e=>setEditandoCat({...editandoCat,color:e.target.value})}
                      style={{width:28,height:28,borderRadius:'50%',border:'0.5px solid #ddd',cursor:'pointer',padding:1}}/>
                  </div>
                  <div style={{display:'flex',gap:6}}>
                    <button onClick={guardarCategoria} style={{flex:1,padding:'8px',borderRadius:7,border:'none',background:'#185FA5',color:'#fff',fontSize:12,cursor:'pointer',fontWeight:500}}>✓ Guardar</button>
                    <button onClick={()=>setEditandoCat(null)} style={{flex:1,padding:'8px',borderRadius:7,border:'0.5px solid #ddd',background:'transparent',fontSize:12,cursor:'pointer'}}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:'0.5px solid #F1EFE8'}}>
                  <div style={{width:32,height:32,borderRadius:8,background:c.color,flexShrink:0}}></div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:500}}>{c.nombre}</div>
                    <div style={{fontSize:10,color:'#888',marginTop:1}}>{c.color}</div>
                  </div>
                  <span style={{background:c.color,color:'#fff',fontSize:10,padding:'2px 10px',borderRadius:100,fontWeight:500,textShadow:'0 1px 2px rgba(0,0,0,0.2)'}}>
                    {c.nombre}
                  </span>
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

  if (vista === 'usuarios') return (
    <div style={{minHeight:'100vh',background:'#F1EFE8',fontFamily:'sans-serif'}}>
      <div style={{background:'#185FA5',padding:'14px 20px',display:'flex',alignItems:'center',gap:10}}>
        <button onClick={()=>setVista('dashboard')} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',padding:'6px 12px',borderRadius:6,cursor:'pointer',fontSize:12}}>← Volver</button>
        <span style={{color:'#fff',fontSize:16,fontWeight:500,flex:1}}>Gestión de usuarios</span>
        <span style={{color:'rgba(255,255,255,0.5)',fontSize:11}}>{VERSION}</span>
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
              <button key={r} onClick={()=>setNuevoRol(r)} style={{
                flex:1,padding:'8px 4px',borderRadius:8,border:'0.5px solid',
                borderColor:nuevoRol===r?'#185FA5':'#ddd',
                background:nuevoRol===r?'#E6F1FB':'transparent',
                color:nuevoRol===r?'#185FA5':'#888',
                fontWeight:nuevoRol===r?500:400,cursor:'pointer',fontSize:12
              }}>{r==='tecnico'?'🔧 Técnico':r==='reportador'?'👤 Reportador':'🛡️ Admin'}</button>
            ))}
          </div>
          {nuevoRol === 'tecnico' && <>
            <div style={{fontSize:11,color:'#888',marginBottom:4}}>CONTRASEÑA</div>
            <input value={nuevaClave} onChange={e=>setNuevaClave(e.target.value)} placeholder="Contraseña" type="password"
              style={{width:'100%',padding:10,borderRadius:8,border:'0.5px solid #ddd',fontSize:13,marginBottom:12,boxSizing:'border-box' as const}}/>
          </>}
          {nuevoRol === 'admin' && <>
            <div style={{fontSize:11,color:'#888',marginBottom:4}}>EMAIL</div>
            <input value={nuevoEmail} onChange={e=>setNuevoEmail(e.target.value)} placeholder="email@empresa.com" type="email"
              style={{width:'100%',padding:10,borderRadius:8,border:'0.5px solid #ddd',fontSize:13,marginBottom:8,boxSizing:'border-box' as const}}/>
            <div style={{fontSize:11,color:'#888',marginBottom:4}}>CONTRASEÑA</div>
            <input value={nuevaClave} onChange={e=>setNuevaClave(e.target.value)} placeholder="Contraseña segura" type="password"
              style={{width:'100%',padding:10,borderRadius:8,border:'0.5px solid #ddd',fontSize:13,marginBottom:12,boxSizing:'border-box' as const}}/>
          </>}
          {nuevoRol === 'reportador' && (
            <div style={{background:'#E6F1FB',borderRadius:8,padding:'8px 12px',fontSize:12,color:'#0C447C',marginBottom:12}}>
              ℹ️ El reportador solo necesita su nombre para ingresar.
            </div>
          )}
          {msgUsuario && (
            <div style={{background:msgUsuario.startsWith('✓')?'#EAF3DE':'#FCEBEB',borderRadius:8,padding:'8px 12px',fontSize:12,color:msgUsuario.startsWith('✓')?'#27500A':'#A32D2D',marginBottom:12}}>
              {msgUsuario}
            </div>
          )}
          <button onClick={crearUsuario} disabled={!nuevoNombre||creando} style={{
            width:'100%',padding:12,borderRadius:8,background:nuevoNombre?'#185FA5':'#ccc',
            color:'#fff',border:'none',fontSize:14,fontWeight:500,cursor:'pointer'
          }}>{creando?'Creando...':'Crear usuario'}</button>
        </div>
        <div style={{background:'#fff',borderRadius:10,padding:16,border:'0.5px solid #E8E6DE'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:500}}>Usuarios ({usuarios.length})</div>
            <button onClick={cargarUsuarios} style={{fontSize:11,color:'#185FA5',background:'transparent',border:'none',cursor:'pointer'}}>Actualizar</button>
          </div>
          {usuarios.length === 0 ? (
            <div style={{fontSize:12,color:'#888',textAlign:'center',padding:'12px 0'}}>No hay usuarios aún</div>
          ) : usuarios.map(u=>(
            <div key={u.id}>
              {editando?.id === u.id ? (
                <div style={{padding:'10px 0',borderBottom:'0.5px solid #F1EFE8'}}>
                  <div style={{fontSize:11,color:'#888',marginBottom:4}}>NOMBRE</div>
                  <input value={editando.nombre} onChange={e=>setEditando({...editando,nombre:e.target.value})}
                    style={{width:'100%',padding:8,borderRadius:7,border:'0.5px solid #ddd',fontSize:13,marginBottom:8,boxSizing:'border-box' as const}}/>
                  <div style={{fontSize:11,color:'#888',marginBottom:4}}>ROL</div>
                  <div style={{display:'flex',gap:5,marginBottom:8}}>
                    {(['tecnico','reportador','admin'] as const).map(r=>(
                      <button key={r} onClick={()=>setEditando({...editando,rol:r})} style={{
                        flex:1,padding:'6px 4px',borderRadius:6,border:'0.5px solid',
                        borderColor:editando.rol===r?'#185FA5':'#ddd',
                        background:editando.rol===r?'#E6F1FB':'transparent',
                        color:editando.rol===r?'#185FA5':'#888',fontSize:11,cursor:'pointer'
                      }}>{r==='tecnico'?'🔧':r==='reportador'?'👤':'🛡️'} {r}</button>
                    ))}
                  </div>
                  <div style={{fontSize:11,color:'#888',marginBottom:4}}>NUEVA CONTRASEÑA (opcional)</div>
                  <input value={editando.clave||''} onChange={e=>setEditando({...editando,clave:e.target.value})}
                    placeholder="Dejar vacío para no cambiar" type="password"
                    style={{width:'100%',padding:8,borderRadius:7,border:'0.5px solid #ddd',fontSize:13,marginBottom:10,boxSizing:'border-box' as const}}/>
                  <div style={{display:'flex',gap:6}}>
                    <button onClick={guardarEdicion} style={{flex:1,padding:'8px',borderRadius:7,border:'none',background:'#185FA5',color:'#fff',fontSize:12,cursor:'pointer',fontWeight:500}}>✓ Guardar</button>
                    <button onClick={()=>setEditando(null)} style={{flex:1,padding:'8px',borderRadius:7,border:'0.5px solid #ddd',background:'transparent',fontSize:12,cursor:'pointer'}}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:'0.5px solid #F1EFE8'}}>
                  <div style={{width:32,height:32,borderRadius:'50%',background:u.rol==='tecnico'?'#EAF3DE':u.rol==='admin'?'#E6F1FB':'#E1F5EE',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>
                    {u.rol==='tecnico'?'🔧':u.rol==='admin'?'🛡️':'👤'}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:500}}>{u.nombre}</div>
                    <div style={{fontSize:10,color:'#888',marginTop:1,textTransform:'capitalize' as const}}>{u.rol}</div>
                  </div>
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
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <button onClick={()=>setVista('usuarios')} style={{padding:13,borderRadius:10,background:'#fff',border:'0.5px solid #E8E6DE',fontSize:13,fontWeight:500,cursor:'pointer',color:'#185FA5'}}>
            👥 Usuarios
          </button>
          <button onClick={()=>setVista('categorias')} style={{padding:13,borderRadius:10,background:'#fff',border:'0.5px solid #E8E6DE',fontSize:13,fontWeight:500,cursor:'pointer',color:'#185FA5'}}>
            🏷️ Categorías
          </button>
        </div>
        <button style={{width:'100%',padding:13,borderRadius:10,background:'#185FA5',color:'#fff',border:'none',fontSize:13,fontWeight:500,cursor:'pointer'}}>
          + Nueva OT
        </button>
      </div>
    </div>
  )
}

// ─── TÉCNICO ─────────────────────────────────────────────────────────────────
function DashboardTecnico({ nombre, onSalir }: { nombre: string, onSalir: () => void }) {
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

// ─── REPORTADOR ──────────────────────────────────────────────────────────────
function DashboardReportador({ nombre, onSalir }: { nombre: string, onSalir: () => void }) {
  const [titulo, setTitulo] = useState('')
  const [desc, setDesc] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
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
    const nuevos = Array.from(files).filter(f =>
      f.type.startsWith('image/') || f.type.startsWith('video/')
    ).slice(0, 5 - archivos.length)
    const nuevosArchivos = [...archivos, ...nuevos].slice(0, 5)
    setArchivos(nuevosArchivos)
    setPreviews(nuevosArchivos.map(f => URL.createObjectURL(f)))
  }

  function quitarArchivo(i: number) {
    const nuevos = archivos.filter((_,idx) => idx !== i)
    setArchivos(nuevos)
    setPreviews(nuevos.map(f => URL.createObjectURL(f)))
  }

  async function enviarReporte() {
    if (!titulo) return
    setEnviando(true)
    const urlsSubidas: string[] = []
    for (let i = 0; i < archivos.length; i++) {
      const file = archivos[i]
      setProgreso(`Subiendo archivo ${i+1} de ${archivos.length}...`)
      const ext = file.name.split('.').pop()
      const path = `reportes/${Date.now()}-${i}.${ext}`
      const { error } = await supabase.storage.from('fotos-ot').upload(path, file)
      if (!error) {
        const { data } = supabase.storage.from('fotos-ot').getPublicUrl(path)
        urlsSubidas.push(data.publicUrl)
      }
    }
    setProgreso('Guardando reporte...')
    await supabase.from('ordenes_trabajo').insert({
      titulo,
      descripcion: desc + (urlsSubidas.length ? `\n\n[archivos:${urlsSubidas.join(',')}]` : ''),
      estado: 'pendiente',
      prioridad: categoriaId || 'media',
    })
    setProgreso(''); setEnviando(false); setEnviado(true)
  }

  function reset() {
    setEnviado(false); setTitulo(''); setDesc(''); setCategoriaId(''); setArchivos([]); setPreviews([])
  }

  const catSeleccionada = categorias.find(c => c.id === categoriaId)

  return (
    <div style={{minHeight:'100vh',background:'#F1EFE8',fontFamily:'sans-serif'}}>
      <div style={{background:'#1D9E75',padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{color:'#fff',fontSize:16,fontWeight:500}}>Hola, {nombre}</span>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{color:'rgba(255,255,255,0.5)',fontSize:11}}>{VERSION}</span>
          <button onClick={onSalir} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',padding:'6px 14px',borderRadius:6,cursor:'pointer',fontSize:12}}>Salir</button>
        </div>
      </div>
      <div style={{padding:20,display:'flex',flexDirection:'column',gap:12}}>
        {enviado ? (
          <div style={{background:'#EAF3DE',borderRadius:10,padding:24,textAlign:'center'}}>
            <div style={{fontSize:32,marginBottom:8}}>✓</div>
            <div style={{fontSize:14,fontWeight:500,color:'#27500A'}}>Problema reportado</div>
            {catSeleccionada && (
              <div style={{margin:'8px auto 0',display:'inline-block'}}>
                <span style={{background:catSeleccionada.color,color:'#fff',fontSize:12,padding:'3px 12px',borderRadius:100,fontWeight:500,textShadow:'0 1px 2px rgba(0,0,0,0.2)'}}>
                  {catSeleccionada.nombre}
                </span>
              </div>
            )}
            <div style={{fontSize:12,color:'#3B6D11',marginTop:8,marginBottom:16}}>
              El administrador lo revisará pronto.
              {archivos.length > 0 && ` ${archivos.length} archivo${archivos.length>1?'s':''} adjunto${archivos.length>1?'s':''}.`}
            </div>
            <button onClick={reset} style={{padding:'8px 20px',borderRadius:8,border:'0.5px solid #C0DD97',background:'transparent',cursor:'pointer',fontSize:12,color:'#27500A'}}>
              Reportar otro
            </button>
          </div>
        ) : (
          <div style={{background:'#fff',borderRadius:10,padding:16,border:'0.5px solid #E8E6DE'}}>
            <div style={{fontSize:13,fontWeight:500,marginBottom:16}}>Reportar un problema</div>

            <div style={{fontSize:11,color:'#888',marginBottom:4}}>TÍTULO *</div>
            <input value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="Ej: Pérdida de aceite compresor #3"
              style={{width:'100%',padding:10,borderRadius:8,border:'0.5px solid #ddd',fontSize:13,marginBottom:12,boxSizing:'border-box' as const}}/>

            <div style={{fontSize:11,color:'#888',marginBottom:4}}>DESCRIPCIÓN</div>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Describí el problema con detalle..."
              style={{width:'100%',padding:10,borderRadius:8,border:'0.5px solid #ddd',fontSize:13,marginBottom:12,minHeight:72,resize:'none' as const,boxSizing:'border-box' as const,fontFamily:'sans-serif'}}/>

            {categorias.length > 0 && (
              <>
                <div style={{fontSize:11,color:'#888',marginBottom:8}}>CATEGORÍA</div>
                <div style={{display:'flex',gap:7,flexWrap:'wrap' as const,marginBottom:12}}>
                  {categorias.map(c=>(
                    <button key={c.id} onClick={()=>setCategoriaId(categoriaId===c.id?'':c.id)} style={{
                      padding:'7px 14px',borderRadius:100,border:'2px solid',
                      borderColor:categoriaId===c.id?c.color:'transparent',
                      background:categoriaId===c.id?c.color:'#F1EFE8',
                      color:categoriaId===c.id?'#fff':'#555',
                      fontSize:12,fontWeight:500,cursor:'pointer',
                      textShadow:categoriaId===c.id?'0 1px 2px rgba(0,0,0,0.2)':'none',
                      transition:'all 0.15s'
                    }}>{c.nombre}</button>
                  ))}
                </div>
              </>
            )}

            <div style={{fontSize:11,color:'#888',marginBottom:8}}>FOTOS / VIDEOS (máx. 5)</div>
            {previews.length > 0 && (
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginBottom:10}}>
                {previews.map((url,i)=>(
                  <div key={i} style={{position:'relative',aspectRatio:'1',borderRadius:8,overflow:'hidden',background:'#F1EFE8'}}>
                    {archivos[i]?.type.startsWith('video/') ? (
                      <video src={url} style={{width:'100%',height:'100%',objectFit:'cover'}} muted/>
                    ) : (
                      <img src={url} style={{width:'100%',height:'100%',objectFit:'cover'}} alt={`archivo ${i+1}`}/>
                    )}
                    <div style={{position:'absolute',top:3,right:3,background:'rgba(0,0,0,0.5)',borderRadius:'50%',width:20,height:20,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#fff',fontSize:11}}
                      onClick={()=>quitarArchivo(i)}>✕</div>
                    {archivos[i]?.type.startsWith('video/') && (
                      <div style={{position:'absolute',bottom:3,left:3,background:'rgba(0,0,0,0.5)',borderRadius:4,padding:'1px 5px',fontSize:9,color:'#fff'}}>VIDEO</div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {archivos.length < 5 && (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
                <button onClick={()=>{if(inputRef.current){inputRef.current.accept='image/*';(inputRef.current as any).capture='environment';inputRef.current.click()}}}
                  style={{padding:'10px',borderRadius:8,border:'0.5px dashed #1D9E75',background:'#E1F5EE',color:'#085041',fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                  📷 Sacar foto
                </button>
                <button onClick={()=>{if(inputRef.current){inputRef.current.accept='image/*,video/*';(inputRef.current as any).capture=undefined;inputRef.current.click()}}}
                  style={{padding:'10px',borderRadius:8,border:'0.5px dashed #ddd',background:'#F1EFE8',color:'#555',fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                  🖼️ Desde galería
                </button>
              </div>
            )}
            <input ref={inputRef} type="file" accept="image/*,video/*" multiple style={{display:'none'}}
              onChange={e=>agregarArchivos(e.target.files)}/>

            {progreso && (
              <div style={{background:'#E6F1FB',borderRadius:8,padding:'8px 12px',fontSize:12,color:'#0C447C',marginBottom:10}}>
                ⏳ {progreso}
              </div>
            )}

            <button onClick={enviarReporte} disabled={!titulo||enviando} style={{
              width:'100%',padding:12,borderRadius:8,
              background:!titulo||enviando?'#ccc':catSeleccionada?catSeleccionada.color:'#1D9E75',
              color:'#fff',border:'none',fontSize:14,fontWeight:500,
              cursor:titulo&&!enviando?'pointer':'default',
              textShadow:'0 1px 2px rgba(0,0,0,0.15)'
            }}>
              {enviando?'Enviando...':`Enviar reporte${archivos.length>0?` (${archivos.length} archivo${archivos.length>1?'s':''})`:''}`}
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
      setNombreLogueado(found.nombre); setUser({ tipo: 'tecnico' }); setLoading(false); return
    }
    const { data, error: err } = await supabase.auth.signInWithPassword({ email: usuarioSeleccionado, password })
    if (err) setError('Email o contraseña incorrectos')
    else setUser({ ...data.user, tipo: 'admin' })
    setLoading(false)
  }

  async function salir() {
    if (user?.tipo === 'admin') await supabase.auth.signOut()
    setUser(null); setUsuarioSeleccionado(''); setPassword('')
  }

  if (user?.tipo === 'admin') return <DashboardAdmin email={user.email} onSalir={salir} />
  if (user?.tipo === 'tecnico') return <DashboardTecnico nombre={nombreLogueado} onSalir={salir} />
  if (user?.tipo === 'reportador') return <DashboardReportador nombre={nombreLogueado} onSalir={salir} />

  return (
    <div style={{minHeight:'100vh',background:'#185FA5',display:'flex',alignItems:'center',justifyContent:'center',padding:20,fontFamily:'sans-serif'}}>
      <div style={{background:'#fff',borderRadius:16,padding:32,width:'100%',maxWidth:380}}>
        <h1 style={{textAlign:'center',color:'#185FA5',fontWeight:500,marginBottom:4}}>MantePro</h1>
        <p style={{textAlign:'center',color:'#888',fontSize:13,marginBottom:4}}>Gestión de mantenimiento</p>
        <p style={{textAlign:'center',color:'#ccc',fontSize:11,marginBottom:20}}>{VERSION}</p>
        <div style={{display:'flex',gap:6,background:'#f1f1f1',borderRadius:8,padding:3,marginBottom:16}}>
          {(['admin','tecnico','reportador'] as const).map(r => (
            <button key={r} onClick={()=>setRol(r)} style={{
              flex:1,padding:'8px 4px',borderRadius:6,border:'none',
              background:rol===r?'#fff':'transparent',
              color:rol===r?'#185FA5':'#888',
              fontWeight:rol===r?500:400,cursor:'pointer',fontSize:12,
              boxShadow:rol===r?'0 1px 4px rgba(0,0,0,0.1)':'none'
            }}>{r.charAt(0).toUpperCase()+r.slice(1)}</button>
          ))}
        </div>
        {rol === 'admin' && <>
          <div style={{fontSize:11,color:'#888',marginBottom:4}}>EMAIL</div>
          <input type="email" placeholder="admin@mantepro.com" value={usuarioSeleccionado} onChange={e=>setUsuarioSeleccionado(e.target.value)}
            style={{width:'100%',padding:12,borderRadius:8,border:'0.5px solid #ddd',fontSize:14,marginBottom:10,boxSizing:'border-box' as const}}/>
          <div style={{fontSize:11,color:'#888',marginBottom:4}}>CONTRASEÑA</div>
          <input type="password" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)}
            style={{width:'100%',padding:12,borderRadius:8,border:'0.5px solid #ddd',fontSize:14,marginBottom:16,boxSizing:'border-box' as const}}/>
        </>}
        {(rol === 'tecnico' || rol === 'reportador') && <>
          <div style={{fontSize:11,color:'#888',marginBottom:4}}>
            {rol === 'tecnico' ? 'SELECCIONÁ TU USUARIO' : 'SELECCIONÁ TU NOMBRE'}
          </div>
          <select value={usuarioSeleccionado} onChange={e=>setUsuarioSeleccionado(e.target.value)}
            style={{width:'100%',padding:12,borderRadius:8,border:'0.5px solid #ddd',fontSize:14,marginBottom:rol==='tecnico'?10:16,boxSizing:'border-box' as const,background:'#fff',color:usuarioSeleccionado?'#333':'#888'}}>
            <option value="">— Seleccioná —</option>
            {listaUsuarios.map(u=>(<option key={u.id} value={u.id}>{u.nombre}</option>))}
          </select>
          {rol === 'tecnico' && <>
            <div style={{fontSize:11,color:'#888',marginBottom:4}}>CONTRASEÑA</div>
            <input type="password" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)}
              style={{width:'100%',padding:12,borderRadius:8,border:'0.5px solid #ddd',fontSize:14,marginBottom:16,boxSizing:'border-box' as const}}/>
          </>}
          {rol === 'reportador' && (
            <div style={{background:'#E6F1FB',borderRadius:8,padding:'8px 12px',fontSize:12,color:'#0C447C',marginBottom:16}}>
              ℹ️ Solo seleccioná tu nombre para ingresar
            </div>
          )}
        </>}
        {error && <p style={{color:'#A32D2D',fontSize:12,marginBottom:12,background:'#FCEBEB',padding:'8px 12px',borderRadius:6}}>{error}</p>}
        <button onClick={ingresar} disabled={loading||!usuarioSeleccionado} style={{
          width:'100%',padding:13,borderRadius:8,
          background:loading||!usuarioSeleccionado?'#ccc':'#185FA5',
          color:'#fff',border:'none',fontSize:14,fontWeight:500,cursor:'pointer'
        }}>{loading?'Ingresando...':'Ingresar'}</button>
      </div>
    </div>
  )
}