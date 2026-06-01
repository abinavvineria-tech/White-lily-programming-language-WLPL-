;(function () {
  'use strict'

  // ============================================================
  // STORE (State Management + Persistence)
  // ============================================================
  const Store = {
    _user: null,
    _data: null,
    _prefs: null,
    _listeners: [],

    STORAGE_USERS_KEY: 'huntrix_users',
    STORAGE_SESSION_KEY: 'huntrix_session',

    get user () { return this._user },
    set user (v) { this._user = v },

    _hash (str) {
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        const chr = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + chr
        hash |= 0
      }
      return Math.abs(hash).toString(16)
    },

    getUsers () {
      try { return JSON.parse(localStorage.getItem(this.STORAGE_USERS_KEY)) || [] }
      catch { return [] }
    },

    saveUsers (users) {
      localStorage.setItem(this.STORAGE_USERS_KEY, JSON.stringify(users))
    },

    register (username, password) {
      if (!username || username.length < 3) return { ok: false, msg: 'Username must be at least 3 characters.' }
      if (!/^[a-zA-Z0-9]+$/.test(username)) return { ok: false, msg: 'Username must be alphanumeric.' }
      if (!password || password.length < 6) return { ok: false, msg: 'Password must be at least 6 characters.' }

      const users = this.getUsers()
      if (users.some(u => u.username.toLowerCase() === username.toLowerCase()))
        return { ok: false, msg: 'Username already taken.' }

      const user = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        username, password: this._hash(password),
        createdAt: new Date().toISOString(),
        prefs: { theme: 'dark', accent: '#00d4ff', notifications: true }
      }
      users.push(user)
      this.saveUsers(users)
      this._setSession(user)
      return { ok: true, msg: 'Registered successfully.', user }
    },

    login (username, password) {
      if (!username || !password) return { ok: false, msg: 'Username and password required.' }
      const users = this.getUsers()
      const found = users.find(u => u.username.toLowerCase() === username.toLowerCase())
      if (!found) return { ok: false, msg: 'User not found.' }
      if (found.password !== this._hash(password)) return { ok: false, msg: 'Incorrect password.' }
      this._setSession(found)
      return { ok: true, msg: 'Welcome back!', user: found }
    },

    logout () {
      localStorage.removeItem(this.STORAGE_SESSION_KEY)
      this._user = null
      this._data = null
    },

    isAuth () { return !!localStorage.getItem(this.STORAGE_SESSION_KEY) },

    _setSession (user) {
      localStorage.setItem(this.STORAGE_SESSION_KEY, JSON.stringify(user))
      this._user = user.username
    },

    init () {
      try {
        const raw = localStorage.getItem(this.STORAGE_SESSION_KEY)
        if (raw) {
          const u = JSON.parse(raw)
          this._user = u.username
          return true
        }
      } catch {}
      return false
    },

    key () { return 'huntrix_data_' + this._user },

    prefsKey () { return 'huntrix_prefs_' + this._user },

    getData () {
      if (!this._user) return null
      if (this._data) return this._data
      const raw = localStorage.getItem(this.key())
      if (raw) {
        this._data = JSON.parse(raw)
        return this._data
      }
      this._data = this._generateMockData()
      this.saveData()
      return this._data
    },

    saveData () {
      if (!this._user || !this._data) return
      localStorage.setItem(this.key(), JSON.stringify(this._data))
    },

    getPrefs () {
      if (!this._user) return { theme: 'dark', accent: '#00d4ff', notifications: true }
      if (this._prefs) return this._prefs
      const raw = localStorage.getItem(this.prefsKey())
      if (raw) { this._prefs = JSON.parse(raw); return this._prefs }
      return { theme: 'dark', accent: '#00d4ff', notifications: true }
    },

    savePrefs (prefs) {
      if (!this._user) return
      this._prefs = prefs
      localStorage.setItem(this.prefsKey(), JSON.stringify(prefs))
    },

    _rand (min, max) { return Math.floor(Math.random() * (max - min + 1)) + min },

    _generateMockData () {
      const now = Date.now()
      const day = 86400000
      const pkgs = [
        { id:'p1',name:'huntrix-ai-core',ver:'4.2.1',desc:'Neural network engine for AI tasks',author:'huntrix-labs',dl:this._rand(10,50),cat:'ai',inst:true },
        { id:'p2',name:'nexus-shell',ver:'2.0.0',desc:'Next-gen terminal emulator',author:'huntrix-os',dl:this._rand(20,60),cat:'system',inst:true },
        { id:'p3',name:'cipher-guard',ver:'1.8.3',desc:'End-to-end encryption toolkit',author:'security-team',dl:this._rand(8,30),cat:'security',inst:false },
        { id:'p4',name:'quantum-vfs',ver:'3.1.0',desc:'Virtual file system layer',author:'huntrix-labs',dl:this._rand(5,20),cat:'system',inst:false },
        { id:'p5',name:'lily-ui',ver:'5.0.2',desc:'UI component library',author:'ui-lab',dl:this._rand(15,45),cat:'dev',inst:true },
        { id:'p6',name:'hyper-vault',ver:'2.3.1',desc:'Secure credential storage',author:'security-team',dl:this._rand(3,15),cat:'security',inst:false },
        { id:'p7',name:'network-mesh',ver:'0.9.8',desc:'Decentralized mesh networking',author:'networks-inc',dl:this._rand(7,25),cat:'network',inst:true },
        { id:'p8',name:'neuro-synth',ver:'2.1.3',desc:'Neural audio synthesis engine',author:'audio-labs',dl:this._rand(6,22),cat:'media',inst:false },
        { id:'p9',name:'data-forge',ver:'4.0.1',desc:'Data transformation framework',author:'data-team',dl:this._rand(12,40),cat:'dev',inst:true },
        { id:'p10',name:'photon-ui',ver:'1.5.0',desc:'Terminal UI library',author:'ui-lab',dl:this._rand(10,35),cat:'dev',inst:false },
      ]
      const repos = [
        { id:'r1',name:'neural-nexus-engine',desc:'Advanced neural network framework',stars:this._rand(500,3000),lang:'Python',updated:new Date(now-this._rand(1,30)*day).toISOString() },
        { id:'r2',name:'huntrix-dashboard-ui',desc:'Dashboard frontend components',stars:this._rand(300,2500),lang:'JavaScript',updated:new Date(now-this._rand(1,30)*day).toISOString() },
        { id:'r3',name:'quantum-vfs-driver',desc:'Virtual filesystem driver',stars:this._rand(200,2000),lang:'Rust',updated:new Date(now-this._rand(1,30)*day).toISOString() },
        { id:'r4',name:'lily-package-manager',desc:'WLPM core implementation',stars:this._rand(400,2800),lang:'Go',updated:new Date(now-this._rand(1,30)*day).toISOString() },
        { id:'r5',name:'cipher-guard-core',desc:'Encryption primitives',stars:this._rand(150,1800),lang:'C++',updated:new Date(now-this._rand(1,30)*day).toISOString() },
        { id:'r6',name:'mesh-protocol',desc:'Networking protocol implementation',stars:this._rand(100,1500),lang:'TypeScript',updated:new Date(now-this._rand(1,30)*day).toISOString() },
      ]
      const files = [
        { id:'f1',name:'project-report-q2.pdf',type:'pdf',size:this._rand(100,5000)*1000,mod:new Date(now-this._rand(1,60)*day).toISOString(),shared:false },
        { id:'f2',name:'screenshot-dashboard.png',type:'image',size:this._rand(50,500)*1000,mod:new Date(now-this._rand(1,60)*day).toISOString(),shared:true },
        { id:'f3',name:'backup-nexus-core.tar.gz',type:'archive',size:this._rand(50000,200000)*1000,mod:new Date(now-this._rand(1,60)*day).toISOString(),shared:false },
        { id:'f4',name:'media-assets',type:'folder',size:this._rand(100,900)*1000000,mod:new Date(now-this._rand(1,60)*day).toISOString(),shared:false },
        { id:'f5',name:'config.yaml',type:'code',size:this._rand(5,50)*1000,mod:new Date(now-this._rand(1,60)*day).toISOString(),shared:false },
        { id:'f6',name:'architecture.svg',type:'image',size:this._rand(10,100)*1000,mod:new Date(now-this._rand(1,60)*day).toISOString(),shared:true },
      ]
      const media = [
        { id:'m1',title:'Neural Sunrise',type:'image',artist:'AI Generated' },
        { id:'m2',title:'Quantum Dreams',type:'music',artist:'Synthwave Collective',dur:'3:45' },
        { id:'m3',title:'Huntrix OS Showcase',type:'video',artist:'Huntrix Studios',dur:'12:30' },
        { id:'m4',title:'Cyber Cityscape',type:'image',artist:'AI Generated' },
        { id:'m5',title:'Digital Rain',type:'video',artist:'Demoscene',dur:'5:20' },
        { id:'m6',title:'Midnight Protocol',type:'music',artist:'Dark Tech',dur:'4:12' },
        { id:'m7',title:'Fractal Dreams',type:'image',artist:'AI Generated' },
        { id:'m8',title:'Electro Pulse',type:'music',artist:'Bass Reactor',dur:'6:00' },
      ]
      const notes = [
        { id:'n1',title:'Architecture Ideas',content:'Need to redesign the IPC layer. Consider lock-free queues.',created:now,crt:now-5*day,upd:now-2*day,pinned:true },
        { id:'n2',title:'Meeting Notes',content:'Discussed training pipeline optimization. Key: mixed precision.',created:now,crt:now-3*day,upd:now-1*day,pinned:false },
        { id:'n3',title:'Feature Requests',content:'1. Dark mode toggle\n2. Plugin system\n3. Network monitor',created:now,crt:now-7*day,upd:now-4*day,pinned:false },
      ]
      const tasks = [
        { id:'t1',title:'Review system architecture',done:false,prio:'high',cat:'dev',due:new Date(now+3*day).toISOString() },
        { id:'t2',title:'Update WLPM packages',done:false,prio:'medium',cat:'dev',due:new Date(now+1*day).toISOString() },
        { id:'t3',title:'Backup cloud storage',done:true,prio:'high',cat:'sys',due:new Date(now-1*day).toISOString() },
        { id:'t4',title:'Write API documentation',done:false,prio:'low',cat:'docs',due:new Date(now+7*day).toISOString() },
        { id:'t5',title:'Configure firewall rules',done:true,prio:'medium',cat:'sec',due:new Date(now-2*day).toISOString() },
      ]
      const acts = [
        { text:'Deployed Nexus Core to production',time:new Date(now-300000).toISOString() },
        { text:'Package huntrix-ai installed',time:new Date(now-1800000).toISOString() },
        { text:'Cloud backup completed — 2.4 GB synced',time:new Date(now-3600000).toISOString() },
        { text:'Security scan passed all 12 tests',time:new Date(now-7200000).toISOString() },
        { text:'Firewall rules updated for WAN',time:new Date(now-14400000).toISOString() },
        { text:'System health check completed',time:new Date(now-36000000).toISOString() },
        { text:'Development build #1284 passed',time:new Date(now-172800000).toISOString() },
      ]

      return {
        stats: { cpu: this._rand(15,85), ram: this._rand(30,90), storage: this._rand(25,75), network: this._rand(10,60) },
        packages: pkgs, repos, cloudFiles: files, mediaItems: media,
        notes, tasks, activities: acts,
        ownedCookies: [],
        favoriteCookies: [],
        pullHistory: [],
        noteCounter: Date.now(),
        taskCounter: Date.now()
      }
    }
  }

  // ============================================================
  // TOAST SYSTEM
  // ============================================================
  const Toast = {
    container: null,
    init () {
      this.container = document.getElementById('toast-container')
      if (!this.container) {
        this.container = document.createElement('div')
        this.container.id = 'toast-container'
        this.container.className = 'toast-container'
        document.body.appendChild(this.container)
      }
    },
    show (title, message, type) {
      type = type || 'info'
      const icons = { success: '✓', error: '✗', warning: '⚠', info: 'ℹ' }
      const el = document.createElement('div')
      el.className = 'toast ' + type
      el.innerHTML = '<div class="toast-icon">' + (icons[type] || 'ℹ') + '</div><div class="toast-content"><div class="toast-title">' + title + '</div><div class="toast-message">' + (message || '') + '</div></div><button class="toast-close">×</button>'
      el.querySelector('.toast-close').addEventListener('click', () => el.remove())
      this.container.appendChild(el)
      setTimeout(() => { if (el.parentNode) { el.style.opacity = '0'; el.style.transform = 'translateX(100px)'; setTimeout(() => el.remove(), 300) } }, 4000)
    }
  }

  // ============================================================
  // UTILITIES
  // ============================================================
  const $ = id => document.getElementById(id)
  const qs = (s, c) => (c || document).querySelector(s)
  const qsa = (s, c) => (c || document).querySelectorAll(s)

  function fmtDate (date) {
    const d = new Date(date), now = new Date()
    const diff = now - d
    const sec = Math.floor(diff / 1000)
    if (sec < 60) return 'just now'
    const min = Math.floor(sec / 60)
    if (min < 60) return min + 'm ago'
    const hr = Math.floor(min / 60)
    if (hr < 24) return hr + 'h ago'
    const days = Math.floor(hr / 24)
    if (days < 7) return days + 'd ago'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  function fmtBytes (bytes) {
    if (bytes === 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
    return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i]
  }

  function trunc (str, len) {
    if (!str) return ''
    return str.length <= len ? str : str.slice(0, len) + '…'
  }

  function debounce (fn, ms) {
    let t
    return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms) }
  }

  function rarityColor (r) {
    const map = {
      'Beast': '#ff2200', 'Ancient': '#ffd700', 'Legendary': '#ff6bff',
      'Dragon': '#ff4444', 'Super Epic': '#ff884d', 'Epic': '#a855f7',
      'Rare': '#60a5fa', 'Common': '#94a3b8'
    }
    return map[r] || '#94a3b8'
  }

  function rarityBg (r) {
    const map = {
      'Beast': 'rgba(255,34,0,0.15)', 'Ancient': 'rgba(255,215,0,0.12)',
      'Legendary': 'rgba(255,107,255,0.12)', 'Dragon': 'rgba(255,68,68,0.12)',
      'Super Epic': 'rgba(255,136,77,0.12)', 'Epic': 'rgba(168,85,247,0.12)',
      'Rare': 'rgba(96,165,250,0.12)', 'Common': 'rgba(148,163,184,0.12)'
    }
    return map[r] || 'rgba(148,163,184,0.12)'
  }

  // ============================================================
  // THEME
  // ============================================================
  function applyTheme (theme) {
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark')
  }

  function applyAccent (color) {
    document.documentElement.style.setProperty('--neon-color', color)
    document.documentElement.style.setProperty('--accent-primary', color)
    if (color === '#00d4ff') {
      document.documentElement.style.setProperty('--accent-primary-hover', '#33ddff')
      document.documentElement.style.setProperty('--accent-glow', 'rgba(0,212,255,0.3)')
    }
  }

  // ============================================================
  // NAVIGATION (Router)
  // ============================================================
  let currentPage = 'dashboard'
  const pageHandlers = {}

  function registerPage (name, handler) { pageHandlers[name] = handler }

  function navigateTo (pageId) {
    qsa('.page').forEach(p => p.classList.remove('active'))
    qsa('.nav-link').forEach(n => n.classList.remove('active'))

    const target = $('page-' + pageId)
    if (target) target.classList.add('active')

    const navItem = qs('.nav-link[data-page="' + pageId + '"]')
    if (navItem) navItem.classList.add('active')

    currentPage = pageId
    const titleEl = $('page-title')
    if (titleEl) titleEl.textContent = (qs('.nav-link[data-page="' + pageId + '"] .nav-label') || {}).textContent || pageId

    if (pageHandlers[pageId]) pageHandlers[pageId]()
  }

  function initNavigation () {
    qsa('.nav-link').forEach(n => {
      n.addEventListener('click', e => {
        e.preventDefault()
        const page = n.getAttribute('data-page')
        if (page) navigateTo(page)
        const sidebar = qs('.sidebar')
        if (sidebar) sidebar.classList.remove('open')
        qs('.sidebar-overlay')?.classList.remove('open')
      })
    })
    const hamburger = $('hamburger-btn')
    if (hamburger) {
      hamburger.addEventListener('click', () => {
        qs('.sidebar').classList.toggle('open')
        let ov = qs('.sidebar-overlay')
        if (!ov) {
          ov = document.createElement('div')
          ov.className = 'sidebar-overlay'
          document.body.appendChild(ov)
          ov.addEventListener('click', () => { qs('.sidebar').classList.remove('open'); ov.classList.remove('open') })
        }
        ov.classList.toggle('open')
      })
    }
  }

  // ============================================================
  // COMMAND PALETTE
  // ============================================================
  function initCommandPalette () {
    const overlay = $('command-palette-overlay')
    const input = $('command-palette-input')
    const results = $('command-palette-results')
    if (!overlay) return

    let selectedIdx = -1

    function open () {
      overlay.classList.add('open')
      setTimeout(() => input.focus(), 100)
      selectedIdx = -1
      filterCommands('')
    }

    function close () {
      overlay.classList.remove('open')
      input.value = ''
      results.innerHTML = ''
    }

    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); overlay.classList.contains('open') ? close() : open() }
      if (e.key === 'Escape' && overlay.classList.contains('open')) close()
    })

    input.addEventListener('input', () => filterCommands(input.value))

    input.addEventListener('keydown', e => {
      const items = qsa('.command-palette-item', results)
      if (e.key === 'ArrowDown') { e.preventDefault(); selectedIdx = Math.min(selectedIdx + 1, items.length - 1); highlight(items) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); selectedIdx = Math.max(selectedIdx - 1, 0); highlight(items) }
      else if (e.key === 'Enter') { e.preventDefault(); const sel = qs('.command-palette-item.selected', results); if (sel) sel.click() }
    })

    function highlight (items) {
      items.forEach((it, i) => it.classList.toggle('selected', i === selectedIdx))
      if (items[selectedIdx]) items[selectedIdx].scrollIntoView({ block: 'nearest' })
    }

    function filterCommands (query) {
      const q = query.toLowerCase().trim()
      const commands = [
        { id: 'nav-dashboard', title: 'Go to Dashboard', desc: 'View system overview', icon: '⌂', action: () => { close(); navigateTo('dashboard') } },
        { id: 'nav-crk', title: 'Go to CRK Gacha', desc: 'Cookie collection tracker', icon: '🍪', action: () => { close(); navigateTo('crk-gacha') } },
        { id: 'nav-analytics', title: 'Go to Analytics', desc: 'Pull history and achievements', icon: '📊', action: () => { close(); navigateTo('analytics') } },
        { id: 'nav-wlpm', title: 'Go to WLPM', desc: 'Package manager', icon: '◈', action: () => { close(); navigateTo('wlpm') } },
        { id: 'nav-devhub', title: 'Go to Dev Hub', desc: 'Developer tools', icon: '⚙', action: () => { close(); navigateTo('developer-hub') } },
        { id: 'nav-cloud', title: 'Go to Cloud Center', desc: 'File management', icon: '☁', action: () => { close(); navigateTo('cloud-center') } },
        { id: 'nav-media', title: 'Go to Media Center', desc: 'Media library', icon: '▶', action: () => { close(); navigateTo('media-center') } },
        { id: 'nav-browser', title: 'Go to Browser', desc: 'Web browser', icon: '🌐', action: () => { close(); navigateTo('browser') } },
        { id: 'nav-productivity', title: 'Go to Productivity', desc: 'Notes, tasks, pomodoro', icon: '✓', action: () => { close(); navigateTo('productivity') } },
        { id: 'nav-settings', title: 'Go to Settings', desc: 'Preferences and data management', icon: '⚡', action: () => { close(); navigateTo('settings') } },
        { id: 'act-export', title: 'Export Data', desc: 'Download all data as JSON', icon: '⬇', action: () => { close(); exportAllData() } },
        { id: 'act-import', title: 'Import Data', desc: 'Restore from JSON backup', icon: '📂', action: () => { close(); $('import-file-input').click() } },
      ]

      if (q.length >= 2) {
        const cookies = window.CRK_COOKIES || []
        cookies.forEach(c => {
          if (c.name.toLowerCase().includes(q)) {
            commands.push({ id: 'cookie-' + c.id, title: c.name + ' (' + c.rarity + ')', desc: 'View cookie details', icon: '🍪', action: () => { close(); navigateTo('crk-gacha') } })
          }
        })
      }

      const filtered = q ? commands.filter(c => c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)) : commands

      if (filtered.length === 0) {
        results.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-muted);font-size:0.85rem">No results found</div>'
        return
      }

      results.innerHTML = filtered.map((c, i) =>
        '<div class="command-palette-item' + (i === selectedIdx ? ' selected' : '') + '" data-id="' + c.id + '">' +
        '<span class="cp-icon">' + c.icon + '</span>' +
        '<div class="cp-info"><div class="cp-title">' + c.title + '</div><div class="cp-desc">' + c.desc + '</div></div>' +
        '</div>'
      ).join('')

      qsa('.command-palette-item', results).forEach(el => {
        el.addEventListener('click', () => {
          const cmd = filtered.find(c => c.id === el.getAttribute('data-id'))
          if (cmd) cmd.action()
        })
      })
    }

    overlay.addEventListener('click', e => { if (e.target === overlay) close() })
  }

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  let notifications = []

  function addNotif (text, type) {
    type = type || 'system'
    notifications.unshift({ id: 'n-' + Date.now(), text, type, time: new Date().toISOString(), read: false })
    if (notifications.length > 30) notifications.pop()
    renderNotifs()
    const prefs = Store.getPrefs()
    if (prefs.notifications !== false) Toast.show(type.charAt(0).toUpperCase() + type.slice(1), text, type === 'system' ? 'info' : type)
  }

  function renderNotifs () {
    const list = $('notification-list')
    const count = $('notif-count')
    if (!list) return
    let unread = 0
    list.innerHTML = notifications.map(n => {
      if (!n.read) unread++
      return '<div class="dropdown-notification' + (n.read ? '' : ' unread') + '" data-id="' + n.id + '">' +
        '<div class="notif-icon">' + (n.type === 'system' ? '⚡' : n.type === 'package' ? '◈' : n.type === 'achievement' ? '🏆' : n.type === 'error' ? '⚠' : 'ℹ') + '</div>' +
        '<div class="notif-content"><div class="notif-title">' + n.text + '</div><div class="notif-meta">' + fmtDate(n.time) + '</div></div></div>'
    }).join('')
    if (count) { count.textContent = unread; count.style.display = unread > 0 ? 'flex' : 'none' }
  }

  function initNotifications () {
    const btn = $('notif-btn')
    const dd = $('notif-dropdown')
    if (!btn || !dd) return
    btn.addEventListener('click', e => { e.stopPropagation(); dd.classList.toggle('open') })
    document.addEventListener('click', () => dd.classList.remove('open'))
    dd.addEventListener('click', e => e.stopPropagation())
    $('mark-all-read')?.addEventListener('click', () => { notifications.forEach(n => n.read = true); renderNotifs() })
    addNotif('Welcome to Huntrix OS v2.0', 'system')
    addNotif('System update completed successfully', 'system')
  }

  // ============================================================
  // GLOBAL SEARCH
  // ============================================================
  function initSearch () {
    const input = $('global-search')
    if (!input) return
    const hint = $('search-shortcut-hint')
    if (hint) hint.addEventListener('click', () => { $('command-palette-overlay')?.classList.add('open'); $('command-palette-input')?.focus() })
  }

  // ============================================================
  // PAGE HANDLERS
  // ============================================================

  // --- DASHBOARD ---
  registerPage('dashboard', () => {
    const data = Store.getData()
    if (!data) return

    const grid = $('stat-grid')
    const cards = [
      { label: 'CPU', value: data.stats.cpu + '%', icon: '⚡', color: 'var(--accent-primary)' },
      { label: 'RAM', value: data.stats.ram + '%', icon: '▦', color: 'var(--accent-secondary)' },
      { label: 'Storage', value: data.stats.storage + '%', icon: '💾', color: 'var(--accent-success)' },
      { label: 'Collection', value: data.ownedCookies?.length || 0 + ' / ' + (window.CRK_COOKIES?.length || 64), icon: '🍪', color: 'var(--accent-warning)' },
    ]
    grid.innerHTML = cards.map((c, i) =>
      '<div class="stat-card"><div class="stat-icon' + (i === 1 ? ' purple' : i === 2 ? ' green' : i === 3 ? ' orange' : '') + '">' + c.icon + '</div><div class="stat-info"><div class="stat-value">' + c.value + '</div><div class="stat-label">' + c.label + '</div></div></div>'
    ).join('')

    const actList = $('activity-list')
    actList.innerHTML = data.activities.slice(0, 6).map(a =>
      '<div class="activity-item"><span class="activity-dot"></span><span class="activity-text">' + a.text + '</span><span class="activity-time">' + fmtDate(a.time) + '</span></div>'
    ).join('')

    const sysStatus = $('system-status')
    sysStatus.innerHTML = [
      { label: 'Security Shield', val: 'Active', ok: true },
      { label: 'AI Engine', val: 'Online', ok: true },
      { label: 'Cloud Sync', val: 'Synced', ok: true },
      { label: 'Database Cluster', val: 'Operational', ok: true },
      { label: 'VPN Tunnel', val: 'Degraded', ok: false },
    ].map(s =>
      '<div class="status-item' + (s.ok ? '' : ' warning') + '"><span class="status-dot"></span><span class="status-label">' + s.label + '</span><span class="status-value">' + s.val + '</span></div>'
    ).join('')
  })

  // --- CRK GACHA ---
  registerPage('crk-gacha', () => {
    const data = Store.getData()
    if (!data) return
    renderCRK(data)
  })

  let crkFilter = 'all'
  let crkSort = 'default'

  function renderCRK (data) {
    const cookies = window.CRK_COOKIES || []
    const owned = data.ownedCookies || []
    const favs = data.favoriteCookies || []
    const ownedSet = new Set(owned)
    const favSet = new Set(favs)
    const total = cookies.length
    const ownedCount = owned.length
    const pct = total > 0 ? Math.round((ownedCount / total) * 100) : 0

    const bar = $('crk-stats-bar')
    bar.innerHTML =
      '<div class="stat"><div class="stat-num neon-text">' + ownedCount + '</div><div class="stat-lbl">Owned</div></div>' +
      '<div class="stat"><div class="stat-num">' + total + '</div><div class="stat-lbl">Total</div></div>' +
      '<div class="stat-bar"><div class="fill" style="width:' + pct + '%"></div></div>' +
      '<div class="stat"><div class="stat-num">' + pct + '%</div><div class="stat-lbl">Complete</div></div>' +
      '<div class="stat"><div class="stat-num">' + (favs.length) + '</div><div class="stat-lbl">⭐ Favorites</div></div>'

    const rarityStats = $('crk-rarity-stats')
    const rarityCounts = {}
    cookies.forEach(c => { rarityCounts[c.rarity] = (rarityCounts[c.rarity] || 0) + 1 })
    const rarityOwned = {}
    owned.forEach(id => { const c = cookies.find(cc => cc.id === id); if (c) rarityOwned[c.rarity] = (rarityOwned[c.rarity] || 0) + 1 })
    const order = ['Beast','Ancient','Legendary','Dragon','Super Epic','Epic','Rare','Common']
    rarityStats.innerHTML = order.filter(r => rarityCounts[r]).map(r =>
      '<span class="crk-rarity-stat"><span class="rs-dot" style="background:' + rarityColor(r) + '"></span><span class="rs-num" style="color:' + rarityColor(r) + '">' + (rarityOwned[r] || 0) + '</span><span class="rs-total">/ ' + rarityCounts[r] + '</span></span>'
    ).join('')

    let filtered = cookies.slice()
    if (crkFilter !== 'all') filtered = filtered.filter(c => c.rarity === crkFilter)

    const query = ($('crk-search')?.value || '').toLowerCase().trim()
    if (query) filtered = filtered.filter(c => c.name.toLowerCase().includes(query))

    if (crkSort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name))
    else if (crkSort === 'power-desc') filtered.sort((a, b) => b.power - a.power)
    else if (crkSort === 'power-asc') filtered.sort((a, b) => a.power - b.power)
    else if (crkSort === 'released') filtered.sort((a, b) => a.released.localeCompare(b.released))
    else filtered.sort((a, b) => (window.RARITY_ORDER[a.rarity] || 99) - (window.RARITY_ORDER[b.rarity] || 99))

    const grid = $('crk-grid')
    grid.innerHTML = filtered.map(c => {
      const isOwned = ownedSet.has(c.id)
      const isFav = favSet.has(c.id)
      const color = rarityColor(c.rarity)
      return '<div class="cookie-card' + (isOwned ? ' obtained' : '') + (isFav ? ' favorite' : '') + '" data-id="' + c.id + '">' +
        '<span class="check-mark">' + (isOwned ? '✓' : '') + '</span>' +
        '<button class="fav-btn" data-id="' + c.id + '">' + (isFav ? '⭐' : '☆') + '</button>' +
        '<button class="rm-btn" data-id="' + c.id + '">✕</button>' +
        '<span class="cookie-icon">' + (c.icon || '🍪') + '</span>' +
        '<div class="cookie-name">' + c.name + '</div>' +
        '<div class="cookie-power">⚡ ' + c.power + '</div>' +
        '<span class="cookie-rarity" style="color:' + color + ';background:' + rarityBg(c.rarity) + ';color:' + color + '">' + c.rarity + '</span>' +
        '</div>'
    }).join('')

    qsa('.cookie-card', grid).forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.closest('.fav-btn') || e.target.closest('.rm-btn')) return
        const id = el.getAttribute('data-id')
        const idx = owned.indexOf(id)
        if (idx >= 0) { owned.splice(idx, 1); el.classList.remove('obtained'); el.classList.remove('just-obtained') }
        else { owned.push(id); el.classList.add('obtained'); el.classList.add('just-obtained'); addNotif('⭐ Collected: ' + (cookies.find(c => c.id === id)?.name || id), 'system') }
        data.ownedCookies = owned
        Store.saveData()
        setTimeout(() => renderCRK(data), 50)
      })
    })

    qsa('.fav-btn', grid).forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation()
        const id = btn.getAttribute('data-id')
        const idx = favs.indexOf(id)
        if (idx >= 0) { favs.splice(idx, 1); btn.textContent = '☆' }
        else { favs.push(id); btn.textContent = '⭐'; addNotif('⭐ Added ' + (cookies.find(c => c.id === id)?.name || id) + ' to favorites', 'system') }
        data.favoriteCookies = favs
        Store.saveData()
      })
    })

    qsa('.rm-btn', grid).forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation()
        const id = btn.getAttribute('data-id')
        const idx = owned.indexOf(id)
        if (idx >= 0) { owned.splice(idx, 1); data.ownedCookies = owned; Store.saveData(); renderCRK(data) }
        const fidx = favs.indexOf(id)
        if (fidx >= 0) { favs.splice(fidx, 1); data.favoriteCookies = favs; Store.saveData() }
      })
    })

    const searchInput = $('crk-search')
    searchInput._listener?.()
    const listener = debounce(() => renderCRK(Store.getData()), 200)
    searchInput._listener = listener
    searchInput.addEventListener('input', listener)

    const sortEl = $('crk-sort')
    sortEl.addEventListener('change', () => { crkSort = sortEl.value; renderCRK(Store.getData()) })
  }

  // CRK Filters & Add
  $('crk-filters')?.addEventListener('click', e => {
    const btn = e.target.closest('button')
    if (!btn) return
    qsa('#crk-filters button').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    crkFilter = btn.getAttribute('data-filter') || 'all'
    renderCRK(Store.getData())
  })

  $('crk-add-btn')?.addEventListener('click', () => {
    const name = $('crk-new-name')
    const rarity = $('crk-new-rarity')
    if (!name || !name.value.trim()) return Toast.show('Error', 'Please enter a cookie name', 'error')
    const data = Store.getData()
    if (!data) return
    const newId = 'custom-' + Date.now()
    data.ownedCookies = data.ownedCookies || []
    data.ownedCookies.push(newId)
    const cc = window.CRK_COOKIES
    cc.unshift({ id: newId, name: name.value.trim(), rarity: rarity.value, power: 0, released: new Date().toISOString().slice(0, 7), icon: '🍪' })
    Store.saveData()
    addNotif('Added custom cookie: ' + name.value.trim(), 'system')
    name.value = ''
    renderCRK(data)
  })

  // Simulate Pull
  function simulatePull () {
    const cookies = window.CRK_COOKIES || []
    const rarities = [
      { r: 'Beast', p: 0.1 },
      { r: 'Ancient', p: 0.3 },
      { r: 'Legendary', p: 0.5 },
      { r: 'Dragon', p: 0.5 },
      { r: 'Super Epic', p: 2 },
      { r: 'Epic', p: 40 },
      { r: 'Rare', p: 30 },
      { r: 'Common', p: 26.6 },
    ]

    const results = []
    for (let i = 0; i < 10; i++) {
      const roll = Math.random() * 100
      let cum = 0
      let chosenRarity = 'Common'
      for (const r of rarities) {
        cum += r.p
        if (roll < cum) { chosenRarity = r.r; break }
      }
      const pool = cookies.filter(c => c.rarity === chosenRarity)
      const chosen = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : { name: 'Unknown', rarity: chosenRarity, id: 'unknown', icon: '🍪' }
      results.push(chosen)
    }

    const data = Store.getData()
    if (!data) return
    data.ownedCookies = data.ownedCookies || []
    data.pullHistory = data.pullHistory || []
    const newCookies = []
    results.forEach(c => {
      if (c.id !== 'unknown') {
        data.ownedCookies.push(c.id)
        if (!data.ownedCookies.includes(c.id)) newCookies.push(c)
      }
      data.pullHistory.unshift({ cookieId: c.id, name: c.name, rarity: c.rarity, icon: c.icon || '🍪', time: new Date().toISOString() })
    })
    if (newCookies.length > 0) addNotif('🎉 New cookies from pull: ' + newCookies.map(c => c.name).join(', '), 'achievement')
    Store.saveData()
    return results
  }

  // Pull History Modal
  $('crk-open-pulls')?.addEventListener('click', () => {
    const overlay = $('pulls-modal-overlay')
    overlay?.classList.add('open')
    renderPullHistory()
  })

  $('pulls-modal-close')?.addEventListener('click', () => $('pulls-modal-overlay')?.classList.remove('open'))
  $('pulls-modal-overlay')?.addEventListener('click', e => { if (e.target === e.currentTarget) e.target.classList.remove('open') })

  $('simulate-pull-btn')?.addEventListener('click', () => {
    const results = simulatePull()
    if (results) {
      Toast.show('🎲 10-Pull Complete', 'Got ' + results.filter(r => ['Beast','Ancient','Legendary','Dragon'].includes(r.rarity)).length + ' high-rarity cookies!', 'success')
      renderPullHistory()
      navigateTo('crk-gacha')
    }
  })

  $('clear-pull-history')?.addEventListener('click', () => {
    const data = Store.getData()
    if (data) { data.pullHistory = []; Store.saveData(); renderPullHistory(); addNotif('Pull history cleared', 'system') }
  })

  function renderPullHistory () {
    const data = Store.getData()
    const list = $('pull-history-list')
    const countEl = $('total-pulls-count')
    if (!list || !data) return
    const history = data.pullHistory || []
    if (countEl) countEl.textContent = history.length

    if (history.length === 0) {
      list.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-muted)">No pulls yet. Click "Simulate 10-Pull" to start!</div>'
      return
    }

    list.innerHTML = history.slice(0, 50).map(p =>
      '<div class="pull-entry"><span class="pull-icon">' + (p.icon || '🍪') + '</span><div class="pull-info"><div class="pull-name">' + p.name + '</div><div class="pull-meta"><span class="pull-rarity pull-rarity-' + p.rarity.replace(' ', '-') + '">' + p.rarity + '</span></div></div><span class="pull-time">' + fmtDate(p.time) + '</span></div>'
    ).join('')
  }

  // --- ANALYTICS ---
  registerPage('analytics', () => {
    const data = Store.getData()
    if (!data) return

    const cookies = window.CRK_COOKIES || []
    const owned = data.ownedCookies || []
    const history = data.pullHistory || []
    const ownedSet = new Set(owned)
    const total = cookies.length
    const ownedCount = owned.length
    const pct = total > 0 ? Math.round((ownedCount / total) * 100) : 0

    const grid = $('pull-stats-grid')
    grid.innerHTML =
      '<div class="widget analytics-stat"><div class="num neon-text">' + ownedCount + '</div><div class="lbl">Cookies Owned</div></div>' +
      '<div class="widget analytics-stat"><div class="num neon-text">' + total + '</div><div class="lbl">Total Available</div></div>' +
      '<div class="widget analytics-stat"><div class="num neon-text">' + (data.favoriteCookies?.length || 0) + '</div><div class="lbl">⭐ Favorites</div></div>' +
      '<div class="widget analytics-stat"><div class="num neon-text">' + history.length + '</div><div class="lbl">Total Pulls</div></div>'

    // Pull history chart
    const pullChart = $('pull-chart')
    const lastPulls = history.slice(0, 20).reverse()
    if (lastPulls.length > 0) {
      pullChart.innerHTML = lastPulls.map(p =>
        '<div class="chart-bar-vis ' + p.rarity.toLowerCase().replace(' ', '-') + '" style="height:' + (p.rarity === 'Common' ? '20' : p.rarity === 'Rare' ? '30' : p.rarity === 'Epic' ? '50' : p.rarity === 'Super Epic' ? '65' : p.rarity === 'Ancient' || p.rarity === 'Legendary' || p.rarity === 'Dragon' ? '80' : '100') + '%" title="' + p.name + ' (' + p.rarity + ')' + '"></div>'
      ).join('')
    } else {
      pullChart.innerHTML = '<div style="text-align:center;color:var(--text-muted);width:100%;padding:40px 0">No pull data yet</div>'
    }

    // Rarity distribution
    const rarityChart = $('rarity-chart')
    const rarityCounts = {}
    owned.forEach(id => { const c = cookies.find(cc => cc.id === id); if (c) rarityCounts[c.rarity] = (rarityCounts[c.rarity] || 0) + 1 })
    const allRarities = ['Beast','Ancient','Legendary','Dragon','Super Epic','Epic','Rare','Common']
    const maxCount = Math.max(...allRarities.map(r => rarityCounts[r] || 0), 1)
    rarityChart.innerHTML = '<div style="display:flex;flex-direction:column;gap:8px;width:100%">' +
      allRarities.filter(r => rarityCounts[r]).map(r =>
        '<div style="display:flex;align-items:center;gap:8px"><span style="width:70px;font-size:0.8rem;color:' + rarityColor(r) + '">' + r + '</span><div class="progress-bar" style="flex:1;height:18px;background:rgba(255,255,255,0.04)"><div class="progress-bar-fill" style="width:' + Math.round((rarityCounts[r] / maxCount) * 100) + '%;height:100%;background:' + rarityColor(r) + '"></div></div><span style="font-size:0.8rem;width:30px;text-align:right;font-weight:600">' + rarityCounts[r] + '</span></div>'
      ).join('') + '</div>'

    // Achievements
    const achGrid = $('achievements-grid')
    const milestones = [10, 25, 50, 75, 100]
    const pullMilestones = [10, 50, 100, 500]
    const achievements = [
      { id: 'a1', title: 'Cookie Collector', desc: 'Collect 10 cookies', icon: '🍪', progress: Math.min(ownedCount, 10), max: 10, unlocked: ownedCount >= 10 },
      { id: 'a2', title: 'Serious Baker', desc: 'Collect 25 cookies', icon: '🧑‍🍳', progress: Math.min(ownedCount, 25), max: 25, unlocked: ownedCount >= 25 },
      { id: 'a3', title: 'Master Chef', desc: 'Collect 50 cookies', icon: '👨‍🍳', progress: Math.min(ownedCount, 50), max: 50, unlocked: ownedCount >= 50 },
      { id: 'a4', title: 'Cookie Legend', desc: 'Collect 75 cookies', icon: '🏆', progress: Math.min(ownedCount, 75), max: 75, unlocked: ownedCount >= 75 },
      { id: 'a5', title: 'Completionist', desc: 'Collect ALL cookies', icon: '👑', progress: Math.min(ownedCount, total), max: total, unlocked: ownedCount >= total },
      { id: 'a6', title: 'Gacha Addict', desc: 'Perform 10 pulls', icon: '🎲', progress: Math.min(history.length, 10), max: 10, unlocked: history.length >= 10 },
      { id: 'a7', title: 'High Roller', desc: 'Perform 100 pulls', icon: '💰', progress: Math.min(history.length, 100), max: 100, unlocked: history.length >= 100 },
      { id: 'a8', title: 'Ancient Seeker', desc: 'Collect all Ancients', icon: '👑', progress: cookies.filter(c => c.rarity === 'Ancient' && ownedSet.has(c.id)).length, max: cookies.filter(c => c.rarity === 'Ancient').length, unlocked: cookies.filter(c => c.rarity === 'Ancient').every(c => ownedSet.has(c.id)) },
      { id: 'a9', title: 'Beast Tamer', desc: 'Collect all Beasts', icon: '🔥', progress: cookies.filter(c => c.rarity === 'Beast' && ownedSet.has(c.id)).length, max: cookies.filter(c => c.rarity === 'Beast').length, unlocked: cookies.filter(c => c.rarity === 'Beast').every(c => ownedSet.has(c.id)) },
      { id: 'a10', title: 'Star Collector', desc: 'Favorite 5 cookies', icon: '⭐', progress: Math.min(data.favoriteCookies?.length || 0, 5), max: 5, unlocked: (data.favoriteCookies?.length || 0) >= 5 },
    ]

    achGrid.innerHTML = achievements.map(a =>
      '<div class="achievement-card' + (a.unlocked ? ' unlocked' : ' locked') + '">' +
      '<span class="ach-icon">' + a.icon + '</span>' +
      '<div class="ach-title">' + a.title + '</div>' +
      '<div class="ach-desc">' + a.desc + '</div>' +
      '<div class="ach-progress"><div class="fill" style="width:' + Math.round((a.progress / a.max) * 100) + '%"></div></div>' +
      '<div style="font-size:0.65rem;color:var(--text-muted);margin-top:4px">' + a.progress + '/' + a.max + '</div>' +
      '</div>'
    ).join('')
  })

  // Export button
  $('analytics-export-btn')?.addEventListener('click', exportAllData)

  // --- WLPM ---
  registerPage('wlpm', () => {
    const data = Store.getData()
    if (!data) return
    renderPackages(data.packages)
    setupWLPM(data)
  })

  function renderPackages (pkgs) {
    const grid = $('packages-grid')
    grid.innerHTML = pkgs.map(p =>
      '<div class="pkg-card"><div class="pkg-name">' + p.name + '</div><div class="pkg-desc">' + trunc(p.desc, 60) + '</div><div class="pkg-ver">v' + p.ver + ' · ' + (p.dl >= 1000 ? Math.round(p.dl/1000) + 'k' : p.dl) + ' dl</div><button class="pkg-install-btn ' + (p.inst ? 'installed' : '') + '" data-id="' + p.id + '">' + (p.inst ? '✓ Installed' : 'Install') + '</button></div>'
    ).join('')
    qsa('.pkg-install-btn', grid).forEach(btn => {
      btn.addEventListener('click', () => {
        const data = Store.getData()
        if (!data) return
        const pkg = data.packages.find(p => p.id === btn.getAttribute('data-id'))
        if (!pkg) return
        pkg.inst = !pkg.inst
        Store.saveData()
        addNotif((pkg.inst ? 'Installed' : 'Uninstalled') + ': ' + pkg.name, 'package')
        renderPackages(data.packages)
      })
    })
  }

  let wlpmFilter = 'all'
  function setupWLPM (data) {
    const searchInput = $('wlpm-search')
    const apply = debounce(() => {
      const q = (searchInput?.value || '').toLowerCase().trim()
      let filtered = data.packages.slice()
      if (wlpmFilter === 'installed') filtered = filtered.filter(p => p.inst)
      else if (wlpmFilter === 'available') filtered = filtered.filter(p => !p.inst)
      if (q) filtered = filtered.filter(p => p.name.includes(q) || p.desc.includes(q))
      renderPackages(filtered)
    }, 200)
    searchInput?.addEventListener('input', apply)
    qsa('.wlpm-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        qsa('.wlpm-filter-btn').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        wlpmFilter = btn.getAttribute('data-filter') || 'all'
        apply()
      })
    })
  }

  // --- DEV HUB ---
  registerPage('developer-hub', () => {
    const data = Store.getData()
    if (!data) return
    const tools = [
      { title: 'Code Editor', desc: 'Multi-language IDE', icon: '📝', color: '#00ff88' },
      { title: 'Terminal', desc: 'Integrated shell', icon: '⊞', color: '#00ccff' },
      { title: 'Debugger', desc: 'Step-through analysis', icon: '◎', color: '#ff6600' },
      { title: 'API Tester', desc: 'REST/GraphQL testing', icon: '⇄', color: '#ff00ff' },
    ]
    const grid = $('dev-tools-grid')
    grid.innerHTML = tools.map(t =>
      '<div class="dev-tool-card"><div class="dev-tool-icon" style="background:' + t.color + '20;color:' + t.color + ';margin:0 auto 10px">' + t.icon + '</div><div class="dev-tool-title">' + t.title + '</div><div class="dev-tool-desc">' + t.desc + '</div></div>'
    ).join('')

    const list = $('dev-projects-list')
    list.innerHTML = data.repos.slice(0, 4).map(r =>
      '<div class="repo-item"><span class="repo-icon">📂</span><div class="repo-info"><div class="repo-name">' + r.name + '</div><div class="repo-meta">' + r.lang + ' · ⭐ ' + r.stars + '</div></div></div>'
    ).join('')
  })

  // New Repo Modal
  $('create-repo-btn')?.addEventListener('click', () => $('repo-modal-overlay')?.classList.add('open'))
  $('repo-modal-close')?.addEventListener('click', () => $('repo-modal-overlay')?.classList.remove('open'))
  $('repo-modal-cancel')?.addEventListener('click', () => $('repo-modal-overlay')?.classList.remove('open'))
  $('repo-modal-overlay')?.addEventListener('click', e => { if (e.target === e.currentTarget) e.target.classList.remove('open') })
  $('repo-form')?.addEventListener('submit', e => {
    e.preventDefault()
    const name = $('repo-name-input')
    if (!name?.value.trim()) return
    const data = Store.getData()
    if (!data) return
    data.repos.unshift({ id:'r-'+Date.now(), name: name.value.trim(), desc: $('repo-desc-input')?.value.trim() || '', stars:0, lang: $('repo-lang-select')?.value || 'JavaScript', updated: new Date().toISOString() })
    Store.saveData()
    addNotif('Created repo: ' + name.value.trim(), 'system')
    $('repo-modal-overlay')?.classList.remove('open')
    $('repo-form').reset()
    navigateTo('developer-hub')
  })

  // --- CLOUD ---
  registerPage('cloud-center', () => {
    const data = Store.getData()
    if (!data) return
    const files = data.cloudFiles || []
    const totalSize = files.reduce((s, f) => s + f.size, 0)
    const maxSize = 500000000
    const pct = Math.min((totalSize / maxSize) * 100, 100)
    $('cloud-storage-bar').style.width = pct + '%'
    $('cloud-storage-label').textContent = fmtBytes(totalSize) + ' / ' + fmtBytes(maxSize)

    const list = $('cloud-files-list')
    list.innerHTML = files.map(f =>
      '<div class="cloud-file-item"><span class="cloud-file-icon">' + (f.type === 'image' ? '🖼' : f.type === 'pdf' ? '📄' : f.type === 'archive' ? '📦' : f.type === 'folder' ? '📁' : f.type === 'code' ? '📝' : '📄') + '</span><div class="cloud-file-info"><div class="cloud-file-name">' + f.name + '</div><div class="cloud-file-meta">' + fmtBytes(f.size) + ' · ' + fmtDate(f.mod) + (f.shared ? ' · Shared' : '') + '</div></div></div>'
    ).join('')
  })

  $('cloud-upload-btn')?.addEventListener('click', () => {
    const data = Store.getData()
    if (!data) return
    const names = ['report.txt', 'photo.png', 'backup.zip', 'script.js', 'settings.json']
    const types = ['pdf', 'image', 'archive', 'code', 'code']
    const idx = Math.floor(Math.random() * names.length)
    data.cloudFiles.unshift({ id:'f-'+Date.now(), name: names[idx], type: types[idx], size: Store._rand(10000,1000000), mod: new Date().toISOString(), shared: false })
    Store.saveData()
    addNotif('Uploaded: ' + names[idx], 'system')
    navigateTo('cloud-center')
  })

  // --- MEDIA ---
  let mediaFilter = 'all'
  let mediaIdx = 0
  let mediaPlaying = false
  registerPage('media-center', () => {
    const data = Store.getData()
    if (!data) return
    mediaPlaying = false
    renderMedia(data.mediaItems)
  })

  function renderMedia (items) {
    const filtered = mediaFilter === 'all' ? items : items.filter(m => m.type === mediaFilter)
    const grid = $('media-grid')
    const iconMap = { image: '🖼', video: '🎬', music: '🎵' }
    grid.innerHTML = filtered.map((m, i) =>
      '<div class="media-item" data-idx="' + i + '"><span style="font-size:2rem">' + (iconMap[m.type] || '📁') + '</span><span>' + m.title + '</span></div>'
    ).join('')
    qsa('.media-item', grid).forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.getAttribute('data-idx'))
        const realIdx = mediaFilter === 'all' ? idx : items.indexOf(filtered[idx])
        mediaIdx = realIdx >= 0 ? realIdx : idx
        mediaPlaying = true
        updateMediaPlayer(items)
      })
    })
  }

  function updateMediaPlayer (items) {
    const item = items[mediaIdx]
    if (!item) return
    $('media-player-title').textContent = item.title
    $('media-player-artist').textContent = item.artist || 'Unknown'
    $('media-play-btn').textContent = mediaPlaying ? '⏸' : '▶'
  }

  qsa('.media-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      qsa('.media-filter-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      mediaFilter = btn.getAttribute('data-filter') || 'all'
      const data = Store.getData()
      if (data) renderMedia(data.mediaItems)
    })
  })

  $('media-play-btn')?.addEventListener('click', () => {
    mediaPlaying = !mediaPlaying
    const data = Store.getData()
    if (data) updateMediaPlayer(data.mediaItems)
  })

  $('media-next-btn')?.addEventListener('click', () => {
    const data = Store.getData()
    if (!data) return
    mediaIdx = mediaIdx >= data.mediaItems.length - 1 ? 0 : mediaIdx + 1
    mediaPlaying = true
    updateMediaPlayer(data.mediaItems)
  })

  $('media-prev-btn')?.addEventListener('click', () => {
    const data = Store.getData()
    if (!data) return
    mediaIdx = mediaIdx <= 0 ? data.mediaItems.length - 1 : mediaIdx - 1
    mediaPlaying = true
    updateMediaPlayer(data.mediaItems)
  })

  // --- BROWSER ---
  let browserTabs = [{ id:'bt-1', title:'New Tab', url:'about:blank', active:true }]
  registerPage('browser', () => {
    renderBrowserTabs()
    renderBrowserContent()
    setupBrowser()
  })

  function renderBrowserTabs () {
    const container = $('browser-tabs')
    container.innerHTML = browserTabs.map((t, i) =>
      '<div class="browser-tab' + (t.active ? ' active' : '') + '" data-idx="' + i + '"><span>' + t.title + '</span><button class="tab-close" data-idx="' + i + '">×</button></div>'
    ).join('') + '<button class="browser-tab-add" id="browser-new-tab">+</button>'

    qsa('.browser-tab', container).forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.closest('.tab-close')) return
        browserTabs.forEach(t => t.active = false)
        browserTabs[parseInt(el.getAttribute('data-idx'))].active = true
        renderBrowserTabs()
        renderBrowserContent()
      })
    })
    qsa('.tab-close', container).forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation()
        const idx = parseInt(el.getAttribute('data-idx'))
        if (browserTabs.length <= 1) return
        browserTabs.splice(idx, 1)
        const newIdx = Math.min(idx, browserTabs.length - 1)
        browserTabs[newIdx].active = true
        renderBrowserTabs()
        renderBrowserContent()
      })
    })
  }

  function renderBrowserContent () {
    const active = browserTabs.find(t => t.active)
    const urlBar = $('browser-url')
    const content = $('browser-content')
    if (urlBar && active) urlBar.value = active.url
    if (content && active) {
      content.innerHTML = active.url === 'about:blank'
        ? '<div style="text-align:center;padding:60px 20px;color:var(--text-muted)"><div style="font-size:3rem;margin-bottom:16px">🌐</div><h3>Welcome to Huntrix Browser</h3><p style="font-size:0.85rem">Enter a URL or search term above</p></div>'
        : '<div style="padding:20px;color:var(--text-secondary)"><p>Rendering: <strong>' + active.url + '</strong></p><p style="font-size:0.8rem;color:var(--text-muted);margin-top:8px">Content rendering simulated</p></div>'
    }
  }

  function setupBrowser () {
    const goBtn = $('browser-go-btn')
    const urlBar = $('browser-url')
    if (goBtn && urlBar) {
      function go () {
        let url = urlBar.value.trim()
        if (!url) return
        if (!url.includes('.') && !url.includes('://')) url = 'https://search.huntrix.io/search?q=' + encodeURIComponent(url)
        else if (!url.includes('://')) url = 'https://' + url
        const active = browserTabs.find(t => t.active)
        if (active) { active.url = url; active.title = url.replace('https://','').split('/')[0] }
        renderBrowserTabs()
        renderBrowserContent()
      }
      goBtn.addEventListener('click', go)
      urlBar.addEventListener('keydown', e => { if (e.key === 'Enter') go() })
    }
    $('browser-back')?.addEventListener('click', () => Toast.show('Browser', 'Navigation simulated', 'info'))
    $('browser-forward')?.addEventListener('click', () => Toast.show('Browser', 'Navigation simulated', 'info'))
    $('browser-refresh')?.addEventListener('click', () => renderBrowserContent())
    $('browser-bookmarks-toggle')?.addEventListener('click', () => $('browser-bookmarks-dropdown')?.classList.toggle('active'))
  }

  // --- PRODUCTIVITY ---
  registerPage('productivity', () => {
    const data = Store.getData()
    if (!data) return
    renderNotes(data)
    renderTasks(data)
    setupPomodoro()
    renderCalendar()
  })

  function renderNotes (data) {
    const container = $('notes-list')
    const notes = (data.notes || []).slice().sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
    container.innerHTML = notes.map(n =>
      '<div class="note-item' + (n.pinned ? ' pinned' : '') + '" data-id="' + n.id + '"><div class="note-header"><div class="note-title">' + n.title + (n.pinned ? ' 📌' : '') + '</div></div><div class="note-content">' + trunc(n.content, 100) + '</div><div class="note-meta"><span class="note-date">' + fmtDate(n.upd || n.crt) + '</span><div class="note-actions"><button class="note-pin" data-id="' + n.id + '">' + (n.pinned ? 'Unpin' : 'Pin') + '</button><button class="note-edit" data-id="' + n.id + '">Edit</button><button class="note-del" data-id="' + n.id + '">Del</button></div></div></div>'
    ).join('')

    qsa('.note-pin', container).forEach(b => {
      b.addEventListener('click', () => {
        const n = data.notes.find(no => no.id === b.getAttribute('data-id'))
        if (n) { n.pinned = !n.pinned; Store.saveData(); renderNotes(data) }
      })
    })
    qsa('.note-edit', container).forEach(b => {
      b.addEventListener('click', () => {
        const n = data.notes.find(no => no.id === b.getAttribute('data-id'))
        if (!n) return
        $('note-title-input').value = n.title
        $('note-content-input').value = n.content
        $('note-modal-title').textContent = 'Edit Note'
        $('note-form')._editId = n.id
        $('note-modal-overlay').classList.add('open')
      })
    })
    qsa('.note-del', container).forEach(b => {
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-id')
        data.notes = data.notes.filter(no => no.id !== id)
        Store.saveData()
        renderNotes(data)
        addNotif('Note deleted', 'system')
      })
    })
  }

  $('note-add-btn')?.addEventListener('click', () => {
    $('note-title-input').value = ''
    $('note-content-input').value = ''
    $('note-modal-title').textContent = 'New Note'
    $('note-form')._editId = null
    $('note-modal-overlay').classList.add('open')
  })
  $('note-cancel-btn')?.addEventListener('click', () => $('note-modal-overlay')?.classList.remove('open'))
  $('note-modal-cancel')?.addEventListener('click', () => $('note-modal-overlay')?.classList.remove('open'))
  $('note-modal-overlay')?.addEventListener('click', e => { if (e.target === e.currentTarget) e.target.classList.remove('open') })
  $('note-form')?.addEventListener('submit', e => {
    e.preventDefault()
    const data = Store.getData()
    if (!data) return
    const title = $('note-title-input').value.trim()
    const content = $('note-content-input').value.trim()
    if (!title) return Toast.show('Error', 'Title is required', 'error')
    const editId = $('note-form')._editId
    if (editId) {
      const n = data.notes.find(no => no.id === editId)
      if (n) { n.title = title; n.content = content; n.upd = new Date().toISOString() }
    } else {
      data.notes.push({ id: 'n-' + Date.now(), title, content, crt: new Date().toISOString(), upd: new Date().toISOString(), pinned: false })
    }
    Store.saveData()
    $('note-modal-overlay').classList.remove('open')
    renderNotes(data)
    addNotif(editId ? 'Note updated' : 'Note created', 'system')
  })

  function renderTasks (data) {
    const container = $('tasks-list')
    const filter = qs('.task-filter-btn.active')?.getAttribute('data-filter') || 'all'
    let tasks = data.tasks || []
    if (filter === 'active') tasks = tasks.filter(t => !t.done)
    else if (filter === 'completed') tasks = tasks.filter(t => t.done)
    container.innerHTML = tasks.map(t =>
      '<div class="task-item' + (t.done ? ' completed' : '') + '" data-id="' + t.id + '"><input type="checkbox" class="task-checkbox" data-id="' + t.id + '" ' + (t.done ? 'checked' : '') + '><div class="task-content"><span class="task-title">' + t.title + '</span><div class="task-meta"><span>' + (t.prio || 'medium') + '</span><span>' + (t.cat || 'general') + '</span></div></div><button class="task-delete-btn" data-id="' + t.id + '">×</button></div>'
    ).join('')

    qsa('.task-checkbox', container).forEach(cb => {
      cb.addEventListener('change', () => {
        const t = data.tasks.find(ta => ta.id === cb.getAttribute('data-id'))
        if (t) { t.done = cb.checked; Store.saveData(); renderTasks(data) }
      })
    })
    qsa('.task-delete-btn', container).forEach(b => {
      b.addEventListener('click', () => {
        data.tasks = data.tasks.filter(ta => ta.id !== b.getAttribute('data-id'))
        Store.saveData()
        renderTasks(data)
      })
    })
  }

  qsa('.task-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      qsa('.task-filter-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      const data = Store.getData()
      if (data) renderTasks(data)
    })
  })

  $('task-add-btn')?.addEventListener('click', () => {
    const input = $('task-input')
    if (!input?.value.trim()) return Toast.show('Error', 'Task title required', 'error')
    const data = Store.getData()
    if (!data) return
    data.tasks = data.tasks || []
    data.tasks.push({ id:'t-'+Date.now(), title: input.value.trim(), done:false, prio:'medium', cat:'general', due: new Date(Date.now()+86400000*3).toISOString() })
    Store.saveData()
    input.value = ''
    renderTasks(data)
    addNotif('Task added', 'system')
  })
  $('task-input')?.addEventListener('keydown', e => { if (e.key === 'Enter') $('task-add-btn')?.click() })

  // Pomodoro
  let pomo = { minutes: 25, seconds: 0, interval: null, running: false, mode: 'work' }
  function setupPomodoro () {
    updatePomo()
    $('pomodoro-start')?.addEventListener('click', () => {
      if (!pomo.running) { pomo.running = true; pomo.interval = setInterval(pomoTick, 1000) }
    })
    $('pomodoro-pause')?.addEventListener('click', () => { pomo.running = false; if (pomo.interval) { clearInterval(pomo.interval); pomo.interval = null } })
    $('pomodoro-reset')?.addEventListener('click', () => {
      pomo.running = false; if (pomo.interval) { clearInterval(pomo.interval); pomo.interval = null }
      pomo.minutes = 25; pomo.seconds = 0; pomo.mode = 'work'; updatePomo()
    })
  }

  function pomoTick () {
    if (pomo.seconds === 0) {
      if (pomo.minutes === 0) {
        if (pomo.mode === 'work') { pomo.mode = 'break'; pomo.minutes = 5; pomo.seconds = 0; addNotif('Work session complete! Time for a break.', 'system') }
        else { pomo.mode = 'work'; pomo.minutes = 25; pomo.seconds = 0; addNotif('Break over! Back to focus.', 'system') }
      } else { pomo.minutes--; pomo.seconds = 59 }
    } else { pomo.seconds-- }
    updatePomo()
  }

  function updatePomo () {
    const d = $('pomodoro-display')
    const m = $('pomodoro-mode')
    if (d) d.textContent = String(pomo.minutes).padStart(2,'0') + ':' + String(pomo.seconds).padStart(2,'0')
    if (m) m.textContent = pomo.mode === 'work' ? '🎯 Focus Time' : '☕ Break Time'
  }

  function renderCalendar () {
    const container = $('productivity-calendar')
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    let html = '<div class="calendar-header">' + months[month] + ' ' + year + '</div><div class="calendar-weekdays">' + dayNames.map(d => '<span>' + d + '</span>').join('') + '</div><div class="calendar-days">'
    for (let i = 0; i < firstDay; i++) html += '<span class="cal-day cal-empty"></span>'
    const today = now.getDate()
    for (let d = 1; d <= daysInMonth; d++) html += '<span class="cal-day' + (d === today ? ' cal-today' : '') + '">' + d + '</span>'
    html += '</div>'
    container.innerHTML = html
  }

  // --- SETTINGS ---
  registerPage('settings', () => {
    const prefs = Store.getPrefs()
    $('settings-name').value = 'Admin User'
    $('settings-username').value = Store.user || 'user'
    $('settings-theme').value = prefs.theme || 'dark'
    $('settings-accent').value = prefs.accent || '#00d4ff'
    $('settings-accent-val').textContent = prefs.accent || '#00d4ff'
    $('settings-notifications').checked = prefs.notifications !== false
    $('settings-version').textContent = 'Huntrix OS Dashboard v2.0.0'

    $('settings-accent').addEventListener('input', function () {
      $('settings-accent-val').textContent = this.value
      applyAccent(this.value)
    })

    $('settings-theme').addEventListener('change', function () {
      applyTheme(this.value)
      const p = Store.getPrefs(); p.theme = this.value; Store.savePrefs(p)
    })

    $('settings-notifications').addEventListener('change', function () {
      const p = Store.getPrefs(); p.notifications = this.checked; Store.savePrefs(p)
    })
  })

  // Data Management
  $('export-data-btn')?.addEventListener('click', exportAllData)

  $('import-data-btn')?.addEventListener('click', () => $('import-file-input')?.click())
  $('import-file-input')?.addEventListener('change', function () {
    const file = this.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result)
        if (!data || !data.ownedCookies) throw new Error('Invalid data format')
        localStorage.setItem(Store.key(), JSON.stringify(data))
        Store._data = null
        Store.getData()
        Toast.show('Success', 'Data imported successfully!', 'success')
        addNotif('Data imported from ' + file.name, 'system')
        navigateTo(currentPage)
      } catch (err) {
        Toast.show('Import Error', 'Invalid file format: ' + err.message, 'error')
      }
    }
    reader.readAsText(file)
    this.value = ''
  })

  $('reset-data-btn')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset ALL data? This cannot be undone.')) {
      localStorage.removeItem(Store.key())
      Store._data = null
      Store.getData()
      Toast.show('Data Reset', 'All data has been reset to defaults', 'info')
      addNotif('Data reset completed', 'system')
      navigateTo(currentPage)
    }
  })

  function exportAllData () {
    const data = Store.getData()
    if (!data) return
    const exportObj = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      stats: data.stats,
      ownedCookies: data.ownedCookies || [],
      favoriteCookies: data.favoriteCookies || [],
      pullHistory: (data.pullHistory || []).slice(0, 100),
      notes: (data.notes || []).length,
      tasks: (data.tasks || []).length,
    }
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'huntrix-backup-' + new Date().toISOString().slice(0, 10) + '.json'
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
    addNotif('Data exported successfully', 'system')
  }

  // ============================================================
  // AUTH
  // ============================================================
  function initAuth () {
    const authContainer = $('auth-container')
    const app = $('app')

    function showApp () {
      authContainer.classList.add('hidden')
      app.classList.add('active')
    }

    function showAuth () {
      authContainer.classList.remove('hidden')
      app.classList.remove('active')
    }

    if (Store.init()) {
      showApp()
    } else {
      showAuth()
      $('loading-screen')?.classList.add('hidden')
    }

    // Login
    $('login-form')?.addEventListener('submit', e => {
      e.preventDefault()
      const username = $('login-username')
      const password = $('login-password')
      const msg = $('login-message')
      if (!username || !password) return
      const result = Store.login(username.value, password.value)
      if (msg) { msg.textContent = result.msg; msg.className = 'form-message' + (result.ok ? ' success' : '') }
      if (result.ok) {
        loadApp()
        username.value = ''; password.value = ''
      }
    })

    // Register
    $('register-form')?.addEventListener('submit', e => {
      e.preventDefault()
      const username = $('reg-username')
      const password = $('reg-password')
      const confirm = $('reg-confirm')
      const msg = $('register-message')
      if (!username || !password) return
      if (confirm && confirm.value !== password.value) {
        if (msg) { msg.textContent = 'Passwords do not match.'; msg.className = 'form-message' }
        return
      }
      const result = Store.register(username.value, password.value)
      if (msg) { msg.textContent = result.msg; msg.className = 'form-message' + (result.ok ? ' success' : '') }
      if (result.ok) {
        loadApp()
        username.value = ''; password.value = ''; if (confirm) confirm.value = ''
      }
    })

    // Switch auth pages
    $('show-register')?.addEventListener('click', e => {
      e.preventDefault()
      $('auth-login').classList.remove('active')
      $('auth-register').classList.add('active')
      $('login-message').textContent = ''
    })
    $('show-login')?.addEventListener('click', e => {
      e.preventDefault()
      $('auth-register').classList.remove('active')
      $('auth-login').classList.add('active')
      $('register-message').textContent = ''
    })

    // Logout
    $('logout-btn')?.addEventListener('click', () => {
      Store.logout()
      showAuth()
      qs('.sidebar')?.classList.remove('open')
      qs('.sidebar-overlay')?.classList.remove('open')
    })

    function loadApp () {
      showApp()
      const data = Store.getData()
      const prefs = Store.getPrefs()
      applyTheme(prefs.theme || 'dark')
      applyAccent(prefs.accent || '#00d4ff')

      $('user-avatar').textContent = (Store.user || 'U').charAt(0).toUpperCase()
      $('user-name').textContent = Store.user || 'User'

      initNavigation()
      initNotifications()
      initSearch()
      initCommandPalette()
      initCRKEvents()

      // Show loading screen briefly then fade
      const ls = $('loading-screen')
      setTimeout(() => ls?.classList.add('hidden'), 500)

      navigateTo('dashboard')
    }

    // If already authenticated, load
    if (Store.init()) loadApp()
  }

  // CRK filter/sort events (delegated)
  function initCRKEvents () {
    const sortEl = $('crk-sort')
    if (sortEl && !sortEl._init) {
      sortEl._init = true
      sortEl.addEventListener('change', () => {
        crkSort = sortEl.value
        const data = Store.getData()
        if (data) renderCRK(data)
      })
    }
    // Pull modal
    const pullOverlay = $('pulls-modal-overlay')
    $('pulls-modal-close')?.addEventListener('click', () => pullOverlay?.classList.remove('open'))
    pullOverlay?.addEventListener('click', e => { if (e.target === pullOverlay) pullOverlay.classList.remove('open') })

    $('simulate-pull-btn')?.addEventListener('click', () => {
      const results = simulatePull()
      if (results) {
        Toast.show('🎲 10-Pull Complete!', 'Got ' + results.filter(r => ['Beast','Ancient','Legendary','Dragon'].includes(r.rarity)).length + ' high-rarity!', 'success')
        renderPullHistory()
        navigateTo('crk-gacha')
      }
    })

    $('clear-pull-history')?.addEventListener('click', () => {
      const data = Store.getData()
      if (data) { data.pullHistory = []; Store.saveData(); renderPullHistory(); addNotif('Pull history cleared', 'system') }
    })
  }

  // ============================================================
  // BOOT
  // ============================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth)
  } else {
    initAuth()
  }
})()
