import Ionicons from 'react-native-vector-icons/Ionicons';
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
    onContinue: (goals: string[]) => void | Promise<void>;
    onBack: () => void;
}

export const PersonalizationScreen: React.FC<PersonalizationScreenProps> = ({ onContinue, onBack }) => {
    const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
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

    const submitGoals = async (goalsToSubmit: string[]) => {
        if (isSubmitting) {
            return;
        }

        setSubmitError(null);
        setIsSubmitting(true);

        try {
            await Promise.resolve(onContinue(goalsToSubmit));
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : 'Nie udało się zakończyć konfiguracji. Spróbuj ponownie.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleContinue = () => {
        void submitGoals(selectedGoals);
    };

    const handleSkip = () => {
        void submitGoals([]);
    };

    const getContinueLabel = () => {
        if (isSubmitting) {
            return 'Zapisywanie...';
        }

        if (selectedGoals.length > 0) {
            return `Zakończ konfigurację (${selectedGoals.length} wybranych)`;
        }

        return 'Zakończ konfigurację';
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={onBack}
                    disabled={isSubmitting}
                >
                    <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleSkip}
                    disabled={isSubmitting}
                    style={styles.skipTouchTarget}
                    hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
                >
                    <Text style={[styles.skipButton, isSubmitting && styles.disabledText]}>Pomiń</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: insets.bottom + 176 },
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
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

            <View style={[styles.footerContainer, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
                {submitError && (
                    <Text style={styles.errorText}>{submitError}</Text>
                )}
                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        isSubmitting && styles.continueButtonDisabled,
                    ]}
                    onPress={handleContinue}
                    disabled={isSubmitting}
                    activeOpacity={0.85}
                >
                    <Text style={styles.continueButtonText}>{getContinueLabel()}</Text>
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
        paddingBottom: 10,
        zIndex: 20,
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
    skipTouchTarget: {
        minHeight: 44,
        minWidth: 72,
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    disabledText: {
        opacity: 0.45,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
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
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: Colors.light.background,
        paddingHorizontal: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        zIndex: 30,
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.06,
        shadowRadius: 10,
    },
    errorText: {
        color: '#D32F2F',
        fontSize: 13,
        lineHeight: 18,
        textAlign: 'center',
        marginBottom: 10,
    },
    continueButton: {
        backgroundColor: '#4CAF50',
        minHeight: 56,
        paddingHorizontal: 32,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    continueButtonDisabled: {
        opacity: 0.65,
    },
    continueButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
