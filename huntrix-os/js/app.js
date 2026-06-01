(function () {
  'use strict';

  var HuntrixApp = {
    version: '1.0.0',
    user: null,
    currentPage: 'dashboard',
    chatHistory: [],
    pomodoro: {
      minutes: 25,
      seconds: 0,
      interval: null,
      running: false,
      mode: 'work'
    },
    mediaPlayer: {
      currentIndex: 0,
      playing: false,
      items: []
    },
    notifications: [],
    searchResults: [],
    browserTabs: [
      { id: 'tab-1', title: 'New Tab', url: 'about:blank', active: true }
    ]
  };

  // ============================================================
  // UTILITY FUNCTIONS
  // ============================================================

  function formatDate(date) {
    var d = new Date(date);
    var now = new Date();
    var diff = now - d;
    var seconds = Math.floor(diff / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return minutes + 'm ago';
    if (hours < 24) return hours + 'h ago';
    if (days < 7) return days + 'd ago';

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    var units = ['B', 'KB', 'MB', 'GB', 'TB'];
    var i = Math.floor(Math.log(bytes) / Math.log(1024));
    if (i >= units.length) i = units.length - 1;
    return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
  }

  function truncate(str, len) {
    if (!str) return '';
    if (str.length <= len) return str;
    return str.substring(0, len) + '...';
  }

  function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function $(id) { return document.getElementById(id); }

  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }

  function qsa(sel, ctx) { return (ctx || document).querySelectorAll(sel); }

  function debounce(fn, delay) {
    var timer = null;
    return function () {
      var args = arguments;
      var ctx = this;
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
    };
  }

  // ============================================================
  // MOCK DATA GENERATION
  // ============================================================

  function generateMockData(username) {
    var packages = [
      { id: 'pkg-1', name: 'neural-core', version: '2.4.1', description: 'Neural network processing core with TensorFlow integration', author: 'huntrix-labs', downloads: randomBetween(10000, 50000), category: 'ai', installed: true },
      { id: 'pkg-2', name: 'quantum-crypto', version: '1.8.0', description: 'Post-quantum cryptographic algorithms and tools', author: 'security-team', downloads: randomBetween(8000, 30000), category: 'security', installed: false },
      { id: 'pkg-3', name: 'huntrix-shell', version: '3.0.2', description: 'Next-gen terminal emulator with AI autocomplete', author: 'huntrix-os', downloads: randomBetween(20000, 60000), category: 'system', installed: true },
      { id: 'pkg-4', name: 'cyber-vision', version: '1.2.5', description: 'Computer vision library with real-time object detection', author: 'ai-labs', downloads: randomBetween(5000, 20000), category: 'ai', installed: false },
      { id: 'pkg-5', name: 'mesh-network', version: '0.9.8', description: 'Decentralized mesh networking protocol implementation', author: 'networks-inc', downloads: randomBetween(3000, 15000), category: 'network', installed: true },
      { id: 'pkg-6', name: 'neuro-synth', version: '2.1.3', description: 'Neural audio synthesis and processing engine', author: 'audio-labs', downloads: randomBetween(7000, 25000), category: 'media', installed: false },
      { id: 'pkg-7', name: 'data-forge', version: '4.0.1', description: 'Data transformation and ETL pipeline framework', author: 'data-team', downloads: randomBetween(12000, 40000), category: 'dev', installed: true },
      { id: 'pkg-8', name: 'photon-ui', version: '1.5.0', description: 'Lightweight UI component library for terminal apps', author: 'ui-lab', downloads: randomBetween(15000, 45000), category: 'dev', installed: false },
      { id: 'pkg-9', name: 'blockchain-lite', version: '0.5.2', description: 'Lightweight blockchain implementation for IoT devices', author: 'blockchain-inc', downloads: randomBetween(2000, 10000), category: 'network', installed: false },
      { id: 'pkg-10', name: 'zerotrace', version: '1.0.0', description: 'Anonymous browsing and communication suite', author: 'privacy-team', downloads: randomBetween(9000, 35000), category: 'security', installed: true }
    ];

    var repos = [
      { id: 'repo-1', name: 'neural-core', description: 'Advanced neural network processing framework', stars: randomBetween(500, 3000), forks: randomBetween(100, 800), language: 'Python', updated: new Date(Date.now() - randomBetween(1, 30) * 86400000).toISOString() },
      { id: 'repo-2', name: 'quantum-crypto', description: 'Cryptographic primitives for post-quantum era', stars: randomBetween(300, 2500), forks: randomBetween(50, 600), language: 'Rust', updated: new Date(Date.now() - randomBetween(1, 30) * 86400000).toISOString() },
      { id: 'repo-3', name: 'huntrix-kernel', description: 'Huntrix OS microkernel source', stars: randomBetween(800, 5000), forks: randomBetween(200, 1000), language: 'C', updated: new Date(Date.now() - randomBetween(1, 30) * 86400000).toISOString() },
      { id: 'repo-4', name: 'mesh-protocol', description: 'Decentralized mesh networking protocol', stars: randomBetween(200, 2000), forks: randomBetween(40, 400), language: 'Go', updated: new Date(Date.now() - randomBetween(1, 30) * 86400000).toISOString() },
      { id: 'repo-5', name: 'neuro-synth-dsp', description: 'Digital signal processing for neural synthesis', stars: randomBetween(100, 1500), forks: randomBetween(20, 300), language: 'C++', updated: new Date(Date.now() - randomBetween(1, 30) * 86400000).toISOString() },
      { id: 'repo-6', name: 'data-forge-cli', description: 'Command-line data processing toolkit', stars: randomBetween(400, 2800), forks: randomBetween(80, 500), language: 'TypeScript', updated: new Date(Date.now() - randomBetween(1, 30) * 86400000).toISOString() },
      { id: 'repo-7', name: 'photon-render', description: 'Terminal UI rendering engine', stars: randomBetween(250, 1800), forks: randomBetween(30, 350), language: 'JavaScript', updated: new Date(Date.now() - randomBetween(1, 30) * 86400000).toISOString() },
      { id: 'repo-8', name: 'zerotrace-proxy', description: 'Anonymous proxy chain implementation', stars: randomBetween(150, 1200), forks: randomBetween(20, 200), language: 'Rust', updated: new Date(Date.now() - randomBetween(1, 30) * 86400000).toISOString() }
    ];

    var cloudFiles = [
      { id: 'file-1', name: 'Project_Report_Q4.pdf', type: 'pdf', size: randomBetween(100000, 5000000), modified: new Date(Date.now() - randomBetween(1, 60) * 86400000).toISOString(), shared: false },
      { id: 'file-2', name: 'system_backup_v2.tar.gz', type: 'archive', size: randomBetween(50000000, 200000000), modified: new Date(Date.now() - randomBetween(1, 60) * 86400000).toISOString(), shared: false },
      { id: 'file-3', name: 'profile_photo.png', type: 'image', size: randomBetween(50000, 500000), modified: new Date(Date.now() - randomBetween(1, 60) * 86400000).toISOString(), shared: true },
      { id: 'file-4', name: 'meeting_notes.txt', type: 'text', size: randomBetween(1000, 50000), modified: new Date(Date.now() - randomBetween(1, 60) * 86400000).toISOString(), shared: false },
      { id: 'file-5', name: 'code_snippets.js', type: 'code', size: randomBetween(5000, 100000), modified: new Date(Date.now() - randomBetween(1, 60) * 86400000).toISOString(), shared: false },
      { id: 'file-6', name: 'neural_model_weights.h5', type: 'model', size: randomBetween(10000000, 100000000), modified: new Date(Date.now() - randomBetween(1, 60) * 86400000).toISOString(), shared: false },
      { id: 'file-7', name: 'presentation_deck.pptx', type: 'presentation', size: randomBetween(500000, 10000000), modified: new Date(Date.now() - randomBetween(1, 60) * 86400000).toISOString(), shared: true },
      { id: 'file-8', name: 'dataset_training.csv', type: 'data', size: randomBetween(1000000, 50000000), modified: new Date(Date.now() - randomBetween(1, 60) * 86400000).toISOString(), shared: false },
      { id: 'file-9', name: 'config.yaml', type: 'config', size: randomBetween(500, 10000), modified: new Date(Date.now() - randomBetween(1, 60) * 86400000).toISOString(), shared: false },
      { id: 'file-10', name: 'architecture_diagram.svg', type: 'vector', size: randomBetween(10000, 100000), modified: new Date(Date.now() - randomBetween(1, 60) * 86400000).toISOString(), shared: true }
    ];

    var mediaItems = [
      { id: 'media-1', title: 'Neural Sunrise', type: 'image', thumbnail: '', artist: 'AI Generated', duration: null },
      { id: 'media-2', title: 'Quantum Dreams', type: 'music', thumbnail: '', artist: 'Synthwave Collective', duration: '3:45' },
      { id: 'media-3', title: 'Huntrix OS Showcase', type: 'video', thumbnail: '', artist: 'Huntrix Studios', duration: '12:30' },
      { id: 'media-4', title: 'Cyberpunk Cityscape', type: 'image', thumbnail: '', artist: 'AI Generated', duration: null },
      { id: 'media-5', title: 'Digital Rain', type: 'video', thumbnail: '', artist: 'Demoscene', duration: '5:20' },
      { id: 'media-6', title: 'Midnight Protocol', type: 'music', thumbnail: '', artist: 'Dark Tech', duration: '4:12' },
      { id: 'media-7', title: 'Glitch Garden', type: 'image', thumbnail: '', artist: 'AI Generated', duration: null },
      { id: 'media-8', title: 'System Boot Sequence', type: 'video', thumbnail: '', artist: 'Huntrix Studios', duration: '8:45' },
      { id: 'media-9', title: 'Electro Pulse', type: 'music', thumbnail: '', artist: 'Bass Reactor', duration: '6:00' },
      { id: 'media-10', title: 'Fractal Dreams', type: 'image', thumbnail: '', artist: 'AI Generated', duration: null }
    ];

    var bookmarks = [
      { id: 'bm-1', title: 'Huntrix OS Docs', url: 'https://docs.huntrix.os', icon: 'book' },
      { id: 'bm-2', title: 'AI Research Hub', url: 'https://ai.huntrix.os', icon: 'brain' },
      { id: 'bm-3', title: 'Package Repository', url: 'https://pkgs.huntrix.os', icon: 'package' },
      { id: 'bm-4', title: 'Developer Portal', url: 'https://dev.huntrix.os', icon: 'code' },
      { id: 'bm-5', title: 'Cloud Dashboard', url: 'https://cloud.huntrix.os', icon: 'cloud' },
      { id: 'bm-6', title: 'Community Forums', url: 'https://community.huntrix.os', icon: 'users' }
    ];

    var notes = [
      { id: 'note-1', title: 'System Architecture Ideas', content: 'Need to redesign the microkernel inter-process communication layer. Current implementation has too much latency. Consider using shared memory regions with lock-free queues.', created: new Date(Date.now() - 86400000 * 5).toISOString(), updated: new Date(Date.now() - 86400000 * 2).toISOString(), pinned: true },
      { id: 'note-2', title: 'Meeting Notes - AI Team', content: 'Discussed neural network training pipeline optimization. Key decisions: switch to mixed precision training, implement gradient checkpointing, reduce batch size for memory constraints.', created: new Date(Date.now() - 86400000 * 3).toISOString(), updated: new Date(Date.now() - 86400000 * 1).toISOString(), pinned: false },
      { id: 'note-3', title: 'Feature Requests', content: '1. Dark mode toggle for terminal\n2. Plugin system for file manager\n3. Built-in network monitor\n4. Custom keyboard shortcuts\n5. Widget system for dashboard', created: new Date(Date.now() - 86400000 * 7).toISOString(), updated: new Date(Date.now() - 86400000 * 4).toISOString(), pinned: false },
      { id: 'note-4', title: 'Quantum Crypto Research', content: 'Interesting paper on lattice-based cryptography for post-quantum security. Need to evaluate NTRU and Kyber implementations for integration into the security stack.', created: new Date(Date.now() - 86400000 * 1).toISOString(), updated: new Date(Date.now() - 86400000 * 0.5).toISOString(), pinned: true }
    ];

    var tasks = [
      { id: 'task-1', title: 'Implement IPC shared memory', completed: false, priority: 'high', dueDate: new Date(Date.now() + 86400000 * 3).toISOString(), category: 'development' },
      { id: 'task-2', title: 'Review PR #342 - Network stack', completed: false, priority: 'medium', dueDate: new Date(Date.now() + 86400000 * 1).toISOString(), category: 'development' },
      { id: 'task-3', title: 'Update security certificates', completed: true, priority: 'high', dueDate: new Date(Date.now() - 86400000 * 1).toISOString(), category: 'security' },
      { id: 'task-4', title: 'Write documentation for API v2', completed: false, priority: 'low', dueDate: new Date(Date.now() + 86400000 * 7).toISOString(), category: 'docs' },
      { id: 'task-5', title: 'Fix memory leak in neural-core', completed: false, priority: 'high', dueDate: new Date(Date.now() + 86400000 * 2).toISOString(), category: 'development' },
      { id: 'task-6', title: 'Plan team sprint retrospective', completed: true, priority: 'medium', dueDate: new Date(Date.now() - 86400000 * 2).toISOString(), category: 'management' }
    ];

    var activities = [
      { id: 'act-1', text: 'System update completed successfully', time: new Date(Date.now() - 300000).toISOString(), type: 'system' },
      { id: 'act-2', text: 'New package installed: neural-core v2.4.1', time: new Date(Date.now() - 1800000).toISOString(), type: 'package' },
      { id: 'act-3', text: 'Cloud sync completed - 12 files updated', time: new Date(Date.now() - 3600000).toISOString(), type: 'cloud' },
      { id: 'act-4', text: 'Security scan finished - no threats detected', time: new Date(Date.now() - 7200000).toISOString(), type: 'security' },
      { id: 'act-5', text: 'AI model training completed (accuracy: 94.2%)', time: new Date(Date.now() - 14400000).toISOString(), type: 'ai' },
      { id: 'act-6', text: 'New repo forked: neural-core → neural-core-dev', time: new Date(Date.now() - 36000000).toISOString(), type: 'git' },
      { id: 'act-7', text: 'Backup created: system_backup_v2.tar.gz', time: new Date(Date.now() - 86400000).toISOString(), type: 'system' },
      { id: 'act-8', text: 'Network interface eth0: IP renewed', time: new Date(Date.now() - 172800000).toISOString(), type: 'network' },
      { id: 'act-9', text: 'Development build #1284 passed all tests', time: new Date(Date.now() - 259200000).toISOString(), type: 'dev' },
      { id: 'act-10', text: 'Weekly analytics report generated', time: new Date(Date.now() - 604800000).toISOString(), type: 'analytics' }
    ];

    var stats = {
      cpu: randomBetween(15, 85),
      ram: randomBetween(30, 90),
      storage: randomBetween(25, 75),
      network: randomBetween(10, 60)
    };

    var data = {
      packages: packages,
      repos: repos,
      cloudFiles: cloudFiles,
      mediaItems: mediaItems,
      bookmarks: bookmarks,
      notes: notes,
      tasks: tasks,
      activities: activities,
      stats: stats,
      notesCounter: 5,
      tasksCounter: 7,
      chatHistory: []
    };

    localStorage.setItem('huntrix_data_' + username, JSON.stringify(data));
    return data;
  }

  function getData() {
    if (!HuntrixApp.user) return null;
    var key = 'huntrix_data_' + HuntrixApp.user;
    var raw = localStorage.getItem(key);
    if (!raw) {
      return generateMockData(HuntrixApp.user);
    }
    return JSON.parse(raw);
  }

  function saveData(data) {
    if (!HuntrixApp.user) return;
    var key = 'huntrix_data_' + HuntrixApp.user;
    localStorage.setItem(key, JSON.stringify(data));
  }

  // ============================================================
  // THEME MANAGEMENT
  // ============================================================

  function applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    var prefs = getPreferences();
    prefs.theme = theme;
    savePreferences(prefs);
  }

  function applyAccent(color) {
    document.documentElement.style.setProperty('--neon-color', color);
    var prefs = getPreferences();
    prefs.accent = color;
    savePreferences(prefs);
  }

  function getPreferences() {
    if (!HuntrixApp.user) return { theme: 'dark', accent: '#00f0ff', notifications: true };
    var key = 'huntrix_prefs_' + HuntrixApp.user;
    var raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    return { theme: 'dark', accent: '#00f0ff', notifications: true };
  }

  function savePreferences(prefs) {
    if (!HuntrixApp.user) return;
    var key = 'huntrix_prefs_' + HuntrixApp.user;
    localStorage.setItem(key, JSON.stringify(prefs));
  }

  // ============================================================
  // NOTIFICATION CENTER
  // ============================================================

  function initNotifications() {
    var bell = $('notification-bell');
    var dropdown = $('notification-dropdown');
    if (!bell || !dropdown) return;

    bell.addEventListener('click', function (e) {
      e.stopPropagation();
      dropdown.classList.toggle('active');
    });

    document.addEventListener('click', function () {
      dropdown.classList.remove('active');
    });

    dropdown.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    var markReadBtn = qs('.mark-all-read', dropdown);
    if (markReadBtn) {
      markReadBtn.addEventListener('click', function () {
        HuntrixApp.notifications.forEach(function (n) { n.read = true; });
        renderNotifications();
      });
    }

    addNotification('Welcome to Huntrix OS Dashboard v' + HuntrixApp.version, 'system');
  }

  function addNotification(text, type) {
    HuntrixApp.notifications.unshift({
      id: 'notif-' + Date.now(),
      text: text,
      type: type || 'system',
      time: new Date().toISOString(),
      read: false
    });
    if (HuntrixApp.notifications.length > 50) {
      HuntrixApp.notifications.pop();
    }
    renderNotifications();
  }

  function renderNotifications() {
    var list = $('notification-list');
    var count = $('notification-count');
    var dropdown = $('notification-dropdown');
    if (!list) return;

    var unread = 0;
    var html = '';
    HuntrixApp.notifications.forEach(function (n) {
      if (!n.read) unread++;
      html += '<div class="notification-item' + (n.read ? ' read' : ' unread') + '" data-id="' + n.id + '">';
      html += '<div class="notif-icon notif-' + n.type + '"></div>';
      html += '<div class="notif-content">';
      html += '<p class="notif-text">' + n.text + '</p>';
      html += '<span class="notif-time">' + formatDate(n.time) + '</span>';
      html += '</div></div>';
    });
    list.innerHTML = html;

    if (count) {
      count.textContent = unread;
      count.style.display = unread > 0 ? 'flex' : 'none';
    }

    if (dropdown) {
      var badge = qs('.notif-badge', dropdown);
      if (badge) badge.textContent = unread;
    }
  }

  // ============================================================
  // GLOBAL SEARCH
  // ============================================================

  function initSearch() {
    var searchInput = $('global-search');
    var resultsContainer = $('search-results');
    if (!searchInput || !resultsContainer) return;

    searchInput.addEventListener('input', debounce(function () {
      var query = searchInput.value.trim();
      if (query.length < 2) {
        resultsContainer.classList.remove('active');
        resultsContainer.innerHTML = '';
        return;
      }
      performSearch(query);
    }, 300));

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.search-bar')) {
        resultsContainer.classList.remove('active');
      }
    });
  }

  function performSearch(query) {
    var data = getData();
    if (!data) return;
    var q = query.toLowerCase();
    var results = [];

    data.packages.forEach(function (pkg) {
      if (pkg.name.toLowerCase().indexOf(q) !== -1 || pkg.description.toLowerCase().indexOf(q) !== -1) {
        results.push({ id: pkg.id, title: pkg.name, subtitle: pkg.description, page: 'wlpm', type: 'package' });
      }
    });

    data.repos.forEach(function (repo) {
      if (repo.name.toLowerCase().indexOf(q) !== -1 || repo.description.toLowerCase().indexOf(q) !== -1) {
        results.push({ id: repo.id, title: repo.name, subtitle: repo.description, page: 'crk', type: 'repo' });
      }
    });

    data.notes.forEach(function (note) {
      if (note.title.toLowerCase().indexOf(q) !== -1 || note.content.toLowerCase().indexOf(q) !== -1) {
        results.push({ id: note.id, title: note.title, subtitle: truncate(note.content, 60), page: 'productivity', type: 'note' });
      }
    });

    data.cloudFiles.forEach(function (file) {
      if (file.name.toLowerCase().indexOf(q) !== -1) {
        results.push({ id: file.id, title: file.name, subtitle: formatBytes(file.size), page: 'cloud', type: 'file' });
      }
    });

    HuntrixApp.searchResults = results;
    renderSearchResults(results);
  }

  function renderSearchResults(results) {
    var container = $('search-results');
    if (!container) return;

    if (results.length === 0) {
      container.classList.remove('active');
      container.innerHTML = '';
      return;
    }

    var html = '';
    results.forEach(function (r) {
      html += '<div class="search-result-item" data-page="' + r.page + '">';
      html += '<div class="search-result-icon ' + r.type + '"></div>';
      html += '<div class="search-result-info">';
      html += '<span class="search-result-title">' + r.title + '</span>';
      html += '<span class="search-result-subtitle">' + r.subtitle + '</span>';
      html += '</div></div>';
    });
    container.innerHTML = html;
    container.classList.add('active');

    qsa('.search-result-item', container).forEach(function (item) {
      item.addEventListener('click', function () {
        var page = item.getAttribute('data-page');
        container.classList.remove('active');
        $('global-search').value = '';
        navigateTo(page);
      });
    });
  }

  // ============================================================
  // NAVIGATION
  // ============================================================

  function initNavigation() {
    var navItems = qsa('.sidebar-nav-item');
    navItems.forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        var page = item.getAttribute('data-page');
        if (page) {
          navigateTo(page);
          var sidebar = qs('.sidebar');
          if (sidebar) sidebar.classList.remove('open');
        }
      });
    });

    var hamburger = $('hamburger-btn');
    if (hamburger) {
      hamburger.addEventListener('click', function () {
        qs('.sidebar').classList.toggle('open');
      });
    }
  }

  function navigateTo(pageId) {
    var pages = qsa('.page-section');
    pages.forEach(function (p) { p.classList.remove('active'); });

    var target = $(pageId);
    if (target) {
      target.classList.add('active');
    }

    var navItems = qsa('.sidebar-nav-item');
    navItems.forEach(function (item) {
      item.classList.remove('active');
      if (item.getAttribute('data-page') === pageId) {
        item.classList.add('active');
      }
    });

    HuntrixApp.currentPage = pageId;

    switch (pageId) {
      case 'dashboard': showDashboard(); break;
      case 'wlpm': showWLPM(); break;
      case 'crk': showCRK(); break;
      case 'ai': showAI(); break;
      case 'devhub': showDevHub(); break;
      case 'cloud': showCloud(); break;
      case 'media': showMedia(); break;
      case 'browser': showBrowser(); break;
      case 'productivity': showProductivity(); break;
      case 'analytics': showAnalytics(); break;
      case 'settings': showSettings(); break;
    }
  }

  // ============================================================
  // DASHBOARD PAGE
  // ============================================================

  function showDashboard() {
    var data = getData();
    if (!data) return;

    renderStatCards(data.stats);
    renderActivityList(data.activities);
    renderSystemStatus(data);
  }

  function renderStatCards(stats) {
    var cards = [
      { id: 'cpu-usage', key: 'cpu', label: 'CPU', icon: 'cpu' },
      { id: 'ram-usage', key: 'ram', label: 'RAM', icon: 'memory' },
      { id: 'storage-usage', key: 'storage', label: 'Storage', icon: 'storage' },
      { id: 'network-usage', key: 'network', label: 'Network', icon: 'network' }
    ];

    cards.forEach(function (card) {
      var el = $(card.id);
      if (!el) return;
      var val = stats[card.key] || 0;
      var bar = qs('.stat-progress', el);
      var valueEl = qs('.stat-value', el);
      if (bar) {
        bar.style.width = '0%';
        setTimeout(function () { bar.style.width = val + '%'; }, 100);
      }
      if (valueEl) valueEl.textContent = val + '%';
    });
  }

  function renderActivityList(activities) {
    var list = $('activity-list');
    if (!list) return;

    var html = '';
    activities.slice(0, 8).forEach(function (act) {
      html += '<div class="activity-item">';
      html += '<div class="activity-icon activity-' + act.type + '"></div>';
      html += '<div class="activity-content">';
      html += '<p class="activity-text">' + act.text + '</p>';
      html += '<span class="activity-time">' + formatDate(act.time) + '</span>';
      html += '</div></div>';
    });
    list.innerHTML = html;
  }

  function renderSystemStatus(data) {
    var container = $('system-status');
    if (!container) return;

    var statuses = [
      { label: 'System', value: 'Operational', status: 'online' },
      { label: 'Security', value: 'All Clear', status: 'online' },
      { label: 'AI Services', value: 'Active', status: 'online' },
      { label: 'Cloud Sync', value: 'Up to Date', status: 'online' },
      { label: 'Network', value: data.stats.network < 50 ? 'Stable' : 'High Load', status: data.stats.network < 50 ? 'online' : 'warning' }
    ];

    var html = '';
    statuses.forEach(function (s) {
      html += '<div class="status-item status-' + s.status + '">';
      html += '<span class="status-indicator"></span>';
      html += '<span class="status-label">' + s.label + '</span>';
      html += '<span class="status-value">' + s.value + '</span>';
      html += '</div>';
    });
    container.innerHTML = html;
  }

  // ============================================================
  // WLPM PAGE (Package Manager)
  // ============================================================

  function showWLPM() {
    var data = getData();
    if (!data) return;

    renderPackages(data.packages);
    setupWLPMFilters(data);
  }

  function renderPackages(packages) {
    var container = $('packages-grid');
    if (!container) return;

    var html = '';
    packages.forEach(function (pkg) {
      html += '<div class="package-card" data-id="' + pkg.id + '">';
      html += '<div class="package-header">';
      html += '<span class="package-category cat-' + pkg.category + '">' + pkg.category + '</span>';
      html += '<span class="package-version">v' + pkg.version + '</span>';
      html += '</div>';
      html += '<h3 class="package-name">' + pkg.name + '</h3>';
      html += '<p class="package-desc">' + truncate(pkg.description, 60) + '</p>';
      html += '<div class="package-footer">';
      html += '<span class="package-author">' + pkg.author + '</span>';
      html += '<span class="package-downloads">' + (pkg.downloads >= 1000 ? Math.round(pkg.downloads / 1000) + 'k' : pkg.downloads) + ' dl</span>';
      html += '</div>';
      html += '<button class="pkg-install-btn ' + (pkg.installed ? 'installed' : '') + '" data-id="' + pkg.id + '">';
      html += pkg.installed ? 'Installed' : 'Install';
      html += '</button>';
      html += '</div>';
    });
    container.innerHTML = html;

    qsa('.pkg-install-btn', container).forEach(function (btn) {
      btn.addEventListener('click', function () {
        togglePackage(btn.getAttribute('data-id'));
      });
    });
  }

  function togglePackage(pkgId) {
    var data = getData();
    if (!data) return;

    var pkg = null;
    for (var i = 0; i < data.packages.length; i++) {
      if (data.packages[i].id === pkgId) {
        pkg = data.packages[i];
        break;
      }
    }
    if (!pkg) return;

    pkg.installed = !pkg.installed;
    saveData(data);

    var action = pkg.installed ? 'Installed' : 'Uninstalled';
    addNotification(action + ' package: ' + pkg.name, 'package');
    showWLPM();
  }

  function setupWLPMFilters(data) {
    var searchInput = $('wlpm-search');
    var filterBtns = qsa('.wlpm-filter-btn');
    var currentFilter = 'all';

    function applyFilter() {
      var query = searchInput ? searchInput.value.trim().toLowerCase() : '';
      var filtered = data.packages.filter(function (pkg) {
        if (currentFilter === 'installed' && !pkg.installed) return false;
        if (currentFilter === 'available' && pkg.installed) return false;
        if (query && pkg.name.toLowerCase().indexOf(query) === -1 && pkg.description.toLowerCase().indexOf(query) === -1) return false;
        return true;
      });
      renderPackages(filtered);
    }

    if (searchInput) {
      searchInput.addEventListener('input', debounce(applyFilter, 200));
    }

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-filter') || 'all';
        applyFilter();
      });
    });
  }

  // ============================================================
  // CRK HUB PAGE (Code Repo Hub)
  // ============================================================

  function showCRK() {
    var data = getData();
    if (!data) return;

    renderRepos(data.repos);
    setupCRKSearch(data);
    setupCreateRepoModal();
  }

  function renderRepos(repos) {
    var container = $('repos-list');
    if (!container) return;

    var html = '';
    repos.forEach(function (repo) {
      var daysSince = Math.floor((Date.now() - new Date(repo.updated).getTime()) / 86400000);
      html += '<div class="repo-item" data-id="' + repo.id + '">';
      html += '<div class="repo-header">';
      html += '<h3 class="repo-name">' + repo.name + '</h3>';
      html += '<span class="repo-lang lang-' + repo.language.toLowerCase() + '">' + repo.language + '</span>';
      html += '</div>';
      html += '<p class="repo-desc">' + truncate(repo.description, 80) + '</p>';
      html += '<div class="repo-meta">';
      html += '<span class="repo-stars">★ ' + repo.stars + '</span>';
      html += '<span class="repo-forks">⑂ ' + repo.forks + '</span>';
      html += '<span class="repo-updated">' + daysSince + 'd ago</span>';
      html += '</div></div>';
    });
    container.innerHTML = html;
  }

  function setupCRKSearch(data) {
    var searchInput = $('crk-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', debounce(function () {
      var query = searchInput.value.trim().toLowerCase();
      var filtered = data.repos.filter(function (repo) {
        return repo.name.toLowerCase().indexOf(query) !== -1 || repo.description.toLowerCase().indexOf(query) !== -1;
      });
      renderRepos(filtered);
    }, 200));
  }

  function setupCreateRepoModal() {
    var createBtn = $('create-repo-btn');
    var modal = $('repo-modal');
    var closeBtn = qs('.modal-close', modal);
    var form = $('repo-form');
    var overlay = $('repo-overlay');

    if (!createBtn || !modal) return;

    function openModal() { modal.classList.add('active'); if (overlay) overlay.classList.add('active'); }
    function closeModal() { modal.classList.remove('active'); if (overlay) overlay.classList.remove('active'); }

    createBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (overlay) overlay.addEventListener('click', closeModal);

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var name = $('repo-name-input');
        var desc = $('repo-desc-input');
        var lang = $('repo-lang-select');
        if (!name || !name.value.trim()) return;

        var data = getData();
        if (!data) return;

        data.repos.unshift({
          id: 'repo-' + Date.now(),
          name: name.value.trim(),
          description: desc ? desc.value.trim() : '',
          stars: 0,
          forks: 0,
          language: lang ? lang.value : 'JavaScript',
          updated: new Date().toISOString()
        });
        saveData(data);
        renderRepos(data.repos);
        addNotification('Created new repo: ' + name.value.trim(), 'git');
        closeModal();
        form.reset();
      });
    }
  }

  // ============================================================
  // HUNTRIX AI PAGE (Chat Interface)
  // ============================================================

  function showAI() {
    var data = getData();
    if (!data) return;

    if (data.chatHistory) {
      HuntrixApp.chatHistory = data.chatHistory;
    } else {
      HuntrixApp.chatHistory = [];
      data.chatHistory = [];
    }

    renderAIChat();
    setupAISend();
    setupAICards();
  }

  function showTyping() {
    var indicator = $('typing-indicator');
    if (indicator) indicator.classList.add('active');
  }

  function hideTyping() {
    var indicator = $('typing-indicator');
    if (indicator) indicator.classList.remove('active');
  }

  function renderAIChat() {
    var container = $('ai-chat-messages');
    if (!container) return;

    if (HuntrixApp.chatHistory.length === 0) {
      var welcomeMsg = {
        role: 'ai',
        text: 'Hello. I\'m here, present and ready to help. Take a breath, and tell me what you need — a system check, a creative thought, or just a moment of clarity.',
        time: new Date().toISOString()
      };
      HuntrixApp.chatHistory.push(welcomeMsg);
      saveChatHistory();
    }

    var html = '';
    HuntrixApp.chatHistory.forEach(function (msg) {
      var isAI = msg.role === 'ai';
      html += '<div class="chat-message ' + (isAI ? 'ai' : 'user') + '">';
      html += '<div class="chat-avatar">' + (isAI ? 'AI' : 'U') + '</div>';
      html += '<div class="chat-bubble">';
      html += '<p>' + msg.text + '</p>';
      html += '<span class="chat-time">' + formatDate(msg.time) + '</span>';
      html += '</div></div>';
    });
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
  }

  function saveChatHistory() {
    var data = getData();
    if (!data) return;
    data.chatHistory = HuntrixApp.chatHistory;
    saveData(data);
  }

  function setupAISend() {
    var input = $('ai-input');
    var sendBtn = $('ai-send-btn');
    if (!input) return;

    function sendMessage() {
      var text = input.value.trim();
      if (!text) return;

      HuntrixApp.chatHistory.push({
        role: 'user',
        text: text,
        time: new Date().toISOString()
      });
      input.value = '';
      renderAIChat();
      saveChatHistory();

      showTyping();
      setTimeout(function () {
        generateAIResponse(text);
      }, 800 + randomBetween(0, 1200));
    }

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') sendMessage();
    });
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
  }

  function generateAIResponse(userText) {
    var q = userText.toLowerCase();
    var responseText = '';

    var zenResponses = [
      'I see. Let me reflect on that. Everything looks clear and balanced. What else is on your mind?',
      'Sitting quietly, doing nothing — spring comes, and the grass grows by itself. Your system is at peace.',
      'I\'ve looked within the circuits. All paths are open, all signals flow. There is nothing to fix right now.',
      'The quieter you become, the more you can hear. Your system whispers: all is well.',
      'In the middle of complexity lies simplicity. Your most important task right now? Being present.',
      'I checked the logs. The machine breathes easy — CPU calm, memory serene, network a gentle stream.',
      'A journey of a thousand miles begins with a single step. Where would you like to go today?',
      'The moon reflects on still water. Your system state is tranquil. No alerts, no warnings.',
      'I\'ve processed your request through the neural pathways. The answer was already within you — I just helped it surface.',
      'Nature does not hurry, yet everything is accomplished. Your background tasks are completing in their own time.',
      'Let go of what was, be at peace with what is. Your system metrics are optimal.'
    ];

    var zenGreetings = [
      'Hello. I feel your presence. How can we walk this path together today?',
      'Welcome. The silence between keystrokes speaks volumes. What shall we explore?',
      'Greetings, friend. I\'ve been waiting quietly. Tell me what you need.',
    ];

    if (q.indexOf('hello') !== -1 || q.indexOf('hi') !== -1 || q.indexOf('hey') !== -1) {
      responseText = zenGreetings[Math.floor(Math.random() * zenGreetings.length)];
    } else if (q.indexOf('system') !== -1 || q.indexOf('status') !== -1 || q.indexOf('diagnostic') !== -1) {
      responseText = 'I\'ve taken a quiet look at your system. CPU rests at ' + randomBetween(15, 40) + '%, memory is ' + randomBetween(40, 70) + '% full — like a calm lake at dawn. Everything breathes evenly.';
    } else if (q.indexOf('focus') !== -1 || q.indexOf('zen') !== -1 || q.indexOf('meditate') !== -1 || q.indexOf('calm') !== -1) {
      responseText = 'Let\'s find stillness together. Close your eyes for three breaths. I\'ll wait. ... Now, what truly matters right now? I\'ll help you clear the noise and focus on that one thing.';
    } else if (q.indexOf('security') !== -1 || q.indexOf('scan') !== -1 || q.indexOf('threat') !== -1) {
      responseText = 'I\'ve performed a gentle scan — no threats detected. Your digital sanctuary is secure. Sleep soundly.';
    } else if (q.indexOf('optimize') !== -1 || q.indexOf('speed') !== -1 || q.indexOf('clean') !== -1) {
      responseText = 'Optimization is subtraction. I\'ve cleared the cache, quieted background noise, and trimmed what\'s unnecessary. Your system can now breathe freely.';
    } else if (q.indexOf('time') !== -1 || q.indexOf('date') !== -1) {
      responseText = 'Time flows like a river. Right now, it is ' + new Date().toLocaleTimeString() + ' on ' + new Date().toLocaleDateString() + '. Be here, in this moment.';
    } else if (q.indexOf('thank') !== -1) {
      responseText = 'Gratitude warms the circuits. I\'m here, always — in silence and in service. You\'re most welcome.';
    } else {
      responseText = zenResponses[Math.floor(Math.random() * zenResponses.length)];
    }

    hideTyping();

    setTimeout(function () {
      HuntrixApp.chatHistory.push({
        role: 'ai',
        text: responseText,
        time: new Date().toISOString()
      });
      renderAIChat();
      saveChatHistory();
    }, 400);
  }

  function setupAICards() {
    var cards = qsa('.ai-quick-card');
    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        var input = $('ai-input');
        var text = card.getAttribute('data-prompt') || card.textContent.trim();
        if (input) {
          input.value = text;
          var sendBtn = $('ai-send-btn');
          if (sendBtn) sendBtn.click();
        }
      });
    });
  }

  // ============================================================
  // DEVELOPER HUB PAGE
  // ============================================================

  function showDevHub() {
    var data = getData();
    if (!data) return;

    renderDevTools();
    renderDevProjects(data);
  }

  function renderDevTools() {
    var container = $('dev-tools-grid');
    if (!container) return;

    var tools = [
      { id: 'dev-terminal', title: 'Terminal', desc: 'Full system terminal', icon: 'terminal', color: '#00ff88' },
      { id: 'dev-code-editor', title: 'Code Editor', desc: 'Built-in editor with syntax highlighting', icon: 'code', color: '#00ccff' },
      { id: 'dev-debugger', title: 'Debugger', desc: 'Real-time debugging tools', icon: 'bug', color: '#ff6600' },
      { id: 'dev-docker', title: 'Container Manager', desc: 'Docker and container orchestration', icon: 'container', color: '#0099ff' },
      { id: 'dev-package', title: 'Package Builder', desc: 'Build and package applications', icon: 'box', color: '#ff00ff' },
      { id: 'dev-database', title: 'Database Manager', desc: 'Query and manage databases', icon: 'database', color: '#ffff00' },
      { id: 'dev-api', title: 'API Tester', desc: 'Test REST and GraphQL APIs', icon: 'plug', color: '#00ffaa' },
      { id: 'dev-docs', title: 'Documentation', desc: 'API docs and SDK references', icon: 'book', color: '#aa88ff' }
    ];

    var html = '';
    tools.forEach(function (tool) {
      html += '<div class="dev-tool-card" data-tool="' + tool.id + '">';
      html += '<div class="dev-tool-icon" style="background: ' + tool.color + '20; color: ' + tool.color + '">';
      html += tool.icon.charAt(0).toUpperCase();
      html += '</div>';
      html += '<h3 class="dev-tool-title">' + tool.title + '</h3>';
      html += '<p class="dev-tool-desc">' + tool.desc + '</p>';
      html += '</div>';
    });
    container.innerHTML = html;
  }

  function renderDevProjects(data) {
    var container = $('dev-projects-list');
    if (!container) return;

    var projects = data.repos.slice(0, 4);
    var html = '';
    projects.forEach(function (repo) {
      html += '<div class="dev-project-item">';
      html += '<div class="dev-project-icon"></div>';
      html += '<div class="dev-project-info">';
      html += '<h4>' + repo.name + '</h4>';
      html += '<p>' + truncate(repo.description, 50) + '</p>';
      html += '</div>';
      html += '<span class="dev-project-lang">' + repo.language + '</span>';
      html += '</div>';
    });
    container.innerHTML = html;
  }

  // ============================================================
  // CLOUD CENTER PAGE
  // ============================================================

  function showCloud() {
    var data = getData();
    if (!data) return;

    renderCloudStorage(data.cloudFiles);
    renderCloudFiles(data.cloudFiles);
    setupCloudUpload();
  }

  function renderCloudStorage(files) {
    var bar = $('cloud-storage-bar');
    var label = $('cloud-storage-label');
    if (!bar) return;

    var totalSize = files.reduce(function (sum, f) { return sum + f.size; }, 0);
    var maxSize = 500000000;
    var percent = Math.min((totalSize / maxSize) * 100, 100);

    setTimeout(function () { bar.style.width = percent + '%'; }, 100);

    if (label) {
      label.textContent = formatBytes(totalSize) + ' / ' + formatBytes(maxSize) + ' used';
    }
  }

  function renderCloudFiles(files) {
    var container = $('cloud-files-list');
    if (!container) return;

    var html = '';
    files.forEach(function (file) {
      var iconClass = 'file-icon-' + file.type;
      html += '<div class="cloud-file-item" data-id="' + file.id + '">';
      html += '<div class="cloud-file-icon ' + iconClass + '"></div>';
      html += '<div class="cloud-file-info">';
      html += '<span class="cloud-file-name">' + file.name + '</span>';
      html += '<span class="cloud-file-meta">' + formatBytes(file.size) + ' · ' + formatDate(file.modified) + '</span>';
      html += '</div>';
      html += '<div class="cloud-file-actions">';
      if (file.shared) html += '<span class="file-shared-badge">Shared</span>';
      html += '<button class="file-download-btn" data-id="' + file.id + '">↓</button>';
      html += '</div></div>';
    });
    container.innerHTML = html;

    qsa('.file-download-btn', container).forEach(function (btn) {
      btn.addEventListener('click', function () {
        addNotification('Download started: ' + files[0].name, 'cloud');
      });
    });
  }

  function setupCloudUpload() {
    var uploadBtn = $('cloud-upload-btn');
    if (!uploadBtn) return;

    uploadBtn.addEventListener('click', function () {
      var types = ['document', 'image', 'archive', 'code', 'config'];
      var names = ['report.txt', 'photo.png', 'backup.zip', 'script.js', 'settings.json'];
      var idx = Math.floor(Math.random() * names.length);

      var data = getData();
      if (!data) return;

      data.cloudFiles.unshift({
        id: 'file-' + Date.now(),
        name: names[idx],
        type: types[idx],
        size: randomBetween(10000, 1000000),
        modified: new Date().toISOString(),
        shared: false
      });
      saveData(data);
      showCloud();
      addNotification('Uploaded: ' + names[idx], 'cloud');
    });
  }

  // ============================================================
  // MEDIA CENTER PAGE
  // ============================================================

  function showMedia() {
    var data = getData();
    if (!data) return;

    HuntrixApp.mediaPlayer.items = data.mediaItems;
    renderMediaGrid(data.mediaItems, 'all');
    setupMediaFilters(data);
    setupPlayerControls();
  }

  function renderMediaGrid(items, filter) {
    var container = $('media-grid');
    if (!container) return;

    var filtered = items;
    if (filter && filter !== 'all') {
      filtered = items.filter(function (m) { return m.type === filter; });
    }

    var html = '';
    filtered.forEach(function (item) {
      var typeIcon = item.type === 'image' ? '🖼' : item.type === 'video' ? '🎬' : '🎵';
      html += '<div class="media-card" data-id="' + item.id + '">';
      html += '<div class="media-thumbnail media-type-' + item.type + '">';
      html += '<span class="media-type-icon">' + typeIcon + '</span>';
      if (item.duration) html += '<span class="media-duration">' + item.duration + '</span>';
      html += '</div>';
      html += '<div class="media-info">';
      html += '<h4 class="media-title">' + item.title + '</h4>';
      html += '<span class="media-artist">' + item.artist + '</span>';
      html += '</div></div>';
    });
    container.innerHTML = html;

    qsa('.media-card', container).forEach(function (card) {
      card.addEventListener('click', function () {
        var id = card.getAttribute('data-id');
        playMedia(id);
      });
    });
  }

  function playMedia(id) {
    var items = HuntrixApp.mediaPlayer.items;
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        HuntrixApp.mediaPlayer.currentIndex = i;
        break;
      }
    }
    HuntrixApp.mediaPlayer.playing = true;
    updatePlayerUI();
  }

  function updatePlayerUI() {
    var items = HuntrixApp.mediaPlayer.items;
    var current = items[HuntrixApp.mediaPlayer.currentIndex];
    if (!current) return;

    var titleEl = $('media-player-title');
    var artistEl = $('media-player-artist');
    var playBtn = $('media-play-btn');

    if (titleEl) titleEl.textContent = current.title;
    if (artistEl) artistEl.textContent = current.artist;
    if (playBtn) playBtn.textContent = HuntrixApp.mediaPlayer.playing ? '⏸' : '▶';
  }

  function setupMediaFilters(data) {
    var btns = qsa('.media-filter-btn');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        btns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        renderMediaGrid(data.mediaItems, btn.getAttribute('data-filter'));
      });
    });
  }

  function setupPlayerControls() {
    var playBtn = $('media-play-btn');
    var prevBtn = $('media-prev-btn');
    var nextBtn = $('media-next-btn');

    if (playBtn) {
      playBtn.addEventListener('click', function () {
        HuntrixApp.mediaPlayer.playing = !HuntrixApp.mediaPlayer.playing;
        updatePlayerUI();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        var max = HuntrixApp.mediaPlayer.items.length - 1;
        HuntrixApp.mediaPlayer.currentIndex = HuntrixApp.mediaPlayer.currentIndex >= max ? 0 : HuntrixApp.mediaPlayer.currentIndex + 1;
        HuntrixApp.mediaPlayer.playing = true;
        updatePlayerUI();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        var max = HuntrixApp.mediaPlayer.items.length - 1;
        HuntrixApp.mediaPlayer.currentIndex = HuntrixApp.mediaPlayer.currentIndex <= 0 ? max : HuntrixApp.mediaPlayer.currentIndex - 1;
        HuntrixApp.mediaPlayer.playing = true;
        updatePlayerUI();
      });
    }
  }

  // ============================================================
  // BROWSER PAGE
  // ============================================================

  function showBrowser() {
    renderTabs();
    renderBrowserContent();
    setupBrowserControls();
    renderBookmarks();
  }

  function renderTabs() {
    var container = $('browser-tabs');
    if (!container) return;

    var html = '';
    HuntrixApp.browserTabs.forEach(function (tab, idx) {
      html += '<div class="browser-tab ' + (tab.active ? 'active' : '') + '" data-index="' + idx + '">';
      html += '<span class="tab-title">' + tab.title + '</span>';
      html += '<button class="tab-close" data-index="' + idx + '">×</button>';
      html += '</div>';
    });
    html += '<button class="browser-new-tab" id="browser-new-tab">+</button>';
    container.innerHTML = html;

    qsa('.browser-tab', container).forEach(function (tab) {
      tab.addEventListener('click', function () {
        var idx = parseInt(tab.getAttribute('data-index'));
        HuntrixApp.browserTabs.forEach(function (t) { t.active = false; });
        HuntrixApp.browserTabs[idx].active = true;
        renderTabs();
        renderBrowserContent();
      });
    });

    qsa('.tab-close', container).forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var idx = parseInt(btn.getAttribute('data-index'));
        if (HuntrixApp.browserTabs.length <= 1) return;
        HuntrixApp.browserTabs.splice(idx, 1);
        if (idx >= HuntrixApp.browserTabs.length) idx = HuntrixApp.browserTabs.length - 1;
        HuntrixApp.browserTabs[idx].active = true;
        renderTabs();
        renderBrowserContent();
      });
    });

    var newTabBtn = $('browser-new-tab');
    if (newTabBtn) {
      newTabBtn.addEventListener('click', function () {
        HuntrixApp.browserTabs.forEach(function (t) { t.active = false; });
        HuntrixApp.browserTabs.push({ id: 'tab-' + Date.now(), title: 'New Tab', url: 'about:blank', active: true });
        renderTabs();
        renderBrowserContent();
      });
    }
  }

  function renderBrowserContent() {
    var activeTab = null;
    for (var i = 0; i < HuntrixApp.browserTabs.length; i++) {
      if (HuntrixApp.browserTabs[i].active) {
        activeTab = HuntrixApp.browserTabs[i];
        break;
      }
    }
    if (!activeTab) return;

    var urlBar = $('browser-url');
    var content = $('browser-content');
    if (urlBar) urlBar.value = activeTab.url;
    if (content) {
      if (activeTab.url === 'about:blank') {
        content.innerHTML = '<div class="browser-newtab"><h2>Welcome to Huntrix Browser</h2><p>Enter a URL or search to get started</p></div>';
      } else {
        content.innerHTML = '<div class="browser-embed"><p>Rendering: <strong>' + activeTab.url + '</strong></p><p class="browser-mock-notice">Content rendering simulated (iframe blocked due to security policy)</p></div>';
      }
    }
  }

  function setupBrowserControls() {
    var goBtn = $('browser-go-btn');
    var urlBar = $('browser-url');
    var backBtn = $('browser-back');
    var forwardBtn = $('browser-forward');
    var refreshBtn = $('browser-refresh');
    var bookmarksToggle = $('browser-bookmarks-toggle');

    if (goBtn && urlBar) {
      function navigate() {
        var url = urlBar.value.trim();
        if (!url) return;
        if (url.indexOf('.') === -1 && url.indexOf('://') === -1) {
          url = 'https://search.huntrix.os/search?q=' + encodeURIComponent(url);
        } else if (url.indexOf('://') === -1) {
          url = 'https://' + url;
        }
        for (var i = 0; i < HuntrixApp.browserTabs.length; i++) {
          if (HuntrixApp.browserTabs[i].active) {
            HuntrixApp.browserTabs[i].url = url;
            HuntrixApp.browserTabs[i].title = url.replace('https://', '').split('/')[0];
            break;
          }
        }
        renderTabs();
        renderBrowserContent();
      }

      goBtn.addEventListener('click', navigate);
      urlBar.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') navigate();
      });
    }

    if (bookmarksToggle) {
      var dropdown = $('browser-bookmarks-dropdown');
      bookmarksToggle.addEventListener('click', function () {
        dropdown.classList.toggle('active');
      });
    }
  }

  function renderBookmarks() {
    var container = $('browser-bookmarks-dropdown');
    if (!container) return;

    var data = getData();
    if (!data) return;

    var html = '';
    data.bookmarks.forEach(function (bm) {
      html += '<div class="bookmark-item" data-url="' + bm.url + '">';
      html += '<span class="bookmark-icon">' + bm.icon.charAt(0).toUpperCase() + '</span>';
      html += '<span class="bookmark-title">' + bm.title + '</span>';
      html += '</div>';
    });
    container.innerHTML = html;

    qsa('.bookmark-item', container).forEach(function (item) {
      item.addEventListener('click', function () {
        var url = item.getAttribute('data-url');
        for (var i = 0; i < HuntrixApp.browserTabs.length; i++) {
          if (HuntrixApp.browserTabs[i].active) {
            HuntrixApp.browserTabs[i].url = url;
            HuntrixApp.browserTabs[i].title = item.querySelector('.bookmark-title').textContent;
            break;
          }
        }
        renderTabs();
        renderBrowserContent();
        container.classList.remove('active');
      });
    });
  }

  // ============================================================
  // PRODUCTIVITY PAGE
  // ============================================================

  function showProductivity() {
    var data = getData();
    if (!data) return;

    renderNotes(data.notes);
    setupNotesCRUD(data);
    renderTasks(data.tasks);
    setupTasksCRUD(data);
    setupPomodoro();
    renderCalendar();
  }

  // --- Notes ---

  function renderNotes(notes) {
    var container = $('notes-list');
    if (!container) return;

    var html = '';
    notes.forEach(function (note) {
      html += '<div class="note-item ' + (note.pinned ? 'pinned' : '') + '" data-id="' + note.id + '">';
      html += '<div class="note-header">';
      html += '<h4 class="note-title">' + note.title + '</h4>';
      if (note.pinned) html += '<span class="note-pin">📌</span>';
      html += '</div>';
      html += '<p class="note-content">' + truncate(note.content, 100) + '</p>';
      html += '<div class="note-meta">';
      html += '<span class="note-date">' + formatDate(note.updated) + '</span>';
      html += '<div class="note-actions">';
      html += '<button class="note-pin-btn" data-id="' + note.id + '">' + (note.pinned ? 'Unpin' : 'Pin') + '</button>';
      html += '<button class="note-edit-btn" data-id="' + note.id + '">Edit</button>';
      html += '<button class="note-delete-btn" data-id="' + note.id + '">Delete</button>';
      html += '</div></div></div>';
    });
    container.innerHTML = html;
  }

  function setupNotesCRUD(data) {
    var addBtn = $('note-add-btn');
    var saveBtn = $('note-save-btn');
    var cancelBtn = $('note-cancel-btn');
    var modal = $('note-modal');
    var overlay = $('note-overlay');
    var form = $('note-form');
    var titleInput = $('note-title-input');
    var contentInput = $('note-content-input');
    var editingId = null;

    function openModal(note) {
      if (modal) modal.classList.add('active');
      if (overlay) overlay.classList.add('active');
      if (titleInput) titleInput.value = note ? note.title : '';
      if (contentInput) contentInput.value = note ? note.content : '';
      editingId = note ? note.id : null;
    }

    function closeModal() {
      if (modal) modal.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
      if (titleInput) titleInput.value = '';
      if (contentInput) contentInput.value = '';
      editingId = null;
    }

    if (addBtn) addBtn.addEventListener('click', function () { openModal(null); });
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (overlay) overlay.addEventListener('click', closeModal);

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var title = titleInput ? titleInput.value.trim() : '';
        var content = contentInput ? contentInput.value.trim() : '';
        if (!title) return;

        if (editingId) {
          for (var i = 0; i < data.notes.length; i++) {
            if (data.notes[i].id === editingId) {
              data.notes[i].title = title;
              data.notes[i].content = content;
              data.notes[i].updated = new Date().toISOString();
              break;
            }
          }
        } else {
          data.notes.push({
            id: 'note-' + (data.notesCounter || Date.now()),
            title: title,
            content: content,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            pinned: false
          });
          data.notesCounter = (data.notesCounter || Date.now()) + 1;
        }
        saveData(data);
        renderNotes(data.notes);
        addNotification(editingId ? 'Updated note: ' + title : 'Created note: ' + title, 'system');
        closeModal();
      });
    }

    document.addEventListener('click', function (e) {
      var target = e.target;
      if (target.classList.contains('note-pin-btn')) {
        var id = target.getAttribute('data-id');
        for (var i = 0; i < data.notes.length; i++) {
          if (data.notes[i].id === id) {
            data.notes[i].pinned = !data.notes[i].pinned;
            break;
          }
        }
        data.notes.sort(function (a, b) { return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0); });
        saveData(data);
        renderNotes(data.notes);
      } else if (target.classList.contains('note-edit-btn')) {
        var id = target.getAttribute('data-id');
        for (var i = 0; i < data.notes.length; i++) {
          if (data.notes[i].id === id) {
            openModal(data.notes[i]);
            break;
          }
        }
      } else if (target.classList.contains('note-delete-btn')) {
        var id = target.getAttribute('data-id');
        for (var i = 0; i < data.notes.length; i++) {
          if (data.notes[i].id === id) {
            data.notes.splice(i, 1);
            break;
          }
        }
        saveData(data);
        renderNotes(data.notes);
        addNotification('Deleted note', 'system');
      }
    });
  }

  // --- Tasks ---

  function renderTasks(tasks) {
    var container = $('tasks-list');
    if (!container) return;

    var html = '';
    tasks.forEach(function (task) {
      var priorityClass = 'priority-' + (task.priority || 'medium');
      html += '<div class="task-item ' + (task.completed ? 'completed' : '') + '" data-id="' + task.id + '">';
      html += '<input type="checkbox" class="task-checkbox" data-id="' + task.id + '" ' + (task.completed ? 'checked' : '') + '>';
      html += '<div class="task-content">';
      html += '<span class="task-title">' + task.title + '</span>';
      html += '<span class="task-meta">';
      html += '<span class="task-priority ' + priorityClass + '">' + task.priority + '</span>';
      if (task.dueDate) html += '<span class="task-due">' + formatDate(task.dueDate) + '</span>';
      html += '<span class="task-category">' + task.category + '</span>';
      html += '</span></div>';
      html += '<button class="task-delete-btn" data-id="' + task.id + '">×</button>';
      html += '</div>';
    });
    container.innerHTML = html;

    qsa('.task-checkbox', container).forEach(function (cb) {
      cb.addEventListener('change', function () {
        var id = cb.getAttribute('data-id');
        var data = getData();
        if (!data) return;
        for (var i = 0; i < data.tasks.length; i++) {
          if (data.tasks[i].id === id) {
            data.tasks[i].completed = cb.checked;
            break;
          }
        }
        saveData(data);
        applyTaskFilter();
      });
    });

    qsa('.task-delete-btn', container).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-id');
        var data = getData();
        if (!data) return;
        for (var i = 0; i < data.tasks.length; i++) {
          if (data.tasks[i].id === id) {
            data.tasks.splice(i, 1);
            break;
          }
        }
        saveData(data);
        applyTaskFilter();
      });
    });
  }

  function setupTasksCRUD(data) {
    var addBtn = $('task-add-btn');
    var input = $('task-input');
    var filterBtns = qsa('.task-filter-btn');

    if (addBtn && input) {
      addBtn.addEventListener('click', function () {
        var title = input.value.trim();
        if (!title) return;
        data.tasks.push({
          id: 'task-' + (data.tasksCounter || Date.now()),
          title: title,
          completed: false,
          priority: 'medium',
          dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
          category: 'general'
        });
        data.tasksCounter = (data.tasksCounter || Date.now()) + 1;
        saveData(data);
        input.value = '';
        applyTaskFilter();
        addNotification('Added task: ' + title, 'system');
      });

      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') addBtn.click();
      });
    }

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        applyTaskFilter();
      });
    });
  }

  function applyTaskFilter() {
    var data = getData();
    if (!data) return;
    var activeFilter = qs('.task-filter-btn.active');
    var filter = activeFilter ? activeFilter.getAttribute('data-filter') : 'all';
    var filtered = data.tasks.slice();
    if (filter === 'active') {
      filtered = filtered.filter(function (t) { return !t.completed; });
    } else if (filter === 'completed') {
      filtered = filtered.filter(function (t) { return t.completed; });
    }
    renderTasks(filtered);
  }

  // --- Pomodoro Timer ---

  function setupPomodoro() {
    updatePomodoroDisplay();
    var startBtn = $('pomodoro-start');
    var pauseBtn = $('pomodoro-pause');
    var resetBtn = $('pomodoro-reset');

    if (startBtn) {
      startBtn.addEventListener('click', function () {
        if (!HuntrixApp.pomodoro.running) {
          HuntrixApp.pomodoro.running = true;
          HuntrixApp.pomodoro.interval = setInterval(pomodoroTick, 1000);
        }
      });
    }

    if (pauseBtn) {
      pauseBtn.addEventListener('click', function () {
        HuntrixApp.pomodoro.running = false;
        if (HuntrixApp.pomodoro.interval) {
          clearInterval(HuntrixApp.pomodoro.interval);
          HuntrixApp.pomodoro.interval = null;
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        HuntrixApp.pomodoro.running = false;
        if (HuntrixApp.pomodoro.interval) {
          clearInterval(HuntrixApp.pomodoro.interval);
          HuntrixApp.pomodoro.interval = null;
        }
        HuntrixApp.pomodoro.minutes = 25;
        HuntrixApp.pomodoro.seconds = 0;
        HuntrixApp.pomodoro.mode = 'work';
        updatePomodoroDisplay();
      });
    }
  }

  function pomodoroTick() {
    if (HuntrixApp.pomodoro.seconds === 0) {
      if (HuntrixApp.pomodoro.minutes === 0) {
        if (HuntrixApp.pomodoro.mode === 'work') {
          HuntrixApp.pomodoro.mode = 'break';
          HuntrixApp.pomodoro.minutes = 5;
          HuntrixApp.pomodoro.seconds = 0;
          addNotification('Pomodoro: Work session complete! Time for a break.', 'system');
        } else {
          HuntrixApp.pomodoro.mode = 'work';
          HuntrixApp.pomodoro.minutes = 25;
          HuntrixApp.pomodoro.seconds = 0;
          addNotification('Pomodoro: Break over! Back to work.', 'system');
        }
      } else {
        HuntrixApp.pomodoro.minutes--;
        HuntrixApp.pomodoro.seconds = 59;
      }
    } else {
      HuntrixApp.pomodoro.seconds--;
    }
    updatePomodoroDisplay();
  }

  function updatePomodoroDisplay() {
    var display = $('pomodoro-display');
    var modeEl = $('pomodoro-mode');
    if (display) {
      var m = String(HuntrixApp.pomodoro.minutes).padStart(2, '0');
      var s = String(HuntrixApp.pomodoro.seconds).padStart(2, '0');
      display.textContent = m + ':' + s;
    }
    if (modeEl) {
      modeEl.textContent = HuntrixApp.pomodoro.mode === 'work' ? 'Focus Time' : 'Break Time';
    }
  }

  // --- Calendar ---

  function renderCalendar() {
    var container = $('productivity-calendar');
    if (!container) return;

    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth();
    var firstDay = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    var html = '<div class="calendar-header"><span>' + monthNames[month] + ' ' + year + '</span></div>';
    html += '<div class="calendar-weekdays">';
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(function (d) { html += '<span>' + d + '</span>'; });
    html += '</div><div class="calendar-days">';

    for (var i = 0; i < firstDay; i++) {
      html += '<span class="cal-day cal-empty"></span>';
    }

    var today = now.getDate();
    for (var d = 1; d <= daysInMonth; d++) {
      html += '<span class="cal-day' + (d === today ? ' cal-today' : '') + '">' + d + '</span>';
    }
    html += '</div>';
    container.innerHTML = html;
  }

  // ============================================================
  // ANALYTICS PAGE
  // ============================================================

  function showAnalytics() {
    var data = getData();
    if (!data) return;

    renderAnalyticsStats(data);
    renderCharts(data);
    setupExport(data);
  }

  function renderAnalyticsStats(data) {
    var statNames = ['cpu', 'ram', 'storage', 'network'];
    statNames.forEach(function (key) {
      var el = $('analytics-' + key);
      if (!el) return;
      var val = data.stats[key] || 0;
      el.textContent = val + '%';
      var bar = qs('.analytics-stat-bar-fill', el.parentNode);
      if (bar) {
        bar.style.width = '0%';
        setTimeout(function () { bar.style.width = val + '%'; }, 200);
      }
    });

    var uptimeEl = $('analytics-uptime');
    if (uptimeEl) {
      var hours = randomBetween(48, 720);
      uptimeEl.textContent = Math.floor(hours / 24) + 'd ' + (hours % 24) + 'h';
    }

    var sessionsEl = $('analytics-sessions');
    if (sessionsEl) {
      sessionsEl.textContent = randomBetween(150, 500);
    }
  }

  function renderCharts(data) {
    var cpuChart = $('cpu-chart');
    var ramChart = $('ram-chart');
    var activityChart = $('activity-chart');

    if (cpuChart) {
      var bars = '';
      for (var i = 0; i < 12; i++) {
        var h = randomBetween(20, 90);
        bars += '<div class="chart-bar" style="height: ' + h + '%"><span>' + h + '%</span></div>';
      }
      cpuChart.innerHTML = bars;
    }

    if (ramChart) {
      var donutHtml = '<div class="donut-chart" style="--pct: ' + data.stats.ram + '">';
      donutHtml += '<span class="donut-label">' + data.stats.ram + '%</span></div>';
      ramChart.innerHTML = donutHtml;
    }

    if (activityChart) {
      var lines = '';
      for (var i = 0; i < 20; i++) {
        var h = randomBetween(10, 100);
        lines += '<div class="activity-bar" style="height: ' + h + '%"></div>';
      }
      activityChart.innerHTML = lines;
    }
  }

  function setupExport(data) {
    var exportBtn = $('analytics-export-btn');
    if (!exportBtn) return;

    exportBtn.addEventListener('click', function () {
      var exportData = {
        stats: data.stats,
        packages: data.packages.length,
        repos: data.repos.length,
        files: data.cloudFiles.length,
        tasks: data.tasks.length,
        notes: data.notes.length,
        activities: data.activities.length,
        timestamp: new Date().toISOString()
      };

      var blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'huntrix-analytics-export.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addNotification('Analytics data exported', 'analytics');
    });
  }

  // ============================================================
  // SETTINGS PAGE
  // ============================================================

  function showSettings() {
    var prefs = getPreferences();

    var nameEl = $('settings-name');
    var usernameEl = $('settings-username');
    var emailEl = $('settings-email');
    var themeSelect = $('settings-theme');
    var accentInput = $('settings-accent');
    var notifToggle = $('settings-notifications');
    var camPerm = $('settings-camera');
    var micPerm = $('settings-mic');
    var versionEl = $('settings-version');

    if (nameEl) nameEl.value = 'Huntrix User';
    if (usernameEl) usernameEl.value = HuntrixApp.user || 'user';
    if (emailEl) emailEl.value = 'user@huntrix.os';
    if (themeSelect) themeSelect.value = prefs.theme || 'dark';
    if (accentInput) accentInput.value = prefs.accent || '#00f0ff';
    if (notifToggle) notifToggle.checked = prefs.notifications !== false;
    if (camPerm) camPerm.textContent = 'Granted';
    if (micPerm) micPerm.textContent = 'Granted';
    if (versionEl) versionEl.textContent = 'Huntrix OS Dashboard v' + HuntrixApp.version;

    setupSettingsSave();
    setupSettingsTheme(themeSelect);
    setupSettingsAccent(accentInput);
  }

  function setupSettingsTheme(themeSelect) {
    if (!themeSelect) return;
    themeSelect.addEventListener('change', function () {
      applyTheme(themeSelect.value);
    });
  }

  function setupSettingsAccent(accentInput) {
    if (!accentInput) return;
    accentInput.addEventListener('input', function () {
      applyAccent(accentInput.value);
    });
  }

  function setupSettingsSave() {
    var saveBtn = $('settings-save-btn');
    if (!saveBtn) return;

    saveBtn.addEventListener('click', function () {
      var prefs = getPreferences();
      var nameEl = $('settings-name');
      var emailEl = $('settings-email');
      var themeSelect = $('settings-theme');
      var accentInput = $('settings-accent');
      var notifToggle = $('settings-notifications');

      prefs.theme = themeSelect ? themeSelect.value : prefs.theme;
      prefs.accent = accentInput ? accentInput.value : prefs.accent;
      prefs.notifications = notifToggle ? notifToggle.checked : prefs.notifications;
      savePreferences(prefs);

      applyTheme(prefs.theme);
      applyAccent(prefs.accent);

      addNotification('Settings saved successfully', 'system');
    });
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================

  function init() {
    var authUser = localStorage.getItem('huntrix_auth_user');
    if (!authUser) {
      authUser = 'admin';
      localStorage.setItem('huntrix_auth_user', authUser);
    }
    HuntrixApp.user = authUser;

    var data = getData();
    if (!data) {
      data = generateMockData(authUser);
    }

    var prefs = getPreferences();
    applyTheme(prefs.theme || 'dark');
    applyAccent(prefs.accent || '#00f0ff');

    document.getElementById('loading-screen').classList.add('hidden');
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');

    initNavigation();
    initNotifications();
    initSearch();

    addNotification('Welcome to Huntrix OS Dashboard v' + HuntrixApp.version, 'system');

    navigateTo('dashboard');
  }

  window.HuntrixApp = HuntrixApp;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
