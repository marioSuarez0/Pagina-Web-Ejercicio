const express = require('express');
const Exercise = require('../models/Exercise');
const User = require('../models/User');

const router = express.Router()
const { Op } = require('sequelize');

function isAuthenticated_volver_login(req, res, next) {
    if (req.session.nombre_usuario) {
        next();
    } else {
        res.status(403).render('403', {mensaje_exercises: '', mensaje_login: 'Volver atrás'});
    }
}

function isAuthenticated_volver_exercises(req, res, next) {
    if (req.session.nombre_usuario) {
        next();
    } else {
        res.status(403).render('403', {mensaje_exercises: 'Volver atrás', mensaje_login: ''});
    }
}

// Calcular las calorías
function calories(nombre, tiempo, user) {
    const caloriesSport = {
    'Running': 11.4,
    'Caminata': 5.0,
    'Natación': 10.0,
    'Ciclismo': 8.0,
    };
    // Factor de ajuste basado en la ecuación de Harris-Benedict
    const factorAjuste = (10 * user.weight) + (6.25 * user.height) - (5 * user.age) - 161;
    const calories = (caloriesSport[nombre] * tiempo) * factorAjuste / 1440;
    return Math.round(calories * 100) / 100
}

// Calcular el tiempo
function tiempoCalorias(calories, nombre, user) {
    const caloriesSport = {
        'Running': 11.4,
        'Caminata': 5.0,
        'Natación': 10.0,
        'Ciclismo': 8.0,
    };
    // Factor de ajuste basado en la ecuación de Harris-Benedict
    const factorAjuste = (10 * user.weight) + (6.25 * user.height) - (5 * user.age) - 161;
    const tiempo = (calories * 1440) / (caloriesSport[nombre] * factorAjuste);
    return Math.round(tiempo);
}

// Función fecha hoy
function obtenerFecha() {
    var fecha = new Date()
    var dia = fecha.getDate()
    var mes = fecha.getMonth() + 1 
    var año = fecha.getFullYear()
    
    if (dia < 10) {
        dia = '0' + dia;
    }
    if (mes < 10) {
        mes = '0' + mes;
    }

    var fechaFormat = año + '-' + mes + '-' + dia;
    
    return fechaFormat
}

// Función formato fecha
function formatoFecha(fechaSinFormato) {
    const [año, mes, dia] = fechaSinFormato.split('-');
    return `${dia}/${mes}/${año}`;
}

// Get para renderizar a la ruta raiz de exercises y muestre los ejercicios en una lista
router.get('/', isAuthenticated_volver_login, async (req, res) => {
    
    const ejercicios = await Exercise.findAll();
    const nombreUsuario = req.session.nombre_usuario;
    const perfil = await User.findOne({ where: { username: nombreUsuario } });

    ejercicios.forEach(ejercicio => {
        ejercicio.date = formatoFecha(ejercicio.date);
    });

    res.render('exercises', { ejercicios, perfil: perfil });
});

// Get para mostrar el ranking
router.get('/ranking', isAuthenticated_volver_login, async (req, res) => {

    const ejercicios = await Exercise.findAll({ order: [['calories', 'DESC']]} )
    const nombreUsuario = req.session.nombre_usuario;
    const perfil = await User.findOne({ where: { username: nombreUsuario } });

    ejercicios.forEach(ejercicio => {
        ejercicio.date = formatoFecha(ejercicio.date);
    });

    res.render('ranking', { ejercicios, perfil: perfil });
});

// Get para sacar los ejercicios del usuario
router.get('/user', isAuthenticated_volver_login, async (req, res) => {
    
    const nombreUsuario = req.session.nombre_usuario;
    const mis_ejercicios = await Exercise.findAll({ where: { user : nombreUsuario}});

    mis_ejercicios.forEach(ejercicio => {
        ejercicio.date = formatoFecha(ejercicio.date);
    });
    
    const mas_calorias_siempre = await Exercise.findOne({ where: { user: nombreUsuario }, order: [['calories', 'DESC']]});
    console.log('Mas calorias siempre', mas_calorias_siempre);
    
    if (mas_calorias_siempre) {
        mas_calorias_siempre.date = formatoFecha(mas_calorias_siempre.date);
    }

    const semana = new Date();
    semana.setDate(semana.getDate() - 7);
    const mas_calorias_semana = await Exercise.findOne({
        where: {
            user : nombreUsuario,
            date: {
            [Op.gte]: semana
          }
        },
        order: [['calories', 'DESC']]
      });

      if (mas_calorias_semana) {
        mas_calorias_semana.date = formatoFecha(mas_calorias_semana.date);
    }

    res.render('user', { mis_ejercicios, mas_calorias_siempre, mas_calorias_semana, nombreUsuario });
});

// Get para acceder a la ruta new
router.get('/new', isAuthenticated_volver_login, async (req, res) => {
    const fechaMax = obtenerFecha();

    const ejercicios = await Exercise.findAll();
    const nombreUsuario = req.session.nombre_usuario;
    const perfil = await User.findOne({ where: { username: nombreUsuario } });

    res.render('new', { ejercicios, perfil: perfil, fechaMax });
});

// Post para almacenar los datos de los ejercicios y redireccionar a la ruta raíz del router
router.post('/new', express.urlencoded({ extended: false }), async(req, res) => {

    const { nombre, fecha, tiempo } = req.body
    const nombreCreador = req.session.nombre_usuario;
    const perfil = await User.findOne({ where: { username: nombreCreador } });
    const calorias = calories(nombre, tiempo, perfil);
    
    
    await Exercise.create({ name: nombre, date: fecha, calories: calorias, user: nombreCreador })

    res.redirect('/exercises')
});

// Get para acceder a los ejercicios según el id
router.get('/:id',isAuthenticated_volver_login, isAuthenticated_volver_exercises, async (req, res) => {
    
    const nombreUsuario = req.session.nombre_usuario;
    const perfil = await User.findOne({ where: { username: nombreUsuario } });
    const id = req.params.id
    const ejercicio = await Exercise.findOne({ where: { id: id } });
    
    if (!ejercicio) {
        return res.status(404).render('404', {mensaje_exercises: 'Volver atrás', mensaje_login: '' })
    }

    ejercicio.date = formatoFecha(ejercicio.date);

    if(ejercicio.user === nombreUsuario) {
        res.render('id', { ejercicio: ejercicio, perfil: perfil, actualizar: 'Actualizar', eliminar: 'Eliminar' })
    }else{
        res.render('id', { ejercicio: ejercicio, perfil: perfil, actualizar: '', eliminar: '' })
    }
   
});

// Get para acceder a la modificación de los ejercicios
router.get('/update/:id', isAuthenticated_volver_login, isAuthenticated_volver_exercises, async(req,res) => {
    
    const fechaMax = obtenerFecha();

    const nombreUsuario = req.session.nombre_usuario;
    const perfil = await User.findOne({ where: { username: nombreUsuario } });

    const id = req.params.id;
    const ejercicio = await Exercise.findOne({ where: { id: id } });

    if (!ejercicio) {
        return res.status(404).render('404', {mensaje_exercises: 'Volver atrás', mensaje_login: '' })
    }

    if(ejercicio.user === nombreUsuario) {
        const calorias = ejercicio.calories;
        const tiempoEjercicio = tiempoCalorias(calorias, ejercicio.name, perfil);
        res.render('update', { ejercicio, perfil: perfil, fechaMax, tiempoEjercicio } );
    }else{
        return res.status(403).render('403', {mensaje_exercises: 'Volver atrás', mensaje_login: ''});
    }
   
})

// Post para actualizar el ejercicio
router.post('/user', express.urlencoded({ extended: false }), async (req, res) => {

    const nombreUsuario = req.session.nombre_usuario;
    const perfil = await User.findOne({ where: { username: nombreUsuario } });

    const id = req.body.id_ejercicio
    const ejercicio = await Exercise.findOne({ where: { id: id}})

    ejercicio.name = req.body.nombre
    ejercicio.date = req.body.fecha
 

    const calorias = calories(req.body.nombre, req.body.tiempo, perfil);
    ejercicio.calories = calorias;
    
    await ejercicio.save();

    const ejercicios = await Exercise.findAll();

    res.render('exercises', {perfil: perfil, ejercicios})
})

// Get para acceder a la eliminación de los ejercicios
router.get('/delete/:id', isAuthenticated_volver_login, isAuthenticated_volver_exercises, async(req,res) => {
    

    const nombreUsuario = req.session.nombre_usuario;
    const perfil = await User.findOne({ where: { username: nombreUsuario } })

    const id = req.params.id;
    const ejercicio = await Exercise.findOne({ where: { id: id } });

    if (!ejercicio) {
        return res.status(404).render('404', {mensaje_exercises: 'Volver atrás', mensaje_login: '' })
    }

    if(ejercicio.user === nombreUsuario) {
        res.render('delete', { ejercicio, perfil: perfil });
        }else{
            return res.status(403).render('403', {mensaje_exercises: 'Volver atrás', mensaje_login: ''});
        }
    
    
})

// Post para eliminar el ejercicio
router.post('/delete', express.urlencoded({ extended: false }), async (req, res) => {
    
    const id = req.body.id_ejercicio
    await Exercise.destroy({ where: { id: id } });

    res.redirect('/exercises')
})

module.exports = router;