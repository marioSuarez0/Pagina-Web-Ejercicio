const express = require('express')
var path = require('path')
const bodyParser = require('body-parser')
var CryptoJS = require('crypto-js');

const sequelize = require('./database/database')
const User = require('./models/User')
const { name } = require('ejs')

const app = express()
const port = 3000

var publica = path.join(__dirname, 'public')

app.use(express.json())
app.use(express.static(publica))
app.use(bodyParser.urlencoded({ extended: true }))

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs');

const session = require('express-session')
var escapeHtml = require('escape-html')

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}))

const routerExercise = require('./routers/exercises')      //http://localhost:3000/exercises
app.use('/exercises', routerExercise)

function isAuthenticated(req, res, next) {
    if (req.session.nombre_usuario) {
        next();
    } else {
        res.render('login', {mensaje: ''});
    }
}

function sesionIniciadaLogin(req, res, next) {
    if (req.session.nombre_usuario) {
        res.redirect('/exercises');
    } else {
        res.render('login', {mensaje: ''});
    }
}

function sesionIniciadaRegister(req, res, next) {
    if (req.session.nombre_usuario) {
        res.redirect('/exercises');
    } else {
        res.render('register', {mensaje_register: ''});
    }
}

async function connectDB() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.')
    } catch (error) {
        console.error('Unable to connect to the database:', error)
    }
}

async function syncDB() {
    console.log('Sincronizando modelos...')
    await sequelize.sync({ force: false })
    console.log('All models were synchronized successfully.')
}

// Ruta raíz
app.get('/', sesionIniciadaLogin, async (req, res) => {
    res.render('login', {mensaje : ''})
})

// Ruta para renderizar a register en caso de pulsar el botón Si no tiene cuenta registrese AQUÍ 
app.get('/register', sesionIniciadaRegister, async (req, res) => {
    res.render('register', { mensaje_register : ''})
})

// Ruta para renderizar a register en caso de pulsar el botón Si ya tiene una cuenta, inicie sesión AQUÍ
app.get('/login', sesionIniciadaLogin, async (req, res) => {
    res.render('login', {mensaje : ''})
})

// Crea los usuarios y te redirecciona a iniciar sesión
app.post('/register', express.urlencoded({ extended: false }), async (req, res) => {
    const { nombre_usuario, contrasenia, edad, peso, altura } = req.body
    const contrasenia_hash = CryptoJS.SHA256(contrasenia).toString(CryptoJS.enc.Hex);

    const usuarioEnBD = await User.findOne({ where: {username : nombre_usuario}})

    if (!usuarioEnBD) {
        await User.create({ username: nombre_usuario, password: contrasenia_hash, age: edad, weight: peso, height: altura })
        res.render('login', {mensaje : '¡Registro realizado con éxito!'})
    } else {
        res.render ('register', { mensaje_register : 'Nombre de usuario existente'})
    }
    
})

// Inicia sesión en caso de que usuario y contraseña coincidan con alguno que hay en la base de datos
app.post('/login', express.urlencoded({ extended: false }), function (req, res) {
    // login logic to validate req.body.user and req.body.pass
    // would be implemented here. for this example any combo works

    // regenerate the session, which is good practice to help
    // guard against forms of session fixation
    req.session.regenerate(async function (err) {
        if (err) next(err)
        
        const contrasenia_hash = CryptoJS.SHA256(req.body.contrasenia).toString(CryptoJS.enc.Hex);
        const usuario = await User.findOne({ where: { username: req.body.nombre_usuario, password: contrasenia_hash } });
        
        if (usuario) {
            // store user information in session, typically a user id
            req.session.nombre_usuario = req.body.nombre_usuario
            // save the session before redirection to ensure page
            // load does not happen before session is saved
            req.session.save(async function (err) {
                if (err) return next(err)
                res.redirect('/exercises')
            })
        } else{  
            res.render('login', {mensaje : 'Usuario o contraseña incorrectos'})
        }
    })
})

app.get('/logout', function (req, res, next) {
    // logout logic
  
    // clear the user from the session object and save.
    // this will ensure that re-using the old session id
    // does not have a logged in user
    req.session.nombre_usuario = null;
    req.session.save(async function (err) {
      if (err) next(err)
  
      // regenerate the session, which is good practice to help
      // guard against forms of session fixation
      req.session.regenerate(async function (err) {
        if (err) next(err)
        res.redirect('/')
      })
    })
  })

// Get para acceder al perfil del usuario
app.get('/profile', isAuthenticated, async (req, res) => {

    const nombreUsuario = req.session.nombre_usuario;
    const perfil = await User.findOne({ where: { username: nombreUsuario } });

    res.render('profile', { perfil: perfil });
})

// Get para actualizar el perfil del usuario desde updateProfile
app.post('/updateProfile', express.urlencoded({ extended: false }), async (req, res) => {

    const nombreUsuario = req.session.nombre_usuario;
    const perfil = await User.findOne({ where: { username: nombreUsuario } });
    perfil.age = req.body.edad
    perfil.weight = req.body.peso
    perfil.height = req.body.altura
    await perfil.save();

    res.render('updateProfile', { perfil: perfil });
})

// Get para acceder al perfil del usuario en la vista updateProfile
app.get('/updateProfile', isAuthenticated, async (req, res) => {

    const nombreUsuario = req.session.nombre_usuario;
    const perfil = await User.findOne({ where: { username: nombreUsuario } });

    res.render('updateProfile', { perfil: perfil });
})

app.use((req, res, next) => {
    res.status(404).render('404', {mensaje_exercises: '', mensaje_login: 'Volver atrás'})
}
)

app.listen(port, () => {
    connectDB()
    syncDB()
    console.log(`Server listening on port ${port}`)
})