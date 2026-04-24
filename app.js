(function () {
  const STORAGE_KEY = 'minigram_state_v1';

  const defaultAvatar = (seed) => {
    const colors = ['#3390ec', '#e91e63', '#9c27b0', '#4caf50', '#ff9800', '#795548', '#00bcd4', '#f44336'];
    const c = colors[Math.abs(hash(seed)) % colors.length];
    const letter = (seed || '?').trim().charAt(0).toUpperCase() || '?';
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'>
      <rect width='100%' height='100%' fill='${c}'/>
      <text x='50%' y='54%' font-size='48' font-family='sans-serif' fill='white'
            text-anchor='middle' dominant-baseline='middle' font-weight='600'>${escapeXml(letter)}</text>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  };

  function escapeXml(s) {
    return String(s).replace(/[<>&'"]/g, (c) => ({ '<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[c]));
  }

  function hash(s) {
    let h = 0;
    for (let i = 0; i < (s || '').length; i++) h = (h << 5) - h + s.charCodeAt(i);
    return h;
  }

  // ---------- State ----------
  let state = loadState();
  function ensureProfileState() {
    state.profile = state.profile || {};
    if (typeof state.profile.nick !== 'string') state.profile.nick = '';
    if (typeof state.profile.avatar !== 'string') state.profile.avatar = '';
    if (typeof state.profile.about !== 'string') state.profile.about = '';
    if (typeof state.profile.password !== 'string') state.profile.password = '';
    if (typeof state.profile.storyAudience !== 'string') state.profile.storyAudience = 'contacts';
    if (typeof state.profile.storyAllowScreenshots !== 'boolean') state.profile.storyAllowScreenshots = true;
    if (typeof state.profile.storyPublishToProfile !== 'boolean') state.profile.storyPublishToProfile = true;
    if (!Array.isArray(state.profile.storyCloseFriends)) state.profile.storyCloseFriends = [];
    if (!Array.isArray(state.profile.storySelectedUsers)) state.profile.storySelectedUsers = [];
  }
  function ensureVisualState() {
    if (typeof state.themePreset !== 'string') state.themePreset = 'telegram';
    if (typeof state.bubbleStyle !== 'string') state.bubbleStyle = 'soft';
    if (typeof state.chatBgMode !== 'string') state.chatBgMode = 'default';
    if (typeof state.chatBgImage !== 'string') state.chatBgImage = '';
  }
  function ensureLocalizationState() {
    if (typeof state.language !== 'string') state.language = 'ru';
    if (state.language !== 'ru' && state.language !== 'en-US') state.language = 'ru';
  }
  function ensureAuthState() {
    state.auth = state.auth || {};
    if (typeof state.auth.loggedOut !== 'boolean') state.auth.loggedOut = false;
  }
  ensureProfileState();
  ensureVisualState();
  ensureLocalizationState();
  ensureAuthState();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch(e){}
    return { profile:{nick:'', avatar:'', about:'', password:'', storyAudience:'contacts', storyAllowScreenshots:true, storyPublishToProfile:true}, auth:{loggedOut:false}, contacts:[], chats:{}, language:'ru', theme:'dark', themePreset:'telegram', bubbleStyle:'soft', chatBgMode:'default', chatBgImage:'', autoReply:true, sound:true };
  }

  function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

  // ---------- DOM ----------
  const $ = s => document.querySelector(s);
  const tabs = document.querySelectorAll('.tab');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const meAvatarEl = $('#meAvatar');
  const meNickEl = $('#meNick');
  const contactsListEl = $('#contactsList');
  const chatsListEl = $('#chatsList');
  const chatsEmptyEl = $('#chatsEmpty');
  const settingsAvatarEl = $('#settingsAvatar');
  const avatarInputEl = $('#avatarInput');
  const nickInputEl = $('#nickInput');
  const aboutInputEl = $('#aboutInput');
  const profileIdValueEl = $('#profileIdValue');
  const profilePasswordInputEl = $('#profilePasswordInput');
  const saveProfileBtn = $('#saveProfileBtn');
  const logoutBtn = $('#logoutBtn');
  const profileSavedEl = $('#profileSaved');
  const addContactBtn = $('#addContactBtn');
  const contactModal = $('#contactModal');
  const newContactName = $('#newContactName');
  const newContactAvatar = $('#newContactAvatar');
  const cancelContactBtn = $('#cancelContactBtn');
  const createContactBtn = $('#createContactBtn');
  const chatOverlay = $('#chatOverlay');
  const closeChatBtn = $('#closeChatBtn');
  const chatAvatar = $('#chatAvatar');
  const chatName = $('#chatName');
  const messagesBox = $('#messagesBox');
  const messageForm = $('#messageForm');
  const messageInput = $('#messageInput');
  const themeModeToggle = $('#themeModeToggle');
  const themePresetBtns = document.querySelectorAll('.theme-preset-btn');
  const bubbleStyleBtns = document.querySelectorAll('.bubble-style-btn');
  const chatBgBtns = document.querySelectorAll('.chat-bg-btn');
  const chatBgUploadInput = $('#chatBgUploadInput');
  const chatBgResetBtn = $('#chatBgResetBtn');
  const emojiBtn = $('#emojiBtn');
  const emojiPicker = $('#emojiPicker');
  let activeChatId = null;
  let pendingNewContactAvatar = '';
  let contactsQuery = '';
  let chatsQuery = '';
  let showHidden = false;
  const contactsSearchEl = $('#contactsSearch');
  const chatsSearchEl = $('#chatsSearch');
  const toggleHiddenBtn = $('#toggleHiddenBtn');
  const replyBar = $('#replyBar');
  const cancelReplyBtn = $('#cancelReplyBtn');
  const imagePreview = $('#imagePreview');
  const imagePreviewImg = $('#imagePreviewImg');
  const cancelImageBtn = $('#cancelImageBtn');
  const attachInput = $('#attachInput');
  let pendingReply = null;
  let pendingImage = null;
  let typingTimer = null;
  let typingEl = null;
  const autoReplyToggle = $('#autoReplyToggle');
  const soundToggle = $('#soundToggle');
  const chatsTabBadge = $('#chatsTabBadge');
  const toastBox = $('#toastBox');
  const chatSearchBtn = $('#chatSearchBtn');
  const chatSearchBar = $('#chatSearchBar');
  const chatSearchInput = $('#chatSearchInput');
  const chatSearchCount = $('#chatSearchCount');
  const chatSearchPrev = $('#chatSearchPrev');
  const chatSearchNext = $('#chatSearchNext');
  const chatSearchClose = $('#chatSearchClose');
  const pinnedBar = $('#pinnedBar');
  const unpinBtn = $('#unpinBtn');
  const forwardModal = $('#forwardModal');
  const forwardPreview = $('#forwardPreview');
  const forwardSearch = $('#forwardSearch');
  const forwardList = $('#forwardList');
  const cancelForwardBtn = $('#cancelForwardBtn');
  const exportDataBtn = $('#exportDataBtn');
  const importDataInput = $('#importDataInput');
  const dataMsg = $('#dataMsg');
  const authOverlay = $('#authOverlay');
  const authTitle = $('#authTitle');
  const authSubtitle = $('#authSubtitle');
  const authNickInput = $('#authNickInput');
  const authPasswordField = $('#authPasswordField');
  const authPasswordInput = $('#authPasswordInput');
  const authError = $('#authError');
  const authContinueBtn = $('#authContinueBtn');
  const settingsMainView = $('#settingsMainView');
  const settingsAppearanceView = $('#settingsAppearanceView');
  const settingsLanguageView = $('#settingsLanguageView');
  const settingsProfileView = $('#settingsProfileView');
  const settingsStoriesView = $('#settingsStoriesView');
  const appearanceBackBtn = $('#appearanceBackBtn');
  const languageBackBtn = $('#languageBackBtn');
  const profileBackBtn = $('#profileBackBtn');
  const storiesBackBtn = $('#storiesBackBtn');
  const myStoriesListEl = $('#myStoriesList');
  const openAllMyStoriesBtn = $('#openAllMyStoriesBtn');
  const storiesAllowScreenshotsToggle = $('#storiesAllowScreenshotsToggle');
  const storiesPublishProfileToggle = $('#storiesPublishProfileToggle');
  const editCloseFriendsBtn = $('#editCloseFriendsBtn');
  const editSelectedUsersBtn = $('#editSelectedUsersBtn');
  const storiesAudienceModal = $('#storiesAudienceModal');
  const storiesAudienceModalTitle = $('#storiesAudienceModalTitle');
  const storiesAudienceSearch = $('#storiesAudienceSearch');
  const storiesAudienceList = $('#storiesAudienceList');
  const cancelStoriesAudienceBtn = $('#cancelStoriesAudienceBtn');
  const saveStoriesAudienceBtn = $('#saveStoriesAudienceBtn');
  const langRuToggle = $('#langRuToggle');
  const langEnToggle = $('#langEnToggle');
  let chatSearchQuery = '';
  let chatSearchHits = [];
  let chatSearchCurrent = 0;
  let pendingForward = null;
  let forwardQuery = '';

  // Stories
  const storiesItems = $('#storiesItems');
  const addStoryBtn = $('#addStoryBtn');
  const storyComposer = $('#storyComposer');
  const storyComposerText = $('#storyComposerText');
  const storyImageInput = $('#storyImageInput');
  const storyComposerPreview = $('#storyComposerPreview');
  const storyCancelBtn = $('#storyCancelBtn');
  const storyPublishBtn = $('#storyPublishBtn');
  const storyViewer = $('#storyViewer');
  const storyProgress = $('#storyProgress');
  const storyAvatar = $('#storyAvatar');
  const storyAuthor = $('#storyAuthor');
  const storyTime = $('#storyTime');
  const storyImage = $('#storyImage');
  const storyTextEl = $('#storyText');
  const storyCloseBtn = $('#storyCloseBtn');
  const storyDeleteBtn = $('#storyDeleteBtn');
  const storyPrev = $('#storyPrev');
  const storyNext = $('#storyNext');
  let storyComposerImage = '';
  let storyQueue = [];
  let storyCurIdx = 0;
  let storyTimer = null;
  let storyStart = 0;
  let storiesAudienceMode = null;
  let storiesAudienceDraft = [];

  // Voice
  const micBtn = $('#micBtn');
  const recordingBar = $('#recordingBar');
  const recordingTimer = $('#recordingTimer');
  const recordCancelBtn = $('#recordCancelBtn');
  const recordStopBtn = $('#recordStopBtn');
  let mediaRecorder = null;
  let recChunks = [];
  let recStart = 0;
  let recTickInt = null;

  // Profile modal
  const profileModal = $('#profileModal');
  const profileCloseBtn = $('#profileCloseBtn');
  const profileAvatar = $('#profileAvatar');
  const profileName = $('#profileName');
  const profileStatus = $('#profileStatus');
  const profileMsgCount = $('#profileMsgCount');
  const profilePhotoCount = $('#profilePhotoCount');
  const profileAudioCount = $('#profileAudioCount');
  const profilePinBtn = $('#profilePinBtn');
  const profileMuteBtn = $('#profileMuteBtn');
  const profileArchiveBtn = $('#profileArchiveBtn');
  const profileClearBtn = $('#profileClearBtn');
  const profileDeleteBtn = $('#profileDeleteBtn');
  let profileContactId = null;

  const TRANSLATIONS = {
    ru: {
      tabContacts: 'Контакты',
      tabChats: 'Чаты',
      tabSettings: 'Настройки',
      addContact: '+ Добавить',
      searchContacts: '🔍 Поиск контактов...',
      sectionChats: 'Чаты',
      archive: '📦 Архив',
      searchChats: '🔍 Поиск по чатам и сообщениям...',
      welcomeTitle: 'Добро пожаловать в Convu',
      welcomeTagline: 'Лёгкие разговоры, которые остаются с вами.',
      welcomeHint: 'Перейдите во вкладку «Контакты» и начните первый диалог.',
      settings: 'Настройки',
      myProfile: '👤 Мой профиль',
      myStories: '📖 Мои истории',
      fav: '⭐ Избранные сообщения',
      theme: '🎨 Оформление',
      lang: '🌐 Язык',
      help: '❓ Помощь',
      autoReply: 'Имитация автоответа',
      sound: 'Звук уведомлений',
      backup: 'Резервная копия данных',
      export: '⤓ Экспорт',
      import: '⤒ Импорт',
      appearance: 'Оформление',
      darkTheme: 'Тёмная тема',
      telegramThemes: 'Темы Telegram-стиля',
      bubbleStyle: 'Стиль пузырей',
      chatBg: 'Фон чата',
      customBg: '🖼 Свой фон',
      resetBg: 'Сбросить',
      language: 'Язык',
      russian: 'Русский',
      english: 'English (US)',
      emptyChatTitle: 'Пустой чат',
      emptyChatText: 'Начните разговор первым — оно сразу оживит диалог.',
      emptyChatAction: 'Написать сообщение',
      writeToContact: 'Написать {name}...',
      messagePlaceholder: 'Сообщение...',
      profile: 'Мой профиль',
      uploadAvatar: 'Загрузить аватар',
      username: 'Имя пользователя (ID)',
      about: 'О себе',
      password: 'Пароль аккаунта',
      save: 'Сохранить',
      logout: 'Выйти из аккаунта',
      back: '← Назад'
    },
    'en-US': {
      tabContacts: 'Contacts',
      tabChats: 'Chats',
      tabSettings: 'Settings',
      addContact: '+ Add',
      searchContacts: '🔍 Search contacts...',
      sectionChats: 'Chats',
      archive: '📦 Archive',
      searchChats: '🔍 Search chats and messages...',
      welcomeTitle: 'Welcome to Convu',
      welcomeTagline: 'Light conversations that stay with you.',
      welcomeHint: 'Open the Contacts tab and start your first chat.',
      settings: 'Settings',
      myProfile: '👤 My profile',
      myStories: '📖 My stories',
      fav: '⭐ Favorite messages',
      theme: '🎨 Appearance',
      lang: '🌐 Language',
      help: '❓ Help',
      autoReply: 'Auto-reply simulation',
      sound: 'Notification sound',
      backup: 'Data backup',
      export: '⤓ Export',
      import: '⤒ Import',
      appearance: 'Appearance',
      darkTheme: 'Dark theme',
      telegramThemes: 'Telegram-style themes',
      bubbleStyle: 'Bubble style',
      chatBg: 'Chat background',
      customBg: '🖼 Custom background',
      resetBg: 'Reset',
      language: 'Language',
      russian: 'Russian',
      english: 'English (US)',
      emptyChatTitle: 'Empty chat',
      emptyChatText: 'Start the conversation first — it brings the chat to life.',
      emptyChatAction: 'Send a message',
      writeToContact: 'Write to {name}...',
      messagePlaceholder: 'Message...',
      profile: 'My profile',
      uploadAvatar: 'Upload avatar',
      username: 'Username (ID)',
      about: 'About me',
      password: 'Account password',
      save: 'Save',
      logout: 'Log out',
      back: '← Back'
    }
  };

  function updateMessagePlaceholder(contactName) {
    const dict = TRANSLATIONS[state.language] || TRANSLATIONS.ru;
    if (!messageInput) return;
    if (contactName) {
      messageInput.placeholder = dict.writeToContact.replace('{name}', contactName);
    } else {
      messageInput.placeholder = dict.messagePlaceholder;
    }
  }

  function applyLanguageTexts() {
    const dict = TRANSLATIONS[state.language] || TRANSLATIONS.ru;
    document.documentElement.lang = state.language;

    const setText = (el, value) => {
      if (!el) return;
      el.textContent = value;
    };
    const setPlaceholder = (el, value) => {
      if (!el) return;
      el.placeholder = value;
    };
    const setTitle = (el, value) => {
      if (!el) return;
      el.title = value;
    };
    const setLabelText = (labelEl, value) => {
      if (!labelEl) return;
      const textNode = Array.from(labelEl.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
      if (textNode) {
        textNode.textContent = value;
      } else {
        labelEl.appendChild(document.createTextNode(value));
      }
    };

    setText(document.querySelector('.tabs .tab-btn[data-tab="contacts"] span:last-child'), dict.tabContacts);
    setText(document.querySelector('.tabs .tab-btn[data-tab="chats"] span:last-child'), dict.tabChats);
    setText(document.querySelector('.tabs .tab-btn[data-tab="settings"] span:last-child'), dict.tabSettings);
    setText($('#tab-contacts .section-head h2'), dict.tabContacts);
    setText($('#tab-chats .section-head h2'), dict.sectionChats);
    setText($('#tab-settings .section-head h2'), dict.settings);
    setText(addContactBtn, dict.addContact);
    setPlaceholder(contactsSearchEl, dict.searchContacts);
    setText(toggleHiddenBtn, dict.archive);
    setPlaceholder(chatsSearchEl, dict.searchChats);
    setText(document.querySelector('.welcome-title'), dict.welcomeTitle);
    setText(document.querySelector('.welcome-tagline'), dict.welcomeTagline);
    setText(document.querySelector('.welcome-hint'), dict.welcomeHint);
    setText(myProfileBtn, dict.myProfile);
    setText(myStoriesBtn, dict.myStories);
    setText(favBtn, dict.fav);
    setText(themeBtn, dict.theme);
    setText(langBtn, dict.lang);
    setText(helpBtn, dict.help);
    setText(autoReplyToggle.closest('label')?.querySelector('span'), dict.autoReply);
    setText(soundToggle.closest('label')?.querySelector('span'), dict.sound);
    setText(document.querySelector('.data-row-title'), dict.backup);
    setText(exportDataBtn, dict.export);
    setLabelText(importDataInput.closest('label'), dict.import);
    setText(document.querySelector('#settingsAppearanceView .settings-sub-title'), dict.appearance);
    setText(appearanceBackBtn, dict.back);
    setText(document.querySelector('#settingsLanguageView .settings-sub-title'), dict.language);
    setText(languageBackBtn, dict.back);
    setText(langRuToggle.closest('label')?.querySelector('span'), dict.russian);
    setText(langEnToggle.closest('label')?.querySelector('span'), dict.english);
    setText(profileBackBtn, dict.back);
    setText(document.querySelector('#settingsProfileView .settings-sub-title'), dict.profile);
    setLabelText(settingsAvatarEl?.closest('.settings-avatar')?.querySelector('label'), dict.uploadAvatar);
    setText(document.querySelector('#settingsProfileView label.field:nth-of-type(1) span'), dict.username);
    setText(document.querySelector('#settingsProfileView label.field:nth-of-type(2) span'), dict.about);
    setText(document.querySelector('#settingsProfileView label.field:nth-of-type(3) span'), dict.password);
    setText(saveProfileBtn, dict.save);
    setText(logoutBtn, dict.logout);
    updateMessagePlaceholder(activeChatId ? (state.contacts.find(x => x.id === activeChatId) || {}).name : '');
    if (activeChatId && !chatOverlay.classList.contains('hidden')) renderMessages();
  }

  // Scroll down
  const scrollDownBtn = $('#scrollDownBtn');
  const scrollDownBadge = $('#scrollDownBadge');
  let unseenWhileScrolledUp = 0;

  const SAVED_ID = '__saved__';

  const EMOJIS = ['😀','😂','😍','🥰','😎','🤔','😏','😢','😭','😡','🥳','🤯','😴','🤤','🤩','😘','😉','😜','🤗','🙄','😬','🤐','🤫','😇','🤠','🥺','😤','🤬','🥶','🥵','😱','🤡','💩','👻','🎃','👍','👎','👌','✌️','🤞','🤝','🙏','💪','🔥','⭐','✨','💯','❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','💖','🎉','🎁','🌹','🌸','🍕','🍔','☕','🍺','🚀','⚽','🎮','📱','💻','🎵','📷'];
  const REACTIONS = ['❤️','👍','😂','😮','😢','🔥'];

  // ---------- Theme ----------
  function previewChatBackground(mode) {
    document.documentElement.setAttribute('data-chat-bg', mode || (state.chatBgMode || 'default'));
  }
  function applyTheme() {
    const theme = state.theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    if (themeModeToggle) themeModeToggle.checked = theme === 'dark';
    const preset = state.themePreset || 'telegram';
    const bubbleStyle = state.bubbleStyle || 'soft';
    const chatBgMode = state.chatBgMode || 'default';
    document.documentElement.setAttribute('data-theme-preset', preset);
    document.documentElement.setAttribute('data-bubble-style', bubbleStyle);
    document.documentElement.setAttribute('data-chat-bg', chatBgMode);
    document.documentElement.style.setProperty('--chat-custom-image', state.chatBgImage ? `url("${state.chatBgImage}")` : 'none');
    themePresetBtns.forEach(b => b.classList.toggle('active', b.dataset.themePreset === preset));
    bubbleStyleBtns.forEach(b => b.classList.toggle('active', b.dataset.bubbleStyle === bubbleStyle));
    chatBgBtns.forEach(b => b.classList.toggle('active', b.dataset.chatBg === chatBgMode));
  }
  if (themeModeToggle) {
    themeModeToggle.addEventListener('change', () => {
      state.theme = themeModeToggle.checked ? 'dark' : 'light';
      saveState();
      applyTheme();
    });
  }
  themePresetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      state.themePreset = btn.dataset.themePreset || 'telegram';
      saveState();
      applyTheme();
    });
  });
  bubbleStyleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      state.bubbleStyle = btn.dataset.bubbleStyle || 'soft';
      saveState();
      applyTheme();
    });
  });
  chatBgBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      state.chatBgMode = btn.dataset.chatBg || 'default';
      saveState();
      applyTheme();
    });
    btn.addEventListener('mouseenter', () => {
      previewChatBackground(btn.dataset.chatBg || 'default');
    });
    btn.addEventListener('mouseleave', () => {
      previewChatBackground();
    });
    btn.addEventListener('focus', () => {
      previewChatBackground(btn.dataset.chatBg || 'default');
    });
    btn.addEventListener('blur', () => {
      previewChatBackground();
    });
  });
  if (chatBgUploadInput) {
    chatBgUploadInput.addEventListener('change', e => {
      const file = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!file) return;
      fileToDataUrl(file).then((url) => {
        state.chatBgImage = url;
        state.chatBgMode = 'image';
        saveState();
        applyTheme();
      });
    });
  }
  if (chatBgResetBtn) {
    chatBgResetBtn.addEventListener('click', () => {
      state.chatBgImage = '';
      state.chatBgMode = 'default';
      saveState();
      applyTheme();
    });
  }
  applyTheme();

  // ---------- Emoji picker ----------
  EMOJIS.forEach(e => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = e;
    b.addEventListener('click', () => {
      insertAtCursor(messageInput, e);
      messageInput.focus();
    });
    emojiPicker.appendChild(b);
  });

  function insertAtCursor(input, text) {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    input.value = input.value.slice(0, start) + text + input.value.slice(end);
    const pos = start + text.length;
    input.setSelectionRange(pos, pos);
  }

  emojiBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    emojiPicker.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!emojiPicker.classList.contains('hidden')
        && !emojiPicker.contains(e.target)
        && e.target !== emojiBtn) {
      emojiPicker.classList.add('hidden');
    }
    closeReactionPopover();
  });

  // ---------- Reactions popover ----------
  let reactionPopover = null;
  function closeReactionPopover() {
    if (reactionPopover) { reactionPopover.remove(); reactionPopover = null; }
  }
  const favMenuBtn = document.getElementById('favBtn');
  const myProfileBtn = document.getElementById('myProfileBtn');
  const myStoriesBtn = document.getElementById('myStoriesBtn');
  const themeMenuBtn = document.getElementById('themeBtn');
  const langMenuBtn = document.getElementById('langBtn');
  const helpMenuBtn = document.getElementById('helpBtn');
  function openMyProfileSettings() {
    if (!settingsMainView || !settingsProfileView) return;
    tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === 'settings'));
    tabs.forEach(t => t.classList.toggle('active', t.id === 'tab-settings'));
    settingsMainView.classList.add('hidden-view');
    settingsProfileView.classList.remove('hidden-view');
  }
  if (favMenuBtn) {
    favMenuBtn.onclick = () => {
      ensureSavedContact();
      openChat(SAVED_ID);
    };
  }
  if (myProfileBtn && settingsMainView && settingsProfileView) {
    myProfileBtn.onclick = () => openMyProfileSettings();
  }
  if (meAvatarEl) meAvatarEl.addEventListener('click', openMyProfileSettings);
  if (meNickEl) meNickEl.addEventListener('click', openMyProfileSettings);
  if (myStoriesBtn && settingsMainView && settingsStoriesView) {
    myStoriesBtn.onclick = () => {
      settingsMainView.classList.add('hidden-view');
      settingsStoriesView.classList.remove('hidden-view');
      renderMyStoriesSettings();
    };
  }
  if (themeMenuBtn && settingsMainView && settingsAppearanceView) {
    themeMenuBtn.onclick = () => {
      settingsMainView.classList.add('hidden-view');
      settingsAppearanceView.classList.remove('hidden-view');
    };
  }
  if (appearanceBackBtn && settingsMainView && settingsAppearanceView) {
    appearanceBackBtn.onclick = () => {
      settingsAppearanceView.classList.add('hidden-view');
      settingsMainView.classList.remove('hidden-view');
    };
  }
  if (profileBackBtn && settingsMainView && settingsProfileView) {
    profileBackBtn.onclick = () => {
      settingsProfileView.classList.add('hidden-view');
      settingsMainView.classList.remove('hidden-view');
    };
  }
  if (storiesBackBtn && settingsMainView && settingsStoriesView) {
    storiesBackBtn.onclick = () => {
      settingsStoriesView.classList.add('hidden-view');
      settingsMainView.classList.remove('hidden-view');
    };
  }
  function renderLanguageSettings() {
    if (langRuToggle) langRuToggle.checked = state.language === 'ru';
    if (langEnToggle) langEnToggle.checked = state.language === 'en-US';
    applyLanguageTexts();
  }
  function setLanguage(code) {
    state.language = code === 'en-US' ? 'en-US' : 'ru';
    saveState();
    renderLanguageSettings();
  }
  if (langMenuBtn) {
    langMenuBtn.onclick = () => {
      if (!settingsMainView || !settingsLanguageView) return;
      settingsMainView.classList.add('hidden-view');
      settingsLanguageView.classList.remove('hidden-view');
      renderLanguageSettings();
    };
  }
  if (languageBackBtn && settingsMainView && settingsLanguageView) {
    languageBackBtn.onclick = () => {
      settingsLanguageView.classList.add('hidden-view');
      settingsMainView.classList.remove('hidden-view');
    };
  }
  if (langRuToggle) {
    langRuToggle.addEventListener('change', () => {
      if (langRuToggle.checked) setLanguage('ru');
      else renderLanguageSettings();
    });
  }
  if (langEnToggle) {
    langEnToggle.addEventListener('change', () => {
      if (langEnToggle.checked) setLanguage('en-US');
      else renderLanguageSettings();
    });
  }
  if (helpMenuBtn) {
    helpMenuBtn.onclick = () => {
      alert('Помощь');
    };
  }

  function openReactionPopover(bubbleEl, messageIdx) {
    closeReactionPopover();
    const msg = (state.chats[activeChatId] || [])[messageIdx];
    const isMine = msg && msg.from === 'me';
    const pop = document.createElement('div');
    pop.className = 'reaction-popover';
    REACTIONS.forEach(emoji => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = emoji;
      b.addEventListener('click', (ev) => {
        ev.stopPropagation();
        toggleReaction(messageIdx, emoji, { keepPopover: true });
      });
      pop.appendChild(b);
    });
    const sep0 = document.createElement('span');
    sep0.className = 'pop-sep';
    pop.appendChild(sep0);
    const replyBtn = document.createElement('button');
    replyBtn.type = 'button';
    replyBtn.title = 'Ответить';
    replyBtn.textContent = '↪';
    replyBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      closeReactionPopover();
      startReply(messageIdx);
    });
    pop.appendChild(replyBtn);

    const pinBtn = document.createElement('button');
    pinBtn.type = 'button';
    const isPinned = (state.contacts.find(x => x.id === activeChatId) || {}).pinnedIdx === messageIdx;
    pinBtn.title = isPinned ? 'Открепить' : 'Закрепить';
    pinBtn.textContent = isPinned ? '📍' : '📌';
    pinBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      closeReactionPopover();
      togglePin(messageIdx);
    });
    pop.appendChild(pinBtn);

    const fwdBtn = document.createElement('button');
    fwdBtn.type = 'button';
    fwdBtn.title = 'Переслать';
    fwdBtn.textContent = '↗';
    fwdBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      closeReactionPopover();
      openForward(messageIdx);
    });
    pop.appendChild(fwdBtn);

    if (activeChatId !== SAVED_ID) {
      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.title = 'В сохранённые';
      saveBtn.textContent = '⭐';
      saveBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        closeReactionPopover();
        saveToFavorites(messageIdx);
      });
      pop.appendChild(saveBtn);
    }

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.title = 'Копировать текст';
    copyBtn.textContent = '📋';
    copyBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      closeReactionPopover();
      copyMessage(messageIdx);
    });
    pop.appendChild(copyBtn);

    if (isMine) {
      const sep = document.createElement('span');
      sep.className = 'pop-sep';
      pop.appendChild(sep);
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.title = 'Редактировать';
      editBtn.textContent = '✏️';
      editBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        closeReactionPopover();
        editMessage(messageIdx);
      });
      pop.appendChild(editBtn);
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.title = 'Удалить';
      delBtn.textContent = '🗑';
      delBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        closeReactionPopover();
        deleteMessage(messageIdx);
      });
      pop.appendChild(delBtn);
    }
    messagesBox.appendChild(pop);
    const bubbleRect = bubbleEl.getBoundingClientRect();
    const boxRect = messagesBox.getBoundingClientRect();
    let top = bubbleRect.top - boxRect.top + messagesBox.scrollTop - 46;
    if (top < 4) top = bubbleRect.bottom - boxRect.top + messagesBox.scrollTop + 6;
    let left = bubbleRect.left - boxRect.left + 8;
    const pad = 8;
    const maxLeft = messagesBox.scrollLeft + messagesBox.clientWidth - pop.offsetWidth - pad;
    const minLeft = messagesBox.scrollLeft + pad;
    left = Math.max(minLeft, Math.min(left, maxLeft));
    const maxTop = messagesBox.scrollTop + messagesBox.clientHeight - pop.offsetHeight - pad;
    const minTop = messagesBox.scrollTop + pad;
    top = Math.max(minTop, Math.min(top, maxTop));
    pop.style.top = top + 'px';
    pop.style.left = left + 'px';
    reactionPopover = pop;
  }

  function toggleReaction(messageIdx, emoji, opts = {}) {
    const msgs = state.chats[activeChatId];
    if (!msgs || !msgs[messageIdx]) return;
    const m = msgs[messageIdx];
    m.reactions = m.reactions || {};
    const meKey = 'me';
    const currentList = Array.isArray(m.reactions[emoji]) ? m.reactions[emoji] : [];
    const hadMyTargetReaction = currentList.includes(meKey);

    // Telegram-like behavior: only one of my reactions per message.
    Object.keys(m.reactions).forEach((key) => {
      const users = m.reactions[key];
      if (!Array.isArray(users)) {
        delete m.reactions[key];
        return;
      }
      const idx = users.indexOf(meKey);
      if (idx >= 0) users.splice(idx, 1);
      if (users.length === 0) delete m.reactions[key];
    });

    if (!hadMyTargetReaction) {
      m.reactions[emoji] = m.reactions[emoji] || [];
      m.reactions[emoji].push(meKey);
    }
    saveState();
    renderMessages();
    if (opts.keepPopover) {
      const bubble = messagesBox.querySelector(`.msg[data-msg-idx="${messageIdx}"] .bubble`);
      if (bubble) openReactionPopover(bubble, messageIdx);
    }
  }

  function openFavorites() {
  messagesBox.innerHTML = '';

  const favs = state.favorites || [];

  if (favs.length === 0) {
    messagesBox.innerHTML = '<div style="opacity:.6; padding:20px;">Нет избранных сообщений</div>';
    return;
  }

  favs.forEach(m => {
    const el = document.createElement('div');
    el.className = 'msg';

    el.innerHTML = `
      <div class="bubble">
        <div style="font-size:12px; opacity:.6;">⭐ Избранное</div>
        <div>${m.text || ''}</div>
      </div>
    `;

    messagesBox.appendChild(el);
  });

  // меняем заголовок
  const chatName = document.getElementById('chatName');
  if (chatName) chatName.textContent = 'Избранные';
}

  function editMessage(messageIdx) {
    const msgs = state.chats[activeChatId];
    if (!msgs || !msgs[messageIdx]) return;
    const m = msgs[messageIdx];
    const next = prompt('Изменить сообщение:', m.text);
    if (next === null) return;
    const trimmed = next.trim();
    if (!trimmed) return;
    if (trimmed === m.text) return;
    m.text = trimmed;
    m.edited = true;
    saveState();
    renderMessages();
    renderChats();
  }

  function startReply(messageIdx) {
    const msgs = state.chats[activeChatId];
    if (!msgs || !msgs[messageIdx]) return;
    const m = msgs[messageIdx];
    const contact = state.contacts.find(x => x.id === activeChatId);
    const nick = m.from === 'me' ? (state.profile.nick || 'Гость') : (contact ? contact.name : '');
    pendingReply = {
      nick,
      from: m.from,
      text: m.text || (m.image ? '🖼 Фото' : '')
    };
    renderReplyBar();
    messageInput.focus();
  }

  function cancelReply() {
    pendingReply = null;
    renderReplyBar();
  }

  function renderReplyBar() {
    if (!pendingReply) {
      replyBar.classList.add('hidden');
      return;
    }
    replyBar.classList.remove('hidden');
    replyBar.querySelector('.reply-bar-name').textContent = 'Ответ ' + pendingReply.nick;
    replyBar.querySelector('.reply-bar-text').textContent = pendingReply.text;
  }

  function setPendingImage(dataUrl) {
    pendingImage = dataUrl;
    if (dataUrl) {
      imagePreviewImg.src = dataUrl;
      imagePreview.classList.remove('hidden');
    } else {
      imagePreview.classList.add('hidden');
      imagePreviewImg.src = '';
    }
  }

  function deleteMessage(messageIdx) {
    const msgs = state.chats[activeChatId];
    if (!msgs || !msgs[messageIdx]) return;
    if (!confirm('Удалить это сообщение?')) return;
    msgs.splice(messageIdx, 1);
    const c = state.contacts.find(x => x.id === activeChatId);
    if (c && typeof c.pinnedIdx === 'number') {
      if (c.pinnedIdx === messageIdx) delete c.pinnedIdx;
      else if (c.pinnedIdx > messageIdx) c.pinnedIdx -= 1;
    }
    saveState();
    rebuildChatSearch();
    renderMessages();
    renderPinnedBar();
    renderChats();
  }

  // ---------- Search & hide ----------
  contactsSearchEl.addEventListener('input', e => {
    contactsQuery = e.target.value;
    renderContacts();
  });
  chatsSearchEl.addEventListener('input', e => {
    chatsQuery = e.target.value;
    renderChats();
  });
  toggleHiddenBtn.addEventListener('click', () => {
    showHidden = !showHidden;
    renderChats();
  });
  cancelReplyBtn.addEventListener('click', cancelReply);
  cancelImageBtn.addEventListener('click', () => setPendingImage(null));
  attachInput.addEventListener('change', e => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    fileToDataUrl(file).then(url => setPendingImage(url));
  });

  // ---------- Settings toggles ----------
  function applyToggles() {
    autoReplyToggle.checked = !!state.autoReply;
    soundToggle.checked = !!state.sound;
  }
  autoReplyToggle.addEventListener('change', () => {
    state.autoReply = autoReplyToggle.checked;
    saveState();
  });
  soundToggle.addEventListener('change', () => {
    state.sound = soundToggle.checked;
    saveState();
    if (state.sound) playBeep();
  });

  // ---------- Sound ----------
  let audioCtx = null;
  function playBeep() {
    if (!state.sound) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const t = audioCtx.currentTime;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(880, t);
      o.frequency.exponentialRampToValueAtTime(660, t + 0.12);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      o.connect(g).connect(audioCtx.destination);
      o.start(t);
      o.stop(t + 0.27);
    } catch (e) {}
  }

  // ---------- Typing & auto-reply ----------
  function hideTyping() {
    if (typingEl) { typingEl.remove(); typingEl = null; }
  }
  function scheduleAutoReply(toContactId, sourceText) {
    if (!state.autoReply) return;
    if (typingTimer) { clearTimeout(typingTimer); typingTimer = null; }
    const delayShow = 700 + Math.random() * 500;
    const delayReply = delayShow + 1200 + Math.min(2000, (sourceText || '').length * 25);
    setTimeout(() => {
      if (activeChatId === toContactId) showTyping();
    }, delayShow);
    typingTimer = setTimeout(() => {
      typingTimer = null;
      const replies = [
        sourceText ? `Хм, "${sourceText.slice(0, 60)}" — интересно!` : 'Что это?',
        'Понятно 👍',
        'Согласен!',
        'Расскажи подробнее',
        'Ого 🔥',
        'Окей',
      ];
      const text = replies[Math.floor(Math.random() * replies.length)];
      state.chats[toContactId] = state.chats[toContactId] || [];
      state.chats[toContactId].push({ from: 'them', text, ts: Date.now() });
      state.chats[toContactId].forEach(mm => { if (mm.from === 'me' && mm.read === false) mm.read = true; });
      const contact = state.contacts.find(x => x.id === toContactId);
      if (!isChatVisible(toContactId) && contact) {
        contact.unread = (contact.unread || 0) + 1;
        if (!contact.muted) showToast(contact, text);
      }
      if (isChatVisible(toContactId)) {
        const box = messagesBox;
        const wasAtBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
        if (!wasAtBottom) {
          unseenWhileScrolledUp += 1;
          updateScrollDownBtn();
        }
      }
      saveState();
      if (activeChatId === toContactId) {
        hideTyping();
        renderMessages(true);
      }
      renderChats();
      renderContacts();
      updateTabBadge();
      if (!contact || !contact.muted) playBeep();
    }, delayReply);
  }

  // ---------- Tabs ----------
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.toggle('active', b===btn));
      tabs.forEach(t => t.classList.toggle('active', t.id === 'tab-' + target));
      if(target==='chats') renderChats();
      if(target==='contacts') renderContacts();
      if (target === 'settings' && settingsMainView) {
        if (settingsAppearanceView) settingsAppearanceView.classList.add('hidden-view');
        if (settingsLanguageView) settingsLanguageView.classList.add('hidden-view');
        if (settingsProfileView) settingsProfileView.classList.add('hidden-view');
        if (settingsStoriesView) settingsStoriesView.classList.add('hidden-view');
        settingsMainView.classList.remove('hidden-view');
      }
    });
  });

  // ---------- Profile ----------
  function renderProfile(){
    meNickEl.textContent = state.profile.nick||'Гость';
    const avatar = state.profile.avatar || defaultAvatar(state.profile.nick||'Г');
    meAvatarEl.src = avatar;
    settingsAvatarEl.src = avatar;
    nickInputEl.value = state.profile.nick || '';
    if (aboutInputEl) aboutInputEl.value = state.profile.about || '';
    if (profilePasswordInputEl) profilePasswordInputEl.value = state.profile.password || '';
    if (profileIdValueEl) profileIdValueEl.textContent = '@' + (state.profile.nick || 'guest').replace(/\s+/g, '_').toLowerCase();
  }
  function hasRegisteredProfile() {
    return !!(state.profile && typeof state.profile.nick === 'string' && state.profile.nick.trim());
  }
  function isLoggedOut() {
    return !!(state.auth && state.auth.loggedOut);
  }
  function setAuthMode() {
    const needsRegistration = !hasRegisteredProfile();
    const needsPassword = !needsRegistration && !!state.profile.password;
    if (authTitle) authTitle.textContent = needsRegistration ? 'Добро пожаловать' : 'Вход в аккаунт';
    if (authSubtitle) authSubtitle.textContent = needsRegistration ? 'Введите имя, чтобы продолжить' : 'Подтвердите вход в аккаунт';
    if (authPasswordField) authPasswordField.classList.toggle('hidden-view', !needsPassword);
    if (authNickInput) authNickInput.placeholder = needsRegistration ? 'Например, Иван' : (state.profile.nick || 'Имя');
    if (authError) authError.textContent = '';
    if (authPasswordInput) authPasswordInput.value = '';
  }
  function completeAuth() {
    const nick = (authNickInput && authNickInput.value || '').trim();
    if (!hasRegisteredProfile()) {
      if (!nick) {
        if (authNickInput) authNickInput.focus();
        return;
      }
      state.profile.nick = nick;
      state.auth.loggedOut = false;
      saveState();
      renderProfile();
      if (authOverlay) authOverlay.classList.add('hidden');
      return;
    }
    if (nick && nick.toLowerCase() !== (state.profile.nick || '').toLowerCase()) {
      if (authError) authError.textContent = 'Неверное имя пользователя';
      return;
    }
    if (state.profile.password && (authPasswordInput && authPasswordInput.value || '') !== state.profile.password) {
      if (authError) authError.textContent = 'Неверный пароль';
      return;
    }
    state.auth.loggedOut = false;
    saveState();
    renderProfile();
    if (authOverlay) authOverlay.classList.add('hidden');
  }
  function applyAuthGate() {
    if (!authOverlay) return;
    if (hasRegisteredProfile() && !isLoggedOut()) {
      authOverlay.classList.add('hidden');
      return;
    }
    setAuthMode();
    authOverlay.classList.remove('hidden');
    if (authNickInput) {
      authNickInput.value = hasRegisteredProfile() ? (state.profile.nick || '') : '';
      setTimeout(() => authNickInput.focus(), 40);
    }
  }
  if (authContinueBtn) authContinueBtn.addEventListener('click', completeAuth);
  if (authNickInput) {
    authNickInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        completeAuth();
      }
    });
  }

  saveProfileBtn.addEventListener('click', () => {
    state.profile.nick = nickInputEl.value.trim() || 'Гость';
    if (aboutInputEl) state.profile.about = aboutInputEl.value.trim();
    if (profilePasswordInputEl) state.profile.password = profilePasswordInputEl.value || '';
    saveState();
    renderProfile();
    profileSavedEl.textContent = 'Сохранено ✓';
    setTimeout(()=>profileSavedEl.textContent='',1800);
  });
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      state.auth.loggedOut = true;
      saveState();
      applyAuthGate();
    });
  }

  avatarInputEl.addEventListener('change', e=>{
    const file = e.target.files && e.target.files[0];
    if(!file) return;
    fileToDataUrl(file).then(url=>{ state.profile.avatar=url; saveState(); renderProfile(); });
  });

  function getMyStories() {
    ensureStoriesState();
    return state.stories
      .filter(s => (s.authorId || 'me') === 'me')
      .sort((a, b) => b.ts - a.ts);
  }
  function openMyStoryById(storyId) {
    const mine = getMyStories().slice().reverse();
    const idx = mine.findIndex(s => s.id === storyId);
    if (idx < 0) return;
    storyQueue = mine;
    storyCurIdx = idx;
    storyViewer.classList.remove('hidden');
    renderStoryProgress();
    showCurStory();
  }
  function renderMyStoriesSettings() {
    const profile = state.profile || {};
    const audience = profile.storyAudience || 'contacts';
    const radios = document.querySelectorAll('input[name="storiesAudience"]');
    radios.forEach(r => { r.checked = r.value === audience; });
    if (storiesAllowScreenshotsToggle) storiesAllowScreenshotsToggle.checked = profile.storyAllowScreenshots !== false;
    if (storiesPublishProfileToggle) storiesPublishProfileToggle.checked = profile.storyPublishToProfile !== false;
    if (editCloseFriendsBtn) editCloseFriendsBtn.textContent = `Изменить (${(profile.storyCloseFriends || []).length})`;
    if (editSelectedUsersBtn) editSelectedUsersBtn.textContent = `Изменить (${(profile.storySelectedUsers || []).length})`;
    if (!myStoriesListEl) return;
    const mine = getMyStories();
    myStoriesListEl.innerHTML = '';
    if (!mine.length) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'Пока нет опубликованных историй.';
      myStoriesListEl.appendChild(li);
      return;
    }
    mine.forEach(s => {
      const li = document.createElement('li');
      li.className = 'list-item';
      li.innerHTML = `
        <div class="avatar-wrap"><img class="avatar" alt="" /></div>
        <div class="info">
          <div class="name"></div>
          <div class="preview"></div>
        </div>
      `;
      const previewText = s.text ? s.text.slice(0, 60) : (s.image ? '🖼 Фото' : 'История');
      li.querySelector('.avatar').src = s.image || state.profile.avatar || defaultAvatar(state.profile.nick || 'Я');
      li.querySelector('.name').textContent = 'История · ' + formatTime(s.ts);
      li.querySelector('.preview').textContent = previewText;
      li.addEventListener('click', () => openMyStoryById(s.id));
      myStoriesListEl.appendChild(li);
    });
  }
  document.querySelectorAll('input[name="storiesAudience"]').forEach(r => {
    r.addEventListener('change', () => {
      if (!r.checked) return;
      state.profile.storyAudience = r.value;
      saveState();
    });
  });
  if (storiesAllowScreenshotsToggle) {
    storiesAllowScreenshotsToggle.addEventListener('change', () => {
      state.profile.storyAllowScreenshots = storiesAllowScreenshotsToggle.checked;
      saveState();
    });
  }
  if (storiesPublishProfileToggle) {
    storiesPublishProfileToggle.addEventListener('change', () => {
      state.profile.storyPublishToProfile = storiesPublishProfileToggle.checked;
      saveState();
    });
  }
  if (openAllMyStoriesBtn) {
    openAllMyStoriesBtn.addEventListener('click', () => {
      openStoryViewer('me');
    });
  }
  function openStoriesAudienceModal(mode) {
    if (!storiesAudienceModal || !storiesAudienceModalTitle || !storiesAudienceList) return;
    storiesAudienceMode = mode;
    storiesAudienceDraft = mode === 'close_friends'
      ? [...(state.profile.storyCloseFriends || [])]
      : [...(state.profile.storySelectedUsers || [])];
    storiesAudienceModalTitle.textContent = mode === 'close_friends' ? 'Близкие друзья' : 'Выбранные пользователи';
    if (storiesAudienceSearch) storiesAudienceSearch.value = '';
    renderStoriesAudienceList();
    storiesAudienceModal.classList.remove('hidden');
  }
  function closeStoriesAudienceModal() {
    if (!storiesAudienceModal) return;
    storiesAudienceModal.classList.add('hidden');
    storiesAudienceMode = null;
    storiesAudienceDraft = [];
  }
  function renderStoriesAudienceList() {
    if (!storiesAudienceList) return;
    storiesAudienceList.innerHTML = '';
    const q = ((storiesAudienceSearch && storiesAudienceSearch.value) || '').trim().toLowerCase();
    const contacts = state.contacts
      .filter(c => c.id !== SAVED_ID)
      .filter(c => !q || c.name.toLowerCase().includes(q));
    if (!contacts.length) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'Контакты не найдены.';
      storiesAudienceList.appendChild(li);
      return;
    }
    contacts.forEach(c => {
      const li = document.createElement('li');
      li.className = 'list-item';
      const checked = storiesAudienceDraft.includes(c.id);
      li.innerHTML = `
        <div class="avatar-wrap"><img class="avatar" alt="" /></div>
        <div class="info"><div class="name"></div><div class="preview"></div></div>
        <input type="checkbox" class="stories-audience-check" ${checked ? 'checked' : ''} />
      `;
      li.querySelector('.avatar').src = c.avatar || defaultAvatar(c.name);
      li.querySelector('.name').textContent = c.name;
      li.querySelector('.preview').textContent = presenceText(c);
      const toggle = () => {
        const idx = storiesAudienceDraft.indexOf(c.id);
        if (idx >= 0) storiesAudienceDraft.splice(idx, 1);
        else storiesAudienceDraft.push(c.id);
        renderStoriesAudienceList();
      };
      li.addEventListener('click', (ev) => {
        if (ev.target && ev.target.classList.contains('stories-audience-check')) return;
        toggle();
      });
      li.querySelector('.stories-audience-check').addEventListener('click', (ev) => {
        ev.stopPropagation();
        toggle();
      });
      storiesAudienceList.appendChild(li);
    });
  }
  if (editCloseFriendsBtn) editCloseFriendsBtn.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    openStoriesAudienceModal('close_friends');
  });
  if (editSelectedUsersBtn) editSelectedUsersBtn.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    openStoriesAudienceModal('selected');
  });
  if (storiesAudienceSearch) storiesAudienceSearch.addEventListener('input', renderStoriesAudienceList);
  if (cancelStoriesAudienceBtn) cancelStoriesAudienceBtn.addEventListener('click', closeStoriesAudienceModal);
  if (saveStoriesAudienceBtn) saveStoriesAudienceBtn.addEventListener('click', () => {
    if (storiesAudienceMode === 'close_friends') state.profile.storyCloseFriends = [...storiesAudienceDraft];
    if (storiesAudienceMode === 'selected') state.profile.storySelectedUsers = [...storiesAudienceDraft];
    saveState();
    renderMyStoriesSettings();
    closeStoriesAudienceModal();
  });
  if (storiesAudienceModal) {
    storiesAudienceModal.addEventListener('click', (ev) => {
      if (ev.target === storiesAudienceModal) closeStoriesAudienceModal();
    });
  }

  function fileToDataUrl(file){
    return new Promise((res,rej)=>{
      const r = new FileReader();
      r.onload = ()=>res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  // ---------- Contacts ----------
  function renderContacts(){
    contactsListEl.innerHTML='';
    const realContacts = state.contacts.filter(c => c.id !== SAVED_ID);
    if(realContacts.length===0){
      const li = document.createElement('li');
      li.className='empty';
      li.textContent='Список пуст. Добавьте первый контакт.';
      contactsListEl.appendChild(li);
      return;
    }
    const q = contactsQuery.trim().toLowerCase();
    const filtered = q ? realContacts.filter(c => c.name.toLowerCase().includes(q)) : realContacts;
    if (filtered.length === 0) {
      const li = document.createElement('li');
      li.className='empty';
      li.textContent='Ничего не найдено.';
      contactsListEl.appendChild(li);
      return;
    }
    filtered.forEach(c=>{
      const li = document.createElement('li');
      li.className='list-item';
      const hasUnread = (c.unread || 0) > 0;
      li.innerHTML=`
        <div class="avatar-wrap">
          <img class="avatar" alt="" />
          <span class="presence-dot"></span>
        </div>
        <div class="info">
          <div class="name"></div>
          <div class="preview"></div>
        </div>
        ${hasUnread ? `<span class="unread-badge">${c.unread > 99 ? '99+' : c.unread}</span>` : ''}
        <button class="icon-btn delete-contact" title="Удалить контакт" aria-label="Удалить контакт">🗑</button>
      `;
      if (hasUnread) li.classList.add('has-unread');
      li.querySelector('.avatar').src = c.avatar || defaultAvatar(c.name);
      li.querySelector('.name').textContent = c.name;
      li.querySelector('.preview').textContent = presenceText(c);
      li.querySelector('.presence-dot').classList.toggle('online', !!c.online);
      li.addEventListener('click',()=>openChat(c.id));
      li.querySelector('.delete-contact').addEventListener('click', (ev) => {
        ev.stopPropagation();
        deleteContact(c.id);
      });
      contactsListEl.appendChild(li);
    });
  }

  function deleteContact(contactId) {
    const c = state.contacts.find(x => x.id === contactId);
    if (!c) return;
    const ok = confirm(`Удалить контакт «${c.name}»? Вся история переписки тоже будет удалена.`);
    if (!ok) return;
    state.contacts = state.contacts.filter(x => x.id !== contactId);
    delete state.chats[contactId];
    saveState();
    if (activeChatId === contactId) closeChat();
    renderContacts();
    renderChats();
  }

  addContactBtn.addEventListener('click', ()=>{
    newContactName.value='';
    newContactAvatar.value='';
    pendingNewContactAvatar='';
    contactModal.classList.remove('hidden');
    setTimeout(()=>newContactName.focus(),50);
  });

  cancelContactBtn.addEventListener('click',()=>contactModal.classList.add('hidden'));

  newContactAvatar.addEventListener('change', e=>{
    const file = e.target.files && e.target.files[0];
    if(!file){ pendingNewContactAvatar=''; return; }
    fileToDataUrl(file).then(url=>pendingNewContactAvatar=url);
  });

  createContactBtn.addEventListener('click', ()=>{
    const name = newContactName.value.trim();
    if(!name){ newContactName.focus(); return; }
    const contact = {
      id: uid(),
      name,
      avatar: pendingNewContactAvatar || defaultAvatar(name),
      online: Math.random() < 0.5,
      lastSeen: Date.now() - Math.floor(Math.random() * 1000 * 60 * 120)
    };
    state.contacts.push(contact);
    state.chats[contact.id]=state.chats[contact.id]||[];
    saveState();
    contactModal.classList.add('hidden');
    renderContacts();
    renderChats();
  });

  // ---------- Chats ----------
  function renderChats(){
    chatsListEl.innerHTML='';
    const withMessages = state.contacts.filter(c => state.chats[c.id] && state.chats[c.id].length > 0);
    const visible = withMessages.filter(c => showHidden ? c.hidden : !c.hidden);
    const hiddenCount = withMessages.filter(c => c.hidden).length;
    toggleHiddenBtn.textContent = showHidden ? `← К чатам` : `📦 Архив${hiddenCount ? ` (${hiddenCount})` : ''}`;
    toggleHiddenBtn.style.display = (hiddenCount === 0 && !showHidden) ? 'none' : 'inline-flex';

    if (withMessages.length === 0) {
      chatsEmptyEl.style.display = 'block';
      return;
    }
    chatsEmptyEl.style.display = 'none';

    const q = chatsQuery.trim().toLowerCase();
    let items = visible.map(c => {
      const msgs = state.chats[c.id];
      const last = msgs[msgs.length - 1];
      let matchedMsg = null;
      if (q) {
        const nameMatch = c.name.toLowerCase().includes(q);
        matchedMsg = msgs.slice().reverse().find(m => (m.text || '').toLowerCase().includes(q)) || null;
        if (!nameMatch && !matchedMsg) return null;
      }
      return { c, last, matchedMsg };
    }).filter(Boolean);

    items.sort((a, b) => {
      const ap = a.c.pinned ? 1 : 0, bp = b.c.pinned ? 1 : 0;
      if (ap !== bp) return bp - ap;
      if (a.c.id === SAVED_ID) return -1;
      if (b.c.id === SAVED_ID) return 1;
      return b.last.ts - a.last.ts;
    });

    if (items.length === 0) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = q ? 'Ничего не найдено.' : (showHidden ? 'Скрытых чатов нет.' : 'Нет активных чатов.');
      chatsListEl.appendChild(li);
      return;
    }

    items.forEach(({ c, last, matchedMsg }) => {
      const li = document.createElement('li');
      li.className = 'list-item';
      const hasUnread = (c.unread || 0) > 0;
      li.innerHTML = `
        <div class="avatar-wrap">
          <img class="avatar" alt="" />
          <span class="presence-dot"></span>
        </div>
        <div class="info">
          <div class="name"></div>
          <div class="preview"></div>
        </div>
        <div class="badge-col">
          <div class="time"></div>
          ${hasUnread ? `<span class="unread-badge">${c.unread > 99 ? '99+' : c.unread}</span>` : ''}
        </div>
        <button class="icon-btn hide-chat" title="${c.hidden ? 'Показать чат' : 'Скрыть чат'}" aria-label="Скрыть чат">${c.hidden ? '👁' : '🙈'}</button>
      `;
      if (hasUnread) li.classList.add('has-unread');
      li.querySelector('.avatar').src = c.avatar || defaultAvatar(c.name);
      const nameEl = li.querySelector('.name');
      nameEl.textContent = c.name;
      if (c.id === SAVED_ID) li.classList.add('saved-contact');
      if (c.pinned) {
        li.classList.add('pinned');
        const pin = document.createElement('span');
        pin.className = 'pin-icon';
        pin.textContent = '📌';
        nameEl.appendChild(pin);
      }
      if (c.muted) {
        const mute = document.createElement('span');
        mute.className = 'mute-icon';
        mute.textContent = '🔇';
        nameEl.appendChild(mute);
      }
      li.querySelector('.presence-dot').classList.toggle('online', !!c.online);
      const shown = matchedMsg || last;
      const draft = (state.drafts || {})[c.id];
      const previewEl = li.querySelector('.preview');
      if (draft && !matchedMsg) {
        previewEl.innerHTML = '<span class="draft-tag">Черновик: </span>';
        const span = document.createElement('span');
        span.textContent = draft.length > 60 ? draft.slice(0, 60) + '…' : draft;
        previewEl.appendChild(span);
      } else {
        const prefix = shown.from === 'me' ? 'Вы: ' : '';
        let body = shown.text || (shown.image ? '🖼 фото' : (shown.audio ? '🎤 голосовое' : ''));
        previewEl.textContent = prefix + body;
      }
      li.querySelector('.time').textContent = formatTime(shown.ts);
      li.addEventListener('click', () => openChat(c.id));
      li.querySelector('.hide-chat').addEventListener('click', (ev) => {
        ev.stopPropagation();
        toggleHideChat(c.id);
      });
      chatsListEl.appendChild(li);
    });
  }

  function toggleHideChat(contactId) {
    const c = state.contacts.find(x => x.id === contactId);
    if (!c) return;
    c.hidden = !c.hidden;
    saveState();
    renderChats();
  }

  function formatTime(ts){
    const d=new Date(ts), today=new Date();
    if(d.toDateString()===today.toDateString()) return d.toTimeString().slice(0,5);
    return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}`;
  }

  // ---------- Chat window ----------
  function openChat(contactId){
    const c=state.contacts.find(x=>x.id===contactId);
    if(!c) return;
    activeChatId = contactId;
    chatAvatar.src = c.avatar || defaultAvatar(c.name);
    chatName.textContent = c.name;
    updateChatHeaderStatus();
    state.chats[contactId] = state.chats[contactId] || [];
    if (c.unread) {
      c.unread = 0;
      saveState();
      updateTabBadge();
    }
    closeChatSearch();
    renderPinnedBar();
    renderMessages();
    const draft = (state.drafts || {})[contactId] || '';
    messageInput.value = draft;
    updateMessagePlaceholder(c.name);
    chatOverlay.classList.remove('hidden');
    requestAnimationFrame(() => chatOverlay.classList.add('open'));
    setTimeout(() => messageInput.focus(), 60);
    unseenWhileScrolledUp = 0;
    updateScrollDownBtn();
  }

  function closeChat() {
    chatOverlay.classList.add('closing');
    chatOverlay.classList.remove('open');
    setTimeout(() => {
      chatOverlay.classList.add('hidden');
      chatOverlay.classList.remove('closing');
    }, 220);
    if (typingTimer) { clearTimeout(typingTimer); typingTimer = null; }
    hideTyping();
    activeChatId = null;
    cancelReply();
    setPendingImage(null);
    closeChatSearch();
    if (pinnedBar) pinnedBar.classList.add('hidden');
    renderChats();
  }

  function openImageViewer(src) {
    const v = document.createElement('div');
    v.className = 'image-viewer';
    v.innerHTML = `<img alt="" /><button class="icon-btn close-viewer" title="Закрыть">✕</button>`;
    v.querySelector('img').src = src;
    const close = () => v.remove();
    v.addEventListener('click', close);
    document.body.appendChild(v);
  }

  closeChatBtn.addEventListener('click', closeChat);

  function openProfileFromChat() {
    if (activeChatId && activeChatId !== SAVED_ID) openProfile(activeChatId);
  }
  chatAvatar.addEventListener('click', openProfileFromChat);
  document.querySelector('#chatOverlay .chat-title').addEventListener('click', openProfileFromChat);

function renderMessages(shouldScroll = false) {
  closeReactionPopover();
  messagesBox.innerHTML = '';

  const msgs = state.chats[activeChatId] || [];
  const contact = state.contacts.find(x => x.id === activeChatId);
  const q = (chatSearchQuery || '').trim().toLowerCase();
  const dict = TRANSLATIONS[state.language] || TRANSLATIONS.ru;

  if (msgs.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-chat';
    empty.innerHTML = `
      <div class="empty-chat-icon">💬</div>
      <div class="empty-chat-title">${dict.emptyChatTitle}</div>
      <div class="empty-chat-text">${dict.emptyChatText}</div>
      <button type="button" class="btn primary empty-chat-btn">${dict.emptyChatAction}</button>
    `;
    empty.querySelector('.empty-chat-btn')?.addEventListener('click', () => {
      messageInput.focus();
    });
    messagesBox.appendChild(empty);
    if (shouldScroll) {
      messagesBox.scrollTop = messagesBox.scrollHeight;
    }
    return;
  }

  msgs.forEach((m, idx) => {
    const isMe = m.from === 'me';

    const avatarSrc = isMe
      ? (state.profile.avatar || defaultAvatar(state.profile.nick || 'Г'))
      : (contact.avatar || defaultAvatar(contact.name));

    const nick = isMe
      ? (state.profile.nick || 'Гость')
      : contact.name;

    const wrap = document.createElement('div');
    wrap.className = 'msg ' + (isMe ? 'me' : 'them');
    wrap.dataset.msgIdx = String(idx);

    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `${nick} · ${formatTime(m.ts)}`;

    bubble.addEventListener('dblclick', (e) => {
  e.stopPropagation();

  const msgEl = bubble.closest('.msg');
  const idx = Number(msgEl.dataset.msgIdx);

  toggleReaction(idx, '❤️');
});

    // ✔ галочки
    if (isMe) {
      const ticks = document.createElement('span');
      ticks.className = 'read-ticks' + (m.read ? ' read' : '');
      ticks.textContent = m.read ? '✓✓' : '✓';
      meta.appendChild(ticks);
    }

    // 🧩 reply
    if (m.replyTo) {
      const quote = document.createElement('div');
      quote.className = 'quote';

      quote.innerHTML = `
        <div class="quote-name">${m.replyTo.nick}</div>
        <div class="quote-text">${m.replyTo.text}</div>
      `;

      bubble.appendChild(quote);
    }

    // 🖼 картинка
    if (m.image) {
      const img = document.createElement('img');
      img.className = 'msg-image';
      img.src = m.image;

      img.onclick = (e) => {
        e.stopPropagation();
        openImageViewer(m.image);
      };

      bubble.appendChild(img);
    }

    // 🎤 аудио
    if (m.audio) {
      bubble.appendChild(buildVoicePlayer(m.audio, m.audioDuration || 0));
    }

    // 💬 текст
    if (m.text) {
      const text = document.createElement('div');
      text.className = 'msg-text';

      if (q && m.text.toLowerCase().includes(q)) {
        text.innerHTML = highlightHtml(m.text, q);
      } else {
        text.textContent = m.text;
      }

      bubble.appendChild(text);
    }

    bubble.appendChild(meta);

    // ❤️ реакции
    const reactionsEl = document.createElement('div');
    reactionsEl.className = 'reactions';

    const reactions = m.reactions || {};
    Object.keys(reactions).forEach(emoji => {
      const users = reactions[emoji];
      if (!users || !users.length) return;

      const pill = document.createElement('span');
      pill.className = 'reaction-pill' + (users.includes('me') ? ' mine' : '');
      pill.innerHTML = `${emoji} ${users.length}`;

      pill.onclick = (e) => {
        e.stopPropagation();
        toggleReaction(idx, emoji);
      };

      reactionsEl.appendChild(pill);
    });

    // 🧠 клик по сообщению
    bubble.onclick = (e) => {
      e.stopPropagation();
      openReactionPopover(bubble, idx);
    };

    // сборка
    wrap.appendChild(bubble);
    wrap.appendChild(reactionsEl);

    messagesBox.appendChild(wrap);
  });
  if (shouldScroll) {
    messagesBox.scrollTop = messagesBox.scrollHeight;
  }
}

  messageForm.addEventListener('submit', e => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!activeChatId) return;
    if (!text && !pendingImage) return;
    state.chats[activeChatId] = state.chats[activeChatId] || [];
    const msg = { from: 'me', text, ts: Date.now(), read: false };
    if (pendingImage) msg.image = pendingImage;
    if (pendingReply) msg.replyTo = { nick: pendingReply.nick, from: pendingReply.from, text: pendingReply.text };
    state.chats[activeChatId].push(msg);
    saveState();
    messageInput.value = '';
    if (state.drafts) { delete state.drafts[activeChatId]; saveState(); }
    setPendingImage(null);
    cancelReply();
    emojiPicker.classList.add('hidden');
    renderMessages(true);
    const lastMine = messagesBox.querySelectorAll('.msg.me');
    const lastEl = lastMine[lastMine.length - 1];
    if (lastEl) {
      lastEl.classList.add('flying');
      setTimeout(() => lastEl.classList.remove('flying'), 450);
    }
    renderChats();
    scheduleAutoReply(activeChatId, text);
  });

  messageInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      messageForm.requestSubmit();
    }
  });
  messageInput.addEventListener('input', () => {
    if (!activeChatId) return;
    state.drafts = state.drafts || {};
    const v = messageInput.value;
    if (v) state.drafts[activeChatId] = v;
    else delete state.drafts[activeChatId];
    saveState();
  });

  // Close overlays on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (!chatOverlay.classList.contains('hidden')) closeChat();
      else if (!contactModal.classList.contains('hidden')) contactModal.classList.add('hidden');
    }
  });

  // ---------- Presence (online/offline simulation) ----------
  function ensurePresence() {
    let changed = false;
    state.contacts.forEach(c => {
      if (typeof c.online !== 'boolean') { c.online = Math.random() < 0.5; changed = true; }
      if (typeof c.lastSeen !== 'number') { c.lastSeen = Date.now() - Math.floor(Math.random()*1000*60*60); changed = true; }
      if (typeof c.unread !== 'number') { c.unread = 0; changed = true; }
    });
    if (changed) saveState();
  }

  // ---------- Unread & toasts ----------
  function isChatVisible(contactId) {
    return activeChatId === contactId && !chatOverlay.classList.contains('hidden');
  }
  function updateTabBadge() {
    if (!chatsTabBadge) return;
    const total = state.contacts.reduce((s, c) => s + (c.unread || 0), 0);
    if (total > 0) {
      chatsTabBadge.textContent = total > 99 ? '99+' : String(total);
      chatsTabBadge.classList.remove('hidden');
    } else {
      chatsTabBadge.classList.add('hidden');
    }
  }
  function markRead(contactId) {
    const c = state.contacts.find(x => x.id === contactId);
    if (!c || !c.unread) return;
    c.unread = 0;
    saveState();
    updateTabBadge();
    renderChats();
    renderContacts();
  }
  function showToast(contact, text) {
    if (!toastBox) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `
      <img class="avatar" alt="" />
      <div class="toast-body">
        <div class="toast-name"></div>
        <div class="toast-text"></div>
      </div>
      <button type="button" class="icon-btn toast-close" title="Закрыть">✕</button>
    `;
    el.querySelector('.avatar').src = contact.avatar || defaultAvatar(contact.name);
    el.querySelector('.toast-name').textContent = contact.name;
    el.querySelector('.toast-text').textContent = text;
    let dismissed = false;
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      el.classList.add('hide');
      el.classList.remove('show');
      setTimeout(() => el.remove(), 320);
    };
    el.addEventListener('click', (ev) => {
      if (ev.target.classList.contains('toast-close')) { dismiss(); return; }
      dismiss();
      const tabBtn = document.querySelector('.tab-btn[data-tab="chats"]');
      if (tabBtn) tabBtn.click();
      openChat(contact.id);
    });
    el.querySelector('.toast-close').addEventListener('click', (ev) => {
      ev.stopPropagation();
      dismiss();
    });
    toastBox.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(dismiss, 4500);
    while (toastBox.children.length > 4) {
      toastBox.firstChild.remove();
    }
  }
  function formatLastSeen(ts) {
    const diff = Math.max(0, Date.now() - ts);
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'был только что';
    if (m < 60) return `был ${m} мин назад`;
    const h = Math.floor(m / 60);
    if (h < 24) return `был ${h} ч назад`;
    const d = Math.floor(h / 24);
    return `был ${d} дн назад`;
  }
  function presenceText(c) {
    if (!c) return '';
    return c.online ? 'в сети' : formatLastSeen(c.lastSeen || Date.now());
  }
  function tickPresence() {
    let changed = false;
    state.contacts.forEach(c => {
      if (Math.random() < 0.25) {
        const wasOnline = c.online;
        c.online = !c.online;
        if (wasOnline && !c.online) c.lastSeen = Date.now();
        changed = true;
      }
    });
    if (changed) {
      saveState();
      renderContacts();
      renderChats();
      if (activeChatId) updateChatHeaderStatus();
    }
  }
  function updateChatHeaderStatus() {
    const c = state.contacts.find(x => x.id === activeChatId);
    const el = document.querySelector('#chatOverlay .chat-title .status');
    if (!c || !el) return;
    el.textContent = presenceText(c);
    el.classList.toggle('online', !!c.online);
  }
  ensurePresence();
  setInterval(tickPresence, 25000);

  // ---------- Pinned messages ----------
  function togglePin(messageIdx) {
    const c = state.contacts.find(x => x.id === activeChatId);
    if (!c) return;
    if (c.pinnedIdx === messageIdx) delete c.pinnedIdx;
    else c.pinnedIdx = messageIdx;
    saveState();
    renderPinnedBar();
  }
  function renderPinnedBar() {
    if (!pinnedBar) return;
    const c = state.contacts.find(x => x.id === activeChatId);
    if (!c || typeof c.pinnedIdx !== 'number') {
      pinnedBar.classList.add('hidden');
      return;
    }
    const msgs = state.chats[activeChatId] || [];
    const m = msgs[c.pinnedIdx];
    if (!m) {
      delete c.pinnedIdx;
      saveState();
      pinnedBar.classList.add('hidden');
      return;
    }
    const preview = m.text || (m.image ? '🖼 Фото' : '');
    pinnedBar.querySelector('.pinned-text').textContent = preview;
    pinnedBar.classList.remove('hidden');
  }
  if (pinnedBar) {
    pinnedBar.addEventListener('click', (ev) => {
      if (ev.target === unpinBtn) return;
      const c = state.contacts.find(x => x.id === activeChatId);
      if (!c || typeof c.pinnedIdx !== 'number') return;
      scrollToMessage(c.pinnedIdx);
    });
  }
  if (unpinBtn) {
    unpinBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const c = state.contacts.find(x => x.id === activeChatId);
      if (!c) return;
      delete c.pinnedIdx;
      saveState();
      renderPinnedBar();
    });
  }
  function scrollToMessage(idx) {
    const el = messagesBox.querySelector('.msg[data-msg-idx="' + idx + '"]');
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 1200);
  }

  // ---------- Forward ----------
  function openForward(messageIdx) {
    const msgs = state.chats[activeChatId];
    if (!msgs || !msgs[messageIdx]) return;
    const m = msgs[messageIdx];
    pendingForward = {
      fromContactId: activeChatId,
      text: m.text || '',
      image: m.image || null
    };
    forwardPreview.textContent = (m.text || (m.image ? '🖼 Фото' : '')).slice(0, 200);
    forwardSearch.value = '';
    forwardQuery = '';
    renderForwardList();
    forwardModal.classList.remove('hidden');
    setTimeout(() => forwardSearch.focus(), 50);
  }
  function closeForward() {
    forwardModal.classList.add('hidden');
    pendingForward = null;
  }
  function renderForwardList() {
    forwardList.innerHTML = '';
    const q = forwardQuery.trim().toLowerCase();
    const items = state.contacts.filter(c => {
      if (pendingForward && c.id === pendingForward.fromContactId) return false;
      if (!q) return true;
      return c.name.toLowerCase().includes(q);
    });
    if (items.length === 0) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'Нет подходящих контактов.';
      forwardList.appendChild(li);
      return;
    }
    items.forEach(c => {
      const li = document.createElement('li');
      li.className = 'list-item';
      li.innerHTML = `
        <div class="avatar-wrap">
          <img class="avatar" alt="" />
          <span class="presence-dot"></span>
        </div>
        <div class="info">
          <div class="name"></div>
          <div class="preview"></div>
        </div>
      `;
      li.querySelector('.avatar').src = c.avatar || defaultAvatar(c.name);
      li.querySelector('.name').textContent = c.name;
      li.querySelector('.preview').textContent = presenceText(c);
      li.querySelector('.presence-dot').classList.toggle('online', !!c.online);
      li.addEventListener('click', () => performForward(c.id));
      forwardList.appendChild(li);
    });
  }
  function performForward(toContactId) {
    if (!pendingForward) return;
    const fromContact = state.contacts.find(x => x.id === pendingForward.fromContactId);
    const fromNick = fromContact ? fromContact.name : '';
    const newMsg = {
      from: 'me',
      text: pendingForward.text,
      ts: Date.now(),
      read: false,
      forwardedFrom: fromNick
    };
    if (pendingForward.image) newMsg.image = pendingForward.image;
    state.chats[toContactId] = state.chats[toContactId] || [];
    state.chats[toContactId].push(newMsg);
    saveState();
    closeForward();
    const target = state.contacts.find(x => x.id === toContactId);
    if (target) showToast(target, 'Сообщение переслано → ' + target.name);
    renderChats();
    if (activeChatId === toContactId) renderMessages();
    scheduleAutoReply(toContactId, newMsg.text);
  }
  if (forwardSearch) {
    forwardSearch.addEventListener('input', e => {
      forwardQuery = e.target.value;
      renderForwardList();
    });
  }
  if (cancelForwardBtn) cancelForwardBtn.addEventListener('click', closeForward);
  if (forwardModal) {
    forwardModal.addEventListener('click', (ev) => {
      if (ev.target === forwardModal) closeForward();
    });
  }

  // ---------- Chat search ----------
  function openChatSearch() {
    if (!chatSearchBar) return;
    chatSearchBar.classList.remove('hidden');
    chatSearchInput.value = '';
    chatSearchQuery = '';
    chatSearchHits = [];
    chatSearchCurrent = 0;
    updateChatSearchCount();
    setTimeout(() => chatSearchInput.focus(), 30);
  }
  function closeChatSearch() {
    if (!chatSearchBar) return;
    chatSearchBar.classList.add('hidden');
    if (chatSearchQuery) {
      chatSearchQuery = '';
      chatSearchHits = [];
      chatSearchCurrent = 0;
      if (activeChatId) renderMessages();
    } else {
      chatSearchHits = [];
      chatSearchCurrent = 0;
    }
  }
  function rebuildChatSearch() {
    const q = (chatSearchQuery || '').trim().toLowerCase();
    chatSearchHits = [];
    if (!q) { chatSearchCurrent = 0; updateChatSearchCount(); return; }
    const msgs = state.chats[activeChatId] || [];
    msgs.forEach((m, idx) => {
      if ((m.text || '').toLowerCase().includes(q)) chatSearchHits.push(idx);
    });
    if (chatSearchCurrent >= chatSearchHits.length) chatSearchCurrent = 0;
    updateChatSearchCount();
  }
  function updateChatSearchCount() {
    if (!chatSearchCount) return;
    const total = chatSearchHits.length;
    chatSearchCount.textContent = total ? (chatSearchCurrent + 1) + '/' + total : '0/0';
  }
  function jumpToCurrentHit() {
    if (!chatSearchHits.length) return;
    const idx = chatSearchHits[chatSearchCurrent];
    scrollToMessage(idx);
  }
  if (chatSearchBtn) chatSearchBtn.addEventListener('click', () => {
    if (chatSearchBar.classList.contains('hidden')) openChatSearch();
    else closeChatSearch();
  });
  if (chatSearchClose) chatSearchClose.addEventListener('click', closeChatSearch);
  if (chatSearchInput) {
    chatSearchInput.addEventListener('input', e => {
      chatSearchQuery = e.target.value;
      chatSearchCurrent = 0;
      rebuildChatSearch();
      renderMessages();
      jumpToCurrentHit();
    });
    chatSearchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (chatSearchHits.length) {
          chatSearchCurrent = (chatSearchCurrent + (e.shiftKey ? -1 : 1) + chatSearchHits.length) % chatSearchHits.length;
          updateChatSearchCount();
          renderMessages();
          jumpToCurrentHit();
        }
      } else if (e.key === 'Escape') {
        closeChatSearch();
      }
    });
  }
  if (chatSearchPrev) chatSearchPrev.addEventListener('click', () => {
    if (!chatSearchHits.length) return;
    chatSearchCurrent = (chatSearchCurrent - 1 + chatSearchHits.length) % chatSearchHits.length;
    updateChatSearchCount();
    renderMessages();
    jumpToCurrentHit();
  });
  if (chatSearchNext) chatSearchNext.addEventListener('click', () => {
    if (!chatSearchHits.length) return;
    chatSearchCurrent = (chatSearchCurrent + 1) % chatSearchHits.length;
    updateChatSearchCount();
    renderMessages();
    jumpToCurrentHit();
  });

  function highlightHtml(text, q) {
    const lower = text.toLowerCase();
    let out = '';
    let i = 0;
    const qLen = q.length;
    while (i < text.length) {
      const found = lower.indexOf(q, i);
      if (found === -1) {
        out += escapeHtml(text.slice(i));
        break;
      }
      out += escapeHtml(text.slice(i, found));
      out += '<mark>' + escapeHtml(text.slice(found, found + qLen)) + '</mark>';
      i = found + qLen;
    }
    return out;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  // ---------- Export / Import ----------
  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', () => {
      try {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const d = new Date();
        const stamp = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}`;
        a.href = url;
        a.download = `convu-backup-${stamp}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        if (dataMsg) {
          dataMsg.textContent = 'Файл сохранён ✓';
          setTimeout(() => dataMsg.textContent = '', 2400);
        }
      } catch (e) {
        if (dataMsg) dataMsg.textContent = 'Ошибка экспорта: ' + e.message;
      }
    });
  }
  if (importDataInput) {
    importDataInput.addEventListener('change', e => {
      const file = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!file) return;
      if (!confirm('Импорт заменит ВСЕ ваши текущие данные (контакты, чаты, настройки). Продолжить?')) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const parsed = JSON.parse(r.result);
          if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.contacts)) {
            throw new Error('Неверный формат файла');
          }
          state = parsed;
          if (!state.profile) state.profile = { nick: 'Гость', avatar: '' };
          if (typeof state.profile.about !== 'string') state.profile.about = '';
          if (typeof state.profile.password !== 'string') state.profile.password = '';
          if (typeof state.profile.storyAudience !== 'string') state.profile.storyAudience = 'contacts';
          if (typeof state.profile.storyAllowScreenshots !== 'boolean') state.profile.storyAllowScreenshots = true;
          if (typeof state.profile.storyPublishToProfile !== 'boolean') state.profile.storyPublishToProfile = true;
          if (!Array.isArray(state.profile.storyCloseFriends)) state.profile.storyCloseFriends = [];
          if (!Array.isArray(state.profile.storySelectedUsers)) state.profile.storySelectedUsers = [];
          if (!state.auth) state.auth = { loggedOut: false };
          if (typeof state.auth.loggedOut !== 'boolean') state.auth.loggedOut = false;
          if (!state.chats) state.chats = {};
          if (typeof state.language !== 'string') state.language = 'ru';
          if (state.language !== 'ru' && state.language !== 'en-US') state.language = 'ru';
          if (typeof state.theme !== 'string') state.theme = 'dark';
          if (typeof state.themePreset !== 'string') state.themePreset = 'telegram';
          if (typeof state.bubbleStyle !== 'string') state.bubbleStyle = 'soft';
          if (typeof state.chatBgMode !== 'string') state.chatBgMode = 'default';
          if (typeof state.chatBgImage !== 'string') state.chatBgImage = '';
          saveState();
          ensurePresence();
          applyTheme();
          applyToggles();
          renderProfile();
          renderContacts();
          renderChats();
          updateTabBadge();
          if (dataMsg) {
            dataMsg.textContent = 'Данные импортированы ✓';
            setTimeout(() => dataMsg.textContent = '', 2400);
          }
        } catch (err) {
          if (dataMsg) dataMsg.textContent = 'Ошибка импорта: ' + err.message;
          else alert('Ошибка импорта: ' + err.message);
        }
      };
      r.onerror = () => {
        if (dataMsg) dataMsg.textContent = 'Не удалось прочитать файл';
      };
      r.readAsText(file);
    });
  }

  // Escape closes forward modal too
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && forwardModal && !forwardModal.classList.contains('hidden')) {
      closeForward();
    }
  });

  // ========== STORIES ==========
  function ensureStoriesState() {
    if (!Array.isArray(state.stories)) state.stories = [];
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const before = state.stories.length;
    state.stories = state.stories.filter(s => s.ts >= cutoff);
    if (state.stories.length !== before) saveState();
  }
  function renderStories() {
    if (!storiesItems) return;
    ensureStoriesState();
    storiesItems.innerHTML = '';
    const groups = {};
    state.stories.forEach(s => {
      const k = s.authorId || 'me';
      if (!groups[k]) groups[k] = [];
      groups[k].push(s);
    });
    Object.keys(groups).forEach(k => groups[k].sort((a, b) => a.ts - b.ts));
    const order = Object.keys(groups).sort((a, b) => {
      if (a === 'me') return -1;
      if (b === 'me') return 1;
      return groups[b][groups[b].length-1].ts - groups[a][groups[a].length-1].ts;
    });
    order.forEach(k => {
      const stories = groups[k];
      const cell = document.createElement('div');
      cell.className = 'story-cell';
      const isMe = k === 'me';
      const contact = isMe ? null : state.contacts.find(c => c.id === k);
      const allViewed = stories.every(s => isMe || (Array.isArray(s.viewedBy) && s.viewedBy.includes('me')));
      const circle = document.createElement('button');
      circle.className = 'story-circle ' + (allViewed ? 'viewed' : 'unread');
      circle.type = 'button';
      const img = document.createElement('img');
      img.alt = '';
      const lastStory = stories[stories.length - 1];
      if (lastStory.image) img.src = lastStory.image;
      else if (isMe) img.src = state.profile.avatar || defaultAvatar(state.profile.nick || 'Я');
      else if (contact) img.src = contact.avatar || defaultAvatar(contact.name);
      circle.appendChild(img);
      cell.appendChild(circle);
      const label = document.createElement('span');
      label.className = 'story-label';
      label.textContent = isMe ? 'Я' : (contact ? contact.name : 'Аноним');
      cell.appendChild(label);
      circle.addEventListener('click', () => openStoryViewer(k));
      storiesItems.appendChild(cell);
    });
  }
  function ensureFakeFriendsStories() {
    ensureStoriesState();
    if (state._storiesSeeded) return;
    state._storiesSeeded = true;
    saveState();
  }
  if (addStoryBtn) addStoryBtn.addEventListener('click', () => {
    storyComposerText.value = '';
    storyComposerImage = '';
    storyImageInput.value = '';
    storyComposerPreview.classList.add('hidden');
    storyComposerPreview.src = '';
    storyComposer.classList.remove('hidden');
    setTimeout(() => storyComposerText.focus(), 50);
  });
  if (storyCancelBtn) storyCancelBtn.addEventListener('click', () => storyComposer.classList.add('hidden'));
  if (storyImageInput) storyImageInput.addEventListener('change', e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    fileToDataUrl(file).then(url => {
      storyComposerImage = url;
      storyComposerPreview.src = url;
      storyComposerPreview.classList.remove('hidden');
    });
  });
  if (storyPublishBtn) storyPublishBtn.addEventListener('click', () => {
    const text = storyComposerText.value.trim();
    if (!text && !storyComposerImage) return;
    ensureStoriesState();
    state.stories.push({
      id: uid(),
      authorId: 'me',
      text,
      image: storyComposerImage || null,
      ts: Date.now(),
      viewedBy: []
    });
    saveState();
    storyComposer.classList.add('hidden');
    renderStories();
    if (settingsStoriesView && !settingsStoriesView.classList.contains('hidden-view')) renderMyStoriesSettings();
  });
  function openStoryViewer(authorId) {
    const stories = state.stories.filter(s => (s.authorId || 'me') === authorId).sort((a, b) => a.ts - b.ts);
    if (!stories.length) return;
    storyQueue = stories;
    storyCurIdx = 0;
    storyViewer.classList.remove('hidden');
    renderStoryProgress();
    showCurStory();
  }
  function renderStoryProgress() {
    storyProgress.innerHTML = '';
    storyQueue.forEach((_, i) => {
      const seg = document.createElement('div');
      seg.className = 'seg' + (i < storyCurIdx ? ' done' : '');
      const fill = document.createElement('span');
      fill.className = 'fill';
      seg.appendChild(fill);
      storyProgress.appendChild(seg);
    });
  }
  function showCurStory() {
    const s = storyQueue[storyCurIdx];
    if (!s) { closeStoryViewer(); return; }
    const isMe = (s.authorId || 'me') === 'me';
    const contact = isMe ? null : state.contacts.find(c => c.id === s.authorId);
    storyAvatar.src = isMe ? (state.profile.avatar || defaultAvatar(state.profile.nick || 'Я'))
                            : (contact ? (contact.avatar || defaultAvatar(contact.name)) : '');
    storyAuthor.textContent = isMe ? (state.profile.nick || 'Гость') : (contact ? contact.name : 'Аноним');
    storyTime.textContent = formatLastSeen(s.ts).replace('был', 'опубликовано');
    if (s.image) {
      storyImage.src = s.image;
      storyImage.classList.remove('hidden');
    } else {
      storyImage.classList.add('hidden');
      storyImage.src = '';
    }
    storyTextEl.textContent = s.text || '';
    if (isMe) storyDeleteBtn.classList.remove('hidden');
    else storyDeleteBtn.classList.add('hidden');
    if (!isMe) {
      s.viewedBy = s.viewedBy || [];
      if (!s.viewedBy.includes('me')) {
        s.viewedBy.push('me');
        saveState();
      }
    }
    if (storyTimer) clearInterval(storyTimer);
    storyStart = Date.now();
    const duration = 5000;
    const fillEl = storyProgress.children[storyCurIdx]?.querySelector('.fill');
    if (fillEl) fillEl.style.width = '0%';
    storyTimer = setInterval(() => {
      const elapsed = Date.now() - storyStart;
      const pct = Math.min(100, (elapsed / duration) * 100);
      if (fillEl) fillEl.style.width = pct + '%';
      if (elapsed >= duration) {
        clearInterval(storyTimer); storyTimer = null;
        nextStory();
      }
    }, 80);
  }
  function nextStory() {
    if (storyCurIdx < storyQueue.length - 1) {
      storyCurIdx += 1;
      renderStoryProgress();
      showCurStory();
    } else {
      closeStoryViewer();
    }
  }
  function prevStory() {
    if (storyCurIdx > 0) {
      storyCurIdx -= 1;
      renderStoryProgress();
      showCurStory();
    }
  }
  function closeStoryViewer() {
    storyViewer.classList.add('hidden');
    if (storyTimer) { clearInterval(storyTimer); storyTimer = null; }
    storyQueue = [];
    storyCurIdx = 0;
    renderStories();
  }
  if (storyCloseBtn) storyCloseBtn.addEventListener('click', closeStoryViewer);
  if (storyNext) storyNext.addEventListener('click', nextStory);
  if (storyPrev) storyPrev.addEventListener('click', prevStory);
  if (storyDeleteBtn) storyDeleteBtn.addEventListener('click', () => {
    const s = storyQueue[storyCurIdx];
    if (!s) return;
    if (!confirm('Удалить эту историю?')) return;
    state.stories = state.stories.filter(x => x.id !== s.id);
    saveState();
    storyQueue = storyQueue.filter(x => x.id !== s.id);
    if (settingsStoriesView && !settingsStoriesView.classList.contains('hidden-view')) renderMyStoriesSettings();
    if (storyCurIdx >= storyQueue.length) storyCurIdx = Math.max(0, storyQueue.length - 1);
    if (!storyQueue.length) closeStoryViewer();
    else { renderStoryProgress(); showCurStory(); }
  });
  document.addEventListener('keydown', e => {
    if (storyViewer && !storyViewer.classList.contains('hidden')) {
      if (e.key === 'Escape') closeStoryViewer();
      else if (e.key === 'ArrowRight') nextStory();
      else if (e.key === 'ArrowLeft') prevStory();
    }
  });

  // ========== VOICE MESSAGES ==========
  function buildVoicePlayer(src, durationSec) {
    const wrap = document.createElement('div');
    wrap.className = 'voice-msg';
    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'voice-play';
    playBtn.textContent = '▶';
    const bars = document.createElement('div');
    bars.className = 'voice-bars';
    const N = 28;
    const heights = [];
    for (let i = 0; i < N; i++) {
      const b = document.createElement('div');
      b.className = 'bar';
      const h = 6 + Math.floor(Math.abs(Math.sin(i * 1.7)) * 16) + (i % 4) * 2;
      heights.push(h);
      b.style.height = h + 'px';
      bars.appendChild(b);
    }
    const time = document.createElement('div');
    time.className = 'voice-time';
    const total = Math.max(1, Math.round(durationSec));
    time.textContent = '0:' + String(total).padStart(2, '0');
    const audio = new Audio(src);
    let isPlaying = false;
    let raf = null;
    function updateBars() {
      const cur = audio.currentTime;
      const dur = audio.duration || total;
      const filled = Math.round((cur / dur) * N);
      bars.querySelectorAll('.bar').forEach((b, i) => {
        b.classList.toggle('played', i < filled);
      });
      const remain = Math.max(0, Math.round(dur - cur));
      time.textContent = (isPlaying ? Math.floor(cur/60) : 0) + ':' + String(isPlaying ? Math.floor(cur)%60 : remain).padStart(2, '0');
      if (isPlaying) raf = requestAnimationFrame(updateBars);
    }
    playBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play().catch(() => {});
      }
    });
    audio.addEventListener('play', () => {
      isPlaying = true;
      playBtn.textContent = '⏸';
      updateBars();
    });
    audio.addEventListener('pause', () => {
      isPlaying = false;
      playBtn.textContent = '▶';
      if (raf) cancelAnimationFrame(raf);
    });
    audio.addEventListener('ended', () => {
      isPlaying = false;
      playBtn.textContent = '▶';
      bars.querySelectorAll('.bar').forEach(b => b.classList.remove('played'));
      time.textContent = '0:' + String(total).padStart(2, '0');
    });
    bars.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const rect = bars.getBoundingClientRect();
      const ratio = (ev.clientX - rect.left) / rect.width;
      const dur = audio.duration || total;
      audio.currentTime = Math.max(0, Math.min(dur, ratio * dur));
      updateBars();
    });
    wrap.appendChild(playBtn);
    wrap.appendChild(bars);
    wrap.appendChild(time);
    return wrap;
  }

  if (micBtn) {
    micBtn.addEventListener('click', async () => {
      if (mediaRecorder && mediaRecorder.state === 'recording') return;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
        alert('Голосовые сообщения не поддерживаются в этом браузере.');
        return;
      }
      if (!activeChatId) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        recChunks = [];
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recChunks.push(e.data); };
        mediaRecorder.onstop = () => {
          stream.getTracks().forEach(t => t.stop());
          if (recordingBar.dataset.cancel === '1') {
            recordingBar.dataset.cancel = '';
            return;
          }
          const blob = new Blob(recChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
          const r = new FileReader();
          r.onload = () => {
            const dataUrl = r.result;
            const duration = (Date.now() - recStart) / 1000;
            sendVoiceMessage(dataUrl, duration);
          };
          r.readAsDataURL(blob);
        };
        mediaRecorder.start();
        recStart = Date.now();
        recordingBar.classList.remove('hidden');
        micBtn.classList.add('recording');
        recordingBar.dataset.cancel = '';
        if (recTickInt) clearInterval(recTickInt);
        recTickInt = setInterval(() => {
          const sec = Math.floor((Date.now() - recStart) / 1000);
          recordingTimer.textContent = Math.floor(sec/60) + ':' + String(sec%60).padStart(2,'0');
        }, 250);
      } catch (e) {
        alert('Нет доступа к микрофону: ' + e.message);
      }
    });
  }
  function stopRecording(cancel) {
    if (!mediaRecorder || mediaRecorder.state !== 'recording') return;
    recordingBar.dataset.cancel = cancel ? '1' : '';
    mediaRecorder.stop();
    micBtn.classList.remove('recording');
    recordingBar.classList.add('hidden');
    if (recTickInt) { clearInterval(recTickInt); recTickInt = null; }
  }
  if (recordStopBtn) recordStopBtn.addEventListener('click', () => stopRecording(false));
  if (recordCancelBtn) recordCancelBtn.addEventListener('click', () => stopRecording(true));
  function sendVoiceMessage(dataUrl, duration) {
    if (!activeChatId) return;
    state.chats[activeChatId] = state.chats[activeChatId] || [];
    const msg = { from: 'me', text: '', ts: Date.now(), read: false, audio: dataUrl, audioDuration: duration };
    state.chats[activeChatId].push(msg);
    saveState();
    renderMessages();
    renderChats();
    scheduleAutoReply(activeChatId, '🎤 голосовое сообщение');
  }

  // ========== PROFILE MODAL ==========
  function openProfile(contactId) {
    const c = state.contacts.find(x => x.id === contactId);
    if (!c) return;
    profileContactId = contactId;
    profileAvatar.src = c.avatar || defaultAvatar(c.name);
    profileName.textContent = c.name;
    profileStatus.textContent = presenceText(c);
    profileStatus.classList.toggle('online', !!c.online);
    const msgs = state.chats[contactId] || [];
    profileMsgCount.textContent = msgs.length;
    profilePhotoCount.textContent = msgs.filter(m => m.image).length;
    profileAudioCount.textContent = msgs.filter(m => m.audio).length;
    profilePinBtn.textContent = c.pinned ? '📌 Открепить чат' : '📌 Закрепить чат';
    profileMuteBtn.textContent = c.muted ? '🔔 Включить звук' : '🔕 Без звука';
    profileArchiveBtn.textContent = c.hidden ? '📤 Из архива' : '📦 В архив';
    profileModal.classList.remove('hidden');
  }
  function closeProfile() {
    profileModal.classList.add('hidden');
    profileContactId = null;
  }
  if (profileCloseBtn) profileCloseBtn.addEventListener('click', closeProfile);
  if (profileModal) profileModal.addEventListener('click', e => { if (e.target === profileModal) closeProfile(); });
  if (profilePinBtn) profilePinBtn.addEventListener('click', () => {
    const c = state.contacts.find(x => x.id === profileContactId);
    if (!c) return;
    c.pinned = !c.pinned;
    saveState();
    openProfile(profileContactId);
    renderChats();
  });
  if (profileMuteBtn) profileMuteBtn.addEventListener('click', () => {
    const c = state.contacts.find(x => x.id === profileContactId);
    if (!c) return;
    c.muted = !c.muted;
    saveState();
    openProfile(profileContactId);
    renderChats();
  });
  if (profileArchiveBtn) profileArchiveBtn.addEventListener('click', () => {
    const c = state.contacts.find(x => x.id === profileContactId);
    if (!c) return;
    c.hidden = !c.hidden;
    saveState();
    openProfile(profileContactId);
    renderChats();
  });
  if (profileClearBtn) profileClearBtn.addEventListener('click', () => {
    const c = state.contacts.find(x => x.id === profileContactId);
    if (!c) return;
    if (!confirm(`Очистить всю переписку с «${c.name}»?`)) return;
    state.chats[profileContactId] = [];
    delete c.pinnedIdx;
    saveState();
    if (activeChatId === profileContactId) { renderMessages(); renderPinnedBar(); }
    openProfile(profileContactId);
    renderChats();
  });
  if (profileDeleteBtn) profileDeleteBtn.addEventListener('click', () => {
    const id = profileContactId;
    closeProfile();
    deleteContact(id);
    if (activeChatId === id) closeChat();
  });

  // ========== SAVED MESSAGES ==========
  function ensureSavedContact() {
    if (state.contacts.find(c => c.id === SAVED_ID)) return;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'><defs><linearGradient id='gs' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%232B7FD8'/><stop offset='1' stop-color='%23FFD54F'/></linearGradient></defs><rect width='100%' height='100%' fill='url(%23gs)'/><text x='50%' y='58%' font-size='52' text-anchor='middle' fill='white' font-family='sans-serif' font-weight='600'>★</text></svg>`;
    state.contacts.unshift({
      id: SAVED_ID,
      name: 'Сохранённые',
      avatar: 'data:image/svg+xml;utf8,' + encodeURIComponent(svg.replace(/%23/g, '#')),
      online: true,
      lastSeen: Date.now(),
      unread: 0,
      special: true
    });
    state.chats[SAVED_ID] = state.chats[SAVED_ID] || [];
    saveState();
  }
  function saveToFavorites(messageIdx) {
    if (!state.favorites) state.favorites = [];
    const msgs = state.chats[activeChatId];
    if (!msgs || !msgs[messageIdx]) return;
    ensureSavedContact();
    const m = msgs[messageIdx];
    const fromContact = state.contacts.find(c => c.id === activeChatId);
    const newMsg = {
      from: 'me', ts: Date.now(), read: true,
      text: m.text || '',
      savedFrom: fromContact ? fromContact.name : ''
    };
    if (m.image) newMsg.image = m.image;
    if (m.audio) { newMsg.audio = m.audio; newMsg.audioDuration = m.audioDuration; }
    state.chats[SAVED_ID].push(newMsg);
    saveState();
    const saved = state.contacts.find(c => c.id === SAVED_ID);
    if (saved) showToast(saved, 'Сохранено в Избранное');
    renderChats();
  }
  function copyMessage(messageIdx) {
    const msgs = state.chats[activeChatId];
    if (!msgs || !msgs[messageIdx]) return;
    const m = msgs[messageIdx];
    const text = m.text || (m.image ? '[фото]' : (m.audio ? '[голосовое]' : ''));
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        const c = state.contacts.find(x => x.id === activeChatId);
        if (c) showToast(c, 'Скопировано в буфер');
      }).catch(() => {});
    }
  }

  // ========== SCROLL DOWN BUTTON ==========
  function updateScrollDownBtn() {
    if (!scrollDownBtn) return;
    const box = messagesBox;
    const isUp = box.scrollHeight - box.scrollTop - box.clientHeight > 200;
    scrollDownBtn.classList.toggle('hidden', !isUp);
    if (unseenWhileScrolledUp > 0) {
      scrollDownBadge.textContent = unseenWhileScrolledUp > 99 ? '99+' : String(unseenWhileScrolledUp);
      scrollDownBadge.classList.remove('hidden');
    } else {
      scrollDownBadge.classList.add('hidden');
    }
  }
  if (messagesBox) {
    messagesBox.addEventListener('scroll', () => {
      const box = messagesBox;
      const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
      if (atBottom) unseenWhileScrolledUp = 0;
      updateScrollDownBtn();
    });
  }
  if (scrollDownBtn) scrollDownBtn.addEventListener('click', () => {
    messagesBox.scrollTo({ top: messagesBox.scrollHeight, behavior: 'smooth' });
    unseenWhileScrolledUp = 0;
    updateScrollDownBtn();
  });

  // ---------- Init ----------
  ensureSavedContact();
  ensureStoriesState();
  renderProfile();
  renderLanguageSettings();
  renderContacts();
  renderStories();
  renderChats();
  applyToggles();
  updateTabBadge();
  applyAuthGate();
  setInterval(() => { ensureStoriesState(); renderStories(); }, 60000);
})();
