import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { apiService } from '../services/api';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (language: string) => Promise<void>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<string>('pt');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Carregar idioma salvo do localStorage ou usar padrão
  useEffect(() => {
    const savedLanguage = localStorage.getItem('userLanguage');
    if (savedLanguage && savedLanguage !== currentLanguage) {
      setCurrentLanguage(savedLanguage);
      i18n.changeLanguage(savedLanguage);
    }
  }, []); // Remover dependência do i18n para evitar re-renders

  const changeLanguage = async (language: string) => {
    try {
      setIsLoading(true);
      
      // Mudar o idioma no i18n
      await i18n.changeLanguage(language);
      setCurrentLanguage(language);
      
      // Salvar no localStorage
      localStorage.setItem('userLanguage', language);
      
      // Salvar no backend se o usuário estiver logado
      try {
        await apiService.updateUserLanguage(language);
      } catch (error) {
        console.warn('Erro ao salvar idioma no servidor:', error);
      }
      
    } catch (error) {
      console.error('Erro ao mudar idioma:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: LanguageContextType = {
    currentLanguage,
    changeLanguage,
    isLoading
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage deve ser usado dentro de um LanguageProvider');
  }
  return context;
}; 