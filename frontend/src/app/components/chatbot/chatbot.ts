import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
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
export class ChatbotComponent implements OnInit {
  @Input() userType: string = 'SIMPLE';
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

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUserId = user?._id || 'guest';
      this.loadHistory(this.currentUserId);
    });
  }

  private loadHistory(userId: string = 'guest') {
    const key = `otic_chat_history_${this.userType}_${userId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        this.messages = JSON.parse(saved);
        // Convert string dates back to Date objects
        this.messages.forEach(m => m.timestamp = new Date(m.timestamp));
      } catch (e) {
        this.setInitialMessage();
      }
    } else {
      this.setInitialMessage();
    }
  }

  private saveHistory() {
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
    this.saveHistory();
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => this.scrollToBottom(), 100);
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
      console.error(err);
      botMessage.text = 'Désolé, une erreur est survenue lors de la communication avec le serveur.';
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
    const container = document.querySelector('.messages-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
}
