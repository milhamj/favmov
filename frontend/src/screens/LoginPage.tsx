import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Icon } from 'react-native-elements';
import PageContainer from '../components/PageContainer';
import TopBar from '../components/TopBar';
import { signInWithOtp } from '../services/authService';
import Toast from 'react-native-toast-message';
import { Result, Success } from '../model/apiResponse';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isWaitingForOtp, setIsWaitingForOtp] = useState(false);
  const navigation = useNavigation();

  const handleLogin = () => {
    console.log('Login with:', { email });
    async () => {
        const result = await signInWithOtp(email)
        if (result instanceof Success) {
            setIsWaitingForOtp(true);
            Toast.show({
                type: 'success',
                text1: 'Check your email',
                text2: 'We have sent you an OTP to your email. Please input it below.',
                position: 'bottom'
            });
        } else {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: result.message,
                position: 'bottom'
            });
        }
    }
  };

  return (
    <PageContainer>
        <TopBar
            title= { 'Login' }
            backButton={{
            isShow: true,
            onClick: () => navigation.goBack()
            }}
        />
        <View style={styles.container}>
            <View style={styles.loginBox}>
                <View style={{height: 16}} />
                <Text style={styles.title}>Welcome!</Text>

                <View style={styles.inputContainer}>
                    <Icon name="email" size={20} color="gray" style={styles.inputIcon} />
                    <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    aria-disabled={isWaitingForOtp}
                    />
                </View>

                { isWaitingForOtp && 
                    <View style={styles.inputContainer}>
                        <Icon name="lock" size={20} color="gray" style={styles.inputIcon} />
                        <TextInput
                        style={styles.input}
                        placeholder="Input your OTP here..."
                        value={otp}
                        onChangeText={setOtp}
                        secureTextEntry
                        />
                    </View>
                }

                <View style={{height: 8}} />

                <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                    <Text style={styles.loginButtonText}>LOGIN</Text>
                </TouchableOpacity>
                <View style={{height: 16}} />
            </View>
        </View>
    </PageContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(243, 143, 77, 0.1)',
  },
  loginBox: {
    width: Platform.OS === 'web' ? 400 : '100%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 45,
  },
  loginButton: {
    backgroundColor: 'tomato',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginPage;