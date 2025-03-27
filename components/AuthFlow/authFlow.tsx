import React, { useContext, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator, StyleSheet, Platform, SafeAreaView } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { AuthContext } from "@/components/context/authContext";
import axios from "axios";
// import authpic from "@/assets/images/auth-picture.png";
import logo from "@/assets/images/logo-icon.png";
import { NavigationProp } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { EXPO_PUBLIC_API_URL } from "@env";



const API_URL = EXPO_PUBLIC_API_URL

export default function AuthFlow() {
    const auth = useContext(AuthContext);
    const [mode, setMode] = useState("login");
    const [step, setStep] = useState(1);
    const router = useRouter();
    const [secureTextEntry, setSecureTextEntry] = useState(true);
    const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    gender: "Male",
    dob: new Date(),
    country: "India",
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS, close on Android
    if (selectedDate) {
        setFormData({ ...formData, dob: selectedDate });
    }
};

  const handleSubmit = async () => {
    if (mode === "login") {
      try {
        const res = await axios.post(`${API_URL}/api/auth/login`, {
          email: formData.email,
          password: formData.password,
        });
        if (res.data) {
            console.log("userId in login:", res.data)
          auth.login(res.data.userId, res.data.token);
          router.push("/(tabs)/home");
        }
      } catch (error : any) {
        Alert.alert("Error", error.response?.data?.message || "Login failed");
      }
    } else {
      if (step === 1) setStep(2);
      else if (step === 2) setStep(3);
      else {
        try {
          const res = await axios.post(`${API_URL}/api/auth/register`, {
            ...formData,
            dob: formData.dob.toISOString(),
          });
          if (res.data) {
            auth.login(res.data.userId, res.data.token);
            router.push('/');
          }
        } catch (error : any) {
          Alert.alert("Error", error.response?.data?.message || "Registration failed");
        }
      }
    }
  };

  const isFormValid = () => {
    if (mode === "login") {
        return formData.email.trim() && formData.password.trim();
    } else if (step === 1) {
        return formData.name.trim() && formData.email.trim() && formData.password.trim();
    }
    return true;
};

  return (
    
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
            <Image source={logo} style={styles.logo} />
            <Text style={styles.title}>ChessVeda</Text>
            <Text style={styles.subtitle}>Empowering Minds, One Move at a Time</Text>
        </View>

        <View style={styles.formContainer}>
            <Text style={styles.formTitle}>
                {mode === "login" ? "Login into Account" : step === 1 ? "Create Account" : step === 2 ? "Date of Birth" : "Country"}
            </Text>

            {mode === "login" ? (
                <>
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            placeholder="Email"
                            placeholderTextColor="#999"
                            style={styles.input}
                            value={formData.email}
                            onChangeText={(text) => setFormData({ ...formData, email: text })}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            />
                    </View>
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            placeholder="Password"
                            placeholderTextColor="#999"
                            style={styles.input}
                            value={formData.password}
                            onChangeText={(text) => setFormData({ ...formData, password: text })}
                            secureTextEntry={secureTextEntry}
                            />
                        <TouchableOpacity 
                            onPress={() => setSecureTextEntry(!secureTextEntry)} 
                            style={styles.eyeIcon}
                            >
                            <Ionicons 
                                name={secureTextEntry ? "eye-off-outline" : "eye-outline"} 
                                size={20} 
                                color="#666" 
                                />
                        </TouchableOpacity>
                    </View>
                </>
            ) : step === 1 ? (
                <>
                    <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            placeholder="Full Name"
                            placeholderTextColor="#999"
                            style={styles.input}
                            value={formData.name}
                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                            autoCapitalize="words"
                            />
                    </View>
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            placeholder="Email"
                            placeholderTextColor="#999"
                            style={styles.input}
                            value={formData.email}
                            onChangeText={(text) => setFormData({ ...formData, email: text })}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            />
                    </View>
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            placeholder="Password"
                            placeholderTextColor="#999"
                            style={styles.input}
                            value={formData.password}
                            onChangeText={(text) => setFormData({ ...formData, password: text })}
                            secureTextEntry={secureTextEntry}
                            />
                        <TouchableOpacity 
                            onPress={() => setSecureTextEntry(!secureTextEntry)} 
                            style={styles.eyeIcon}
                            >
                            <Ionicons 
                                name={secureTextEntry ? "eye-off-outline" : "eye-outline"} 
                                size={20} 
                                color="#666" 
                                />
                        </TouchableOpacity>
                    </View>
                </>
            ) : step === 2 ? (
                <>
                <Text style={styles.label}>Select your date of birth</Text>
                <TouchableOpacity 
                    onPress={() => setShowDatePicker(true)} 
                    style={[styles.inputContainer, styles.datePickerButton]}
                    >
                    <Ionicons name="calendar-outline" size={20} color="#666" style={styles.inputIcon} />
                    <Text style={styles.dateText}>
                        {formData.dob.toLocaleDateString()}
                    </Text>
                </TouchableOpacity>
                {(showDatePicker || Platform.OS === 'ios') && (
                    <DateTimePicker
                    value={formData.dob}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    maximumDate={new Date()}
                    onChange={handleDateChange}
                    style={Platform.OS === 'ios' ? styles.iosDatePicker : null}
                    textColor="black"
                    />
                )}
            </>
            ) : (
                <View style={styles.inputContainer}>
                    <Ionicons name="earth-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                        placeholder="Country"
                        placeholderTextColor="#999"
                        style={styles.input}
                        value={formData.country}
                        onChangeText={(text) => setFormData({ ...formData, country: text })}
                        />
                </View>
            )}

            <TouchableOpacity 
                onPress={handleSubmit} 
                style={[styles.button, !isFormValid() && styles.buttonDisabled]}
                disabled={!isFormValid() || loading}
                >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>
                        {mode === "login" ? "Login Now" : step === 3 ? "Complete Registration" : "Next"}
                    </Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity 
                onPress={() => {
                    setMode(mode === "login" ? "register" : "login");
                    setStep(1);
                }} 
                style={styles.switchButton}
                >
                <Text style={styles.switchText}>
                    {mode === "login" ? "Don't have an account? Create one" : "Already have an account? Login"}
                </Text>
            </TouchableOpacity>
        </View>
    </ScrollView>
               
);
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 25,
        backgroundColor: '#000', // Black background
    },
    header: {
        flexDirection: 'column', // Stack items vertically
        alignItems: 'flex-start', // Align items to the left
        marginBottom: 30,
    },
    logo: {
        width: 80,
        height: 150,
        marginTop: 25,
        marginBottom: 15, // Push text away from the image
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff', // White text
    },
    subtitle: {
        fontSize: 16,
        color: '#ccc', // Light gray for better readability
        textAlign: 'left',
        flexShrink: 1, // Prevent text overflow
    },
    formContainer: {
        marginBottom: 20,
    },
    formTitle: {
        fontSize: 22,
        fontWeight: '600',
        color: '#fff', // White text
        marginBottom: 25,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#444', // Dark gray border for a subtle effect
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 15,
        backgroundColor: '#222', // Dark background for input
    },
    inputIcon: {
        marginRight: 10,
        color: '#fff', // White icons
    },
    input: {
        flex: 1,
        height: 50,
        color: '#fff', // White text
    },
    datePickerButton: {
        height: 50,
        justifyContent: 'flex-start',
    },
    dateText: {
        color: '#fff', // White text for selected date
        fontSize: 16,
    },
    button: {
        backgroundColor: '#000', // Black button
        padding: 15,
        borderRadius: 10,
        marginTop: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#fff', // Soft white glow effect
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonText: {
        color: '#fff', // White text
        fontSize: 16,
        fontWeight: '600',
    },
    eyeIcon: {
        padding: 10,
    },
    iosDatePicker: {
        height: 120,
        marginTop: -10,
    },
    androidDatePicker: {
        backgroundColor: 'white',
        borderRadius: 10,
        overflow: 'hidden',
    },
    switchButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    label: {
        fontSize: 16,
        color: '#2c3e50',
        marginBottom: 10,
    },
    buttonDisabled: {
        backgroundColor: '#bdc3c7',
    },
    switchText: {
        color: '#fff', // White text for switching between login/register
        fontSize: 15,
        fontWeight: '500',
    },
});
