import { Component, OnInit, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from '../../../../services/message.service';
import { AuthService } from '../../../../services/auth.service';
import { SettingsService } from '../../../../services/settings.service';

@Component({
    selector: 'app-admin-messages',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="mshell-container fade-in" [dir]="settings.currentSettings.language === 'ar' ? 'rtl' : 'ltr'">
        <!-- HEADER -->
        <div class="mshell-main-header mb-4">
            <div class="d-flex align-items-center gap-4">
                <div class="mshell-header-icon bg-gradient-purple">
                    <i class="bi bi-chat-dots-fill text-white"></i>
                </div>
                <div>
                    <h2 class="mshell-title mb-1 text-dark fw-bold">Messagerie Interne</h2>
                    <p class="mshell-subtitle mb-0 text-muted">
                        <i class="bi bi-shield-lock me-1"></i> Communication sécurisée entre administrateurs
                    </p>
                </div>
            </div>
        </div>

        <div class="chat-wrapper shadow-sm">
            <!-- Sidebar: Contacts -->
            <div class="chat-sidebar">
                <div class="chat-sidebar-header">
                    <h5 class="mb-0 fw-bold">Contacts</h5>
                </div>
                <div class="contacts-list">
                    <div *ngIf="loadingContacts" class="p-4 text-center text-muted">
                        <div class="spinner-border spinner-border-sm mb-2"></div><br>Chargement...
                    </div>
                    <div *ngIf="!loadingContacts && contacts.length === 0" class="p-4 text-center text-muted small">
                        Aucun contact disponible.
                    </div>
                    <div *ngFor="let contact of contacts" 
                         class="contact-item" 
                         [class.active]="selectedContact && selectedContact._id === contact._id"
                         [class.unread-status]="contact.unreadCount > 0"
                         (click)="selectContact(contact)">
                        <div class="contact-avatar ms-2 me-3" [style.background]="getAvatarColor(contact.nom)">
                            {{ contact.prenom[0] }}{{ contact.nom[0] }}
                        </div>
                        <div class="contact-info flex-grow-1">
                            <div class="d-flex justify-content-between align-items-center">
                                <div class="fw-bold text-dark">{{ contact.prenom }} {{ contact.nom }}</div>
                                <span *ngIf="contact.unreadCount > 0" class="badge bg-danger rounded-pill pulse-badge">{{ contact.unreadCount }}</span>
                            </div>
                            <div class="small text-muted text-truncate" style="max-width: 150px;" [ngClass]="{'fw-bold text-primary': contact.unreadCount > 0}">
                                <i class="bi bi-tag-fill me-1"></i> 
                                {{ contact.role === 'super_admin' ? 'Super Admin' : (contact.adresse?.ville || 'Admin Régional') }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Chat Area -->
            <div class="chat-main" *ngIf="selectedContact">
                <div class="chat-header">
                    <div class="d-flex align-items-center">
                        <div class="contact-avatar ms-2 me-3" [style.background]="getAvatarColor(selectedContact.nom)">
                            {{ selectedContact.prenom[0] }}{{ selectedContact.nom[0] }}
                        </div>
                        <div>
                            <h5 class="mb-0 fw-bold">{{ selectedContact.prenom }} {{ selectedContact.nom }}</h5>
                            <span class="small text-success"><i class="bi bi-circle-fill me-1" style="font-size: 8px;"></i>En ligne</span>
                        </div>
                    </div>
                </div>

                <div class="chat-messages" #scrollMe>
                    <div *ngIf="loadingMessages" class="text-center p-5 text-muted">
                        <div class="spinner-border text-primary opacity-50"></div>
                    </div>
                    
                    <div *ngIf="!loadingMessages && messages.length === 0" class="text-center p-5 text-muted d-flex flex-column align-items-center justify-content-center h-100">
                        <i class="bi bi-chat-square-text fs-1 opacity-25 mb-3"></i>
                        <p>Démarrez la conversation avec {{ selectedContact.prenom }}</p>
                    </div>

                    <div *ngFor="let msg of messages" class="message-bubble-wrapper" [ngClass]="{'sent': msg.sender === currentUser._id, 'received': msg.sender !== currentUser._id}">
                        <div class="message-bubble shadow-sm" [ngClass]="{'bg-primary text-white': msg.sender === currentUser._id, 'bg-white border': msg.sender !== currentUser._id}">
                            {{ msg.content }}
                            <div class="message-time mt-1 text-end" [ngClass]="{'text-white-50': msg.sender === currentUser._id, 'text-muted': msg.sender !== currentUser._id}">
                                {{ msg.dateCreation | date:'HH:mm' }}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="chat-input-area">
                    <form (ngSubmit)="sendMessage()" class="d-flex gap-2">
                        <input type="text" class="form-control mshell-input" placeholder="Écrivez votre message..." 
                               [(ngModel)]="newMessage" name="newMessage" autocomplete="off" required>
                        <button type="submit" class="btn btn-primary send-btn shadow-sm" [disabled]="!newMessage.trim() || sending">
                            <i class="bi" [ngClass]="sending ? 'bi-hourglass-split' : 'bi-send-fill'"></i>
                        </button>
                    </form>
                </div>
            </div>
            
            <!-- Empty State when no contact selected -->
            <div class="chat-main empty-state d-flex flex-column align-items-center justify-content-center" *ngIf="!selectedContact">
                <i class="bi bi-chat-dots text-muted opacity-25 mb-3" style="font-size: 4rem;"></i>
                <h4 class="text-muted fw-light">Sélectionnez un contact pour commencer</h4>
            </div>
        </div>
    </div>
    `,
    styles: [`
        .mshell-container { padding: 30px; font-family: 'Outfit', sans-serif; background: #f8fafc; min-height: 100vh; }
        .bg-gradient-purple { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
        .mshell-header-icon { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3); }
        .mshell-title { font-size: 1.75rem; letter-spacing: -0.02em; }
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .chat-wrapper {
            display: flex;
            height: calc(100vh - 160px);
            background: #fff;
            border-radius: 20px;
            border: 1px solid #e2e8f0;
            overflow: hidden;
            min-height: 500px;
        }

        /* SIDEBAR */
        .chat-sidebar {
            width: 320px;
            border-right: 1px solid #e2e8f0;
            display: flex;
            flex-direction: column;
            background: #f8fafc;
        }
        .chat-sidebar-header {
            padding: 20px;
            border-bottom: 1px solid #e2e8f0;
            background: #fff;
        }
        .contacts-list {
            flex: 1;
            overflow-y: auto;
        }
        .contact-item {
            display: flex;
            padding: 15px 20px;
            border-bottom: 1px solid #f1f5f9;
            cursor: pointer;
            transition: all 0.2s;
            align-items: center;
        }
        .contact-item:hover { background: #f1f5f9; }
        .contact-item.active { background: #eff6ff; border-right: 4px solid #2563eb; }
        .contact-item.unread-status { background: #f0fdf4; }
        [dir="rtl"] .contact-item.active { border-right: none; border-left: 4px solid #2563eb; }
        .contact-avatar {
            width: 42px; height: 42px; border-radius: 12px; color: #fff; font-weight: bold;
            display: flex; align-items: center; justify-content: center; text-transform: uppercase;
        }

        /* MAIN CHAT */
        .chat-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: #f1f5f9;
        }
        .chat-header {
            padding: 15px 25px;
            background: #fff;
            border-bottom: 1px solid #e2e8f0;
        }
        .chat-messages {
            flex: 1;
            padding: 25px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .message-bubble-wrapper {
            display: flex;
            width: 100%;
        }
        .message-bubble-wrapper.sent { justify-content: flex-end; }
        .message-bubble-wrapper.received { justify-content: flex-start; }
        
        .message-bubble {
            max-width: 65%;
            padding: 12px 16px;
            border-radius: 16px;
            font-size: 0.95rem;
            line-height: 1.4;
            position: relative;
        }
        .sent .message-bubble { border-bottom-right-radius: 4px; }
        .received .message-bubble { border-bottom-left-radius: 4px; }
        .message-time { font-size: 0.65rem; }

        .chat-input-area {
            padding: 20px 25px;
            background: #fff;
            border-top: 1px solid #e2e8f0;
        }
        .mshell-input { border-radius: 24px; padding: 12px 20px; border: 1px solid #e2e8f0; background: #f8fafc; }
        .mshell-input:focus { box-shadow: none; border-color: #2563eb; background: #fff; }
        .send-btn { border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; }

        .pulse-badge {
            animation: pulse-red-msg 2s infinite;
        }

        @keyframes pulse-red-msg {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(220, 53, 69, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
        }
    `]
})
export class MessagesComponent implements OnInit, AfterViewChecked {
    @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

    contacts: any[] = [];
    messages: any[] = [];
    selectedContact: any = null;
    currentUser: any = null;

    loadingContacts = true;
    loadingMessages = false;
    sending = false;
    newMessage = '';

    private conversationsCache: { [userId: string]: any[] } = {};
    private refreshInterval: any;

    constructor(
        private msgService: MessageService,
        private authService: AuthService,
        public settings: SettingsService
    ) { }

    ngOnInit() {
        const cached = localStorage.getItem('otic_admin_messages_contacts');
        if (cached) {
            try {
                this.contacts = JSON.parse(cached);
                this.loadingContacts = false;
            } catch (e) { }
        }

        this.authService.currentUser$.subscribe(u => {
            if (u) {
                this.currentUser = u;
                this.loadContacts();
            }
        });

        // Auto-refresh every 10 seconds: both chat history and contact list (badges/sorting)
        this.refreshInterval = setInterval(() => {
            if (this.currentUser) {
                this.loadContacts();
                if (this.selectedContact) {
                    this.loadMessages(this.selectedContact._id, false);
                }
            }
        }, 10000);
    }

    ngOnDestroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }

    ngAfterViewChecked() {
        // Need to wait for DOM to update before scrolling, but handled manually where needed
    }

    scrollToBottom(): void {
        try {
            setTimeout(() => {
                this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
            }, 50);
        } catch (err) { }
    }

    loadContacts() {
        if (!this.currentUser) return;
        if (this.contacts.length === 0) {
            this.loadingContacts = true;
        }
        this.msgService.getContacts().subscribe({
            next: (data) => {
                this.contacts = data;
                localStorage.setItem('otic_admin_messages_contacts', JSON.stringify(this.contacts));
                this.loadingContacts = false;

                // PRE-FETCH all conversations in background to allow "sans chargement" switching
                this.contacts.forEach(contact => {
                    this.preloadConversation(contact._id);
                });
            },
            error: (err) => {
                console.error(err);
                this.loadingContacts = false;
            }
        });
    }

    preloadConversation(userId: string) {
        // Try filling memory cache from localStorage if available first
        const cacheKey = 'otic_admin_chat_' + userId;
        if (!this.conversationsCache[userId]) {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                try {
                    this.conversationsCache[userId] = JSON.parse(cached);
                } catch (e) { }
            }
        }

        // Fetch from server to keep it updated, but skip loading UI
        this.msgService.getConversation(userId).subscribe({
            next: (data) => {
                this.conversationsCache[userId] = data;
                localStorage.setItem(cacheKey, JSON.stringify(data));

                // If this is the currently selected contact, update the view too
                if (this.selectedContact && this.selectedContact._id === userId) {
                    this.messages = data;
                }
            }
        });
    }

    selectContact(contact: any) {
        this.selectedContact = contact;
        // Optimistically clear the unread badge for UI responsiveness
        contact.unreadCount = 0;
        localStorage.setItem('otic_admin_messages_contacts', JSON.stringify(this.contacts));

        // 1. Check memory cache first (FASTER)
        if (this.conversationsCache[contact._id]) {
            this.messages = this.conversationsCache[contact._id];
            this.loadingMessages = false;
            this.scrollToBottom();
        }
        // 2. Check localStorage if memory cache misses
        else {
            const cacheKey = 'otic_admin_chat_' + contact._id;
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                try {
                    this.messages = JSON.parse(cached);
                    this.conversationsCache[contact._id] = this.messages;
                    this.loadingMessages = false;
                    this.scrollToBottom();
                } catch (e) {
                    this.messages = [];
                    this.loadingMessages = true;
                }
            } else {
                this.messages = [];
                this.loadingMessages = true;
            }
        }

        // 3. Always refresh from server in background
        this.loadMessages(contact._id, this.messages.length === 0);
    }

    loadMessages(userId: string, scroll: boolean = true) {
        if (!this.currentUser) return;
        this.msgService.getConversation(userId).subscribe({
            next: (data) => {
                const cacheKey = 'otic_admin_chat_' + userId;
                this.messages = data;
                this.conversationsCache[userId] = data; // Keep RAM cache updated
                localStorage.setItem(cacheKey, JSON.stringify(data));
                this.loadingMessages = false;
                if (scroll) this.scrollToBottom();
            },
            error: (err) => {
                console.error(err);
                this.loadingMessages = false;
            }
        });
    }

    sendMessage() {
        if (!this.newMessage.trim() || !this.selectedContact) return;

        const pushMsg = this.newMessage;
        this.newMessage = ''; // clear input immediately 

        // Optimistic UI: display immediately
        const tempId = 'temp-' + Date.now();
        const tempMessage = {
            _id: tempId,
            content: pushMsg,
            sender: this.currentUser._id,
            receiver: this.selectedContact._id,
            dateCreation: new Date().toISOString(),
            read: false,
            isTemp: true
        };

        this.messages.push(tempMessage);
        this.conversationsCache[this.selectedContact._id] = this.messages; // Update memory cache
        this.scrollToBottom();

        // Move contact to the top of the sidebar list
        const contactIndex = this.contacts.findIndex(c => c._id === this.selectedContact._id);
        if (contactIndex > -1) {
            const [contact] = this.contacts.splice(contactIndex, 1);
            this.contacts.unshift(contact);
            localStorage.setItem('otic_admin_messages_contacts', JSON.stringify(this.contacts));
        }

        // Save optimistic state to cache
        const cacheKey = 'otic_admin_chat_' + this.selectedContact._id;
        localStorage.setItem(cacheKey, JSON.stringify(this.messages));

        this.msgService.sendMessage(this.selectedContact._id, pushMsg).subscribe({
            next: (msg) => {
                // Replace temp message with real one from DB
                this.messages = this.messages.map(m => m._id === tempId ? msg : m);
                this.conversationsCache[this.selectedContact._id] = this.messages;
                localStorage.setItem(cacheKey, JSON.stringify(this.messages));
            },
            error: (err) => {
                console.error(err);
                // Revert if error
                this.messages = this.messages.filter(m => m._id !== tempId);
                this.conversationsCache[this.selectedContact._id] = this.messages;
                this.newMessage = pushMsg;
                localStorage.setItem(cacheKey, JSON.stringify(this.messages));
            }
        });
    }

    getAvatarColor(name: string): string {
        const h = name ? (name.charCodeAt(0) * 15 % 360) : 200;
        return `hsl(${h}, 70%, 65%)`;
    }
}
