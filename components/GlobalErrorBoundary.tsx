import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    private handleHardReset = () => {
        if (confirm("Se borrarán todos los datos locales para recuperar la aplicación. ¿Continuar?")) {
            localStorage.clear();
            window.location.reload();
        }
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-6 text-center">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full">
                        <span className="material-symbols-outlined text-6xl text-red-500 mb-4 block mx-auto">error</span>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Algo salió mal</h1>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            La aplicación ha encontrado un error crítico. Es probable que los datos guardados estén corruptos.
                        </p>
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-6 text-left overflow-auto max-h-32 text-xs font-mono text-red-600 dark:text-red-400">
                            {this.state.error?.toString()}
                        </div>
                        <button
                            onClick={this.handleHardReset}
                            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">delete_forever</span>
                            Restaurar de Fábrica
                        </button>
                        <p className="mt-4 text-xs text-gray-400">
                            Esto borrará el historial local pero permitirá volver a entrar.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
