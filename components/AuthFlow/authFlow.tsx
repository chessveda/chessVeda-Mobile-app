import React, { useContext, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator, StyleSheet, Platform, LogBox } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { AuthContext } from "@/components/context/authContext";
import axios from "axios";
import logo from "@/assets/images/logo-icon.png";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import CountryPicker from 'react-native-country-picker-modal'; // Import the library

const API_URL = "http://172.16.0.102:8080";
LogBox.ignoreAllLogs();

export default function AuthFlow() {
    const auth = useContext(AuthContext);
    const [mode, setMode] = useState("login");
    const [step, setStep] = useState(1);
    const router = useRouter();
    const [secureTextEntry, setSecureTextEntry] = useState(true);
    const [loading, setLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        gender: "Male",
        dob: new Date(),
        country: "India", // Default country name
        countryCode: "IN", // Default country code
    });

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setFormData({ ...formData, dob: selectedDate });
        }
    };

    const handleCountrySelect = (country) => {
        setFormData({ 
            ...formData, 
            country: country.name, 
            countryCode: country.cca2 
        });
        setShowCountryPicker(false);
    };

    const handleSubmit = async () => {
        if (mode === "login") {
            try {
                const res = await axios.post(`${API_URL}/api/auth/login`, {
                    email: formData.email,
                    password: formData.password,
                });
                if (res.data) {
                    console.log("userId in login:", res.data);
                    auth.login(res.data.userId, res.data.token);
                    router.push("/(tabs)/home");
                }
            } catch (error) {
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
                } catch (error) {
                    Alert.alert("Error", error.response?.data?.message || "Registration failed");
                }
            }
        }
    };

    const handleBack = () => {
        if (mode === "register" && step > 1) {
            setStep(step - 1);
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
            {mode === "register" && step > 1 && (
                <View style={styles.backButtonContainer}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            )}
            <View style={styles.header}>
                <Image source={logo} style={styles.logo} />
                <Text style={styles.title}>ChessVeda</Text>
                <Text style={styles.subtitle}>Empowering Minds, One Move at a Time</Text>
            </View>

            <View style={styles.formContainer}>
                <Text style={styles.formTitle}>
                    {mode === "login" ? "Login into your account" : step === 1 ? "Create Your Account" : step === 2 ? "When is Your Birthday?" : "What's Your Country?"}
                </Text>

                {mode === "login" ? (
                    <>
                        <View style={styles.inputContainer}>
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
                        <Text style={styles.label}>Gender</Text>
                        <View style={styles.radioContainer}>
                            <TouchableOpacity
                                style={styles.radioOption}
                                onPress={() => setFormData({ ...formData, gender: "Male" })}
                            >
                                <Ionicons
                                    name={formData.gender === "Male" ? "radio-button-on" : "radio-button-off"}
                                    size={20}
                                    color={formData.gender === "Male" ? "#3D4CED" : "#666"}
                                    style={styles.radioIcon}
                                />
                                <Text
                                    style={[
                                        styles.radioText,
                                        { color: formData.gender === "Male" ? "#fff" : "#666" }
                                    ]}
                                >
                                    Male
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.radioOption}
                                onPress={() => setFormData({ ...formData, gender: "Female" })}
                            >
                                <Ionicons
                                    name={formData.gender === "Female" ? "radio-button-on" : "radio-button-off"}
                                    size={20}
                                    color={formData.gender === "Female" ? "#3D4CED" : "#666"}
                                    style={styles.radioIcon}
                                />
                                <Text
                                    style={[
                                        styles.radioText,
                                        { color: formData.gender === "Female" ? "#fff" : "#666" }
                                    ]}
                                >
                                    Female
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </>
                ) : step === 2 ? (
                    <>
                        <Text style={styles.label}>*Please Select the Year First</Text>
                        <TouchableOpacity 
                            onPress={() => setShowDatePicker(true)} 
                            style={[styles.inputContainer, styles.datePickerButton]}
                        >
                            <Text style={styles.dateText}>
                                {formData.dob.toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={formData.dob}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                maximumDate={new Date()}
                                onChange={handleDateChange}
                                style={Platform.OS === 'ios' ? styles.iosDatePicker : styles.androidDatePicker}
                                textColor={Platform.OS === 'ios' ? '#fff' : undefined}
                            />
                        )}
                    </>
                ) : (
                    <View style={styles.countryContainer}>
                        <TouchableOpacity 
                            style={[styles.inputContainer, styles.countryPickerButton]}
                            onPress={() => setShowCountryPicker(true)}
                        >
                            <Text style={styles.flagIcon}>
                                {formData.countryCode ? String.fromCodePoint(...formData.countryCode.split('').map(char => 127397 + char.charCodeAt())) : "🌍"}
                            </Text>
                            <Text style={styles.countryText}>
                                {formData.country || "Select a country"}
                            </Text>
                            <Ionicons 
                                name="chevron-down" 
                                size={20} 
                                color="#666" 
                                style={styles.dropdownIcon} 
                            />
                        </TouchableOpacity>
                        <CountryPicker
                            visible={showCountryPicker}
                            withFlag
                            withFilter
                            withCountryNameButton
                            onSelect={handleCountrySelect}
                            onClose={() => setShowCountryPicker(false)}
                            containerButtonStyle={{ display: 'none' }} // Hide default button since we use custom one
                            theme={{
                                backgroundColor: '#222',
                                onBackgroundTextColor: '#fff',
                                primaryColor: '#3D4CED',
                                filterPlaceholderTextColor: '#999',
                            }}
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
                        {mode === "login" ? "Create Your New Account" : "Login into Your Account"}
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
        backgroundColor: '#000',
    },
    backButtonContainer: {
        position: 'absolute',
        top: 40,
        left: 20,
        zIndex: 1,
    },
    backButton: {
        padding: 10,
    },
    header: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        marginBottom: 30,
    },
    logo: {
        width: 70,
        height: 120,
        borderRadius: 35,
        marginTop: 65,
        marginBottom: 15,
    },
    title: {
        fontSize: 38,
        fontWeight: '400',
        color: '#fff',
    },
    subtitle: {
        fontSize: 18,
        color: '#ccc',
        textAlign: 'left',
        flexShrink: 1,
    },
    formContainer: {
        marginBottom: 20,
    },
    formTitle: {
        fontSize: 29,
        fontWeight: '300',
        color: '#fff',
        marginBottom: 25,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 15,
        backgroundColor: '#222',
        height: 50,
    },
    input: {
        flex: 1,
        height: 50,
        color: '#fff',
    },
    eyeIcon: {
        padding: 10,
    },
    radioContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    radioOption: {
        flexDirection: 'row',
        paddingHorizontal: 18,
        marginBottom: 10,
        marginLeft: -17,
        alignItems: 'center',
    },
    radioIcon: {
        marginRight: 10,
    },
    radioText: {
        fontSize: 16,
    },
    datePickerButton: {
        justifyContent: 'center',
    },
    dateText: {
        color: '#fff',
        fontSize: 16,
        flex: 1,
    },
    iosDatePicker: {
        height: 120,
        marginTop: -10,
    },
    androidDatePicker: {
        // Minimal styling for Android
    },
    countryContainer: {
        marginBottom: 15,
    },
    countryPickerButton: {
        justifyContent: 'space-between',
    },
    flagIcon: {
        fontSize: 20,
        marginRight: 10,
        color: '#fff',
    },
    countryText: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
    },
    dropdownIcon: {
        marginLeft: 10,
    },
    button: {
        backgroundColor: '#3D4CED',
        padding: 15,
        borderRadius: 30,
        marginTop: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonDisabled: {
        backgroundColor: '#666',
        opacity: 0.7,
    },
    switchButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    switchText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '500',
    },
    label: {
        fontSize: 16,
        color: '#fff',
        marginBottom: 10,
    },
});