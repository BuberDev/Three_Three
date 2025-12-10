import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { IconSymbol } from './ui/icon-symbol';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    retry = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                const FallbackComponent = this.props.fallback;
                return <FallbackComponent error={this.state.error} retry={this.retry} />;
            }

            return (
                <ThemedView style={styles.container}>
                    <IconSymbol name="exclamationmark.triangle" size={48} color="#FF6B6B" />
                    <ThemedText variant="titleLarge" style={styles.title}>
                        Oops! Coś poszło nie tak
                    </ThemedText>
                    <ThemedText variant="bodyMedium" color="secondary" style={styles.message}>
                        Wystąpił nieoczekiwany błąd. Spróbuj ponownie.
                    </ThemedText>
                    {__DEV__ && this.state.error && (
                        <ThemedText variant="bodySmall" color="tertiary" style={styles.errorDetails}>
                            {this.state.error.message}
                        </ThemedText>
                    )}
                </ThemedView>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        textAlign: 'center',
        lineHeight: 20,
    },
    errorDetails: {
        marginTop: 16,
        fontFamily: 'monospace',
        textAlign: 'center',
    },
});