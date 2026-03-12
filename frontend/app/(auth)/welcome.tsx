import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ICON_SIZE = Math.min(SCREEN_WIDTH * 0.42, 170);

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <>
            <StatusBar style="light" />
            <LinearGradient
                colors={['#2DD36F', '#1FAF5B', '#16874A']}
                style={styles.container}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.welcomeText}>WELCOME TO</Text>
                        <Text style={styles.appName}>EcoDash</Text>
                        <View style={styles.taglineContainer}>
                            <View style={styles.dividerLeft} />
                            <Text style={styles.tagline}>Turn Waste into Worth</Text>
                            <View style={styles.dividerRight} />
                        </View>
                    </View>

                    {/* Premium Recycling Icon */}
                    <View style={styles.iconWrapper}>
                        <View style={[styles.iconOuterRing, { width: ICON_SIZE, height: ICON_SIZE, borderRadius: ICON_SIZE / 2 }]}>
                            <View style={[styles.iconInnerRing, { width: ICON_SIZE * 0.82, height: ICON_SIZE * 0.82, borderRadius: ICON_SIZE * 0.41 }]}>
                                <View style={[styles.iconCore, { width: ICON_SIZE * 0.65, height: ICON_SIZE * 0.65, borderRadius: ICON_SIZE * 0.325 }]}>
                                    <Image
                                        source={require('@/assets/images/icon-removebg-preview.png')}
                                        style={styles.iconImage}
                                        resizeMode="contain"
                                    />
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* CTA Section */}
                <View style={styles.ctaSection}>
                    <TouchableOpacity 
                        onPress={() => router.push('/(auth)/login')} 
                        style={styles.primaryButton}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={['#FFFFFF', '#F8F9FA']}
                            style={styles.buttonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.primaryButtonText}>Get Started</Text>
                            <Text style={styles.buttonArrow}>→</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Partners Section - Modern Layout */}
                    <View style={styles.partnersSection}>
                      <Text style={styles.partnersTitle}>In collaboration</Text>
                        
                        {/* Logo Grid */}
                        <View style={styles.logoGrid}>
                            {/* Plastic Cycle - Premium Card (TOP) */}
                            <View style={styles.partnerCard}>
                                <View style={styles.logoFrame}>
                                    <Image
                                        source={require('@/assets/images/plastic.png')}
                                        style={styles.logoImage}
                                        resizeMode="contain"
                                    />
                                </View>
                               
                            </View>

                            {/* Divider with "×" */}
                            <View style={styles.collaborationDivider}>
                                <Text style={styles.collaborationText}>×</Text>
                                
                            </View>

                            <Text style={styles.partnersTitle1}>DEVELOPED BY</Text>

                            {/* Leo Club UOM - Premium Card (BOTTOM) */}
                            <View style={styles.partnerCard}>
                                <View style={styles.logoFrame}>
                                    <Image
                                        source={require('@/assets/images/leo.png')}
                                        style={styles.logoImage}
                                            resizeMode="contain"
                                        />
                                    </View>
                                    <Text style={styles.partnerName}>Leo Club of University of Moratuwa</Text>
                                </View>
                            </View>
                        </View>
                    </View>
            </LinearGradient>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 50,
        paddingBottom: 24,
        justifyContent: 'space-between',
    },
    
    // Hero Section - Premium Layout
    heroSection: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: 12,
    },
    welcomeText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.85)',
        letterSpacing: 3,
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    appName: {
        fontSize: 48,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -2,
        marginBottom: 10,
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 12,
    },
    taglineContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    dividerLeft: {
        width: 40,
        height: 1.5,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        marginRight: 16,
    },
    tagline: {
        fontSize: 15,
        fontWeight: '400',
        color: 'rgba(255, 255, 255, 0.9)',
        letterSpacing: 1.5,
    },
    dividerRight: {
        width: 40,
        height: 1.5,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        marginLeft: 16,
    },

    // Premium Icon Design
    iconWrapper: {
        marginVertical: 8,
        marginBottom: 8,
    },
    iconOuterRing: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    iconInnerRing: {
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    iconCore: {
        backgroundColor: 'rgba(255, 255, 255, 1)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 10,
    },
    recycleEmoji: {
        fontSize: 50,
    },
    iconImage: {
        width: '95%',
        height: '95%',
    },

    // CTA Section - Modern Button
    ctaSection: {
        width: '100%',
    },
    primaryButton: {
        width: '100%',
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    buttonGradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    primaryButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#16874A',
        letterSpacing: 0.5,
       
    },
    buttonArrow: {
        fontSize: 22,
        color: '#16874A',
        fontWeight: 'bold',
    },

    // Partners Section - Premium Cards
    partnersSection: {
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.15)',
    },
    partnersTitle: {
        fontSize: 10,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        marginBottom: 6,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    partnersTitle1: {
        fontSize: 10,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        marginBottom: 2,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    logoGrid: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    partnerCard: {
        alignItems: 'center',
        width: '100%',
        maxWidth: 200,
    },
    logoFrame: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingVertical: 2,
        paddingHorizontal: 2,
        width: '100%',
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    logoImage: {
        width: '100%',
        height: '100%',
    },
    partnerName: {
        fontSize: 9,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.85)',
        textAlign: 'center',
        marginTop: 4,
        letterSpacing: 0.5,
    },
    collaborationDivider: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 4,
    },
    collaborationText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.5)',
        fontWeight: '300',
    },
});
