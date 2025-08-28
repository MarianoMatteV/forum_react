import React, { useState, useContext } from 'react'; // Importa useContext
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import api from '../services/api';
import AuthContext from '../context/AuthContext'; // Importa o AuthContext

const LoginScreen = ({ navigation }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useContext(AuthContext); // Pega a função signIn do contexto

  const handleLogin = async () => {
    try {
      const response = await api.post('/auth/login', { identifier, password });
      Alert.alert('Sucesso', 'Login realizado com sucesso!');
      // Chamar signIn para salvar o token e atualizar o estado global
      await signIn(response.data.token, response.data.user); // Passa o token e os dados do usuário
      // Não precisa de navigation.replace('Home') aqui, o AppNavigator fará a transição
    } catch (error) {
      console.error('Erro no login:', error.response?.data || error.message);
      Alert.alert('Erro no Login', error.response?.data?.message || 'Ocorreu um erro ao tentar fazer login.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bem-vindo!</Text>
      <TextInput
        style={styles.input}
        placeholder="Usuário ou E-mail"
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Entrar" onPress={handleLogin} />
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.registerText}>Não tem uma conta? Cadastre-se</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
    // backgroundColor: '#f2f4f8',
    backgroundColor: '#8bc3ffff',
  },

  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 90,
    marginTop: '-25vh',
    color: '#1a1a1a',
  },

  input: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: '#fff',
    fontSize: 16,
    boxShadow: '2px 2px 2px 1px rgba(0, 0, 0, 0.2)'
  },
  
  button: {
    width: '100%',
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
  },

  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  registerText: {
    marginTop: 25,
    textAlign: 'center',
    fontSize: 14,
    color: '#555',
  },

  registerText: {
    marginTop: 20,
    color: '#007bff',
    textDecorationLine: 'none',
    display: 'flex',
    justifyContent: 'center'
  },
});

export default LoginScreen;