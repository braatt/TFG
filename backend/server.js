const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Search = require('./models/Search'); 

require('dotenv').config(); 

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

app.use(express.json());
app.use(cors());

mongoose.connect('mongodb+srv://mongo:mongo@cluset.iqlmz.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Conectado a MongoDB'))
  .catch((err) => console.log(err));

app.post('/api/signup', async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ message: 'Por favor ingresa todos los campos' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword, firstName, lastName });
    await newUser.save();

    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Hubo un error al registrar el usuario' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, firstName: user.firstName },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ message: 'Inicio de sesión exitoso', token });
  } catch (error) {
    res.status(500).json({ message: 'Hubo un error al intentar iniciar sesión' });
  }
});

app.get('/api/protected', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]; 

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET); 
    res.status(200).json({ message: 'Ruta protegida accedida', user: decoded });
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor en ejecución en http://localhost:${PORT}`);
});


const { sendMail } = require('./utils/emailService.js'); 

const cron = require('node-cron');
const activeTasks = new Map(); 

app.post('/api/search', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { locationInputIATA, destinationInputIATA, departDate, returnDate, price } = req.body;

    if (!locationInputIATA || !destinationInputIATA || !departDate || !price) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const search = new Search({
      userId: decoded.id,
      from: locationInputIATA,
      to: destinationInputIATA,
      depart: departDate,
      return: returnDate,
      price,
      notified: false,
    });

    await search.save();

    const emailHtmlInitial = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #007BFF;">Hemos registrado tu búsqueda de vuelos</h2>
        <p>Hola ${decoded.firstName || 'Usuario'},</p>
        <p>Gracias por usar nuestro servicio. Estos son los parámetros de búsqueda que hemos registrado:</p>
        <table style="border-collapse: collapse; width: 100%; max-width: 600px; margin: 20px 0;">
          <tr>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f4f4f4;">Origen</th>
            <td style="border: 1px solid #ddd; padding: 8px;">${locationInputIATA}</td>
          </tr>
          <tr>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f4f4f4;">Destino</th>
            <td style="border: 1px solid #ddd; padding: 8px;">${destinationInputIATA}</td>
          </tr>
          <tr>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f4f4f4;">Fecha de salida</th>
            <td style="border: 1px solid #ddd; padding: 8px;">${departDate}</td>
          </tr>
          <tr>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f4f4f4;">Fecha de llegada</th>
            <td style="border: 1px solid #ddd; padding: 8px;">${returnDate || 'No especificada'}</td>
          </tr>
          <tr>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f4f4f4;">Precio máximo</th>
            <td style="border: 1px solid #ddd; padding: 8px;">€${price}</td>
          </tr>
        </table>
        <p style="margin: 20px 0;">
          Comenzaremos a buscar vuelos periódicamente con estos parámetros. 
          <br>Te notificaremos cuando encontremos coincidencias.
        </p>
        <footer style="margin-top: 20px; font-size: 12px; color: #888;">
          <p>Gracias por usar nuestro servicio,</p>
          <p>El equipo de FlightNotS</p>
        </footer>
      </div>
    `;

    await sendMail(decoded.email, 'Confirmación de búsqueda de vuelos', emailHtmlInitial);

    if (!activeTasks.has(search._id.toString())) {
      const task = cron.schedule('*/2 * * * *', async () => {
        console.log(`Buscando vuelos para la búsqueda ID: ${search._id}`);
      
        const url = `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${locationInputIATA}&destinationLocationCode=${destinationInputIATA}&departureDate=${departDate}${returnDate ? `&returnDate=${returnDate}` : ''}&adults=1&maxPrice=${price}&max=5`;
      
        const token = await getToken();
        console.log('Token obtenido:', token);
      
        try {
          const response = await fetch(url, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
      
          const data = await response.json();
          console.log('Respuesta de la API:', data);
      
          if (data?.data?.length > 0) {
            console.log('¡Vuelos encontrados! Enviando correo...');
            const emailHtml = `
              <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #007BFF;">¡Hemos encontrado vuelos que coinciden con tus parámetros!</h2>
                <p>Hola ${decoded.firstName || 'Usuario'},</p>
                <p>
                  Aquí tienes los detalles de los vuelos encontrados:
                </p>
                <table style="border-collapse: collapse; width: 100%; max-width: 600px; margin: 20px 0;">
                  <tr>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f4f4f4;">Origen</th>
                    <td style="border: 1px solid #ddd; padding: 8px;">${locationInputIATA}</td>
                  </tr>
                  <tr>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f4f4f4;">Destino</th>
                    <td style="border: 1px solid #ddd; padding: 8px;">${destinationInputIATA}</td>
                  </tr>
                  <tr>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f4f4f4;">Fecha de salida</th>
                    <td style="border: 1px solid #ddd; padding: 8px;">${departDate}</td>
                  </tr>
                  <tr>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f4f4f4;">Fecha de llegada</th>
                    <td style="border: 1px solid #ddd; padding: 8px;">${returnDate || 'No especificada'}</td>
                  </tr>
                  <tr>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f4f4f4;">Precio máximo</th>
                    <td style="border: 1px solid #ddd; padding: 8px;">€${price}</td>
                  </tr>
                </table>
                <p style="margin: 20px 0;">
                  Por favor, <a href="http://localhost:3000" style="color: #007BFF; text-decoration: none;">revisa nuestra plataforma</a> para más detalles y reserva tu vuelo ahora.
                </p>
                <footer style="margin-top: 20px; font-size: 12px; color: #888;">
                  <p>Gracias por usar nuestro servicio,</p>
                  <p>El equipo de FlightNotS</p>
                </footer>
              </div>
            `;
      
            await sendMail(decoded.email, '¡Vuelos Encontrados!', emailHtml);
      
            search.notified = true;
            await search.save();
            task.stop();
            activeTasks.delete(search._id.toString());
          } else {
            console.log('No se encontraron vuelos en esta búsqueda.');
          }
        } catch (error) {
          console.error('Error en la llamada a la API de Amadeus:', error);
        }
      });
      
      activeTasks.set(search._id.toString(), task);
    }

    res.status(201).json({ message: 'Your search has been saved! We will notify you by email as soon as we find flights matching your search criteria!' });
  } catch (error) {
    console.error('Error al procesar la búsqueda:', error);
    res.status(500).json({ message: 'Hubo un error al procesar la búsqueda', error: error.message });
  }
});




app.post('/api/results', async (req, res) => {
  console.log('Datos recibidos:', req.body);
  const { from, to, depart, returnDate, price } = req.body;

  const results = await searchFlights(from, to, depart, returnDate, price);

  res.json({ results });
});


const getToken = async () => {
  const clientId = 'UGw0qZgoWA5ykR6QjAgFcpowAbnlEeIt';
  const clientSecret = 'VlZGyMZQreGU4xH9';

  const url = 'https://test.api.amadeus.com/v1/security/oauth2/token';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return data.access_token;
    } else {
      console.error('Error al obtener el token:', data);
      return null;
    }
  } catch (error) {
    console.error('Error al conectar con la API:', error);
    return null;
  }
};