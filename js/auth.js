;(function () {
  'use strict'

  const STORAGE_USERS_KEY = 'huntrix_users'
  const STORAGE_SESSION_KEY = 'huntrix_user'

  function getUsers () {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_USERS_KEY)) || []
    } catch {
      return []
    }
  }

  function saveUsers (users) {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users))
  }

  function simpleHash (str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const chr = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + chr
      hash |= 0
    }
    return Math.abs(hash).toString(16)
  }

  function generateId () {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  }

  function getInitials (username) {
    return username.charAt(0).toUpperCase()
  }

  function register (username, password) {
    if (!username || username.length < 3) {
      return { success: false, message: 'Username must be at least 3 characters.' }
    }
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      return { success: false, message: 'Username must be alphanumeric.' }
    }
    if (!password || password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters.' }
    }

    const users = getUsers()
    if (users.some(function (u) { return u.username.toLowerCase() === username.toLowerCase() })) {
      return { success: false, message: 'Username is already taken.' }
    }

    const user = {
      id: generateId(),
      username: username,
      password: simpleHash(password),
      createdAt: new Date().toISOString(),
      avatar: getInitials(username),
      preferences: {
        theme: 'dark',
        accent: '#00ffff',
        notifications: true
      }
    }

    users.push(user)
    saveUsers(users)

    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(user))

    return { success: true, message: 'Registration successful.' }
  }

  function login (username, password) {
    if (!username || !password) {
      return { success: false, message: 'Username and password are required.' }
    }

    const users = getUsers()
    var found = null
    for (var i = 0; i < users.length; i++) {
      if (users[i].username.toLowerCase() === username.toLowerCase()) {
        found = users[i]
        break
      }
    }

    if (!found) {
      return { success: false, message: 'User not found.' }
    }

    if (found.password !== simpleHash(password)) {
      return { success: false, message: 'Incorrect password.' }
    }

    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(found))

    return { success: true, message: 'Login successful.', user: found }
  }

  function logout () {
    localStorage.removeItem(STORAGE_SESSION_KEY)
    return { success: true }
  }

  function isAuthenticated () {
    return localStorage.getItem(STORAGE_SESSION_KEY) !== null
  }

  function getCurrentUser () {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_SESSION_KEY))
    } catch {
      return null
    }
  }

  function updatePreferences (prefs) {
    var user = getCurrentUser()
    if (!user) {
      return { success: false, message: 'No authenticated user.' }
    }

    var updatedPrefs = {}
    for (var key in user.preferences) {
      if (user.preferences.hasOwnProperty(key)) {
        updatedPrefs[key] = user.preferences[key]
      }
    }
    for (var pkey in prefs) {
      if (prefs.hasOwnProperty(pkey)) {
        updatedPrefs[pkey] = prefs[pkey]
      }
    }
    user.preferences = updatedPrefs

    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(user))

    var users = getUsers()
    for (var j = 0; j < users.length; j++) {
      if (users[j].id === user.id) {
        users[j].preferences = updatedPrefs
        break
      }
    }
    saveUsers(users)

    return { success: true, message: 'Preferences updated.', user: user }
  }

  window.HuntrixAuth = {
    register: register,
    login: login,
    logout: logout,
    isAuthenticated: isAuthenticated,
    getCurrentUser: getCurrentUser,
    updatePreferences: updatePreferences,
    simpleHash: simpleHash
  }

  function $(id) { return document.getElementById(id) }

  function show (id) { $(id).classList.remove('hidden') }

  function hide (id) { $(id).classList.add('hidden') }

  function init () {
    if (isAuthenticated()) {
      show('dashboard-page')
      hide('auth-page')
    } else {
      show('auth-page')
      hide('dashboard-page')
    }

    var loginForm = $('login-form')
    var registerForm = $('register-form')
    var loginBtn = $('login-btn')
    var registerBtn = $('register-btn')
    var showRegisterLink = $('show-register')
    var showLoginLink = $('show-login')
    var logoutBtn = $('logout-btn')

    if (loginForm) {
      loginForm.addEventListener('submit', function (e) {
        e.preventDefault()
        var username = $('login-username')
        var password = $('login-password')
        var msgEl = $('login-message')

        if (!username || !password) return

        var result = login(username.value, password.value)
        if (msgEl) msgEl.textContent = result.message

        if (result.success) {
          username.value = ''
          password.value = ''
          show('dashboard-page')
          hide('auth-page')
          if (msgEl) msgEl.textContent = ''
        }
      })
    }

    if (registerForm) {
      registerForm.addEventListener('submit', function (e) {
        e.preventDefault()
        var username = $('register-username')
        var password = $('register-password')
        var confirm = $('register-confirm')
        var msgEl = $('register-message')

        if (!username || !password) return

        if (confirm && confirm.value !== password.value) {
          if (msgEl) msgEl.textContent = 'Passwords do not match.'
          return
        }

        var result = register(username.value, password.value)
        if (msgEl) msgEl.textContent = result.message

        if (result.success) {
          username.value = ''
          password.value = ''
          if (confirm) confirm.value = ''
          show('dashboard-page')
          hide('auth-page')
          if (msgEl) msgEl.textContent = ''
        }
      })
    }

    if (showRegisterLink) {
      showRegisterLink.addEventListener('click', function (e) {
        e.preventDefault()
        hide('login-form-container')
        show('register-form-container')
      })
    }

    if (showLoginLink) {
      showLoginLink.addEventListener('click', function (e) {
        e.preventDefault()
        hide('register-form-container')
        show('login-form-container')
      })
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', function (e) {
        e.preventDefault()
        logout()
        show('auth-page')
        hide('dashboard-page')
      })
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
