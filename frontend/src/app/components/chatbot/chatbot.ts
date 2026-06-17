import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotService } from '../../services/chatbot.service';
import { AuthService } from '../../services/auth.service';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css'
})
export class ChatbotComponent implements OnInit, OnChanges {
  @Input() userType: string = 'SIMPLE';
  @Input() isHome: boolean = false;
  currentUserId: string = 'guest';

  messages: Message[] = [];
  userInput: string = '';
  isOpen: boolean = false;
  isTyping: boolean = false;

  constructor(
    private chatbotService: ChatbotService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['userType'] || changes['isHome']) {
      this.loadHistory(this.currentUserId);
      this.cdr.detectChanges();
    }
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUserId = user?._id || 'guest';
      console.log('👤 Chatbot User Context:', this.currentUserId);
      this.loadHistory(this.currentUserId);
    });
    // Scroll to bottom after initial load
    setTimeout(() => this.scrollToBottom(), 500);
  }

  private loadHistory(userId: string = 'guest') {
    if (this.isHome) {
      console.log('🏠 Home page: starting fresh chat');
      this.setInitialMessage();
      return;
    }

    const key = `otic_chat_history_${this.userType}_${userId}`;
    const saved = localStorage.getItem(key);
    console.log(`📂 Loading history for key: ${key}, found: ${!!saved}`);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.messages = parsed;
          // Convert string dates back to Date objects
          this.messages.forEach(m => m.timestamp = new Date(m.timestamp));
        } else {
          this.setInitialMessage();
        }
      } catch (e) {
        console.error('Error parsing chat history:', e);
        this.setInitialMessage();
      }
    } else {
      this.setInitialMessage();
    }
    this.cdr.detectChanges();
  }

  private saveHistory() {
    if (this.isHome) return; // Never save history on Home page

    const key = `otic_chat_history_${this.userType}_${this.currentUserId}`;
    localStorage.setItem(key, JSON.stringify(this.messages));
  }

  private setInitialMessage() {
    let greeting = '';
    if (this.userType === 'ADMIN') {
      greeting = "Bonjour Administrateur. Je suis votre Copilote IA. Je peux vous fournir des statistiques en temps réel sur les utilisateurs, les réclamations et l'activité du site. Que souhaitez-vous savoir ?";
    } else if (this.userType === 'TRE') {
      greeting = "Bienvenue ! Je suis votre assistant dédié aux Tunisiens à l'Étranger. Comment puis-je vous aider avec vos démarches ou réclamations depuis l'étranger ?";
    } else {
      greeting = "Bonjour ! Je suis votre assistant OTIC. Comment puis-je vous aider aujourd'hui concernant nos services ou vos réclamations locales ?";
    }

    this.messages = [
      { text: greeting, sender: 'bot', timestamp: new Date() }
    ];
    this.cdr.detectChanges();
    this.saveHistory();
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    console.log('Toggle Chat:', this.isOpen);
    this.cdr.detectChanges();
    if (this.isOpen) {
      setTimeout(() => this.scrollToBottom(), 10);
    }
  }

  clearHistory() {
    if (confirm('Voulez-vous vraiment supprimer tout l\'historique de cette conversation ?')) {
      const key = `otic_chat_history_${this.userType}_${this.currentUserId}`;
      localStorage.removeItem(key);
      this.setInitialMessage();
    }
  }

  sendMessage() {
    if (!this.userInput.trim() || this.isTyping) return;

    const messageToSend = this.userInput;
    this.messages.push({
      text: messageToSend,
      sender: 'user',
      timestamp: new Date()
    });
    this.userInput = '';
    this.isTyping = true;

    // Add a placeholder for the bot's response
    const botMessage: Message = {
      text: '',
      sender: 'bot',
      timestamp: new Date()
    };
    this.messages.push(botMessage);

    const callbackChunk = (chunk: string) => {
      botMessage.text += chunk;
      this.cdr.detectChanges();
      this.scrollToBottom();
    };

    const callbackComplete = () => {
      this.isTyping = false;
      this.saveHistory();
      this.cdr.detectChanges();
      this.scrollToBottom();
    };

    const callbackError = (err: any) => {
      console.error('Chatbot Error Details:', err);
      const errorMsg = typeof err === 'string' ? err : 'Désolé, une erreur est survenue lors de la communication avec le serveur.';
      botMessage.text = errorMsg;
      this.isTyping = false;
      this.saveHistory();
      this.cdr.detectChanges();
      this.scrollToBottom();
    };

    if (this.userType === 'ADMIN') {
      console.log('🤖 Sending ADMIN message...');
      this.chatbotService.sendAdminMessageStream(
        messageToSend,
        callbackChunk,
        callbackComplete,
        callbackError
      );
    } else {
      console.log(`🤖 Sending ${this.userType} message...`);
      this.chatbotService.sendMessageStream(
        messageToSend,
        this.userType,
        callbackChunk,
        callbackComplete,
        callbackError
      );
    }
  }

  private scrollToBottom() {
    setTimeout(() => {
      const container = document.querySelector('.messages-container');
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
  }
}
