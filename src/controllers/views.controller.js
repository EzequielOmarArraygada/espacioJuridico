import config from '../config/config.js';

export class ViewsController {
  constructor() {
  }

  renderInicio = (req, res) => {
    res.redirect('/login');
  };

  renderChat = (req, res) => {
    res.render('chat', { title: 'Chat' });
  };

  renderLogin = (req, res) => {
    res.render('login', { title: 'Login' });
  };

  renderRegister = (req, res) => {
    res.render('register', { title: 'Registro' });
  };

  renderRestore = (req, res) => {
    res.render('restore');
  };

  renderCurrent = (req, res) => {
    if (req.cookies[config.tokenCookieName]) {
      res.render('current', { title: 'Perfil de usuario', lawer: req.lawer });
    } else {
      res.status(401).json({
        error: 'Token de autenticación inválido.',
      });
    }
  };

  renderProducts = (req, res) => {
    if (!req.cookies[config.tokenCookieName]) {
      return res.redirect('/login');
    }
    const params = req.query;
    const lawer = req.lawer;
    const urlParams = new URLSearchParams(params);
    const url = `http://ymir.up.railway.app/api/products?${urlParams.toString()}`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          res.render('products', {
            data,
            title: 'Listado de productos',
            lawer,
          });
        } else {
          req.logger.error(
            `Error al obtener los productos: ${data.error || 'Datos no disponibles'}. ${req.method} en ${req.url} - ${new Date().toLocaleDateString()}`
          );
          res.status(500).send('Hubo un problema al obtener la lista de productos.');
        }
      })
      .catch((error) => {
        req.logger.error(
          `Error al realizar la solicitud de productos: ${error.message}. ${req.method} en ${req.url} - ${new Date().toLocaleDateString()}`
        );
        res.status(500).send(`Error en la solicitud de productos. ${error.message}`);
      });
  };

  renderCases = (req, res) => {
    if (!req.cookies[config.tokenCookieName]) {
      return res.redirect('/login');
    }
    const cid = req.params.cid;
    fetch(`http://ymir.up.railway.app/api/cases/${cid}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          const products = data.payload.products;
          res.render('cases', { products, title: 'Carrito' });
        } else {
          req.logger.error(
            `Error al acceder al carrito: ${data.error || 'Datos no disponibles'}. ${req.method} en ${req.url} - ${new Date().toLocaleDateString()}`
          );
          res.status(500).send('Hubo un problema al acceder al carrito.');
        }
      })
      .catch((error) => {
        req.logger.error(
          `Error al realizar la solicitud del carrito: ${error.message}. ${req.method} en ${req.url} - ${new Date().toLocaleDateString()}`
        );
        res.status(500).send(`Error en la solicitud del carrito. ${error.message}`);
      });
  };

  renderAdmin = (req, res) => {
    res.render('adminDashboard', { title: 'Admin Dashboard' });
  };
}
