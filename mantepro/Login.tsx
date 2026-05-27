import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'

export default function Login() {
  const [rol, setRol] = useState('tecnico')
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.titulo}>MantePro</Text>
        <Text style={styles.sub}>Gestión de mantenimiento</Text>
        <View style={styles.roles}>
          {['Admin','Técnico','Reportador'].map(r => (
            <TouchableOpacity key={r} style={[styles.rolBtn, rol===r.toLowerCase()&&styles.rolActivo]} onPress={()=>setRol(r.toLowerCase())}>
              <Text style={[styles.rolText, rol===r.toLowerCase()&&styles.rolTextActivo]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#888" autoCapitalize="none"/>
        <TextInput style={styles.input} placeholder="Contraseña" placeholderTextColor="#888" secureTextEntry/>
        <TouchableOpacity style={styles.btn}>
          <Text style={styles.btnText}>Ingresar</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#185FA5',alignItems:'center',justifyContent:'center',padding:20},
  card:{backgroundColor:'#fff',borderRadius:16,padding:24,width:'100%',maxWidth:380},
  titulo:{fontSize:28,fontWeight:'500',color:'#185FA5',textAlign:'center',marginBottom:4},
  sub:{fontSize:13,color:'#888',textAlign:'center',marginBottom:20},
  roles:{flexDirection:'row',gap:6,marginBottom:16,backgroundColor:'#f1f1f1',borderRadius:8,padding:3},
  rolBtn:{flex:1,padding:8,borderRadius:6,alignItems:'center'},
  rolActivo:{backgroundColor:'#fff'},
  rolText:{fontSize:12,color:'#888'},
  rolTextActivo:{color:'#185FA5',fontWeight:'500'},
  input:{borderWidth:0.5,borderColor:'#ddd',borderRadius:8,padding:12,fontSize:14,marginBottom:10,color:'#333'},
  btn:{backgroundColor:'#185FA5',padding:13,borderRadius:8,alignItems:'center',marginTop:4},
  btnText:{color:'#fff',fontSize:14,fontWeight:'500'},
})
