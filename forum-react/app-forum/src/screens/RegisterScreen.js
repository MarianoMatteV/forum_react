// src/screens/RegisterScreen.js

import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';

const RegisterScreen = ({ navigation }) => {
  // Estados para os campos do formulário
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Estado para armazenar a imagem de perfil selecionada
  const [profileImage, setProfileImage] = useState(null);

  // Função para abrir o seletor de imagens e permitir o usuário escolher uma foto de perfil
  const pickImage = async () => {
    // Solicita permissão para acessar a galeria
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permissão necessária', 'Você precisa permitir acesso à galeria para selecionar uma foto.');
      return;
    }

    // Abre a galeria para o usuário escolher uma imagem
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Apenas imagens
      allowsEditing: true, // Permite cortar/editar
      aspect: [1, 1], // Foto quadrada
      quality: 0.8, // Qualidade da imagem
    });

    // Se o usuário escolheu uma imagem, salva no estado
    if (!result.canceled) {
      setProfileImage(result.assets[0]);
    }
  };

// ...imports e estados...

// Função para cadastrar, logar e só então enviar a foto de perfil
const handleRegister = async () => {
  try {
    // 1. Cadastro do usuário
    await api.post('/auth/register', {
      username,
      email,
      password,
    });

    // 2. Login para obter o token JWT
    const loginResponse = await api.post('/auth/login', {
      identifier: email, // ou username, conforme seu backend
      password,
    });
    const token = loginResponse.data.token;

    // 3. Se houver imagem, faz upload autenticado
    let imageUrl = null;
    if (profileImage) {
      imageUrl = await uploadProfileImage(token);
    }

    // 4. (Opcional) Atualize o usuário com a URL da imagem, se necessário

    Alert.alert('Sucesso', 'Usuário cadastrado! Faça login para continuar.');
    navigation.navigate('Login');
  } catch (error) {
    console.error('Erro no cadastro:', error.response?.data || error.message);
    Alert.alert('Erro', error.response?.data?.message || 'Erro ao cadastrar.');
  }
};

// Função para upload da imagem, agora recebendo o token
const uploadProfileImage = async (token) => {
  if (!profileImage) return null;

  const formData = new FormData();
  const isWeb = typeof window !== 'undefined' && window.document;

  if (isWeb && profileImage.file) {
    formData.append('profilePicture', profileImage.file);
  } else {
    formData.append('profilePicture', {
      uri: profileImage.uri,
      type: profileImage.type || 'image/jpeg',
      name: profileImage.fileName || 'profile.jpg',
    });
  }

  try {
    const response = await api.post('/upload/profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.imageUrl;
  } catch (error) {
    console.error('Erro ao enviar imagem:', error.response?.data || error.message);
    Alert.alert('Erro', 'Erro ao enviar a foto de perfil.');
    return null;
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crie sua conta</Text>
      
      {/* Área para selecionar e mostrar a foto de perfil */}
      <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
        {profileImage ? (
          // Mostra a imagem escolhida
          <Image source={{ uri: profileImage.uri }} style={styles.profileImage} />
        ) : (
          // Placeholder caso nenhuma imagem tenha sido escolhida
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>Adicionar Foto</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Campo para nome de usuário */}
      <TextInput
        style={styles.input}
        placeholder="Nome de Usuário"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      {/* Campo para e-mail */}
      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {/* Campo para senha */}
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {/* Botão de cadastro */}
      <Button title="Cadastrar" onPress={handleRegister} />
      {/* Link para tela de login */}
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.loginText}>Já tem uma conta? Faça login</Text>
      </TouchableOpacity>
    </View>
  );
};

// Estilos da tela
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#8bc3ffff',
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },

  imageContainer: {
    marginBottom: 30,
  },

  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#007bff',
  },

  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    borderColor: '#007bff',
  },

  imagePlaceholderText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },

  input: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#fff',
    boxShadow: '2px 2px 2px 1px rgba(0, 0, 0, 0.2)'
  },

  loginText: {
    marginTop: 15,
    color: '#007bff',
    textDecorationLine: 'none',
  },
});

export default RegisterScreen;