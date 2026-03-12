import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <LinearGradient
            colors={['#4CAF50', '#45a049', '#2E7D32']}
            style={styles.container}
        >
            <View style={styles.content}>
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <Text style={styles.mainTitle}>Welcome to</Text>
                    <Text style={styles.appName}>EcoDash</Text>
                    <Text style={styles.tagline}>Turn Waste into Worth</Text>
                </View>

                {/* Illustration/Icon */}
                <View style={styles.illustrationContainer}>
                    <View style={styles.recycleIcon}>
                        <Text style={styles.recycleEmoji}>♻️</Text>
                    </View>
                </View>

                {/* Get Started Button */}
                <TouchableOpacity 
                    onPress={() => router.push('/(auth)/login')} 
                    style={styles.startButton}
                    activeOpacity={0.8}
                >
                    <Text style={styles.startButtonText}>Get Started</Text>
                </TouchableOpacity>

                {/* Developed By Section - Using Text Placeholders */}
                <View style={styles.footer}>
                    <Text style={styles.footerTitle}>Developed by</Text>
                    
                    {/* Leo Club - Text Placeholder */}
                    <View style={styles.logoContainer}>
                        <View style={styles.logoBox}>
                            <Text style={styles.logoPlaceholder}>🦁</Text>
                            <Text style={styles.placeholderText}>LEO CLUB</Text>
                        </View>
                        <Text style={styles.logoText}>Leo Club of University of Moratuwa</Text>
                    </View>

                    <Text style={styles.collaboratorText}>In collaboration with</Text>

                    {/* Plastic Cycle - Text Placeholder */}
                    <View style={styles.logoContainer}>
                        <View style={styles.logoBox}>
                            <Text style={styles.logoPlaceholder}>♻️</Text>
                            <Text style={styles.placeholderText}>PLASTIC CYCLE</Text>
                        </View>
                        <Text style={styles.logoText}>Plastic Cycle</Text>
                    </View>

                    <Text style={styles.noteText}>
                        Add logos: leo-club-logo.png & plastic-cycle-logo.png in assets/images/
                    </Text>
                </View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 30,
    },
    heroSection: {
        alignItems: 'center',
        marginTop: 40,
    },
    mainTitle: {
        fontSize: 24,
        color: '#FFFFFF',
        fontWeight: '400',
        opacity: 0.9,
        marginBottom: 8,
    },
    appName: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 12,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    tagline: {
        fontSize: 18,
        color: '#FFFFFF',
        opacity: 0.9,
        fontWeight: '300',
        letterSpacing: 1,
    },
    illustrationContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    recycleIcon: {
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    recycleEmoji: {
        fontSize: 100,
    },
    startButton: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 18,
        paddingHorizontal: 80,
        borderRadius: 30,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    startButtonText: {
        color: '#4CAF50',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    footer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    footerTitle: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.8,
        marginBottom: 15,
        fontWeight: '500',
    },
    logoContainer: {
        alignItems: 'center',
        marginVertical: 10,
    },
    logoBox: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        marginBottom: 8,
        alignItems: 'center',
        minWidth: 120,
    },
    logoPlaceholder: {
        fontSize: 36,
        marginBottom: 5,
    },
    placeholderText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#4CAF50',
        letterSpacing: 1,
    },
    logoText: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '600',
        opacity: 0.9,
        textAlign: 'center',
    },
    collaboratorText: {
        fontSize: 12,
        color: '#FFFFFF',
        opacity: 0.7,
        marginVertical: 8,
        fontStyle: 'italic',
    },
    noteText: {
        fontSize: 10,
        color: '#FFFFFF',
        opacity: 0.6,
        marginTop: 15,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
