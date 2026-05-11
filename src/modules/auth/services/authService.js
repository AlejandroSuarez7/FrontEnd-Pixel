const USERS_KEY = 'pixel_users';
const SESSION_KEY = 'pixel_session';

export const authService = {

  register(userData) {
    const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];

    const userExists = users.find(
      user => user.email === userData.email
    );

    if (userExists) {
      throw new Error('El usuario ya existe');
    }

    const newUser = {
      ...userData,
      role: 'admin',
    };

    users.push(newUser);

    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    return newUser;
  },

  login(email, password) {

    const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];

    const user = users.find(
      user =>
        user.email === email &&
        user.password === password
    );

    if (!user) {
      throw new Error('Credenciales incorrectas');
    }

    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify(user)
    );

    return user;
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
  },

  getSession() {
    return JSON.parse(
      localStorage.getItem(SESSION_KEY)
    );
  },
};