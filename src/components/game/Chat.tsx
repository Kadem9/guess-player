'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageCircle, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocketContext } from '@/contexts/SocketContext';

interface ChatMessage {
  userId: string;
  username: string;
  message: string;
  timestamp: string;
}

interface ChatProps {
  gameId: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function Chat({ gameId, isOpen: controlledIsOpen, onToggle }: ChatProps) {
  const { user } = useAuth();
  const { socket, isConnected, emitChatMessage } = useSocketContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isOpen, setIsOpen] = useState(controlledIsOpen ?? false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // scroll vers le bas quand nouveaux messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // écouter messages chat
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleChatMessage = (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    };

    socket.on('chat-message', handleChatMessage);

    return () => {
      socket.off('chat-message', handleChatMessage);
    };
  }, [socket, isConnected]);

  // toggle chat si non contrôlé
  const handleToggle = useCallback(() => {
    if (onToggle) {
      onToggle();
    } else {
      setIsOpen(prev => !prev);
    }
  }, [onToggle]);

  // envoyer message
  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !user) return;

    const message = inputMessage.trim();
    // vérifier que socket est connecté
    if (!socket) {
      alert('Connexion au serveur perdue. Veuillez rafraîchir la page.');
      return;
    }

    if (!isConnected) {
      alert('Connexion au serveur perdue. Veuillez rafraîchir la page.');
      return;
    }

    if (!gameId) {
      alert('Erreur: ID de partie manquant.');
      return;
    }

    emitChatMessage(gameId, user.id, user.username, message);
    setInputMessage('');
  }, [inputMessage, user, socket, gameId, emitChatMessage]);

  // format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const actualIsOpen = controlledIsOpen !== undefined ? controlledIsOpen : isOpen;

  if (!actualIsOpen) {
    return (
      <button
        onClick={handleToggle}
        className="game-chat__toggle"
        aria-label="Ouvrir le chat"
      >
        <MessageCircle className="game-chat__toggle-icon" />
        <span className="game-chat__toggle-badge">{messages.length}</span>
      </button>
    );
  }

  return (
    <div className="game-chat" ref={chatContainerRef}>
      <div className="game-chat__header">
        <div className="game-chat__header-content">
          <MessageCircle className="game-chat__header-icon" />
          <h3 className="game-chat__header-title">Chat</h3>
        </div>
        <button
          onClick={handleToggle}
          className="game-chat__close"
          aria-label="Fermer le chat"
        >
          <X className="game-chat__close-icon" />
        </button>
      </div>

      <div className="game-chat__messages">
        {messages.length === 0 ? (
          <div className="game-chat__empty">
            <MessageCircle className="game-chat__empty-icon" />
            <p className="game-chat__empty-text">Aucun message</p>
            <p className="game-chat__empty-hint">Soyez le premier à écrire !</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwnMessage = msg.userId === user?.id;
            return (
              <div
                key={index}
                className={`game-chat__message ${isOwnMessage ? 'game-chat__message--own' : ''}`}
              >
                <div className="game-chat__message-content">
                  <div className="game-chat__message-header">
                    <span className="game-chat__message-username">
                      {isOwnMessage ? 'Vous' : msg.username}
                    </span>
                    <span className="game-chat__message-time">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <p className="game-chat__message-text">{msg.message}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="game-chat__form">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Tapez votre message..."
          className="game-chat__input"
          maxLength={200}
        />
        <button
          type="submit"
          disabled={!inputMessage.trim()}
          className="game-chat__send"
          aria-label="Envoyer le message"
        >
          <Send className="game-chat__send-icon" />
        </button>
      </form>
    </div>
  );
}
