// src/screens/HomeScreen.js

import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View, Text, Button, StyleSheet, Alert,
  FlatList, TextInput, TouchableOpacity, ActivityIndicator, Image, Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AuthContext from '../context/AuthContext';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const HomeScreen = ({ navigation }) => {
  const { signOut } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userLikes, setUserLikes] = useState({});
  const [userFavorites, setUserFavorites] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);
  const [newPostImageUri, setNewPostImageUri] = useState(null);


  // Efeito para pedir permissões, roda apenas uma vez
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão Negada', 'Desculpe, precisamos de permissões de galeria para isso funcionar!');
      }
    })();
  }, []);

  // Efeito que roda toda vez que a tela entra em foco
  useFocusEffect(
    useCallback(() => {
      const loadDataAndPosts = async () => {
        let userId = null;
        try {
          const userDataString = await AsyncStorage.getItem('userData');
          if (userDataString) {
            const userData = JSON.parse(userDataString);
            setCurrentUserId(userData.id);
            userId = userData.id;
          }
        } catch (error) {
          console.error('Erro ao carregar dados do usuário do AsyncStorage:', error);
        }
        
        // Aguarda um pouco para garantir que currentUserId seja definido
        setTimeout(() => {
          fetchPosts(userId);
        }, 100);
      };

      loadDataAndPosts();

      return () => {};
    }, [searchTerm])
  );

  const fetchPosts = async (userId) => {
    setLoadingPosts(true);
    try {
      console.log('Buscando posts para usuário:', userId || currentUserId);
      
      // 1. Busca posts
      const postsResponse = await api.get(`/posts?q=${searchTerm}`);
      const newPosts = postsResponse.data;
      
      // 2. Inicializa objetos para likes e favorites
      let newLikes = {};
      let newFavorites = {};
      
      const finalUserId = userId || currentUserId;
      console.log('UserId final para buscar interações:', finalUserId);

      if (finalUserId) {
        try {
          const userToken = await AsyncStorage.getItem('userToken');
          if (userToken) {
            const headers = { headers: { Authorization: `Bearer ${userToken}` } };
            
            console.log('Buscando likes e favoritos...');
            
            // Busca likes e favoritos em paralelo
            const [likesResponse, favoritesResponse] = await Promise.all([
              api.get(`/users/${finalUserId}/likes`, headers),
              api.get(`/users/${finalUserId}/favorites`, headers)
            ]);

            const isLiked = likesResponse.data.some(item => item.id === currentItemId);
            const isFavorited = favoritesResponse.data.some(item => item.id === currentItemId);

// Mudar cor dos elementos
if (isLiked) {
  likeButton.style.color = '#ff4444'; // Vermelho para curtido
  likeButton.classList.add('active');
} else {
  likeButton.style.color = '#666'; // Cinza para não curtido
  likeButton.classList.remove('active');
}

if (isFavorited) {
  favoriteButton.style.color = '#ffd700'; // Dourado para favoritado
  favoriteButton.classList.add('active');
} else {
  favoriteButton.style.color = '#666'; // Cinza para não favoritado
  favoriteButton.classList.remove('active');
}

            console.log('Likes encontrados:', likesResponse.data.length);
            console.log('Favoritos encontrados:', favoritesResponse.data.length);

            // Processa likes
            likesResponse.data.forEach(like => {
              newLikes[like.post_id] = true;
            });

            // Processa favoritos
            favoritesResponse.data.forEach(favorite => {
              newFavorites[favorite.post_id] = true;
            });
          }
        } catch (interactionError) {
          console.warn('Erro ao buscar interações do usuário:', interactionError);
          // Não falha se não conseguir buscar likes/favorites
        }
      }

      console.log('Likes processados:', Object.keys(newLikes).length);
      console.log('Favoritos processados:', Object.keys(newFavorites).length);

      // 3. Atualiza estados - IMPORTANTE: usar callback para garantir sincronização
      setPosts(() => newPosts);
      setUserLikes(() => newLikes);
      setUserFavorites(() => newFavorites);

    } catch (error) {
      console.error('Erro ao buscar posts:', error.response?.data || error.message);
      Alert.alert('Erro', 'Não foi possível carregar os posts.');
      setPosts([]);
      setUserLikes({});
      setUserFavorites({});
    } finally {
      setLoadingPosts(false);
    }
  };

  const pickPostImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      setNewPostImageUri(result.assets[0].uri);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      Alert.alert('Erro', 'Título e conteúdo do post não podem ser vazios.');
      return;
    }

    setIsSubmitting(true);
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        Alert.alert('Erro de Autenticação', 'Você precisa estar logado para criar um post.');
        return;
      }

      let imageUrlToSave = null;
      if (newPostImageUri) {
        const formData = new FormData();

        if (Platform.OS === 'web') {
          const response = await fetch(newPostImageUri);
          const blob = await response.blob();
          formData.append('postImage', blob, `post_${currentUserId}_${Date.now()}.jpg`);
        } else {
          formData.append('postImage', {
            uri: newPostImageUri,
            name: `post_${currentUserId}_${Date.now()}.jpg`,
            type: 'image/jpeg',
          });
        }

        try {
          const uploadResponse = await api.post('/upload/post-image', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${userToken}`,
            },
          });
          imageUrlToSave = uploadResponse.data.imageUrl;
        } catch (uploadError) {
          console.error('Erro ao fazer upload da imagem do post:', uploadError.response?.data || uploadError.message);
          Alert.alert('Erro de Upload', 'Não foi possível fazer upload da imagem do post.');
          setIsSubmitting(false);
          return;
        }
      }

      await api.post(
        '/posts',
        { title: newPostTitle, content: newPostContent, image_url: imageUrlToSave },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      Alert.alert('Sucesso', 'Post criado com sucesso!');
      setNewPostTitle('');
      setNewPostContent('');
      setNewPostImageUri(null);
      fetchPosts(currentUserId);
    } catch (error) {
      console.error('Erro ao criar post:', error.response?.data || error.message);
      Alert.alert('Erro ao Criar Post', error.response?.data?.message || 'Ocorreu um erro ao criar o post.');
      if (error.response?.status === 401 || error.response?.status === 403) {
        signOut();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLike = async (postId) => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        Alert.alert('Erro', 'Você precisa estar logado para curtir posts.');
        signOut();
        return;
      }
      
      const response = await api.post(
        `/posts/${postId}/like`,
        {},
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      
      const liked = response.data.liked;
      
      // Atualiza estado de likes
      setUserLikes(prev => ({ ...prev, [postId]: liked }));
      
      // Atualiza contador nos posts
      setPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? { ...post, likes_count: liked ? post.likes_count + 1 : Math.max(0, post.likes_count - 1) }
            : post
        )
      );
    } catch (error) {
      console.error('Erro ao curtir/descurtir:', error.response?.data || error.message);
      Alert.alert('Erro', error.response?.data?.message || 'Não foi possível processar o like.');
      if (error.response?.status === 401 || error.response?.status === 403) signOut();
    }
  };

  const handleToggleFavorite = async (postId) => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        Alert.alert('Erro', 'Você precisa estar logado para favoritar posts.');
        signOut();
        return;
      }
      
      const response = await api.post(
        `/posts/${postId}/favorite`,
        {},
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      const { favorited } = response.data;
      
      // Atualiza estado de favoritos
      setUserFavorites(prev => ({ ...prev, [postId]: favorited }));
      
      // Atualiza contador nos posts
      setPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? { ...post, favorites_count: favorited ? (post.favorites_count || 0) + 1 : Math.max(0, (post.favorites_count || 0) - 1) }
            : post
        )
      );

    } catch (error) {
      console.error('Erro ao favoritar/desfavoritar:', error.response?.data || error.message);
      Alert.alert('Erro', error.response?.data?.message || 'Não foi possível processar o favorito.');
      
      if (error.response?.status === 401 || error.response?.status === 403) signOut();
    }
  };

  const renderPostItem = ({ item }) => {
    // Debug: log do estado atual para este post
    const isLiked = userLikes[item.id];
    const isFavorited = userFavorites[item.id];
    
    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          {item.profile_picture_url ? (
            <Image source={{ uri: `http://localhost:3001${item.profile_picture_url}` }} style={styles.profilePicture} />
          ) : (
            <Ionicons name="person-circle" size={40} color="#ccc" style={styles.profilePicturePlaceholder} />
          )}
          <Text style={styles.postUsername}>{item.username}</Text>
        </View>
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postContent}>{item.content}</Text>
        {item.image_url && <Image source={{ uri: `http://localhost:3001${item.image_url}` }} style={styles.postImage} />}
        <View style={styles.postFooter}>
          <TouchableOpacity style={styles.interactionButton} onPress={() => handleToggleLike(item.id)}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={24}
              color={isLiked ? '#e91e63' : '#666'}
            />
            <Text style={styles.interactionText}>{item.likes_count}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.interactionButton} onPress={() => navigation.navigate('PostDetail', { postId: item.id })}>
            <Ionicons name="chatbubble-outline" size={24} color="#666" />
            <Text style={styles.interactionText}>{item.comments_count}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.interactionButton} onPress={() => handleToggleFavorite(item.id)}>
            <Ionicons 
              name={isFavorited ? 'bookmark' : 'bookmark-outline'} 
              size={24} 
              color={isFavorited ? '#ffc107' : '#666'} 
            />
            <Text style={styles.interactionText}>{item.favorites_count || 0}</Text> 
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.mainTitle}>Fórum do App</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileButton}>
            <Ionicons name="person-circle-outline" size={30} color="#007bff" />
          </TouchableOpacity>
          <Button title="Sair" onPress={signOut} />
        </View>
      </View>

      {/* Pesquisa */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar posts por título ou conteúdo..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          onSubmitEditing={() => fetchPosts(currentUserId)}
        />
        <TouchableOpacity onPress={() => fetchPosts(currentUserId)} style={styles.searchButton}>
          <Ionicons name="search" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Criar post */}
      <View style={styles.createPostContainer}>
        <TextInput
          style={styles.input}
          placeholder="Título do seu post"
          value={newPostTitle}
          onChangeText={setNewPostTitle}
        />
        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
          placeholder="O que você quer compartilhar?"
          value={newPostContent}
          onChangeText={setNewPostContent}
          multiline
        />
        <TouchableOpacity onPress={pickPostImage} style={styles.imagePickerButton}>
          <Ionicons name="image-outline" size={24} color="#007bff" />
          <Text style={styles.imagePickerButtonText}>Adicionar Imagem</Text>
        </TouchableOpacity>
        {newPostImageUri && <Image source={{ uri: newPostImageUri }} style={styles.previewImage} />}
        <Button
          title={isSubmitting ? "Publicando..." : "Criar Post"}
          onPress={handleCreatePost}
          disabled={isSubmitting}
        />
      </View>

      {/* Lista de Posts */}
      {loadingPosts ? (
        <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPostItem}
          contentContainerStyle={styles.postList}
          ListEmptyComponent={<Text style={styles.noPostsText}>Nenhum post encontrado. Seja o primeiro a postar!</Text>}
        />
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#8bc3ffff', 
    // paddingTop: 40 
  },

  // HEADER
  header: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 20, 
    paddingBottom: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#e0e0e0', 
    backgroundColor: '#00aced'
  },

  mainTitle: { 
    marginLeft: '45vw',
    fontSize: 26, 
    fontWeight: 'bold', 
    color: '#222',
    // display: 'flex',
    // alignItems: 'center', 
  },

  headerButtons: { 
    flexDirection: 'row', 
    // alignItems: 'center', 
    marginTop: '1vh',
  },

  profileButton: { 
    marginRight: 15, 
    // backgroundColor: '#000'
  },

  // SEARCH
  searchContainer: {
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff',
    borderRadius: 12, 
    margin: 15, 
    paddingHorizontal: 12, 
    // width: '30vw',
    // display: 'flex',
    // justifyContent: 'end',
    elevation: 2,
    // marginLeft: '65vw'
  },

  searchInput: { 
    flex: 1, 
    padding: 10, 
    fontSize: 16,
  },

  searchButton: { 
    backgroundColor: '#007bff', 
    paddingVertical: 8, 
    paddingHorizontal: 20, 
    borderRadius: 8,
    marginRight: '-1vw',
    boxShadow: '5px 3px 3px black'
  },

  // CREATE POST
  createPostContainer: {
    backgroundColor: '#fff', 
    padding: 20, 
    marginHorizontal: 500, 
    marginBottom: 50,
    marginTop: 30,
    borderRadius: 12, 
    elevation: 3,
  },

  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8, 
    padding: 12, 
    marginBottom: 10, 
    backgroundColor: '#f9f9f9' 
  },

  imagePickerButton: {
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#e9f5ff',
    padding: 12, 
    borderRadius: 8, 
    justifyContent: 'center', 
    marginBottom: 10,
    boxShadow: '2px 2px 2px 1px rgba(0, 0, 0, 0.2)'
  },

  imagePickerButtonText: { 
    marginLeft: 10, 
    color: '#007bff', 
    fontWeight: 'bold' 
  },

  previewImage: { 
    width: '100%', 
    height: 180, 
    borderRadius: 10, 
    resizeMode: 'contain', 
    marginBottom: 10,
  },

  // POSTS
  postList: { 
    paddingHorizontal: 300, 
    paddingBottom: 20 
  },

  postCard: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 50, 
    elevation: 2
  },

  postHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10 
  },

  profilePicture: { 
    width: 50, 
    height: 50, 
    borderRadius: 30, 
    marginRight: 10 
  },

  profilePicturePlaceholder: { 
    marginRight: 10 
  },

  postUsername: { 
    fontWeight: 'bold', 
    fontSize: 18, 
    color: '#444' 
  },

  postTitle: { 
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 15,
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#222' 
  },

  postContent: { 
    fontSize: 15, 
    lineHeight: 22, 
    color: '#555', 
    marginBottom: 15,
    marginRight: 50,
    marginLeft: 50
  },

  postImage: { 
    width: '100%', 
    height: 250,
    marginTop: 10, 
    marginBottom: 20, 
    resizeMode: 'contain'
  },

  postFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginTop: 12, 
    paddingTop: 12, 
    borderTopWidth: 1, 
    borderTopColor: '#eee' 
  },

  interactionButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 10
  },

  interactionText: { 
    marginLeft: 5, 
    fontSize: 14, 
    color: '#666' 
  },

  noPostsText: { 
    textAlign: 'center', 
    marginTop: 50, 
    fontSize: 16, 
    color: '#777' 
  }
});


export default HomeScreen;

