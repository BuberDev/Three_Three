import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';

interface PersonalizationScreenProps {
    onContinue: (goals: string[]) => void;
    onBack: () => void;
}

export const PersonalizationScreen: React.FC<PersonalizationScreenProps> = ({ onContinue, onBack }) => {
    const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
    const insets = useSafeAreaInsets();

    const goals = [
        {
            id: 'organization',
            title: 'Organizacja',
            description: 'Lepsze zarządzanie zadaniami i czasem',
            icon: 'list'
        },
        {
            id: 'work',
            title: 'Praca',
            description: 'Produktywność i cele zawodowe',
            icon: 'briefcase'
        },
        {
            id: 'health',
            title: 'Zdrowie i nawyki',
            description: 'Tracking nawyków i wellbeing',
            icon: 'heart'
        },
        {
            id: 'learning',
            title: 'Nauka i rozwój',
            description: 'Rozwój osobisty i nowe umiejętności',
            icon: 'school'
        }
    ];

    const toggleGoal = (goalId: string) => {
        setSelectedGoals(prev => {
            if (prev.includes(goalId)) {
                return prev.filter(id => id !== goalId);
            } else {
                return [...prev, goalId];
            }
        });
    };

    const handleContinue = () => {
        onContinue(selectedGoals);
    };

    const handleSkip = () => {
        onContinue([]);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSkip}>
                    <Text style={styles.skipButton}>Pomiń</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.titleContainer}>
                    <Ionicons name="flag" size={48} color="#4CAF50" />
                    <Text style={styles.title}>Jakie obszary chcesz usprawnić?</Text>
                    <Text style={styles.subtitle}>
                        Wybierz cele, które są dla Ciebie najważniejsze. Pomoże nam to lepiej dostosować aplikację.
                    </Text>
                </View>

                <View style={styles.goalsContainer}>
                    {goals.map((goal) => {
                        const isSelected = selectedGoals.includes(goal.id);

                        return (
                            <TouchableOpacity
                                key={goal.id}
                                style={[
                                    styles.goalItem,
                                    isSelected && styles.goalItemSelected
                                ]}
                                onPress={() => toggleGoal(goal.id)}
                            >
                                <View style={styles.goalContent}>
                                    <View style={[
                                        styles.goalIcon,
                                        isSelected && styles.goalIconSelected
                                    ]}>
                                        <Ionicons
                                            name={goal.icon as any}
                                            size={24}
                                            color={isSelected ? 'white' : '#4CAF50'}
                                        />
                                    </View>

                                    <View style={styles.goalText}>
                                        <Text style={[
                                            styles.goalTitle,
                                            isSelected && styles.goalTitleSelected
                                        ]}>
                                            {goal.title}
                                        </Text>
                                        <Text style={[
                                            styles.goalDescription,
                                            isSelected && styles.goalDescriptionSelected
                                        ]}>
                                            {goal.description}
                                        </Text>
                                    </View>

                                    <View style={[
                                        styles.checkbox,
                                        isSelected && styles.checkboxSelected
                                    ]}>
                                        {isSelected && (
                                            <Ionicons name="checkmark" size={16} color="white" />
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

            </ScrollView>

            <View style={styles.footerContainer}>
                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleContinue}
                >
                    <Text style={styles.continueButtonText}>
                        {selectedGoals.length > 0
                            ? `Zakończ konfigurację (${selectedGoals.length} wybranych)`
                            : 'Zakończ konfigurację'
                        }
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        zIndex: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    skipButton: {
        color: Colors.light.tabIconDefault,
        fontSize: 16,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    titleContainer: {
        alignItems: 'center',
        paddingTop: 20,
        marginBottom: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.light.text,
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.light.tabIconDefault,
        textAlign: 'center',
        lineHeight: 22,
    },
    goalsContainer: {
        marginBottom: 20,
    },
    goalItem: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    goalItemSelected: {
        borderColor: '#4CAF50',
        backgroundColor: '#F8FDF8',
    },
    goalContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    goalIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    goalIconSelected: {
        backgroundColor: '#4CAF50',
    },
    goalText: {
        flex: 1,
        marginRight: 16,
    },
    goalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 4,
    },
    goalTitleSelected: {
        color: '#4CAF50',
    },
    goalDescription: {
        fontSize: 14,
        color: Colors.light.tabIconDefault,
        lineHeight: 18,
    },
    goalDescriptionSelected: {
        color: '#4CAF50',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
    },
    footerContainer: {
        backgroundColor: Colors.light.background,
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    continueButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    continueButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});